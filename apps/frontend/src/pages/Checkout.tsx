import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { Container, Text, Stack, Loader, Alert, Button, Group, Paper, Title } from '@mantine/core';
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
    let isMounted = true;

    const createCheckoutSession = async () => {
      // Don't create if we already have a client secret
      if (clientSecret) {
        return;
      }

      if (!publishableKey) {
        console.error('VITE_STRIPE_PUBLISHABLE_KEY is not set. Current env:', {
          hasKey: !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
          keyLength: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.length || 0,
          mode: import.meta.env.MODE,
        });
        if (isMounted) {
          setError('Stripe is not configured. Please contact support.');
          setLoading(false);
        }
        return;
      }

      try {
        if (isMounted) {
          setLoading(true);
        }
        const response = await apiClient.createCheckoutSession(currency, tier as any);
        if (isMounted) {
          setClientSecret(response.clientSecret);
        }
      } catch (err: any) {
        console.error('Failed to create checkout session:', err);
        if (isMounted) {
          setError(err.message || 'Failed to initialize checkout. Please try again.');
          notifications.show({
            title: 'Error',
            message: err.message || 'Failed to initialize checkout',
            color: 'red',
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    createCheckoutSession();

    return () => {
      isMounted = false;
    };
  }, [currency, tier, clientSecret]);

  // Check if we're returning from Stripe with a session_id
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      // Payment completed - redirect to success
      navigate('/billing/success');
    }
  }, [searchParams, navigate]);

  return (
    <Container size="lg" py="md" className="px-xs sm:px-md">
      <Paper shadow="md" p="md" className="bg-[#1a1a1a]">
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Title order={2} className="text-white">
              Complete Payment
            </Title>
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => navigate('/billing/cancel')}
              className="text-gray-400 hover:text-white"
            >
              Cancel
            </Button>
          </Group>

          {!stripePromise || !publishableKey ? (
            <Alert icon={<IconAlertCircle size={16} />} title="Configuration Error" color="red">
              Stripe is not configured. Please set VITE_STRIPE_PUBLISHABLE_KEY environment variable.
            </Alert>
          ) : loading ? (
            <Stack gap="md" align="center" py="xl">
              <Loader color="teal" size="lg" />
              <Text size="sm" className="text-gray-300">
                Loading checkout...
              </Text>
            </Stack>
          ) : error ? (
            <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
              {error}
            </Alert>
          ) : !clientSecret ? (
            <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
              Failed to initialize checkout session. Please try again.
            </Alert>
          ) : (
            <div className="min-h-[600px] w-full" key={clientSecret}>
              <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          )}
        </Stack>
      </Paper>
    </Container>
  );
};
