import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useAccount } from './AccountContext';

interface PaymentContextType {
  hasPaid: boolean;
  loading: boolean;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const PaymentProvider = ({ children }: { children: ReactNode }) => {
  const { account, loading } = useAccount();

  // User has paid if access_status is 'active'
  const hasPaid = useMemo(() => {
    return account?.access_status === 'active';
  }, [account?.access_status]);

  return <PaymentContext.Provider value={{ hasPaid, loading }}>{children}</PaymentContext.Provider>;
};

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};
