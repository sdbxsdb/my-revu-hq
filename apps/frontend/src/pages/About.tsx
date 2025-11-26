import { Paper, Title, Text, Container, Stack, Divider, ThemeIcon, Button } from '@mantine/core';
import {
  IconLogin,
  IconCurrencyPound,
  IconCurrencyEuro,
  IconCurrencyDollar,
} from '@tabler/icons-react';
import { useLocationPricing } from '@/hooks/useLocationPricing';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ReviewRevenueChart } from '@/components/ReviewRevenueChart';
import { BusinessImpact } from '@/components/BusinessImpact';
import {
  AnimatedSMSIcon,
  AnimatedCustomersIcon,
  AnimatedClockIcon,
  AnimatedPlatformsIcon,
  AnimatedPricingIcon,
  AnimatedAnalyticsIcon,
} from '@/components/AnimatedFeatureIcons';

export const About = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const formattedPrice = useLocationPricing();

  return (
    <Container size="md" py="md" px="xs">
      <Paper shadow="md" p="md" className="bg-[#1a1a1a]">
        <Stack gap="lg">
          <section className="text-center">
            <Title order={1} className="text-white mb-3 text-2xl sm:text-3xl">
              What is MyRevuHQ?
            </Title>
            <Text size="sm" className="text-gray-300 mb-6">
              Essential for any business that knows reviews matter. Whether you're a small business, tradesperson, or larger operation—if you know reviews drive growth, MyRevuHQ is for you.
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
                  <AnimatedSMSIcon delay={0} />
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
                  <AnimatedCustomersIcon delay={2500} />
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
                  <AnimatedClockIcon delay={5000} />
                </ThemeIcon>
                <div>
                  <Title order={3} size="h4" className="text-white mb-2">
                    Schedule SMS
                  </Title>
                  <Text size="sm" className="text-gray-300">
                    Schedule review requests for any future date and time. Perfect for sending requests after project completion or at the optimal time for your industry.
                  </Text>
                </div>
              </div>

              <div className="flex gap-4">
                <ThemeIcon size={48} radius="md" className="bg-teal-500/20 flex-shrink-0">
                  <AnimatedPlatformsIcon delay={7500} />
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
                  <AnimatedAnalyticsIcon delay={10000} />
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
                  <AnimatedPricingIcon delay={12500}>
                    {formattedPrice.includes('£') ? (
                      <IconCurrencyPound size={28} className="text-teal-400" />
                    ) : formattedPrice.includes('€') ? (
                      <IconCurrencyEuro size={28} className="text-teal-400" />
                    ) : (
                      <IconCurrencyDollar size={28} className="text-teal-400" />
                    )}
                  </AnimatedPricingIcon>
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

          {/* Revenue Impact Chart */}
          <ReviewRevenueChart />

          <Divider />

          {/* Business Impact */}
          <BusinessImpact />

          <Divider />

          <section>
            <Title order={2} size="h3" className="text-white mb-4 text-center">
              How It Works
            </Title>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#2a2a2a] p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center">
                    <Text size="sm" className="text-white font-bold">1</Text>
                  </div>
                  <div>
                    <Text size="sm" className="text-white font-semibold mb-1">
                      Add Customers
                    </Text>
                    <Text size="xs" className="text-gray-400">
                      Enter customer details including name, phone number, and job information. Build your complete customer database in one central location.
                    </Text>
                  </div>
                </div>
              </div>
              <div className="bg-[#2a2a2a] p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center">
                    <Text size="sm" className="text-white font-bold">2</Text>
                  </div>
                  <div>
                    <Text size="sm" className="text-white font-semibold mb-1">
                      Set Up Review Links
                    </Text>
                    <Text size="xs" className="text-gray-400">
                      Add your Google, Facebook, and other review platform URLs. Configure where you want customers to leave their reviews.
                    </Text>
                  </div>
                </div>
              </div>
              <div className="bg-[#2a2a2a] p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center">
                    <Text size="sm" className="text-white font-bold">3</Text>
                  </div>
                  <div>
                    <Text size="sm" className="text-white font-semibold mb-1">
                      Customise Your Message
                    </Text>
                    <Text size="xs" className="text-gray-400">
                      Create a personalised SMS template that includes your review links. Add customer names and job details to make each message unique.
                    </Text>
                  </div>
                </div>
              </div>
              <div className="bg-[#2a2a2a] p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center">
                    <Text size="sm" className="text-white font-bold">4</Text>
                  </div>
                  <div>
                    <Text size="sm" className="text-white font-semibold mb-1">
                      Send & Grow
                    </Text>
                    <Text size="xs" className="text-gray-400">
                      Send review requests instantly with a single click. Track your campaigns and watch your online reputation grow with 5-star reviews.
                    </Text>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <Divider className="my-4" />

          {!user && (
            <>
              <section className="text-center">
                <Button
                  size="lg"
                  leftSection={<IconLogin size={20} />}
                  onClick={() => navigate('/login')}
                >
                  Get Started
                </Button>
              </section>

              <Divider className="my-4" />
            </>
          )}

          <section className="text-center">
            <Text size="sm" className="text-gray-300 mb-1">
              Questions?
            </Text>
            <Text size="sm" className="text-gray-300">
              Contact us at{' '}
              <a href="mailto:myrevuhq@gmail.com" className="text-teal-400 hover:underline">
                myrevuhq@gmail.com
              </a>
            </Text>
          </section>

          <Divider className="my-4" />

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
