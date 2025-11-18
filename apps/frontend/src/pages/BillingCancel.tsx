import { Paper, Title, Text, Button, Stack, Alert } from '@mantine/core';
import { IconX, IconArrowLeft, IconCreditCard } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

export const BillingCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#141414] p-4">
      <div className="max-w-2xl mx-auto">
        <Paper p="md" className="bg-[#1a1a1a] border border-[#2a2a2a]">
          <Stack gap="lg" align="center">
            <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <IconX size={40} className="text-yellow-400" />
            </div>

            <Title order={1} className="text-white text-center">
              Payment Cancelled
            </Title>

            <Text size="lg" className="text-gray-400 text-center max-w-md">
              Your subscription setup was cancelled. No charges have been made to your account.
            </Text>

            <Alert
              icon={<IconCreditCard size={16} />}
              title="Need Help?"
              color="yellow"
              className="w-full bg-yellow-500/10 border-yellow-500/20"
            >
              <Text size="sm" className="text-gray-300">
                If you experienced any issues during checkout or have questions about our pricing,
                please don't hesitate to contact us. We're here to help!
              </Text>
            </Alert>

            <div className="flex justify-center w-full">
              <Button
                variant="light"
                leftSection={<IconArrowLeft size={16} />}
                onClick={() => navigate('/billing')}
              >
                Back to Billing
              </Button>
            </div>
          </Stack>
        </Paper>
      </div>
    </div>
  );
};
