import { Title, Text, Stack, Divider, Button, Accordion } from '@mantine/core';
import { IconMail, IconHelpCircle } from '@tabler/icons-react';
import { useAuth } from '@/hooks/useAuth';
import { PageContainer } from '@/components/PageContainer';

export const Help = () => {
  const { user } = useAuth();

  const faqs = [
    {
      question: 'What do I need to get started?',
      answer: (
        <>
          <p>To get started with MyRevuHQ, you'll need:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
            <li>An account (sign up with your email address)</li>
            <li>An active subscription (choose a plan on the Billing page)</li>
            <li>Your business name and review links (Google, Facebook, etc.)</li>
            <li>A customized SMS message template (optional, but recommended)</li>
          </ul>
          <p className="mt-2">
            Once you're set up, you can start adding customers and sending review requests right
            away!
          </p>
        </>
      ),
    },
    {
      question: 'Why is my SMS not sending?',
      answer: (
        <>
          If you see an error when trying to send a review request, check:
          <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
            <li>Your subscription is active (go to Billing page)</li>
            <li>You haven't exceeded your monthly SMS limit (shown at the top of Customer List)</li>
            <li>
              The customer's phone number is valid - make sure you selected the correct country
            </li>
            <li>The customer hasn't reached the 3-message limit</li>
            <li>The customer isn't marked as opted out</li>
          </ul>
          <p className="mt-2">If the issue persists, try refreshing the page or contact support.</p>
        </>
      ),
    },
    {
      question: 'Why is my phone number showing as invalid?',
      answer: (
        <>
          Phone numbers are validated based on the country you select. Make sure:
          <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
            <li>You selected the correct country from the dropdown</li>
            <li>
              You entered the number in local format (e.g., for UK: 7780586444 without the leading
              0, or 07780586444 with it)
            </li>
            <li>The number matches the format for that country</li>
          </ul>
          <p className="mt-2">
            The system will show an error message if the format is incorrect. Try removing or adding
            the leading 0 if you get an error.
          </p>
        </>
      ),
    },
    {
      question: "Why can't I find a customer in my list?",
      answer: (
        <>
          <p>
            Use the search bar to search by name, phone number, or job description. You can also use
            the alphabet filter (A-Z) to filter by the first letter of their name.
          </p>
          <p className="mt-2">
            Make sure you haven't applied filters that exclude them - check the status filter
            (All/Sent/Not Sent) and letter filter.
          </p>
          <p className="mt-2">
            If you still can't find them, they may have been deleted or you may be looking at a
            filtered view.
          </p>
        </>
      ),
    },
    {
      question: 'Why is my SMS usage count wrong?',
      answer: (
        <>
          <p>
            The SMS usage count is cached to prevent it from disappearing when you change filters.
            It updates automatically when you send a review request.
          </p>
          <p className="mt-2">If the count seems incorrect, try:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
            <li>Refreshing the page</li>
            <li>Sending a test SMS to see if it updates</li>
            <li>Checking your Billing page for your subscription tier and limits</li>
          </ul>
          <p className="mt-2">The count resets monthly on your billing date.</p>
        </>
      ),
    },
    {
      question: 'Why can\'t I send to a customer who has "Limit Reached"?',
      answer: (
        <>
          <p>
            Each customer can receive a maximum of 3 review requests. Once they've received 3
            messages, the "Request Review" button is disabled and you'll see a "Limit Reached (3/3)"
            indicator.
          </p>
          <p className="mt-2">
            This limit helps maintain good customer relationships and comply with SMS best
            practices.
          </p>
          <p className="mt-2">
            You can still view and edit the customer, but cannot send more review requests.
          </p>
        </>
      ),
    },
    {
      question: "Why isn't my magic link email arriving?",
      answer: (
        <>
          <p>Check your spam/junk folder first. Magic link emails can sometimes be filtered.</p>
          <p className="mt-2">If you still don't see it:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
            <li>Wait a few minutes (emails can be delayed)</li>
            <li>Check that you entered your email address correctly</li>
            <li>Try requesting a new magic link</li>
            <li>Check if your email provider is blocking the email</li>
          </ul>
          <p className="mt-2">You can also try the password reset option instead.</p>
        </>
      ),
    },
    {
      question: 'Why is the pricing showing in the wrong currency?',
      answer: (
        <>
          <p>
            Pricing is automatically detected based on your location. If it's showing the wrong
            currency, try:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
            <li>Refreshing the page</li>
            <li>Clearing your browser cache</li>
            <li>Checking that your location services are enabled</li>
          </ul>
          <p className="mt-2">
            The system detects UK (GBP), Ireland (EUR), and USA (USD). If detection fails, it may
            default to one of these currencies.
          </p>
        </>
      ),
    },
    {
      question: 'Why is my payment not processing?',
      answer: (
        <>
          <p>If you're having trouble with payment:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
            <li>Check that your card details are correct and the card is not expired</li>
            <li>Verify your billing address matches your card</li>
            <li>Check that your bank hasn't blocked the transaction</li>
            <li>Try a different payment method</li>
          </ul>
          <p className="mt-2">
            You can manage your payment method in the Billing page by clicking "Manage Payment" to
            open the secure payment portal.
          </p>
        </>
      ),
    },
    {
      question: 'Why is the page loading slowly or not responding?',
      answer: (
        <>
          <p>If the app is slow or unresponsive:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
            <li>Check your internet connection</li>
            <li>Try refreshing the page</li>
            <li>Clear your browser cache and cookies</li>
            <li>Try a different browser</li>
            <li>Disable browser extensions that might interfere</li>
          </ul>
          <p className="mt-2">
            If you have hundreds of customers, use the alphabet filter to reduce the number
            displayed at once, which will improve performance.
          </p>
        </>
      ),
    },
    {
      question: 'Why am I being logged out unexpectedly?',
      answer: (
        <>
          <p>You may be logged out if:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
            <li>Your session expired (sessions last 7 days)</li>
            <li>You cleared your browser cookies</li>
            <li>You're using a different browser or device</li>
            <li>There was a server error</li>
          </ul>
          <p className="mt-2">
            Simply log back in with your email. If you keep getting logged out, try using the
            "Remember me" option when signing in, or contact support if the issue persists.
          </p>
        </>
      ),
    },
    {
      question: 'Can I remove the regulatory text from my SMS messages?',
      answer: (
        <>
          <p>
            The regulatory text "Msg&data rates may apply. Reply STOP to opt out, HELP for help." is
            automatically added to SMS messages sent to customers in the United States and Canada
            only.
          </p>
          <p className="mt-2">
            This text cannot be removed as it is required by law (A2P 10DLC regulations) for all SMS
            messages sent to US and Canadian phone numbers. It ensures compliance with carrier
            requirements and telecommunications regulations.
          </p>
          <p className="mt-2">
            Messages sent to customers in other countries (UK, Ireland, etc.) do not include this
            regulatory text.
          </p>
        </>
      ),
    },
  ];

  return (
    <PageContainer>
      <Stack gap="lg" className="lg:flex-1">
          <section className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <IconHelpCircle size={32} className="text-teal-400" />
              <Title order={1} className="text-white">
                Need Help?
              </Title>
            </div>
            <Text size="sm" className="text-gray-300">
              Find answers to common questions or contact us for additional support
            </Text>
          </section>

          <Divider />

          <section>
            <Title order={2} size="h3" className="text-white mb-3">
              Frequently Asked Questions
            </Title>
            <Accordion
              variant="separated"
              radius="md"
              classNames={{
                item: 'bg-[#2a2a2a] border-[#3a3a3a]',
                control: 'hover:bg-[#333333] py-3 px-5',
                label: 'text-white font-semibold',
                content: 'text-gray-300 pt-2 pb-4 px-5',
                chevron: 'text-teal-400',
              }}
            >
              {faqs.map((faq, index) => (
                <Accordion.Item key={index} value={`faq-${index}`}>
                  <Accordion.Control>
                    <Text size="sm" className="text-white font-medium">
                      {faq.question}
                    </Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Text size="sm" className="text-gray-300">
                      {faq.answer}
                    </Text>
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion>
          </section>

          <Divider />

          <section className="text-center">
            <Title order={2} size="h3" className="text-white mb-3">
              Need More Help?
            </Title>
            <Text size="sm" className="text-gray-300 mb-6">
              Can't find what you're looking for? We're here to help!
            </Text>
            <Button
              size="lg"
              leftSection={<IconMail size={20} />}
              onClick={() => (window.location.href = 'mailto:myrevuhq@gmail.com')}
              className="font-medium"
            >
              Contact Us
            </Button>
            <Text size="xs" className="text-gray-400 mt-4">
              <a
                href="mailto:myrevuhq@gmail.com"
                className="text-teal-400 hover:text-teal-300 hover:underline"
              >
                myrevuhq@gmail.com
              </a>
            </Text>
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
              {user && (
                <>
                  {' • '}
                  <a href="/about" className="text-teal-400 hover:text-teal-300 hover:underline">
                    About
                  </a>
                </>
              )}
            </Text>
          </section>
      </Stack>
    </PageContainer>
  );
};
