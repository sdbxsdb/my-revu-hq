import { useEffect, useState } from 'react';
import { useForm } from '@mantine/form';
import { Button, TextInput, Textarea, Paper, Title, Stack, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconX } from '@tabler/icons-react';
import { apiClient } from '@/lib/api';
import type { User } from '@/types';

export const AccountSetup = () => {
  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState<User | null>(null);

  const form = useForm({
    initialValues: {
      businessName: '',
      reviewLinks: [''] as string[],
      smsTemplate: '',
    },
  });

  useEffect(() => {
    loadAccount();
  }, []);

  // Update template when business name changes
  useEffect(() => {
    if (form.values.businessName && form.values.smsTemplate) {
      // If template contains the old business name or placeholder, update it
      const currentTemplate = form.values.smsTemplate;
      const hasPlaceholder = currentTemplate.includes('{businessName}');
      const hasOldName = account?.business_name && currentTemplate.includes(account.business_name);

      if (hasPlaceholder || (hasOldName && account?.business_name !== form.values.businessName)) {
        const updatedTemplate = currentTemplate
          .replace(/{businessName}/g, form.values.businessName)
          .replace(new RegExp(account?.business_name || '', 'g'), form.values.businessName);
        form.setFieldValue('smsTemplate', updatedTemplate);
      }
    } else if (form.values.businessName && !form.values.smsTemplate) {
      // If no template exists, create a default one with the business name
      const defaultTemplate = `You recently had ${form.values.businessName} for work. We'd greatly appreciate a review on one or all of the following links: `;
      form.setFieldValue('smsTemplate', defaultTemplate);
    }
  }, [form.values.businessName]);

  const loadAccount = async () => {
    // Development mode: show dummy data immediately
    const isDevMode =
      !import.meta.env.VITE_SUPABASE_URL ||
      import.meta.env.VITE_SUPABASE_URL?.includes('placeholder') ||
      !import.meta.env.VITE_SUPABASE_ANON_KEY ||
      import.meta.env.VITE_SUPABASE_ANON_KEY === 'placeholder_key';

    if (isDevMode) {
      // Show dummy data immediately in dev mode
      const dummyAccount: User = {
        id: 'dev-user',
        email: 'dev@example.com',
        business_name: 'Smith Construction Co.',
        google_review_link: 'https://g.page/r/ABC123XYZ/review',
        facebook_review_link: 'https://www.facebook.com/smithconstruction/reviews',
        other_review_link: 'https://www.yelp.com/biz/smith-construction',
        sms_template: form.values.smsTemplate,
        sms_sent_this_month: 45,
      };
      setAccount(dummyAccount);
      // Replace {businessName} placeholder with actual business name in template
      const template =
        dummyAccount.sms_template ||
        form.values.smsTemplate ||
        `You recently had ${dummyAccount.business_name || '{businessName}'} for work. We'd greatly appreciate a review on one or all of the following links: `;
      const templateWithName = template.replace(
        /{businessName}/g,
        dummyAccount.business_name || ''
      );

      // Convert old format to new array format
      const reviewLinks: string[] = [];
      if (dummyAccount.google_review_link) reviewLinks.push(dummyAccount.google_review_link);
      if (dummyAccount.facebook_review_link) reviewLinks.push(dummyAccount.facebook_review_link);
      if (dummyAccount.other_review_link) reviewLinks.push(dummyAccount.other_review_link);
      // Ensure at least one empty field
      if (reviewLinks.length === 0) reviewLinks.push('');

      form.setValues({
        businessName: dummyAccount.business_name || '',
        reviewLinks,
        smsTemplate: templateWithName,
      });
      return;
    }

    try {
      const data = await apiClient.getAccount();
      setAccount(data);
      // Replace {businessName} placeholder with actual business name in template
      const template =
        data.sms_template ||
        form.values.smsTemplate ||
        `You recently had ${data.business_name || '{businessName}'} for work. We'd greatly appreciate a review on one or all of the following links: `;
      const templateWithName = template.replace(/{businessName}/g, data.business_name || '');

      // Convert old format to new array format
      const reviewLinks: string[] = [];
      if (data.google_review_link) reviewLinks.push(data.google_review_link);
      if (data.facebook_review_link) reviewLinks.push(data.facebook_review_link);
      if (data.other_review_link) reviewLinks.push(data.other_review_link);
      // Ensure at least one empty field
      if (reviewLinks.length === 0) reviewLinks.push('');

      form.setValues({
        businessName: data.business_name || '',
        reviewLinks,
        smsTemplate: templateWithName,
      });
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to load account',
        color: 'red',
      });
    }
  };

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);

    // Development mode: just show success message
    const isDevMode =
      !import.meta.env.VITE_SUPABASE_URL ||
      import.meta.env.VITE_SUPABASE_URL?.includes('placeholder') ||
      !import.meta.env.VITE_SUPABASE_ANON_KEY ||
      import.meta.env.VITE_SUPABASE_ANON_KEY === 'placeholder_key';

    if (isDevMode) {
      // In dev mode, just update local state and show success
      // Replace business name in template with {businessName} placeholder before saving
      const templateForSave = values.smsTemplate.replace(
        new RegExp(values.businessName || '', 'g'),
        '{businessName}'
      );

      // Convert array format back to old format for backend compatibility
      const filteredLinks = values.reviewLinks.filter((link) => link.trim() !== '');
      const updatedAccount: User = {
        ...account!,
        business_name: values.businessName,
        google_review_link: filteredLinks[0] || '',
        facebook_review_link: filteredLinks[1] || '',
        other_review_link: filteredLinks[2] || '',
        sms_template: templateForSave,
      };
      setAccount(updatedAccount);
      notifications.show({
        title: 'Success (Demo Mode)',
        message: 'Account settings saved (demo mode - not persisted)',
        color: 'green',
      });
      setLoading(false);
      return;
    }

    try {
      // Replace business name in template with {businessName} placeholder before saving
      // This allows the backend to replace it with the actual name when sending SMS
      const templateForSave = values.businessName
        ? values.smsTemplate.replace(new RegExp(values.businessName, 'g'), '{businessName}')
        : values.smsTemplate;

      // Convert array format back to old format for backend compatibility
      const filteredLinks = values.reviewLinks.filter((link) => link.trim() !== '');
      await apiClient.updateAccount({
        business_name: values.businessName,
        google_review_link: filteredLinks[0] || '',
        facebook_review_link: filteredLinks[1] || '',
        other_review_link: filteredLinks[2] || '',
        sms_template: templateForSave,
      });
      notifications.show({
        title: 'Success',
        message: 'Account settings saved',
        color: 'green',
      });
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
    <Paper shadow="md" p="md" className="w-full max-w-2xl mx-auto sm:p-xl">
      <div className="mb-8">
        <Title order={2} className="text-2xl sm:text-3xl font-bold mb-2 text-white">
          Account Settings
        </Title>
        <p className="text-sm text-gray-400">Manage your business information and SMS template</p>
      </div>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="lg">
          <TextInput
            label="Business Name"
            placeholder="Your Business Name"
            {...form.getInputProps('businessName')}
          />

          {/* Review Links */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Review Links</label>
            <p className="text-xs text-gray-400 mb-3">
              Enter the full URL for each review link (e.g., https://g.page/r/ABC123XYZ/review). You
              can add up to 5 links.
            </p>
            <Stack gap="sm">
              {form.values.reviewLinks.map((link, index) => (
                <Group key={index} gap="xs" align="flex-start" wrap="nowrap">
                  <Textarea
                    placeholder="https://..."
                    value={link}
                    onChange={(e) => {
                      const newLinks = [...form.values.reviewLinks];
                      newLinks[index] = e.target.value;
                      form.setFieldValue('reviewLinks', newLinks);
                    }}
                    className="flex-1"
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
                  {form.values.reviewLinks.length > 1 && (
                    <Button
                      type="button"
                      variant="subtle"
                      color="red"
                      size="sm"
                      onClick={() => {
                        const newLinks = form.values.reviewLinks.filter((_, i) => i !== index);
                        form.setFieldValue('reviewLinks', newLinks);
                      }}
                      className="mt-0.5 flex-shrink-0"
                    >
                      <IconX size={18} />
                    </Button>
                  )}
                </Group>
              ))}
              {form.values.reviewLinks.length < 5 && (
                <Button
                  type="button"
                  variant="light"
                  size="sm"
                  leftSection={<IconPlus size={18} />}
                  onClick={() => {
                    form.setFieldValue('reviewLinks', [...form.values.reviewLinks, '']);
                  }}
                  className="self-start"
                >
                  Add Review Link
                </Button>
              )}
            </Stack>
          </div>

          <Textarea
            label="SMS Template"
            placeholder="SMS message template"
            rows={4}
            {...form.getInputProps('smsTemplate')}
          />

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
                    // Replace {businessName} placeholder
                    message = message.replace(
                      /{businessName}/g,
                      form.values.businessName || 'Your Business'
                    );

                    // Split message into parts for rendering
                    const parts: (string | { type: 'link'; label: string; url: string })[] = [];

                    // Add template text
                    if (message.trim()) {
                      parts.push(message.trim());
                    }

                    // Add sample job description
                    if (message.trim()) {
                      parts.push('\n\nJob: Kitchen renovation - new cabinets and countertops');
                    }

                    // Add review links
                    const links: { type: 'link'; label: string; url: string }[] = [];
                    form.values.reviewLinks
                      .filter((link) => link.trim() !== '')
                      .forEach((url, index) => {
                        // Try to determine label from URL
                        let label = 'Review Link';
                        if (url.includes('google') || url.includes('g.page')) {
                          label = 'Google';
                        } else if (url.includes('facebook')) {
                          label = 'Facebook';
                        } else if (url.includes('yelp')) {
                          label = 'Yelp';
                        } else if (url.includes('tripadvisor')) {
                          label = 'TripAdvisor';
                        } else {
                          label = `Link ${index + 1}`;
                        }
                        links.push({ type: 'link', label, url });
                      });

                    if (links.length > 0) {
                      parts.push('\n\n');
                      links.forEach((link, index) => {
                        parts.push(link);
                        if (index < links.length - 1) {
                          parts.push('\n\n');
                        }
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
                      <div className="whitespace-pre-wrap break-words">
                        {parts.map((part, index) => {
                          if (typeof part === 'string') {
                            return (
                              <span key={index} className="break-words">
                                {part}
                              </span>
                            );
                          } else {
                            return (
                              <span key={index} className="break-words">
                                <a
                                  href={part.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline decoration-2 underline-offset-2 hover:opacity-80 transition-opacity break-all"
                                >
                                  {part.label}: {part.url}
                                </a>
                              </span>
                            );
                          }
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Link styling hint */}
              {form.values.reviewLinks.some((link) => link.trim() !== '') && (
                <div className="mt-2 text-xs text-gray-500 text-center">
                  Links will be clickable in the actual SMS
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-[#2a2a2a] mt-8">
            <Button
              type="submit"
              loading={loading}
              size="md"
              className="w-full sm:w-auto font-semibold px-8"
            >
              Save Settings
            </Button>
          </div>
        </Stack>
      </form>
    </Paper>
  );
};
