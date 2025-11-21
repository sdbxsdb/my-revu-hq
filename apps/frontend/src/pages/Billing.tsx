import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Paper,
  Title,
  Text,
  Button,
  Tabs,
  Stack,
  Alert,
  Badge,
  Skeleton,
  Modal,
} from '@mantine/core';
import {
  IconCreditCard,
  IconBuildingBank,
  IconCheck,
  IconAlertCircle,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { apiClient } from '@/lib/api';
import { notifications } from '@mantine/notifications';
import { usePayment } from '@/contexts/PaymentContext';
import { useAccount } from '@/contexts/AccountContext';
import CardBrandIcon from '@/components/CardBrandIcon';
import { getCurrencyFromCountry, detectCurrency, type Currency } from '@/lib/currency';
import '@/lib/currency-debug'; // Load debug utility in dev
import { PRICING_PLANS, type PricingTier, getPlanById } from '@/lib/pricing';

export const Billing = () => {
  const { hasPaid } = usePayment();
  const { account: userAccount, loading: accountLoading, refetch } = useAccount();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string | null>('subscription');
  const [selectedTier, setSelectedTier] = useState<PricingTier>('pro');
  const [loading, setLoading] = useState(false);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [loadingCountry, setLoadingCountry] = useState(true);
  const [detectedCurrency, setDetectedCurrency] = useState<Currency | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(
    () => detectCurrency().currency
  ); // Will be updated when detected
  const [stripePrices, setStripePrices] = useState<
    Record<string, Record<string, { amount: number; currency: string; formatted: string }>>
  >({});
  const [accessStatus, setAccessStatus] = useState<'active' | 'inactive' | 'past_due' | 'canceled'>(
    hasPaid ? 'active' : 'inactive'
  );
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'direct_debit' | null>(
    hasPaid ? 'card' : null
  );
  const [nextBillingDate, setNextBillingDate] = useState<string | undefined>(
    hasPaid ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : undefined
  );
  const [subscriptionStartDate, setSubscriptionStartDate] = useState<string | undefined>(undefined);
  const [currentPeriodStart, setCurrentPeriodStart] = useState<string | undefined>(undefined);
  const [cardLast4, setCardLast4] = useState<string | undefined>(hasPaid ? '4242' : undefined);
  const [cardBrand, setCardBrand] = useState<string | undefined>(hasPaid ? 'visa' : undefined);
  const [accountStatus, setAccountStatus] = useState<'active' | 'cancelled' | 'deleted' | null>(
    null
  );
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isPaid = accessStatus === 'active';
  const displayPaymentMethod = paymentMethod;

  // Use actual data from API
  const displaySubscriptionStartDate = subscriptionStartDate;
  const displayCurrentPeriodStart = currentPeriodStart;
  const displayNextBillingDate = nextBillingDate;
  const displayCardLast4 = cardLast4;
  const displayCardBrand = cardBrand;

  // Detect country from IP geolocation first
  useEffect(() => {
    const detectUserCountry = async () => {
      try {
        const response = await apiClient.detectCountry();
        const currencyData = getCurrencyFromCountry(response.country);
        setDetectedCurrency(currencyData.currency);
        setSelectedCurrency(currencyData.currency); // Set initial selected currency to detected
      } catch (error) {
        // Keep fallback currency
      } finally {
        setLoadingCountry(false);
      }
    };

    detectUserCountry();
  }, []);

  // Fetch prices from Stripe for all tiers and currencies
  useEffect(() => {
    const loadPrices = async () => {
      try {
        const { prices } = await apiClient.getPrices();
        setStripePrices(prices);
      } catch (error) {
        // Failed to load prices
      } finally {
        setLoadingPrices(false);
      }
    };

    loadPrices();
  }, []);

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
      const subscription = await apiClient.getSubscription();
      setAccessStatus(subscription.accessStatus);
      setPaymentMethod(subscription.paymentMethod);
      setNextBillingDate(subscription.nextBillingDate);
      setSubscriptionStartDate(subscription.subscriptionStartDate);
      setCurrentPeriodStart(subscription.currentPeriodStart);
      setCardLast4(subscription.cardLast4);
      setCardBrand(subscription.cardBrand);
      setAccountStatus(subscription.accountStatus || 'active');
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

  const handleSubscribe = async (tier: PricingTier = 'pro') => {
    // Prevent setting up card if invoice/direct debit is already active
    if (isPaid && paymentMethod === 'direct_debit') {
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
      const response = await apiClient.createCheckoutSession(selectedCurrency, tier);
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
    if (isPaid && displayPaymentMethod === 'card') {
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

  const handleCancelSubscription = async () => {
    setCancelling(true);
    try {
      await apiClient.cancelSubscription();
      notifications.show({
        title: 'Subscription Cancelled',
        message:
          'Your subscription has been cancelled. You can still access your account and customer data, but SMS sending is disabled.',
        color: 'yellow',
      });
      setCancelModalOpen(false);
      await loadSubscription();
      await refetch();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to cancel subscription',
        color: 'red',
      });
    } finally {
      setCancelling(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await apiClient.deleteAccount();
      notifications.show({
        title: 'Account Deleted',
        message: 'Your account has been deleted. You will be logged out shortly.',
        color: 'red',
      });
      setDeleteModalOpen(false);
      // Redirect to login after a short delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to delete account',
        color: 'red',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Paper shadow="md" p="md" className="w-full max-w-4xl mx-auto">
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
      ) : isPaid ? (
        /* Active Subscription View */
        <div className="space-y-6">
          {/* Subscription Status Banner */}
          <Alert
            icon={<IconCheck size={16} />}
            title="Active Subscription"
            color="teal"
            className="mb-6"
          >
            <div className="flex flex-col gap-2">
              <Text size="sm" className="text-gray-300">
                Your subscription is active and you have full access to all features.
                {displayNextBillingDate && (
                  <>
                    {' '}
                    Next billing date:{' '}
                    {new Date(displayNextBillingDate).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </>
                )}
              </Text>
              <Badge color="teal" size="lg" className="self-start">
                Active Subscription
              </Badge>
            </div>
          </Alert>

          {/* Subscription Details Card */}
          <Paper shadow="sm" p="md" className="bg-[#2a2a2a]/50 border border-[#2a2a2a]">
            <Title order={3} className="text-xl font-bold mb-4 text-white">
              Subscription Details
            </Title>
            <Stack gap="md">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Text size="sm" className="text-gray-400 mb-1">
                    Plan
                  </Text>
                  <Text className="font-semibold text-white">Active Subscription</Text>
                </div>
                <div>
                  <Text size="sm" className="text-gray-400 mb-1">
                    Status
                  </Text>
                  <Badge
                    color={
                      accountStatus === 'cancelled'
                        ? 'yellow'
                        : accessStatus === 'active'
                          ? 'teal'
                          : 'gray'
                    }
                  >
                    {accountStatus === 'cancelled'
                      ? 'Cancelled'
                      : accessStatus === 'active'
                        ? 'Active'
                        : accessStatus}
                  </Badge>
                </div>
                {displayPaymentMethod && (
                  <div>
                    <Text size="sm" className="text-gray-400 mb-1">
                      Payment Method
                    </Text>
                    <Text className="font-semibold text-white capitalize">
                      {displayPaymentMethod === 'card'
                        ? 'Credit/Debit Card'
                        : 'Invoice/Direct Debit'}
                    </Text>
                  </div>
                )}
                {displaySubscriptionStartDate && (
                  <div>
                    <Text size="sm" className="text-gray-400 mb-1">
                      Started
                    </Text>
                    <Text className="font-semibold text-white">
                      {new Date(displaySubscriptionStartDate).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Text>
                  </div>
                )}
                {displayCurrentPeriodStart && (
                  <div>
                    <Text size="sm" className="text-gray-400 mb-1">
                      Current Period Start
                    </Text>
                    <Text className="font-semibold text-white">
                      {new Date(displayCurrentPeriodStart).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Text>
                  </div>
                )}
                {displayNextBillingDate && (
                  <div>
                    <Text size="sm" className="text-gray-400 mb-1">
                      Next Billing Date
                    </Text>
                    <Text className="font-semibold text-white">
                      {new Date(displayNextBillingDate).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Text>
                  </div>
                )}
              </div>

              {/* Payment Method Details */}
              {displayPaymentMethod === 'card' && displayCardLast4 ? (
                <div className="pt-4 border-t border-[#2a2a2a]">
                  <Text size="sm" className="text-gray-400 mb-2">
                    Payment Card
                  </Text>
                  <div className="flex items-center gap-3 mb-4">
                    <CardBrandIcon brand={displayCardBrand} size={32} />
                    <div>
                      <Text className="font-semibold text-white">
                        •••• •••• •••• {displayCardLast4}
                      </Text>
                      <Text size="xs" className="text-gray-400">
                        Automatically charged monthly
                      </Text>
                    </div>
                  </div>
                  <div>
                    <Button
                      variant="light"
                      size="sm"
                      className="max-w-xs lg:max-w-sm w-full lg:w-auto"
                      onClick={async () => {
                        try {
                          setLoading(true);
                          const response = await apiClient.createPortalSession();
                          window.location.href = response.url;
                        } catch (error: any) {
                          notifications.show({
                            title: 'Error',
                            message: error.message || 'Failed to open payment settings',
                            color: 'red',
                          });
                        } finally {
                          setLoading(false);
                        }
                      }}
                      loading={loading}
                    >
                      Update Payment Method
                    </Button>
                  </div>
                </div>
              ) : paymentMethod === 'direct_debit' ? (
                <div className="pt-4 border-t border-[#2a2a2a]">
                  <Text size="sm" className="text-gray-400 mb-2">
                    Payment Method
                  </Text>
                  <div className="flex items-center gap-3 mb-4">
                    <IconBuildingBank size={32} className="text-teal-400" />
                    <div>
                      <Text className="font-semibold text-white">Invoice / Direct Debit</Text>
                      <Text size="xs" className="text-gray-400">
                        Monthly invoices sent to your email
                      </Text>
                    </div>
                  </div>
                  {displayNextBillingDate && (
                    <div className="mb-4 p-3 bg-[#1a1a1a] rounded-lg">
                      <Text size="xs" className="text-gray-400 mb-1">
                        Next Invoice Date
                      </Text>
                      <Text className="font-semibold text-white">
                        {new Date(displayNextBillingDate).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </Text>
                    </div>
                  )}
                  <div className="mb-3">
                    <Text size="xs" className="text-gray-400 mb-2">
                      Payment Information
                    </Text>
                    <ul className="list-none space-y-1 text-xs text-gray-300">
                      <li className="flex items-start gap-2">
                        <IconCheck size={14} className="text-teal-400 mt-0.5 flex-shrink-0" />
                        <span>Invoices sent via email</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <IconCheck size={14} className="text-teal-400 mt-0.5 flex-shrink-0" />
                        <span>Pay by bank transfer or direct debit</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <IconCheck size={14} className="text-teal-400 mt-0.5 flex-shrink-0" />
                        <span>Net 30 payment terms available</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <Button
                      variant="light"
                      size="sm"
                      className="max-w-xs lg:max-w-sm w-full lg:w-auto"
                      onClick={async () => {
                        try {
                          setLoading(true);
                          const response = await apiClient.createPortalSession();
                          window.location.href = response.url;
                        } catch (error: any) {
                          notifications.show({
                            title: 'Error',
                            message: error.message || 'Failed to open billing settings',
                            color: 'red',
                          });
                        } finally {
                          setLoading(false);
                        }
                      }}
                      loading={loading}
                    >
                      Update Payment Details
                    </Button>
                  </div>
                </div>
              ) : null}

              {/* Features Included */}
              <div className="pt-4 border-t border-[#2a2a2a]">
                <Text size="sm" className="text-gray-400 mb-3">
                  Your subscription includes:
                </Text>
                <ul className="list-none space-y-2">
                  <li className="flex items-start gap-2 text-sm text-gray-300">
                    <IconCheck size={16} className="text-teal-400 mt-0.5 flex-shrink-0" />
                    <span>SMS messages based on your plan</span>
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
              </div>
            </Stack>
          </Paper>

          {/* Account Management Section */}
          <Paper shadow="sm" p="md" className="bg-[#2a2a2a]/50 border border-[#2a2a2a]">
            <Title order={3} className="text-xl font-bold mb-4 text-white">
              Account Management
            </Title>
            <Stack gap="md">
              {/* Cancel Subscription - Different messaging for card vs invoice */}
              <div className="p-4 bg-yellow-900/20 rounded-lg border border-yellow-800/50">
                <div className="mb-4">
                  <Text className="font-semibold text-white mb-2">
                    {displayPaymentMethod === 'card'
                      ? 'Cancel Subscription'
                      : 'Cancel Payment Method'}
                  </Text>
                  <Text size="sm" className="text-gray-400 mb-4">
                    {displayPaymentMethod === 'card' ? (
                      <>
                        Cancel your subscription to stop billing. You'll keep access to your account
                        and customer data, but SMS sending will be disabled.
                      </>
                    ) : (
                      <>
                        Cancel your invoice/direct debit payment method. You'll keep access to your
                        account and customer data, but SMS sending will be disabled. To switch to
                        card payment, cancel this first and then set up a new subscription.
                      </>
                    )}
                  </Text>
                  <Button
                    variant="light"
                    color="yellow"
                    leftSection={<IconX size={16} />}
                    onClick={() => setCancelModalOpen(true)}
                    disabled={accountStatus === 'cancelled'}
                    className="max-w-xs lg:max-w-sm w-full lg:w-auto"
                  >
                    {accountStatus === 'cancelled'
                      ? displayPaymentMethod === 'card'
                        ? 'Subscription Already Cancelled'
                        : 'Payment Method Already Cancelled'
                      : displayPaymentMethod === 'card'
                        ? 'Cancel Subscription'
                        : 'Cancel Payment Method'}
                  </Button>
                </div>
              </div>

              {/* Delete Account */}
              <div className="p-4 bg-red-900/20 rounded-lg border border-red-800/50">
                <div>
                  <Text className="font-semibold text-white mb-2">Delete Account</Text>
                  <Text size="sm" className="text-gray-400 mb-4">
                    Permanently delete your account and all associated data. This action cannot be
                    undone.
                  </Text>
                  <Button
                    variant="light"
                    color="red"
                    leftSection={<IconTrash size={16} />}
                    onClick={() => setDeleteModalOpen(true)}
                    disabled={accountStatus === 'deleted'}
                    className="max-w-xs lg:max-w-sm w-full lg:w-auto"
                  >
                    {accountStatus === 'deleted' ? 'Account Already Deleted' : 'Delete Account'}
                  </Button>
                </div>
              </div>
            </Stack>
          </Paper>
        </div>
      ) : (
        /* Payment Setup View */
        <>
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
                    Choose Your Plan
                  </Title>
                  <Text size="sm" className="text-gray-400 mb-4">
                    Select a plan that fits your business needs. All plans include unlimited
                    customers and can be cancelled anytime.
                  </Text>
                </div>

                {/* Tier Selection Buttons */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {PRICING_PLANS.filter((plan) => plan.id !== 'enterprise').map((plan) => {
                    const stripePrice = stripePrices[plan.id]?.[selectedCurrency];
                    const displayPrice = stripePrice?.formatted || 'Loading...';
                    return (
                      <div key={plan.id} className="relative">
                        <Button
                          variant={selectedTier === plan.id ? 'filled' : 'outline'}
                          color={selectedTier === plan.id ? 'teal' : 'gray'}
                          onClick={() => setSelectedTier(plan.id)}
                          className="font-semibold w-full"
                          disabled={!stripePrice}
                        >
                          {plan.name} - {displayPrice}
                        </Button>
                        {plan.popular && (
                          <Badge color="teal" size="sm" className="absolute -top-2 -right-2">
                            Popular
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                  <Button
                    variant={selectedTier === 'enterprise' ? 'filled' : 'outline'}
                    color={selectedTier === 'enterprise' ? 'teal' : 'gray'}
                    onClick={() => setSelectedTier('enterprise')}
                    className="font-semibold w-full"
                  >
                    Enterprise - Custom
                  </Button>
                </div>

                {/* Currency Selection Buttons */}
                <div className="flex gap-2 mb-1 justify-center">
                  <button
                    type="button"
                    onClick={() => setSelectedCurrency('GBP')}
                    className={`flex-1 lg:flex-none lg:w-20 px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedCurrency === 'GBP'
                        ? 'bg-[rgb(9,146,104)] text-white shadow-lg'
                        : 'bg-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#333333]'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-sm font-semibold">GBP</span>
                      <span className="text-xs opacity-90">£</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCurrency('EUR')}
                    className={`flex-1 lg:flex-none lg:w-20 px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedCurrency === 'EUR'
                        ? 'bg-[rgb(9,146,104)] text-white shadow-lg'
                        : 'bg-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#333333]'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-sm font-semibold">EUR</span>
                      <span className="text-xs opacity-90">€</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCurrency('USD')}
                    className={`flex-1 lg:flex-none lg:w-20 px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedCurrency === 'USD'
                        ? 'bg-[rgb(9,146,104)] text-white shadow-lg'
                        : 'bg-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#333333]'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-sm font-semibold">USD</span>
                      <span className="text-xs opacity-90">$</span>
                    </div>
                  </button>
                </div>
                {detectedCurrency && selectedCurrency === detectedCurrency && (
                  <Text size="xs" className="text-teal-400 text-center mb-4 -mt-4">
                    Auto-detected for your location
                  </Text>
                )}

                {/* Selected Tier Details */}
                {selectedTier !== 'enterprise' ? (
                  (() => {
                    const plan = getPlanById(selectedTier);
                    if (!plan) return null;
                    return (
                      <Paper
                        shadow="sm"
                        p="md"
                        className={`bg-[#2a2a2a]/50 border ${
                          plan.popular ? 'border-teal-500 border-2' : 'border-[#2a2a2a]'
                        } relative`}
                      >
                        {plan.popular && (
                          <Badge
                            color="teal"
                            className="absolute -top-3 left-1/2 transform -translate-x-1/2"
                          >
                            Most Popular
                          </Badge>
                        )}
                        <Stack gap="sm">
                          <div>
                            <Title order={4} className="text-lg font-bold text-white mb-1">
                              {plan.name}
                            </Title>
                            <Text size="sm" className="text-gray-400 mb-3">
                              {plan.description}
                            </Text>
                            <div className="mb-4">
                              <Text className="text-3xl font-bold text-white">
                                {(() => {
                                  const stripePrice = stripePrices[plan.id]?.[selectedCurrency];
                                  if (!stripePrice) {
                                    return 'Loading...';
                                  }
                                  return stripePrice.formatted;
                                })()}
                              </Text>
                              <Text size="sm" className="text-gray-400">
                                per month
                              </Text>
                            </div>
                          </div>
                          <ul className="list-none space-y-2 mb-4">
                            {plan.features.map((feature, idx) => {
                              const isSMSFeature = feature.includes('SMS messages per month');
                              return (
                                <li
                                  key={idx}
                                  className={`flex items-center gap-2 ${
                                    isSMSFeature
                                      ? 'text-base font-semibold text-teal-400'
                                      : 'text-sm text-gray-300'
                                  }`}
                                >
                                  <IconCheck size={16} className="text-teal-400 flex-shrink-0" />
                                  <span>{feature}</span>
                                </li>
                              );
                            })}
                          </ul>
                          <Button
                            size="md"
                            fullWidth
                            onClick={() => handleSubscribe(plan.id)}
                            loading={loading}
                            disabled={isPaid && displayPaymentMethod !== 'card'}
                            className="font-semibold"
                          >
                            {isPaid && displayPaymentMethod === 'card'
                              ? 'Current Plan'
                              : 'Choose Plan'}
                          </Button>
                        </Stack>
                      </Paper>
                    );
                  })()
                ) : (
                  <Paper shadow="sm" p="md" className="bg-[#2a2a2a]/50 border border-[#2a2a2a]">
                    <Stack gap="sm">
                      <div>
                        <Title order={4} className="text-lg font-bold text-white mb-1">
                          Enterprise
                        </Title>
                        <Text size="sm" className="text-gray-400 mb-3">
                          Custom solutions for large organizations
                        </Text>
                      </div>
                      <ul className="list-none space-y-2 mb-4">
                        {PRICING_PLANS.find((p) => p.id === 'enterprise')?.features.map(
                          (feature, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                              <IconCheck size={16} className="text-teal-400 mt-0.5 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          )
                        )}
                      </ul>
                      <Button
                        variant="light"
                        size="md"
                        fullWidth
                        component="a"
                        href="mailto:myrevuhq@gmail.com?subject=Enterprise Plan Inquiry"
                        className="font-semibold"
                      >
                        Contact Us to Discuss
                      </Button>
                    </Stack>
                  </Paper>
                )}

                {displayPaymentMethod === 'card' && isPaid ? (
                  <div className="p-4 bg-[#2a2a2a]/50 rounded-lg border border-[#2a2a2a]">
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
                      <Button
                        variant="light"
                        size="md"
                        className="max-w-xs lg:max-w-sm w-full lg:w-auto"
                      >
                        Update Card
                      </Button>
                    </div>
                    <Text size="xs" className="text-gray-500 text-center mb-4">
                      Secure payment powered by Stripe. Your card details are never stored on our
                      servers.
                    </Text>
                    <Button
                      variant="subtle"
                      color="red"
                      size="sm"
                      className="max-w-xs lg:max-w-sm w-full lg:w-auto"
                    >
                      Cancel Subscription
                    </Button>
                  </div>
                ) : paymentMethod === 'direct_debit' ? (
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
                ) : null}
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
                    <div className="flex items-center gap-4 mb-6">
                      <div>
                        <Text className="font-semibold text-white mb-1">Payment Method</Text>
                        <Text size="sm" className="text-gray-400">
                          Invoice / Direct Debit
                        </Text>
                      </div>
                    </div>
                    <div className="mb-4">
                      <Button
                        variant="light"
                        size="md"
                        className="max-w-xs lg:max-w-sm w-full lg:w-auto"
                      >
                        Update Details
                      </Button>
                    </div>
                    <Button
                      variant="subtle"
                      color="red"
                      size="sm"
                      className="max-w-xs lg:max-w-sm w-full lg:w-auto"
                    >
                      Cancel Payment Method
                    </Button>
                  </div>
                ) : displayPaymentMethod === 'card' ? (
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
                  <div className="p-4 bg-[#2a2a2a]/50 rounded-lg border border-[#2a2a2a]">
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
                      size="lg"
                      variant="light"
                      onClick={handleRequestInvoice}
                      loading={loading}
                      disabled={
                        displayPaymentMethod !== null && displayPaymentMethod !== 'direct_debit'
                      }
                      className="font-semibold max-w-xs lg:max-w-sm w-full lg:w-auto"
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

      {/* Cancel Subscription Modal */}
      <Modal
        opened={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Subscription"
        centered
      >
        <Stack gap="md">
          <Text size="sm" className="text-gray-300">
            Are you sure you want to cancel your subscription? This will:
          </Text>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-300 ml-2">
            <li>Stop all future billing</li>
            <li>Disable SMS sending immediately</li>
            <li>Keep your account and customer data accessible</li>
            <li>Allow you to reactivate your subscription later</li>
          </ul>
          <div className="flex gap-3 mt-4">
            <Button
              variant="light"
              onClick={() => setCancelModalOpen(false)}
              fullWidth
              className="!h-auto !min-h-[3.5rem]"
            >
              <div className="flex flex-col leading-tight py-1">
                <span>Keep</span>
                <span>Subscription</span>
              </div>
            </Button>
            <Button
              color="yellow"
              onClick={handleCancelSubscription}
              loading={cancelling}
              fullWidth
              className="!h-auto !min-h-[3.5rem]"
            >
              <div className="flex flex-col leading-tight py-1">
                <span>Cancel</span>
                <span>Subscription</span>
              </div>
            </Button>
          </div>
        </Stack>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Account"
        centered
      >
        <Stack gap="md">
          <Alert color="red" icon={<IconAlertCircle size={16} />}>
            <Text size="sm" className="text-gray-300">
              This action cannot be undone. All your data will be permanently deleted.
            </Text>
          </Alert>
          <Text size="sm" className="text-gray-300">
            Deleting your account will permanently remove:
          </Text>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-300 ml-2">
            <li>All customer data</li>
            <li>All SMS messages and history</li>
            <li>Your account settings and preferences</li>
            <li>Your subscription and billing information</li>
          </ul>
          <div className="flex gap-3 mt-4">
            <Button variant="light" onClick={() => setDeleteModalOpen(false)} fullWidth>
              Keep Account
            </Button>
            <Button color="red" onClick={handleDeleteAccount} loading={deleting} fullWidth>
              Delete Account
            </Button>
          </div>
        </Stack>
      </Modal>
    </Paper>
  );
};
