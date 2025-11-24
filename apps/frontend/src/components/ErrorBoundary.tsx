import { Component, ReactNode } from 'react';
import { Button, Container, Paper, Text, Title, Stack } from '@mantine/core';
import { IconAlertCircle, IconRefresh } from '@tabler/icons-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    console.error('Error caught by boundary:', error, errorInfo);
    
    // In production, you could send this to an error tracking service
    // e.g., Sentry, LogRocket, etc.
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    // Reload the page to reset the app state
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container size="sm" py="xl">
          <Paper shadow="md" p="xl" className="bg-[#1a1a1a] border border-[#2a2a2a]">
            <Stack gap="lg" align="center">
              <IconAlertCircle size={64} className="text-red-400" />
              
              <div className="text-center">
                <Title order={2} className="text-white mb-3">
                  Oops! Something went wrong
                </Title>
                <Text size="sm" className="text-gray-400 mb-4">
                  We're sorry, but something unexpected happened. This error has been logged and we'll look into it.
                </Text>
                {this.state.error && (
                  <Text size="xs" className="text-gray-500 mb-4 font-mono">
                    Error: {this.state.error.message}
                  </Text>
                )}
              </div>

              <Stack gap="sm" className="w-full max-w-xs">
                <Button
                  leftSection={<IconRefresh size={16} />}
                  onClick={this.handleReset}
                  fullWidth
                  color="teal"
                  size="md"
                >
                  Return to Home
                </Button>
                
                <Button
                  variant="light"
                  onClick={() => window.location.reload()}
                  fullWidth
                  size="sm"
                >
                  Refresh Page
                </Button>

                <Text size="xs" className="text-gray-500 text-center mt-4">
                  If the problem persists, please contact support at{' '}
                  <a href="mailto:support@myrevuhq.com" className="text-teal-400 hover:text-teal-300">
                    support@myrevuhq.com
                  </a>
                </Text>
              </Stack>
            </Stack>
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}

