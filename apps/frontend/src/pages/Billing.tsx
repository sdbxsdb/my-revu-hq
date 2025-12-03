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
  Container,
  Loader,
} from '@mantine/core';
import { IconCreditCard, IconBuildingBank, IconCheck, IconAlertCircle } from '@tabler/icons-react';
import { apiClient } from '@/lib/api';
import { notifications } from '@mantine/notifications';
import { usePayment } from '@/contexts/PaymentContext';
import { useAccount } from '@/contexts/AccountContext';
import CardBrandIcon from '@/components/CardBrandIcon';
import { AccountErrorAlert } from '@/components/AccountErrorAlert';
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
  const [processingPayment, setProcessingPayment] = useState(false);
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
  const [subscriptionTier, setSubscriptionTier] = useState<
    'free' | 'starter' | 'pro' | 'business' | 'enterprise' | null
  >(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [changeTierModalOpen, setChangeTierModalOpen] = useState(false);
  const [selectedNewTier, setSelectedNewTier] = useState<PricingTier | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [enterpriseRequestModalOpen, setEnterpriseRequestModalOpen] = useState(false);
  const [enterpriseRequestSubmitted, setEnterpriseRequestSubmitted] = useState(false);
  const [requestingEnterprise, setRequestingEnterprise] = useState(false);
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
      setProcessingPayment(true);

      // Give session time to sync after Stripe redirect (especially on mobile/ngrok)
      const timer = setTimeout(async () => {
        try {
          // Sync subscription from Stripe (for local testing where webhooks don't work)
          try {
            console.log('🔄 Syncing subscription from Stripe...');
            const syncResult = await apiClient.syncSubscription();
            console.log('✅ Sync result:', syncResult);
          } catch (syncError) {
            console.error('❌ Sync subscription error (non-fatal):', syncError);
            // Continue even if sync fails - the data might already be updated by webhook
          }

          // Refetch account data to get updated subscription status
          await refetch();
          // Small additional delay to ensure state updates
          await new Promise((resolve) => setTimeout(resolve, 500));
          // Redirect to dashboard with success notification
          notifications.show({
            title: 'Payment Successful! 🎉',
            message: 'Your subscription is now active',
            color: 'green',
            autoClose: 5000,
          });
          navigate('/dashboard', { replace: true });
        } catch (error) {
          console.error('Error handling success redirect:', error);
          // Still try to navigate even if refetch fails
          navigate('/billing/success', { replace: true });
        } finally {
          setProcessingPayment(false);
        }
      }, 2500); // Increased delay for mobile/network latency

      return () => clearTimeout(timer);
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
      setSubscriptionTier(subscription.subscriptionTier || null);
      // Check if enterprise was already requested (persists across refreshes)
      if (subscription.enterpriseRequestedAt) {
        setEnterpriseRequestSubmitted(true);
      }
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

  const handleRequestEnterprise = async () => {
    // Prevent duplicate requests
    if (enterpriseRequestSubmitted || requestingEnterprise) {
      return;
    }

    setRequestingEnterprise(true);
    try {
      await apiClient.requestInvoiceSetup();
      setEnterpriseRequestSubmitted(true);
      setEnterpriseRequestModalOpen(true);
      await loadSubscription(); // Reload to update status
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to submit enterprise request',
        color: 'red',
      });
    } finally {
      setRequestingEnterprise(false);
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

    // Use the same enterprise request handler
    await handleRequestEnterprise();
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
    <Container size="lg" py="md" className="px-xs sm:px-md">
      <Paper shadow="md" p="md" className="bg-[#1a1a1a]">
        <div className="mb-8">
          <Title order={2} className="text-2xl sm:text-3xl font-bold mb-2 text-white">
            Billing & Subscription
          </Title>
          <p className="text-sm text-gray-400">Manage your subscription and payment methods</p>
        </div>

        {/* Account Error Alert */}
        <AccountErrorAlert />

        {processingPayment ? (
          <div className="space-y-6 text-center py-20">
            <Loader size="xl" className="mx-auto text-teal-400" />
            <div>
              <Text size="lg" className="text-white font-semibold mb-2">
                Processing Your Payment...
              </Text>
              <Text size="sm" className="text-gray-400">
                Please wait while we confirm your subscription
              </Text>
            </div>
          </div>
        ) : accountLoading || loadingSubscription || loadingPrices || loadingCountry ? (
          <div className="space-y-6">
            <Skeleton height={40} width="60%" />
            <Skeleton height={100} />
            <Skeleton height={200} />
          </div>
        ) : isPaid || accessStatus === 'past_due' ? (
          /* Active Subscription View */
          <div className="space-y-6">
            {/* Payment Failure Warning Banner */}
            {accessStatus === 'past_due' && (
              <Alert
                icon={<IconAlertCircle size={16} />}
                title="Payment Failed"
                color="red"
                className="mb-6"
              >
                <div className="flex flex-col gap-3">
                  <Text size="sm" className="text-gray-300">
                    Your payment could not be processed. Please update your payment method to
                    continue using the service. SMS sending has been temporarily disabled until
                    payment is resolved.
                  </Text>
                  <Button
                    variant="light"
                    color="red"
                    size="sm"
                    className="self-start"
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
              </Alert>
            )}

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
                    {subscriptionTier ? (
                      (() => {
                        const plan = getPlanById(subscriptionTier);
                        const smsLimit = plan?.smsLimit || 0;
                        return (
                          <>
                            <Text className="font-semibold text-white capitalize">
                              {plan?.name || subscriptionTier}
                            </Text>
                            <Text size="sm" className="text-teal-400 mt-1">
                              {smsLimit} SMS/month
                            </Text>
                          </>
                        );
                      })()
                    ) : (
                      <Text className="font-semibold text-white">No Active Plan</Text>
                    )}
                  </div>{' '}
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
              </Stack>
            </Paper>

            {/* Change Plan Section */}
            {displayPaymentMethod === 'card' && subscriptionTier && (
              <Paper shadow="sm" p="md" className="bg-[#2a2a2a]/50 border border-[#2a2a2a]">
                <Title order={3} className="text-xl font-bold mb-4 text-white">
                  Change Plan
                </Title>
                <Stack gap="md">
                  <Text size="sm" className="text-gray-400">
                    You're currently on the{' '}
                    <span className="font-semibold text-white capitalize">{subscriptionTier}</span>{' '}
                    plan. You can upgrade or downgrade at any time. Changes are prorated
                    automatically and your next invoice will reflect the adjustment.
                  </Text>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {PRICING_PLANS.map((plan) => {
                      const stripePrice = stripePrices[plan.id]?.[selectedCurrency];
                      const displayPrice = stripePrice?.formatted || 'Loading...';
                      const isCurrentTier = subscriptionTier === plan.id;
                      const isUpgrade =
                        (subscriptionTier === 'starter' && plan.id === 'pro') ||
                        (subscriptionTier === 'starter' && plan.id === 'business') ||
                        (subscriptionTier === 'starter' && plan.id === 'enterprise') ||
                        (subscriptionTier === 'pro' && plan.id === 'business') ||
                        (subscriptionTier === 'pro' && plan.id === 'enterprise') ||
                        (subscriptionTier === 'business' && plan.id === 'enterprise');

                      // Special case for Enterprise
                      if (plan.id === 'enterprise') {
                        return (
                          <div
                            key={plan.id}
                            className={`p-4 rounded-lg border h-full ${
                              isCurrentTier
                                ? 'bg-teal-900/20 border-teal-800/50'
                                : 'bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#333333]'
                            }`}
                          >
                            <div className="flex flex-col h-full">
                              <div className="flex items-center justify-between mb-2">
                                <Text className="font-semibold text-white capitalize">
                                  {plan.name}
                                </Text>
                                {isCurrentTier && (
                                  <Badge size="sm" color="teal">
                                    Current
                                  </Badge>
                                )}
                              </div>
                              <Text size="lg" className="font-bold text-white mb-2">
                                Custom
                              </Text>
                              <div className="space-y-0.5 flex-grow mb-2">
                                <Text size="xs" className="text-gray-400">
                                  Custom SMS volume
                                </Text>
                                <Text size="xs" className="text-gray-400">
                                  Dedicated account manager
                                </Text>
                                <Text size="xs" className="text-gray-400">
                                  Custom onboarding
                                </Text>
                                <Text size="xs" className="text-gray-400">
                                  Scheduling:{' '}
                                  <span className="text-teal-400">Advanced automation</span>
                                </Text>
                                <Text size="xs" className="text-gray-400">
                                  Analytics:{' '}
                                  <span className="text-teal-400">Advanced & custom</span>
                                </Text>
                              </div>
                              {!isCurrentTier && (
                                <div className="mt-auto">
                                  {enterpriseRequestSubmitted ? (
                                    <Badge size="lg" color="teal" className="w-full justify-center">
                                      Request Submitted
                                    </Badge>
                                  ) : (
                                    <Button
                                      variant="light"
                                      color="teal"
                                      size="sm"
                                      className="w-full"
                                      onClick={handleRequestEnterprise}
                                      loading={requestingEnterprise}
                                    >
                                      Request Enterprise
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={plan.id}
                          className={`p-4 rounded-lg border h-full ${
                            isCurrentTier
                              ? 'bg-teal-900/20 border-teal-800/50'
                              : 'bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#333333]'
                          }`}
                        >
                          <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between mb-2">
                              <Text className="font-semibold text-white capitalize">
                                {plan.name}
                              </Text>
                              {isCurrentTier && (
                                <Badge size="sm" color="teal">
                                  Current
                                </Badge>
                              )}
                            </div>
                            <Text size="lg" className="font-bold text-white mb-2">
                              {displayPrice}
                            </Text>
                            <div className="space-y-0.5 flex-grow mb-2">
                              <Text size="xs" className="text-gray-400">
                                {plan.smsLimit} SMS/month
                              </Text>
                              <Text size="xs" className="text-gray-400">
                                Analytics:{' '}
                                <span
                                  className={
                                    plan.id === 'starter' ? 'text-gray-500' : 'text-teal-400'
                                  }
                                >
                                  {plan.id === 'pro'
                                    ? 'Visual insights & trends'
                                    : plan.id === 'business'
                                      ? 'Advanced analytics & customer insights'
                                      : 'Not available'}
                                </span>
                              </Text>
                            </div>
                            {!isCurrentTier && (
                              <Button
                                variant={isUpgrade ? 'filled' : 'outline'}
                                color={isUpgrade ? 'teal' : 'gray'}
                                size="sm"
                                className="mt-auto"
                                onClick={() => {
                                  setSelectedNewTier(plan.id);
                                  setChangeTierModalOpen(true);
                                }}
                                disabled={!stripePrice}
                              >
                                {isUpgrade ? 'Upgrade' : 'Downgrade'}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Stack>
              </Paper>
            )}

            {/* Account Management Section */}
            <Paper shadow="sm" p="sm" className="bg-[#2a2a2a]/50 border border-[#2a2a2a]">
              <Title order={4} className="text-sm font-semibold mb-3 text-gray-400">
                Account Management
              </Title>
              <Stack gap="sm">
                {/* Cancel Subscription - Different messaging for card vs invoice */}
                <div className="border-t border-[#2a2a2a] pt-2">
                  <Text size="xs" className="text-gray-500 mb-1.5">
                    {displayPaymentMethod === 'card' ? (
                      <>Cancel your subscription to stop billing.</>
                    ) : (
                      <>Cancel your invoice/direct debit payment method.</>
                    )}
                  </Text>
                  <Button
                    variant="subtle"
                    color="gray"
                    size="xs"
                    onClick={() => setCancelModalOpen(true)}
                    disabled={accountStatus === 'cancelled'}
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

                {/* Delete Account */}
                <div className="border-t border-[#2a2a2a] pt-2">
                  <Text size="xs" className="text-gray-500 mb-1.5">
                    Permanently delete your account and all data.
                  </Text>
                  <Button
                    variant="subtle"
                    color="gray"
                    size="xs"
                    onClick={() => setDeleteModalOpen(true)}
                    disabled={accountStatus === 'deleted'}
                  >
                    {accountStatus === 'deleted' ? 'Account Already Deleted' : 'Delete Account'}
                  </Button>
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

                  {/* Currency Selection Buttons */}
                  <div className="flex gap-1.5 mb-3">
                    <button
                      type="button"
                      onClick={() => setSelectedCurrency('GBP')}
                      className={`flex-1 lg:flex-none px-2 py-1 rounded text-xs transition-all ${
                        selectedCurrency === 'GBP'
                          ? 'bg-[rgb(9,146,104)] text-white'
                          : 'bg-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#333333]'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xs font-semibold">GBP</span>
                        <span className="text-sm">£</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCurrency('EUR')}
                      className={`flex-1 lg:flex-none px-2 py-1 rounded text-xs transition-all ${
                        selectedCurrency === 'EUR'
                          ? 'bg-[rgb(9,146,104)] text-white'
                          : 'bg-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#333333]'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xs font-semibold">EUR</span>
                        <span className="text-sm">€</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCurrency('USD')}
                      className={`flex-1 lg:flex-none px-2 py-1 rounded text-xs transition-all ${
                        selectedCurrency === 'USD'
                          ? 'bg-[rgb(9,146,104)] text-white'
                          : 'bg-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#333333]'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xs font-semibold">USD</span>
                        <span className="text-sm">$</span>
                      </div>
                    </button>
                  </div>
                  {detectedCurrency && selectedCurrency === detectedCurrency && (
                    <Text size="xs" className="text-teal-400 text-center mb-3 -mt-4">
                      Auto-detected for your location
                    </Text>
                  )}

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
                            <div className="flex flex-col items-center gap-0.5">
                              <span>{plan.name}</span>
                              <span className="text-xs">{displayPrice}</span>
                            </div>
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
                      onClick={() => {
                        if (!enterpriseRequestSubmitted) {
                          setSelectedTier('enterprise');
                        }
                      }}
                      disabled={enterpriseRequestSubmitted}
                      className="font-semibold w-full"
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span>Enterprise</span>
                        <span className="text-xs">
                          {enterpriseRequestSubmitted ? 'Request Submitted' : 'Custom'}
                        </span>
                      </div>
                    </Button>
                  </div>

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
                              {/* Scheduling & Analytics features */}
                              {plan.id === 'pro' && (
                                <>
                                  <li className="flex items-center gap-2 text-sm text-teal-400">
                                    <IconCheck size={16} className="text-teal-400 flex-shrink-0" />
                                    <span>Schedule SMS for future dates</span>
                                  </li>
                                  <li className="flex items-center gap-2 text-sm text-teal-400">
                                    <IconCheck size={16} className="text-teal-400 flex-shrink-0" />
                                    <span>Analytics: Visual insights & performance trends</span>
                                  </li>
                                </>
                              )}
                              {plan.id === 'business' && (
                                <>
                                  <li className="flex items-center gap-2 text-sm text-teal-400">
                                    <IconCheck size={16} className="text-teal-400 flex-shrink-0" />
                                    <span>Schedule SMS for future dates</span>
                                  </li>
                                  <li className="flex items-center gap-2 text-sm text-teal-400">
                                    <IconCheck size={16} className="text-teal-400 flex-shrink-0" />
                                    <span>
                                      Advanced Analytics: Customer-level insights & engagement
                                      tracking
                                    </span>
                                  </li>
                                </>
                              )}
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
                              <li
                                key={idx}
                                className="flex items-start gap-2 text-sm text-gray-300"
                              >
                                <IconCheck
                                  size={16}
                                  className="text-teal-400 mt-0.5 flex-shrink-0"
                                />
                                <span>{feature}</span>
                              </li>
                            )
                          )}
                        </ul>
                        {enterpriseRequestSubmitted ? (
                          <Badge size="lg" color="teal" className="w-full justify-center py-3">
                            Request Submitted - We'll Be In Touch
                          </Badge>
                        ) : (
                          <Button
                            variant="light"
                            size="md"
                            fullWidth
                            onClick={handleRequestEnterprise}
                            loading={requestingEnterprise}
                            className="font-semibold"
                          >
                            Request Enterprise Plan
                          </Button>
                        )}
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

                      {enterpriseRequestSubmitted ? (
                        <Badge
                          size="lg"
                          color="teal"
                          className="max-w-xs lg:max-w-sm w-full lg:w-auto justify-center py-3"
                        >
                          Request Submitted - We'll Be In Touch
                        </Badge>
                      ) : (
                        <Button
                          size="lg"
                          variant="light"
                          onClick={handleRequestInvoice}
                          loading={requestingEnterprise}
                          disabled={
                            (displayPaymentMethod !== null &&
                              displayPaymentMethod !== 'direct_debit') ||
                            requestingEnterprise
                          }
                          className="font-semibold max-w-xs lg:max-w-sm w-full lg:w-auto"
                        >
                          Request Invoice Setup
                        </Button>
                      )}
                      <Text size="xs" className="text-gray-500 text-center mt-3">
                        {enterpriseRequestSubmitted
                          ? "We've received your request and will contact you within 1-2 business days."
                          : "You'll receive a confirmation and our team will reach out to complete the setup."}
                      </Text>
                    </div>
                  )}
                </Stack>
              </Tabs.Panel>
            </Tabs>
          </>
        )}

        {/* Enterprise Request Confirmation Modal */}
        <Modal
          opened={enterpriseRequestModalOpen}
          onClose={() => setEnterpriseRequestModalOpen(false)}
          title={<Text className="text-white font-semibold text-lg">Thank You!</Text>}
          centered
          styles={{
            content: {
              backgroundColor: '#1a1a1a',
              border: '1px solid #2a2a2a',
            },
            header: {
              backgroundColor: '#1a1a1a',
              borderBottom: '1px solid #2a2a2a',
            },
          }}
        >
          <Stack gap="md">
            <Text size="md" className="text-gray-300">
              Thank you for your interest in our Enterprise plan!
            </Text>
            <Text size="sm" className="text-gray-400">
              We've received your request and our team will be in touch within 1-2 business days to
              discuss your needs and customize a solution for your organization.
            </Text>
            <Button fullWidth onClick={() => setEnterpriseRequestModalOpen(false)} className="mt-4">
              Got It
            </Button>
          </Stack>
        </Modal>

        {/* Cancel Subscription Modal */}
        <Modal
          opened={cancelModalOpen}
          onClose={() => setCancelModalOpen(false)}
          title="Cancel Subscription"
          centered
          classNames={{
            body: 'p-0',
          }}
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
                className="!h-auto !min-h-[2.5rem] !px-2"
              >
                <div className="flex flex-col leading-tight py-0.5 text-center w-full">
                  <span className="text-xs">Keep</span>
                  <span className="text-xs">Subscription</span>
                </div>
              </Button>
              <Button
                color="yellow"
                onClick={handleCancelSubscription}
                loading={cancelling}
                fullWidth
                className="!h-auto !min-h-[2.5rem] !px-2"
              >
                <div className="flex flex-col leading-tight py-0.5 text-center w-full">
                  <span className="text-xs">Cancel</span>
                  <span className="text-xs">Subscription</span>
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
          classNames={{
            body: 'p-0',
          }}
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
              <Button
                variant="light"
                onClick={() => setDeleteModalOpen(false)}
                fullWidth
                className="!h-auto !min-h-[2.5rem] !px-2"
              >
                <div className="flex flex-col leading-tight py-0.5 text-center w-full">
                  <span className="text-xs">Keep</span>
                  <span className="text-xs">Account</span>
                </div>
              </Button>
              <Button
                color="red"
                onClick={handleDeleteAccount}
                loading={deleting}
                fullWidth
                className="!h-auto !min-h-[2.5rem] !px-2"
              >
                <div className="flex flex-col leading-tight py-0.5 text-center w-full">
                  <span className="text-xs">Delete</span>
                  <span className="text-xs">Account</span>
                </div>
              </Button>
            </div>
          </Stack>
        </Modal>

        {/* Change Tier Modal */}
        <Modal
          opened={changeTierModalOpen}
          onClose={() => {
            setChangeTierModalOpen(false);
            setSelectedNewTier(null);
          }}
          title="Change Subscription Plan"
          centered
          classNames={{
            body: 'p-0',
          }}
        >
          <Stack gap="md">
            {selectedNewTier &&
              subscriptionTier &&
              (() => {
                const currentPlan = getPlanById(subscriptionTier);
                const newPlan = getPlanById(selectedNewTier);
                const isUpgrade =
                  (subscriptionTier === 'starter' && selectedNewTier === 'pro') ||
                  (subscriptionTier === 'starter' && selectedNewTier === 'business') ||
                  (subscriptionTier === 'pro' && selectedNewTier === 'business');
                const currentPrice =
                  stripePrices[subscriptionTier]?.[selectedCurrency]?.formatted || 'Loading...';
                const newPrice =
                  stripePrices[selectedNewTier]?.[selectedCurrency]?.formatted || 'Loading...';

                return (
                  <>
                    <Text size="sm" className="text-gray-300">
                      {isUpgrade ? 'Upgrade' : 'Downgrade'} your subscription from{' '}
                      <span className="font-semibold text-white">{currentPlan?.name}</span> to{' '}
                      <span className="font-semibold text-white">{newPlan?.name}</span>?
                    </Text>

                    <div className="p-4 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
                      <div className="flex justify-between items-center mb-2">
                        <Text size="sm" className="text-gray-400">
                          Current Plan
                        </Text>
                        <Text size="sm" className="font-semibold text-white">
                          {currentPlan?.name} - {currentPrice}/month
                        </Text>
                      </div>
                      <div className="flex justify-between items-center">
                        <Text size="sm" className="text-gray-400">
                          New Plan
                        </Text>
                        <Text size="sm" className="font-semibold text-teal-400">
                          {newPlan?.name} - {newPrice}/month
                        </Text>
                      </div>
                    </div>

                    <Alert
                      color={isUpgrade ? 'teal' : 'yellow'}
                      icon={<IconAlertCircle size={16} />}
                    >
                      <Text size="sm" className="text-gray-300">
                        {isUpgrade
                          ? 'Your subscription will be upgraded immediately. You will be charged a prorated amount for the remainder of your billing cycle.'
                          : 'Your subscription will be downgraded immediately. You will receive a prorated credit for the remainder of your billing cycle.'}
                      </Text>
                    </Alert>

                    <div className="flex flex-col sm:flex-row gap-3 mt-4">
                      <Button
                        variant="light"
                        onClick={() => {
                          setChangeTierModalOpen(false);
                          setSelectedNewTier(null);
                        }}
                        fullWidth
                      >
                        Cancel
                      </Button>
                      <Button
                        color={isUpgrade ? 'teal' : 'gray'}
                        onClick={async () => {
                          if (!selectedNewTier) return;

                          try {
                            setLoading(true);
                            await apiClient.changeTier(selectedNewTier, selectedCurrency);
                            notifications.show({
                              title: 'Success',
                              message: `Successfully changed to ${newPlan?.name} plan. Your subscription will be updated shortly.`,
                              color: 'green',
                            });
                            setChangeTierModalOpen(false);
                            setSelectedNewTier(null);
                            // Reload subscription data
                            await loadSubscription();
                          } catch (error: any) {
                            notifications.show({
                              title: 'Error',
                              message: error.message || 'Failed to change plan',
                              color: 'red',
                            });
                          } finally {
                            setLoading(false);
                          }
                        }}
                        loading={loading}
                        fullWidth
                      >
                        Confirm {isUpgrade ? 'Upgrade' : 'Downgrade'}
                      </Button>
                    </div>
                  </>
                );
              })()}
          </Stack>
        </Modal>
      </Paper>
    </Container>
  );
};
