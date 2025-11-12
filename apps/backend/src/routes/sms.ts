import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../utils/supabase';
import { sendSMS } from '../utils/twilio';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const sendSMSSchema = z.object({
  customerId: z.string().uuid(),
});

const SMS_MONTHLY_LIMIT = 100;

router.post('/send-sms', authenticate, async (req: AuthRequest, res) => {
  try {
    const { customerId } = sendSMSSchema.parse(req.body);

    // Get user to check limit
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('sms_sent_this_month, business_name, google_review_link, facebook_review_link, other_review_link, sms_template')
      .eq('id', req.userId!)
      .single();

    if (userError) throw userError;
    if (!user) throw new Error('User not found');

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
      .eq('user_id', req.userId!)
      .single();

    if (customerError) throw customerError;
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Build SMS message
    let messageBody = user.sms_template || 
      `You recently had ${user.business_name || 'us'} for work. We'd greatly appreciate a review on one or all of the following links:`;

    // Replace placeholders
    messageBody = messageBody.replace(/{businessName}/g, user.business_name || 'us');

    // Add job description if available
    if (customer.job_description) {
      messageBody += `\n\nJob: ${customer.job_description}`;
    }

    // Add review links
    const links: string[] = [];
    if (user.google_review_link) links.push(`Google: ${user.google_review_link}`);
    if (user.facebook_review_link) links.push(`Facebook: ${user.facebook_review_link}`);
    if (user.other_review_link) links.push(`Other: ${user.other_review_link}`);

    if (links.length > 0) {
      messageBody += '\n\n' + links.join('\n');
    }

    // Send SMS - phone.number should already be in E.164 format
    const phoneNumber = customer.phone.number;
    const result = await sendSMS(phoneNumber, messageBody);

    // Update customer status
    await supabase
      .from('customers')
      .update({
        sms_status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', customerId);

    // Log message
    await supabase.from('messages').insert({
      customer_id: customerId,
      user_id: req.userId!,
      body: messageBody,
      sent_at: new Date().toISOString(),
    });

    // Update user's monthly count
    await supabase
      .from('users')
      .update({
        sms_sent_this_month: sentThisMonth + 1,
      })
      .eq('id', req.userId!);

    res.json({ success: true, messageSid: result.sid });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: error.message || 'Failed to send SMS' });
  }
});

export default router;

