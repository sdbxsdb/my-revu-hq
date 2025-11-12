import { useState, useEffect } from 'react';
import { Paper, Title, Text, Button, Tabs, Stack, Alert, Badge, Loader } from '@mantine/core';
import { IconCreditCard, IconBuildingBank, IconCheck, IconAlertCircle } from '@tabler/icons-react';
import { apiClient } from '@/lib/api';
import { notifications } from '@mantine/notifications';
import { usePayment } from '@/contexts/PaymentContext';
import CardBrandIcon from '@/components/CardBrandIcon';

export const Billing = () => {
  const { hasPaid } = usePayment();
  const [activeTab, setActiveTab] = useState<string | null>('subscription');
  const [loading, setLoading] = useState(false);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<
    'active' | 'inactive' | 'past_due' | 'canceled'
  >(hasPaid ? 'active' : 'inactive');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'direct_debit' | null>(
    hasPaid ? 'card' : null
  );
  const [nextBillingDate, setNextBillingDate] = useState<string | undefined>(
    hasPaid ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : undefined
  );
  const [cardLast4, setCardLast4] = useState<string | undefined>(hasPaid ? '4242' : undefined);
  const [cardBrand, setCardBrand] = useState<string | undefined>(hasPaid ? 'visa' : undefined);

  useEffect(() => {
    const loadData = async () => {
      await loadSubscription();

      // Handle Stripe Checkout redirect
      const params = new URLSearchParams(window.location.search);
      if (params.get('success') === 'true') {
        notifications.show({
          title: 'Success!',
          message: 'Your subscription has been activated.',
          color: 'teal',
        });
        // Clean up URL
        window.history.replaceState({}, '', '/billing');
        await loadSubscription(); // Reload subscription status
      } else if (params.get('canceled') === 'true') {
        notifications.show({
          title: 'Cancelled',
          message: 'Subscription setup was cancelled.',
          color: 'yellow',
        });
        // Clean up URL
        window.history.replaceState({}, '', '/billing');
      }
    };

    loadData();
  }, []);

  const loadSubscription = async () => {
    try {
      setLoadingSubscription(true);
      // Use payment context for now (temp toggle)
      // TODO: When backend is ready, replace this with real Stripe API call
      // Stripe's API returns payment method details (last4, brand) even though
      // we don't store full card details on our servers. The backend should:
      // 1. Get subscription from Stripe
      // 2. Get payment method from subscription.default_payment_method
      // 3. Return last4 and brand from Stripe's PaymentMethod object
      if (hasPaid) {
        setSubscriptionStatus('active');
        setPaymentMethod('card');
        setNextBillingDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());
        setCardLast4('4242'); // Demo card last 4 - will come from Stripe API
        setCardBrand('visa'); // Demo card brand - will come from Stripe API
      } else {
        setSubscriptionStatus('inactive');
        setPaymentMethod(null);
        setNextBillingDate(undefined);
        setCardLast4(undefined);
        setCardBrand(undefined);
      }

      // TODO: When backend is ready, uncomment and use real Stripe data:
      // const subscription = await apiClient.getSubscription();
      // setSubscriptionStatus(subscription.status);
      // setPaymentMethod(subscription.paymentMethod);
      // setNextBillingDate(subscription.nextBillingDate);
      // setCardLast4(subscription.cardLast4); // From Stripe PaymentMethod.card.last4
      // setCardBrand(subscription.cardBrand); // From Stripe PaymentMethod.card.brand
    } catch (error: any) {
      console.error('Failed to load subscription:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load subscription information',
        color: 'red',
      });
    } finally {
      setLoadingSubscription(false);
    }
  };

  // Update subscription status when payment toggle changes
  useEffect(() => {
    loadSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPaid]);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const response = await apiClient.createCheckoutSession();
      window.location.href = response.url;
    } catch (error: any) {
      console.error('Failed to create checkout session:', error);
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to create checkout session',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestInvoice = async () => {
    setLoading(true);
    try {
      await apiClient.requestInvoiceSetup();
      notifications.show({
        title: 'Request Submitted',
        message: 'Invoice setup requested. Our team will contact you within 1-2 business days.',
        color: 'teal',
      });
    } catch (error: any) {
      console.error('Failed to request invoice setup:', error);
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to request invoice setup',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper shadow="md" p="md" className="w-full max-w-4xl mx-auto sm:p-xl">
      <div className="mb-8">
        <Title order={2} className="text-2xl sm:text-3xl font-bold mb-2 text-white">
          Billing & Subscription
        </Title>
        <p className="text-sm text-gray-400">Manage your subscription and payment methods</p>
      </div>

      {loadingSubscription ? (
        <div className="flex justify-center p-12">
          <Loader color="teal" />
        </div>
      ) : (
        <>
          {/* Current Subscription Status */}
          {subscriptionStatus === 'active' && (
            <Alert
              icon={<IconCheck size={16} />}
              title="Active Subscription"
              color="teal"
              className="mb-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <Text size="sm" className="text-gray-300">
                    Your subscription is active. Next billing date:{' '}
                    {new Date(nextBillingDate).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                </div>
                <Badge color="teal" size="lg">
                  £10/month
                </Badge>
              </div>
            </Alert>
          )}

          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List grow>
              <Tabs.Tab
                value="subscription"
                leftSection={<IconCreditCard size={16} />}
                style={{ fontSize: '0.875rem' }}
              >
                Card
              </Tabs.Tab>
              <Tabs.Tab
                value="invoice"
                leftSection={<IconBuildingBank size={16} />}
                style={{ fontSize: '0.875rem' }}
              >
                Invoice
              </Tabs.Tab>
            </Tabs.List>

            {/* Monthly Subscription Tab */}
            <Tabs.Panel value="subscription" pt="xl">
              <Stack gap="lg">
                <div>
                  <Title order={3} className="text-xl font-bold mb-2 text-white">
                    Payment Type: Card
                  </Title>
                  <Text size="sm" className="text-gray-400 mb-4">
                    Set up automatic monthly billing with a credit or debit card. Perfect for small
                    businesses and individuals.
                  </Text>
                </div>

                {subscriptionStatus === 'active' && paymentMethod === 'card' ? (
                  <div className="p-6 bg-[#2a2a2a]/50 rounded-lg border border-[#2a2a2a]">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="flex-shrink-0">
                        <CardBrandIcon brand={cardBrand} size={64} />
                      </div>
                      <div>
                        <Text className="font-semibold text-white mb-1">Payment Method</Text>
                        <Text size="sm" className="text-gray-400">
                          Card ending in {cardLast4 || '****'}
                        </Text>
                      </div>
                    </div>
                    <div className="mb-4">
                      <Button variant="light" size="md" fullWidth>
                        Update Card
                      </Button>
                    </div>
                    <Text size="xs" className="text-gray-500 text-center mb-4">
                      Secure payment powered by Stripe. Your card details are never stored on our
                      servers.
                    </Text>
                    <Button variant="subtle" color="red" size="sm" fullWidth>
                      Cancel Subscription
                    </Button>
                  </div>
                ) : (
                  <div className="p-6 bg-[#2a2a2a]/50 rounded-lg border border-[#2a2a2a]">
                    <div className="mb-4">
                      <Text className="text-2xl font-bold text-white mb-1">£10</Text>
                      <Text size="sm" className="text-gray-400">
                        per month
                      </Text>
                    </div>
                    <ul className="list-none space-y-2 mb-6">
                      <li className="flex items-start gap-2 text-sm text-gray-300">
                        <IconCheck size={16} className="text-teal-400 mt-0.5 flex-shrink-0" />
                        <span>100 SMS messages per month</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm text-gray-300">
                        <IconCheck size={16} className="text-teal-400 mt-0.5 flex-shrink-0" />
                        <span>Unlimited customers</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm text-gray-300">
                        <IconCheck size={16} className="text-teal-400 mt-0.5 flex-shrink-0" />
                        <span>Automatic monthly billing</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm text-gray-300">
                        <IconCheck size={16} className="text-teal-400 mt-0.5 flex-shrink-0" />
                        <span>Cancel anytime</span>
                      </li>
                    </ul>
                    <Button
                      fullWidth
                      size="lg"
                      onClick={handleSubscribe}
                      loading={loading}
                      className="font-semibold"
                    >
                      Subscribe with Card
                    </Button>
                    <Text size="xs" className="text-gray-500 text-center mt-3">
                      Secure payment powered by Stripe. Your card details are never stored on our
                      servers.
                    </Text>
                  </div>
                )}
              </Stack>
            </Tabs.Panel>

            {/* Invoice / Direct Debit Tab */}
            <Tabs.Panel value="invoice" pt="xl">
              <Stack gap="lg">
                <div>
                  <Title order={3} className="text-xl font-bold mb-2 text-white">
                    Payment Type: Invoice
                  </Title>
                  <Text size="sm" className="text-gray-400 mb-4">
                    Ideal for larger companies. Choose between monthly invoices (pay by bank
                    transfer) or direct debit setup. Our team will contact you to arrange your
                    preferred payment method.
                  </Text>
                </div>

                {paymentMethod === 'direct_debit' ? (
                  <div className="p-4 bg-[#2a2a2a]/50 rounded-lg border border-[#2a2a2a]">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <Text className="font-semibold text-white mb-1">Direct Debit Active</Text>
                        <Text size="sm" className="text-gray-400">
                          Account ending in •••• 1234
                        </Text>
                      </div>
                      <Button variant="light" size="sm">
                        Update Details
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-[#2a2a2a]/50 rounded-lg border border-[#2a2a2a]">
                    <Alert
                      icon={<IconAlertCircle size={16} />}
                      title="Manual Setup Required"
                      color="blue"
                      className="mb-6"
                    >
                      <Text size="sm" className="text-gray-300">
                        Invoice and direct debit setup requires manual processing. Our team will
                        contact you within 1-2 business days to complete the setup.
                      </Text>
                    </Alert>

                    <div className="mb-6">
                      <Text className="font-semibold text-white mb-3">What you'll get:</Text>
                      <ul className="list-none space-y-2">
                        <li className="flex items-start gap-2 text-sm text-gray-300">
                          <IconCheck size={16} className="text-teal-400 mt-0.5 flex-shrink-0" />
                          <span>Monthly invoices sent to your email</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm text-gray-300">
                          <IconCheck size={16} className="text-teal-400 mt-0.5 flex-shrink-0" />
                          <span>Option to pay by bank transfer or direct debit</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm text-gray-300">
                          <IconCheck size={16} className="text-teal-400 mt-0.5 flex-shrink-0" />
                          <span>Same features as card subscription</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm text-gray-300">
                          <IconCheck size={16} className="text-teal-400 mt-0.5 flex-shrink-0" />
                          <span>Net 30 payment terms available for approved businesses</span>
                        </li>
                      </ul>
                    </div>

                    <Button
                      fullWidth
                      size="lg"
                      variant="light"
                      onClick={handleRequestInvoice}
                      loading={loading}
                      className="font-semibold"
                    >
                      Request Invoice Setup
                    </Button>
                    <Text size="xs" className="text-gray-500 text-center mt-3">
                      You'll receive an email confirmation and our team will reach out to complete
                      the setup.
                    </Text>
                  </div>
                )}
              </Stack>
            </Tabs.Panel>
          </Tabs>
        </>
      )}
    </Paper>
  );
};
