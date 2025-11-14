import twilio from 'twilio';

// Lazy-load Twilio client to avoid requiring credentials at startup
let twilioClient: ReturnType<typeof twilio> | null = null;

function getTwilioClient() {
  if (twilioClient) {
    return twilioClient;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error(
      'Twilio is not configured. Please add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to your .env file.'
    );
  }

  twilioClient = twilio(accountSid, authToken);
  return twilioClient;
}

export const sendSMS = async (
  to: string,
  body: string
): Promise<{ sid: string; status: string }> => {
  try {
    const client = getTwilioClient();

    // Use alphanumeric sender ID if available, otherwise fall back to phone number
    const from =
      process.env.TWILIO_ALPHANUMERIC_SENDER_ID || process.env.TWILIO_PHONE_NUMBER || 'myrevuhq';

    const message = await client.messages.create({
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
