import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { syncSession } from '@/lib/auth';
import type { User } from '@/types';
import type { PricingTier } from '@/lib/pricing';

interface AccountContextType {
  account: User | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  subscriptionTier: PricingTier | null;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

// Track ongoing fetch to prevent duplicates (shared across all instances)
let accountFetchPromise: Promise<User> | null = null;

export const AccountProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [account, setAccount] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<PricingTier | null>(null);
  const hasFetchedRef = useRef(false);

  const fetchAccount = async () => {
    // TEST: Check for forced error flag
    const forceError = window.localStorage.getItem('TEST_FORCE_ACCOUNT_ERROR');
    if (forceError === 'true') {
      window.localStorage.removeItem('TEST_FORCE_ACCOUNT_ERROR');
      setError(new Error('Network request failed. Please check your connection.'));
      setLoading(false);
      return;
    }

    if (!user) {
      setAccount(null);
      setSubscriptionTier(null);
      setLoading(false);
      accountFetchPromise = null;
      hasFetchedRef.current = false;
      return;
    }

    // If we already have account data and have fetched, don't fetch again
    if (account && hasFetchedRef.current) {
      setLoading(false);
      return;
    }

    // If there's already a fetch in progress, wait for it (don't start a new one)
    if (accountFetchPromise) {
      try {
        const data = await accountFetchPromise;
        // Only update state if we don't already have the data
        if (!account) {
          setAccount(data);
          setError(null);
        }
      } catch (err: any) {
        if (!account) {
          setError(err);
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    // Set loading to true before starting fetch
    setLoading(true);

    // Wait for session to sync to backend cookies before fetching
    // This prevents 401 errors
    try {
      await syncSession();
      // Give cookies more time to be set and propagated
      // In development with proxy, cookies might need extra time
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (err) {
      // Session sync failed
    }

    // Start new fetch
    accountFetchPromise = apiClient.getAccount();

    try {
      // Fetch both account and subscription data in parallel
      const [accountData, subscriptionData] = await Promise.all([
        accountFetchPromise,
        apiClient.getSubscription().catch(() => null), // Don't fail if subscription endpoint fails
      ]);
      
      setAccount(accountData);
      
      // Store subscription tier
      if (subscriptionData?.subscriptionTier) {
        setSubscriptionTier(subscriptionData.subscriptionTier as PricingTier);
      } else {
        setSubscriptionTier(null);
      }
      
      setError(null);
      hasFetchedRef.current = true;
    } catch (err: any) {
      // Don't retry here - the API interceptor handles 401 retries
      setError(err);
    } finally {
      accountFetchPromise = null;
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if user exists and we haven't fetched yet
    if (user && !hasFetchedRef.current) {
      fetchAccount();
    } else if (!user) {
      setAccount(null);
      setSubscriptionTier(null);
      setLoading(false);
      hasFetchedRef.current = false;
      accountFetchPromise = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    accountFetchPromise = null; // Clear cache to force fresh fetch
    hasFetchedRef.current = false; // Reset flag to allow fetch
    await fetchAccount();
  };

  return (
    <AccountContext.Provider value={{ account, loading, error, refetch, subscriptionTier }}>
      {children}
    </AccountContext.Provider>
  );
};

export const useAccount = () => {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
};
