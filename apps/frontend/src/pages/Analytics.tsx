import { useEffect, useState } from 'react';
import {
  Paper,
  Title,
  Text,
  Container,
  Stack,
  Skeleton,
  Alert,
  Table,
  Badge,
  Button,
  Accordion,
  Tooltip as MantineTooltip,
} from '@mantine/core';
import {
  IconChartBar,
  IconAlertCircle,
  IconTrendingUp,
  IconCheck,
  IconX,
  IconClock,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { apiClient } from '@/lib/api';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import { getSmsLimitFromTier, type PricingTier } from '@/lib/pricing';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { detectCountryFromPhoneNumber } from '@/lib/phone-validation';
import type { CountryCode } from 'libphonenumber-js';
import { AccountErrorAlert } from '@/components/AccountErrorAlert';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface MonthlyStat {
  month: string;
  year: number;
  count: number;
  customers?: Array<{
    id: string;
    name: string;
    phone: string;
    job_description: string | null;
    sent_at: string;
    was_scheduled?: boolean;
  }>;
}

export const Analytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<{
    tier: string;
    monthlyStats: MonthlyStat[];
    totalMessages: number;
    insights?: {
      notContacted5Days: Array<{
        id: string;
        name: string;
        phone: { countryCode: string; number: string };
        job_description: string | null;
        lastContacted: string | null;
        daysSinceContact: number;
        createdAt: string;
        sms_status?: 'sent' | 'pending' | 'scheduled';
        scheduled_send_at?: string | null;
      }>;
      notContacted10Days: Array<{
        id: string;
        name: string;
        phone: { countryCode: string; number: string };
        job_description: string | null;
        lastContacted: string | null;
        daysSinceContact: number;
        createdAt: string;
        sms_status?: 'sent' | 'pending' | 'scheduled';
        scheduled_send_at?: string | null;
      }>;
      notContacted30Days: Array<{
        id: string;
        name: string;
        phone: { countryCode: string; number: string };
        job_description: string | null;
        lastContacted: string | null;
        daysSinceContact: number;
        createdAt: string;
        sms_status?: 'sent' | 'pending' | 'scheduled';
        scheduled_send_at?: string | null;
      }>;
      approachingLimit: Array<{
        id: string;
        name: string;
        phone: { countryCode: string; number: string };
        job_description: string | null;
        messageCount: number;
        createdAt: string;
      }>;
    };
  } | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<PricingTier | null>(null);
  const [smsSent, setSmsSent] = useState<number | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Record<string, string[]>>({});
  const [expandedMonths, setExpandedMonths] = useState<string[]>([]);
  const [sendingCustomerId, setSendingCustomerId] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
    loadSmsUsage();
  }, []);

  const loadSmsUsage = async () => {
    try {
      setLoadingUsage(true);
      const [account, subscription] = await Promise.all([
        apiClient.getAccount(),
        apiClient.getSubscription().catch(() => null),
      ]);

      setSmsSent(account.sms_sent_this_month || 0);
      setSubscriptionTier(subscription?.subscriptionTier || null);
    } catch (error) {
      // Failed to load usage data - continue without it
    } finally {
      setLoadingUsage(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getAnalytics();
      setAnalytics(data);
      // Set current month (first month) as expanded by default
      if (data.monthlyStats.length > 0) {
        const firstMonth = data.monthlyStats[0];
        setExpandedMonths([`month-${firstMonth.month}-${firstMonth.year}`]);
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        // Not Pro or Business tier
        setAnalytics(null);
      } else {
        notifications.show({
          title: 'Error',
          message: error.message || 'Failed to load analytics',
          color: 'red',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get flag emoji from country code
  const getFlagEmoji = (countryCode: CountryCode): string => {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  // Format phone number for display
  const formatPhone = (phone: {
    countryCode?: string;
    number: string;
  }): { flag: string; number: string } => {
    if (!phone || !phone.number) return { flag: '', number: '-' };

    let displayNumber = phone.number;
    if (phone.number.startsWith('+')) {
      try {
        const parsed = parsePhoneNumberFromString(phone.number);
        if (parsed) {
          displayNumber = parsed.formatNational().replace(/\s+/g, '');
        }
      } catch {
        displayNumber = phone.number;
      }
    }

    const detectedCountry = detectCountryFromPhoneNumber(phone.number, phone.countryCode);
    const countryToUse: CountryCode = detectedCountry || 'GB';
    const flag = getFlagEmoji(countryToUse);
    return { flag, number: displayNumber };
  };

  const handleSendSMS = async (customerId: string) => {
    setSendingCustomerId(customerId);
    try {
      const result = await apiClient.sendSMS(customerId);

      // Update SMS usage in state
      setSmsSent(result.usage.sms_sent_this_month);

      notifications.show({
        title: 'Success',
        message: 'SMS sent successfully',
        color: 'green',
      });

      // Reload analytics to update the insights lists (customer moved from not contacted to contacted)
      await loadAnalytics();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to send SMS',
        color: 'red',
      });
    } finally {
      setSendingCustomerId(null);
    }
  };

  if (loading) {
    return (
      <Container size="lg" py="md" className="px-xs sm:px-md">
        <Paper shadow="md" p="md" className="bg-[#1a1a1a]">
          <Stack gap="lg">
            <Skeleton height={40} width="60%" />
            <Skeleton height={200} />
            <Skeleton height={400} />
          </Stack>
        </Paper>
      </Container>
    );
  }

  if (!analytics) {
    const currentTier = subscriptionTier || 'starter';

    return (
      <Container size="lg" py="md" className="px-xs sm:px-md">
        <Paper shadow="md" p="md" className="bg-[#1a1a1a]">
          <Stack gap="lg">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <IconChartBar size={32} className="text-teal-400" />
                <Title order={1} className="text-white">
                  Analytics
                </Title>
              </div>
              <Text size="sm" className="text-gray-400">
                Track your SMS campaign performance and customer engagement
              </Text>
            </div>

            <Alert
              icon={<IconAlertCircle size={16} />}
              title="Analytics Not Available"
              color="yellow"
            >
              <Text size="sm" className="text-gray-300 mb-4">
                Analytics are only available for Pro and Business plans. Upgrade your plan to access
                detailed insights about your SMS campaigns.
              </Text>
            </Alert>

            {/* Preview of Analytics - Blurred */}
            <div className="relative">
              <div className="blur-sm pointer-events-none select-none">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <Paper p="md" className="bg-[#2a2a2a] border border-[#3a3a3a]">
                    <Text size="xs" className="text-gray-400 mb-1">
                      Total Messages
                    </Text>
                    <Text size="xl" className="font-bold text-white">
                      1,234
                    </Text>
                    <Text size="xs" className="text-gray-500 mt-1">
                      Last 12 months
                    </Text>
                  </Paper>
                  <Paper p="md" className="bg-[#2a2a2a] border border-[#3a3a3a]">
                    <Text size="xs" className="text-gray-400 mb-1">
                      Average per Month
                    </Text>
                    <Text size="xl" className="font-bold text-white">
                      103
                    </Text>
                    <Text size="xs" className="text-gray-500 mt-1">
                      12 months tracked
                    </Text>
                  </Paper>
                  <Paper p="md" className="bg-[#2a2a2a] border border-[#3a3a3a]">
                    <Text size="xs" className="text-gray-400 mb-1">
                      This Month
                    </Text>
                    <Text size="xl" className="font-bold text-white">
                      45
                    </Text>
                    <Text size="xs" className="text-gray-500 mt-1">
                      December 2024
                    </Text>
                  </Paper>
                </div>
                <Paper p="md" className="bg-[#2a2a2a] border border-[#3a3a3a]">
                  <Text size="sm" className="text-gray-400 mb-4 font-medium">
                    Messages Sent by Month
                  </Text>
                  <div className="h-[300px] bg-[#1a1a1a] rounded flex items-center justify-center">
                    <Text size="sm" className="text-gray-500">
                      Chart Preview
                    </Text>
                  </div>
                </Paper>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Paper p="lg" className="bg-[#1a1a1a]/95 border-2 border-teal-500/50 rounded-lg">
                  <Stack gap="md" align="center">
                    <IconChartBar size={48} className="text-teal-400" />
                    <Title order={3} className="text-white text-center">
                      Upgrade to {currentTier === 'starter' ? 'Pro' : 'Business'} to Unlock
                      Analytics
                    </Title>
                    <Text size="sm" className="text-gray-300 text-center max-w-md">
                      See detailed insights about your SMS campaigns, schedule review requests for
                      future dates, and track monthly trends, customer engagement, and performance
                      metrics.
                    </Text>
                    <Button
                      color="teal"
                      size="lg"
                      onClick={() => navigate('/billing')}
                      className="mt-2"
                    >
                      Upgrade Now
                    </Button>
                  </Stack>
                </Paper>
              </div>
            </div>

            {/* Feature Comparison */}
            <div>
              <Title order={2} size="h3" className="text-white mb-4">
                What You're Missing
              </Title>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pro Plan Features */}
                <Paper p="md" className="bg-[#2a2a2a] border border-[#3a3a3a]">
                  <div className="flex items-center justify-between mb-3">
                    <Title order={3} size="h4" className="text-white">
                      Pro Plan Analytics
                    </Title>
                    {currentTier === 'pro' && <Badge color="teal">Current</Badge>}
                  </div>
                  <Stack gap="sm">
                    <div className="flex items-start gap-2">
                      <IconCheck size={18} className="text-teal-400 mt-0.5 flex-shrink-0" />
                      <Text size="sm" className="text-gray-300">
                        Monthly message statistics for the last 12 months
                      </Text>
                    </div>
                    <div className="flex items-start gap-2">
                      <IconCheck size={18} className="text-teal-400 mt-0.5 flex-shrink-0" />
                      <Text size="sm" className="text-gray-300">
                        Visual charts showing message trends over time
                      </Text>
                    </div>
                    <div className="flex items-start gap-2">
                      <IconCheck size={18} className="text-teal-400 mt-0.5 flex-shrink-0" />
                      <Text size="sm" className="text-gray-300">
                        Total messages and average per month
                      </Text>
                    </div>
                    <div className="flex items-start gap-2">
                      <IconX size={18} className="text-gray-500 mt-0.5 flex-shrink-0" />
                      <Text size="sm" className="text-gray-500">
                        Customer-level details
                      </Text>
                    </div>
                  </Stack>
                  {currentTier !== 'free' && currentTier !== 'pro' && currentTier !== 'business' && (
                    <Button
                      color="teal"
                      className="mt-4 w-full"
                      onClick={() => navigate('/billing')}
                    >
                      Upgrade to Pro
                    </Button>
                  )}
                </Paper>

                {/* Business Plan Features */}
                <Paper p="md" className="bg-[#2a2a2a] border border-[#3a3a3a]">
                  <div className="flex items-center justify-between mb-3">
                    <Title order={3} size="h4" className="text-white">
                      Business Plan Analytics
                    </Title>
                    {(currentTier === 'business' || currentTier === 'free') && <Badge color="teal">Current</Badge>}
                  </div>
                  <Stack gap="sm">
                    <div className="flex items-start gap-2">
                      <IconCheck size={18} className="text-teal-400 mt-0.5 flex-shrink-0" />
                      <Text size="sm" className="text-gray-300">
                        Everything in Pro, plus:
                      </Text>
                    </div>
                    <div className="flex items-start gap-2">
                      <IconCheck size={18} className="text-teal-400 mt-0.5 flex-shrink-0" />
                      <Text size="sm" className="text-gray-300">
                        Detailed customer-level analytics
                      </Text>
                    </div>
                    <div className="flex items-start gap-2">
                      <IconCheck size={18} className="text-teal-400 mt-0.5 flex-shrink-0" />
                      <Text size="sm" className="text-gray-300">
                        See who received messages each month
                      </Text>
                    </div>
                    <div className="flex items-start gap-2">
                      <IconCheck size={18} className="text-teal-400 mt-0.5 flex-shrink-0" />
                      <Text size="sm" className="text-gray-300">
                        Customer names, phone numbers, and job details
                      </Text>
                    </div>
                    <div className="flex items-start gap-2">
                      <IconCheck size={18} className="text-teal-400 mt-0.5 flex-shrink-0" />
                      <Text size="sm" className="text-gray-300">
                        Exact send timestamps for each message
                      </Text>
                    </div>
                  </Stack>
                  {currentTier !== 'free' && currentTier !== 'business' && (
                    <Button
                      color="teal"
                      variant={currentTier === 'pro' ? 'filled' : 'light'}
                      className="mt-4 w-full"
                      onClick={() => navigate('/billing')}
                    >
                      {currentTier === 'pro' ? 'Upgrade to Business' : 'Upgrade to Business'}
                    </Button>
                  )}
                </Paper>
              </div>
            </div>
          </Stack>
        </Paper>
      </Container>
    );
  }

  const isBusiness = analytics.tier === 'free' || analytics.tier === 'business';

  return (
    <Container size="lg" py="xl" className="px-xs sm:px-md">
      <Paper shadow="md" p="md" className="bg-[#1a1a1a]">
        <Stack gap="lg">
          {/* Account Error Alert */}
          <AccountErrorAlert />

          <div>
            <div className="flex items-center gap-3 mb-2">
              <IconChartBar size={32} className="text-teal-400" />
              <Title order={1} className="text-white">
                Analytics
              </Title>
            </div>
            <Text size="sm" className="text-gray-400">
              Track your SMS campaign performance and customer engagement
            </Text>
          </div>

          {/* SMS Usage Display */}
          {(smsSent !== null || loadingUsage) && subscriptionTier && (
            <div className="p-3 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
              {loadingUsage ? (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Text size="sm" className="text-gray-400">
                      SMS Usage:
                    </Text>
                    <Skeleton height={20} width={80} />
                    <Text size="xs" className="text-gray-500">
                      this month
                    </Text>
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton height={8} width={128} radius="xl" />
                    <Skeleton height={16} width={60} />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Text size="sm" className="text-gray-400">
                      SMS Usage:
                    </Text>
                    <Text size="sm" className="font-semibold text-white">
                      {smsSent} / {getSmsLimitFromTier(subscriptionTier)}
                    </Text>
                    <Text size="xs" className="text-gray-500">
                      this month
                    </Text>
                  </div>
                  {(() => {
                    const limit = getSmsLimitFromTier(subscriptionTier);
                    const percentage = limit > 0 ? (smsSent! / limit) * 100 : 0;
                    const isWarning = percentage >= 80;
                    const isDanger = percentage >= 100;

                    return (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 sm:w-32 h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              isDanger ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-teal-500'
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        {isDanger && (
                          <Text size="xs" className="text-red-400 font-medium">
                            Limit reached
                          </Text>
                        )}
                        {isWarning && !isDanger && (
                          <Text size="xs" className="text-yellow-400 font-medium">
                            Approaching limit
                          </Text>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Summary Cards */}
          <Paper p="md" className="bg-[#2a2a2a] border border-[#3a3a3a]">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <IconChartBar size={24} className="text-teal-400" />
                <div>
                  <Text size="xs" className="text-gray-400">
                    Total Messages
                  </Text>
                  <Text size="xl" className="text-white font-bold">
                    {analytics.totalMessages.toLocaleString()}
                  </Text>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <IconTrendingUp size={24} className="text-blue-400" />
                <div>
                  <Text size="xs" className="text-gray-400">
                    Avg per Month
                  </Text>
                  <Text size="xl" className="text-white font-bold">
                    {analytics.monthlyStats.length > 0
                      ? Math.round(
                          analytics.monthlyStats.reduce((sum, stat) => sum + stat.count, 0) /
                            analytics.monthlyStats.length
                        )
                      : 0}
                  </Text>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <IconClock size={24} className="text-green-400" />
                <div>
                  <Text size="xs" className="text-gray-400">
                    This Month
                  </Text>
                  <Text size="xl" className="text-white font-bold">
                    {analytics.monthlyStats[0]?.count || 0}
                  </Text>
                </div>
              </div>
            </div>
          </Paper>

          {/* Chart Section */}
          {analytics.monthlyStats.length > 0 && (
            <div>
              <Title order={2} size="h4" className="text-white mb-3">
                Message Trends
              </Title>
              <Paper p="md" className="bg-[#2a2a2a] border border-[#3a3a3a]">
                <Text size="sm" className="text-gray-400 mb-3 font-medium">
                  Messages Sent by Month
                </Text>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={[...analytics.monthlyStats].reverse()}
                    margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #4b5563',
                        borderRadius: '8px',
                        color: '#f3f4f6',
                      }}
                      labelStyle={{ color: '#e5e7eb', fontWeight: 600 }}
                      itemStyle={{ color: '#f3f4f6' }}
                      cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {[...analytics.monthlyStats].reverse().map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === analytics.monthlyStats.length - 1 ? '#059669' : '#14b8a6'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </div>
          )}

          {/* Customer Insights - Business Tier Only */}
          {isBusiness && analytics.insights && (
            <div>
              <Title order={2} size="h3" className="text-white mb-4">
                Customer Insights
              </Title>
              <Accordion
                multiple
                variant="separated"
                radius="sm"
                classNames={{
                  item: 'bg-[#2a2a2a] border-[#3a3a3a]',
                  control: 'hover:bg-[#333333] py-3 px-4',
                  label: 'text-white',
                  content: 'pt-3',
                  chevron: 'text-teal-400',
                }}
              >
                {/* Not Contacted in 5+ Days */}
                <Accordion.Item value="not-contacted-5">
                  <Accordion.Control>
                    <div className="flex items-center gap-2">
                      <IconClock size={18} className="text-yellow-400" />
                      <div className="flex-1">
                        <Text className="text-white font-semibold">Not Contacted (5-9 days)</Text>
                        <Text size="xs" className="text-gray-400">
                          {analytics.insights.notContacted5Days.length} customer
                          {analytics.insights.notContacted5Days.length !== 1 ? 's' : ''}
                        </Text>
                      </div>
                    </div>
                  </Accordion.Control>
                  <Accordion.Panel>
                    {analytics.insights.notContacted5Days.length > 0 ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 max-h-96 overflow-y-auto mt-2">
                        {analytics.insights.notContacted5Days.map((customer) => {
                          const createdDate = new Date(customer.createdAt);
                          const formattedCreated = createdDate.toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          });
                          const isSending = sendingCustomerId === customer.id;
                          const phoneDisplay = formatPhone(customer.phone);

                          return (
                            <Paper
                              key={customer.id}
                              shadow="sm"
                              className="bg-[#141414] border border-[#2a2a2a] hover:border-[#333333] transition-colors"
                              style={{ padding: '1rem' }}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <div className="font-semibold text-lg text-white mb-1">
                                    {customer.name}
                                  </div>
                                  <div className="text-sm text-gray-400 font-medium flex items-center gap-1.5">
                                    <span className="flex items-center justify-center text-base leading-none">
                                      {phoneDisplay.flag}
                                    </span>
                                    <span>{phoneDisplay.number}</span>
                                  </div>
                                  {customer.createdAt && (
                                    <div className="mt-0.5 text-sm text-gray-500">
                                      Added: {formattedCreated}
                                    </div>
                                  )}
                                  {customer.daysSinceContact !== null &&
                                    customer.daysSinceContact !== undefined && (
                                      <div className="mt-1 text-xs text-yellow-400">
                                        {customer.daysSinceContact}d ago. No request sent.
                                      </div>
                                    )}
                                  {customer.sms_status === 'scheduled' &&
                                    customer.scheduled_send_at && (
                                      <div className="mt-1 text-xs text-blue-400 flex items-center gap-1">
                                        <IconClock size={12} />
                                        SMS scheduled{' '}
                                        {new Date(customer.scheduled_send_at).toLocaleString(
                                          'en-GB',
                                          {
                                            day: 'numeric',
                                            month: 'short',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          }
                                        )}
                                      </div>
                                    )}
                                </div>
                                <div className="flex flex-col items-end gap-1 ml-2">
                                  {customer.lastContacted && (
                                    <div
                                      className="font-medium"
                                      style={{ fontSize: '0.875rem', color: '#9ca3af' }}
                                    >
                                      {formatDate(customer.lastContacted)}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {customer.job_description && (
                                <div className="text-sm text-gray-300 mb-4 p-4 bg-[#2a2a2a]/50 rounded-lg border border-[#2a2a2a]">
                                  {customer.job_description}
                                </div>
                              )}
                              <div className="flex justify-end items-center pt-2 border-t border-[#2a2a2a]">
                                <Button
                                  size="xs"
                                  variant="filled"
                                  color="teal"
                                  onClick={() => handleSendSMS(customer.id)}
                                  loading={isSending}
                                  disabled={isSending}
                                  radius="md"
                                  className="font-medium"
                                >
                                  {isSending ? 'Sending...' : 'Request Review'}
                                </Button>
                              </div>
                            </Paper>
                          );
                        })}
                      </div>
                    ) : (
                      <Text size="sm" className="text-gray-400 text-center py-4">
                        No customers in this category
                      </Text>
                    )}
                  </Accordion.Panel>
                </Accordion.Item>

                {/* Not Contacted in 10+ Days */}
                <Accordion.Item value="not-contacted-10">
                  <Accordion.Control>
                    <div className="flex items-center gap-2">
                      <IconClock size={18} className="text-orange-400" />
                      <div className="flex-1">
                        <Text className="text-white font-semibold">Not Contacted (10-29 days)</Text>
                        <Text size="xs" className="text-gray-400">
                          {analytics.insights.notContacted10Days.length} customer
                          {analytics.insights.notContacted10Days.length !== 1 ? 's' : ''}
                        </Text>
                      </div>
                    </div>
                  </Accordion.Control>
                  <Accordion.Panel>
                    {analytics.insights.notContacted10Days.length > 0 ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 max-h-96 overflow-y-auto mt-2">
                        {analytics.insights.notContacted10Days.map((customer) => {
                          const createdDate = new Date(customer.createdAt);
                          const formattedCreated = createdDate.toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          });
                          const isSending = sendingCustomerId === customer.id;
                          const phoneDisplay = formatPhone(customer.phone);

                          return (
                            <Paper
                              key={customer.id}
                              shadow="sm"
                              className="bg-[#141414] border border-[#2a2a2a] hover:border-[#333333] transition-colors"
                              style={{ padding: '1rem' }}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <div className="font-semibold text-lg text-white mb-1">
                                    {customer.name}
                                  </div>
                                  <div className="text-sm text-gray-400 font-medium flex items-center gap-1.5">
                                    <span className="flex items-center justify-center text-base leading-none">
                                      {phoneDisplay.flag}
                                    </span>
                                    <span>{phoneDisplay.number}</span>
                                  </div>
                                  {customer.createdAt && (
                                    <div className="mt-0.5 text-sm text-gray-500">
                                      Added: {formattedCreated}
                                    </div>
                                  )}
                                  {customer.daysSinceContact !== null &&
                                    customer.daysSinceContact !== undefined && (
                                      <div className="mt-1 text-xs text-orange-400">
                                        {customer.daysSinceContact}d ago. No request sent.
                                      </div>
                                    )}
                                  {customer.sms_status === 'scheduled' &&
                                    customer.scheduled_send_at && (
                                      <div className="mt-1 text-xs text-blue-400 flex items-center gap-1">
                                        <IconClock size={12} />
                                        SMS scheduled{' '}
                                        {new Date(customer.scheduled_send_at).toLocaleString(
                                          'en-GB',
                                          {
                                            day: 'numeric',
                                            month: 'short',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          }
                                        )}
                                      </div>
                                    )}
                                </div>
                                <div className="flex flex-col items-end gap-1 ml-2">
                                  {customer.lastContacted && (
                                    <div
                                      className="font-medium"
                                      style={{ fontSize: '0.875rem', color: '#9ca3af' }}
                                    >
                                      {formatDate(customer.lastContacted)}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {customer.job_description && (
                                <div className="text-sm text-gray-300 mb-4 p-4 bg-[#2a2a2a]/50 rounded-lg border border-[#2a2a2a]">
                                  {customer.job_description}
                                </div>
                              )}
                              <div className="flex justify-end items-center pt-2 border-t border-[#2a2a2a]">
                                <Button
                                  size="xs"
                                  variant="filled"
                                  color="teal"
                                  onClick={() => handleSendSMS(customer.id)}
                                  loading={isSending}
                                  disabled={isSending}
                                  radius="md"
                                  className="font-medium"
                                >
                                  {isSending ? 'Sending...' : 'Request Review'}
                                </Button>
                              </div>
                            </Paper>
                          );
                        })}
                      </div>
                    ) : (
                      <Text size="sm" className="text-gray-400 text-center py-4">
                        No customers in this category
                      </Text>
                    )}
                  </Accordion.Panel>
                </Accordion.Item>

                {/* Not Contacted in 30+ Days */}
                <Accordion.Item value="not-contacted-30">
                  <Accordion.Control>
                    <div className="flex items-center gap-2">
                      <IconClock size={18} className="text-red-400" />
                      <div className="flex-1">
                        <Text className="text-white font-semibold">Not Contacted (30+ days)</Text>
                        <Text size="xs" className="text-gray-400">
                          {analytics.insights.notContacted30Days.length} customer
                          {analytics.insights.notContacted30Days.length !== 1 ? 's' : ''}
                        </Text>
                      </div>
                    </div>
                  </Accordion.Control>
                  <Accordion.Panel>
                    {analytics.insights.notContacted30Days.length > 0 ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 max-h-96 overflow-y-auto mt-2">
                        {analytics.insights.notContacted30Days.map((customer) => {
                          const createdDate = new Date(customer.createdAt);
                          const formattedCreated = createdDate.toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          });
                          const isSending = sendingCustomerId === customer.id;
                          const phoneDisplay = formatPhone(customer.phone);

                          return (
                            <Paper
                              key={customer.id}
                              shadow="sm"
                              className="bg-[#141414] border border-[#2a2a2a] hover:border-[#333333] transition-colors"
                              style={{ padding: '1rem' }}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <div className="font-semibold text-lg text-white mb-1">
                                    {customer.name}
                                  </div>
                                  <div className="text-sm text-gray-400 font-medium flex items-center gap-1.5">
                                    <span className="flex items-center justify-center text-base leading-none">
                                      {phoneDisplay.flag}
                                    </span>
                                    <span>{phoneDisplay.number}</span>
                                  </div>
                                  {customer.createdAt && (
                                    <div className="mt-0.5 text-sm text-gray-500">
                                      Added: {formattedCreated}
                                    </div>
                                  )}
                                  {customer.daysSinceContact !== null &&
                                    customer.daysSinceContact !== undefined && (
                                      <div className="mt-1 text-xs text-red-400">
                                        {customer.daysSinceContact}d ago. No request sent.
                                      </div>
                                    )}
                                  {customer.sms_status === 'scheduled' &&
                                    customer.scheduled_send_at && (
                                      <div className="mt-1 text-xs text-blue-400 flex items-center gap-1">
                                        <IconClock size={12} />
                                        SMS scheduled{' '}
                                        {new Date(customer.scheduled_send_at).toLocaleString(
                                          'en-GB',
                                          {
                                            day: 'numeric',
                                            month: 'short',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          }
                                        )}
                                      </div>
                                    )}
                                </div>
                                <div className="flex flex-col items-end gap-1 ml-2">
                                  {customer.lastContacted && (
                                    <div
                                      className="font-medium"
                                      style={{ fontSize: '0.875rem', color: '#9ca3af' }}
                                    >
                                      {formatDate(customer.lastContacted)}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {customer.job_description && (
                                <div className="text-sm text-gray-300 mb-4 p-4 bg-[#2a2a2a]/50 rounded-lg border border-[#2a2a2a]">
                                  {customer.job_description}
                                </div>
                              )}
                              <div className="flex justify-end items-center pt-2 border-t border-[#2a2a2a]">
                                <Button
                                  size="xs"
                                  variant="filled"
                                  color="teal"
                                  onClick={() => handleSendSMS(customer.id)}
                                  loading={isSending}
                                  disabled={isSending}
                                  radius="md"
                                  className="font-medium"
                                >
                                  {isSending ? 'Sending...' : 'Request Review'}
                                </Button>
                              </div>
                            </Paper>
                          );
                        })}
                      </div>
                    ) : (
                      <Text size="sm" className="text-gray-400 text-center py-4">
                        No customers in this category
                      </Text>
                    )}
                  </Accordion.Panel>
                </Accordion.Item>

                {/* Approaching Message Limit */}
                <Accordion.Item value="approaching-limit">
                  <Accordion.Control>
                    <div className="flex items-center gap-2">
                      <IconAlertTriangle size={18} className="text-orange-400" />
                      <div className="flex-1">
                        <Text className="text-white font-semibold">Approaching Message Limit</Text>
                        <Text size="xs" className="text-gray-400">
                          {analytics.insights.approachingLimit.length} customer
                          {analytics.insights.approachingLimit.length !== 1 ? 's' : ''} have 2/3
                          messages
                        </Text>
                      </div>
                    </div>
                  </Accordion.Control>
                  <Accordion.Panel>
                    {analytics.insights.approachingLimit.length > 0 ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 max-h-96 overflow-y-auto mt-2">
                        {analytics.insights.approachingLimit.map((customer) => {
                          const createdDate = new Date(customer.createdAt);
                          const formattedCreated = createdDate.toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          });
                          const phoneDisplay = formatPhone(customer.phone);

                          return (
                            <Paper
                              key={customer.id}
                              shadow="sm"
                              className="bg-[#141414] border border-[#2a2a2a] hover:border-[#333333] transition-colors"
                              style={{ padding: '1rem' }}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <div className="font-semibold text-lg text-white mb-1">
                                    {customer.name}
                                  </div>
                                  <div className="text-sm text-gray-400 font-medium flex items-center gap-1.5">
                                    <span className="flex items-center justify-center text-base leading-none">
                                      {phoneDisplay.flag}
                                    </span>
                                    <span>{phoneDisplay.number}</span>
                                  </div>
                                  {customer.createdAt && (
                                    <div className="mt-0.5 text-sm text-gray-500">
                                      Added: {formattedCreated}
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col items-end gap-1.5 ml-2">
                                  <Badge color="orange" size="sm" radius="md">
                                    {customer.messageCount}/3
                                  </Badge>
                                </div>
                              </div>
                              {customer.job_description && (
                                <div className="text-sm text-gray-300 p-4 bg-[#2a2a2a]/50 rounded-lg border border-[#2a2a2a] mb-4">
                                  {customer.job_description}
                                </div>
                              )}
                            </Paper>
                          );
                        })}
                      </div>
                    ) : (
                      <Text size="sm" className="text-gray-400 text-center py-4">
                        No customers in this category
                      </Text>
                    )}
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>
            </div>
          )}

          {/* Monthly Breakdown */}
          <div>
            <Title order={2} size="h3" className="text-white mb-4">
              Monthly Breakdown
            </Title>
            {analytics.monthlyStats.length === 0 ? (
              <Alert color="blue">
                <Text size="sm" className="text-gray-300">
                  No messages sent yet. Start sending review requests to see analytics here.
                </Text>
              </Alert>
            ) : (
              <Accordion
                multiple
                variant="separated"
                radius="sm"
                value={expandedMonths}
                onChange={setExpandedMonths}
                classNames={{
                  item: 'bg-[#2a2a2a] border-[#3a3a3a]',
                  control: 'hover:bg-[#333333] py-4',
                  label: 'text-white',
                  content: 'pt-0',
                  chevron: 'text-teal-400',
                }}
              >
                {analytics.monthlyStats.map((stat, index) => (
                  <Accordion.Item key={index} value={`month-${stat.month}-${stat.year}`}>
                    <Accordion.Control>
                      <div className="flex items-center justify-between w-full pr-4">
                        <div>
                          <Text className="font-semibold text-white">{stat.month}</Text>
                          <Text size="sm" className="text-gray-400">
                            {stat.count} {stat.count === 1 ? 'message' : 'messages'} sent
                          </Text>
                        </div>
                        {index === 0 && stat.count > 0 && (
                          <Badge color="teal" leftSection={<IconTrendingUp size={14} />}>
                            Current
                          </Badge>
                        )}
                      </div>
                    </Accordion.Control>
                    <Accordion.Panel>
                      {/* Customer details - blurred for Pro, visible for Business */}
                      {analytics.tier === 'pro' && stat.count > 0 && (
                        <div className="mt-4 pt-4 border-t border-[#3a3a3a] relative">
                          <div className="blur-sm pointer-events-none select-none">
                            <Text size="sm" className="text-gray-400 mb-2 font-medium">
                              Customer Details ({stat.count})
                            </Text>
                            {/* Mobile: Compact Accordion */}
                            <div className="block md:hidden">
                              <Accordion
                                key={`pro-accordion-${stat.month}-${stat.year}`}
                                multiple
                                variant="separated"
                                radius="sm"
                                value={expandedItems[`pro-${stat.month}-${stat.year}`] || []}
                                onChange={(value) =>
                                  setExpandedItems((prev) => ({
                                    ...prev,
                                    [`pro-${stat.month}-${stat.year}`]: value,
                                  }))
                                }
                                classNames={{
                                  item: 'bg-[#1a1a1a] border-[#3a3a3a]',
                                  control: 'py-3 px-4 hover:bg-[#2a2a2a]',
                                  label: 'text-white text-sm font-medium',
                                  content: 'text-gray-300 text-sm p-4',
                                  chevron: 'text-teal-400',
                                }}
                                styles={{
                                  label: {
                                    paddingTop: 0,
                                    paddingBottom: 0,
                                  },
                                  control: {
                                    paddingTop: '0.75rem',
                                    paddingBottom: '0.75rem',
                                  },
                                  item: {
                                    marginTop: '0.25rem',
                                    marginBottom: 0,
                                  },
                                }}
                              >
                                {[...Array(Math.min(stat.count, 3))].map((_, idx) => (
                                  <Accordion.Item
                                    key={idx}
                                    value={`${stat.month}-${stat.year}-${idx}`}
                                  >
                                    <Accordion.Control>
                                      <div className="flex items-center justify-between w-full pr-2">
                                        <Text size="sm" className="text-white font-medium">
                                          John Smith
                                        </Text>
                                        <Text size="sm" className="text-gray-400">
                                          {new Date().toLocaleDateString('en-GB', {
                                            day: 'numeric',
                                            month: 'short',
                                          })}
                                        </Text>
                                      </div>
                                    </Accordion.Control>
                                    <Accordion.Panel>
                                      <div className="space-y-2">
                                        <div className="flex justify-between">
                                          <Text size="sm" className="text-gray-400">
                                            Phone:
                                          </Text>
                                          <Text size="sm" className="text-gray-200 font-medium">
                                            07780586444
                                          </Text>
                                        </div>
                                        <div className="flex justify-between">
                                          <Text size="sm" className="text-gray-400">
                                            Job:
                                          </Text>
                                          <Text size="sm" className="text-gray-200">
                                            Kitchen renovation
                                          </Text>
                                        </div>
                                      </div>
                                    </Accordion.Panel>
                                  </Accordion.Item>
                                ))}
                              </Accordion>
                            </div>
                            {/* Desktop: Compact Table */}
                            <div className="hidden md:block">
                              <div className="overflow-x-auto">
                                <Table verticalSpacing="xs">
                                  <Table.Thead>
                                    <Table.Tr>
                                      <Table.Th className="text-gray-400 text-xs">
                                        Customer
                                      </Table.Th>
                                      <Table.Th className="text-gray-400 text-xs">Job</Table.Th>
                                      <Table.Th className="text-gray-400 text-xs">Phone</Table.Th>
                                      <Table.Th className="text-gray-400 text-xs">Sent</Table.Th>
                                    </Table.Tr>
                                  </Table.Thead>
                                  <Table.Tbody>
                                    {[...Array(Math.min(stat.count, 3))].map((_, idx) => (
                                      <Table.Tr key={idx}>
                                        <Table.Td className="text-white text-sm">
                                          John Smith
                                        </Table.Td>
                                        <Table.Td className="text-gray-300 text-sm">
                                          Kitchen renovation
                                        </Table.Td>
                                        <Table.Td className="text-gray-300 text-sm">
                                          07780586444
                                        </Table.Td>
                                        <Table.Td className="text-gray-400 text-xs">
                                          {new Date().toLocaleDateString('en-GB', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                          })}
                                        </Table.Td>
                                      </Table.Tr>
                                    ))}
                                  </Table.Tbody>
                                </Table>
                              </div>
                            </div>
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Paper
                              p="md"
                              className="bg-[#1a1a1a]/95 border-2 border-teal-500/50 rounded-lg"
                            >
                              <Stack gap="sm" align="center">
                                <IconChartBar size={32} className="text-teal-400" />
                                <Text size="sm" className="text-white font-semibold text-center">
                                  Upgrade to Business to see customer details
                                </Text>
                                <Button color="teal" size="sm" onClick={() => navigate('/billing')}>
                                  Upgrade to Business
                                </Button>
                              </Stack>
                            </Paper>
                          </div>
                        </div>
                      )}
                      {isBusiness && stat.customers && stat.customers.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-[#3a3a3a]">
                          <Text size="sm" className="text-gray-400 mb-2 font-medium">
                            Customer Details ({stat.customers.length})
                          </Text>
                          {/* Mobile: Compact Accordion */}
                          <div className="block md:hidden">
                            <Accordion
                              key={`business-accordion-${stat.month}-${stat.year}`}
                              multiple
                              variant="separated"
                              radius="sm"
                              value={expandedItems[`business-${stat.month}-${stat.year}`] || []}
                              onChange={(value) =>
                                setExpandedItems((prev) => ({
                                  ...prev,
                                  [`business-${stat.month}-${stat.year}`]: value,
                                }))
                              }
                              classNames={{
                                item: 'bg-[#1a1a1a] border-[#3a3a3a]',
                                control: 'py-0 px-1 hover:bg-[#2a2a2a]',
                                label: 'text-white text-sm font-medium',
                                content: 'text-gray-300 text-sm p-4',
                                chevron: 'text-teal-400',
                              }}
                              styles={{
                                label: {
                                  paddingTop: 0,
                                  paddingBottom: 0,
                                },
                                control: {
                                  paddingTop: '0.125rem',
                                  paddingBottom: '0.125rem',
                                },
                                item: {
                                  marginTop: '0.25rem',
                                  marginBottom: 0,
                                },
                              }}
                            >
                              {stat.customers.map((customer, idx) => (
                                <Accordion.Item
                                  key={`${customer.id}-${customer.sent_at}`}
                                  value={`${stat.month}-${stat.year}-${customer.id}-${idx}`}
                                >
                                  <Accordion.Control>
                                    <div className="flex items-center justify-between w-full pr-2">
                                      <Text size="sm" className="text-white font-medium">
                                        {customer.name}
                                      </Text>
                                      <Text size="sm" className="text-gray-400">
                                        {new Date(customer.sent_at).toLocaleDateString('en-GB', {
                                          day: 'numeric',
                                          month: 'short',
                                        })}
                                      </Text>
                                    </div>
                                  </Accordion.Control>
                                  <Accordion.Panel>
                                    <div className="space-y-2">
                                      <div className="flex justify-between">
                                        <Text size="sm" className="text-gray-400">
                                          Phone:
                                        </Text>
                                        <Text size="sm" className="text-gray-200 font-medium">
                                          {customer.phone}
                                        </Text>
                                      </div>
                                      {customer.job_description && (
                                        <div className="flex justify-between">
                                          <Text size="sm" className="text-gray-400">
                                            Job:
                                          </Text>
                                          <Text
                                            size="sm"
                                            className="text-gray-200 text-right max-w-[60%]"
                                          >
                                            {customer.job_description}
                                          </Text>
                                        </div>
                                      )}
                                      <div className="flex justify-between">
                                        <Text size="sm" className="text-gray-400">
                                          Sent:
                                        </Text>
                                        <div className="flex items-center gap-1.5">
                                          <Text size="sm" className="text-gray-300">
                                            {formatDate(customer.sent_at)}
                                          </Text>
                                          {customer.was_scheduled && (
                                            <MantineTooltip label="Sent via scheduled automation">
                                              <IconClock size={14} className="text-blue-400" />
                                            </MantineTooltip>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </Accordion.Panel>
                                </Accordion.Item>
                              ))}
                            </Accordion>
                          </div>
                          {/* Desktop: Compact Table */}
                          <div className="hidden md:block">
                            <div className="overflow-x-auto">
                              <Table verticalSpacing="xs">
                                <Table.Thead>
                                  <Table.Tr>
                                    <Table.Th className="text-gray-400 text-xs">Customer</Table.Th>
                                    <Table.Th className="text-gray-400 text-xs">Job</Table.Th>
                                    <Table.Th className="text-gray-400 text-xs">Phone</Table.Th>
                                    <Table.Th className="text-gray-400 text-xs">Sent</Table.Th>
                                  </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                  {stat.customers.map((customer) => (
                                    <Table.Tr key={`${customer.id}-${customer.sent_at}`}>
                                      <Table.Td className="text-white text-sm">
                                        {customer.name}
                                      </Table.Td>
                                      <Table.Td className="text-gray-300 text-sm">
                                        {customer.job_description || '-'}
                                      </Table.Td>
                                      <Table.Td className="text-gray-300 text-sm">
                                        {customer.phone}
                                      </Table.Td>
                                      <Table.Td className="text-gray-400 text-xs">
                                        <div className="flex items-center gap-1.5">
                                          {formatDate(customer.sent_at)}
                                          {customer.was_scheduled && (
                                            <MantineTooltip label="Sent via scheduled automation">
                                              <IconClock size={14} className="text-blue-400" />
                                            </MantineTooltip>
                                          )}
                                        </div>
                                      </Table.Td>
                                    </Table.Tr>
                                  ))}
                                </Table.Tbody>
                              </Table>
                            </div>
                          </div>
                        </div>
                      )}
                    </Accordion.Panel>
                  </Accordion.Item>
                ))}
              </Accordion>
            )}
          </div>
        </Stack>
      </Paper>
    </Container>
  );
};
