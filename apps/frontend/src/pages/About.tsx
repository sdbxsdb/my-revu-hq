import { Paper, Title, Text, Container, Stack, Divider, ThemeIcon, Button } from '@mantine/core';
import {
  IconCheck,
  IconMessageCircle,
  IconUsers,
  IconLink,
  IconChartBar,
  IconLogin,
} from '@tabler/icons-react';
import { useLocationPricing } from '@/hooks/useLocationPricing';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export const About = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const formattedPrice = useLocationPricing();

  return (
    <Container size="md" py="xl">
      <Paper shadow="md" p="md" className="bg-[#1a1a1a]">
        <Stack gap="lg">
          <section className="text-center">
            <Title order={1} className="text-white mb-3">
              Essential for Any Business That Knows Reviews Matter
            </Title>
            <Text size="sm" className="text-gray-300 mb-6">
              Whether you're a small business, tradesperson, or larger operation—if you know reviews
              drive growth, MyRevuHQ is for you.
            </Text>
            {!user && (
              <Button
                size="lg"
                leftSection={<IconLogin size={20} />}
                onClick={() => navigate('/login')}
              >
                Get Started
              </Button>
            )}
          </section>

          <Divider />

          <section>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex gap-4">
                <ThemeIcon size={48} radius="md" className="bg-teal-500/20 flex-shrink-0">
                  <IconMessageCircle size={28} className="text-teal-400" />
                </ThemeIcon>
                <div>
                  <Title order={3} size="h4" className="text-white mb-2">
                    SMS Review Requests
                  </Title>
                  <Text size="sm" className="text-gray-300">
                    Send personalised review requests directly to your customers' phones. You choose
                    when—right after a job is completed, when satisfaction is highest.
                  </Text>
                </div>
              </div>

              <div className="flex gap-4">
                <ThemeIcon size={48} radius="md" className="bg-teal-500/20 flex-shrink-0">
                  <IconUsers size={28} className="text-teal-400" />
                </ThemeIcon>
                <div>
                  <Title order={3} size="h4" className="text-white mb-2">
                    Manage Your Customers
                  </Title>
                  <Text size="sm" className="text-gray-300">
                    Build and manage your entire customer list in one place. Add details, send
                    requests instantly—it's your data, your control.
                  </Text>
                </div>
              </div>

              <div className="flex gap-4">
                <ThemeIcon size={48} radius="md" className="bg-teal-500/20 flex-shrink-0">
                  <IconLink size={28} className="text-teal-400" />
                </ThemeIcon>
                <div>
                  <Title order={3} size="h4" className="text-white mb-2">
                    All Review Platforms
                  </Title>
                  <Text size="sm" className="text-gray-300">
                    Google, Facebook, and more—all in one dashboard. Send customers to multiple
                    review sites with one SMS.
                  </Text>
                </div>
              </div>

              <div className="flex gap-4">
                <ThemeIcon size={48} radius="md" className="bg-teal-500/20 flex-shrink-0">
                  <IconChartBar size={28} className="text-teal-400" />
                </ThemeIcon>
                <div>
                  <Title order={3} size="h4" className="text-white mb-2">
                    Analytics & Insights
                  </Title>
                  <Text size="sm" className="text-gray-300">
                    Track your SMS campaigns with detailed analytics. Pro and Business plans include
                    monthly statistics and customer engagement insights.
                  </Text>
                </div>
              </div>

              <div className="flex gap-4">
                <ThemeIcon size={48} radius="md" className="bg-teal-500/20 flex-shrink-0">
                  <IconCheck size={28} className="text-teal-400" />
                </ThemeIcon>
                <div>
                  <Title order={3} size="h4" className="text-white mb-2">
                    Simple Pricing
                  </Title>
                  <Text size="sm" className="text-gray-300">
                    Plans starting from {formattedPrice}/month. Unlimited customers, flexible SMS
                    limits. No hidden costs, no surprises.
                  </Text>
                </div>
              </div>
            </div>
          </section>

          <Divider />

          <section>
            <Title order={2} size="h3" className="text-white mb-4 text-center">
              How It Works
            </Title>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#2a2a2a] p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <ThemeIcon color="teal" size={24} radius="xl" className="flex-shrink-0">
                    <IconCheck size={16} />
                  </ThemeIcon>
                  <div>
                    <Text size="sm" className="text-white font-semibold mb-1">
                      Add Customers
                    </Text>
                    <Text size="xs" className="text-gray-400">
                      Enter customer details and job information
                    </Text>
                  </div>
                </div>
              </div>
              <div className="bg-[#2a2a2a] p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <ThemeIcon color="teal" size={24} radius="xl" className="flex-shrink-0">
                    <IconCheck size={16} />
                  </ThemeIcon>
                  <div>
                    <Text size="sm" className="text-white font-semibold mb-1">
                      Set Up Review Links
                    </Text>
                    <Text size="xs" className="text-gray-400">
                      Add your Google, Facebook, and other review profiles
                    </Text>
                  </div>
                </div>
              </div>
              <div className="bg-[#2a2a2a] p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <ThemeIcon color="teal" size={24} radius="xl" className="flex-shrink-0">
                    <IconCheck size={16} />
                  </ThemeIcon>
                  <div>
                    <Text size="sm" className="text-white font-semibold mb-1">
                      Customise Your Message
                    </Text>
                    <Text size="xs" className="text-gray-400">
                      Create a personalised SMS template with your review links
                    </Text>
                  </div>
                </div>
              </div>
              <div className="bg-[#2a2a2a] p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <ThemeIcon color="teal" size={24} radius="xl" className="flex-shrink-0">
                    <IconCheck size={16} />
                  </ThemeIcon>
                  <div>
                    <Text size="sm" className="text-white font-semibold mb-1">
                      Send & Grow
                    </Text>
                    <Text size="xs" className="text-gray-400">
                      Send requests instantly and watch your reviews grow
                    </Text>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <Divider />

          <section className="text-center">
            <Text size="sm" className="text-gray-300 mb-6">
              Questions? Contact us at{' '}
              <a href="mailto:myrevuhq@gmail.com" className="text-teal-400 hover:underline">
                myrevuhq@gmail.com
              </a>
            </Text>
            {!user && (
              <Button
                size="lg"
                leftSection={<IconLogin size={20} />}
                onClick={() => navigate('/login')}
              >
                Get Started
              </Button>
            )}
          </section>

          <Divider />

          <section className="text-center">
            <Text size="sm" className="text-gray-400">
              <a href="/privacy" className="text-teal-400 hover:text-teal-300 hover:underline">
                Privacy Policy
              </a>
              {' • '}
              <a href="/terms" className="text-teal-400 hover:text-teal-300 hover:underline">
                Terms and Conditions
              </a>
            </Text>
          </section>
        </Stack>
      </Paper>
    </Container>
  );
};
