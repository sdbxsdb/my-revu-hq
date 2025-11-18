import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Paper, Title, Text, Button, Tabs, Stack, Alert, Badge, Skeleton } from '@mantine/core';
import { IconCreditCard, IconBuildingBank, IconCheck, IconAlertCircle } from '@tabler/icons-react';
import { apiClient } from '@/lib/api';
import { notifications } from '@mantine/notifications';
import { usePayment } from '@/contexts/PaymentContext';
import { useAccount } from '@/contexts/AccountContext';
import CardBrandIcon from '@/components/CardBrandIcon';
import {
  getCurrencyFromCountry,
  detectCurrency,
  formatPrice,
  createCurrencyInfo,
  type CurrencyInfo,
  type Currency,
} from '@/lib/currency';
import '@/lib/currency-debug'; // Load debug utility in dev

export const Billing = () => {
  const { hasPaid } = usePayment();
  const { account: userAccount, loading: accountLoading, refetch } = useAccount();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string | null>('subscription');
  const [loading, setLoading] = useState(false);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [loadingCountry, setLoadingCountry] = useState(true);
  const [detectedCurrency, setDetectedCurrency] = useState(() => detectCurrency()); // Fallback
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('GBP'); // Will be updated when detected
  const [allPrices, setAllPrices] = useState<
    Record<string, { amount: number; currency: string; formatted: string }>
  >({});
  const [currencyInfo, setCurrencyInfo] = useState<CurrencyInfo>(() =>
    createCurrencyInfo(detectedCurrency.currency, detectedCurrency.country)
  );
  const [accessStatus, setAccessStatus] = useState<'active' | 'inactive' | 'past_due' | 'canceled'>(
    hasPaid ? 'active' : 'inactive'
  );
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'direct_debit' | null>(
    hasPaid ? 'card' : null
  );
  const [nextBillingDate, setNextBillingDate] = useState<string | undefined>(
    hasPaid ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : undefined
  );
  const [cardLast4, setCardLast4] = useState<string | undefined>(hasPaid ? '4242' : undefined);
  const [cardBrand, setCardBrand] = useState<string | undefined>(hasPaid ? 'visa' : undefined);

  // Detect country from IP geolocation first
  useEffect(() => {
    const detectUserCountry = async () => {
      try {
        const response = await apiClient.detectCountry();
        const currencyData = getCurrencyFromCountry(response.country);
        setDetectedCurrency(currencyData);
        setSelectedCurrency(currencyData.currency); // Set initial selected currency to detected
      } catch (error) {
        // Keep fallback currency
      } finally {
        setLoadingCountry(false);
      }
    };

    detectUserCountry();
  }, []);

  // Fetch prices from Stripe after country is detected
  useEffect(() => {
    if (loadingCountry) return; // Wait for country detection

    const loadPrices = async () => {
      try {
        const { prices } = await apiClient.getPrices();
        setAllPrices(prices); // Store all prices for currency selector

        // Initialize currency info with selected currency's price (which should be detected currency)
        // If detected currency price is available, use it; otherwise fallback to first available
        const currentPrice = prices[selectedCurrency];
        if (currentPrice) {
          const country =
            selectedCurrency === 'GBP' ? 'GB' : selectedCurrency === 'EUR' ? 'IE' : 'US';
          setCurrencyInfo(createCurrencyInfo(selectedCurrency, country, currentPrice));
        } else {
          // Fallback to first available price
          const availableCurrency = Object.keys(prices)[0] as Currency;
          if (availableCurrency && prices[availableCurrency]) {
            const country =
              availableCurrency === 'GBP' ? 'GB' : availableCurrency === 'EUR' ? 'IE' : 'US';
            setCurrencyInfo(
              createCurrencyInfo(availableCurrency, country, prices[availableCurrency])
            );
            setSelectedCurrency(availableCurrency);
          }
        }
      } catch (error) {
        // Failed to load prices
      } finally {
        setLoadingPrices(false);
      }
    };

    loadPrices();
  }, [loadingCountry]);

  // Update currency info when selected currency changes
  useEffect(() => {
    if (Object.keys(allPrices).length === 0) return; // Wait for prices to load

    const priceData = allPrices[selectedCurrency];
    if (priceData) {
      const country = selectedCurrency === 'GBP' ? 'GB' : selectedCurrency === 'EUR' ? 'IE' : 'US';
      setCurrencyInfo(createCurrencyInfo(selectedCurrency, country, priceData));
    }
  }, [selectedCurrency, allPrices]);

  // Handle success query parameter from Stripe redirect
  useEffect(() => {
    const success = searchParams.get('success');

    if (success === 'true') {
      // Refetch account data to get updated subscription status
      refetch();
      // Redirect to success page
      navigate('/billing/success', { replace: true });
    }
  }, [searchParams, refetch, navigate]);

  useEffect(() => {
    const loadData = async () => {
      if (!userAccount) {
        setLoadingSubscription(false);
        return;
      }

      await loadSubscription();
    };

    loadData();
  }, [userAccount]);

  const loadSubscription = async () => {
    try {
      setLoadingSubscription(true);
      // Use payment context for now (temp toggle)
      // TODO: When backend is ready, replace this with real data
      //
      // SUBSCRIPTION DATA SOURCE:
      // We store subscription data in our DB (access_status, payment_method, etc.)
      // and sync it from Stripe via webhooks. This means:
      // - Our DB is the source of truth for our app (fast queries, no Stripe API calls on every page load)
      // - Stripe webhooks update our DB when subscriptions change (payment succeeded, canceled, etc.)
      // - The backend should query our DB first, then optionally verify with Stripe if needed
      // - Card details (last4, brand) come from Stripe's API when needed (we don't store them)
      //
      // Backend flow:
      // 1. Query user's access_status, payment_method from our DB
      // 2. If subscription is active, optionally verify with Stripe API
      // 3. Get payment method details (last4, brand) from Stripe PaymentMethod API
      // 4. Return combined data to frontend
      if (hasPaid) {
        setAccessStatus('active');
        setPaymentMethod('card');
        setNextBillingDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());
        setCardLast4('4242'); // Demo card last 4 - will come from Stripe API
        setCardBrand('visa'); // Demo card brand - will come from Stripe API
      } else {
        setAccessStatus('inactive');
        setPaymentMethod(null);
        setNextBillingDate(undefined);
        setCardLast4(undefined);
        setCardBrand(undefined);
      }

      // TODO: When backend is ready, uncomment and use real Stripe data:
      // const subscription = await apiClient.getSubscription();
      // setAccessStatus(subscription.accessStatus);
      // setPaymentMethod(subscription.paymentMethod);
      // setNextBillingDate(subscription.nextBillingDate);
      // setCardLast4(subscription.cardLast4); // From Stripe PaymentMethod.card.last4
      // setCardBrand(subscription.cardBrand); // From Stripe PaymentMethod.card.brand
    } catch (error: any) {
      // Failed to load subscription
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
    // Prevent setting up card if invoice/direct debit is already active
    if (accessStatus === 'active' && paymentMethod === 'direct_debit') {
      notifications.show({
        title: 'Payment Method Already Active',
        message:
          'You already have invoice/direct debit set up. Please cancel your current payment method before switching to card payment.',
        color: 'yellow',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.createCheckoutSession(selectedCurrency);
      window.location.href = response.url;
    } catch (error: any) {
      // Failed to create checkout session
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
    // Prevent setting up invoice if card payment is already active
    if (accessStatus === 'active' && paymentMethod === 'card') {
      notifications.show({
        title: 'Payment Method Already Active',
        message:
          'You already have card payment set up. Please cancel your card subscription before switching to invoice payment.',
        color: 'yellow',
      });
      return;
    }

    setLoading(true);
    try {
      await apiClient.requestInvoiceSetup();
      notifications.show({
        title: 'Request Submitted',
        message: 'Invoice setup requested. Our team will contact you within 1-2 business days.',
        color: 'teal',
      });
      await loadSubscription(); // Reload to update status
    } catch (error: any) {
      // Failed to request invoice setup
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

      {accountLoading || loadingSubscription || loadingPrices || loadingCountry ? (
        <div className="space-y-6">
          <Skeleton height={40} width="60%" />
          <Skeleton height={100} />
          <Skeleton height={200} />
        </div>
      ) : (
        <>
          {/* Current Subscription Status */}
          {accessStatus === 'active' && (
            <Alert
              icon={<IconCheck size={16} />}
              title="Active Subscription"
              color="teal"
              className="mb-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <Text size="sm" className="text-gray-300">
                    Your subscription is active.
                    {nextBillingDate && (
                      <>
                        {' '}
                        Next billing date:{' '}
                        {new Date(nextBillingDate).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </>
                    )}
                  </Text>
                </div>
                <Badge color="teal" size="lg">
                  {formatPrice(currencyInfo.price, currencyInfo.currency)}/month
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

                {accessStatus === 'active' && paymentMethod === 'card' ? (
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
                ) : paymentMethod === 'direct_debit' && accessStatus === 'active' ? (
                  <Alert
                    icon={<IconAlertCircle size={16} />}
                    title="Invoice Payment Active"
                    color="blue"
                    className="mb-4"
                  >
                    <Text size="sm" className="text-gray-300 mb-3">
                      Your account is active and you're paying by invoice. To switch to card
                      payment, please contact support to cancel your current payment method first.
                    </Text>
                    {nextBillingDate && (
                      <Text size="xs" className="text-gray-400 mt-2">
                        Next billing date: {new Date(nextBillingDate).toLocaleDateString()}
                      </Text>
                    )}
                  </Alert>
                ) : (
                  <div className="p-6 bg-[#2a2a2a]/50 rounded-lg border border-[#2a2a2a]">
                    <div className="mb-4">
                      <Text className="text-2xl font-bold text-white mb-1">
                        {formatPrice(currencyInfo.price, currencyInfo.currency)}
                      </Text>
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

                    {/* Currency Selector Tabs */}
                    {!loadingPrices && (
                      <div className="mb-4">
                        <div className="flex gap-2 mb-2">
                          <button
                            type="button"
                            onClick={() => allPrices.GBP && setSelectedCurrency('GBP')}
                            disabled={!allPrices.GBP}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                              selectedCurrency === 'GBP'
                                ? 'bg-[rgb(9,146,104)] text-white shadow-lg'
                                : allPrices.GBP
                                  ? 'bg-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#333333]'
                                  : 'bg-[#1a1a1a] text-gray-600 cursor-not-allowed opacity-50'
                            }`}
                          >
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-sm font-semibold">GBP</span>
                              <span className="text-xs opacity-90">
                                {allPrices.GBP ? `£${allPrices.GBP.amount.toFixed(2)}` : 'N/A'}
                              </span>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => allPrices.EUR && setSelectedCurrency('EUR')}
                            disabled={!allPrices.EUR}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                              selectedCurrency === 'EUR'
                                ? 'bg-[rgb(9,146,104)] text-white shadow-lg'
                                : allPrices.EUR
                                  ? 'bg-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#333333]'
                                  : 'bg-[#1a1a1a] text-gray-600 cursor-not-allowed opacity-50'
                            }`}
                          >
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-sm font-semibold">EUR</span>
                              <span className="text-xs opacity-90">
                                {allPrices.EUR ? `€${allPrices.EUR.amount.toFixed(2)}` : 'N/A'}
                              </span>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => allPrices.USD && setSelectedCurrency('USD')}
                            disabled={!allPrices.USD}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                              selectedCurrency === 'USD'
                                ? 'bg-[rgb(9,146,104)] text-white shadow-lg'
                                : allPrices.USD
                                  ? 'bg-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#333333]'
                                  : 'bg-[#1a1a1a] text-gray-600 cursor-not-allowed opacity-50'
                            }`}
                          >
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-sm font-semibold">USD</span>
                              <span className="text-xs opacity-90">
                                {allPrices.USD ? `$${allPrices.USD.amount.toFixed(2)}` : 'N/A'}
                              </span>
                            </div>
                          </button>
                        </div>
                        {selectedCurrency === detectedCurrency.currency && (
                          <Text size="xs" className="text-teal-400 text-center">
                            Auto-detected for your location
                          </Text>
                        )}
                      </div>
                    )}

                    <Button
                      fullWidth
                      size="lg"
                      onClick={handleSubscribe}
                      loading={loading}
                      disabled={accessStatus === 'active' && paymentMethod === 'direct_debit'}
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
                  <div className="p-6 bg-[#2a2a2a]/50 rounded-lg border border-[#2a2a2a]">
                    <div className="flex items-center gap-4 mb-6">
                      <div>
                        <Text className="font-semibold text-white mb-1">Payment Method</Text>
                        <Text size="sm" className="text-gray-400">
                          Invoice / Direct Debit
                        </Text>
                      </div>
                    </div>
                    <div className="mb-4">
                      <Button variant="light" size="md" fullWidth>
                        Update Details
                      </Button>
                    </div>
                    <Button variant="subtle" color="red" size="sm" fullWidth>
                      Cancel Payment Method
                    </Button>
                  </div>
                ) : paymentMethod === 'card' ? (
                  <Alert
                    icon={<IconAlertCircle size={16} />}
                    title="Card Payment Active"
                    color="blue"
                    className="mb-4"
                  >
                    <Text size="sm" className="text-gray-300 mb-3">
                      You currently have card payment set up. To switch to invoice payment, please
                      cancel your card subscription first.
                    </Text>
                  </Alert>
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
                      disabled={accessStatus === 'active' && paymentMethod === 'card'}
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
