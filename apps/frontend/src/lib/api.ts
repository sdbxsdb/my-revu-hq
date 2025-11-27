import axios from 'axios';
import type { Customer, User } from '@/types';
import { supabase } from './supabase';

// In production, API routes are on the same domain (Vercel serverless functions)
// In development, use Vercel dev server (port 3000) or empty string to use Vite proxy
const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Add request interceptor to include auth token in header for development
// This works around cookie issues with Vite proxy in development
api.interceptors.request.use(
  async (config) => {
    // In development, cookies don't work well with the proxy, so use Authorization header
    if (import.meta.env.DEV || !API_URL) {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.access_token) {
          config.headers.Authorization = `Bearer ${session.access_token}`;
        }
      } catch (error) {
        // If we can't get session, continue without token
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add retry logic for 401 errors (session might still be syncing)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't retried yet, wait briefly and retry once
    // Note: AccountContext now waits for session sync, so this should rarely trigger
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Wait briefly for session to potentially sync
      await new Promise((resolve) => setTimeout(resolve, 300));

      return api(originalRequest);
    }

    // If still 401 after retry, session is likely expired - redirect to login
    if (error.response?.status === 401 && originalRequest._retry) {
      // Only redirect if we're not already on the login page
      if (window.location.pathname !== '/login') {
        // Clear any stale session data
        localStorage.clear();
        // Redirect to login
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export const apiClient = {
  // Account
  getAccount: async (): Promise<User> => {
    const { data } = await api.get('/api/account');
    return data;
  },

  updateAccount: async (account: {
    business_name?: string;
    review_links?: Array<{ name: string; url: string }>;
    sms_template?: string;
    include_name_in_sms?: boolean;
    include_job_in_sms?: boolean;
    onboarding_completed?: boolean;
  }): Promise<User> => {
    const { data } = await api.put('/api/account', account);
    return data;
  },

  // Customers
  getCustomers: async (params?: {
    page?: number;
    limit?: number;
    status?: 'sent' | 'pending';
    firstLetter?: string;
  }): Promise<{ customers: Customer[]; total: number; totalCount?: number }> => {
    const { data } = await api.get('/api/customers', { params });
    return data;
  },

  createCustomer: async (customer: {
    name: string;
    phone: { countryCode: string; country?: string; number: string };
    jobDescription?: string;
    scheduledSendAt?: string;
  }): Promise<Customer> => {
    const { data } = await api.post('/api/customers', customer);
    return data;
  },

  updateCustomer: async (
    customerId: string,
    customer: {
      name?: string;
      phone?: { countryCode: string; country?: string; number: string };
      jobDescription?: string;
      scheduledSendAt?: string | null;
    }
  ): Promise<Customer> => {
    const { data } = await api.put(`/api/customers/${customerId}`, customer);
    return data;
  },

  deleteCustomer: async (customerId: string): Promise<void> => {
    await api.delete(`/api/customers/${customerId}`);
  },

  // SMS
  sendSMS: async (
    customerId: string
  ): Promise<{
    success: boolean;
    messageSid: string;
    customer: {
      id: string;
      sms_status: 'sent' | 'pending';
      sent_at: string;
      sms_request_count: number;
    };
    usage: {
      sms_sent_this_month: number;
      sms_limit: number;
    };
  }> => {
    const response = await api.post('/api/send-sms', { customerId });
    return response.data;
  },

  // Billing
  getSubscription: async (): Promise<{
    accessStatus: 'active' | 'inactive' | 'past_due' | 'canceled';
    paymentMethod: 'card' | 'direct_debit' | null;
    nextBillingDate?: string;
    subscriptionStartDate?: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    cardLast4?: string;
    cardBrand?: string;
    accountStatus?: 'active' | 'cancelled' | 'deleted' | null;
    subscriptionTier?: 'starter' | 'pro' | 'business' | 'enterprise' | null;
  }> => {
    const { data } = await api.get('/api/billing/subscription');
    return data;
  },

  cancelSubscription: async (): Promise<void> => {
    await api.post('/api/billing/cancel-subscription');
  },

  createPortalSession: async (): Promise<{ url: string }> => {
    const { data } = await api.post('/api/billing/create-portal-session');
    return data;
  },

  deleteAccount: async (): Promise<void> => {
    await api.post('/api/billing/delete-account');
  },

  createCheckoutSession: async (currency?: string, tier?: string): Promise<{ url: string }> => {
    const { data } = await api.post('/api/billing/create-checkout-session', { currency, tier });
    return data;
  },

  requestInvoiceSetup: async (): Promise<void> => {
    await api.post('/api/billing/request-invoice');
  },

  // Check if email exists
  checkEmailExists: async (
    email: string
  ): Promise<{ exists: boolean; createdAt: string | null }> => {
    const { data } = await api.get(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
    return data;
  },

  // Get prices for all tiers and currencies from Stripe
  getPrices: async (): Promise<{
    prices: Record<string, Record<string, { amount: number; currency: string; formatted: string }>>;
  }> => {
    const { data } = await api.get('/api/billing/prices');
    return data;
  },

  // Get user's country from IP geolocation
  detectCountry: async (): Promise<{ country: string }> => {
    const { data } = await api.get('/api/geo/detect-country');
    return data;
  },

  // Change subscription tier
  changeTier: async (
    tier: string,
    currency?: string
  ): Promise<{ success: boolean; message: string }> => {
    const { data } = await api.post('/api/billing/change-tier', { tier, currency });
    return data;
  },

  // Analytics (Pro and Business tiers only)
  getAnalytics: async (): Promise<{
    tier: string;
    monthlyStats: Array<{
      month: string;
      year: number;
      count: number;
      customers?: Array<{
        id: string;
        name: string;
        phone: string;
        job_description: string | null;
        sent_at: string;
      }>;
    }>;
    totalMessages: number;
    insights?: {
      notContacted5Days: Array<{
        id: string;
        name: string;
        phone: { countryCode: string; number: string };
        job_description: string | null;
        lastContacted: string | null;
        daysSinceContact: number;
        createdAt: string;
      }>;
      notContacted10Days: Array<{
        id: string;
        name: string;
        phone: { countryCode: string; number: string };
        job_description: string | null;
        lastContacted: string | null;
        daysSinceContact: number;
        createdAt: string;
      }>;
      notContacted30Days: Array<{
        id: string;
        name: string;
        phone: { countryCode: string; number: string };
        job_description: string | null;
        lastContacted: string | null;
        daysSinceContact: number;
        createdAt: string;
      }>;
      approachingLimit: Array<{
        id: string;
        name: string;
        phone: { countryCode: string; number: string };
        job_description: string | null;
        messageCount: number;
        createdAt: string;
      }>;
    };
  }> => {
    const { data } = await api.get('/api/analytics');
    return data;
  },
};
