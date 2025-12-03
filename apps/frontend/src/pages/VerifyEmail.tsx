import { useState, useEffect } from 'react';
import { Paper, Title, Text, Container, Stack, Button, Alert } from '@mantine/core';
import { IconMail, IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';

export const VerifyEmail = () => {
  const { user, signOut, supabase } = useAuth();
  const navigate = useNavigate();
  const [resending, setResending] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);

  // Check if user is already verified (shouldn't be on this page)
  useEffect(() => {
    if (user?.email_confirmed_at) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Auto-check verification status every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      await checkVerification();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const checkVerification = async () => {
    if (!user) return;

    setCheckingVerification(true);
    try {
      // Refresh the user session to get latest email_confirmed_at
      const { data, error } = await supabase.auth.getUser();
      
      if (error) throw error;

      if (data.user?.email_confirmed_at) {
        notifications.show({
          title: 'Email Verified!',
          message: 'Your email has been verified. Redirecting...',
          color: 'green',
          icon: <IconCheck size={16} />,
        });
        
        // Wait a moment then redirect
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      }
    } catch (error) {
      console.error('Error checking verification:', error);
    } finally {
      setCheckingVerification(false);
    }
  };

  const handleResendEmail = async () => {
    if (!user?.email) return;

    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });

      if (error) throw error;

      notifications.show({
        title: 'Email Sent',
        message: 'Verification email has been sent. Please check your inbox.',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to resend verification email',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
    } finally {
      setResending(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <Container size="sm" py="xl" className="min-h-screen flex items-center">
      <Paper shadow="md" p="xl" className="bg-[#1a1a1a] w-full">
        <Stack gap="lg">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-teal-500/20 p-4">
              <IconMail size={48} className="text-teal-400" />
            </div>
          </div>

          <div className="text-center">
            <Title order={1} className="text-white mb-3">
              Verify Your Email
            </Title>
            <Text size="sm" className="text-gray-400 mb-6">
              We've sent a verification link to:
            </Text>
            <Text size="md" className="text-white font-semibold mb-6">
              {user.email}
            </Text>
          </div>

          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Email verification required"
            color="yellow"
            variant="light"
          >
            <Text size="sm">
              You must verify your email address before you can access MyRevuHQ. Please check
              your inbox and click the verification link.
            </Text>
          </Alert>

          <Stack gap="md">
            <Text size="sm" className="text-gray-300">
              <strong>Didn't receive the email?</strong>
            </Text>
            <ul className="list-disc list-inside text-gray-400 text-sm space-y-1 ml-2">
              <li>Check your spam or junk folder</li>
              <li>Make sure you entered the correct email address</li>
              <li>Wait a few minutes - emails can be delayed</li>
              <li>Click the button below to resend</li>
            </ul>
          </Stack>

          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              onClick={handleResendEmail}
              loading={resending}
              leftSection={<IconMail size={20} />}
              variant="light"
              color="teal"
            >
              Resend Verification Email
            </Button>

            <Button
              size="lg"
              onClick={checkVerification}
              loading={checkingVerification}
              leftSection={<IconCheck size={20} />}
              variant="outline"
              color="teal"
            >
              I've Verified - Check Now
            </Button>
          </div>

          <div className="text-center pt-4 border-t border-[#2a2a2a]">
            <Text size="sm" className="text-gray-400 mb-3">
              Wrong email address?
            </Text>
            <Button variant="subtle" color="gray" onClick={handleSignOut}>
              Sign out and try again
            </Button>
          </div>

          <div className="text-center">
            <Text size="xs" className="text-gray-500">
              This page will automatically refresh when you verify your email
              {checkingVerification && ' (checking...)'}
            </Text>
          </div>
        </Stack>
      </Paper>
    </Container>
  );
};

