import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, TextInput, Paper, Title, Text, Stack, Divider, Alert } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useAuth } from '@/hooks/useAuth';
import { IconMail, IconLock, IconBrandGoogle } from '@tabler/icons-react';
import { supabase } from '@/lib/supabase';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<boolean>(false);
  const [mode, setMode] = useState<'password' | 'magic-link' | 'signup'>('password');
  const { signInWithEmail, signInWithPassword, signUp } = useAuth();
  const navigate = useNavigate();

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmail(email);
      notifications.show({
        title: 'Check your email',
        message: 'We sent you a magic link. Click it to sign in instantly - no password needed!',
        color: 'teal',
        autoClose: 10000,
      });
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to send magic link',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithPassword(email, password);
      navigate('/');
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to sign in',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      notifications.show({
        title: 'Error',
        message: 'Password must be at least 6 characters',
        color: 'red',
      });
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password);
      notifications.show({
        title: 'Success',
        message: 'Account created! Please check your email to verify your account.',
        color: 'green',
      });
      // Switch to password login after signup
      setMode('password');
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to sign up',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleOAuth = async () => {
    setOauthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) {
        if (error.message?.includes('not enabled')) {
          notifications.show({
            title: 'OAuth Not Configured',
            message:
              'Google sign-in is not enabled yet. Please use email/password or magic link, or configure Google OAuth in Supabase.',
            color: 'orange',
            autoClose: 8000,
          });
        } else {
          throw error;
        }
      }
      // Don't set loading to false here - OAuth redirects to external page
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to sign in with Google',
        color: 'red',
      });
      setOauthLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <Paper shadow="xl" p="md" className="w-full max-w-md sm:p-xl">
        <div className="text-center mb-8">
          <Title order={2} mb="xs" className="text-3xl font-bold text-white">
            MyRevuHQ
          </Title>
          <Text c="dimmed" size="sm" ta="center" className="text-gray-400">
            Sign in to your account
          </Text>
        </div>

        <Stack gap="md">
          {/* OAuth Button */}
          <Button
            leftSection={<IconBrandGoogle size={18} />}
            variant="default"
            fullWidth
            onClick={handleGoogleOAuth}
            loading={oauthLoading}
            disabled={loading}
            className="bg-white text-gray-900 hover:bg-gray-100"
          >
            Continue with Google
          </Button>

          <Divider label="OR" labelPosition="center" className="my-2" />

          {/* Password Login Section */}
          {mode === 'password' && (
            <div>
              <form onSubmit={handlePasswordLogin}>
                <Stack gap="md">
                  <TextInput
                    label="Email"
                    placeholder="your@email.com"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    leftSection={<IconMail size={16} />}
                  />
                  <TextInput
                    label="Password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    leftSection={<IconLock size={16} />}
                  />
                  <Button
                    type="submit"
                    fullWidth
                    loading={loading}
                    leftSection={<IconLock size={18} />}
                  >
                    Sign In
                  </Button>
                  <Divider label="OR" labelPosition="center" />
                  <Button
                    variant="light"
                    fullWidth
                    onClick={(e) => {
                      e.preventDefault();
                      setMode('magic-link');
                    }}
                    leftSection={<IconMail size={18} />}
                    className="border border-teal-600/30 hover:bg-teal-600/10"
                  >
                    Sign in with Magic Link
                  </Button>
                  <div className="text-center">
                    <Button
                      variant="subtle"
                      size="xs"
                      onClick={() => setMode('signup')}
                      className="text-gray-400 hover:text-white"
                    >
                      Create new account
                    </Button>
                  </div>
                </Stack>
              </form>
            </div>
          )}

          {/* Magic Link Section */}
          {mode === 'magic-link' && (
            <div>
              <form onSubmit={handleMagicLink}>
                <Stack gap="md">
                  <div>
                    <TextInput
                      label="Email"
                      placeholder="your@email.com"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      leftSection={<IconMail size={16} />}
                    />
                    <Alert color="blue" mt="xs" className="bg-blue-900/20 border-blue-700/30">
                      <Text size="xs" className="text-gray-300">
                        <strong>What's a magic link?</strong> We'll send you an email with a special
                        link. Just click it to sign in instantly - no password needed! It's secure
                        and convenient.
                      </Text>
                    </Alert>
                  </div>
                  <Button
                    type="submit"
                    fullWidth
                    loading={loading}
                    leftSection={<IconMail size={18} />}
                  >
                    Send Magic Link
                  </Button>
                  <div className="text-center">
                    <Button
                      variant="subtle"
                      size="xs"
                      onClick={() => setMode('password')}
                      className="text-gray-400 hover:text-white"
                    >
                      Use password instead
                    </Button>
                  </div>
                </Stack>
              </form>
            </div>
          )}

          {/* Sign Up Section */}
          {mode === 'signup' && (
            <div>
              <form onSubmit={handleSignUp}>
                <Stack gap="md">
                  <TextInput
                    label="Email"
                    placeholder="your@email.com"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    leftSection={<IconMail size={16} />}
                  />
                  <TextInput
                    label="Password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    leftSection={<IconLock size={16} />}
                    description="Must be at least 6 characters"
                  />
                  <Button
                    type="submit"
                    fullWidth
                    loading={loading}
                    leftSection={<IconLock size={18} />}
                  >
                    Create Account
                  </Button>
                  <div className="text-center">
                    <Button
                      variant="subtle"
                      size="xs"
                      onClick={() => setMode('password')}
                      className="text-gray-400 hover:text-white"
                    >
                      Already have an account? Sign in
                    </Button>
                  </div>
                </Stack>
              </form>
            </div>
          )}
        </Stack>
      </Paper>
    </div>
  );
};
