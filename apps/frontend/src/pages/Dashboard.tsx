import { useEffect, useState } from 'react';
import {
  Paper,
  Title,
  Text,
  Container,
  Stack,
  Button,
  Badge,
  Card,
  SimpleGrid,
  Skeleton,
  Group,
  Progress,
} from '@mantine/core';
import {
  IconUserPlus,
  IconMessageCircle,
  IconCreditCard,
  IconChartBar,
  IconUsers,
  IconSettings,
  IconCheck,
  IconCircle,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api';
import { notifications } from '@mantine/notifications';
import { useAccount } from '@/contexts/AccountContext';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { account, subscriptionTier, loading: accountLoading } = useAccount();
  const [stats, setStats] = useState<{
    hasAccountSetup: boolean;
    totalCustomers: number;
    messagesSent: number;
    hasSubscription: boolean;
    onboardingCompleted: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [subscriptionTier]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Get user data and stats
      const [userData, customers] = await Promise.all([
        apiClient.getAccount(),
        apiClient.getCustomers({ page: 1, limit: 100 }),
      ]);

      const hasAccountSetup = !!(
        userData.business_name &&
        userData.review_links &&
        userData.review_links.length > 0
      );
      const hasSubscription = !!subscriptionTier && subscriptionTier !== 'starter';

      setStats({
        hasAccountSetup,
        totalCustomers: customers.total || 0,
        messagesSent: customers.customers?.filter((c) => c.sent_at).length || 0,
        hasSubscription,
        onboardingCompleted: userData.onboarding_completed || false,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load dashboard data',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const completeSetup = async () => {
    try {
      await apiClient.updateAccount({ onboarding_completed: true });
      await loadDashboardData(); // Reload to update UI
    } catch (error) {
      console.error('Error completing setup:', error);
    }
  };

  if (loading || accountLoading) {
    return (
      <Container size="lg" py="md" px="xs">
        <Stack gap="lg">
          <Skeleton height={120} />
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
            <Skeleton height={150} />
            <Skeleton height={150} />
            <Skeleton height={150} />
          </SimpleGrid>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="lg" py="md" px="xs">
      <Stack gap="lg">
        <div>
          <Title order={1} className="text-white mb-2 text-2xl sm:text-3xl">
            Dashboard
          </Title>
          <Text size="sm" className="text-gray-400">
            Quick access to everything you need
          </Text>
        </div>

        {/* Setup Checklist for users who haven't completed onboarding */}
        {!stats?.onboardingCompleted &&
          stats &&
          (() => {
            const setupSteps = [
              {
                id: 'account',
                label: 'Set Up SMS',
                description: 'Configure your business name and review links',
                completed: stats.hasAccountSetup,
                action: () => navigate('/account'),
                buttonText: 'Configure',
              },
              {
                id: 'customer',
                label: 'Add First Customer',
                description: 'Add a customer to your list',
                completed: stats.totalCustomers > 0,
                action: () => navigate('/customers/add'),
                buttonText: 'Add Customer',
              },
              {
                id: 'plan',
                label: 'Choose a Plan',
                description: 'Select the right plan for your business',
                completed: stats.hasSubscription,
                action: () => navigate('/billing'),
                buttonText: 'View Plans',
              },
            ];

            const completedCount = setupSteps.filter((s) => s.completed).length;
            const progressPercent = (completedCount / setupSteps.length) * 100;
            const allComplete = completedCount === setupSteps.length;

            return (
              <Paper shadow="md" p="md" className="bg-[#1a1a1a]">
                <Stack gap="md">
                  <div>
                    <Title order={2} className="text-white mb-2 text-lg sm:text-xl">
                      Complete Your Setup 🎉
                    </Title>
                    <Text size="sm" className="text-gray-300 mb-3">
                      Get started with MyRevuHQ in just a few steps
                    </Text>

                    <div className="mb-2">
                      <Group justify="space-between" className="mb-1">
                        <Text size="xs" className="text-gray-400">
                          {completedCount} of {setupSteps.length} completed
                        </Text>
                        <Text size="xs" className="text-teal-400 font-semibold">
                          {Math.round(progressPercent)}%
                        </Text>
                      </Group>
                      <Progress value={progressPercent} color="teal" size="sm" className="w-full" />
                    </div>
                  </div>

                  <Stack gap="xs">
                    {setupSteps.map((step) => (
                      <Card
                        key={step.id}
                        padding="sm"
                        className={`bg-[#141414] border ${
                          step.completed ? 'border-teal-500/30' : 'border-[#2a2a2a]'
                        }`}
                      >
                        <Group justify="space-between" wrap="nowrap" align="flex-start">
                          <Group wrap="nowrap" align="flex-start" gap="sm" className="flex-1">
                            <div
                              className={`mt-1 ${step.completed ? 'text-teal-400' : 'text-gray-500'}`}
                            >
                              {step.completed ? <IconCheck size={20} /> : <IconCircle size={20} />}
                            </div>
                            <div className="flex-1">
                              <Group gap="xs" className="mb-1">
                                <Text className="text-white font-semibold text-sm">
                                  {step.label}
                                </Text>
                                {step.completed && (
                                  <Badge color="teal" size="xs" variant="light">
                                    Done
                                  </Badge>
                                )}
                              </Group>
                              <Text size="xs" className="text-gray-400">
                                {step.description}
                              </Text>
                            </div>
                          </Group>
                          {!step.completed && (
                            <Button
                              size="xs"
                              variant="light"
                              color="teal"
                              onClick={step.action}
                              className="flex-shrink-0"
                            >
                              {step.buttonText}
                            </Button>
                          )}
                        </Group>
                      </Card>
                    ))}
                  </Stack>

                  {allComplete && (
                    <Card
                      padding="md"
                      className="bg-gradient-to-r from-teal-900/40 to-blue-900/40 border border-teal-700/30"
                    >
                      <Stack gap="sm" align="center">
                        <div className="inline-block p-3 bg-teal-500/20 rounded-full">
                          <IconCheck size={32} className="text-teal-400" />
                        </div>
                        <div className="text-center">
                          <Text className="text-white font-semibold mb-1">Setup Complete! 🚀</Text>
                          <Text size="sm" className="text-gray-300">
                            You're ready to grow your business with MyRevuHQ
                          </Text>
                        </div>
                        <Button color="teal" onClick={completeSetup} fullWidth size="md">
                          Got It!
                        </Button>
                      </Stack>
                    </Card>
                  )}
                </Stack>
              </Paper>
            );
          })()}

        {/* Quick Stats */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          <Card shadow="sm" padding="lg" className="bg-[#1a1a1a] border border-[#2a2a2a]">
            <Group justify="space-between" align="flex-start">
              <div>
                <Text size="sm" className="text-gray-400 mb-2">
                  Total Customers
                </Text>
                <Text size="xl" className="text-white font-bold">
                  {stats?.totalCustomers || 0}
                </Text>
              </div>
              <IconUsers size={32} className="text-teal-400" />
            </Group>
          </Card>

          <Card shadow="sm" padding="lg" className="bg-[#1a1a1a] border border-[#2a2a2a]">
            <Group justify="space-between" align="flex-start">
              <div>
                <Text size="sm" className="text-gray-400 mb-2">
                  Messages Sent
                </Text>
                <Text size="xl" className="text-white font-bold">
                  {stats?.messagesSent || 0}
                </Text>
              </div>
              <IconMessageCircle size={32} className="text-blue-400" />
            </Group>
          </Card>

          <Card shadow="sm" padding="lg" className="bg-[#1a1a1a] border border-[#2a2a2a]">
            <Group justify="space-between" align="flex-start">
              <div>
                <Text size="sm" className="text-gray-400 mb-2">
                  Current Plan
                </Text>
                <Badge color={stats?.hasSubscription ? 'green' : 'gray'} size="lg">
                  {subscriptionTier
                    ? subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)
                    : 'No Plan'}
                </Badge>
              </div>
              <IconCreditCard size={32} className="text-green-400" />
            </Group>
          </Card>
        </SimpleGrid>

        {/* Quick Actions */}
        <Paper shadow="sm" p="lg" className="bg-[#1a1a1a]">
          <Title order={3} className="text-white mb-4">
            Quick Actions
          </Title>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <Button
              variant="light"
              color="teal"
              size="lg"
              leftSection={<IconUserPlus size={20} />}
              onClick={() => navigate('/customers/add')}
              className="h-auto py-4"
            >
              <div className="text-left">
                <div className="font-semibold">Add New Customer</div>
                <div className="text-xs opacity-75">Start requesting reviews</div>
              </div>
            </Button>

            <Button
              variant="light"
              color="blue"
              size="lg"
              leftSection={<IconUsers size={20} />}
              onClick={() => navigate('/customers')}
              className="h-auto py-4"
            >
              <div className="text-left">
                <div className="font-semibold">View Customers</div>
                <div className="text-xs opacity-75">Manage your customer list</div>
              </div>
            </Button>

            <Button
              variant="light"
              color="violet"
              size="lg"
              leftSection={<IconChartBar size={20} />}
              onClick={() => navigate('/analytics')}
              className="h-auto py-4"
              disabled={!subscriptionTier || subscriptionTier === 'starter'}
            >
              <div className="text-left">
                <div className="font-semibold">View Analytics</div>
                <div className="text-xs opacity-75">
                  {subscriptionTier && subscriptionTier !== 'starter'
                    ? 'Track your performance'
                    : 'Upgrade to Pro or Business'}
                </div>
              </div>
            </Button>

            <Button
              variant="light"
              color="gray"
              size="lg"
              leftSection={<IconSettings size={20} />}
              onClick={() => navigate('/account')}
              className="h-auto py-4"
            >
              <div className="text-left">
                <div className="font-semibold">Account Settings</div>
                <div className="text-xs opacity-75">Configure your account</div>
              </div>
            </Button>
          </SimpleGrid>
        </Paper>
      </Stack>
    </Container>
  );
};
