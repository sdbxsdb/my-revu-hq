import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
  throw new Error('Missing Twilio environment variables');
}

export const twilioClient = twilio(accountSid, authToken);

export const sendSMS = async (
  to: string,
  body: string
): Promise<{ sid: string; status: string }> => {
  try {
    // Use alphanumeric sender ID if available, otherwise fall back to phone number
    const from = process.env.TWILIO_ALPHANUMERIC_SENDER_ID || process.env.TWILIO_PHONE_NUMBER || 'RateMyWork';
    
    const message = await twilioClient.messages.create({
      body,
      to,
      from,
    });

    return {
      sid: message.sid,
      status: message.status,
    };
  } catch (error: any) {
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
};

