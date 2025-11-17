import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  TextInput,
  Paper,
  Text,
  Stack,
  Divider,
  Alert,
  Modal,
  Checkbox,
  ScrollArea,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useAuth } from '@/hooks/useAuth';
import { IconMail, IconLock, IconEye, IconEyeOff } from '@tabler/icons-react';
import { supabase } from '@/lib/supabase';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<boolean>(false);
  const [mode, setMode] = useState<'password' | 'magic-link' | 'signup'>('password');
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [pendingAction, setPendingAction] = useState<'signup' | 'oauth' | 'magic-link' | null>(
    null
  );
  const { signInWithEmail, signInWithPassword, signUp } = useAuth();
  const navigate = useNavigate();

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      notifications.show({
        title: 'Error',
        message: 'Please enter your email address',
        color: 'red',
      });
      return;
    }
    // Show terms modal first (magic link can create new accounts)
    setPendingAction('magic-link');
    setTermsModalOpen(true);
  };

  const executeMagicLink = async () => {
    setLoading(true);
    setTermsModalOpen(false);
    try {
      await signInWithEmail(email);
      notifications.show({
        title: 'Check your email',
        message: 'We sent you a magic link. Click it to sign in instantly - no password needed!',
        color: 'teal',
        autoClose: 10000,
      });
      setTermsAgreed(false);
      setPendingAction(null);
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
      const session = await signInWithPassword(email, password);
      if (session) {
        // Success - navigate immediately
        navigate('/');
      } else {
        // No session returned - this shouldn't happen, but handle it
        notifications.show({
          title: 'Error',
          message: 'Login succeeded but no session was created',
          color: 'red',
        });
        setLoading(false);
      }
      // Loading will be cleared by navigation/unmount
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to sign in',
        color: 'red',
      });
      setLoading(false);
    }
  };

  const validatePasswords = () => {
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    if (confirmPassword && password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleSignUpClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePasswords()) {
      notifications.show({
        title: 'Error',
        message: passwordError || 'Please check your password fields',
        color: 'red',
      });
      return;
    }
    // Show terms modal first
    setPendingAction('signup');
    setTermsModalOpen(true);
  };

  const handleSignUp = async () => {
    if (!termsAgreed) {
      notifications.show({
        title: 'Terms Required',
        message: 'You must agree to the Terms and Conditions to create an account.',
        color: 'red',
      });
      return;
    }

    setLoading(true);
    setTermsModalOpen(false);
    try {
      await signUp(email, password);
      notifications.show({
        title: 'Success',
        message: 'Account created! Please check your email to verify your account.',
        color: 'green',
      });
      // Switch to password login after signup
      setMode('password');
      setTermsAgreed(false);
      setPendingAction(null);
      setPassword('');
      setConfirmPassword('');
      setPasswordError('');
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

  const handleAgreeAndContinue = () => {
    if (!termsAgreed) {
      notifications.show({
        title: 'Terms Required',
        message: 'You must agree to the Terms and Conditions to continue.',
        color: 'red',
      });
      return;
    }

    // Execute the pending action
    if (pendingAction === 'signup') {
      handleSignUp();
    } else if (pendingAction === 'oauth') {
      executeGoogleOAuth();
    } else if (pendingAction === 'magic-link') {
      executeMagicLink();
    }
  };

  const handleGoogleOAuth = async () => {
    // Show terms modal first (OAuth can create new accounts)
    setPendingAction('oauth');
    setTermsModalOpen(true);
  };

  const executeGoogleOAuth = async () => {
    setOauthLoading(true);
    setTermsModalOpen(false);
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
      setTermsAgreed(false);
      setPendingAction(null);
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
          <div className="flex items-center justify-center mb-4">
            <img
              src="/assets/logos/myrevuhq.png"
              alt="MyRevuHQ"
              className="h-16 w-auto object-contain"
            />
          </div>
          <Text c="dimmed" size="sm" ta="center" className="text-gray-400">
            Sign in to your account
          </Text>
        </div>

        <Stack gap="md">
          {/* OAuth Button */}
          <Button
            leftSection={
              <img
                src="/assets/logos/googlelogo.png"
                alt="Google"
                className="h-5 w-5 object-contain"
              />
            }
            variant="default"
            fullWidth
            onClick={handleGoogleOAuth}
            loading={oauthLoading}
            disabled={loading}
            color="teal"
            className="!font-medium !h-11"
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
                    label="Confirm Password"
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
                    error={
                      passwordError && password !== confirmPassword && confirmPassword
                        ? passwordError
                        : undefined
                    }
                  />
                  <Button
                    type="button"
                    fullWidth
                    loading={loading}
                    leftSection={<IconLock size={18} />}
                    onClick={handleSignUpClick}
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

      {/* Terms and Conditions Modal */}
      <Modal
        opened={termsModalOpen}
        onClose={() => {
          setTermsModalOpen(false);
          setTermsAgreed(false);
          setPendingAction(null);
        }}
        title="Terms and Conditions"
        size="lg"
        centered
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        classNames={{
          content: 'bg-[#1a1a1a] text-white',
          header: 'bg-[#1a1a1a] text-white',
          title: 'text-white',
          close: 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white',
        }}
      >
        <Stack gap="md">
          <ScrollArea h={400}>
            <Text size="sm" className="text-gray-300 whitespace-pre-line">
              By creating an account or signing in, you agree to our Terms and Conditions and
              Privacy Policy.
              {'\n\n'}
              Please review our terms before proceeding:
              {'\n\n'}• You must be of legal age in your jurisdiction to use this service
              {'\n'}• You are responsible for maintaining the security of your account
              {'\n'}• You agree to use the service in compliance with all applicable laws
              {'\n'}• We reserve the right to suspend or terminate accounts that violate our terms
              {'\n\n'}
              For the full Terms and Conditions, please visit:{' '}
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-400 hover:text-teal-300 underline"
              >
                Terms and Conditions
              </a>
              {'\n\n'}
              For our Privacy Policy, please visit:{' '}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-400 hover:text-teal-300 underline"
              >
                Privacy Policy
              </a>
            </Text>
          </ScrollArea>
          <Checkbox
            label={
              <Text size="sm" className="text-gray-300">
                I have read and agree to the{' '}
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-400 hover:text-teal-300 underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Terms and Conditions
                </a>{' '}
                and{' '}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-400 hover:text-teal-300 underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Privacy Policy
                </a>
              </Text>
            }
            checked={termsAgreed}
            onChange={(e) => setTermsAgreed(e.currentTarget.checked)}
            className="mt-4"
          />
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              fullWidth
              onClick={() => {
                setTermsModalOpen(false);
                setTermsAgreed(false);
                setPendingAction(null);
              }}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              onClick={handleAgreeAndContinue}
              disabled={!termsAgreed}
              loading={loading || oauthLoading}
              className="!h-auto !py-3 min-h-[3.5rem]"
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold">
                  {pendingAction === 'signup'
                    ? 'Agree & Create'
                    : pendingAction === 'oauth'
                      ? 'Agree & Continue'
                      : 'Agree & Send'}
                </span>
                <span className="text-xs font-normal opacity-90">
                  {pendingAction === 'signup'
                    ? 'Account'
                    : pendingAction === 'oauth'
                      ? 'with Google'
                      : 'Magic Link'}
                </span>
              </div>
            </Button>
          </div>
        </Stack>
      </Modal>
    </div>
  );
};
