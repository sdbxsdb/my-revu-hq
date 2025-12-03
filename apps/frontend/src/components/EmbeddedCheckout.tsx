import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { Modal, Text, Stack } from '@mantine/core';

// Get publishable key from environment
const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Debug: Log if key is missing (only in dev)
if (import.meta.env.DEV && !publishableKey) {
  console.warn(
    '⚠️ VITE_STRIPE_PUBLISHABLE_KEY is not set. Check your .env.local file in the frontend directory.'
  );
}

// Initialize Stripe with publishable key (only if key exists)
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

interface EmbeddedCheckoutModalProps {
  opened: boolean;
  onClose: () => void;
  clientSecret: string;
  onSuccess?: () => void;
}

export const EmbeddedCheckoutModal = ({
  opened,
  onClose,
  clientSecret,
  onSuccess,
}: EmbeddedCheckoutModalProps) => {
  if (!stripePromise || !publishableKey) {
    return (
      <Modal
        opened={opened}
        onClose={onClose}
        title={<Text className="text-white font-semibold text-lg">Payment</Text>}
        centered
        size="lg"
        styles={{
          content: {
            backgroundColor: '#1a1a1a',
            border: '1px solid #2a2a2a',
          },
          header: {
            backgroundColor: '#1a1a1a',
            borderBottom: '1px solid #2a2a2a',
          },
          close: {
            color: '#fff',
            '&:hover': {
              backgroundColor: '#2a2a2a',
            },
          },
        }}
      >
        <Stack gap="md" align="center" py="xl">
          <Text size="sm" className="text-gray-300 text-center">
            Stripe is not configured. Please set VITE_STRIPE_PUBLISHABLE_KEY environment variable.
          </Text>
        </Stack>
      </Modal>
    );
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text className="text-white font-semibold text-lg">Complete Payment</Text>}
      centered
      size="lg"
      styles={{
        content: {
          backgroundColor: '#1a1a1a',
          border: '1px solid #2a2a2a',
          maxHeight: '90vh',
        },
        header: {
          backgroundColor: '#1a1a1a',
          borderBottom: '1px solid #2a2a2a',
        },
        body: {
          padding: 0,
          height: 'calc(90vh - 60px)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        },
        close: {
          color: '#fff',
          '&:hover': {
            backgroundColor: '#2a2a2a',
          },
        },
      }}
    >
      <div className="w-full" style={{ height: '100%', minHeight: '500px' }}>
        <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </div>
    </Modal>
  );
};
