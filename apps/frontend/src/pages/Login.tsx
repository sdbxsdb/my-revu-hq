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
  Title,
  Container,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useAuth } from '@/hooks/useAuth';
import {
  IconMail,
  IconLock,
  IconEye,
  IconEyeOff,
  IconSparkles,
  IconUserPlus,
  IconLogin,
} from '@tabler/icons-react';
import { supabase } from '@/lib/supabase';
import { apiClient } from '@/lib/api';

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
  const [forgotPasswordModalOpen, setForgotPasswordModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
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

  const getEmailProviderUrl = (emailAddress: string): string | null => {
    const domain = emailAddress.split('@')[1]?.toLowerCase();
    if (!domain) return null;

    // Common email providers
    if (domain.includes('gmail')) return 'https://mail.google.com';
    if (
      domain.includes('outlook') ||
      domain.includes('hotmail') ||
      domain.includes('live') ||
      domain.includes('msn')
    )
      return 'https://outlook.live.com';
    if (domain.includes('yahoo')) return 'https://mail.yahoo.com';
    if (domain.includes('icloud') || domain.includes('me.com') || domain.includes('mac.com'))
      return 'https://www.icloud.com/mail';
    if (domain.includes('protonmail') || domain.includes('proton')) return 'https://mail.proton.me';
    if (domain.includes('aol')) return 'https://mail.aol.com';

    // For custom domains (e.g., user@company.com), we can't reliably detect the provider
    // Common setups: Google Workspace uses mail.google.com, Microsoft 365 uses outlook.office.com
    // But we can't know for sure, so we return null and don't show the link
    // Note: mailto: would open their email client to compose a new email, not their inbox
    return null;
  };

  const executeMagicLink = async () => {
    setLoading(true);
    setTermsModalOpen(false);
    try {
      await signInWithEmail(email);
      const emailProviderUrl = getEmailProviderUrl(email);
      const message = emailProviderUrl ? (
        <div>
          <div style={{ marginBottom: '8px' }}>
            We sent you a magic link. Click it to sign in instantly - no password needed!
          </div>
          <a
            href={emailProviderUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#14b8a6',
              textDecoration: 'underline',
              fontWeight: 500,
            }}
          >
            Open your email
          </a>
        </div>
      ) : (
        'We sent you a magic link. Click it to sign in instantly - no password needed!'
      );

      notifications.show({
        title: 'Check your email',
        message: message,
        color: 'teal',
        autoClose: 10000,
      });
      setTermsAgreed(false);
      setPendingAction(null);
    } catch (error: any) {
      // Check if error is due to account not existing (magic link can create accounts)
      const errorMessage = error.message || '';
      const isAccountNotFound =
        errorMessage.toLowerCase().includes('invalid login credentials') ||
        errorMessage.toLowerCase().includes('user not found') ||
        error.status === 400;

      if (isAccountNotFound) {
        notifications.show({
          title: 'Account Not Found',
          message:
            'No account found with this email. Please create an account first using "Create new account".',
          color: 'yellow',
          autoClose: 8000,
        });
      } else {
        notifications.show({
          title: 'Error',
          message: error.message || 'Failed to send magic link',
          color: 'red',
        });
      }
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
        navigate('/customers');
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords first
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

  const executeSignUp = async () => {
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
      // First, check if email already exists in our database
      try {
        const emailCheck = await apiClient.checkEmailExists(email);
        if (emailCheck.exists) {
          // Check if account was created recently (within last 5 seconds) - might be from this signup attempt
          if (emailCheck.createdAt) {
            const createdAt = new Date(emailCheck.createdAt);
            const now = new Date();
            const secondsSinceCreation = (now.getTime() - createdAt.getTime()) / 1000;

            // If account was created more than 5 seconds ago, it's definitely an existing account
            if (secondsSinceCreation > 5) {
              notifications.show({
                title: 'Account Already Exists',
                message:
                  'An account with this email already exists. Please sign in instead, or use "Forgot Password" if you don\'t remember your password.',
                color: 'yellow',
                autoClose: 8000,
              });
              // Switch to password login mode to help user
              setMode('password');
              setLoading(false);
              return;
            }
          } else {
            // Email exists but no createdAt (shouldn't happen, but handle it)
            notifications.show({
              title: 'Account Already Exists',
              message: 'An account with this email already exists. Please sign in instead.',
              color: 'yellow',
              autoClose: 8000,
            });
            setMode('password');
            setLoading(false);
            return;
          }
        }
      } catch (checkError) {
        // If check fails, continue with signup anyway
      }

      // Proceed with signup
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
      // Check if error is due to duplicate email
      const errorMessage = error.message || '';
      const errorCode = error.code || error.status || '';
      const isDuplicateEmail =
        errorMessage.toLowerCase().includes('already registered') ||
        errorMessage.toLowerCase().includes('user already exists') ||
        errorMessage.toLowerCase().includes('email already registered') ||
        errorMessage.toLowerCase().includes('email address is already in use') ||
        errorMessage.toLowerCase().includes('user with this email already exists') ||
        errorCode === 'signup_disabled' ||
        errorCode === 'user_already_registered' ||
        error.status === 422 ||
        error.status === 400;

      if (isDuplicateEmail) {
        notifications.show({
          title: 'Account Already Exists',
          message:
            'An account with this email already exists. Please sign in instead, or use "Forgot Password" if you don\'t remember your password.',
          color: 'yellow',
          autoClose: 8000,
        });
        // Switch to password login mode to help user
        setMode('password');
      } else {
        notifications.show({
          title: 'Error',
          message: error.message || 'Failed to sign up. Please try again.',
          color: 'red',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAgreeAndContinue = async () => {
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
      executeSignUp();
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

  const handleForgotPassword = async () => {
    if (!resetEmail || !resetEmail.includes('@')) {
      notifications.show({
        title: 'Error',
        message: 'Please enter a valid email address',
        color: 'red',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setResetEmailSent(true);
      const emailProviderUrl = getEmailProviderUrl(resetEmail);
      const message = emailProviderUrl ? (
        <div>
          <div style={{ marginBottom: '8px' }}>
            We sent you a password reset link. Click it to set a new password.
          </div>
          <a
            href={emailProviderUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#14b8a6',
              textDecoration: 'underline',
              fontWeight: 500,
            }}
          >
            Open your email
          </a>
        </div>
      ) : (
        'We sent you a password reset link. Click it to set a new password.'
      );

      notifications.show({
        title: 'Check your email',
        message: message,
        color: 'teal',
        autoClose: 10000,
      });
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to send password reset email',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const executeGoogleOAuth = async () => {
    setOauthLoading(true);
    setTermsModalOpen(false);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/customers`,
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

  const getModeTitle = () => {
    switch (mode) {
      case 'signup':
        return 'Create New Account';
      case 'password':
        return 'Sign In';
      case 'magic-link':
        return 'Magic Link';
      default:
        return 'Sign in or create your account';
    }
  };

  const getModeDescription = () => {
    switch (mode) {
      case 'signup':
        return 'Create an account with email and password';
      case 'password':
        return 'Sign in with your email and password';
      case 'magic-link':
        return "We'll send you a link to sign in—no password needed!";
      default:
        return 'New users will have an account created automatically';
    }
  };

  const getModeIcon = () => {
    switch (mode) {
      case 'signup':
        return <IconUserPlus size={20} />;
      case 'password':
        return <IconLogin size={20} />;
      case 'magic-link':
        return <IconSparkles size={20} />;
      default:
        return null;
    }
  };

  return (
    <Container size="md" py="md" px="xs">
      <Paper shadow="xl" p="md" className="w-full max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="transition-all duration-300 mb-3">
            {mode === 'password' || mode === 'signup' || mode === 'magic-link' ? (
              <div className="flex items-center justify-center gap-2 mb-2">
                {getModeIcon()}
                <Title order={2} className="text-white text-xl font-semibold">
                  {getModeTitle()}
                </Title>
              </div>
            ) : (
          <Text c="dimmed" size="sm" ta="center" className="text-gray-400">
            Sign in or create your account
          </Text>
            )}
          </div>
          <Text
            size="sm"
            ta="center"
            className={`transition-all duration-300 ${
              mode === 'password' || mode === 'signup' || mode === 'magic-link'
                ? 'text-teal-400 font-medium'
                : 'text-gray-500'
            }`}
          >
            {getModeDescription()}
          </Text>
        </div>

        <Stack gap="md">
          {/* OAuth and Magic Link - Both work for sign up and sign in */}
          {mode !== 'magic-link' && (
            <>
          <Button
            type="button"
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

          <Button
            type="button"
            variant="light"
            fullWidth
            onClick={(e) => {
              e.preventDefault();
              setMode('magic-link');
            }}
            leftSection={<IconMail size={18} />}
                className="border border-teal-600/30 hover:bg-teal-600/10 !h-11 transition-all"
          >
            Continue with Magic Link
          </Button>

              {!(mode === 'password' || mode === 'signup') && (
          <Alert color="blue" className="bg-blue-900/20 border-blue-700/30">
            <Text size="xs" className="text-gray-300">
                    <strong>What's a magic link?</strong> We'll send you an email with a special
                    link. Click it to sign in and sign up instantly—no password needed!
            </Text>
          </Alert>
              )}

          <Divider label="OR" labelPosition="center" className="my-2" />
            </>
          )}

          {/* Sign Up Section - Show First */}
          {mode === 'signup' && (
            <div className="animate-fade-in">
              <form onSubmit={handleSignUp}>
                <Stack gap="md">
                  <Alert color="teal" className="bg-teal-900/20 border-teal-700/30">
                    <Text size="xs" className="text-gray-300">
                      <strong>Creating a new account:</strong> Enter your email and choose a secure
                      password to get started.
                    </Text>
                  </Alert>
                  <TextInput
                    label="Email Address"
                    placeholder="your@email.com"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    leftSection={<IconMail size={16} />}
                    description="We'll use this to create and manage your account"
                  />
                  <TextInput
                    label="Create Password"
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
                    description="Re-enter your password to confirm"
                    error={passwordError ? passwordError : undefined}
                  />
                  <Button
                    type="submit"
                    fullWidth
                    loading={loading}
                    leftSection={<IconUserPlus size={18} />}
                    size="lg"
                    className="!h-12"
                  >
                    Create Account
                  </Button>
                  <div className="text-center pt-2">
                    <Text size="sm" className="text-gray-400">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('password');
                          setPassword('');
                          setConfirmPassword('');
                          setPasswordError('');
                        }}
                        className="text-teal-400 hover:text-teal-300 underline font-medium"
                      >
                        Sign in
                      </button>
                    </Text>
                  </div>
                </Stack>
              </form>
            </div>
          )}

          {/* Password Login Section */}
          {mode === 'password' && (
            <div className="animate-fade-in">
              <form onSubmit={handlePasswordLogin}>
                <Stack gap="md">
                  <Alert color="blue" className="bg-blue-900/20 border-blue-700/30">
                    <Text size="xs" className="text-gray-300">
                      <strong>Signing in:</strong> Enter your email and password to access your
                      account.
                    </Text>
                  </Alert>
                  <TextInput
                    label="Email Address"
                    placeholder="your@email.com"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    leftSection={<IconMail size={16} />}
                    description="Enter the email you used to create your account"
                  />
                  <div>
                    <TextInput
                      label="Password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      leftSection={<IconLock size={16} />}
                      description="Enter your account password"
                    />
                    <div className="text-right mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setResetEmail(email);
                          setForgotPasswordModalOpen(true);
                        }}
                        className="text-sm text-teal-400 hover:text-teal-300 underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    fullWidth
                    loading={loading}
                    leftSection={<IconLogin size={18} />}
                    size="lg"
                    className="!h-12"
                  >
                    Sign In
                  </Button>
                  <div className="text-center pt-2">
                    <Text size="sm" className="text-gray-400">
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('signup');
                          setPassword('');
                          setConfirmPassword('');
                          setPasswordError('');
                        }}
                        className="text-teal-400 hover:text-teal-300 underline font-medium"
                      >
                        Create account
                      </button>
                    </Text>
                  </div>
                </Stack>
              </form>
            </div>
          )}

          {/* Magic Link Section */}
          {mode === 'magic-link' && (
            <div className="animate-fade-in">
              <form onSubmit={handleMagicLink}>
                <Stack gap="md">
                  <Alert color="purple" className="bg-purple-900/20 border-purple-700/30">
                    <Text size="xs" className="text-gray-300">
                      <strong>Magic Link:</strong> We'll send you an email with a special link.
                      Click it to sign in or sign up instantly—no password needed!
                    </Text>
                  </Alert>
                  <TextInput
                    label="Email Address"
                    placeholder="your@email.com"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    leftSection={<IconMail size={16} />}
                    description="We'll send the magic link to this email address"
                  />
                  <Button
                    type="submit"
                    fullWidth
                    loading={loading}
                    leftSection={<IconSparkles size={18} />}
                    size="lg"
                    className="!h-12"
                  >
                    Send Magic Link
                  </Button>
                  <div className="text-center pt-2 space-y-2">
                    <Text size="sm" className="text-gray-400">
                      Prefer password?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('signup');
                        }}
                        className="text-teal-400 hover:text-teal-300 underline font-medium"
                      >
                        Sign up with password
                      </button>
                      {' or '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('password');
                        }}
                        className="text-teal-400 hover:text-teal-300 underline font-medium"
                      >
                        sign in with password
                      </button>
                    </Text>
                  </div>
                </Stack>
              </form>
            </div>
          )}
        </Stack>

        {/* Footer with Privacy Policy and Terms Links */}
        <div className="mt-6 pt-4 border-t border-[#2a2a2a] text-center">
          <Text size="xs" className="text-gray-400">
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-400 hover:text-teal-300 hover:underline"
            >
              Privacy Policy
            </a>
            {' • '}
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-400 hover:text-teal-300 hover:underline"
            >
              Terms and Conditions
            </a>
          </Text>
        </div>
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
          header: 'bg-[#1a1a1a] text-white flex-shrink-0',
          title: 'text-white',
          close: 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white',
          body: 'p-0 flex flex-col',
        }}
      >
        <Stack gap="md" className="p-0">
          <Stack gap="md">
            <div>
              <Text size="sm" className="text-white font-semibold mb-2">
                Your privacy matters:
              </Text>
              <Text size="sm" className="text-gray-300">
                We use your email for authentication and account management. We don't share your
                information with third parties, and you can delete your account at any time.
              </Text>
            </div>

            <div>
              <Text size="sm" className="text-gray-300">
                By continuing, you agree to our{' '}
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-400 hover:text-teal-300 underline"
                >
                  Terms and Conditions
                </a>{' '}
                and{' '}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-400 hover:text-teal-300 underline"
                >
                  Privacy Policy
                </a>
                .
            </Text>
            </div>
          </Stack>
          <div className="flex-shrink-0 pt-4 border-t border-[#2a2a2a]">
            <Checkbox
              label={
                <Text size="sm" className="text-gray-300">
                  I have read and agree to the Terms and Conditions and Privacy Policy
                </Text>
              }
              checked={termsAgreed}
              onChange={(e) => setTermsAgreed(e.currentTarget.checked)}
            />
            <div className="flex flex-col gap-3 mt-4">
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
            </div>
          </div>
        </Stack>
      </Modal>

      {/* Forgot Password Modal */}
      <Modal
        opened={forgotPasswordModalOpen}
        onClose={() => {
          setForgotPasswordModalOpen(false);
          setResetEmailSent(false);
          setResetEmail('');
        }}
        title="Reset Password"
        centered
        classNames={{
          body: 'p-0',
        }}
      >
        <Stack gap="md">
          {!resetEmailSent ? (
            <>
              <Text size="sm" className="text-gray-300">
                Enter your email address and we'll send you a link to reset your password.
              </Text>
              <TextInput
                label="Email"
                placeholder="your@email.com"
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                leftSection={<IconMail size={16} />}
              />
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <Button
                  variant="light"
                  onClick={() => {
                    setForgotPasswordModalOpen(false);
                    setResetEmailSent(false);
                    setResetEmail('');
                  }}
                  fullWidth
                >
                  Cancel
                </Button>
                <Button onClick={handleForgotPassword} loading={loading} fullWidth>
                  Send Reset Link
                </Button>
              </div>
            </>
          ) : (
            <>
              <Alert color="teal" icon={<IconMail size={16} />}>
                <Text size="sm" className="text-gray-300">
                  We've sent a password reset link to <strong>{resetEmail}</strong>. Check your
                  email and click the link to set a new password.
                </Text>
              </Alert>
              <Button
                onClick={() => {
                  setForgotPasswordModalOpen(false);
                  setResetEmailSent(false);
                  setResetEmail('');
                }}
                fullWidth
              >
                Close
              </Button>
            </>
          )}
        </Stack>
      </Modal>
    </Container>
  );
};
