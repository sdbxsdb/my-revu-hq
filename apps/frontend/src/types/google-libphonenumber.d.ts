declare module 'google-libphonenumber' {
  export enum PhoneNumberFormat {
    E164 = 0,
    INTERNATIONAL = 1,
    NATIONAL = 2,
    RFC3966 = 3,
  }

  export class PhoneNumberUtil {
    static getInstance(): PhoneNumberUtil;
    parse(number: string, defaultRegion?: string): PhoneNumber;
    isValidNumber(number: PhoneNumber): boolean;
    format(number: PhoneNumber, format: PhoneNumberFormat): string;
    getSupportedRegions(): string[];
    getRegionCodeForNumber(number: PhoneNumber): string | null;
  }

  export class PhoneNumber {
    getCountryCode(): number | undefined;
  }
}

