import { useState, useRef } from 'react';
import { useForm } from '@mantine/form';
import { useNavigate, Link } from 'react-router-dom';
import {
  Button,
  TextInput,
  Textarea,
  Paper,
  Title,
  Stack,
  Alert,
  Text,
  Tooltip,
  Container,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { CountryCode } from 'libphonenumber-js';
import { apiClient } from '@/lib/api';
import { PhoneNumber } from '@/components/PhoneNumber';
import { validatePhoneNumber, formatPhoneNumberForApi } from '@/lib/phone-validation';
import { usePayment } from '@/contexts/PaymentContext';
import { AccountErrorAlert } from '@/components/AccountErrorAlert';
import { IconAlertCircle } from '@tabler/icons-react';

export const AddCustomer = () => {
  const { hasPaid, loading: paymentLoading } = usePayment();
  const [loadingSendNow, setLoadingSendNow] = useState(false);
  const [loadingSendLater, setLoadingSendLater] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode | undefined>('GB'); // Default to GB, can be updated from account
  const countryRef = useRef<CountryCode | undefined>('GB');
  const navigate = useNavigate();

  // TODO: When account has a region/country field, use it here
  // For now, default to GB (no need to fetch account just for this)

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

    setLoadingSendNow(true);
    setPhoneError(null);

    try {
      // Validate phone number with country context
      const validation = validatePhoneNumber(
        values.phoneNumber,
        selectedCountry as CountryCode | undefined
      );
      if (!validation.isValid) {
        setPhoneError(validation.error || 'Invalid phone number');
        setLoadingSendNow(false);
        return;
      }

      // Format phone for API - store in LOCAL format (as user entered it)
      const phoneForApi = formatPhoneNumberForApi(
        values.phoneNumber,
        selectedCountry as CountryCode | undefined
      );
      if (!phoneForApi) {
        setPhoneError('Invalid phone number format');
        setLoadingSendNow(false);
        return;
      }

      // The number in values.phoneNumber is already in local format (as user entered)
      const localNumber = values.phoneNumber || '';

      const customer = await apiClient.createCustomer({
        name: values.name,
        phone: {
          countryCode: phoneForApi.countryCode,
          number: localNumber, // LOCAL format: "07780586444" (as user entered)
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
      setLoadingSendNow(false);
    }
  };

  const handleSendLater = async (values: typeof form.values) => {
    setLoadingSendLater(true);
    setPhoneError(null);

    try {
      // Validate phone number with country context
      const validation = validatePhoneNumber(
        values.phoneNumber,
        selectedCountry as CountryCode | undefined
      );
      if (!validation.isValid) {
        setPhoneError(validation.error || 'Invalid phone number');
        setLoadingSendLater(false);
        return;
      }

      // Format phone for API - store in LOCAL format (as user entered it)
      const phoneForApi = formatPhoneNumberForApi(
        values.phoneNumber,
        selectedCountry as CountryCode | undefined
      );
      if (!phoneForApi) {
        setPhoneError('Invalid phone number format');
        setLoadingSendLater(false);
        return;
      }

      // Convert E.164 to local format for storage
      // The number in values.phoneNumber is already in local format (as user entered)
      const localNumber = values.phoneNumber || '';

      await apiClient.createCustomer({
        name: values.name,
        phone: {
          countryCode: phoneForApi.countryCode,
          number: localNumber, // LOCAL format: "07780586444" (as user entered)
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
      setLoadingSendLater(false);
    }
  };

  return (
    <Container size="lg" py="md" px="xs">
      <Paper shadow="md" className="bg-[#1a1a1a] px-4 pt-6 pb-8 sm:px-6">
      <div className="max-w-full sm:max-w-2xl sm:mx-auto">
        <div className="mb-8">
          <Title order={2} className="text-2xl sm:text-3xl font-bold mb-2 text-white">
            Add Customer
          </Title>
          <p className="text-sm text-gray-400">Add a new customer to send them a review request</p>
        </div>

        {/* Account Error Alert */}
        <AccountErrorAlert />

        {!paymentLoading && !hasPaid && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Payment Required to Send Messages"
            color="yellow"
            className="mb-6 relative"
          >
            <div className="flex flex-col gap-3 pb-10">
              <Text size="sm" className="text-gray-300">
                You can add customers, but you need to set up payment to send SMS messages.
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

      <form onSubmit={form.onSubmit(() => {})}>
        <Stack gap="lg">
          <TextInput
            label="Name"
            placeholder="Customer Name"
            required
            {...form.getInputProps('name')}
          />

          <label className="block text-sm font-medium text-gray-200 mb-1">
            {(() => {
              // Use "Mobile Number" for UK/Ireland, "Cell Number" for others
              const phoneType =
                selectedCountry === 'GB' || selectedCountry === 'IE'
                  ? 'Mobile Number'
                  : 'Cell Number';
              return (
                <>
                  {phoneType} <span className="text-red-400">*</span>
                </>
              );
            })()}
          </label>
          <PhoneNumber
            value={form.values.phoneNumber}
            country={selectedCountry}
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

          <Textarea
            label="Job Description (Optional)"
            placeholder="Brief description of the work done"
            rows={3}
            maxLength={250}
            {...form.getInputProps('jobDescription')}
            description={`${form.values.jobDescription.length}/250 characters`}
          />

          <div className="flex flex-col sm:flex-row-reverse gap-3 mt-8 pt-6 border-t border-[#2a2a2a]">
            <div className="w-full sm:flex-1">
              <Tooltip
                label={
                  paymentLoading
                    ? 'Loading payment status...'
                    : 'Payment required to send SMS messages'
                }
                disabled={paymentLoading || hasPaid}
                position="top"
                withArrow
              >
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    form.onSubmit(handleSendNow)();
                  }}
                  loading={loadingSendNow}
                  size="md"
                  className="w-full font-semibold !py-4 !h-auto min-h-[3.5rem]"
                  disabled={paymentLoading || !hasPaid || loadingSendLater}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span>Add Customer</span>
                    <span>Request Review</span>
                  </div>
                </Button>
              </Tooltip>
            </div>
            <div className="w-full sm:flex-1">
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  form.onSubmit(handleSendLater)();
                }}
                loading={loadingSendLater}
                variant="light"
                size="md"
                className="w-full font-semibold !py-4 !h-auto min-h-[3.5rem]"
                disabled={loadingSendNow}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <span>Add Customer</span>
                  <span>Request Later</span>
                </div>
              </Button>
            </div>
          </div>
        </Stack>
      </form>
      </div>
      </Paper>
    </Container>
  );
};
