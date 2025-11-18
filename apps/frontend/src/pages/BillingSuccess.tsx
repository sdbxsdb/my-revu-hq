import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Paper, Title, Text, Button, Stack, Alert } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { useAccount } from '@/contexts/AccountContext';

export const BillingSuccess = () => {
  const navigate = useNavigate();
  const { refetch } = useAccount();

  useEffect(() => {
    // Refetch account data to get updated subscription status
    refetch();
  }, [refetch]);

  return (
    <div className="min-h-screen bg-[#141414] p-4">
      <div className="max-w-2xl mx-auto">
        <Paper p="md" className="bg-[#1a1a1a] border border-[#2a2a2a]">
          <Stack gap="lg" align="center">
            <div className="w-16 h-16 rounded-full bg-teal-500/20 flex items-center justify-center">
              <IconCheck size={40} className="text-teal-400" />
            </div>

            <Title order={1} className="text-white text-center">
              You're All Set!
            </Title>

            <Text size="lg" className="text-gray-400 text-center max-w-md">
              Your payment was successful and your subscription is now active. You have full access
              to all features of MyRevuHQ.
            </Text>

            <Alert
              icon={<IconCheck size={16} />}
              title="What's Next?"
              color="teal"
              className="w-full bg-teal-500/10 border-teal-500/20"
            >
              <Text size="sm" className="text-gray-300">
                You can now:
              </Text>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-gray-300">
                <li>Add and manage customers</li>
                <li>Send review requests via SMS</li>
                <li>Monitor and track all your review links in one place</li>
                <li>Send 100 SMS messages per month</li>
              </ul>
            </Alert>

            <div className="flex justify-center w-full">
              <Button
                onClick={() => navigate('/customers/add')}
                size="lg"
                className="bg-teal-600 hover:bg-teal-700"
              >
                Get Started
              </Button>
            </div>
          </Stack>
        </Paper>
      </div>
    </div>
  );
};
