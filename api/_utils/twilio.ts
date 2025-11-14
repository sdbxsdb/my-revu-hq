import twilio from 'twilio';

let twilioClient: ReturnType<typeof twilio> | null = null;

function getTwilioClient() {
  if (twilioClient) {
    return twilioClient;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error(
      'Twilio is not configured. Please add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to your environment variables.'
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
