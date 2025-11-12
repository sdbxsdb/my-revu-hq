import { createContext, useContext, useState, ReactNode } from 'react';

interface PaymentContextType {
  hasPaid: boolean;
  togglePayment: () => void;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const PaymentProvider = ({ children }: { children: ReactNode }) => {
  // Default to false (unpaid) for testing
  const [hasPaid, setHasPaid] = useState(false);

  const togglePayment = () => {
    setHasPaid((prev) => !prev);
  };

  return (
    <PaymentContext.Provider value={{ hasPaid, togglePayment }}>{children}</PaymentContext.Provider>
  );
};

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};
