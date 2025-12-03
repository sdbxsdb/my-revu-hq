import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_utils/supabase';
import { setCorsHeaders } from '../_utils/response';
import { normalizeToE164 } from '../_utils/phone';

/**
 * Twilio SMS Webhook Handler
 * 
 * Handles incoming SMS messages from Twilio, particularly:
 * - STOP, CANCEL, UNSUBSCRIBE, QUIT, END, REVOKE, STOPALL, OPTOUT → Mark customer as opted out
 * - START, UNSTOP, YES → Re-subscribe customer (remove opt-out flag)
 * - HELP, INFO → Twilio handles this automatically with the configured help message
 * 
 * This endpoint should be configured in Twilio Console:
 * - Go to Phone Numbers → Active Numbers → [Your Number]
 * - Set "A MESSAGE COMES IN" webhook to: https://yourdomain.com/api/twilio/sms-webhook
 * - Method: POST
 */
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
    // Twilio sends data as application/x-www-form-urlencoded
    const { From, Body, MessageSid } = req.body;

    if (!From || !Body) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Normalize the incoming phone number (Twilio sends in E.164 format like +14155552671)
    const phoneNumber = From.trim();
    const messageBody = Body.trim().toUpperCase();

    // Log the incoming message for debugging
    console.log(`[SMS Webhook] Received message from ${phoneNumber}: ${Body}`);

    // Define opt-out and opt-in keywords
    const OPT_OUT_KEYWORDS = [
      'STOP',
      'CANCEL',
      'UNSUBSCRIBE',
      'QUIT',
      'END',
      'REVOKE',
      'STOPALL',
      'OPTOUT',
    ];
    const OPT_IN_KEYWORDS = ['START', 'UNSTOP', 'YES'];

    // Check if message is an opt-out request
    if (OPT_OUT_KEYWORDS.includes(messageBody)) {
      // Find customer by phone number
      const { data: customers, error: searchError } = await supabase
        .from('customers')
        .select('id, user_id, name, phone, opt_out');

      if (searchError) {
        console.error('[SMS Webhook] Error searching customers:', searchError);
        throw searchError;
      }

      // Find matching customer by normalized E.164 phone number
      let matchedCustomer = null;
      if (customers) {
        for (const customer of customers) {
          if (customer.phone && typeof customer.phone === 'object') {
            const customerPhone = customer.phone as { countryCode: string; number: string };
            const customerE164 = normalizeToE164(customerPhone.number, customerPhone.countryCode);

            if (customerE164 === phoneNumber) {
              matchedCustomer = customer;
              break;
            }
          }
        }
      }

      if (matchedCustomer) {
        // Mark customer as opted out
        const { error: updateError } = await supabase
          .from('customers')
          .update({ opt_out: true })
          .eq('id', matchedCustomer.id);

        if (updateError) {
          console.error('[SMS Webhook] Error updating opt-out status:', updateError);
          throw updateError;
        }

        console.log(
          `[SMS Webhook] Customer ${matchedCustomer.id} (${matchedCustomer.name}) opted out`
        );
      } else {
        console.log(`[SMS Webhook] No customer found for phone number: ${phoneNumber}`);
      }

      // Twilio expects TwiML response for opt-out (will use default opt-out message)
      return res.status(200).type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>You have successfully been unsubscribed. You will not receive any more messages from this number. Reply START to resubscribe.</Message>
</Response>`);
    }

    // Check if message is an opt-in request
    if (OPT_IN_KEYWORDS.includes(messageBody)) {
      // Find customer by phone number
      const { data: customers, error: searchError } = await supabase
        .from('customers')
        .select('id, user_id, name, phone, opt_out');

      if (searchError) {
        console.error('[SMS Webhook] Error searching customers:', searchError);
        throw searchError;
      }

      // Find matching customer by normalized E.164 phone number
      let matchedCustomer = null;
      if (customers) {
        for (const customer of customers) {
          if (customer.phone && typeof customer.phone === 'object') {
            const customerPhone = customer.phone as { countryCode: string; number: string };
            const customerE164 = normalizeToE164(customerPhone.number, customerPhone.countryCode);

            if (customerE164 === phoneNumber) {
              matchedCustomer = customer;
              break;
            }
          }
        }
      }

      if (matchedCustomer) {
        // Remove opt-out flag
        const { error: updateError } = await supabase
          .from('customers')
          .update({ opt_out: false })
          .eq('id', matchedCustomer.id);

        if (updateError) {
          console.error('[SMS Webhook] Error updating opt-in status:', updateError);
          throw updateError;
        }

        console.log(
          `[SMS Webhook] Customer ${matchedCustomer.id} (${matchedCustomer.name}) opted back in`
        );
      } else {
        console.log(`[SMS Webhook] No customer found for phone number: ${phoneNumber}`);
      }

      // Twilio expects TwiML response for opt-in
      return res.status(200).type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>You have successfully been re-subscribed. You may receive messages from this number again. Reply STOP to opt out.</Message>
</Response>`);
    }

    // For HELP requests, Twilio handles automatically with configured help message
    // For all other messages, just acknowledge receipt (no response)
    console.log(`[SMS Webhook] Non-keyword message received: ${Body}`);
    return res.status(200).type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<Response></Response>`);
  } catch (error: any) {
    console.error('[SMS Webhook] Error processing webhook:', error);
    // Return 200 to prevent Twilio from retrying
    // (we don't want to create duplicate opt-outs)
    return res.status(200).type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<Response></Response>`);
  }
}

