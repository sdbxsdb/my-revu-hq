import { supabase } from './supabase';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Sync Supabase session to HTTP-only cookies
export const syncSession = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    try {
      await axios.post(
        `${API_URL}/api/auth/sync-session`,
        {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        },
        { withCredentials: true }
      );
    } catch (error) {
      console.error('Failed to sync session:', error);
    }
  }
};

// Logout and clear cookies
export const logout = async () => {
  await supabase.auth.signOut();
  try {
    await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
  } catch (error) {
    console.error('Failed to clear cookies:', error);
  }
};

