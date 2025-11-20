/**
 * Pricing tiers configuration
 */

export type PricingTier = 'starter' | 'pro' | 'business' | 'enterprise';

export interface PricingPlan {
  id: PricingTier;
  name: string;
  price: number;
  smsLimit: number;
  description: string;
  features: string[];
  popular?: boolean;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 4.99,
    smsLimit: 20,
    description: 'Perfect for small businesses getting started',
    features: [
      '20 SMS messages per month',
      'Unlimited customers',
      'Multiple review platforms',
      'Custom SMS templates',
      'Cancel anytime',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    smsLimit: 50,
    description: 'Ideal for growing businesses',
    features: [
      '50 SMS messages per month',
      'Unlimited customers',
      'Multiple review platforms',
      'Custom SMS templates',
      'Priority support',
      'Cancel anytime',
    ],
    popular: true,
  },
  {
    id: 'business',
    name: 'Business',
    price: 19.99,
    smsLimit: 100,
    description: 'For established businesses with high volume',
    features: [
      '100 SMS messages per month',
      'Unlimited customers',
      'Multiple review platforms',
      'Custom SMS templates',
      'Priority support',
      'Export customer data',
      'Cancel anytime',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 0, // Custom pricing
    smsLimit: 0, // Custom
    description: 'Custom solutions for large organizations',
    features: [
      'Custom SMS volume',
      'Unlimited customers',
      'Multiple review platforms',
      'Custom SMS templates',
      'Dedicated account manager',
      'Custom onboarding support',
      'Bulk import/export tools',
    ],
  },
];

export function getPlanById(id: PricingTier): PricingPlan | undefined {
  return PRICING_PLANS.find((plan) => plan.id === id);
}

export function formatPlanPrice(price: number, currency: 'GBP' | 'EUR' | 'USD'): string {
  const symbols = { GBP: '£', EUR: '€', USD: '$' };
  return `${symbols[currency]}${price.toFixed(2)}`;
}
