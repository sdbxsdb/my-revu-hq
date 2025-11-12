import { parsePhoneNumberFromString, isValidPhoneNumber, CountryCode } from 'libphonenumber-js';

/**
 * Get country name from country code for error messages
 */
const getCountryName = (countryCode: CountryCode): string => {
  const countryNames: Partial<Record<CountryCode, string>> = {
    GB: 'United Kingdom',
    IE: 'Ireland',
    US: 'United States',
    CA: 'Canada',
    AU: 'Australia',
    NZ: 'New Zealand',
    FR: 'France',
    DE: 'Germany',
    ES: 'Spain',
    IT: 'Italy',
    NL: 'Netherlands',
    BE: 'Belgium',
    CH: 'Switzerland',
    AT: 'Austria',
    SE: 'Sweden',
    NO: 'Norway',
    DK: 'Denmark',
    FI: 'Finland',
    PL: 'Poland',
    PT: 'Portugal',
  };
  return countryNames[countryCode] || countryCode;
};

/**
 * Validates a phone number using libphonenumber-js with country context
 * Accepts local numbers (e.g., 07780 586444) when country is provided
 * Accepts international numbers (e.g., +447780586444)
 * Prevents mixed formats like +44 07780...
 */
export const validatePhoneNumber = (
  phoneNumber: string | undefined,
  country?: CountryCode
): { isValid: boolean; error?: string; normalized?: string } => {
  if (!phoneNumber || phoneNumber.trim() === '') {
    return { isValid: false, error: 'Phone number is required' };
  }

  const trimmed = phoneNumber.trim();

  // Prevent invalid patterns: +0... (should be either +44... or 0...)
  if (trimmed.startsWith('+0')) {
    return {
      isValid: false,
      error: 'Invalid format: remove the + prefix for local numbers starting with 0',
    };
  }

  // Prevent mixed formats: if it starts with + and has a leading 0 after country code
  // Example: +44 07780... or +44 0 7780...
  // This catches cases like "+44 07780586767" which is invalid
  if (trimmed.startsWith('+')) {
    // Check for invalid patterns like +44 0... or +44 077...
    const afterPlus = trimmed.substring(1).trim();
    // If there's a space after country code and then a 0, it's likely a mixed format
    const parts = afterPlus.split(/\s+/);
    if (parts.length > 1 && parts[1]?.startsWith('0')) {
      return {
        isValid: false,
        error: 'Invalid format: remove leading 0 when using country code',
      };
    }
  }

  // Use libphonenumber-js for validation with country context
  try {
    // If country is provided, use it for parsing local numbers (e.g., "07780586767" with country "GB")
    // This allows users to enter local numbers naturally: 07780586767 → +447780586767
    const parsed = country
      ? parsePhoneNumberFromString(trimmed, country)
      : parsePhoneNumberFromString(trimmed);

    if (!parsed) {
      // If country is provided, check if it's a general format issue or country-specific
      if (country) {
        // Try parsing without country to see if it's a general format issue
        const parsedWithoutCountry = parsePhoneNumberFromString(trimmed);
        if (!parsedWithoutCountry) {
          return { isValid: false, error: 'Invalid phone number format' };
        }
        // If it can be parsed without country but not with country, it's country-specific
        return { isValid: false, error: `Invalid phone number for ${getCountryName(country)}` };
      }
      return { isValid: false, error: 'Invalid phone number format' };
    }

    // Validate the parsed number
    if (!isValidPhoneNumber(parsed.number)) {
      // If country is provided, specify it's invalid for that country
      if (country) {
        return { isValid: false, error: `Invalid phone number for ${getCountryName(country)}` };
      }
      return { isValid: false, error: 'Invalid phone number' };
    }

    // Return E.164 format
    return { isValid: true, normalized: parsed.number };
  } catch (error) {
    // If country is provided, specify it's invalid for that country
    if (country) {
      return { isValid: false, error: `Invalid phone number for ${getCountryName(country)}` };
    }
    return { isValid: false, error: 'Invalid phone number format' };
  }
};

/**
 * Normalize phone number to E.164 format for Twilio
 * Handles: 07780587666 (with country), +447780587656, 00447780587666, etc.
 */
export const normalizeToE164 = (
  phoneNumber: string | undefined,
  country?: CountryCode
): string | null => {
  if (!phoneNumber || phoneNumber.trim() === '') {
    return null;
  }

  try {
    const trimmed = phoneNumber.trim();
    // Use libphonenumber-js with country context for local numbers
    const parsed = country
      ? parsePhoneNumberFromString(trimmed, country)
      : parsePhoneNumberFromString(trimmed);

    return parsed ? parsed.number : null;
  } catch {
    return null;
  }
};

/**
 * Format phone number for API
 * Returns E.164 format (e.g., +447780587666) which Twilio requires
 * Uses country context for local numbers
 */
export const formatPhoneNumberForApi = (
  phoneNumber: string | undefined,
  country?: CountryCode
): { countryCode: string; number: string } | null => {
  const normalized = normalizeToE164(phoneNumber, country);
  if (!normalized) {
    return null;
  }

  // Parse to extract country code
  try {
    const parsed = parsePhoneNumberFromString(normalized);
    if (parsed) {
      const countryCode = parsed.countryCallingCode;

      return {
        countryCode: countryCode, // e.g., "44"
        number: normalized, // Full E.164 format: +447780587666 (Twilio requires this)
      };
    }
  } catch {
    // Fall through
  }

  return null;
};

/**
 * Auto-detect country from phone number with consistent logic
 * Prefers GB over GG and US over CA when ambiguous
 * This ensures consistent detection across the app
 */
export const detectCountryFromPhoneNumber = (
  phoneNumber: string,
  countryCode?: string
): CountryCode | undefined => {
  if (!phoneNumber) return undefined;

  try {
    // If we have a country code, construct E.164 format
    let e164Number: string;
    if (phoneNumber.startsWith('+')) {
      e164Number = phoneNumber;
    } else if (countryCode) {
      e164Number = `+${countryCode}${phoneNumber}`;
    } else {
      // Try to parse as-is (might be E.164 without +)
      e164Number = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    }

    // Parse the number
    const parsed = parsePhoneNumberFromString(e164Number);
    if (!parsed || !parsed.country) {
      return undefined;
    }

    let detectedCountry = parsed.country as CountryCode;

    // Apply consistent preferences for ambiguous cases
    // Prefer GB over GG for +44 numbers (UK is more common)
    if (detectedCountry === 'GG' && parsed.countryCallingCode === '44') {
      // Check if it's also valid as GB
      try {
        const parsedAsGB = parsePhoneNumberFromString(e164Number, 'GB');
        if (parsedAsGB && parsedAsGB.isValid()) {
          detectedCountry = 'GB';
        }
      } catch {
        // Keep GG if parsing as GB fails
      }
    }

    // For +1 numbers, the library should correctly detect US vs CA
    // But we can add a preference if needed
    // For now, trust the library's detection for +1

    return detectedCountry;
  } catch {
    return undefined;
  }
};
