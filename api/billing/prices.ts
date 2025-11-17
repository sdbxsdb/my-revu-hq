import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { setCorsHeaders } from '../_utils/response';

// Initialize Stripe
let stripe: Stripe | null = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-10-29.clover',
    });
  }
} catch (error) {
  // Stripe not initialized
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    setCorsHeaders(res);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  setCorsHeaders(res);

  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    // Get price IDs from environment variables
    const priceIds: Record<string, string> = {
      GBP: process.env.STRIPE_PRICE_ID_GBP || process.env.STRIPE_PRICE_ID || '',
      EUR: process.env.STRIPE_PRICE_ID_EUR || '',
      USD: process.env.STRIPE_PRICE_ID_USD || '',
    };

    // Fetch prices from Stripe for all configured currencies
    const prices: Record<string, { amount: number; currency: string; formatted: string }> = {};

    for (const [currency, priceId] of Object.entries(priceIds)) {
      if (!priceId) {
        continue;
      }

      try {
        const price = await stripe.prices.retrieve(priceId);

        // Convert from cents to dollars/euros/pounds
        const amount = price.unit_amount ? price.unit_amount / 100 : 0;

        // Format price with currency symbol
        let formatted = '';
        if (currency === 'USD') {
          formatted = `$${amount.toFixed(2)}`;
        } else if (currency === 'EUR') {
          formatted = `€${amount.toFixed(2)}`;
        } else if (currency === 'GBP') {
          formatted = `£${amount.toFixed(2)}`;
        } else {
          formatted = `${amount.toFixed(2)} ${currency}`;
        }

        prices[currency] = {
          amount,
          currency: price.currency.toUpperCase(),
          formatted,
        };
      } catch (error: any) {
        // Continue with other currencies - don't add to prices object if fetch fails
      }
    }

    return res.json({ prices });
  } catch (error: any) {
    setCorsHeaders(res);
    return res.status(500).json({ error: error.message });
  }
}
