import { Paper, Title, Text, Container, Stack, Divider } from '@mantine/core';

export const Terms = () => {
  return (
    <Container size="md" py="xl">
      <Paper shadow="md" p="xl" className="bg-[#1a1a1a]">
        <Stack gap="lg">
          <Title order={1} className="text-white mb-4">
            Terms and Conditions
          </Title>
          <Text size="sm" className="text-gray-400">
            Last updated:{' '}
            {new Date().toLocaleDateString('en-GB', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>

          <Divider />

          <section>
            <Title order={2} size="h3" className="text-white mb-3">
              1. Agreement to Terms
            </Title>
            <Text size="sm" className="text-gray-300 mb-4">
              By accessing or using MyRevuHQ ("Service"), you agree to be bound by these Terms and
              Conditions. If you disagree with any part of these terms, you may not access the
              Service.
            </Text>
          </section>

          <section>
            <Title order={2} size="h3" className="text-white mb-3">
              2. Description of Service
            </Title>
            <Text size="sm" className="text-gray-300 mb-4">
              MyRevuHQ is a review management platform that enables businesses to send automated SMS
              review requests to their customers. The Service includes customer management, SMS
              messaging, and review link management features.
            </Text>
          </section>

          <section>
            <Title order={2} size="h3" className="text-white mb-3">
              3. Eligibility and Age Requirements
            </Title>
            <Text size="sm" className="text-gray-300 mb-4">
              You must be at least the legal age required to hold a bank card in your country of
              residence to use this Service. If you are below this age, you must have parental
              consent and the card holder's permission to use the Service. By using the Service, you
              represent and warrant that you meet these requirements.
            </Text>
          </section>

          <section>
            <Title order={2} size="h3" className="text-white mb-3">
              4. Account Registration
            </Title>
            <Text size="sm" className="text-gray-300 mb-4">
              You are responsible for maintaining the confidentiality of your account credentials.
              You agree to notify us immediately of any unauthorized use of your account. We reserve
              the right to suspend or terminate accounts that violate these Terms.
            </Text>
          </section>

          <section>
            <Title order={2} size="h3" className="text-white mb-3">
              5. Subscription and Billing
            </Title>
            <Text size="sm" className="text-gray-300 mb-4">
              <strong className="text-white">5.1 Subscription Plans:</strong> MyRevuHQ operates on a
              monthly subscription basis. Current pricing is available on the billing page.
            </Text>
            <Text size="sm" className="text-gray-300 mb-4">
              <strong className="text-white">5.2 Payment:</strong> Subscriptions are billed monthly
              in advance. You may pay by credit/debit card or invoice (for eligible businesses).
              Payment processing is handled by Stripe.
            </Text>
            <Text size="sm" className="text-gray-300 mb-4">
              <strong className="text-white">5.3 Cancellation:</strong> You may cancel your
              subscription at any time. Upon cancellation, you will retain access to the Service
              until the end of your current billing period. No refunds will be provided for the
              current billing period unless otherwise specified in our Refund Policy.
            </Text>
            <Text size="sm" className="text-gray-300 mb-4">
              <strong className="text-white">5.4 Price Changes:</strong> We reserve the right to
              modify subscription prices. Price changes will be communicated to you at least 30 days
              in advance and will apply to subsequent billing periods.
            </Text>
          </section>

          <section>
            <Title order={2} size="h3" className="text-white mb-3">
              6. SMS Messaging and Compliance
            </Title>
            <Text size="sm" className="text-gray-300 mb-4">
              <strong className="text-white">6.1 Your Responsibility:</strong> You are solely
              responsible for ensuring compliance with all applicable laws and regulations when
              sending SMS messages through our Service. This includes, but is not limited to:
            </Text>
            <ul className="list-disc list-inside text-gray-300 text-sm mb-4 space-y-2 ml-4">
              <li>Obtaining proper consent from recipients before sending SMS messages</li>
              <li>
                Complying with the Telephone Consumer Protection Act (TCPA) in the United States
              </li>
              <li>Complying with GDPR and local data protection laws in the UK, Ireland, and EU</li>
              <li>Providing opt-out mechanisms for recipients</li>
              <li>Complying with local SMS and telecommunications regulations</li>
            </ul>
            <Text size="sm" className="text-gray-300 mb-4">
              <strong className="text-white">6.2 No Guarantee of Delivery:</strong> While we strive
              to ensure reliable SMS delivery, we do not guarantee that messages will be delivered.
              SMS delivery is subject to carrier availability and network conditions.
            </Text>
            <Text size="sm" className="text-gray-300 mb-4">
              <strong className="text-white">6.3 Prohibited Use:</strong> You agree not to use the
              Service to send spam, unsolicited messages, or messages that violate any laws or
              regulations. We reserve the right to suspend or terminate accounts that violate this
              provision.
            </Text>
          </section>

          <section>
            <Title order={2} size="h3" className="text-white mb-3">
              7. User Content and Data
            </Title>
            <Text size="sm" className="text-gray-300 mb-4">
              <strong className="text-white">7.1 Your Content:</strong> You retain ownership of all
              content and data you upload or create through the Service, including customer
              information, SMS templates, and review links.
            </Text>
            <Text size="sm" className="text-gray-300 mb-4">
              <strong className="text-white">7.2 License to Use:</strong> By using the Service, you
              grant us a license to store, process, and transmit your content as necessary to
              provide the Service.
            </Text>
            <Text size="sm" className="text-gray-300 mb-4">
              <strong className="text-white">7.3 Data Security:</strong> We implement reasonable
              security measures to protect your data, but we cannot guarantee absolute security. You
              are responsible for maintaining backups of your data.
            </Text>
          </section>

          <section>
            <Title order={2} size="h3" className="text-white mb-3">
              8. Acceptable Use
            </Title>
            <Text size="sm" className="text-gray-300 mb-4">
              You agree not to:
            </Text>
            <ul className="list-disc list-inside text-gray-300 text-sm mb-4 space-y-2 ml-4">
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Violate any laws in your jurisdiction</li>
              <li>Transmit any viruses, malware, or harmful code</li>
              <li>Attempt to gain unauthorized access to the Service or its systems</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Use the Service to send spam or unsolicited messages</li>
              <li>Impersonate any person or entity</li>
            </ul>
          </section>

          <section>
            <Title order={2} size="h3" className="text-white mb-3">
              9. Disclaimer of Warranties
            </Title>
            <Text size="sm" className="text-gray-300 mb-4">
              <strong className="text-white">9.1 "AS IS" Service:</strong> THE SERVICE IS PROVIDED
              "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED,
              INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
              PARTICULAR PURPOSE, NON-INFRINGEMENT, OR COURSE OF PERFORMANCE.
            </Text>
            <Text size="sm" className="text-gray-300 mb-4">
              <strong className="text-white">9.2 No Guarantees:</strong> We do not warrant that:
            </Text>
            <ul className="list-disc list-inside text-gray-300 text-sm mb-4 space-y-2 ml-4">
              <li>The Service will be uninterrupted, secure, or error-free</li>
              <li>Any defects or errors will be corrected</li>
              <li>The Service is free of viruses or other harmful components</li>
              <li>SMS messages will be delivered successfully or in a timely manner</li>
              <li>The Service will meet your requirements or expectations</li>
            </ul>
            <Text size="sm" className="text-gray-300 mb-4">
              <strong className="text-white">9.3 Third-Party Services:</strong> We do not warrant or
              guarantee the performance, availability, or reliability of any third-party services
              (including but not limited to Stripe, Twilio, or Supabase) used in connection with the
              Service.
            </Text>
          </section>

          <section>
            <Title order={2} size="h3" className="text-white mb-3">
              10. Service Availability
            </Title>
            <Text size="sm" className="text-gray-300 mb-4">
              We strive to maintain high availability of the Service but do not guarantee
              uninterrupted access. The Service may be unavailable due to maintenance, updates,
              technical failures, third-party service outages, or circumstances beyond our
              reasonable control. We are not liable for any losses, damages, or costs resulting from
              Service unavailability, downtime, or interruptions.
            </Text>
          </section>

          <section>
            <Title order={2} size="h3" className="text-white mb-3">
              11. Limitation of Liability
            </Title>
            <Text size="sm" className="text-gray-300 mb-4">
              <strong className="text-white">11.1 Maximum Liability:</strong> TO THE MAXIMUM EXTENT
              PERMITTED BY APPLICABLE LAW IN THE UNITED KINGDOM, UNITED STATES, AND IRELAND,
              MYREVUHQ'S TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THE USE
              OF OR INABILITY TO USE THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE
              TWELVE (12) MONTHS PRIOR TO THE EVENT GIVING RISE TO THE LIABILITY, OR ONE HUNDRED
              POUNDS STERLING (£100), WHICHEVER IS GREATER.
            </Text>
            <Text size="sm" className="text-gray-300 mb-4">
              <strong className="text-white">11.2 Exclusion of Damages:</strong> TO THE MAXIMUM
              EXTENT PERMITTED BY APPLICABLE LAW, MYREVUHQ SHALL NOT BE LIABLE FOR ANY OF THE
              FOLLOWING, WHETHER BASED ON CONTRACT, TORT (INCLUDING NEGLIGENCE), STRICT LIABILITY,
              OR ANY OTHER LEGAL THEORY:
            </Text>
            <ul className="list-disc list-inside text-gray-300 text-sm mb-4 space-y-2 ml-4">
              <li>Indirect, incidental, special, consequential, or punitive damages</li>
              <li>Loss of profits, revenue, business, or anticipated savings</li>
              <li>Loss of data, use, goodwill, or other intangible losses</li>
              <li>Damages resulting from unauthorized access to or alteration of your data</li>
              <li>Damages resulting from the use or inability to use the Service</li>
              <li>Damages resulting from SMS delivery failures, delays, or errors</li>
              <li>
                Damages resulting from third-party service failures (Stripe, Twilio, Supabase)
              </li>
              <li>Damages resulting from your violation of laws or regulations</li>
              <li>
                Damages resulting from your failure to obtain proper consent for SMS messaging
              </li>
              <li>Any other damages or losses of any kind</li>
            </ul>
            <Text size="sm" className="text-gray-300 mb-4">
              <strong className="text-white">11.3 No Liability for User Actions:</strong> We are not
              liable for any damages, losses, or legal consequences resulting from:
            </Text>
            <ul className="list-disc list-inside text-gray-300 text-sm mb-4 space-y-2 ml-4">
              <li>Your use or misuse of the Service</li>
              <li>Your failure to comply with applicable laws and regulations</li>
              <li>Your failure to obtain proper consent before sending SMS messages</li>
              <li>Any content, data, or information you transmit through the Service</li>
              <li>Any actions taken by your customers in response to SMS messages</li>
              <li>
                Any disputes, complaints, or legal actions arising from your use of the Service
              </li>
            </ul>
            <Text size="sm" className="text-gray-300 mb-4">
              <strong className="text-white">11.4 Jurisdiction-Specific Limitations:</strong> Some
              jurisdictions do not allow the exclusion or limitation of certain damages. If any such
              limitation or exclusion is held to be invalid or unenforceable in your jurisdiction,
              our liability shall be limited to the maximum extent permitted by law in that
              jurisdiction.
            </Text>
          </section>

          <section>
            <Title order={2} size="h3" className="text-white mb-3">
              12. Indemnification
            </Title>
            <Text size="sm" className="text-gray-300 mb-4">
              <strong className="text-white">12.1 Your Indemnification Obligation:</strong> YOU
              AGREE TO INDEMNIFY, DEFEND, AND HOLD HARMLESS MYREVUHQ, ITS OFFICERS, DIRECTORS,
              EMPLOYEES, AGENTS, AFFILIATES, SUBSIDIARIES, AND LICENSORS FROM AND AGAINST ANY AND
              ALL CLAIMS, DEMANDS, CAUSES OF ACTION, LAWSUITS, PROCEEDINGS, DAMAGES, LOSSES,
              LIABILITIES, COSTS, AND EXPENSES (INCLUDING REASONABLE ATTORNEYS' FEES AND LEGAL
              COSTS) ARISING OUT OF OR RELATING TO:
            </Text>
            <ul className="list-disc list-inside text-gray-300 text-sm mb-4 space-y-2 ml-4">
              <li>Your use or misuse of the Service</li>
              <li>Your violation of these Terms and Conditions</li>
              <li>Your violation of any applicable laws, regulations, or third-party rights</li>
              <li>Your failure to obtain proper consent before sending SMS messages</li>
              <li>
                Your violation of SMS regulations (including TCPA, GDPR, and local
                telecommunications laws)
              </li>
              <li>
                Any content, data, or information you submit, transmit, or store through the Service
              </li>
              <li>
                Any disputes, complaints, or legal actions brought by your customers or third
                parties
              </li>
              <li>
                Any claims that your use of the Service infringes or violates any third-party rights
              </li>
              <li>Any unauthorized access to or use of your account</li>
              <li>Any errors, omissions, or inaccuracies in data you provide</li>
            </ul>
            <Text size="sm" className="text-gray-300 mb-4">
              <strong className="text-white">12.2 Defense and Control:</strong> We reserve the
              right, at our own expense, to assume the exclusive defense and control of any matter
              otherwise subject to indemnification by you, in which event you will cooperate with us
              in asserting any available defenses.
            </Text>
          </section>

          <section>
            <Title order={2} size="h3" className="text-white mb-3">
              13. Force Majeure
            </Title>
            <Text size="sm" className="text-gray-300 mb-4">
              We shall not be liable for any failure or delay in performance under these Terms which
              is due to fire, flood, earthquake, elements of nature or acts of God, acts of war,
              terrorism, riots, civil disorders, rebellions or revolutions, strikes, lockouts, labor
              disputes, third-party service failures (including Stripe, Twilio, or Supabase),
              internet or telecommunications failures, power failures, or any other cause beyond our
              reasonable control.
            </Text>
          </section>

          <section>
            <Title order={2} size="h3" className="text-white mb-3">
              14. No Class Actions
            </Title>
            <Text size="sm" className="text-gray-300 mb-4">
              YOU AGREE THAT YOU MAY BRING CLAIMS AGAINST US ONLY IN YOUR INDIVIDUAL CAPACITY AND
              NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS ACTION, COLLECTIVE ACTION,
              OR REPRESENTATIVE PROCEEDING. YOU FURTHER AGREE THAT NO ARBITRATION OR PROCEEDING CAN
              BE COMBINED WITH ANOTHER WITHOUT THE PRIOR WRITTEN CONSENT OF ALL PARTIES TO ALL
              ARBITRATIONS OR PROCEEDINGS.
            </Text>
          </section>

          <section>
            <Title order={2} size="h3" className="text-white mb-3">
              15. Waiver of Rights
            </Title>
            <Text size="sm" className="text-gray-300 mb-4">
              BY USING THE SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE
              BOUND BY THESE TERMS AND CONDITIONS. YOU FURTHER ACKNOWLEDGE THAT YOU HAVE BEEN
              ADVISED OF THE POSSIBILITY OF DAMAGES AND HAVE HAD THE OPPORTUNITY TO SEEK INDEPENDENT
              LEGAL ADVICE. YOU HEREBY WAIVE ANY RIGHT TO A TRIAL BY JURY AND AGREE THAT ANY
              DISPUTES SHALL BE RESOLVED THROUGH INDIVIDUAL ARBITRATION OR LITIGATION AS SET FORTH
              IN THESE TERMS.
            </Text>
          </section>

          <section>
            <Title order={2} size="h3" className="text-white mb-3">
              16. Severability
            </Title>
            <Text size="sm" className="text-gray-300 mb-4">
              If any provision of these Terms is found to be unenforceable or invalid, that
              provision shall be limited or eliminated to the minimum extent necessary so that these
              Terms shall otherwise remain in full force and effect and enforceable. The invalid or
              unenforceable provision shall be replaced with a valid and enforceable provision that
              comes closest to the intent of the invalid or unenforceable provision.
            </Text>
          </section>

          <section>
            <Title order={2} size="h3" className="text-white mb-3">
              17. Entire Agreement
            </Title>
            <Text size="sm" className="text-gray-300 mb-4">
              These Terms, together with our Privacy Policy and Refund Policy, constitute the entire
              agreement between you and MyRevuHQ regarding the use of the Service and supersede all
              prior or contemporaneous communications, proposals, and agreements, whether oral or
              written, between you and MyRevuHQ.
            </Text>
          </section>

          <section>
            <Title order={2} size="h3" className="text-white mb-3">
              18. Termination
            </Title>
            <Text size="sm" className="text-gray-300 mb-4">
              We may terminate or suspend your account immediately, without prior notice or
              liability, for any reason, including but not limited to conduct that we believe
              violates these Terms, is harmful to other users, us, or third parties, or for any
              other reason at our sole discretion. Upon termination, your right to use the Service
              will cease immediately, and we may delete your account and data. Sections of these
              Terms that by their nature should survive termination shall survive termination,
              including but not limited to indemnification, limitation of liability, and dispute
              resolution provisions.
            </Text>
          </section>

          <section>
            <Title order={2} size="h3" className="text-white mb-3">
              19. Governing Law and Dispute Resolution
            </Title>
            <Text size="sm" className="text-gray-300 mb-4">
              <strong className="text-white">19.1 Governing Law:</strong> These Terms shall be
              governed by and construed in accordance with the laws of the United Kingdom, without
              regard to its conflict of law provisions. For users in the United States, these Terms
              shall also be governed by the laws of the State where MyRevuHQ operates, and for users
              in Ireland, by the laws of Ireland, as applicable.
            </Text>
            <Text size="sm" className="text-gray-300 mb-4">
              <strong className="text-white">19.2 Jurisdiction:</strong> You agree that any disputes
              arising out of or relating to these Terms or the Service shall be subject to the
              exclusive jurisdiction of the courts of the United Kingdom, United States, or Ireland,
              as applicable based on your location or the nature of the dispute.
            </Text>
            <Text size="sm" className="text-gray-300 mb-4">
              <strong className="text-white">19.3 Waiver of Jury Trial:</strong> TO THE FULLEST
              EXTENT PERMITTED BY LAW, YOU AND MYREVUHQ EACH WAIVE THE RIGHT TO A TRIAL BY JURY IN
              ANY ACTION, PROCEEDING, OR COUNTERCLAIM ARISING OUT OF OR RELATING TO THESE TERMS OR
              THE SERVICE.
            </Text>
          </section>

          <section>
            <Title order={2} size="h3" className="text-white mb-3">
              20. Changes to Terms
            </Title>
            <Text size="sm" className="text-gray-300 mb-4">
              We reserve the right to modify these Terms at any time at our sole discretion. We will
              notify you of any material changes by posting the new Terms on this page and updating
              the "Last updated" date. Your continued use of the Service after such changes
              constitutes acceptance of the new Terms. If you do not agree to the modified Terms,
              you must stop using the Service and may cancel your subscription.
            </Text>
          </section>

          <section>
            <Title order={2} size="h3" className="text-white mb-3">
              21. Refund and Cancellation Policy
            </Title>
            <Text size="sm" className="text-gray-300 mb-4">
              <strong className="text-white">21.1 Subscription Cancellation:</strong> You may cancel
              your MyRevuHQ subscription at any time through your account settings or by contacting
              us at{' '}
              <a href="mailto:myrevuhq@gmail.com" className="text-teal-400 hover:underline">
                myrevuhq@gmail.com
              </a>
              . When you cancel:
            </Text>
            <ul className="list-disc list-inside text-gray-300 text-sm mb-4 space-y-2 ml-4">
              <li>
                Your subscription will remain active until the end of your current billing period
              </li>
              <li>
                You will continue to have full access to all Service features until the billing
                period ends
              </li>
              <li>No further charges will be made after the current billing period</li>
              <li>Your subscription will not automatically renew</li>
            </ul>
            <Text size="sm" className="text-gray-300 mb-4">
              <strong className="text-white">21.2 Partial/Prorated Refunds:</strong> We offer
              partial, prorated refunds for the unused portion of your subscription period. Refunds
              are calculated based on the number of days remaining in your current billing period
              from the date of cancellation.
            </Text>
            <Text size="sm" className="text-gray-300 mb-4">
              <strong className="text-white">21.3 Refund Processing:</strong> Refunds will be
              processed to the original payment method within 5-10 business days. The refund amount
              will be calculated as follows:
            </Text>
            <Text size="sm" className="text-gray-300 mb-4 ml-4">
              Refund Amount = (Monthly Subscription Fee ÷ Days in Billing Period) × Remaining Days
            </Text>
            <Text size="sm" className="text-gray-300 mb-4">
              <strong className="text-white">21.4 Refund Requests:</strong> To request a refund,
              please contact us at{' '}
              <a href="mailto:myrevuhq@gmail.com" className="text-teal-400 hover:underline">
                myrevuhq@gmail.com
              </a>{' '}
              with your account details and reason for cancellation.
            </Text>
            <Text size="sm" className="text-gray-300 mb-4">
              <strong className="text-white">21.5 Non-Refundable Items:</strong> The following are
              not eligible for refunds:
            </Text>
            <ul className="list-disc list-inside text-gray-300 text-sm mb-4 space-y-2 ml-4">
              <li>SMS messages already sent (charges are based on usage)</li>
              <li>Any fees or charges incurred due to violation of our Terms of Service</li>
            </ul>
            <Text size="sm" className="text-gray-300 mb-4">
              <strong className="text-white">21.6 Account Termination by Us:</strong> If we
              terminate your account due to a violation of our Terms of Service, you will not be
              eligible for a refund. If we terminate your account for reasons other than Terms
              violations, we will provide a prorated refund for the unused portion of your
              subscription.
            </Text>
          </section>

          <section>
            <Title order={2} size="h3" className="text-white mb-3">
              22. Contact Information
            </Title>
            <Text size="sm" className="text-gray-300 mb-4">
              If you have any questions about these Terms, please contact us at:{' '}
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
