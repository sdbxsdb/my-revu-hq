/**
 * Pricing tiers configuration
 */

export type PricingTier = 'free' | 'starter' | 'pro' | 'business' | 'enterprise';

export interface PricingPlan {
  id: PricingTier;
  name: string;
  price: number;
  smsLimit: number;
  description: string;
  features: string[];
  popular?: boolean;
}

const ALL_PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free (Dev)',
    price: 0,
    smsLimit: 60, // Same as Business for testing
    description: 'Development testing only - Full Business features',
    features: [
      '60 SMS messages per month',
      'Unlimited customers',
      'Multiple review platforms',
      'Custom SMS templates',
      'Priority support',
      'Export customer data',
      'Development only',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 4.99,
    smsLimit: 15,
    description: 'Perfect for small businesses getting started',
    features: [
      '15 SMS messages per month',
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
    smsLimit: 30,
    description: 'Ideal for growing businesses',
    features: [
      '30 SMS messages per month',
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
    smsLimit: 60,
    description: 'For established businesses with high volume',
    features: [
      '60 SMS messages per month',
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

// Export pricing plans - exclude 'free' tier in production
export const PRICING_PLANS: PricingPlan[] = import.meta.env.DEV
  ? ALL_PRICING_PLANS
  : ALL_PRICING_PLANS.filter((plan) => plan.id !== 'free');

export function getPlanById(id: PricingTier): PricingPlan | undefined {
  return ALL_PRICING_PLANS.find((plan) => plan.id === id);
}

export function formatPlanPrice(price: number, currency: 'GBP' | 'EUR' | 'USD'): string {
  const symbols = { GBP: '£', EUR: '€', USD: '$' };
  return `${symbols[currency]}${price.toFixed(2)}`;
}

/**
 * Get SMS monthly limit based on subscription tier
 */
export function getSmsLimitFromTier(tier: PricingTier | null | undefined): number {
  if (!tier) return 0;
  const plan = getPlanById(tier);
  return plan?.smsLimit || 0;
}
