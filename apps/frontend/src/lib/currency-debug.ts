/**
 * Debug utility to show currency detection details
 * Use this in browser console to see what's being detected
 */

import { detectCurrency } from './currency';

export function debugCurrencyDetection() {
  if (typeof window === 'undefined') {
    console.log('Not in browser environment');
    return;
  }

  const locale = navigator.language || (navigator as any).userLanguage;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const detected = detectCurrency();

  console.log('=== Currency Detection Debug ===');
  console.log('Browser Locale:', locale);
  console.log('Browser Timezone:', timezone);
  console.log('Detected Currency:', detected.currency);
  console.log('Detected Country:', detected.country);
  console.log('===============================');

  return {
    locale,
    timezone,
    detected,
  };
}

// Auto-run in development
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).debugCurrency = debugCurrencyDetection;
  console.log('💡 Run debugCurrency() in console to see currency detection details');
}
