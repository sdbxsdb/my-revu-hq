import axios from 'axios';
import type { Customer, User } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export const apiClient = {
  // Account
  getAccount: async (): Promise<User> => {
    const { data } = await api.get('/api/account');
    return data;
  },

  updateAccount: async (account: Partial<User>): Promise<User> => {
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

  // SMS
  sendSMS: async (customerId: string): Promise<void> => {
    await api.post('/api/send-sms', { customerId });
  },

  // Billing
  getSubscription: async (): Promise<{
    status: 'active' | 'inactive' | 'past_due' | 'canceled';
    paymentMethod: 'card' | 'direct_debit' | null;
    nextBillingDate?: string;
    cardLast4?: string;
    cardBrand?: string;
  }> => {
    const { data } = await api.get('/api/billing/subscription');
    return data;
  },

  createCheckoutSession: async (): Promise<{ url: string }> => {
    const { data } = await api.post('/api/billing/create-checkout-session');
    return data;
  },

  requestInvoiceSetup: async (): Promise<void> => {
    await api.post('/api/billing/request-invoice');
  },
};
