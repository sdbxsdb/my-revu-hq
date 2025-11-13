import { useState, useEffect, useRef } from 'react';
import { useForm } from '@mantine/form';
import { useNavigate } from 'react-router-dom';
import { Button, TextInput, Textarea, Paper, Title, Stack, Alert, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { CountryCode } from 'libphonenumber-js';
import { apiClient } from '@/lib/api';
import { PhoneNumber } from '@/components/PhoneNumber';
import { validatePhoneNumber, formatPhoneNumberForApi } from '@/lib/phone-validation';
import { usePayment } from '@/contexts/PaymentContext';
import { IconAlertCircle } from '@tabler/icons-react';

export const AddCustomer = () => {
  const { hasPaid } = usePayment();
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode | undefined>('GB'); // Default to GB, can be updated from account
  const countryRef = useRef<CountryCode | undefined>('GB');
  const navigate = useNavigate();

  // Load user account to get default country/region (for now defaulting to GB)
  useEffect(() => {
    const loadAccount = async () => {
      try {
        await apiClient.getAccount();
        // TODO: When account has a region/country field, use it here
        // For now, default to GB
        // setSelectedCountry(account.region || 'GB');
      } catch (error) {
        // If account load fails, keep default (GB)
      }
    };
    loadAccount();
  }, []);

  const form = useForm({
    initialValues: {
      name: '',
      phoneNumber: '' as string | undefined,
      jobDescription: '',
    },
    validate: {
      name: (value) => (value.trim().length < 2 ? 'Name must be at least 2 characters' : null),
      phoneNumber: (value) => {
        // Use the current country from ref to avoid stale closure
        const validation = validatePhoneNumber(
          value,
          countryRef.current as CountryCode | undefined
        );
        if (!validation.isValid) {
          return validation.error || 'Invalid phone number';
        }
        return null;
      },
    },
  });

  const handleSendNow = async (values: typeof form.values) => {
    if (!hasPaid) {
      notifications.show({
        title: 'Payment Required',
        message: 'Please set up your payment method to send SMS messages.',
        color: 'yellow',
      });
      return;
    }

    setLoading(true);
    setPhoneError(null);

    try {
      // Validate phone number with country context
      const validation = validatePhoneNumber(
        values.phoneNumber,
        selectedCountry as CountryCode | undefined
      );
      if (!validation.isValid) {
        setPhoneError(validation.error || 'Invalid phone number');
        setLoading(false);
        return;
      }

      // Format phone for API (E.164 format for Twilio)
      const phoneForApi = formatPhoneNumberForApi(
        values.phoneNumber,
        selectedCountry as CountryCode | undefined
      );
      if (!phoneForApi) {
        setPhoneError('Invalid phone number format');
        setLoading(false);
        return;
      }

      const customer = await apiClient.createCustomer({
        name: values.name,
        phone: {
          countryCode: phoneForApi.countryCode,
          // Country is auto-detected from the number (not stored in DB)
          number: phoneForApi.number, // E.164 format: +447780587666
        },
        jobDescription: values.jobDescription || undefined,
      });

      await apiClient.sendSMS(customer.id);

      notifications.show({
        title: 'Success',
        message: 'Customer added and SMS sent',
        color: 'green',
      });

      form.reset();
      navigate('/customers');
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to add customer',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendLater = async (values: typeof form.values) => {
    setLoading(true);
    setPhoneError(null);

    try {
      // Validate phone number with country context
      const validation = validatePhoneNumber(
        values.phoneNumber,
        selectedCountry as CountryCode | undefined
      );
      if (!validation.isValid) {
        setPhoneError(validation.error || 'Invalid phone number');
        setLoading(false);
        return;
      }

      // Format phone for API (E.164 format for Twilio)
      const phoneForApi = formatPhoneNumberForApi(
        values.phoneNumber,
        selectedCountry as CountryCode | undefined
      );
      if (!phoneForApi) {
        setPhoneError('Invalid phone number format');
        setLoading(false);
        return;
      }

      await apiClient.createCustomer({
        name: values.name,
        phone: {
          countryCode: phoneForApi.countryCode,
          number: phoneForApi.number, // E.164 format: +447780587666
        },
        jobDescription: values.jobDescription || undefined,
      });

      notifications.show({
        title: 'Success',
        message: 'Customer added (pending SMS)',
        color: 'green',
      });

      form.reset();
      navigate('/customers');
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to add customer',
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
          Add Customer
        </Title>
        <p className="text-sm text-gray-400">Add a new customer and send them a review request</p>
      </div>

      {!hasPaid && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Payment Required to Send Messages"
          color="yellow"
          className="mb-6"
        >
          <Text size="sm" className="text-gray-300">
            You can add customers, but you need to set up payment to send SMS messages.
            <Button
              component="a"
              href="/billing"
              variant="subtle"
              size="xs"
              color="teal"
              className="ml-2"
            >
              Set up payment
            </Button>
          </Text>
        </Alert>
      )}

      <form onSubmit={form.onSubmit(() => {})}>
        <Stack gap="lg">
          <TextInput
            label="Name"
            placeholder="Customer Name"
            required
            {...form.getInputProps('name')}
          />

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Phone Number <span className="text-red-400">*</span>
            </label>
            <PhoneNumber
              value={form.values.phoneNumber}
              onChange={(value) => {
                form.setFieldValue('phoneNumber', value);
                // Validate immediately when typing - use current country from ref
                const validation = validatePhoneNumber(
                  value,
                  countryRef.current as CountryCode | undefined
                );
                if (!validation.isValid) {
                  setPhoneError(validation.error || 'Invalid phone number');
                  form.setFieldError('phoneNumber', validation.error || 'Invalid phone number');
                } else {
                  setPhoneError(null);
                  form.setFieldError('phoneNumber', null);
                }
                form.validateField('phoneNumber');
              }}
              onCountryChange={(country) => {
                // Update country in both state and ref FIRST
                setSelectedCountry(country);
                countryRef.current = country;

                // Always validate when country changes if there's a phone number
                if (country && form.values.phoneNumber) {
                  // Re-validate the existing number with the new country immediately
                  const validation = validatePhoneNumber(
                    form.values.phoneNumber,
                    country as CountryCode | undefined
                  );
                  if (!validation.isValid) {
                    setPhoneError(validation.error || 'Invalid phone number');
                    // Also set form error
                    form.setFieldError('phoneNumber', validation.error || 'Invalid phone number');
                  } else {
                    // Clear error if number is valid for the new country
                    setPhoneError(null);
                    form.setFieldError('phoneNumber', null);
                  }
                  // Force re-validation to ensure form state is updated with new country
                  setTimeout(() => {
                    form.validateField('phoneNumber');
                  }, 0);
                } else if (country) {
                  // New country selected but no phone number - clear any errors
                  setPhoneError(null);
                  form.setFieldError('phoneNumber', null);
                } else {
                  // No country selected - clear errors
                  setPhoneError(null);
                  form.setFieldError('phoneNumber', null);
                }
              }}
              error={phoneError}
              defaultCountry="GB"
            />
          </div>

          <Textarea
            label="Job Description (Optional)"
            placeholder="Brief description of the work done"
            rows={3}
            {...form.getInputProps('jobDescription')}
          />

          <div className="flex flex-col gap-3 mt-8 pt-6 border-t border-[#2a2a2a]">
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                form.onSubmit(handleSendNow)();
              }}
              loading={loading}
              size="md"
              className="w-full font-semibold"
              fullWidth
            >
              Send Review Now
            </Button>
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                form.onSubmit(handleSendLater)();
              }}
              loading={loading}
              variant="light"
              size="md"
              className="w-full font-semibold"
              fullWidth
            >
              Send Later
            </Button>
          </div>
        </Stack>
      </form>
    </Paper>
  );
};
