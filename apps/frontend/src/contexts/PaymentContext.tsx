import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';

interface PaymentContextType {
  hasPaid: boolean;
  loading: boolean;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const PaymentProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [hasPaid, setHasPaid] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (!user) {
        setHasPaid(false);
        setLoading(false);
        return;
      }

      // Wait a bit for session to sync to backend
      await new Promise((resolve) => setTimeout(resolve, 500));

      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Payment check timeout')), 5000)
        );
        const accountPromise = apiClient.getAccount();

        const account = (await Promise.race([accountPromise, timeoutPromise])) as any;
        // User has paid if access_status is 'active'
        setHasPaid(account.access_status === 'active');
      } catch (error: any) {
        // If we can't fetch account (401/500), assume unpaid
        // This is normal if user just logged in and session hasn't synced yet
        // or if user doesn't exist in database yet
        if (error?.response?.status !== 401 && error?.message !== 'Payment check timeout') {
          console.error('Failed to fetch payment status:', error);
        }
        setHasPaid(false);
      } finally {
        setLoading(false);
      }
    };

    checkPaymentStatus();
  }, [user]);

  return <PaymentContext.Provider value={{ hasPaid, loading }}>{children}</PaymentContext.Provider>;
};

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};
