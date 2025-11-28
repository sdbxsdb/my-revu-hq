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

      // Validate SMS setup requirements:
      // - Business name > 2 characters
      // - At least 1 fully filled review link (name + url)
      // - SMS template 50-400 characters
      const hasValidBusinessName = !!(userData.business_name && userData.business_name.length > 2);
      const hasValidReviewLink = !!(userData.review_links && userData.review_links.some(
        (link: any) => link.name && link.name.trim() && link.url && link.url.trim()
      ));
      const hasValidSmsTemplate = !!(userData.sms_template && 
        userData.sms_template.length >= 50 && 
        userData.sms_template.length <= 400);
      
      const hasAccountSetup = hasValidBusinessName && hasValidReviewLink && hasValidSmsTemplate;
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

