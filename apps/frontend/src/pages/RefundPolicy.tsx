import { Paper, Title, Text, Container, Stack, Divider } from '@mantine/core';

export const RefundPolicy = () => {
  return (
    <Container size="md" py="xl">
      <Paper shadow="md" p="xl" className="bg-[#1a1a1a]">
        <Stack gap="lg">
          <Title order={1} className="text-white mb-4">
            Refund and Cancellation Policy
          </Title>
          <Text size="sm" className="text-gray-400">
            Last updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>

          <Divider />

          <section>
            <Title order={2} size="h3" className="text-white mb-3">
              1. Subscription Cancellation
            </Title>
            <Text size="sm" className="text-gray-300 mb-4">
              You may cancel your MyRevuHQ subscription at any time through your account settings or by contacting us at{' '}
              <a href="mailto:myrevuhq@gmail.com" className="text-teal-400 hover:underline">
                myrevuhq@gmail.com
              </a>
              . When you cancel:
            </Text>
            <ul className="list-disc list-inside text-gray-300 text-sm mb-4 space-y-2 ml-4">
              <li>Your subscription will remain active until the end of your current billing period</li>
              <li>You will continue to have full access to all Service features until the billing period ends</li>
              <li>No further charges will be made after the current billing period</li>
              <li>Your subscription will not automatically renew</li>
            </ul>
          </section>

          <section>
            <Title order={2} size="h3" className="text-white mb-3">
              2. Refund Policy
            </Title>
            <Text size="sm" className="text-gray-300 mb-4">
              <strong className="text-white">2.1 Partial/Prorated Refunds:</strong> We offer partial, prorated
              refunds for the unused portion of your subscription period. Refunds are calculated based on the number of
              days remaining in your current billing period from the date of cancellation.
            </Text>
            <Text size="sm" className="text-gray-300 mb-4">
              <strong className="text-white">2.2 Refund Processing:</strong> Refunds will be processed to the original
              payment method within 5-10 business days. The refund amount will be calculated as follows:
            </Text>
            <Text size="sm" className="text-gray-300 mb-4 ml-4">
              Refund Amount = (Monthly Subscription Fee ÷ Days in Billing Period) × Remaining Days
            </Text>
            <Text size="sm" className="text-gray-300 mb-4">
              <strong className="text-white">2.3 Refund Requests:</strong> To request a refund, please contact us at{' '}
              <a href="mailto:myrevuhq@gmail.com" className="text-teal-400 hover:underline">
                myrevuhq@gmail.com
              </a>{' '}
              with your account details and reason for cancellation.
            </Text>
            <Text size="sm" className="text-gray-300 mb-4">
              <strong className="text-white">2.4 Non-Refundable Items:</strong> The following are not eligible for
              refunds:
            </Text>
            <ul className="list-disc list-inside text-gray-300 text-sm mb-4 space-y-2 ml-4">
              <li>SMS messages already sent (charges are based on usage)</li>
              <li>Any fees or charges incurred due to violation of our Terms of Service</li>
            </ul>
          </section>

          <section>
            <Title order={2} size="h3" className="text-white mb-3">
              3. Chargebacks and Disputes
            </Title>
            <Text size="sm" className="text-gray-300 mb-4">
              If you dispute a charge with your bank or credit card company, we may suspend your account until the
              dispute is resolved. We encourage you to contact us directly at{' '}
              <a href="mailto:myrevuhq@gmail.com" className="text-teal-400 hover:underline">
                myrevuhq@gmail.com
              </a>{' '}
              to resolve any billing issues before initiating a chargeback.
            </Text>
          </section>

          <section>
            <Title order={2} size="h3" className="text-white mb-3">
              4. Account Termination by Us
            </Title>
            <Text size="sm" className="text-gray-300 mb-4">
              If we terminate your account due to a violation of our Terms of Service, you will not be eligible for a
              refund. If we terminate your account for reasons other than Terms violations, we will provide a prorated
              refund for the unused portion of your subscription.
            </Text>
          </section>

          <section>
            <Title order={2} size="h3" className="text-white mb-3">
              5. Changes to Pricing
            </Title>
            <Text size="sm" className="text-gray-300 mb-4">
              If we increase our subscription prices, we will notify you at least 30 days in advance. You may cancel
              your subscription before the price increase takes effect to avoid the new pricing. Price increases will
              only apply to subsequent billing periods.
            </Text>
          </section>

          <section>
            <Title order={2} size="h3" className="text-white mb-3">
              6. Contact Us
            </Title>
            <Text size="sm" className="text-gray-300 mb-4">
              If you have any questions about our refund or cancellation policy, please contact us at:{' '}
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

