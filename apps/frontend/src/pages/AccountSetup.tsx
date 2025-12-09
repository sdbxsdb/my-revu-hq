import { useEffect, useState, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from '@mantine/form';
import {
  Button,
  TextInput,
  Textarea,
  Title,
  Stack,
  Group,
  Alert,
  Text,
  Skeleton,
  Checkbox,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconPlus,
  IconX,
  IconCheck,
  IconX as IconXCircle,
  IconAlertCircle,
  IconHome,
} from '@tabler/icons-react';
import { apiClient } from '@/lib/api';
import { usePayment } from '@/contexts/PaymentContext';
import { useAccount } from '@/contexts/AccountContext';
import { useSetup } from '@/contexts/SetupContext';
import { getSmsLimitFromTier, type PricingTier } from '@/lib/pricing';
import { AccountErrorAlert } from '@/components/AccountErrorAlert';
import { SetupProgressModal } from '@/components/SetupProgressModal';
import { PageSkeleton } from '@/components/PageSkeleton';
import { PageContainer } from '@/components/PageContainer';

// Helper function to validate URL
const isValidUrl = (url: string): boolean => {
  if (!url || url.trim() === '') return false;
  try {
    new URL(url);
    return true;
  } catch {
    // Try with https:// prefix
    try {
      new URL(`https://${url}`);
      return true;
    } catch {
      return false;
    }
  }
};

export const AccountSetup = () => {
  const navigate = useNavigate();
  const { hasPaid, loading: paymentLoading } = usePayment();
  const { account, loading: accountLoading, refetch } = useAccount();
  const { progress, refresh: refreshSetup } = useSetup();
  const [loading, setLoading] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<PricingTier | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [userCountry, setUserCountry] = useState<string>('GB');
  const [showProgressModal, setShowProgressModal] = useState(false);

  // Show loading skeleton only while actively loading account data
  // Don't show skeleton if we have account data (even if form hasn't populated yet)
  const isLoading = accountLoading && !account;

  // Detect user's country for spelling
  useEffect(() => {
    const detectCountry = async () => {
      try {
        const response = await apiClient.detectCountry();
        setUserCountry(response.country);
      } catch (error) {
        // Default to GB
        setUserCountry('GB');
      }
    };
    detectCountry();
  }, []);

  // Determine spelling based on location
  // UK and IE use 's', US and CA use 'z'
  const personalizationSpelling = ['GB', 'IE'].includes(userCountry.toUpperCase())
    ? 'Personalisation'
    : 'Personalization';

  const form = useForm({
    initialValues: {
      businessName: '',
      reviewLinks: [{ name: '', url: '' }] as Array<{ name: string; url: string }>,
      smsTemplate: '',
      includeNameInSms: true,
      includeJobInSms: true,
    },
    validate: {
      businessName: (value) => {
        if (value.trim().length === 0) return 'Business name is required';
        if (value.trim().length <= 2) return 'Business name must be more than 2 characters';
        return null;
      },
      reviewLinks: {
        name: (value, values, path) => {
          const index = parseInt(path.split('.')[1]);
          const link = values.reviewLinks[index];
          // Only validate if URL is filled (meaning user is trying to complete this link)
          if (link.url.trim() && !value.trim()) {
            return 'Link name is required when URL is provided';
          }
          return null;
        },
        url: (value, values, path) => {
          const index = parseInt(path.split('.')[1]);
          const link = values.reviewLinks[index];
          // Only validate if name is filled (meaning user is trying to complete this link)
          if (link.name.trim() && value.trim()) {
            if (!isValidUrl(value)) {
              return 'Invalid URL format. Please include http:// or https:// (e.g., https://example.com)';
            }
          }
          return null;
        },
      },
      smsTemplate: (value) => {
        if (!value || value.trim().length === 0) return 'SMS template is required';
        if (value.length < 50) return 'SMS template must be at least 50 characters';
        if (value.length > 400) return 'SMS template must not exceed 400 characters';
        return null;
      },
    },
  });

  // Checklist validation
  const checklist = useMemo(() => {
    const businessNameValid = form.values.businessName.trim().length > 0;
    const reviewLinksValid =
      form.values.reviewLinks.filter((link) => link.name.trim() !== '' && link.url.trim() !== '')
        .length > 0;
    const smsTemplateValid = form.values.smsTemplate.trim().length >= 5;

    return {
      businessName: businessNameValid,
      reviewLinks: reviewLinksValid,
      smsTemplate: smsTemplateValid,
      allValid: businessNameValid && reviewLinksValid && smsTemplateValid,
    };
  }, [form.values.businessName, form.values.reviewLinks, form.values.smsTemplate]);

  // Track if form has been populated to prevent re-population
  const formPopulatedRef = useRef(false);

  // Load subscription tier for SMS limit display
  useEffect(() => {
    const loadSubscription = async () => {
      try {
        const subscription = await apiClient.getSubscription().catch(() => null);
        if (subscription?.subscriptionTier) {
          setSubscriptionTier(subscription.subscriptionTier);
        }
      } catch (error) {
        // Failed to load subscription - continue without it
      } finally {
        setLoadingSubscription(false);
      }
    };
    loadSubscription();
  }, []);

  useEffect(() => {
    if (account && !formPopulatedRef.current) {
      // Populate form when account data is available (only once)
      const template =
        account.sms_template ||
        form.values.smsTemplate ||
        `You recently had _________________ for work. We'd greatly appreciate a review on one or all of the following links: `;
      const templateWithName = template.replace(/{businessName}/g, '_________________');

      const reviewLinks = account.review_links || [];
      if (reviewLinks.length === 0) reviewLinks.push({ name: '', url: '' });

      form.setValues({
        businessName: account.business_name || '',
        reviewLinks,
        smsTemplate: templateWithName,
        includeNameInSms: account.include_name_in_sms !== false, // Default to true
        includeJobInSms: account.include_job_in_sms !== false, // Default to true
      });
      formPopulatedRef.current = true;
    } else if (!account) {
      // Reset flag if account is cleared
      formPopulatedRef.current = false;
    }
  }, [account]);

  // Update template when business name changes
  useEffect(() => {
    if (form.values.businessName && form.values.smsTemplate) {
      // If template contains the old business name or placeholder, update it
      const currentTemplate = form.values.smsTemplate;
      const hasPlaceholder = currentTemplate.includes('{businessName}');
      const hasOldName = account?.business_name && currentTemplate.includes(account.business_name);

      if (hasPlaceholder || (hasOldName && account?.business_name !== form.values.businessName)) {
        const updatedTemplate = currentTemplate
          .replace(/{businessName}/g, '_________________')
          .replace(new RegExp(account?.business_name || '', 'g'), '_________________');
        form.setFieldValue('smsTemplate', updatedTemplate);
      }
    } else if (form.values.businessName && !form.values.smsTemplate) {
      // If no template exists, create a default one with placeholder
      const defaultTemplate = `You recently had _________________ for work. We'd greatly appreciate a review on one or all of the following links: `;
      form.setFieldValue('smsTemplate', defaultTemplate);
    }
  }, [form.values.businessName]);

  const handleSubmit = async (values: typeof form.values) => {
    // Validate review links before submission
    const filledLinks = values.reviewLinks.filter(
      (link) => link.name.trim() !== '' || link.url.trim() !== ''
    );

    // Check that at least one review link is FULLY completed (both name and URL)
    const fullyCompletedLinks = values.reviewLinks.filter(
      (link) => link.name.trim() !== '' && link.url.trim() !== ''
    );

    if (fullyCompletedLinks.length === 0) {
      notifications.show({
        title: 'Validation Error',
        message: 'At least one review link must be fully completed (both name and URL)',
        color: 'red',
      });
      setLoading(false);
      return;
    }

    // Check if any filled links have invalid URLs
    for (const link of filledLinks) {
      if (link.name.trim() && link.url.trim() && !isValidUrl(link.url)) {
        const index = values.reviewLinks.indexOf(link);
        form.setFieldError(
          `reviewLinks.${index}.url`,
          'Invalid URL format. Please include http:// or https://'
        );
        notifications.show({
          title: 'Validation Error',
          message: 'Please fix invalid URLs before saving',
          color: 'red',
        });
        setLoading(false);
        return;
      }
      if (link.url.trim() && !link.name.trim()) {
        const index = values.reviewLinks.indexOf(link);
        form.setFieldError(
          `reviewLinks.${index}.name`,
          'Link name is required when URL is provided'
        );
        notifications.show({
          title: 'Validation Error',
          message: 'Please provide a name for all review links',
          color: 'red',
        });
        setLoading(false);
        return;
      }
    }

    // Validate before submitting
    if (!checklist.allValid) {
      return;
    }
    setLoading(true);

    // Development mode: just show success message
    const isDevMode =
      !import.meta.env.VITE_SUPABASE_URL ||
      import.meta.env.VITE_SUPABASE_URL?.includes('placeholder') ||
      !import.meta.env.VITE_SUPABASE_ANON_KEY ||
      import.meta.env.VITE_SUPABASE_ANON_KEY === 'placeholder_key';

    if (isDevMode) {
      // In dev mode, just update local state and show success
      // Replace _________________ and business name in template with {businessName} placeholder before saving
      let templateForSave = values.smsTemplate.replace(/_{10,}/g, '{businessName}');
      if (values.businessName) {
        templateForSave = templateForSave.replace(
          new RegExp(values.businessName, 'g'),
          '{businessName}'
        );
      }

      notifications.show({
        title: 'Success (Demo Mode)',
        message: 'Account settings saved (demo mode - not persisted)',
        color: 'green',
      });
      setLoading(false);
      return;
    }

    try {
      // Replace _________________ and business name in template with {businessName} placeholder before saving
      // This allows the backend to replace it with the actual name when sending SMS
      let templateForSave = values.smsTemplate.replace(/_{10,}/g, '{businessName}');
      if (values.businessName) {
        templateForSave = templateForSave.replace(
          new RegExp(values.businessName, 'g'),
          '{businessName}'
        );
      }

      // Filter out empty links and ensure URLs are valid
      const filteredLinks = values.reviewLinks
        .filter((link) => link.name.trim() !== '' && link.url.trim() !== '')
        .map((link) => {
          // Ensure URL starts with http:// or https://
          let url = link.url.trim();
          if (url && !url.match(/^https?:\/\//i)) {
            url = `https://${url}`;
          }
          return {
            name: link.name.trim(),
            url: url,
          };
        });

      await apiClient.updateAccount({
        business_name: values.businessName,
        review_links: filteredLinks,
        sms_template: templateForSave,
        include_name_in_sms: values.includeNameInSms,
        include_job_in_sms: values.includeJobInSms,
      });

      // Refetch account data to update the context
      await refetch();
      await refreshSetup();

      // Show progress modal if setup not complete
      if (progress && !progress.isComplete) {
        setShowProgressModal(true);
      } else {
        notifications.show({
          title: 'Success',
          message: 'Account settings saved',
          color: 'green',
        });
      }
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to save account',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <Stack gap="lg" className="lg:flex-1">
        <div className="mb-8">
          <Title order={2} className="text-2xl sm:text-3xl font-bold mb-2 text-white">
            SMS Setup
          </Title>
          <p className="text-sm text-gray-400">Manage your business information and SMS template</p>
        </div>

        {/* Account Error Alert */}
        <AccountErrorAlert />

        {/* SMS Usage Display */}
        {loadingSubscription || paymentLoading ? (
          <div className="mb-6 p-4 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
            <Skeleton height={20} width={100} className="mb-3" />
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Skeleton height={16} width={80} />
                  <Skeleton height={16} width={60} />
                </div>
                <Skeleton height={8} radius="xl" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Skeleton height={16} width={60} />
                  <Skeleton height={16} width={80} />
                </div>
                <Skeleton height={12} width={200} />
              </div>
            </div>
          </div>
        ) : (
          account &&
          (account.sms_sent_this_month !== undefined || account.sms_sent_total !== undefined) && (
            <div className="mb-6 p-4 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
              <Text size="sm" className="text-gray-400 mb-3 font-medium">
                SMS Usage
              </Text>
              <div className="flex flex-col sm:flex-col gap-4">
                {/* Monthly Usage */}
                {subscriptionTier && account.sms_sent_this_month !== undefined && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Text size="sm" className="text-gray-400">
                        This Month
                      </Text>
                      <Text size="sm" className="font-semibold text-white">
                        {account.sms_sent_this_month} / {getSmsLimitFromTier(subscriptionTier)}
                      </Text>
                    </div>
                    {(() => {
                      const limit = getSmsLimitFromTier(subscriptionTier);
                      const percentage =
                        limit > 0 ? (account.sms_sent_this_month / limit) * 100 : 0;
                      const isWarning = percentage >= 80;
                      const isDanger = percentage >= 100;

                      return (
                        <div className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              isDanger ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-teal-500'
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      );
                    })()}
                  </div>
                )}
                {/* Total Usage */}
                {account.sms_sent_total !== undefined && (
                  <div>
                    <div className="flex items-center justify-between lg:justify-start lg:gap-2 mb-2">
                      <Text size="sm" className="text-gray-400">
                        All Time
                      </Text>
                      <Text size="sm" className="font-semibold text-white">
                        {account.sms_sent_total.toLocaleString()} sent
                      </Text>
                    </div>
                    <Text size="xs" className="text-gray-500">
                      Total SMS messages sent since account creation
                    </Text>
                  </div>
                )}
              </div>
            </div>
          )
        )}

        {!paymentLoading && !hasPaid && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Payment Required"
            color="yellow"
            className="mb-6 relative"
          >
            <div className="flex flex-col gap-3 pb-10">
              <Text size="sm" className="text-gray-300">
                You can set up your account and manage your information, but you need to set up
                payment to send SMS messages.
              </Text>
            </div>
            <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-4">
              <Button
                component={Link}
                to="/billing"
                size="sm"
                color="teal"
                className="font-semibold !px-3 !py-1 !h-auto !text-xs"
              >
                Set up payment
              </Button>
            </div>
          </Alert>
        )}

        {isLoading ? (
          <PageSkeleton variant="form" />
        ) : (
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="lg">
              <TextInput
                label="Business Name"
                placeholder="your business name"
                required
                disabled={accountLoading}
                {...form.getInputProps('businessName')}
              />

              {/* Review Links */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Review Links <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-400 mb-3">
                  Enter the full URL for each review link (e.g., https://g.page/r/ABC123XYZ/review).
                  You can add up to 5 links. At least one complete link (name and URL) is required.
                </p>
                <Stack gap="sm">
                  {form.values.reviewLinks.map((link, index) => (
                    <div
                      key={index}
                      className="border border-[#2a2a2a] rounded-md p-3 bg-[#141414]"
                    >
                      <div className="flex flex-col gap-3">
                        <Group gap="xs" align="flex-start" wrap="nowrap" className="w-full">
                          <div className="flex-1">
                            <label className="block text-xs text-gray-400 mb-1">
                              Site name (e.g., Google, Yelp)
                            </label>
                            <TextInput
                              placeholder="Google"
                              value={link.name}
                              onChange={(e) => {
                                const newLinks = [...form.values.reviewLinks];
                                newLinks[index] = { ...newLinks[index], name: e.target.value };
                                form.setFieldValue('reviewLinks', newLinks);
                                // Clear error when user types
                                form.clearFieldError(`reviewLinks.${index}.name`);
                              }}
                              error={form.errors[`reviewLinks.${index}.name`]}
                              className="w-full"
                              styles={{
                                input: {
                                  fontSize: '0.875rem',
                                },
                              }}
                            />
                          </div>
                          {form.values.reviewLinks.length > 1 && (
                            <Button
                              type="button"
                              variant="subtle"
                              color="red"
                              size="sm"
                              onClick={() => {
                                const newLinks = form.values.reviewLinks.filter(
                                  (_, i) => i !== index
                                );
                                form.setFieldValue('reviewLinks', newLinks);
                              }}
                              className="flex-shrink-0 mt-6"
                            >
                              <IconX size={18} />
                            </Button>
                          )}
                        </Group>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">
                            Link to {link.name || 'review site'} (full URL)
                          </label>
                          <Textarea
                            placeholder="https://g.page/r/ABC123XYZ/review"
                            value={link.url}
                            onChange={(e) => {
                              const newLinks = [...form.values.reviewLinks];
                              newLinks[index] = { ...newLinks[index], url: e.target.value };
                              form.setFieldValue('reviewLinks', newLinks);
                              // Clear error when user types
                              form.clearFieldError(`reviewLinks.${index}.url`);
                            }}
                            error={form.errors[`reviewLinks.${index}.url`]}
                            className="w-full"
                            autosize
                            minRows={1}
                            maxRows={4}
                            styles={{
                              input: {
                                fontSize: '0.875rem',
                                lineHeight: '1.5',
                                padding: '0.5rem 0.75rem',
                              },
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {form.values.reviewLinks.length < 5 && (
                    <Button
                      type="button"
                      variant="light"
                      size="sm"
                      leftSection={<IconPlus size={18} />}
                      onClick={() => {
                        form.setFieldValue('reviewLinks', [
                          ...form.values.reviewLinks,
                          { name: '', url: '' },
                        ]);
                      }}
                      className="self-end"
                    >
                      Add Review Link
                    </Button>
                  )}
                </Stack>
              </div>

              <Textarea
                label="SMS Template"
                placeholder="SMS message template (minimum 50 characters)"
                rows={4}
                maxLength={400}
                {...form.getInputProps('smsTemplate')}
                description={`${form.values.smsTemplate.length}/400 characters (minimum 50)`}
              />

              {/* SMS Personalization Options */}
              <div className="space-y-3 p-4 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
                <Text size="sm" className="font-medium text-gray-200 mb-2">
                  {personalizationSpelling} Options
                </Text>
                <Checkbox
                  label={
                    <div>
                      <div>Include customer name in SMS</div>
                      <div className="text-xs text-gray-400">(e.g., 'Hi John,')</div>
                    </div>
                  }
                  {...form.getInputProps('includeNameInSms', { type: 'checkbox' })}
                  classNames={{
                    label: 'text-gray-300 text-sm',
                  }}
                />
                <Checkbox
                  label={
                    <div>
                      <div>Include job description in SMS</div>
                      <div className="text-xs text-gray-400">(e.g., 'Job: Kitchen renovation')</div>
                    </div>
                  }
                  {...form.getInputProps('includeJobInSms', { type: 'checkbox' })}
                  classNames={{
                    label: 'text-gray-300 text-sm',
                  }}
                />
              </div>

              {/* SMS Preview */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-200 mb-3">SMS Preview</label>
                <div className="bg-gray-100 rounded-2xl p-4 max-w-sm mx-auto shadow-lg">
                  {/* Phone header */}
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-300">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-sm font-semibold">
                        {form.values.businessName
                          ? form.values.businessName.charAt(0).toUpperCase()
                          : 'B'}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {form.values.businessName || 'Your Business'}
                        </div>
                        <div className="text-xs text-gray-500">Now</div>
                      </div>
                    </div>
                  </div>

                  {/* Message bubble */}
                  <div className="bg-blue-500 rounded-2xl px-4 py-3 shadow-sm">
                    <div className="text-white text-sm leading-relaxed break-words">
                      {(() => {
                        let message = form.values.smsTemplate || '';

                        // Split message into parts for rendering
                        const parts: (
                          | string
                          | { type: 'link'; label: string; url: string }
                          | { type: 'regulatory'; text: string }
                        )[] = [];

                        // Add customer name if enabled
                        if (form.values.includeNameInSms) {
                          parts.push('Hi [Customer Name],\n\n');
                        }

                        // Add template text as-is (no replacements)
                        if (message.trim()) {
                          parts.push(message.trim());
                        }

                        // Add job description if enabled
                        if (form.values.includeJobInSms) {
                          parts.push('\n\nJob: [Job Description]');
                        }

                        // Add review links
                        const links: { type: 'link'; label: string; url: string }[] = [];
                        form.values.reviewLinks
                          .filter((link) => link.url.trim() !== '')
                          .forEach((link) => {
                            // Use the custom name if provided, otherwise try to detect from URL
                            let label = link.name.trim() || 'Review Link';
                            if (!label || label === 'Review Link') {
                              if (link.url.includes('google') || link.url.includes('g.page')) {
                                label = 'Google';
                              } else if (link.url.includes('facebook')) {
                                label = 'Facebook';
                              } else if (link.url.includes('yelp')) {
                                label = 'Yelp';
                              } else if (link.url.includes('tripadvisor')) {
                                label = 'TripAdvisor';
                              }
                            }
                            links.push({ type: 'link', label, url: link.url });
                          });

                        if (links.length > 0) {
                          parts.push('\n\n');
                          links.forEach((link, index) => {
                            // Add label on its own line
                            parts.push(link.label);
                            parts.push('\n');
                            // Add URL on its own line
                            parts.push(link);
                            if (index < links.length - 1) {
                              parts.push('\n\n');
                            }
                          });
                        }

                        // Add business name at the end if it exists
                        if (form.values.businessName && form.values.businessName.trim()) {
                          parts.push('\n\n');
                          parts.push(`- ${form.values.businessName.trim()}`);
                        }

                        // Add regulatory compliance text for US/CA only (required by Twilio A2P 10DLC)
                        if (userCountry === 'US' || userCountry === 'CA') {
                          parts.push('\n\n');
                          parts.push({
                            type: 'regulatory',
                            text: 'Msg&data rates may apply. Reply STOP to opt out, HELP for help.',
                          });
                        }

                        if (parts.length === 0) {
                          return (
                            <span className="opacity-70">
                              Enter your SMS template above to see a preview...
                            </span>
                          );
                        }

                        return (
                          <div className="whitespace-pre-wrap break-words leading-tight">
                            {parts.map((part, index) => {
                              if (typeof part === 'string') {
                                return (
                                  <span key={index} className="break-words">
                                    {part}
                                  </span>
                                );
                              } else if (part.type === 'link') {
                                return (
                                  <span key={index} className="break-words">
                                    <a
                                      href={part.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="underline decoration-2 underline-offset-2 hover:opacity-80 transition-opacity break-all"
                                    >
                                      {part.url}
                                    </a>
                                  </span>
                                );
                              } else if (part.type === 'regulatory') {
                                // Regulatory text - same size and color as regular message
                                return (
                                  <span key={index} className="break-words">
                                    {part.text}
                                  </span>
                                );
                              }
                              return null;
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Link styling hint */}
                  {form.values.reviewLinks.some((link) => link.url.trim() !== '') && (
                    <div className="mt-2 text-xs text-gray-500 text-center">
                      Links will be clickable in the actual SMS
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-[#2a2a2a] mt-8">
                <div className="flex flex-col sm:items-end gap-4">
                  {/* Checklist */}
                  <div>
                    <Stack gap="xs">
                      <div className="flex items-center gap-2">
                        {checklist.businessName ? (
                          <IconCheck size={16} className="text-teal-400" />
                        ) : (
                          <IconXCircle size={16} className="text-gray-600" />
                        )}
                        <span
                          className={`text-xs ${checklist.businessName ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                          Business name
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {checklist.reviewLinks ? (
                          <IconCheck size={16} className="text-teal-400" />
                        ) : (
                          <IconXCircle size={16} className="text-gray-600" />
                        )}
                        <span
                          className={`text-xs ${checklist.reviewLinks ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                          At least 1 review link (name and URL)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {checklist.smsTemplate ? (
                          <IconCheck size={16} className="text-teal-400" />
                        ) : (
                          <IconXCircle size={16} className="text-gray-600" />
                        )}
                        <span
                          className={`text-xs ${checklist.smsTemplate ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                          SMS template (at least 5 characters)
                        </span>
                      </div>
                    </Stack>
                  </div>
                  <div>
                    <Group gap="xs">
                      {progress && !progress.isComplete && (
                        <Button
                          variant="light"
                          color="blue"
                          leftSection={<IconHome size={16} />}
                          onClick={() => navigate('/dashboard')}
                          size="md"
                          className="w-full sm:w-auto"
                        >
                          Back to Dashboard
                        </Button>
                      )}
                      <Button
                        type="submit"
                        loading={loading}
                        disabled={!checklist.allValid}
                        size="md"
                        className="w-full sm:w-auto font-semibold px-8"
                      >
                        Save Settings
                      </Button>
                    </Group>
                  </div>
                </div>
              </div>
            </Stack>
          </form>
        )}

        {/* Setup Progress Modal */}
        {progress && (
          <SetupProgressModal
            opened={showProgressModal}
            onClose={() => setShowProgressModal(false)}
            completedSteps={progress.completedCount}
            totalSteps={progress.totalCount}
            nextStepLabel="Add Your First Customer"
            nextStepPath="/customers/add"
          />
        )}
      </Stack>
    </PageContainer>
  );
};
