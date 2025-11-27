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
  Group,
  Progress,
} from '@mantine/core';
import {
  IconCheck,
  IconUserPlus,
  IconMessageCircle,
  IconCreditCard,
  IconSettings,
  IconCircle,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api';
import { useAccount } from '@/contexts/AccountContext';

interface SetupStep {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  action: () => void;
  buttonText: string;
}

export const SetupWizard = () => {
  const navigate = useNavigate();
  const { subscriptionTier } = useAccount();
  const [stats, setStats] = useState<{
    hasAccountSetup: boolean;
    totalCustomers: number;
    hasSubscription: boolean;
    messagesSent: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSetupData();
  }, [subscriptionTier]);

  const loadSetupData = async () => {
    try {
      setLoading(true);
      const [userData, customers] = await Promise.all([
        apiClient.getAccount(),
        apiClient.getCustomers({ page: 1, limit: 100 }),
      ]);

      const hasAccountSetup = !!(userData.business_name && userData.review_links && userData.review_links.length > 0);
      const hasSubscription = !!subscriptionTier && subscriptionTier !== 'starter';

      setStats({
        hasAccountSetup,
        totalCustomers: customers.total || 0,
        hasSubscription,
        messagesSent: customers.customers?.filter((c) => c.sent_at).length || 0,
      });
    } catch (error) {
      console.error('Error loading setup data:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeSetup = async () => {
    try {
      await apiClient.updateAccount({ onboarding_completed: true });
      navigate('/dashboard');
    } catch (error) {
      console.error('Error completing setup:', error);
      navigate('/dashboard');
    }
  };

  if (loading) {
    return (
      <Container size="lg" py="md" className="px-xs sm:px-md">
        <Paper shadow="md" p="md" className="bg-[#1a1a1a]">
          <Text className="text-center text-gray-400">Loading...</Text>
        </Paper>
      </Container>
    );
  }

  if (!stats) return null;

  const steps: SetupStep[] = [
    {
      id: 'account',
      label: 'Set Up SMS',
      description: 'Configure your business name and review links',
      icon: <IconSettings size={20} />,
      completed: stats.hasAccountSetup,
      action: () => navigate('/account'),
      buttonText: 'Configure',
    },
    {
      id: 'customer',
      label: 'Add First Customer',
      description: 'Add a customer to your list',
      icon: <IconUserPlus size={20} />,
      completed: stats.totalCustomers > 0,
      action: () => navigate('/customers/add'),
      buttonText: 'Add Customer',
    },
    {
      id: 'plan',
      label: 'Choose a Plan',
      description: 'Select the right plan for your business',
      icon: <IconCreditCard size={20} />,
      completed: stats.hasSubscription,
      action: () => navigate('/billing'),
      buttonText: 'View Plans',
    },
    {
      id: 'sms',
      label: 'Send First SMS',
      description: 'Send your first review request',
      icon: <IconMessageCircle size={20} />,
      completed: stats.messagesSent > 0,
      action: () => navigate('/customers'),
      buttonText: 'Send SMS',
    },
  ];

  const completedCount = steps.filter(s => s.completed).length;
  const progressPercent = (completedCount / steps.length) * 100;
  const allComplete = completedCount === steps.length;

  return (
    <Container size="lg" py="md" className="px-xs sm:px-md">
      <Stack gap="md">
        <Paper shadow="md" p="md" className="bg-[#1a1a1a]">
          <Stack gap="md">
            <div className="text-center">
              <Title order={1} className="text-white mb-2 text-xl sm:text-2xl">
                Welcome to MyRevuHQ! 🎉
              </Title>
              <Text size="sm" className="text-gray-300 mb-3">
                Complete the steps below to get started
              </Text>
              
              <div className="mb-2">
                <Group justify="space-between" className="mb-1">
                  <Text size="xs" className="text-gray-400">
                    {completedCount} of {steps.length} completed
                  </Text>
                  <Text size="xs" className="text-teal-400 font-semibold">
                    {Math.round(progressPercent)}%
                  </Text>
                </Group>
                <Progress 
                  value={progressPercent} 
                  color="teal" 
                  size="sm"
                  className="w-full"
                />
              </div>
            </div>

            <Stack gap="xs">
              {steps.map((step) => (
                <Card
                  key={step.id}
                  padding="sm"
                  className={`bg-[#141414] border ${
                    step.completed 
                      ? 'border-teal-500/30' 
                      : 'border-[#2a2a2a]'
                  }`}
                >
                  <Group justify="space-between" wrap="nowrap" align="flex-start">
                    <Group wrap="nowrap" align="flex-start" gap="sm" className="flex-1">
                      <div className={`mt-1 ${step.completed ? 'text-teal-400' : 'text-gray-500'}`}>
                        {step.completed ? (
                          <IconCheck size={20} />
                        ) : (
                          <IconCircle size={20} />
                        )}
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
              <Card padding="md" className="bg-gradient-to-r from-teal-900/40 to-blue-900/40 border border-teal-700/30">
                <Stack gap="sm" align="center">
                  <div className="inline-block p-3 bg-teal-500/20 rounded-full">
                    <IconCheck size={32} className="text-teal-400" />
                  </div>
                  <div className="text-center">
                    <Text className="text-white font-semibold mb-1">
                      Setup Complete! 🚀
                    </Text>
                    <Text size="sm" className="text-gray-300">
                      You're ready to grow your business with MyRevuHQ
                    </Text>
                  </div>
                  <Button 
                    color="teal" 
                    onClick={completeSetup}
                    fullWidth
                    size="md"
                  >
                    Go to Dashboard
                  </Button>
                </Stack>
              </Card>
            )}

            {!allComplete && (
              <Button
                variant="subtle"
                color="gray"
                onClick={completeSetup}
                size="sm"
                fullWidth
              >
                I'll Finish This Later
              </Button>
            )}
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
};
