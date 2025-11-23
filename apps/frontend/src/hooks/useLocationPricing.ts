import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { getCurrencyFromCountry, detectCurrency, type Currency } from '@/lib/currency';

export function useLocationPricing(): string {
  const [formattedPrice, setFormattedPrice] = useState<string>('£4.99'); // Default fallback

  useEffect(() => {
    const loadPrice = async () => {
      try {
        // Detect country first
        const countryResponse = await apiClient.detectCountry();
        const currencyData = getCurrencyFromCountry(countryResponse.country);
        const currency = currencyData.currency;

        // Get prices from Stripe
        const { prices } = await apiClient.getPrices();

        // Get starter price for the detected currency
        const starterPrice = prices['starter']?.[currency];

        if (starterPrice?.formatted) {
          setFormattedPrice(starterPrice.formatted);
        } else {
          // Fallback to browser detection if Stripe price not found
          const fallback = detectCurrency();
          const fallbackPrice = prices['starter']?.[fallback.currency];
          if (fallbackPrice?.formatted) {
            setFormattedPrice(fallbackPrice.formatted);
          }
        }
      } catch (error) {
        // Keep default fallback
      }
    };

    loadPrice();
  }, []);

  return formattedPrice;
}
