import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, TextInput, Tabs, Paper, Title, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useAuth } from '@/hooks/useAuth';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithEmail, signInWithPassword, signUp } = useAuth();
  const navigate = useNavigate();

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmail(email);
      notifications.show({
        title: 'Check your email',
        message: 'We sent you a magic link to sign in.',
        color: 'teal',
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
    setLoading(true);
    try {
      await signUp(email, password);
      notifications.show({
        title: 'Success',
        message: 'Please check your email to verify your account',
        color: 'green',
      });
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

        <Tabs defaultValue="magic-link">
          <Tabs.List>
            <Tabs.Tab value="magic-link">Magic Link</Tabs.Tab>
            <Tabs.Tab value="password">Password</Tabs.Tab>
            <Tabs.Tab value="signup">Sign Up</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="magic-link" pt="md">
            <form onSubmit={handleMagicLink}>
              <TextInput
                label="Email"
                placeholder="your@email.com"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                mb="md"
              />
              <Button type="submit" fullWidth loading={loading}>
                Send Magic Link
              </Button>
            </form>
          </Tabs.Panel>

          <Tabs.Panel value="password" pt="md">
            <form onSubmit={handlePasswordLogin}>
              <TextInput
                label="Email"
                placeholder="your@email.com"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                mb="md"
              />
              <TextInput
                label="Password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                mb="md"
              />
              <Button type="submit" fullWidth loading={loading}>
                Sign In
              </Button>
            </form>
          </Tabs.Panel>

          <Tabs.Panel value="signup" pt="md">
            <form onSubmit={handleSignUp}>
              <TextInput
                label="Email"
                placeholder="your@email.com"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                mb="md"
              />
              <TextInput
                label="Password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                mb="md"
              />
              <Button type="submit" fullWidth loading={loading}>
                Sign Up
              </Button>
            </form>
          </Tabs.Panel>
        </Tabs>
      </Paper>
    </div>
  );
};
