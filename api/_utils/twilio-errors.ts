/**
 * Parse Twilio error codes into user-friendly messages
 * https://www.twilio.com/docs/api/errors
 */
export function parseTwilioError(error: any): {message: string; code?: string} {
  const errorCode = error.code || error.status;
  const errorMessage = error.message || '';

  // Twilio error codes
  switch (errorCode) {
    case 21211:
      return {
        message: 'Invalid phone number. Please check the number and country code.',
        code: '21211'
      };
    case 21408:
      return {
        message: 'Permission denied. The destination number may have opted out or be blocked.',
        code: '21408'
      };
    case 21610:
      return {
        message: 'This number has unsubscribed from receiving messages.',
        code: '21610'
      };
    case 21614:
      return {
        message: 'This number is on the Do Not Call registry or has opted out.',
        code: '21614'
      };
    case 30003:
      return {
        message: 'Unable to reach the mobile carrier. The number may be invalid or out of service.',
        code: '30003'
      };
    case 30005:
      return {
        message: 'The destination number is currently unavailable or unreachable.',
        code: '30005'
      };
    case 30006:
      return {
        message: 'Landline or unreachable carrier. This number cannot receive SMS messages.',
        code: '30006'
      };
    case 30007:
      return {
        message: 'Message filtered or blocked by the carrier.',
        code: '30007'
      };
    case 21606:
      return {
        message: 'The phone number is not capable of receiving SMS messages.',
        code: '21606'
      };
    case 21612:
      return {
        message: 'The number cannot receive this type of message.',
        code: '21612'
      };
    case 21617:
      return {
        message: 'The phone number is in an unsupported region or country.',
        code: '21617'
      };
    default:
      // Check for common error patterns in message
      if (errorMessage.toLowerCase().includes('invalid number') || errorMessage.toLowerCase().includes('not a valid phone')) {
        return {
          message: 'Invalid phone number format. Please check the number and try again.',
          code: errorCode
        };
      }
      if (errorMessage.toLowerCase().includes('unsubscribed') || errorMessage.toLowerCase().includes('opt')) {
        return {
          message: 'This recipient has opted out of receiving messages.',
          code: errorCode
        };
      }
      if (errorMessage.toLowerCase().includes('carrier') || errorMessage.toLowerCase().includes('unreachable')) {
        return {
          message: 'Unable to deliver message. The number may be out of service.',
          code: errorCode
        };
      }
      // Generic fallback
      return {
        message: 'Failed to send SMS. Please verify the phone number is correct and capable of receiving text messages. If the problem persists, contact support.',
        code: errorCode
      };
  }
}

