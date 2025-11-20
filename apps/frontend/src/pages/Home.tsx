import { Paper, Title, Text, Button, Stack, Divider, ThemeIcon, Container } from '@mantine/core';
import {
  IconMessageCircle,
  IconUsers,
  IconLink,
  IconChartBar,
  IconArrowRight,
  IconLogin,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Container size="md" py="md" px="md">
        <Paper shadow="md" p="md" className="bg-[#1a1a1a]">
          <Stack gap="lg">
            {/* Hero Section */}
            <div className="text-center">
              <Title order={1} className="text-white mb-4 text-2xl sm:text-3xl">
                Reviews Never Stop Mattering
              </Title>
              <Text size="lg" className="text-gray-300 mb-6 text-base sm:text-lg">
                Every satisfied customer is a potential 5-star review. MyRevuHQ makes it simple to
                ask at the right time, so you can focus on your work while your reputation grows.
              </Text>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {!user && (
                  <Button
                    size="lg"
                    leftSection={<IconLogin size={20} />}
                    onClick={() => navigate('/login')}
                  >
                    Get Started
                  </Button>
                )}
                <Button
                  size="lg"
                  variant="outline"
                  rightSection={<IconArrowRight size={20} />}
                  onClick={() => navigate('/about')}
                >
                  Learn More
                </Button>
              </div>
            </div>

            <Divider />

            {/* Key Features - Visual Grid */}
            <section>
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                <div className="text-center">
                  <ThemeIcon size={56} radius="md" className="bg-teal-500/20 mx-auto mb-3">
                    <IconMessageCircle size={32} className="text-teal-400" />
                  </ThemeIcon>
                  <Title order={3} size="h4" className="text-white mb-2 text-base">
                    SMS Requests
                  </Title>
                  <Text size="xs" className="text-gray-400">
                    Send personalised review requests to all your customers
                  </Text>
                </div>

                <div className="text-center">
                  <ThemeIcon size={56} radius="md" className="bg-teal-500/20 mx-auto mb-3">
                    <IconUsers size={32} className="text-teal-400" />
                  </ThemeIcon>
                  <Title order={3} size="h4" className="text-white mb-2 text-base">
                    Manage Customers
                  </Title>
                  <Text size="xs" className="text-gray-400">
                    Manage your entire customer list in one place
                  </Text>
                </div>

                <div className="text-center">
                  <ThemeIcon size={56} radius="md" className="bg-teal-500/20 mx-auto mb-3">
                    <IconLink size={32} className="text-teal-400" />
                  </ThemeIcon>
                  <Title order={3} size="h4" className="text-white mb-2 text-base">
                    Multiple Platforms
                  </Title>
                  <Text size="xs" className="text-gray-400">
                    Google, Facebook, and more—all in one place
                  </Text>
                </div>

                <div className="text-center">
                  <ThemeIcon size={56} radius="md" className="bg-teal-500/20 mx-auto mb-3">
                    <IconChartBar size={32} className="text-teal-400" />
                  </ThemeIcon>
                  <Title order={3} size="h4" className="text-white mb-2 text-base">
                    Simple Pricing
                  </Title>
                  <Text size="xs" className="text-gray-400">
                    Plans starting from £4.99/month. Unlimited customers, flexible SMS limits
                  </Text>
                </div>
              </div>
            </section>

            {!user && (
              <>
                <Divider />

                {/* CTA Section */}
                <section className="text-center">
                  <Button
                    size="lg"
                    leftSection={<IconLogin size={20} />}
                    onClick={() => navigate('/login')}
                  >
                    Create Your Account
                  </Button>
                </section>
              </>
            )}

            <Divider />

            {/* Footer Links */}
            <section className="text-center space-y-3">
              <Text size="xs" className="text-gray-400">
                <a href="/privacy" className="text-teal-400 hover:text-teal-300 hover:underline">
                  Privacy Policy
                </a>
                {' • '}
                <a href="/terms" className="text-teal-400 hover:text-teal-300 hover:underline">
                  Terms and Conditions
                </a>
                {' • '}
                <a href="/about" className="text-teal-400 hover:text-teal-300 hover:underline">
                  About
                </a>
              </Text>
              <Text size="xs" className="text-gray-500 leading-relaxed max-w-2xl mx-auto">
                MyRevuHQ uses Google OAuth for secure authentication. When you sign in with Google,
                we request your email address and name to create and manage your account. We only
                use this information for authentication and do not share it with third parties. For
                more details, see our{' '}
                <a href="/privacy" className="text-teal-400 hover:underline">
                  Privacy Policy
                </a>
                .
              </Text>
            </section>
          </Stack>
        </Paper>
      </Container>
    </div>
  );
};
