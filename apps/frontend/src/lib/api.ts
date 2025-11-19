import axios from 'axios';
import type { Customer, User } from '@/types';

// In production, API routes are on the same domain (Vercel serverless functions)
// In development, use Vercel dev server (port 3000) or empty string to use Vite proxy
const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

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
  }): Promise<User> => {
    const { data } = await api.put('/api/account', account);
    return data;
  },

  // Customers
  getCustomers: async (params?: {
    page?: number;
    limit?: number;
    status?: 'sent' | 'pending';
  }): Promise<{ customers: Customer[]; total: number }> => {
    const { data } = await api.get('/api/customers', { params });
    return data;
  },

  createCustomer: async (customer: {
    name: string;
    phone: { countryCode: string; country?: string; number: string };
    jobDescription?: string;
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
    }
  ): Promise<Customer> => {
    const { data } = await api.put(`/api/customers/${customerId}`, customer);
    return data;
  },

  deleteCustomer: async (customerId: string): Promise<void> => {
    await api.delete(`/api/customers/${customerId}`);
  },

  // SMS
  sendSMS: async (customerId: string): Promise<void> => {
    await api.post('/api/send-sms', { customerId });
  },

  // Billing
  getSubscription: async (): Promise<{
    accessStatus: 'active' | 'inactive' | 'past_due' | 'canceled';
    paymentMethod: 'card' | 'direct_debit' | null;
    nextBillingDate?: string;
    cardLast4?: string;
    cardBrand?: string;
    accountStatus?: 'active' | 'cancelled' | 'deleted' | null;
  }> => {
    const { data } = await api.get('/api/billing/subscription');
    return data;
  },

  cancelSubscription: async (): Promise<void> => {
    await api.post('/api/billing/cancel-subscription');
  },

  deleteAccount: async (): Promise<void> => {
    await api.post('/api/billing/delete-account');
  },

  createCheckoutSession: async (currency?: string): Promise<{ url: string }> => {
    const { data } = await api.post('/api/billing/create-checkout-session', { currency });
    return data;
  },

  requestInvoiceSetup: async (): Promise<void> => {
    await api.post('/api/billing/request-invoice');
  },

  // Get prices for all currencies from Stripe
  getPrices: async (): Promise<{
    prices: Record<string, { amount: number; currency: string; formatted: string }>;
  }> => {
    const { data } = await api.get('/api/billing/prices');
    return data;
  },

  // Get user's country from IP geolocation
  detectCountry: async (): Promise<{ country: string }> => {
    const { data } = await api.get('/api/geo/detect-country');
    return data;
  },
};
