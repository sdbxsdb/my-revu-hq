import { Paper, Title, Text, Container, Stack, Divider, List, ThemeIcon } from '@mantine/core';
import {
  IconCheck,
  IconMessageCircle,
  IconUsers,
  IconLink,
  IconChartBar,
} from '@tabler/icons-react';

export const About = () => {
  return (
    <Container size="md" py="xl">
      <Paper shadow="md" p="xl" className="bg-[#1a1a1a]">
        <Stack gap="lg">
          <Title order={1} className="text-white mb-4">
            What is MyRevuHQ?
          </Title>

          <Text size="lg" className="text-gray-300 mb-4">
            MyRevuHQ is an essential tool for modern businesses that understand the power of
            customer reviews. We help you effortlessly request reviews from your customers via SMS,
            track all your review links in one place, and grow your online reputation. When do you
            stop wanting good reviews? Never. That's why every business needs a system to
            consistently gather feedback from their customers.
          </Text>

          <Divider />

          <section>
            <Title order={2} size="h3" className="text-white mb-4">
              Why Every Modern Business Needs MyRevuHQ
            </Title>

            <div className="space-y-4">
              <div className="flex gap-4">
                <ThemeIcon size={40} radius="md" className="bg-teal-500/20 flex-shrink-0">
                  <IconMessageCircle size={24} className="text-teal-400" />
                </ThemeIcon>
                <div>
                  <Title order={3} size="h4" className="text-white mb-2">
                    SMS Review Requests
                  </Title>
                  <Text size="sm" className="text-gray-300">
                    Send personalised review requests directly to your customers' phones via SMS. No
                    more manual follow-ups or forgotten requests. You choose when to send each
                    review request - send immediately or schedule for later.
                  </Text>
                </div>
              </div>

              <div className="flex gap-4">
                <ThemeIcon size={40} radius="md" className="bg-teal-500/20 flex-shrink-0">
                  <IconUsers size={24} className="text-teal-400" />
                </ThemeIcon>
                <div>
                  <Title order={3} size="h4" className="text-white mb-2">
                    Your Customer List, Your Way
                  </Title>
                  <Text size="sm" className="text-gray-300">
                    Where else are you able to gather your list of customers? MyRevuHQ lets you
                    build and manage your customer database exactly how you want. Add customer
                    details, job descriptions, and contact information. Send review requests
                    instantly or schedule them for later - it's your list, your control.
                  </Text>
                </div>
              </div>

              <div className="flex gap-4">
                <ThemeIcon size={40} radius="md" className="bg-teal-500/20 flex-shrink-0">
                  <IconLink size={24} className="text-teal-400" />
                </ThemeIcon>
                <div>
                  <Title order={3} size="h4" className="text-white mb-2">
                    Multiple Review Platform Support
                  </Title>
                  <Text size="sm" className="text-gray-300">
                    Manage review links for Google, Facebook, and other review platforms all in one
                    dashboard. Send customers to multiple review sites with a single SMS, maximizing
                    your chances of getting reviews.
                  </Text>
                </div>
              </div>

              <div className="flex gap-4">
                <ThemeIcon size={40} radius="md" className="bg-teal-500/20 flex-shrink-0">
                  <IconChartBar size={24} className="text-teal-400" />
                </ThemeIcon>
                <div>
                  <Title order={3} size="h4" className="text-white mb-2">
                    Simple, Affordable Pricing
                  </Title>
                  <Text size="sm" className="text-gray-300">
                    One low monthly fee gives you unlimited customers and 100 SMS messages per
                    month. No hidden fees, no per-message charges. Everything you need to grow your
                    online reputation is included.
                  </Text>
                </div>
              </div>
            </div>
          </section>

          <Divider />

          <section>
            <Title order={2} size="h3" className="text-white mb-4">
              Perfect For
            </Title>
            <Text size="sm" className="text-gray-300 mb-4">
              MyRevuHQ is designed for anyone who cares about their reputation and understands what
              a review can mean for their business. Whether you're a small business owner, a
              tradesperson, or running a larger operation, if you know that reviews drive growth,
              MyRevuHQ is for you.
            </Text>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#2a2a2a] p-4 rounded-lg">
                <Text size="sm" className="text-gray-300">
                  <strong className="text-white">Small Businesses</strong> building their online
                  reputation from the ground up
                </Text>
              </div>
              <div className="bg-[#2a2a2a] p-4 rounded-lg">
                <Text size="sm" className="text-gray-300">
                  <strong className="text-white">Tradespersons</strong> who know that reviews can
                  make or break their next job
                </Text>
              </div>
              <div className="bg-[#2a2a2a] p-4 rounded-lg">
                <Text size="sm" className="text-gray-300">
                  <strong className="text-white">Larger Businesses</strong> managing multiple
                  locations and customer touchpoints
                </Text>
              </div>
              <div className="bg-[#2a2a2a] p-4 rounded-lg">
                <Text size="sm" className="text-gray-300">
                  <strong className="text-white">Anyone</strong> who understands that more reviews
                  means a better reputation and a more successful business
                </Text>
              </div>
            </div>
          </section>

          <Divider />

          <section>
            <Title order={2} size="h3" className="text-white mb-4">
              How It Works
            </Title>
            <List
              spacing="md"
              size="sm"
              icon={
                <ThemeIcon color="teal" size={24} radius="xl">
                  <IconCheck size={16} />
                </ThemeIcon>
              }
              className="text-gray-300"
            >
              <List.Item>
                <strong className="text-white">Add Your Customers:</strong> Enter customer details
                including name, phone number, and job description
              </List.Item>
              <List.Item>
                <strong className="text-white">Set Up Your Review Links:</strong> Add links to your
                Google, Facebook, and other review profiles
              </List.Item>
              <List.Item>
                <strong className="text-white">Customise Your Message:</strong> Create a
                personalised SMS template that includes your review links
              </List.Item>
              <List.Item>
                <strong className="text-white">Send Review Requests:</strong> Send requests
                immediately or schedule them for later. Your customers receive a friendly SMS with
                direct links to leave reviews
              </List.Item>
              <List.Item>
                <strong className="text-white">Track Everything:</strong> Monitor all your review
                links and customer interactions in one convenient dashboard
              </List.Item>
            </List>
          </section>

          <Divider />

          <section>
            <Title order={2} size="h3" className="text-white mb-4">
              Get Started Today
            </Title>
            <Text size="sm" className="text-gray-300 mb-4">
              Join businesses that are already using MyRevuHQ to grow their online reputation. Start
              collecting more reviews and building trust with potential customers.
            </Text>
            <Text size="sm" className="text-gray-300">
              Questions? Contact us at{' '}
              <a href="mailto:myrevuhq@gmail.com" className="text-teal-400 hover:underline">
                myrevuhq@gmail.com
              </a>
            </Text>
          </section>
        </Stack>
      </Paper>
    </Container>
  );
};
