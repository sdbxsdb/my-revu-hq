import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { supabase } from './_utils/supabase';
import { sendSMS } from './_utils/twilio';
import { authenticate } from './_utils/auth';
import { setCorsHeaders } from './_utils/response';
import { normalizeToE164 } from './_utils/phone';

const sendSMSSchema = z.object({
  customerId: z.string().uuid(),
});

const SMS_MONTHLY_LIMIT = 100;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = await authenticate(req as any);
    const { customerId } = sendSMSSchema.parse(req.body);

    // Get user to check limit and account status
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(
        'sms_sent_this_month, business_name, review_links, sms_template, account_lifecycle_status, payment_status'
      )
      .eq('id', auth.userId)
      .single<{
        sms_sent_this_month: number | null;
        business_name: string | null;
        review_links: any;
        sms_template: string | null;
        account_lifecycle_status: string | null;
        payment_status: string | null;
      }>();

    if (userError) throw userError;
    if (!user) throw new Error('User not found');

    // Check if account is deleted (cancelled accounts can still send if payment_status is active)
    if (user.account_lifecycle_status === 'deleted') {
      return res.status(403).json({
        error: 'This account has been deleted. Please contact support if you wish to reactivate.',
      });
    }

    // Check if payment is active
    if (user.payment_status !== 'active') {
      return res.status(403).json({
        error: 'Your subscription is not active. Please set up payment to send SMS messages.',
      });
    }

    // Check monthly limit
    const sentThisMonth = user.sms_sent_this_month || 0;
    if (sentThisMonth >= SMS_MONTHLY_LIMIT) {
      return res.status(429).json({
        error: `Monthly SMS limit of ${SMS_MONTHLY_LIMIT} reached`,
      });
    }

    // Get customer
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .eq('user_id', auth.userId)
      .single<{
        id: string;
        user_id: string;
        name: string;
        phone: { countryCode: string; country?: string; number: string };
        job_description: string | null;
        sms_status: string;
        sent_at: string | null;
      }>();

    if (customerError) throw customerError;
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Build SMS message
    let messageBody =
      user.sms_template ||
      `You recently had ${user.business_name || 'us'} for work. We'd greatly appreciate a review on one or all of the following links:`;

    // Replace placeholders
    messageBody = messageBody.replace(/{businessName}/g, user.business_name || 'us');

    // Add job description if available
    if (customer.job_description) {
      messageBody += `\n\nJob: ${customer.job_description}`;
    }

    // Add review links from array
    if (user.review_links && Array.isArray(user.review_links) && user.review_links.length > 0) {
      const links = user.review_links
        .filter((link: any) => link.name && link.url)
        .map((link: any) => `${link.name}: ${link.url}`);
      if (links.length > 0) {
        messageBody += '\n\n' + links.join('\n');
      }
    }

    // Convert phone number to E.164 format for Twilio using libphonenumber-js
    // This handles all countries properly: UK, Ireland, USA, Canada, etc.
    const countryCode = customer.phone.countryCode || customer.phone.country;

    const phoneNumber = normalizeToE164(customer.phone.number, countryCode);

    if (!phoneNumber) {
      return res.status(400).json({
        error: 'Invalid phone number format. Please check the phone number and try again.',
      });
    }

    // Get ISO country code for sender ID selection (GB, IE, US, CA, etc.)
    // Extract it from the E.164 number
    const parsed = parsePhoneNumberFromString(phoneNumber);
    const isoCountryCode = parsed?.country || countryCode;

    // Pass ISO country code to determine appropriate sender ID
    const result = await sendSMS(phoneNumber, messageBody, isoCountryCode);

    // Update customer status
    await supabase
      .from('customers')
      // @ts-ignore - Supabase types don't include all fields
      .update({
        sms_status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', customerId);

    // Log message
    await supabase
      .from('messages')
      // @ts-ignore - Supabase types don't include all fields
      .insert({
        customer_id: customerId,
        user_id: auth.userId,
        body: messageBody,
        sent_at: new Date().toISOString(),
      });

    // Update user's monthly count
    await supabase
      .from('users')
      // @ts-ignore - Supabase types don't include all fields
      .update({
        sms_sent_this_month: sentThisMonth + 1,
      })
      .eq('id', auth.userId);

    return res.json({ success: true, messageSid: result.sid });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: error.message || 'Failed to send SMS' });
  }
}
