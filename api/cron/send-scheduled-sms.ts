import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_utils/supabase';
import { sendSMS } from '../_utils/twilio';

/**
 * Cron job to send scheduled SMS messages
 * This should be called by Vercel Cron every minute
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify this is a cron request (Vercel adds a header)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const now = new Date().toISOString();

    // Find all customers with scheduled_send_at <= now and sms_status = 'pending'
    const { data: customers, error } = await supabase
      .from('customers')
      .select('*')
      .eq('sms_status', 'pending')
      .not('scheduled_send_at', 'is', null)
      .lte('scheduled_send_at', now);

    if (error) {
      throw error;
    }

    if (!customers || customers.length === 0) {
      return res.json({ message: 'No scheduled SMS to send', count: 0 });
    }

    let successCount = 0;
    let errorCount = 0;

    // Send SMS for each customer
    for (const customer of customers) {
      try {
        // Get user account to check payment status and get SMS template
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('access_status, business_name, review_links, sms_template, sms_sent_this_month')
          .eq('id', customer.user_id)
          .single();

        if (userError || !user) {
          errorCount++;
          continue;
        }

        // Check if user has paid
        if (user.access_status !== 'active') {
          // Skip if user hasn't paid - don't send SMS
          errorCount++;
          continue;
        }

        // Check monthly SMS limit
        if ((user.sms_sent_this_month || 0) >= 100) {
          // Skip if monthly limit reached
          errorCount++;
          continue;
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

        // Format phone number for Twilio (E.164 format)
        // Remove any leading zeros or formatting from the local number
        const cleanNumber = customer.phone.number.replace(/^0+/, '').replace(/\D/g, '');
        const phoneNumber = `+${customer.phone.countryCode}${cleanNumber}`;

        // Send SMS via Twilio
        await sendSMS(phoneNumber, messageBody);

        // Update customer status
        await supabase
          .from('customers')
          .update({
            sms_status: 'sent',
            sent_at: new Date().toISOString(),
          })
          .eq('id', customer.id);

        // Increment user's SMS count
        await supabase
          .from('users')
          .update({
            sms_sent_this_month: (user.sms_sent_this_month || 0) + 1,
          })
          .eq('id', customer.user_id);

        successCount++;
      } catch (error: any) {
        errorCount++;
        // Log error but continue with other customers
      }
    }

    return res.json({
      message: 'Scheduled SMS processing complete',
      successCount,
      errorCount,
      total: customers.length,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
