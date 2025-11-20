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
  body: string,
  countryCode?: string
): Promise<{ sid: string; status: string }> => {
  try {
    const client = getTwilioClient();

    // Determine sender ID based on country
    // UK and Ireland: Use alphanumeric sender ID "MyRevuHq" (not MEF protected, can use dynamically)
    // USA/Canada: Use phone number (requires A2P 10DLC registration)
    // Other countries: Use alphanumeric if available, otherwise phone number

    let from: string;

    if (countryCode === 'GB' || countryCode === 'IE') {
      // UK and Ireland: Use alphanumeric sender ID
      from = process.env.TWILIO_ALPHANUMERIC_SENDER_ID || 'MyRevuHq';
    } else if (countryCode === 'US' || countryCode === 'CA') {
      // USA/Canada: Must use phone number (A2P 10DLC required)
      from = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_US_PHONE_NUMBER || '';
      if (!from) {
        throw new Error(
          'TWILIO_PHONE_NUMBER or TWILIO_US_PHONE_NUMBER must be set for USA/Canada messaging'
        );
      }
    } else {
      // Other countries: Try alphanumeric first, fall back to phone number
      from =
        process.env.TWILIO_ALPHANUMERIC_SENDER_ID || process.env.TWILIO_PHONE_NUMBER || 'MyRevuHq';
    }

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
