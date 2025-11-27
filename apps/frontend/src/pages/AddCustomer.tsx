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
  Modal,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { CountryCode } from 'libphonenumber-js';
import { apiClient } from '@/lib/api';
import { PhoneNumber } from '@/components/PhoneNumber';
import { validatePhoneNumber, formatPhoneNumberForApi } from '@/lib/phone-validation';
import { usePayment } from '@/contexts/PaymentContext';
import { useAccount } from '@/contexts/AccountContext';
import { useSetup } from '@/contexts/SetupContext';
import { AccountErrorAlert } from '@/components/AccountErrorAlert';
import { SetupProgressModal } from '@/components/SetupProgressModal';
import {
  IconAlertCircle,
  IconClock,
  IconSparkles,
  IconHome,
  IconUserPlus,
} from '@tabler/icons-react';

export const AddCustomer = () => {
  const { hasPaid, loading: paymentLoading } = usePayment();
  const { subscriptionTier } = useAccount();
  const { progress, refresh: refreshSetup } = useSetup();
  const [loadingSendNow, setLoadingSendNow] = useState(false);
  const [loadingSendLater, setLoadingSendLater] = useState(false);
  const [loadingAddOnly, setLoadingAddOnly] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode | undefined>('GB'); // Default to GB, can be updated from account
  const countryRef = useRef<CountryCode | undefined>('GB');
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState<Date | null>(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const navigate = useNavigate();

  // Check if user has Pro or Business tier (or free tier for dev testing)
  const canSchedule =
    subscriptionTier === 'free' || subscriptionTier === 'pro' || subscriptionTier === 'business';

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
      await refreshSetup();

      form.reset();

      // Show progress modal if setup not complete
      if (progress && !progress.isComplete) {
        setShowProgressModal(true);
      } else {
        notifications.show({
          title: 'Success',
          message: 'Customer added and SMS sent',
          color: 'green',
        });
        navigate('/customers');
      }
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

  const handleAddOnly = async (values: typeof form.values) => {
    setLoadingAddOnly(true);
    setPhoneError(null);

    try {
      // Validate phone number with country context
      const validation = validatePhoneNumber(
        values.phoneNumber,
        selectedCountry as CountryCode | undefined
      );
      if (!validation.isValid) {
        setPhoneError(validation.error || 'Invalid phone number');
        setLoadingAddOnly(false);
        return;
      }

      // Format phone for API - store in LOCAL format (as user entered it)
      const phoneForApi = formatPhoneNumberForApi(
        values.phoneNumber,
        selectedCountry as CountryCode | undefined
      );
      if (!phoneForApi) {
        setPhoneError('Invalid phone number format');
        setLoadingAddOnly(false);
        return;
      }

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

      await refreshSetup();

      form.reset();

      // Show progress modal if setup not complete
      if (progress && !progress.isComplete) {
        setShowProgressModal(true);
      } else {
        notifications.show({
          title: 'Success',
          message: 'Customer added successfully',
          color: 'green',
        });
        navigate('/customers');
      }
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to add customer',
        color: 'red',
      });
    } finally {
      setLoadingAddOnly(false);
    }
  };

  const handleRequestLaterClick = () => {
    // Validate form first
    const validation = form.validate();
    if (validation.hasErrors) {
      // Scroll to first error
      const firstErrorField = Object.keys(validation.errors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // If user can schedule, show the modal
    if (canSchedule) {
      setScheduleModalOpen(true);
    } else {
      // For starter tier, show upgrade modal
      setUpgradeModalOpen(true);
    }
  };

  const handleSendLater = async (scheduledTime: Date | null) => {
    setLoadingSendLater(true);
    setPhoneError(null);
    setScheduleModalOpen(false);

    try {
      const values = form.values;

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
        scheduledSendAt: scheduledTime ? scheduledTime.toISOString() : undefined,
      });

      await refreshSetup();

      form.reset();
      setScheduledDateTime(null);

      // Show progress modal if setup not complete
      if (progress && !progress.isComplete) {
        setShowProgressModal(true);
      } else {
        notifications.show({
          title: 'Success',
          message: scheduledTime
            ? `Customer added. SMS scheduled for ${scheduledTime.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })} at ${scheduledTime.toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
              })}`
            : 'Customer added (pending SMS)',
          color: 'green',
        });
        navigate('/customers');
      }
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
    <Container size="lg" py="md" className="px-xs sm:px-md">
      <Paper shadow="md" className="bg-[#1a1a1a] px-4 pt-6 pb-8 sm:p-8">
        <div className="max-w-full">
          <div className="mb-8">
            <Title order={2} className="text-2xl sm:text-3xl font-bold mb-2 text-white">
              Add Customer
            </Title>
            <p className="text-sm text-gray-400">
              Add a new customer to send them a review request
            </p>
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

              <div className="flex flex-col gap-3 mt-8 pt-6 border-t border-[#2a2a2a]">
                {progress && !progress.isComplete && (
                  <Button
                    variant="light"
                    color="blue"
                    leftSection={<IconHome size={16} />}
                    onClick={() => navigate('/dashboard')}
                    size="md"
                  >
                    Back to Dashboard
                  </Button>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="w-full sm:flex-1">
                    <Tooltip
                      label="Just add the customer without sending SMS"
                      position="top"
                      withArrow
                    >
                      <Button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          form.onSubmit(handleAddOnly)();
                        }}
                        loading={loadingAddOnly}
                        variant="light"
                        color="teal"
                        size="md"
                        className="w-full font-semibold"
                        disabled={loadingSendNow || loadingSendLater}
                        leftSection={<IconUserPlus size={18} />}
                      >
                        Add Customer Only
                      </Button>
                    </Tooltip>
                  </div>

                  <div className="w-full sm:flex-1">
                    <Tooltip
                      label={
                        paymentLoading
                          ? 'Loading payment status...'
                          : !hasPaid
                            ? 'Payment required to schedule SMS'
                            : 'Schedule when to send the review request'
                      }
                      position="top"
                      withArrow
                    >
                      <Button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleRequestLaterClick();
                        }}
                        loading={loadingSendLater}
                        variant="filled"
                        color="blue"
                        size="md"
                        className="w-full font-semibold"
                        disabled={paymentLoading || !hasPaid || loadingSendNow || loadingAddOnly}
                        leftSection={<IconClock size={18} />}
                      >
                        Add & Schedule
                      </Button>
                    </Tooltip>
                  </div>

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
                        variant="filled"
                        color="teal"
                        size="md"
                        className="w-full font-semibold"
                        disabled={paymentLoading || !hasPaid || loadingSendLater || loadingAddOnly}
                      >
                        Add & Send Now
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </Stack>
          </form>
        </div>
      </Paper>

      {/* Schedule SMS Modal */}
      <Modal
        opened={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        title="Schedule Review Request"
        size="md"
        centered
      >
        <Stack gap="md">
          <Text size="sm" className="text-gray-300">
            Choose when to send the review request SMS to this customer.
          </Text>

          <DateTimePicker
            label="Send Date & Time"
            placeholder="Pick date and time"
            value={scheduledDateTime}
            onChange={setScheduledDateTime}
            minDate={new Date()}
            clearable
            required
            valueFormat="Do MMM YYYY, HH:mm"
            description="Select a future date and time for sending the SMS"
          />

          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <Button
              variant="light"
              onClick={() => {
                setScheduleModalOpen(false);
                setScheduledDateTime(null);
              }}
              fullWidth
              size="lg"
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleSendLater(scheduledDateTime)}
              disabled={!scheduledDateTime}
              loading={loadingSendLater}
              fullWidth
              size="lg"
            >
              Schedule SMS
            </Button>
          </div>

          <Alert color="blue" className="bg-blue-900/20 border-blue-700/30">
            <Text size="xs" className="text-gray-300">
              The SMS will be sent automatically at the scheduled time. You can edit or cancel the
              schedule from the Customer List page.
            </Text>
          </Alert>
        </Stack>
      </Modal>

      {/* Upgrade Modal for Starter Users */}
      <Modal
        opened={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        title="Unlock SMS Scheduling"
        size="md"
        centered
        classNames={{
          body: 'p-0',
        }}
      >
        <Stack gap="lg" align="center" className="text-center">
          <div className="bg-gradient-to-br from-teal-500/20 to-blue-500/20 p-6 rounded-full">
            <IconSparkles size={64} className="text-teal-400" />
          </div>

          <div>
            <Title order={3} className="text-white mb-2">
              Schedule SMS for Perfect Timing
            </Title>
            <Text size="sm" className="text-gray-300 max-w-md">
              Pro and Business customers can schedule review requests for a specific date and time.
              Perfect for sending requests when you know the completion date or at the optimal time
              for your industry.
            </Text>
          </div>

          <Stack gap="sm" className="w-full text-left">
            <Text size="sm" className="text-gray-300">
              <strong className="text-teal-400">✓</strong> Schedule SMS weeks in advance
            </Text>
            <Text size="sm" className="text-gray-300">
              <strong className="text-teal-400">✓</strong> Automatic sending at the perfect time
            </Text>
            <Text size="sm" className="text-gray-300">
              <strong className="text-teal-400">✓</strong> Edit or cancel schedules anytime
            </Text>
            <Text size="sm" className="text-gray-300">
              <strong className="text-teal-400">✓</strong> Set it once, we'll handle the rest
            </Text>
          </Stack>

          <div className="flex gap-3 w-full pt-4">
            <Button variant="subtle" onClick={() => setUpgradeModalOpen(false)} className="flex-1">
              Maybe Later
            </Button>
            <Button component={Link} to="/billing" className="flex-1 font-semibold !h-auto !py-2">
              <div className="flex flex-col items-center gap-0">
                <span>Upgrade to Pro</span>
                <span>or Business</span>
              </div>
            </Button>
          </div>
        </Stack>
      </Modal>

      {/* Setup Progress Modal */}
      {progress && (
        <SetupProgressModal
          opened={showProgressModal}
          onClose={() => setShowProgressModal(false)}
          completedSteps={progress.completedCount}
          totalSteps={progress.totalCount}
          nextStepLabel="Choose Your Plan"
          nextStepPath="/billing"
        />
      )}
    </Container>
  );
};
