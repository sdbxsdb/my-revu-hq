import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export const EmailConfirmationHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      // Check if we have auth tokens in the URL hash
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');

      // If we have tokens, set the session and redirect
      if (accessToken && refreshToken) {
        try {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (!error) {
            // Clean up the URL hash
            window.history.replaceState(null, '', window.location.pathname);
            
            // Redirect based on confirmation type
            if (type === 'signup' || type === 'email_confirmation') {
              // Email verification - go to dashboard (with setup checklist)
              navigate('/dashboard', { replace: true });
            } else if (type === 'recovery') {
              // Password reset - go to reset password page
              navigate('/reset-password', { replace: true });
            } else if (type === 'magiclink') {
              // Magic link - go to dashboard
              navigate('/dashboard', { replace: true });
            } else {
              // Unknown type - default to dashboard
              navigate('/dashboard', { replace: true });
            }
          }
        } catch (error) {
          console.error('Error setting session:', error);
          navigate('/login', { replace: true });
        }
      }
    };

    handleEmailConfirmation();
  }, [navigate]);

  return null;
};

