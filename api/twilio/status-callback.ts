import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_utils/supabase';
import { setCorsHeaders } from '../_utils/response';

/**
 * Twilio Status Callback Handler
 *
 * Receives delivery status updates from Twilio for sent SMS messages.
 * Updates the message delivery status in the database.
 *
 * Status progression:
 * queued → sending → sent → delivered (success)
 *                         → failed (failure)
 *                         → undelivered (failure)
 *
 * This endpoint should be configured in Twilio Console:
 * - When sending SMS, include statusCallback URL parameter
 * - Twilio will POST to this URL with status updates
 *
 * Or configure globally:
 * - Go to Phone Numbers → Active Numbers → [Your Number]
 * - Set "STATUS CALLBACK URL" to: https://yourdomain.com/api/twilio/status-callback
 * - Method: POST
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    return res.status(204).end();
  }

  // Allow GET for testing webhook accessibility
  if (req.method === 'GET') {
    return res.status(200).json({
      message: 'Status callback webhook is accessible',
      endpoint: '/api/twilio/status-callback',
      method: 'POST',
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Log that we received a POST request (for debugging)
  console.log('[Status Callback] ====== POST REQUEST RECEIVED ======');
  console.log('[Status Callback] Headers:', JSON.stringify(req.headers, null, 2));
  console.log('[Status Callback] Body:', req.body);

  try {
    // Twilio sends data as application/x-www-form-urlencoded
    const { MessageSid, MessageStatus, ErrorCode, ErrorMessage } = req.body;

    if (!MessageSid || !MessageStatus) {
      console.error('[Status Callback] Missing required fields:', req.body);
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log(
      `[Status Callback] Message ${MessageSid} status: ${MessageStatus}${ErrorCode ? ` (Error ${ErrorCode}: ${ErrorMessage})` : ''}`
    );
    console.log(`[Status Callback] Full request body:`, JSON.stringify(req.body, null, 2));

    // Find the message by Twilio SID
    const { data: messages, error: searchError } = await supabase
      .from('messages')
      .select('id, customer_id, delivery_status')
      .eq('twilio_message_sid', MessageSid)
      .limit(1);

    if (searchError) {
      console.error('[Status Callback] Error searching messages:', searchError);
      throw searchError;
    }

    if (!messages || messages.length === 0) {
      console.log(`[Status Callback] No message found for SID: ${MessageSid}`);
      console.log(`[Status Callback] Searching all recent messages to debug...`);

      // Debug: Check recent messages to see if SID format is wrong
      const { data: recentMessages } = await supabase
        .from('messages')
        .select('id, twilio_message_sid, sent_at')
        .order('sent_at', { ascending: false })
        .limit(5);

      console.log(`[Status Callback] Recent messages:`, recentMessages);

      // Return 200 anyway - message might not be in our system yet (race condition)
      return res.status(200).json({ message: 'Message not found', debug: { recentMessages } });
    }

    const message = messages[0];

    // Update message delivery status
    const updateData: any = {
      delivery_status: MessageStatus.toLowerCase(),
      updated_at: new Date().toISOString(),
    };

    // Store error details if present
    if (ErrorCode) {
      updateData.delivery_error_code = ErrorCode;
      updateData.delivery_error_message = ErrorMessage || null;
    }

    const { error: updateError } = await supabase
      .from('messages')
      .update(updateData)
      .eq('id', message.id);

    if (updateError) {
      console.error('[Status Callback] Error updating message:', updateError);
      throw updateError;
    }

    // If message failed or undelivered, also update customer status
    if (MessageStatus === 'failed' || MessageStatus === 'undelivered') {
      await supabase
        .from('customers')
        .update({
          sms_status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', message.customer_id);
    }

    console.log(`[Status Callback] Updated message ${message.id} to status: ${MessageStatus}`);

    // Return 200 to acknowledge receipt
    return res.status(200).json({ message: 'Status updated' });
  } catch (error: any) {
    console.error('[Status Callback] Error processing callback:', error);
    // Return 200 to prevent Twilio from retrying
    // (we don't want duplicate status updates)
    return res.status(200).json({ error: 'Internal error' });
  }
}
