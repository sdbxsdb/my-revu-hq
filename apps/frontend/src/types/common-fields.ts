// Types for phone number handling with react-phone-number-input
// All phone numbers are stored in E.164 format (e.g., +447780587666) for Twilio compatibility

export interface PhoneNumber {
  countryCode: string; // "44" (country calling code without +)
  number: string; // "+447780587666" (full E.164 format for Twilio)
}

// Simple type - just the phone number string in E.164 format
export type PhoneNumberValue = string | undefined;
