/**
 * Currency detection and formatting utilities
 */

export type Currency = 'GBP' | 'EUR' | 'USD';
export type Country = 'GB' | 'IE' | 'US';

export interface CurrencyInfo {
  currency: Currency;
  country: Country;
  symbol: string;
  price: number;
}

// Currency symbol mappings (prices come from Stripe)
const CURRENCY_SYMBOLS: Record<Currency, string> = {
  GBP: '£',
  EUR: '€',
  USD: '$',
};

// Country to currency mappings
const COUNTRY_CURRENCY_MAP: Record<Country, Currency> = {
  GB: 'GBP',
  IE: 'EUR',
  US: 'USD',
};

/**
 * Detect user's currency based on IP geolocation
 * This is called from the component after fetching country from API
 */
export function getCurrencyFromCountry(country: string): { currency: Currency; country: Country } {
  const countryUpper = country.toUpperCase() as Country;

  // Map country codes to currencies
  if (countryUpper === 'IE') {
    return { currency: 'EUR', country: 'IE' };
  }
  if (countryUpper === 'US') {
    return { currency: 'USD', country: 'US' };
  }
  if (countryUpper === 'GB') {
    return { currency: 'GBP', country: 'GB' };
  }

  // Default to GBP for other countries
  return { currency: 'GBP', country: 'GB' };
}

/**
 * Legacy function for browser-based detection (fallback only)
 * @deprecated Use IP geolocation instead
 */
export function detectCurrency(): { currency: Currency; country: Country } {
  // Fallback to browser detection if API fails
  if (typeof window !== 'undefined') {
    const locale = navigator.language || (navigator as any).userLanguage;
    const countryMatch = locale.match(/-([A-Z]{2})$/i);
    if (countryMatch) {
      const country = countryMatch[1].toUpperCase() as Country;
      if (country in COUNTRY_CURRENCY_MAP) {
        return {
          currency: COUNTRY_CURRENCY_MAP[country],
          country,
        };
      }
    }
  }

  // Default to GBP
  return { currency: 'GBP', country: 'GB' };
}

/**
 * Format price with currency symbol
 */
export function formatPrice(price: number, currency: Currency): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  return `${symbol}${price.toFixed(2)}`;
}

/**
 * Create CurrencyInfo from detected currency and Stripe price data
 */
export function createCurrencyInfo(
  currency: Currency,
  country: Country,
  priceData?: { amount: number; currency: string; formatted: string }
): CurrencyInfo {
  return {
    currency,
    country,
    symbol: CURRENCY_SYMBOLS[currency],
    price: priceData?.amount || 0,
  };
}
