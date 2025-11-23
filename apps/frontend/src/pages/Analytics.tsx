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
} from '@mantine/core';
import {
  IconChartBar,
  IconAlertCircle,
  IconTrendingUp,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import { apiClient } from '@/lib/api';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
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
  }>;
}

export const Analytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<{
    tier: string;
    monthlyStats: MonthlyStat[];
    totalMessages: number;
  } | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);

  useEffect(() => {
    loadSubscriptionTier();
    loadAnalytics();
  }, []);

  const loadSubscriptionTier = async () => {
    try {
      const subscription = await apiClient.getSubscription();
      setSubscriptionTier(subscription.subscriptionTier || null);
    } catch (error) {
      // Failed to load subscription
    }
  };

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getAnalytics();
      setAnalytics(data);
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

  if (loading) {
    return (
      <Container size="lg" py="xl">
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
      <Container size="lg" py="xl">
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
                      See detailed insights about your SMS campaigns, including monthly trends,
                      customer engagement, and performance metrics.
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
                  {currentTier !== 'pro' && currentTier !== 'business' && (
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
                    {currentTier === 'business' && <Badge color="teal">Current</Badge>}
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
                  {currentTier !== 'business' && (
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

  const isBusiness = analytics.tier === 'business';

  return (
    <Container size="lg" py="xl">
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

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Paper p="md" className="bg-[#2a2a2a] border border-[#3a3a3a]">
              <Text size="xs" className="text-gray-400 mb-1">
                Total Messages
              </Text>
              <Text size="xl" className="font-bold text-white">
                {analytics.totalMessages.toLocaleString()}
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
                {analytics.monthlyStats.length > 0
                  ? Math.round(
                      analytics.monthlyStats.reduce((sum, stat) => sum + stat.count, 0) /
                        analytics.monthlyStats.length
                    )
                  : 0}
              </Text>
              <Text size="xs" className="text-gray-500 mt-1">
                {analytics.monthlyStats.length} months tracked
              </Text>
            </Paper>
            <Paper p="md" className="bg-[#2a2a2a] border border-[#3a3a3a]">
              <Text size="xs" className="text-gray-400 mb-1">
                This Month
              </Text>
              <Text size="xl" className="font-bold text-white">
                {analytics.monthlyStats[0]?.count || 0}
              </Text>
              <Text size="xs" className="text-gray-500 mt-1">
                {analytics.monthlyStats[0]?.month || 'No data'}
              </Text>
            </Paper>
          </div>

          {/* Chart Section */}
          {analytics.monthlyStats.length > 0 && (
            <div>
              <Title order={2} size="h3" className="text-white mb-4">
                Message Trends
              </Title>
              <Paper p="md" className="bg-[#2a2a2a] border border-[#3a3a3a]">
                <Text size="sm" className="text-gray-400 mb-4 font-medium">
                  Messages Sent by Month
                </Text>
                <ResponsiveContainer width="100%" height={300}>
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
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #3a3a3a',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                      labelStyle={{ color: '#9ca3af' }}
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
              <div className="space-y-4">
                {analytics.monthlyStats.map((stat, index) => (
                  <Paper key={index} p="md" className="bg-[#2a2a2a] border border-[#3a3a3a]">
                    <div className="flex items-center justify-between mb-3">
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

                    {/* Customer details - blurred for Pro, visible for Business */}
                    {analytics.tier === 'pro' && stat.count > 0 && (
                      <div className="mt-4 pt-4 border-t border-[#3a3a3a] relative">
                        <div className="blur-sm pointer-events-none select-none">
                          <Text size="sm" className="text-gray-400 mb-3 font-medium">
                            Customer Details
                          </Text>
                          <div className="overflow-x-auto">
                            <Table>
                              <Table.Thead>
                                <Table.Tr>
                                  <Table.Th className="text-gray-400">Customer</Table.Th>
                                  <Table.Th className="text-gray-400">Phone</Table.Th>
                                  <Table.Th className="text-gray-400">Job</Table.Th>
                                  <Table.Th className="text-gray-400">Sent</Table.Th>
                                </Table.Tr>
                              </Table.Thead>
                              <Table.Tbody>
                                {[...Array(Math.min(stat.count, 3))].map((_, idx) => (
                                  <Table.Tr key={idx}>
                                    <Table.Td className="text-white">John Smith</Table.Td>
                                    <Table.Td className="text-gray-300">07780586444</Table.Td>
                                    <Table.Td className="text-gray-300">
                                      Kitchen renovation
                                    </Table.Td>
                                    <Table.Td className="text-gray-400 text-sm">
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
                        <Text size="sm" className="text-gray-400 mb-3 font-medium">
                          Customer Details
                        </Text>
                        <div className="overflow-x-auto">
                          <Table>
                            <Table.Thead>
                              <Table.Tr>
                                <Table.Th className="text-gray-400">Customer</Table.Th>
                                <Table.Th className="text-gray-400">Phone</Table.Th>
                                <Table.Th className="text-gray-400">Job</Table.Th>
                                <Table.Th className="text-gray-400">Sent</Table.Th>
                              </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                              {stat.customers.map((customer) => (
                                <Table.Tr key={`${customer.id}-${customer.sent_at}`}>
                                  <Table.Td className="text-white">{customer.name}</Table.Td>
                                  <Table.Td className="text-gray-300">{customer.phone}</Table.Td>
                                  <Table.Td className="text-gray-300">
                                    {customer.job_description || '-'}
                                  </Table.Td>
                                  <Table.Td className="text-gray-400 text-sm">
                                    {formatDate(customer.sent_at)}
                                  </Table.Td>
                                </Table.Tr>
                              ))}
                            </Table.Tbody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </Paper>
                ))}
              </div>
            )}
          </div>
        </Stack>
      </Paper>
    </Container>
  );
};
