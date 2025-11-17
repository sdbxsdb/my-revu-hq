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
 * Detect user's currency based on browser locale
 * Returns the currency code, price will be fetched from Stripe
 */
export function detectCurrency(): { currency: Currency; country: Country } {
  // Try to detect from browser locale
  if (typeof window !== 'undefined') {
    const locale = navigator.language || (navigator as any).userLanguage;

    // Check for country code in locale (e.g., "en-IE", "en-US", "en-GB")
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

    // Check for currency in locale (e.g., "en-US-u-cu-EUR")
    const currencyMatch = locale.match(/cu-([A-Z]{3})/i);
    if (currencyMatch) {
      const currency = currencyMatch[1].toUpperCase() as Currency;
      // Find country by currency
      const country = Object.entries(COUNTRY_CURRENCY_MAP).find(
        ([, curr]) => curr === currency
      )?.[0] as Country | undefined;
      if (country) {
        return { currency, country };
      }
    }

    // Check timezone as fallback
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (timezone.includes('Dublin') || timezone.includes('Europe/Dublin')) {
        return { currency: 'EUR', country: 'IE' };
      }
      if (timezone.includes('America/') || timezone.includes('US/')) {
        return { currency: 'USD', country: 'US' };
      }
      if (timezone.includes('Europe/London') || timezone.includes('GB')) {
        return { currency: 'GBP', country: 'GB' };
      }
    } catch (e) {
      // Fallback to default
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
