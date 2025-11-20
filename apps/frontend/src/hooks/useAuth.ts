import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { syncSession, logout as logoutApi } from '@/lib/auth';
import type { User } from '@supabase/supabase-js';

// Helper to detect dev mode
const isDevMode = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  // Check if using placeholder values (either from env or defaults)
  // If env vars are undefined/empty, supabase.ts uses defaults which are placeholders
  return (
    !supabaseUrl ||
    supabaseUrl === '' ||
    supabaseUrl.includes('placeholder') ||
    !supabaseAnonKey ||
    supabaseAnonKey === '' ||
    supabaseAnonKey === 'placeholder_key' ||
    supabaseUrl === 'https://placeholder.supabase.co'
  );
};

// Global flag to prevent multiple session checks
let globalSessionCheckInProgress = false;

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const initialSessionCheckedRef = useRef(false);

  useEffect(() => {
    // Development mode: bypass auth if using placeholder Supabase credentials
    if (isDevMode()) {
      // Create a mock user for development
      setUser({ id: 'dev-user', email: 'dev@example.com' } as User);
      setLoading(false);
      // Don't set up any auth listeners in dev mode
      return;
    }

    let subscription: { unsubscribe: () => void } | null = null;
    let cancelled = false;

    // Set up auth state listener first - it will fire when session is restored
    // This is more reliable than calling getSession() which might hang
    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;

      setUser(session?.user ?? null);
      if (session) {
        // Sync session to backend cookies (non-blocking)
        syncSession().catch((error) => {
          if (!cancelled) {
            console.error('Session sync failed:', error);
          }
        });

        // Navigate to customers page after successful auth
        // Handle SIGNED_IN (new login), TOKEN_REFRESHED (token refresh), and INITIAL_SESSION (page load with existing session)
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          // If we're on the login page and have a session, navigate to customers
          if (window.location.pathname === '/login') {
            navigate('/customers');
          }
        }
      } else {
        // Only navigate to login if this is a sign out event and we're not already there
        if (event === 'SIGNED_OUT' && window.location.pathname !== '/login') {
          navigate('/login');
        }
      }

      // Mark initial check as done after first auth state change
      if (!initialSessionCheckedRef.current) {
        initialSessionCheckedRef.current = true;
        setLoading(false);
      }
    });

    subscription = authSubscription;

    // Also try to get session directly as a fallback (with timeout)
    // But don't block on it - the auth state change will handle it
    const checkInitialSession = async () => {
      // If already checking, skip
      if (globalSessionCheckInProgress) {
        return;
      }

      globalSessionCheckInProgress = true;

      try {
        // Try to get session with a short timeout
        const timeoutPromise = new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), 2000)
        );

        const sessionPromise = supabase.auth.getSession();
        const result = await Promise.race([sessionPromise, timeoutPromise]);

        if (result === null) {
          // Timeout - that's okay, auth state change will handle it
          if (!cancelled && !initialSessionCheckedRef.current) {
            // Wait longer for auth state change to fire (it should fire automatically)
            // Give it 3 seconds total before giving up
            setTimeout(() => {
              if (!initialSessionCheckedRef.current && !cancelled) {
                setLoading(false);
                initialSessionCheckedRef.current = true;
              }
            }, 3000);
          }
          return;
        }

        const {
          data: { session },
          error,
        } = result;

        if (cancelled) return;

        if (error) {
          console.error('Session check error:', error);
          if (!initialSessionCheckedRef.current) {
            setUser(null);
            setLoading(false);
            initialSessionCheckedRef.current = true;
          }
          return;
        }

        setUser(session?.user ?? null);
        if (session) {
          // Sync session to backend (non-blocking)
          syncSession().catch((error) => {
            if (!cancelled) {
              console.error('Session sync failed:', error);
            }
          });
        }

        if (!initialSessionCheckedRef.current) {
          setLoading(false);
          initialSessionCheckedRef.current = true;
        }
      } catch (error: any) {
        if (!cancelled && !initialSessionCheckedRef.current) {
          console.error('Auth initialization error:', error);
          setUser(null);
          setLoading(false);
          initialSessionCheckedRef.current = true;
        }
      } finally {
        globalSessionCheckInProgress = false;
      }
    };

    // Try to get session, but don't block - auth state change is the source of truth
    checkInitialSession();

    return () => {
      cancelled = true;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [navigate]);

  const signInWithEmail = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/customers`,
      },
    });
    if (error) throw error;
  };

  const signInWithPassword = async (email: string, password: string) => {
    try {
      // Add timeout to prevent hanging
      const loginPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Login timeout after 10 seconds')), 10000)
      );

      const { data, error } = (await Promise.race([loginPromise, timeoutPromise])) as any;

      if (error) {
        throw error;
      }

      // Sync session in background (don't wait for it)
      if (data.session) {
        syncSession().catch((syncError) => {
          // Session sync failure is non-fatal
          console.error('Session sync failed:', syncError);
        });
      }

      return data.session;
    } catch (error: any) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    // Check if signup was successful but user already exists
    // Supabase might return a user but with a message indicating it already exists
    if (error) {
      throw error;
    }

    // Additional check: if no user returned, something went wrong
    if (!data.user) {
      throw new Error('Signup failed - no user was created');
    }

    return data;
  };

  const signOut = async () => {
    await logoutApi();
    navigate('/login');
  };

  return {
    user,
    loading,
    signInWithEmail,
    signInWithPassword,
    signUp,
    signOut,
  };
};
