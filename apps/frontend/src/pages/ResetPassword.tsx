import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, TextInput, Paper, Text, Stack, Title, Alert } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { supabase } from '@/lib/supabase';
import { IconLock, IconEye, IconEyeOff, IconCheck } from '@tabler/icons-react';

export const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [validToken, setValidToken] = useState(false);

  useEffect(() => {
    // Check if we have the required tokens from Supabase
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          setValidToken(true);
        } else {
          // Try to get session from URL hash (Supabase redirects with tokens in hash)
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken && refreshToken) {
            // Set the session
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (!error) {
              setValidToken(true);
            }
          }
        }
      } catch (error) {
        // Error validating reset token
      } finally {
        setValidating(false);
      }
    };

    checkSession();
  }, []);

  const validatePasswords = () => {
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePasswords()) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      notifications.show({
        title: 'Success',
        message: 'Your password has been reset. You can now sign in with your new password.',
        color: 'green',
        icon: <IconCheck size={16} />,
      });

      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to reset password',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Paper shadow="md" p="xl" className="w-full max-w-md">
          <Text className="text-center text-gray-400">Validating reset link...</Text>
        </Paper>
      </div>
    );
  }

  if (!validToken) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Paper shadow="md" p="xl" className="w-full max-w-md">
          <Alert color="red" icon={<IconLock size={16} />} title="Invalid Reset Link">
            <Text size="sm" className="text-gray-300 mb-4">
              This password reset link is invalid or has expired. Please request a new one.
            </Text>
            <Button fullWidth onClick={() => navigate('/login')}>
              Go to Login
            </Button>
          </Alert>
        </Paper>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Paper shadow="md" p="xl" className="w-full max-w-md">
        <Stack gap="lg">
          <div>
            <Title order={2} className="text-2xl font-bold mb-2 text-white">
              Reset Password
            </Title>
            <Text size="sm" className="text-gray-400">
              Enter your new password below
            </Text>
          </div>

          <form onSubmit={handleResetPassword}>
            <Stack gap="md">
              <TextInput
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError('');
                }}
                onBlur={validatePasswords}
                leftSection={<IconLock size={16} />}
                rightSection={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                  </button>
                }
                description="Must be at least 6 characters"
                error={passwordError && password.length < 6 ? passwordError : undefined}
              />
              <TextInput
                label="Confirm New Password"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setPasswordError('');
                }}
                onBlur={validatePasswords}
                leftSection={<IconLock size={16} />}
                rightSection={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-gray-400 hover:text-gray-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                  </button>
                }
                error={passwordError ? passwordError : undefined}
              />
              <Button
                type="submit"
                fullWidth
                loading={loading}
                leftSection={<IconLock size={18} />}
              >
                Reset Password
              </Button>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </div>
  );
};
