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
  Switch,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { CountryCode } from 'libphonenumber-js';
import { apiClient } from '@/lib/api';
import { PhoneNumber } from '@/components/PhoneNumber';
import { validatePhoneNumber, formatPhoneNumberForApi } from '@/lib/phone-validation';
import { usePayment } from '@/contexts/PaymentContext';
import { IconAlertCircle, IconCalendar } from '@tabler/icons-react';
import dayjs from 'dayjs';

export const AddCustomer = () => {
  const { hasPaid } = usePayment();
  const [loadingSendNow, setLoadingSendNow] = useState(false);
  const [loadingSendLater, setLoadingSendLater] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode | undefined>('GB'); // Default to GB, can be updated from account
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [scheduledHour, setScheduledHour] = useState<string>('7'); // Default to 7
  const [scheduledMinute, setScheduledMinute] = useState<string>('00');
  const [scheduledAmPm, setScheduledAmPm] = useState<string>('PM'); // Default to PM
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
      setScheduleEnabled(false);
      setScheduledDate(null);
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

      // Calculate scheduled_send_at if date is provided
      let scheduledSendAt: string | undefined = undefined;
      if (scheduleEnabled && scheduledDate) {
        // Convert 12-hour format to 24-hour format
        let hours24 = parseInt(scheduledHour);
        if (scheduledAmPm === 'PM' && hours24 !== 12) {
          hours24 += 12;
        } else if (scheduledAmPm === 'AM' && hours24 === 12) {
          hours24 = 0;
        }
        const minutes = parseInt(scheduledMinute);

        const combinedDateTime = dayjs(scheduledDate)
          .hour(hours24)
          .minute(minutes)
          .second(0)
          .millisecond(0);
        scheduledSendAt = combinedDateTime.toISOString();
      }

      await apiClient.createCustomer({
        name: values.name,
        phone: {
          countryCode: phoneForApi.countryCode,
          number: localNumber, // LOCAL format: "07780586444" (as user entered)
        },
        jobDescription: values.jobDescription || undefined,
        scheduledSendAt,
      });

      const message = scheduledSendAt
        ? `Customer added. SMS will be sent automatically on ${dayjs(scheduledSendAt).format('DD MMM YYYY [at] HH:mm')}`
        : 'Customer added (pending SMS)';

      notifications.show({
        title: 'Success',
        message,
        color: 'green',
      });

      form.reset();
      setScheduleEnabled(false);
      setScheduledDate(null);
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

          {/* Schedule Send Section */}
          <div className="pt-4 border-t border-[#2a2a2a]">
            <Switch
              label="Schedule SMS to send later"
              description="Set a date to automatically send the review request"
              checked={scheduleEnabled}
              onChange={(e) => {
                setScheduleEnabled(e.currentTarget.checked);
                if (!e.currentTarget.checked) {
                  setScheduledDate(null);
                  setScheduledHour('7');
                  setScheduledMinute('00');
                  setScheduledAmPm('PM');
                }
              }}
              className="mb-4"
            />

            {scheduleEnabled && (
              <Stack gap="md" className="mt-4">
                <DatePickerInput
                  label="Date"
                  placeholder="Pick a date"
                  value={scheduledDate}
                  onChange={setScheduledDate}
                  minDate={new Date()}
                  leftSection={<IconCalendar size={16} />}
                />
                <div>
                  <Text size="sm" fw={500} className="mb-2 text-gray-300">
                    Time
                  </Text>
                  <div className="space-y-4">
                    {/* AM Section */}
                    <div>
                      <Text size="xs" className="text-gray-500 mb-2 uppercase tracking-wide">
                        AM
                      </Text>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { hour: 8, minute: 0 },
                          { hour: 8, minute: 30 },
                          { hour: 9, minute: 0 },
                          { hour: 9, minute: 30 },
                          { hour: 10, minute: 0 },
                          { hour: 10, minute: 30 },
                          { hour: 11, minute: 0 },
                          { hour: 11, minute: 30 },
                        ].map(({ hour, minute }) => {
                          const isSelected =
                            scheduledAmPm === 'AM' &&
                            scheduledHour === String(hour === 12 ? 12 : hour) &&
                            scheduledMinute === String(minute).padStart(2, '0');
                          const displayHour = hour === 12 ? 12 : hour;
                          return (
                            <button
                              key={`am-${hour}-${minute}`}
                              type="button"
                              onClick={() => {
                                setScheduledHour(String(displayHour));
                                setScheduledMinute(String(minute).padStart(2, '0'));
                                setScheduledAmPm('AM');
                              }}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                isSelected
                                  ? 'bg-[rgb(9,146,104)] text-white shadow-lg'
                                  : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#333333] hover:text-white'
                              }`}
                            >
                              {displayHour}:{String(minute).padStart(2, '0')} AM
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {/* PM Section */}
                    <div>
                      <Text size="xs" className="text-gray-500 mb-2 uppercase tracking-wide">
                        PM
                      </Text>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { hour: 12, minute: 0 },
                          { hour: 12, minute: 30 },
                          { hour: 1, minute: 0 },
                          { hour: 1, minute: 30 },
                          { hour: 2, minute: 0 },
                          { hour: 2, minute: 30 },
                          { hour: 3, minute: 0 },
                          { hour: 3, minute: 30 },
                          { hour: 4, minute: 0 },
                          { hour: 4, minute: 30 },
                          { hour: 5, minute: 0 },
                          { hour: 5, minute: 30 },
                          { hour: 6, minute: 0 },
                          { hour: 6, minute: 30 },
                          { hour: 7, minute: 0 },
                          { hour: 7, minute: 30 },
                          { hour: 8, minute: 0 },
                          { hour: 8, minute: 30 },
                          { hour: 9, minute: 0 },
                        ].map(({ hour, minute }) => {
                          const isSelected =
                            scheduledAmPm === 'PM' &&
                            scheduledHour === String(hour === 12 ? 12 : hour) &&
                            scheduledMinute === String(minute).padStart(2, '0');
                          const displayHour = hour === 12 ? 12 : hour;
                          return (
                            <button
                              key={`pm-${hour}-${minute}`}
                              type="button"
                              onClick={() => {
                                setScheduledHour(String(displayHour));
                                setScheduledMinute(String(minute).padStart(2, '0'));
                                setScheduledAmPm('PM');
                              }}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                isSelected
                                  ? 'bg-[rgb(9,146,104)] text-white shadow-lg'
                                  : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#333333] hover:text-white'
                              }`}
                            >
                              {displayHour}:{String(minute).padStart(2, '0')} PM
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </Stack>
            )}
          </div>

          <div className="flex flex-col gap-3 mt-8 pt-6 border-t border-[#2a2a2a]">
            <Tooltip
              label="Payment required to send SMS messages"
              disabled={hasPaid}
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
                fullWidth
                disabled={!hasPaid || loadingSendLater}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <span>Add Customer</span>
                  <span>Request Review</span>
                </div>
              </Button>
            </Tooltip>
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
              fullWidth
              disabled={loadingSendNow}
            >
              <div className="flex flex-col items-center gap-0.5">
                <span>Add Customer</span>
                <span>Request Later</span>
              </div>
            </Button>
          </div>
        </Stack>
      </form>
    </Paper>
  );
};
