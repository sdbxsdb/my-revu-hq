import { parsePhoneNumberFromString, CountryCode, getCountryCallingCode } from 'libphonenumber-js';

/**
 * Map numeric country calling codes to ISO country codes
 * This helps when we only have the numeric code (e.g., "44") but need the ISO code (e.g., "GB")
 * Note: For "1" (USA/Canada), we let the library detect based on the number itself
 */
const COUNTRY_CODE_MAP: Record<string, CountryCode> = {
  '44': 'GB', // UK
  '353': 'IE', // Ireland
  // '1' is USA/Canada - library will detect based on area code
  // Add more as needed
};

/**
 * Convert phone number to E.164 format for Twilio
 * Handles all countries: UK, Ireland, USA, Canada, etc.
 *
 * @param phoneNumber - Phone number in any format (local or international)
 * @param countryCode - ISO country code (e.g., 'GB', 'IE', 'US', 'CA') or country calling code (e.g., '44', '1')
 * @returns E.164 formatted number (e.g., '+447780587666') or null if invalid
 */
export const normalizeToE164 = (
  phoneNumber: string | undefined,
  countryCode?: string | CountryCode
): string | null => {
  if (!phoneNumber || phoneNumber.trim() === '') {
    return null;
  }

  try {
    const trimmed = phoneNumber.trim();

    // If already in E.164 format, return as-is
    if (trimmed.startsWith('+')) {
      const parsed = parsePhoneNumberFromString(trimmed);
      return parsed?.isValid() ? parsed.number : null;
    }

    // Convert country code to CountryCode format if needed
    let country: CountryCode | undefined;
    if (countryCode) {
      // If it's a numeric country calling code (e.g., "44", "1")
      if (countryCode.length > 2 || /^\d+$/.test(countryCode)) {
        // Map numeric code to ISO code
        country = COUNTRY_CODE_MAP[countryCode] as CountryCode | undefined;

        // If no mapping found (e.g., "1" for USA/Canada), construct E.164 and let library detect
        if (!country) {
          // Remove leading 0 for UK/Ireland numbers, or use as-is for others
          const cleanedNumber = trimmed.replace(/^0+/, '');
          const e164 = `+${countryCode}${cleanedNumber}`;
          const parsed = parsePhoneNumberFromString(e164);
          return parsed?.isValid() ? parsed.number : null;
        }
      } else {
        // It's already an ISO country code (e.g., "GB", "IE", "US", "CA")
        country = countryCode.toUpperCase() as CountryCode;
      }
    }

    // Parse with country context for local numbers
    const parsed = country
      ? parsePhoneNumberFromString(trimmed, country)
      : parsePhoneNumberFromString(trimmed);

    if (!parsed || !parsed.isValid()) {
      return null;
    }

    return parsed.number; // Returns E.164 format
  } catch {
    return null;
  }
};
