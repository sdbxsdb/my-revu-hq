import { useEffect, useState } from 'react';
import { Alert, Text } from '@mantine/core';
import { IconWifiOff } from '@tabler/icons-react';

export const OfflineAlert = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <Alert
      icon={<IconWifiOff size={16} />}
      title="No Internet Connection"
      color="yellow"
      className="mb-6"
    >
      <Text size="sm" className="text-gray-300">
        You're currently offline. Some features may not work until your connection is restored.
        Please check your internet connection and try again.
      </Text>
    </Alert>
  );
};


