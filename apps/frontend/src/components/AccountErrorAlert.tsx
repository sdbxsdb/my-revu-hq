import { Alert, Button, Stack, Text } from '@mantine/core';
import { IconAlertCircle, IconRefresh } from '@tabler/icons-react';
import { useAccount } from '@/contexts/AccountContext';

export const AccountErrorAlert = () => {
  const { error, refetch, loading } = useAccount();

  if (!error) return null;

  // Determine if it's a network error
  const isNetworkError = 
    error.message?.toLowerCase().includes('network') ||
    error.message?.toLowerCase().includes('fetch') ||
    error.message?.toLowerCase().includes('connection') ||
    !navigator.onLine;

  return (
    <Alert
      icon={<IconAlertCircle size={16} />}
      title="Unable to Load Account"
      color="red"
      className="mb-6"
    >
      <Stack gap="sm">
        <Text size="sm" className="text-gray-300">
          {isNetworkError ? (
            <>
              We couldn't load your account information. Please check your internet connection
              and try again.
            </>
          ) : (
            <>
              There was a problem loading your account data. This might be a temporary issue.
            </>
          )}
        </Text>
        
        <div className="flex gap-2">
          <Button
            size="xs"
            variant="light"
            color="red"
            leftSection={<IconRefresh size={14} />}
            onClick={() => refetch()}
            loading={loading}
          >
            Try Again
          </Button>
          
          <Button
            size="xs"
            variant="subtle"
            color="red"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>
        </div>

        <Text size="xs" className="text-gray-500">
          If the problem persists, please contact support at{' '}
          <a href="mailto:support@myrevuhq.com" className="text-red-400 hover:text-red-300">
            support@myrevuhq.com
          </a>
        </Text>
      </Stack>
    </Alert>
  );
};

