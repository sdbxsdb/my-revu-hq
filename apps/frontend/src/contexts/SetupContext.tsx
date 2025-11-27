import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/lib/api';
import { useAccount } from '@/contexts/AccountContext';

interface SetupProgress {
  hasAccountSetup: boolean;
  hasCustomer: boolean;
  hasSubscription: boolean;
  isComplete: boolean;
  completedCount: number;
  totalCount: number;
}

interface SetupContextType {
  progress: SetupProgress | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const SetupContext = createContext<SetupContextType | undefined>(undefined);

export const SetupProvider = ({ children }: { children: ReactNode }) => {
  const { account, subscriptionTier } = useAccount();
  const [progress, setProgress] = useState<SetupProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const [userData, customers] = await Promise.all([
        apiClient.getAccount(),
        apiClient.getCustomers({ page: 1, limit: 100 }),
      ]);

      const hasAccountSetup = !!(
        userData.business_name &&
        userData.review_links &&
        userData.review_links.length > 0
      );
      const hasCustomer = (customers.total || 0) > 0;
      const hasSubscription = !!subscriptionTier && subscriptionTier !== 'starter';

      // All 3 steps for both dashboard and modal
      const allSteps = [hasAccountSetup, hasCustomer, hasSubscription];
      const completedCount = allSteps.filter(Boolean).length;

      setProgress({
        hasAccountSetup,
        hasCustomer,
        hasSubscription,
        isComplete: userData.onboarding_completed || false,
        completedCount,
        totalCount: 3,
      });
    } catch (error) {
      console.error('Error loading setup progress:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (account) {
      loadProgress();
    }
  }, [account, subscriptionTier]);

  return (
    <SetupContext.Provider value={{ progress, loading, refresh: loadProgress }}>
      {children}
    </SetupContext.Provider>
  );
};

export const useSetup = () => {
  const context = useContext(SetupContext);
  if (context === undefined) {
    throw new Error('useSetup must be used within a SetupProvider');
  }
  return context;
};

