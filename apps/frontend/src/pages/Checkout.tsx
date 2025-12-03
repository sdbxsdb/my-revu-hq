import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { Container, Text, Stack, Loader, Alert, Button, Group } from '@mantine/core';
import { IconAlertCircle, IconArrowLeft } from '@tabler/icons-react';
import { apiClient } from '@/lib/api';
import { notifications } from '@mantine/notifications';

// Get publishable key from environment
const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Initialize Stripe with publishable key (only if key exists)
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

export const Checkout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currency = searchParams.get('currency') || undefined;
  const tier = searchParams.get('tier') || undefined;

  useEffect(() => {
    const createCheckoutSession = async () => {
      if (!publishableKey) {
        setError('Stripe is not configured. Please contact support.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await apiClient.createCheckoutSession(currency, tier as any);
        setClientSecret(response.clientSecret);
      } catch (err: any) {
        console.error('Failed to create checkout session:', err);
        setError(err.message || 'Failed to initialize checkout. Please try again.');
        notifications.show({
          title: 'Error',
          message: err.message || 'Failed to initialize checkout',
          color: 'red',
        });
      } finally {
        setLoading(false);
      }
    };

    createCheckoutSession();
  }, [currency, tier]);

  const handleComplete = () => {
    // Redirect to success page
    navigate('/billing/success');
  };

  // Check if we're returning from Stripe with a session_id
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId && clientSecret) {
      // Payment completed - redirect to success
      navigate('/billing/success');
    }
  }, [searchParams, clientSecret, navigate]);

  if (!stripePromise || !publishableKey) {
    return (
      <Container size="md" py="xl">
        <Alert icon={<IconAlertCircle size={16} />} title="Configuration Error" color="red">
          Stripe is not configured. Please set VITE_STRIPE_PUBLISHABLE_KEY environment variable.
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container size="md" py="xl">
        <Stack gap="md" align="center" py="xl">
          <Loader color="teal" size="lg" />
          <Text size="sm" className="text-gray-300">
            Loading checkout...
          </Text>
        </Stack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="md" py="xl">
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
          {error}
        </Alert>
      </Container>
    );
  }

  if (!clientSecret) {
    return (
      <Container size="md" py="xl">
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
          Failed to initialize checkout session. Please try again.
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="md">
        <Group>
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => navigate('/billing/cancel')}
            className="text-gray-400 hover:text-white"
          >
            Cancel
          </Button>
        </Group>
        <div className="min-h-[600px] w-full">
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{ clientSecret }}
            onComplete={handleComplete}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </Stack>
    </Container>
  );
};

