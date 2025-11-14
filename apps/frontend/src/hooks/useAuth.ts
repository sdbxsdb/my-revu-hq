import { useEffect, useState } from 'react';
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

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

    // Check initial session with timeout
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000));

    Promise.race([sessionPromise, timeoutPromise])
      .then(async (result) => {
        if (result === null) {
          // Timeout occurred
          console.warn('Session check timed out, proceeding without session');
          setUser(null);
          setLoading(false);
          return;
        }
        const {
          data: { session },
        } = result;
        setUser(session?.user ?? null);
        if (session) {
          // Sync immediately without timeout (syncSession handles its own errors)
          syncSession().catch((error) => {
            console.error('Session sync failed:', error);
          });
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error('Auth initialization error:', error);
        setUser(null);
        setLoading(false);
      });

    // Listen for auth changes
    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session) {
        // Sync session to backend cookies
        await syncSession();
        // Navigate to home after successful auth
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          navigate('/');
        }
      } else {
        navigate('/login');
      }
    });

    subscription = authSubscription;

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [navigate]);

  const signInWithEmail = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    if (error) throw error;
  };

  const signInWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
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
