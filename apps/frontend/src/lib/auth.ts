import { supabase } from './supabase';
import axios from 'axios';

// In production, API routes are on the same domain (Vercel serverless functions)
// In development, use Vercel dev server or empty string to use Vite proxy
const API_URL = import.meta.env.VITE_API_URL || '';

// Track sync state to prevent duplicate calls
let syncPromise: Promise<void> | null = null;
let lastSyncTime = 0;
const SYNC_COOLDOWN = 200; // Only sync once every 200ms max

// Sync Supabase session to HTTP-only cookies
export const syncSession = async () => {
  const now = Date.now();

  // If we just synced recently, return the existing promise
  if (syncPromise && now - lastSyncTime < SYNC_COOLDOWN) {
    return syncPromise;
  }

  // If there's an ongoing sync, wait for it
  if (syncPromise) {
    return syncPromise;
  }

  // Start new sync immediately (no debounce delay)
  syncPromise = (async () => {
    try {
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
          lastSyncTime = Date.now();
        } catch (error) {
          console.error('Failed to sync session:', error);
        }
      }
    } finally {
      // Clear promise after a short cooldown to allow new syncs if needed
      setTimeout(() => {
        syncPromise = null;
      }, SYNC_COOLDOWN);
    }
  })();

  return syncPromise;
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
