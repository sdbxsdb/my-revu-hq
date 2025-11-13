import { Paper, Title, Text, Container, Stack, Divider } from '@mantine/core';

export const Privacy = () => {
  return (
    <Container size="md" py="xl">
      <Paper shadow="md" p="xl" className="bg-[#1a1a1a]">
        <Stack gap="lg">
          <Title order={1} className="text-white mb-4">
            Privacy Policy
          </Title>
          <Text size="sm" className="text-gray-400">
            Last updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>

          <Divider />

          <section>
            <Title order={2} size="h3" className="text-white mb-3">
              1. Introduction
            </Title>
            <Text size="sm" className="text-gray-300 mb-4">
              MyRevuHQ ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how
              we collect, use, disclose, and safeguard your information when you use our Service. By using MyRevuHQ, you
              consent to the data practices described in this policy.
            </Text>
          </section>

          <section>
            <Title order={2} size="h3" className="text-white mb-3">
              2. Information We Collect
            </Title>
            <Text size="sm" className="text-gray-300 mb-4">
              <strong className="text-white">2.1 Account Information:</strong> When you create an account, we collect:
            </Text>
            <ul className="list-disc list-inside text-gray-300 text-sm mb-4 space-y-2 ml-4">
              <li>Email address (required for authentication)</li>
              <li>Business name (required)</li>
              <li>Review links (Google, Facebook, and other review platform URLs)</li>
              <li>SMS template preferences</li>
            </ul>
            <Text size="sm" className="text-gray-300 mb-4">
              <strong className="text-white">2.2 Customer Data:</strong> When you use our Service to manage customers,
              we store:
            </Text>
            <ul className="list-disc list-inside text-gray-300 text-sm mb-4 space-y-2 ml-4">
              <li>Customer names</li>
              <li>Phone numbers (including country codes)</li>
              <li>Job descriptions (optional)</li>
              <li>SMS delivery status</li>
            </ul>
            <Text size="sm" className="text-gray-300 mb-4">
              <strong className="text-white">2.3 SMS Messages:</strong> We store the content of SMS messages sent
              through our Service, along with timestamps and delivery status.
            </Text>
            <Text size="sm" className="text-gray-300 mb-4">
              <strong className="text-white">2.4 Payment Information:</strong> Payment processing is handled by Stripe.
              We store Stripe customer IDs and subscription information, but we do not store your full payment card
              details. Payment card information is securely processed by Stripe in accordance with their privacy policy.
            </Text>
            <Text size="sm" className="text-gray-300 mb-4">
              <strong className="text-white">2.5 Usage Data:</strong> We collect information about how you use the
              Service, including SMS usage counts and account activity.
            </Text>
          </section>

          <section>
            <Title order={2} size="h3" className="text-white mb-3">
              3. How We Use Your Information
            </Title>
            <Text size="sm" className="text-gray-300 mb-4">We use the information we collect to:</Text>
            <ul className="list-disc list-inside text-gray-300 text-sm mb-4 space-y-2 ml-4">
              <li>Provide, maintain, and improve the Service</li>
              <li>Process and manage your subscription</li>
              <li>Send SMS messages on your behalf through our SMS provider (Twilio)</li>
              <li>Communicate with you about your account and the Service</li>
              <li>Comply with legal obligations</li>
              <li>Prevent fraud and abuse</li>
            </ul>
          </section>

          <section>
            <Title order={2} size="h3" className="text-white mb-3">
              4. Third-Party Services
            </Title>
            <Text size="sm" className="text-gray-300 mb-4">
              We use the following third-party services that process your data:
            </Text>
            <ul className="list-disc list-inside text-gray-300 text-sm mb-4 space-y-2 ml-4">
              <li>
                <strong className="text-white">Supabase:</strong> Used for authentication and database storage. Your
                data is stored securely in Supabase's infrastructure. See Supabase's privacy policy for more
                information.
              </li>
              <li>
                <strong className="text-white">Stripe:</strong> Used for payment processing. Payment information is
                processed by Stripe in accordance with their privacy policy. We do not store full payment card details.
              </li>
              <li>
                <strong className="text-white">Twilio:</strong> Used for SMS message delivery. Customer phone numbers
                and message content are transmitted to Twilio for SMS delivery. See Twilio's privacy policy for more
                information.
              </li>
            </ul>
            <Text size="sm" className="text-gray-300 mb-4">
              These third-party services have their own privacy policies governing the collection and use of your
              information. We encourage you to review their privacy policies.
            </Text>
          </section>

          <section>
            <Title order={2} size="h3" className="text-white mb-3">
              5. Data Security
            </Title>
            <Text size="sm" className="text-gray-300 mb-4">
              We implement reasonable security measures to protect your information, including encryption in transit and
              at rest, secure authentication, and access controls. However, no method of transmission over the Internet
              or electronic storage is 100% secure. While we strive to protect your data, we cannot guarantee absolute
              security.
            </Text>
          </section>

          <section>
            <Title order={2} size="h3" className="text-white mb-3">
              6. Data Retention
            </Title>
            <Text size="sm" className="text-gray-300 mb-4">
              We retain your data for as long as necessary to provide the Service and comply with legal obligations.
              When you delete your account, we will retain your data for legal and compliance purposes unless you
              specifically request a hard delete. If you request a hard delete, we will permanently delete your data
              within 30 days, subject to any legal requirements to retain certain information.
            </Text>
          </section>

          <section>
            <Title order={2} size="h3" className="text-white mb-3">
              7. Your Rights
            </Title>
            <Text size="sm" className="text-gray-300 mb-4">
              Depending on your location, you may have the following rights regarding your personal data:
            </Text>
            <ul className="list-disc list-inside text-gray-300 text-sm mb-4 space-y-2 ml-4">
              <li>
                <strong className="text-white">Access:</strong> Request access to your personal data
              </li>
              <li>
                <strong className="text-white">Correction:</strong> Request correction of inaccurate data
              </li>
              <li>
                <strong className="text-white">Deletion:</strong> Request deletion of your data (subject to legal
                requirements)
              </li>
              <li>
                <strong className="text-white">Portability:</strong> Request a copy of your data in a portable format
              </li>
              <li>
                <strong className="text-white">Objection:</strong> Object to processing of your data
              </li>
              <li>
                <strong className="text-white">Restriction:</strong> Request restriction of processing
              </li>
            </ul>
            <Text size="sm" className="text-gray-300 mb-4">
              To exercise these rights, please contact us at{' '}
              <a href="mailto:myrevuhq@gmail.com" className="text-teal-400 hover:underline">
                myrevuhq@gmail.com
              </a>
              . We will respond to your request within 30 days.
            </Text>
          </section>

          <section>
            <Title order={2} size="h3" className="text-white mb-3">
              8. GDPR Compliance (UK, Ireland, EU)
            </Title>
            <Text size="sm" className="text-gray-300 mb-4">
              If you are located in the UK, Ireland, or EU, you have additional rights under the General Data Protection
              Regulation (GDPR). We process your data based on:
            </Text>
            <ul className="list-disc list-inside text-gray-300 text-sm mb-4 space-y-2 ml-4">
              <li>Your consent (for optional data)</li>
              <li>Performance of a contract (to provide the Service)</li>
              <li>Legal obligations (compliance requirements)</li>
              <li>Legitimate interests (service improvement, fraud prevention)</li>
            </ul>
            <Text size="sm" className="text-gray-300 mb-4">
              You have the right to lodge a complaint with your local data protection authority if you believe we have
              violated your data protection rights.
            </Text>
          </section>

          <section>
            <Title order={2} size="h3" className="text-white mb-3">
              9. Children's Privacy
            </Title>
            <Text size="sm" className="text-gray-300 mb-4">
              Our Service is not intended for individuals under the legal age required to hold a bank card in their
              country. We do not knowingly collect personal information from minors. If you believe we have collected
              information from a minor, please contact us immediately.
            </Text>
          </section>

          <section>
            <Title order={2} size="h3" className="text-white mb-3">
              10. International Data Transfers
            </Title>
            <Text size="sm" className="text-gray-300 mb-4">
              Your information may be transferred to and processed in countries other than your country of residence.
              These countries may have data protection laws that differ from those in your country. We ensure that
              appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.
            </Text>
          </section>

          <section>
            <Title order={2} size="h3" className="text-white mb-3">
              11. Cookies and Tracking
            </Title>
            <Text size="sm" className="text-gray-300 mb-4">
              We use cookies and similar technologies to maintain your session and improve the Service. For more
              information, please see our Cookie Policy.
            </Text>
          </section>

          <section>
            <Title order={2} size="h3" className="text-white mb-3">
              12. Changes to This Privacy Policy
            </Title>
            <Text size="sm" className="text-gray-300 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by
              posting the new Privacy Policy on this page and updating the "Last updated" date. Your continued use of
              the Service after such changes constitutes acceptance of the updated Privacy Policy.
            </Text>
          </section>

          <section>
            <Title order={2} size="h3" className="text-white mb-3">
              13. Contact Us
            </Title>
            <Text size="sm" className="text-gray-300 mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact us at:{' '}
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

