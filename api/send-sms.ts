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

/**
 * Get SMS monthly limit based on subscription tier
 */
function getSmsLimitFromTier(tier: string | null | undefined): number {
  switch (tier) {
    case 'free':
      return 60; // Same as Business for testing
    case 'starter':
      return 15;
    case 'pro':
      return 30;
    case 'business':
      return 60;
    case 'enterprise':
      return 999999; // Effectively unlimited
    default:
      return 0; // No tier = no access
  }
}

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
    // Check if request is from Edge Function (scheduled SMS)
    const xUserId = req.headers['x-user-id'] as string | undefined;
    let userId: string;

    if (xUserId) {
      // Request from Edge Function - verify it's a service request
      // In production, you should verify the Authorization header contains your service key
      // For now, we'll trust requests with x-user-id header
      userId = xUserId;
    } else {
      // Normal user request
      const auth = await authenticate(req as any);
      userId = auth.userId;
    }

    const { customerId } = sendSMSSchema.parse(req.body);

    // Get user to check limit and account status
    const { data, error: userError } = await supabase
      .from('users')
      .select(
        'sms_sent_this_month, business_name, review_links, sms_template, account_lifecycle_status, payment_status, subscription_tier, include_name_in_sms, include_job_in_sms'
      )
      .eq('id', userId)
      .single();

    const user = data as {
      sms_sent_this_month: number | null;
      business_name: string | null;
      review_links: any;
      sms_template: string | null;
      account_lifecycle_status: string | null;
      payment_status: string | null;
      subscription_tier: string | null;
      include_name_in_sms: boolean | null;
      include_job_in_sms: boolean | null;
    } | null;

    const user = data as {
      sms_sent_this_month: number | null;
      business_name: string | null;
      review_links: any;
      sms_template: string | null;
      account_lifecycle_status: string | null;
      payment_status: string | null;
      subscription_tier: string | null;
      include_name_in_sms: boolean | null;
      include_job_in_sms: boolean | null;
    } | null;

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

    // Check monthly limit based on tier
    const smsLimit = getSmsLimitFromTier(user.subscription_tier);
    const sentThisMonth = user.sms_sent_this_month || 0;

    if (smsLimit === 0) {
      return res.status(403).json({
        error: 'No active subscription. Please set up a subscription to send SMS messages.',
      });
    }

    if (sentThisMonth >= smsLimit) {
      return res.status(429).json({
        error: `Monthly SMS limit of ${smsLimit} reached. You've sent ${sentThisMonth} of ${smsLimit} messages this month.`,
      });
    }

    // Get customer
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .eq('user_id', userId)
      .single();

    const customer = customerData as {
      id: string;
      user_id: string;
      name: string;
      phone: { countryCode: string; country?: string; number: string };
      job_description: string | null;
      sms_status: string;
      sent_at: string | null;
      sms_request_count: number | null;
      opt_out: boolean | null;
      scheduled_send_at: string | null;
    } | null;

    if (customerError) throw customerError;
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Check if customer has opted out
    if (customer.opt_out) {
      return res.status(403).json({
        error:
          'This customer has opted out of receiving SMS messages. Please contact them directly if you need to reach them.',
      });
    }

    // Check if customer has reached the 3-message limit
    const requestCount = customer.sms_request_count || 0;
    if (requestCount >= 3) {
      return res.status(403).json({
        error:
          'Maximum of 3 review request messages allowed per customer. This limit has been reached for this customer.',
      });
    }

    // Build SMS message
    let messageBody = '';

    // Add customer name if enabled (default to true if not set)
    if (user.include_name_in_sms !== false && customer.name) {
      messageBody += `Hi ${customer.name},\n\n`;
    }

    // Add main template
    messageBody +=
      user.sms_template ||
      `You recently had ${user.business_name || 'us'} for work. We'd greatly appreciate a review on one or all of the following links:`;

    // Replace placeholders
    messageBody = messageBody.replace(/{businessName}/g, user.business_name || 'us');

    // Add job description if enabled (default to true if not set) and available (not empty or whitespace)
    if (
      user.include_job_in_sms !== false &&
      customer.job_description &&
      customer.job_description.trim()
    ) {
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

    // Add regulatory compliance text for US/CA messages (required by Twilio A2P 10DLC)
    if (isoCountryCode === 'US' || isoCountryCode === 'CA') {
      messageBody += '\n\nMsg&data rates may apply. Reply STOP to opt out, HELP for help.';
    }

    // Pass ISO country code to determine appropriate sender ID
    // Include status callback URL for delivery tracking
    // Construct callback URL - use production domain or Vercel auto-detected URL
    let statusCallbackUrl: string | undefined;
    try {
      // In production, use FRONTEND_URL (your custom domain)
      // In Vercel preview/deploy, VERCEL_URL is auto-set (e.g., "my-revu-hq.vercel.app")
      const apiUrl = process.env.FRONTEND_URL
        ? process.env.FRONTEND_URL.replace(/\/$/, '') // Remove trailing slash
        : process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : 'https://myrevuhq.com';

      statusCallbackUrl = `${apiUrl}/api/twilio/status-callback`;
      console.log('[Send SMS] Status callback URL:', statusCallbackUrl);
    } catch (error) {
      console.warn(
        '[Send SMS] Could not construct status callback URL, continuing without it:',
        error
      );
      // Continue without status callback - SMS will still send but no delivery tracking
    }

    const result = await sendSMS(phoneNumber, messageBody, isoCountryCode, statusCallbackUrl);

    // Update customer status and increment request count
    const newRequestCount = requestCount + 1;
    const sentAt = new Date().toISOString();
    // Check if this was a scheduled send
    const wasScheduled = !!customer.scheduled_send_at;

    await supabase
      .from('customers')
      // @ts-ignore - Supabase types don't include all fields
      .update({
        sms_status: 'sent',
        sent_at: sentAt,
        sms_request_count: newRequestCount,
        scheduled_send_at: null, // Clear schedule after sending
      })
      .eq('id', customerId);

    // Log message with Twilio SID for delivery tracking
    await supabase
      .from('messages')
      // @ts-ignore - Supabase types don't include all fields
      .insert({
        customer_id: customerId,
        user_id: userId,
        body: messageBody,
        sent_at: sentAt,
        was_scheduled: wasScheduled, // Track if this message was scheduled
        twilio_message_sid: result.sid, // Store Twilio SID for status callbacks
        delivery_status: 'queued', // Initial status
      });

    // Update user's monthly count and total count
    const { data: currentUserData } = await supabase
      .from('users')
      .select('sms_sent_total')
      .eq('id', userId)
      .single();

    const currentUser = currentUserData as { sms_sent_total: number | null } | null;

    const currentTotal = currentUser?.sms_sent_total || 0;
    const newSmsSentThisMonth = sentThisMonth + 1;

    await supabase
      .from('users')
      // @ts-ignore - Supabase types don't include all fields
      .update({
        sms_sent_this_month: newSmsSentThisMonth,
        sms_sent_total: currentTotal + 1,
      })
      .eq('id', userId);

    return res.json({
      success: true,
      messageSid: result.sid,
      customer: {
        id: customerId,
        sms_status: 'sent',
        sent_at: sentAt,
        sms_request_count: newRequestCount,
      },
      usage: {
        sms_sent_this_month: newSmsSentThisMonth,
        sms_limit: smsLimit,
      },
    });
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
