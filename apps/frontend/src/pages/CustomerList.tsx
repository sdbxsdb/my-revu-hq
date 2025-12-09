import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Paper,
  Title,
  Table,
  Button,
  Pagination,
  Badge,
  Modal,
  TextInput,
  Textarea,
  Stack,
  Alert,
  Text,
  Skeleton,
  Tooltip,
  Checkbox,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { useForm } from '@mantine/form';
import { CountryCode } from 'libphonenumber-js';
import { apiClient } from '@/lib/api';
import type { Customer } from '@/types';
import { PhoneNumber } from '@/components/PhoneNumber';
import { AccountErrorAlert } from '@/components/AccountErrorAlert';
import {
  validatePhoneNumber,
  formatPhoneNumberForApi,
  detectCountryFromPhoneNumber,
} from '@/lib/phone-validation';
import { parsePhoneNumberFromString, isValidPhoneNumber } from 'libphonenumber-js';
import { usePayment } from '@/contexts/PaymentContext';
import { useAccount } from '@/contexts/AccountContext';
import {
  IconAlertCircle,
  IconTrash,
  IconClock,
  IconCalendar,
  IconLock,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import { getSmsLimitFromTier } from '@/lib/pricing';
import { PageContainer } from '@/components/PageContainer';

export const CustomerList = () => {
  const { hasPaid, loading: paymentLoading } = usePayment();
  const { subscriptionTier } = useAccount();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [smsSent, setSmsSent] = useState<number | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState<string>(''); // Immediate input value
  const [searchQuery, setSearchQuery] = useState<string>(''); // Debounced value that triggers API
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [sendingCustomerId, setSendingCustomerId] = useState<string | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [schedulingCustomer, setSchedulingCustomer] = useState<Customer | null>(null);
  const [scheduledDateTime, setScheduledDateTime] = useState<Date | null>(null);
  const [updatingSchedule, setUpdatingSchedule] = useState(false);
  const limit = 10;

  // Check if user has Pro or Business tier (can schedule) or free tier for dev testing
  const canSchedule =
    subscriptionTier === 'free' || subscriptionTier === 'pro' || subscriptionTier === 'business';

  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode | undefined>('GB');
  const [consentModalOpen, setConsentModalOpen] = useState(false);
  const [pendingCustomerId, setPendingCustomerId] = useState<string | null>(null);
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const countryRef = useRef<CountryCode | undefined>('GB');

  const editForm = useForm({
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

  // Debounce search input (500ms delay)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1); // Reset to page 1 when search changes
    }, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchInput]);

  // Load customers when filters change (with abort on cleanup)
  useEffect(() => {
    const abortController = new AbortController();
    loadCustomers(abortController.signal);

    return () => {
      abortController.abort(); // Cancel previous request when filters change
    };
  }, [page, statusFilter, searchQuery, selectedLetter]);

  // Silently refresh delivery statuses without triggering loading skeleton
  // Only refreshes messages for currently displayed customers (respects search/filters)
  const refreshDeliveryStatuses = async () => {
    try {
      // Only refresh if we have customers displayed
      if (customers.length === 0) return;

      // Fetch updated delivery statuses using the same filters/search as current view
      // This ensures we refresh the correct customers when searching/filtering
      const data = await apiClient.getCustomers({
        page,
        limit,
        status: statusFilter as 'sent' | 'pending' | undefined,
        search: searchQuery.trim() || undefined,
        firstLetter: selectedLetter && !searchQuery.trim() ? selectedLetter : undefined,
      });

      // Create a map of customer IDs to their updated messages
      const updatedMessagesMap = new Map<string, (typeof data.customers)[0]['messages']>();
      data.customers.forEach((customer) => {
        if (customer.messages && customer.messages.length > 0) {
          updatedMessagesMap.set(customer.id, customer.messages);
        }
      });

      // Update only the messages in existing customers array (preserve other state)
      setCustomers((prevCustomers) =>
        prevCustomers.map((customer) => {
          const updatedMessages = updatedMessagesMap.get(customer.id);
          if (updatedMessages) {
            return {
              ...customer,
              messages: updatedMessages,
            };
          }
          return customer;
        })
      );
    } catch (error) {
      // Silently fail - don't show errors for background updates
      console.error('Failed to refresh delivery statuses:', error);
    }
  };

  // Auto-refresh delivery statuses every 15 seconds
  // Only refresh if there are messages that are still pending (sent, queued, sending)
  // Respects current search/filter state
  useEffect(() => {
    if (loading) return; // Don't poll while loading
    if (customers.length === 0) return; // Don't poll if no customers displayed

    const hasPendingMessages = customers.some(
      (c) =>
        c.messages &&
        c.messages.some((m) => {
          const status = m.delivery_status?.toLowerCase();
          return (
            status && status !== 'delivered' && status !== 'failed' && status !== 'undelivered'
          );
        })
    );

    if (!hasPendingMessages) {
      return; // No messages waiting for status updates, don't poll
    }

    const interval = setInterval(() => {
      refreshDeliveryStatuses();
    }, 15000); // Poll every 15 seconds (reduced frequency to avoid excessive API calls)

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customers, loading, page, statusFilter, searchQuery, selectedLetter]);

  // Load SMS usage only on initial mount
  useEffect(() => {
    loadSmsUsage();
  }, []);

  const loadSmsUsage = async () => {
    try {
      setLoadingUsage(true);
      const account = await apiClient.getAccount();
      setSmsSent(account.sms_sent_this_month || 0);
    } catch (error) {
      // Failed to load usage data - continue without it
    } finally {
      setLoadingUsage(false);
    }
  };

  const loadCustomers = async (signal?: AbortSignal) => {
    setLoading(true);

    // Development mode: show dummy data immediately
    const isDevMode =
      !import.meta.env.VITE_SUPABASE_URL ||
      import.meta.env.VITE_SUPABASE_URL?.includes('placeholder') ||
      !import.meta.env.VITE_SUPABASE_ANON_KEY ||
      import.meta.env.VITE_SUPABASE_ANON_KEY === 'placeholder_key';

    if (isDevMode) {
      // Show dummy data immediately in dev mode with various countries for testing
      // Dummy data with numbers stored in LOCAL format (as user would enter them)
      // Numbers are stored as: { countryCode: "44", number: "07911123456" }
      // When sending to Twilio, we convert to E.164: +447911123456
      const dummyCustomers: Customer[] = [
        {
          id: '1',
          user_id: 'dev-user',
          name: 'John Smith',
          phone: { countryCode: '44', number: '07911123456' }, // UK local format
          job_description: 'Kitchen renovation - new cabinets and countertops',
          sms_status: 'sent',
          sent_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          user_id: 'dev-user',
          name: "Sarah O'Connor",
          phone: { countryCode: '353', number: '0851234567' }, // Ireland local format
          job_description: 'Bathroom remodel - tile work and plumbing',
          sms_status: 'sent',
          sent_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          user_id: 'dev-user',
          name: 'Michael Brown',
          phone: { countryCode: '1', number: '9058088723' }, // Canada local format (no leading 0)
          job_description: 'Roof repair - replaced shingles and gutters',
          sms_status: 'pending',
        },
        {
          id: '4',
          user_id: 'dev-user',
          name: 'Emma Wilson',
          phone: { countryCode: '61', number: '0412345678' }, // Australia local format
          job_description: 'Electrical rewiring - full house',
          sms_status: 'pending',
        },
        {
          id: '5',
          user_id: 'dev-user',
          name: 'David Taylor',
          phone: { countryCode: '1', number: '4165551234' }, // US local format
          job_description: 'Plumbing installation - new bathroom suite',
          sms_status: 'sent',
          sent_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '6',
          user_id: 'dev-user',
          name: 'Sophie Martin',
          phone: { countryCode: '33', number: '0612345678' }, // France local format
          job_description: 'Window replacement - double glazing',
          sms_status: 'sent',
          sent_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '7',
          user_id: 'dev-user',
          name: 'James Murphy',
          phone: { countryCode: '353', number: '0872347789' }, // Ireland local format
          job_description: 'Driveway paving and landscaping',
          sms_status: 'pending',
        },
        {
          id: '8',
          user_id: 'dev-user',
          name: 'Lisa Anderson',
          phone: { countryCode: '49', number: '015123456789' }, // Germany local format
          job_description: 'Heating system installation',
          sms_status: 'sent',
          sent_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '9',
          user_id: 'dev-user',
          name: 'Invalid Number Test',
          phone: { countryCode: '44', number: '079111123' }, // Invalid - too short
          job_description: 'Test customer with invalid phone number',
          sms_status: 'pending',
        },
        {
          id: '10',
          user_id: 'dev-user',
          name: 'Another Invalid',
          phone: { countryCode: '1', number: '1234567890' }, // Invalid US number
          job_description: 'Another test with invalid number',
          sms_status: 'pending',
        },
      ];

      // Apply status filter
      let filtered = dummyCustomers;
      if (statusFilter) {
        filtered = dummyCustomers.filter((c) => c.sms_status === statusFilter);
      }

      // Apply alphabet filter (only if no search query)
      if (!searchQuery.trim() && selectedLetter) {
        filtered = filtered.filter((c) =>
          c.name.toUpperCase().startsWith(selectedLetter.toUpperCase())
        );
      }

      // Apply search filter
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        filtered = filtered.filter((c) => {
          const nameMatch = c.name.toLowerCase().includes(query);
          const jobMatch = c.job_description && c.job_description.toLowerCase().includes(query);
          // Search in phone number (handle both local format and E.164 format)
          const phoneNumber = c.phone?.number || '';
          const phoneMatch =
            phoneNumber.toLowerCase().includes(query) ||
            phoneNumber.replace(/\s+/g, '').includes(query.replace(/\s+/g, ''));
          return nameMatch || jobMatch || phoneMatch;
        });
      }

      // Apply pagination
      const start = (page - 1) * limit;
      const end = start + limit;
      setCustomers(filtered.slice(start, end));
      setTotal(filtered.length);
      // In dev mode, totalCount is the same as total (all dummy customers)
      setTotalCount(dummyCustomers.length);
      setLoading(false);
      return;
    }

    try {
      const data = await apiClient.getCustomers({
        page,
        limit,
        status: statusFilter as 'sent' | 'pending' | undefined,
        search: searchQuery.trim() || undefined,
        firstLetter: selectedLetter && !searchQuery.trim() ? selectedLetter : undefined,
      });

      // If request was aborted, don't update state
      if (signal?.aborted) {
        return;
      }

      // No client-side filtering needed - API handles search now
      setCustomers(data.customers);
      setTotal(data.total);
      setTotalCount(data.totalCount ?? null);
    } catch (error: any) {
      // Don't show error for aborted requests
      if (error.name === 'AbortError' || signal?.aborted) {
        return;
      }

      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to load customers',
        color: 'red',
      });
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  const handleEdit = (customer: Customer) => {
    // Customer phone is stored in DB as:
    // { countryCode: "44", number: "07911123456" } - LOCAL format (as user entered)
    // NOT E.164 format - we convert to E.164 only when sending to Twilio
    // Country is auto-detected from the number (not stored in DB)

    // Auto-detect country from phone number (consistent with card display)
    const detectedCountry = detectCountryFromPhoneNumber(
      customer.phone.number,
      customer.phone.countryCode
    );
    const countryToUse = detectedCountry || 'GB'; // Default fallback
    setSelectedCountry(countryToUse);
    countryRef.current = countryToUse;

    // The number is already in local format (as stored in DB)
    // Just use it directly - no transformation needed
    const displayNumber = customer.phone.number;

    editForm.setValues({
      name: customer.name,
      phoneNumber: displayNumber || '',
      jobDescription: customer.job_description || '',
    });

    setEditingCustomer(customer);
    setEditModalOpen(true);
    setPhoneError(null);
  };

  const handleSaveEdit = async (values: typeof editForm.values) => {
    if (!editingCustomer) return;

    setSaving(true);
    setPhoneError(null);

    try {
      // Validate phone number with country context
      const validation = validatePhoneNumber(
        values.phoneNumber,
        selectedCountry as CountryCode | undefined
      );
      if (!validation.isValid) {
        setPhoneError(validation.error || 'Invalid phone number');
        setSaving(false);
        return;
      }

      // Format phone for API - get country code and E.164 for Twilio
      const phoneForApi = formatPhoneNumberForApi(
        values.phoneNumber,
        selectedCountry as CountryCode | undefined
      );
      if (!phoneForApi) {
        setPhoneError('Invalid phone number format');
        setSaving(false);
        return;
      }

      // Store the LOCAL number (as user entered it), not E.164
      // The number in values.phoneNumber is already in local format
      const localNumber = values.phoneNumber || '';

      const isDevMode =
        !import.meta.env.VITE_SUPABASE_URL ||
        import.meta.env.VITE_SUPABASE_URL?.includes('placeholder') ||
        !import.meta.env.VITE_SUPABASE_ANON_KEY ||
        import.meta.env.VITE_SUPABASE_ANON_KEY === 'placeholder_key';

      if (isDevMode) {
        // Update local state in dev mode
        const updatedCustomers = customers.map((c) =>
          c.id === editingCustomer.id
            ? {
                ...c,
                name: values.name,
                phone: {
                  countryCode: phoneForApi.countryCode, // e.g., "44"
                  number: localNumber, // LOCAL format: "07780586444" (as user entered)
                  // Country is auto-detected from the number (not stored in DB)
                },
                job_description: values.jobDescription || undefined,
              }
            : c
        );
        setCustomers(updatedCustomers);
        notifications.show({
          title: 'Success (Demo Mode)',
          message: 'Customer updated (demo mode - not persisted)',
          color: 'green',
        });
        setEditModalOpen(false);
        setEditingCustomer(null);
        setSaving(false);
        return;
      }

      await apiClient.updateCustomer(editingCustomer.id, {
        name: values.name,
        phone: {
          countryCode: phoneForApi.countryCode, // e.g., "44"
          number: localNumber, // LOCAL format: "07780586444" (as user entered)
          // Country is auto-detected from the number (not stored in DB)
        },
        jobDescription: values.jobDescription,
        scheduledSendAt: editingCustomer.scheduled_send_at || null,
      });

      notifications.show({
        title: 'Success',
        message: 'Customer updated successfully',
        color: 'green',
      });
      setEditModalOpen(false);
      setEditingCustomer(null);
      loadCustomers();
    } catch (error: any) {
      // Handle duplicate phone number error
      if (error.response?.status === 409) {
        notifications.show({
          title: 'Duplicate Phone Number',
          message:
            error.response?.data?.error ||
            'A customer with this phone number already exists. Please use the existing customer record instead.',
          color: 'yellow',
          autoClose: 8000,
        });
      } else {
        notifications.show({
          title: 'Error',
          message: error.message || 'Failed to update customer',
          color: 'red',
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRequestReview = (customerId: string) => {
    if (!hasPaid) {
      notifications.show({
        title: 'Payment Required',
        message: 'Please set up your payment method to send SMS messages.',
        color: 'yellow',
      });
      return;
    }

    setPendingCustomerId(customerId);
    setConsentConfirmed(false);
    setConsentModalOpen(true);
  };

  const handleSendAgain = async (customerId: string) => {
    if (!consentConfirmed) {
      notifications.show({
        title: 'Consent Required',
        message: 'Please confirm you have permission to send SMS to this customer',
        color: 'yellow',
      });
      return;
    }

    const isDevMode =
      import.meta.env.VITE_SUPABASE_URL?.includes('placeholder') ||
      import.meta.env.VITE_SUPABASE_ANON_KEY === 'placeholder_key';

    if (isDevMode) {
      notifications.show({
        title: 'Demo Mode',
        message: 'SMS sending is disabled in demo mode. Connect to a real backend to send SMS.',
        color: 'teal',
      });
      return;
    }

    setSendingCustomerId(customerId);
    try {
      const result = await apiClient.sendSMS(customerId, consentConfirmed);

      // Update the customer in state with new data
      setCustomers((prevCustomers) =>
        prevCustomers.map((c) =>
          c.id === customerId
            ? {
                ...c,
                sms_status: result.customer.sms_status,
                sent_at: result.customer.sent_at,
                sms_request_count: result.customer.sms_request_count,
                messages: [...(c.messages || []), { sent_at: result.customer.sent_at }],
              }
            : c
        )
      );

      // Update SMS usage in state
      setSmsSent(result.usage.sms_sent_this_month);

      // Close modal and reset state
      setConsentModalOpen(false);
      setConsentConfirmed(false);
      setPendingCustomerId(null);

      notifications.show({
        title: 'Success',
        message: 'SMS sent successfully',
        color: 'green',
      });
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to send SMS',
        color: 'red',
      });
    } finally {
      setSendingCustomerId(null);
    }
  };

  const handleDelete = async () => {
    if (!editingCustomer) return;

    setDeleting(true);
    try {
      const isDevMode =
        !import.meta.env.VITE_SUPABASE_URL ||
        import.meta.env.VITE_SUPABASE_URL?.includes('placeholder') ||
        !import.meta.env.VITE_SUPABASE_ANON_KEY ||
        import.meta.env.VITE_SUPABASE_ANON_KEY === 'placeholder_key';

      if (isDevMode) {
        // Update local state in dev mode
        const updatedCustomers = customers.filter((c) => c.id !== editingCustomer.id);
        setCustomers(updatedCustomers);
        setTotal(updatedCustomers.length);
        notifications.show({
          title: 'Success (Demo Mode)',
          message: 'Customer deleted (demo mode - not persisted)',
          color: 'green',
        });
        setDeleteConfirmOpen(false);
        setEditingCustomer(null);
        setDeleting(false);
        return;
      }

      await apiClient.deleteCustomer(editingCustomer.id);
      notifications.show({
        title: 'Success',
        message: 'Customer deleted successfully',
        color: 'green',
      });
      setDeleteConfirmOpen(false);
      setEditingCustomer(null);
      loadCustomers();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to delete customer',
        color: 'red',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenScheduleModal = (customer: Customer) => {
    setSchedulingCustomer(customer);
    setScheduledDateTime(customer.scheduled_send_at ? new Date(customer.scheduled_send_at) : null);
    setScheduleModalOpen(true);
  };

  const handleUpdateSchedule = async () => {
    if (!schedulingCustomer) return;

    setUpdatingSchedule(true);
    try {
      const updated = await apiClient.updateCustomer(schedulingCustomer.id, {
        scheduledSendAt: scheduledDateTime ? scheduledDateTime.toISOString() : null,
      });

      // Update customer in state
      setCustomers((prev) =>
        prev.map((c) => (c.id === schedulingCustomer.id ? { ...c, ...updated } : c))
      );

      notifications.show({
        title: 'Success',
        message: scheduledDateTime
          ? `SMS scheduled for ${scheduledDateTime.toLocaleString()}`
          : 'Schedule cleared',
        color: 'green',
      });

      setScheduleModalOpen(false);
      setSchedulingCustomer(null);
      setScheduledDateTime(null);
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to update schedule',
        color: 'red',
      });
    } finally {
      setUpdatingSchedule(false);
    }
  };

  const handleSendNow = async (customer: Customer) => {
    // If customer has a schedule, clear it first
    if (customer.scheduled_send_at) {
      try {
        await apiClient.updateCustomer(customer.id, {
          scheduledSendAt: null,
        });
      } catch (error) {
        console.error('Failed to clear schedule:', error);
      }
    }

    // Then send immediately
    handleSendAgain(customer.id);
  };

  // Get flag emoji from country code
  const getFlagEmoji = (country: CountryCode): string => {
    // Convert country code to flag emoji (e.g., "GB" -> 🇬🇧)
    const codePoints = country
      .toUpperCase()
      .split('')
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  // Format phone number for display - returns flag and number separately for better alignment
  const formatPhone = (phone: Customer['phone']): { flag: string; number: string } => {
    if (!phone || !phone.number) return { flag: '', number: '-' };

    // Handle both formats: local format (new) and E.164 format (legacy)
    let displayNumber = phone.number;

    // If number is in E.164 format (starts with +), convert to local format
    if (phone.number.startsWith('+')) {
      try {
        const parsed = parsePhoneNumberFromString(phone.number);
        if (parsed) {
          // Convert to local format (national format without spaces)
          displayNumber = parsed.formatNational().replace(/\s+/g, '');
        }
      } catch {
        // If parsing fails, use as-is
        displayNumber = phone.number;
      }
    }

    // Auto-detect country from phone number (consistent detection everywhere)
    // This ensures the same country is detected in cards and edit modal
    const detectedCountry = detectCountryFromPhoneNumber(phone.number, phone.countryCode);
    const countryToUse: CountryCode = detectedCountry || 'GB'; // Default fallback

    // Return flag and number separately for better alignment control
    const flag = getFlagEmoji(countryToUse);
    return { flag, number: displayNumber };
  };

  // Check if a phone number is valid
  // Handles both LOCAL format (new) and E.164 format (legacy)
  const isPhoneValid = (phone: Customer['phone']) => {
    if (!phone || !phone.number) return false;
    try {
      let e164Number: string;

      // If number is already in E.164 format, use it directly
      if (phone.number.startsWith('+')) {
        e164Number = phone.number;
      } else {
        // Construct E.164 from local number + countryCode
        e164Number = `+${phone.countryCode}${phone.number}`;
      }

      const parsed = parsePhoneNumberFromString(e164Number);
      return parsed ? isValidPhoneNumber(parsed.number) : false;
    } catch {
      return false;
    }
  };

  // Get phone validation error
  // Handles both LOCAL format (new) and E.164 format (legacy)
  const getPhoneError = (phone: Customer['phone']) => {
    if (!phone || !phone.number) return 'Phone number is required';
    try {
      let e164Number: string;

      // If number is already in E.164 format, use it directly
      if (phone.number.startsWith('+')) {
        e164Number = phone.number;
      } else {
        // Construct E.164 from local number + countryCode
        e164Number = `+${phone.countryCode}${phone.number}`;
      }

      const parsed = parsePhoneNumberFromString(e164Number);
      if (!parsed || !isValidPhoneNumber(parsed.number)) {
        return 'Invalid phone number';
      }
      return null;
    } catch {
      return 'Invalid phone number format';
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = date.getDate();
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    // Add ordinal suffix (st, nd, rd, th)
    const getOrdinalSuffix = (n: number) => {
      const s = ['th', 'st', 'nd', 'rd'];
      const v = n % 100;
      return s[(v - 20) % 10] || s[v] || s[0];
    };

    const time = date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return `${day}${getOrdinalSuffix(day)} ${month} ${year} ${time}`;
  };

  return (
    <PageContainer>
      <Stack gap="lg" className="lg:flex-1">
        {/* Account Error Alert */}
        <AccountErrorAlert />

        <div className="flex flex-col gap-6 mb-8 pb-6 border-b border-[#2a2a2a]">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <Title order={2} className="text-2xl sm:text-3xl font-bold mb-2 text-white">
                  Customer List
                </Title>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <p className="text-sm text-gray-400 hidden sm:block">
                    Manage your customers and review requests
                  </p>
                  {totalCount !== null && (
                    <p className="text-sm text-gray-500">
                      {totalCount} {totalCount === 1 ? 'customer' : 'customers'} total
                    </p>
                  )}
                </div>
              </div>
              {/* Mobile only - payment warning next to title */}
              {!paymentLoading && !hasPaid && (
                <Alert
                  icon={<IconAlertCircle size={16} />}
                  title="Payment Required"
                  color="yellow"
                  className="w-full sm:hidden relative"
                >
                  <div className="flex flex-col gap-3 pb-10">
                    <Text size="sm" className="text-gray-300">
                      You can add and manage customers, but you need to set up payment to send SMS
                      messages.
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
            </div>

            {/* Desktop only - payment warning below title */}
            {!paymentLoading && !hasPaid && (
              <Alert
                icon={<IconAlertCircle size={16} />}
                title="Payment Required"
                color="yellow"
                className="hidden sm:block relative"
              >
                <div className="flex flex-col gap-3 pb-10">
                  <Text size="sm" className="text-gray-300">
                    You can add and manage customers, but you need to set up payment to send SMS
                    messages.
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

            {/* SMS Usage Display */}
            {(smsSent !== null || loadingUsage) && subscriptionTier && (
              <div className="p-3 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
                {loadingUsage ? (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Text size="sm" className="text-gray-400">
                        SMS Usage:
                      </Text>
                      <Skeleton height={20} width={80} />
                      <Text size="xs" className="text-gray-500">
                        this month
                      </Text>
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton height={8} width={128} radius="xl" />
                      <Skeleton height={16} width={60} />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Text size="sm" className="text-gray-400">
                        SMS Usage:
                      </Text>
                      <Text size="sm" className="font-semibold text-white">
                        {smsSent} / {getSmsLimitFromTier(subscriptionTier)}
                      </Text>
                      <Text size="xs" className="text-gray-500">
                        this month
                      </Text>
                    </div>
                    {(() => {
                      const limit = getSmsLimitFromTier(subscriptionTier);
                      const percentage = limit > 0 ? (smsSent! / limit) * 100 : 0;
                      const isWarning = percentage >= 80;
                      const isDanger = percentage >= 100;

                      return (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 sm:w-32 h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                isDanger
                                  ? 'bg-red-500'
                                  : isWarning
                                    ? 'bg-yellow-500'
                                    : 'bg-teal-500'
                              }`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                          {isDanger && (
                            <Text size="xs" className="text-red-400 font-medium">
                              Limit reached
                            </Text>
                          )}
                          {isWarning && !isDanger && (
                            <Text size="xs" className="text-yellow-400 font-medium">
                              Approaching limit
                            </Text>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            <div className="w-full sm:flex sm:justify-end">
              <Button
                component={Link}
                to="/customers/add"
                size="md"
                className="font-medium w-full sm:w-auto sm:max-w-xs"
              >
                {totalCount === 0 && !loading ? 'Add First Customer' : 'Add Customer'}
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Text size="sm" className="text-gray-400">
              Search:
            </Text>
            <TextInput
              placeholder="Name, phone number, or job description"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setSelectedLetter(null); // Clear letter filter when searching
              }}
              className="w-full sm:w-96"
              size="md"
            />
          </div>
          {/* Alphabet Filter */}
          <div className="flex flex-col gap-2">
            <Text size="sm" className="text-gray-400">
              Filter by letter:
            </Text>
            <div className="flex gap-1.5 overflow-x-auto sm:overflow-x-visible sm:flex-wrap pb-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
              <Button
                size="xs"
                variant={selectedLetter === null ? 'filled' : 'outline'}
                onClick={() => {
                  setSelectedLetter(null);
                  setPage(1);
                }}
                className={`flex-shrink-0 sm:flex-shrink ${
                  selectedLetter === null
                    ? 'bg-teal-600 border-teal-600 text-white'
                    : 'border-gray-600 text-gray-300 hover:border-teal-600 hover:text-teal-400'
                }`}
              >
                All
              </Button>
              {[
                'A',
                'B',
                'C',
                'D',
                'E',
                'F',
                'G',
                'H',
                'I',
                'J',
                'K',
                'L',
                'M',
                'N',
                'O',
                'P',
                'Q',
                'R',
                'S',
                'T',
                'U',
                'V',
                'W',
                'X',
                'Y',
                'Z',
              ].map((letter) => (
                <Button
                  key={letter}
                  size="xs"
                  variant={selectedLetter === letter ? 'filled' : 'outline'}
                  onClick={() => {
                    setSelectedLetter(selectedLetter === letter ? null : letter);
                    setSearchInput(''); // Clear search input when selecting letter
                    setSearchQuery(''); // Clear search query when selecting letter
                    setPage(1);
                  }}
                  className={`min-w-[2rem] flex-shrink-0 sm:flex-shrink ${
                    selectedLetter === letter
                      ? 'bg-teal-600 border-teal-600 text-white'
                      : 'border-gray-600 text-gray-300 hover:border-teal-600 hover:text-teal-400'
                  }`}
                >
                  {letter}
                </Button>
              ))}
            </div>
            {/* Status Filter Buttons */}
            <div className="flex flex-col gap-2">
              <Text size="sm" className="text-gray-400">
                Filter by status:
              </Text>
              <div className="flex gap-2">
                <Button
                  size="xs"
                  variant={statusFilter === null ? 'filled' : 'outline'}
                  onClick={() => {
                    setStatusFilter(null);
                    setPage(1);
                  }}
                  className={
                    statusFilter === null
                      ? 'bg-teal-600 border-teal-600 text-white'
                      : 'border-gray-600 text-gray-300 hover:border-teal-600 hover:text-teal-400'
                  }
                >
                  All
                </Button>
                <Button
                  size="xs"
                  variant={statusFilter === 'sent' ? 'filled' : 'outline'}
                  onClick={() => {
                    setStatusFilter('sent');
                    setPage(1);
                  }}
                  className={
                    statusFilter === 'sent'
                      ? 'bg-teal-600 border-teal-600 text-white'
                      : 'border-gray-600 text-gray-300 hover:border-teal-600 hover:text-teal-400'
                  }
                >
                  Sent
                </Button>
                <Button
                  size="xs"
                  variant={statusFilter === 'pending' ? 'filled' : 'outline'}
                  onClick={() => {
                    setStatusFilter('pending');
                    setPage(1);
                  }}
                  className={
                    statusFilter === 'pending'
                      ? 'bg-teal-600 border-teal-600 text-white'
                      : 'border-gray-600 text-gray-300 hover:border-teal-600 hover:text-teal-400'
                  }
                >
                  Not Sent
                </Button>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {/* Desktop skeleton */}
            <div className="hidden lg:block">
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Phone</Table.Th>
                    <Table.Th>Job Description</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Date Sent</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {[...Array(5)].map((_, i) => (
                    <Table.Tr key={i}>
                      <Table.Td>
                        <Skeleton height={20} />
                      </Table.Td>
                      <Table.Td>
                        <Skeleton height={20} width={120} />
                      </Table.Td>
                      <Table.Td>
                        <Skeleton height={20} width={150} />
                      </Table.Td>
                      <Table.Td>
                        <Skeleton height={24} width={80} radius="xl" />
                      </Table.Td>
                      <Table.Td>
                        <Skeleton height={20} width={100} />
                      </Table.Td>
                      <Table.Td>
                        <Skeleton height={20} width={120} />
                      </Table.Td>
                      <Table.Td>
                        <Skeleton height={32} width={100} />
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>
            {/* Mobile skeleton */}
            <div className="lg:hidden space-y-4">
              {[...Array(3)].map((_, i) => (
                <Paper key={i} p="md" className="bg-[#141414]">
                  <Stack gap="sm">
                    <Skeleton height={20} width="60%" />
                    <Skeleton height={16} width="40%" />
                    <Skeleton height={16} width="50%" />
                    <Skeleton height={24} width={80} radius="xl" />
                  </Stack>
                </Paper>
              ))}
            </div>
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No customers found</div>
        ) : (
          <>
            {/* Desktop table view */}
            <div className="hidden lg:block overflow-x-auto -mx-2 sm:mx-0">
              <Table highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Phone</Table.Th>
                    <Table.Th>Job Description</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Date Sent</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {customers.map((customer) => (
                    <Table.Tr key={customer.id}>
                      <Table.Td className="font-medium text-white">
                        {customer.name}
                        {!isPhoneValid(customer.phone) && (
                          <div className="text-xs text-red-400 mt-1 font-medium">
                            {getPhoneError(customer.phone) || 'Invalid phone number'}
                          </div>
                        )}
                      </Table.Td>
                      <Table.Td className="text-gray-300">
                        {(() => {
                          const phoneDisplay = formatPhone(customer.phone);
                          return (
                            <div className="flex items-center gap-1.5">
                              <span className="flex items-center justify-center text-base leading-none">
                                {phoneDisplay.flag}
                              </span>
                              <span>{phoneDisplay.number}</span>
                            </div>
                          );
                        })()}
                      </Table.Td>
                      <Table.Td className="text-gray-400">
                        {customer.job_description || '-'}
                      </Table.Td>
                      <Table.Td>
                        <div className="flex flex-col gap-1">
                          <Badge
                            color={
                              customer.sms_status === 'sent'
                                ? 'green'
                                : customer.sms_status === 'scheduled'
                                  ? 'blue'
                                  : 'orange'
                            }
                          >
                            {customer.sms_status === 'sent'
                              ? 'Sent'
                              : customer.sms_status === 'scheduled'
                                ? 'Scheduled'
                                : 'Not Sent'}
                          </Badge>
                          {customer.sms_status === 'scheduled' &&
                            customer.scheduled_send_at &&
                            (canSchedule ? (
                              <Text size="xs" className="text-blue-400">
                                SMS scheduled{' '}
                                {new Date(customer.scheduled_send_at).toLocaleString('en-GB', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </Text>
                            ) : (
                              <Tooltip label="Upgrade to Pro to schedule SMS">
                                <Text size="xs" className="text-teal-400 flex items-center gap-1">
                                  <IconLock size={12} /> Pro Feature
                                </Text>
                              </Tooltip>
                            ))}
                          {(() => {
                            const requestCount = customer.sms_request_count || 0;
                            const isOptedOut = customer.opt_out || false;
                            const isLimitReached = requestCount >= 3;

                            // Calculate days since last contact
                            let daysSinceContact: number | null = null;
                            if (customer.sent_at) {
                              // Customer was contacted before - check days since last contact
                              const lastContacted = new Date(customer.sent_at);
                              const now = new Date();
                              daysSinceContact = Math.floor(
                                (now.getTime() - lastContacted.getTime()) / (1000 * 60 * 60 * 24)
                              );
                            } else if (customer.created_at) {
                              // Never contacted - use created date
                              const created = new Date(customer.created_at);
                              const now = new Date();
                              daysSinceContact = Math.floor(
                                (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
                              );
                            }

                            // Only show warning if no request has been sent AND it's been 5+ days
                            const showContactWarning =
                              !customer.sent_at &&
                              daysSinceContact !== null &&
                              daysSinceContact >= 5;

                            if (isOptedOut) {
                              return (
                                <Text size="xs" className="text-red-400">
                                  Opted Out
                                </Text>
                              );
                            }
                            if (isLimitReached) {
                              return (
                                <Text size="xs" className="text-yellow-400">
                                  Limit Reached (3/3)
                                </Text>
                              );
                            }
                            if (showContactWarning) {
                              return (
                                <Text
                                  size="xs"
                                  className={
                                    daysSinceContact! >= 30
                                      ? 'text-red-400'
                                      : daysSinceContact! >= 10
                                        ? 'text-orange-400'
                                        : 'text-yellow-400'
                                  }
                                >
                                  {daysSinceContact}d ago. No request sent.
                                </Text>
                              );
                            }
                            if (requestCount > 0) {
                              return (
                                <Text size="xs" className="text-gray-400">
                                  {requestCount}/3 requests
                                </Text>
                              );
                            }
                            return null;
                          })()}
                          {customer.created_at && (
                            <Text size="sm" className="text-gray-500 mt-1">
                              Added:{' '}
                              {new Date(customer.created_at).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </Text>
                          )}
                        </div>
                      </Table.Td>
                      <Table.Td className="text-gray-400">
                        {customer.messages && customer.messages.length > 0 ? (
                          <div className="flex flex-col gap-0.5">
                            {customer.messages
                              .map((msg) => msg.sent_at)
                              .filter((date): date is string => !!date)
                              .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                              .map((sentAt, idx) => (
                                <div key={idx}>{formatDateTime(sentAt)}</div>
                              ))}
                          </div>
                        ) : (
                          formatDateTime(customer.sent_at)
                        )}
                      </Table.Td>
                      <Table.Td>
                        <div className="flex flex-col gap-1.5 min-w-[200px]">
                          {(() => {
                            const requestCount = customer.sms_request_count || 0;
                            const isOptedOut = customer.opt_out || false;
                            const isLimitReached = requestCount >= 3;
                            const isSending = sendingCustomerId === customer.id;
                            const isDisabled =
                              paymentLoading ||
                              !hasPaid ||
                              !isPhoneValid(customer.phone) ||
                              isOptedOut ||
                              isLimitReached ||
                              isSending;

                            const getButtonText = () => {
                              if (isLimitReached) return 'Limit Reached (3/3)';
                              if (isOptedOut) return 'Opted Out';
                              if (isSending) return 'Sending...';
                              const countText = requestCount > 0 ? ` (${requestCount}/3)` : '';
                              return customer.sms_status === 'sent'
                                ? `Request Review Again${countText}`
                                : `Request Review${countText}`;
                            };

                            const getTooltip = () => {
                              if (paymentLoading) return 'Loading payment status...';
                              if (!hasPaid) return 'Payment required to send SMS messages';
                              if (!isPhoneValid(customer.phone))
                                return getPhoneError(customer.phone) || 'Invalid phone number';
                              if (isOptedOut)
                                return 'This customer has opted out of receiving messages';
                              if (isLimitReached)
                                return 'Maximum of 3 review requests allowed per customer. Limit reached.';
                              return '';
                            };

                            // Desktop: Send Now first, then Edit Schedule
                            return (
                              <>
                                <Button
                                  size="sm"
                                  variant={customer.sms_status === 'sent' ? 'light' : 'filled'}
                                  onClick={() =>
                                    customer.sms_status === 'scheduled'
                                      ? handleSendNow(customer)
                                      : handleRequestReview(customer.id)
                                  }
                                  radius="md"
                                  className="font-medium w-full"
                                  disabled={isDisabled}
                                  loading={isSending}
                                  title={getTooltip()}
                                >
                                  {customer.sms_status === 'scheduled'
                                    ? 'Send Now'
                                    : getButtonText()}
                                </Button>
                                {canSchedule && customer.sms_status === 'scheduled' && (
                                  <Tooltip label="Edit or cancel the scheduled send time">
                                    <Button
                                      size="sm"
                                      variant="light"
                                      onClick={() => handleOpenScheduleModal(customer)}
                                      radius="md"
                                      className="font-medium w-full"
                                      leftSection={<IconCalendar size={16} />}
                                    >
                                      Edit Schedule
                                    </Button>
                                  </Tooltip>
                                )}
                              </>
                            );
                          })()}
                          <Button
                            size="sm"
                            variant="subtle"
                            onClick={() => handleEdit(customer)}
                            radius="md"
                            className="font-medium w-full"
                          >
                            Edit
                          </Button>
                        </div>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>

            {/* Mobile/Tablet card view */}
            <div className="lg:hidden space-y-4">
              {customers.map((customer) => {
                const phoneValid = isPhoneValid(customer.phone);
                const phoneError = getPhoneError(customer.phone);
                const phoneDisplay = formatPhone(customer.phone);

                return (
                  <Paper
                    key={customer.id}
                    p="md"
                    shadow="sm"
                    className={`bg-[#141414] border transition-colors sm:p-lg ${phoneValid ? 'border-[#2a2a2a] hover:border-[#333333]' : 'border-red-800/50'}`}
                  >
                    {/* Section 1: Customer Info */}
                    <div className="flex justify-between items-start mb-3 pb-3 border-b border-[#2a2a2a]">
                      <div className="flex-1">
                        <div className="font-semibold text-lg text-white mb-1">{customer.name}</div>
                        {customer.job_description && (
                          <div className="text-sm text-gray-300 mb-2">
                            {customer.job_description}
                          </div>
                        )}
                        <div className="text-sm text-gray-400 font-medium flex items-center gap-1.5">
                          <span className="flex items-center justify-center text-base leading-none">
                            {phoneDisplay.flag}
                          </span>
                          <span>{phoneDisplay.number}</span>
                        </div>
                        {!phoneValid && phoneError && (
                          <div className="text-xs text-red-400 mt-1 font-medium">{phoneError}</div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1.5 ml-2">
                        <Badge
                          color={
                            customer.sms_status === 'sent'
                              ? 'green'
                              : customer.sms_status === 'scheduled'
                                ? 'blue'
                                : 'orange'
                          }
                          size="md"
                          radius="md"
                        >
                          {customer.sms_status === 'sent'
                            ? 'Sent'
                            : customer.sms_status === 'scheduled'
                              ? 'Scheduled'
                              : 'Not Sent'}
                        </Badge>
                        {customer.sms_status === 'scheduled' &&
                          customer.scheduled_send_at &&
                          (canSchedule ? (
                            <Text size="xs" className="text-blue-400 text-right">
                              SMS scheduled{' '}
                              {new Date(customer.scheduled_send_at).toLocaleString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Text>
                          ) : (
                            <Tooltip label="Upgrade to Pro to schedule SMS">
                              <Text size="xs" className="text-teal-400 flex items-center gap-1">
                                <IconLock size={12} /> Pro Feature
                              </Text>
                            </Tooltip>
                          ))}
                      </div>
                    </div>

                    {/* Section 2: Activity Tracking */}
                    <div className="mb-3 pb-3 border-b border-[#2a2a2a]">
                      {customer.created_at && (
                        <div className="mb-2">
                          <div className="text-sm text-gray-400 font-medium mb-0.5">Added:</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1.5">
                            <span className="text-teal-400">•</span>
                            {new Date(customer.created_at).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        </div>
                      )}
                      {customer.messages && customer.messages.length > 0 && (
                        <div className="mb-2">
                          <div className="text-sm text-gray-400 font-medium mb-0.5">
                            Review Requests ({customer.messages.length}/3):
                          </div>
                          <div className="space-y-0.5">
                            {customer.messages.slice(0, 3).map((message, idx) => {
                              // Only show delivery status for messages with Twilio tracking (new messages)
                              // Old messages without twilio_message_sid won't show status icon
                              const hasTracking =
                                message.delivery_status !== null &&
                                message.delivery_status !== undefined;

                              // Determine delivery status icon and color
                              // Only show icons for sent, delivered, or failed states (not queued/sending)
                              const getDeliveryIcon = () => {
                                if (!hasTracking) {
                                  // Old message - no status icon
                                  return null;
                                }

                                const status = message.delivery_status?.toLowerCase() || '';

                                if (status === 'delivered') {
                                  return (
                                    <Tooltip label="Delivered successfully">
                                      <IconCheck size={14} className="text-green-400" />
                                    </Tooltip>
                                  );
                                } else if (status === 'failed' || status === 'undelivered') {
                                  return (
                                    <Tooltip
                                      label={`Failed: ${message.delivery_error_message || 'Unknown error'}`}
                                    >
                                      <IconX size={14} className="text-red-400" />
                                    </Tooltip>
                                  );
                                } else if (status === 'sent') {
                                  return (
                                    <Tooltip label="Sent, awaiting delivery">
                                      <IconCheck size={14} className="text-blue-400" />
                                    </Tooltip>
                                  );
                                }

                                // Don't show icon for queued, sending, or unknown states
                                return null;
                              };

                              const deliveryIcon = getDeliveryIcon();

                              return (
                                <div
                                  key={idx}
                                  className="text-sm text-gray-500 flex items-center gap-1.5"
                                >
                                  {deliveryIcon}
                                  {new Date(message.sent_at).toLocaleDateString('en-GB', {
                                    day: 'numeric',
                                    month: 'short',
                                  })}
                                  ,{' '}
                                  {new Date(message.sent_at).toLocaleTimeString('en-GB', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                  {message.was_scheduled && (
                                    <Tooltip label="Sent via scheduled automation">
                                      <IconClock size={14} className="text-blue-400" />
                                    </Tooltip>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {(() => {
                        // Calculate days since last contact
                        let daysSinceContact: number | null = null;
                        if (customer.sent_at) {
                          const lastContacted = new Date(customer.sent_at);
                          const now = new Date();
                          daysSinceContact = Math.floor(
                            (now.getTime() - lastContacted.getTime()) / (1000 * 60 * 60 * 24)
                          );
                        } else if (customer.created_at) {
                          const created = new Date(customer.created_at);
                          const now = new Date();
                          daysSinceContact = Math.floor(
                            (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
                          );
                        }

                        // Only show warning if no request has been sent AND it's been 5+ days
                        const showContactWarning =
                          !customer.sent_at && daysSinceContact !== null && daysSinceContact >= 5;

                        return showContactWarning ? (
                          <div
                            className={`text-xs ${
                              daysSinceContact! >= 30
                                ? 'text-red-400'
                                : daysSinceContact! >= 10
                                  ? 'text-orange-400'
                                  : 'text-yellow-400'
                            }`}
                          >
                            {daysSinceContact}d ago. No request sent.
                          </div>
                        ) : null;
                      })()}
                      {(() => {
                        const requestCount = customer.sms_request_count || 0;
                        const isOptedOut = customer.opt_out || false;
                        const isLimitReached = requestCount >= 3;

                        return isLimitReached || isOptedOut ? (
                          <details className="mt-2">
                            <summary
                              className={`text-sm cursor-pointer list-none flex items-center justify-between p-2 rounded ${
                                isOptedOut
                                  ? 'bg-red-900/20 text-red-400'
                                  : 'bg-yellow-900/20 text-yellow-400'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <IconAlertCircle size={16} />
                                <span className="font-medium">
                                  {isOptedOut ? 'Opted Out' : `Limit Reached (${requestCount}/3)`}
                                </span>
                              </div>
                              <span className="text-xs opacity-70 underline">Learn more</span>
                            </summary>
                            <div
                              className={`text-sm mt-2 p-2 rounded ${
                                isOptedOut
                                  ? 'bg-red-900/10 text-gray-300'
                                  : 'bg-yellow-900/10 text-gray-300'
                              }`}
                            >
                              {isOptedOut
                                ? 'This customer has opted out of receiving SMS messages.'
                                : 'Maximum of 3 review requests reached. No more messages can be sent to this customer. This limit helps maintain good customer relationships and comply with SMS regulations.'}
                            </div>
                          </details>
                        ) : null;
                      })()}
                    </div>

                    {/* Section 3: Action Buttons */}
                    <div className="flex justify-between items-center gap-2">
                      <Button
                        size="xs"
                        variant="subtle"
                        onClick={() => handleEdit(customer)}
                        radius="md"
                        className="font-medium flex items-center justify-center"
                      >
                        Edit
                      </Button>
                      <div className="flex flex-col gap-2">
                        {(() => {
                          const requestCount = customer.sms_request_count || 0;
                          const isOptedOut = customer.opt_out || false;
                          const isLimitReached = requestCount >= 3;
                          const isSending = sendingCustomerId === customer.id;
                          const isDisabled =
                            paymentLoading ||
                            !hasPaid ||
                            !phoneValid ||
                            isOptedOut ||
                            isLimitReached ||
                            isSending;

                          const getButtonText = () => {
                            if (isLimitReached) return 'Limit Reached (3/3)';
                            if (isOptedOut) return 'Opted Out';
                            if (isSending) return 'Sending...';
                            const countText = requestCount > 0 ? ` (${requestCount}/3)` : '';
                            return customer.sms_status === 'sent'
                              ? `Request Review Again${countText}`
                              : `Request Review${countText}`;
                          };

                          const getTooltip = () => {
                            if (paymentLoading) return 'Loading payment status...';
                            if (!hasPaid) return 'Payment required to send SMS messages';
                            if (!phoneValid) return phoneError || 'Invalid phone number';
                            if (isOptedOut)
                              return 'This customer has opted out of receiving messages';
                            if (isLimitReached)
                              return 'Maximum of 3 review requests allowed per customer. Limit reached.';
                            return '';
                          };

                          return (
                            <>
                              {canSchedule && customer.sms_status === 'scheduled' && (
                                <Button
                                  size="sm"
                                  variant="light"
                                  onClick={() => handleOpenScheduleModal(customer)}
                                  radius="md"
                                  className="font-medium"
                                  leftSection={<IconCalendar size={16} />}
                                >
                                  Edit Schedule
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant={customer.sms_status === 'sent' ? 'light' : 'filled'}
                                onClick={() =>
                                  customer.sms_status === 'scheduled'
                                    ? handleSendNow(customer)
                                    : handleRequestReview(customer.id)
                                }
                                radius="md"
                                className="font-medium"
                                disabled={isDisabled}
                                loading={isSending}
                                title={getTooltip()}
                              >
                                {customer.sms_status === 'scheduled' ? 'Send Now' : getButtonText()}
                              </Button>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </Paper>
                );
              })}
            </div>
          </>
        )}

        {total > limit && (
          <div className="mt-6 flex justify-center">
            <Pagination value={page} onChange={setPage} total={Math.ceil(total / limit)} />
          </div>
        )}

        {/* Edit Customer Modal */}
        <Modal
          opened={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setEditingCustomer(null);
            setSelectedCountry('GB');
            countryRef.current = 'GB';
            editForm.reset();
          }}
          title="Edit Customer"
          size="md"
          className="modal-mobile-fullscreen"
          classNames={{
            body: 'p-0',
          }}
        >
          <form onSubmit={editForm.onSubmit(handleSaveEdit)}>
            <Stack gap="md">
              <TextInput
                label="Name"
                placeholder="Customer Name"
                required
                {...editForm.getInputProps('name')}
              />

              <div>
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
                  value={editForm.values.phoneNumber}
                  onChange={(value) => {
                    editForm.setFieldValue('phoneNumber', value || '');
                    // NO auto-detection - country is only changed by user via dropdown
                    // Validate immediately when typing - use current country from ref
                    const validation = validatePhoneNumber(
                      value,
                      countryRef.current as CountryCode | undefined
                    );
                    if (!validation.isValid) {
                      setPhoneError(validation.error || 'Invalid phone number');
                      editForm.setFieldError(
                        'phoneNumber',
                        validation.error || 'Invalid phone number'
                      );
                    } else {
                      setPhoneError(null);
                      editForm.setFieldError('phoneNumber', null);
                    }
                    editForm.validateField('phoneNumber');
                  }}
                  onCountryChange={(country) => {
                    // Update country in both state and ref FIRST
                    setSelectedCountry(country);
                    countryRef.current = country;

                    // Always validate when country changes if there's a phone number
                    if (country && editForm.values.phoneNumber) {
                      // Re-validate the existing number with the new country immediately
                      const validation = validatePhoneNumber(
                        editForm.values.phoneNumber,
                        country as CountryCode | undefined
                      );
                      if (!validation.isValid) {
                        setPhoneError(validation.error || 'Invalid phone number');
                        // Also set form error
                        editForm.setFieldError(
                          'phoneNumber',
                          validation.error || 'Invalid phone number'
                        );
                      } else {
                        // Clear error if number is valid for the new country
                        setPhoneError(null);
                        editForm.setFieldError('phoneNumber', null);
                      }
                      // Force re-validation to ensure form state is updated with new country
                      setTimeout(() => {
                        editForm.validateField('phoneNumber');
                      }, 0);
                    } else if (country) {
                      // New country selected but no phone number - clear any errors
                      setPhoneError(null);
                      editForm.setFieldError('phoneNumber', null);
                    } else {
                      // No country selected - clear errors
                      setPhoneError(null);
                      editForm.setFieldError('phoneNumber', null);
                    }
                  }}
                  error={phoneError}
                  defaultCountry={selectedCountry || 'GB'}
                  key={`phone-edit-${editingCustomer?.id}-${selectedCountry}`}
                />
              </div>

              <Textarea
                label="Job Description (Optional)"
                placeholder="Brief description of the work done"
                rows={3}
                maxLength={250}
                {...editForm.getInputProps('jobDescription')}
                description={`${editForm.values.jobDescription.length}/250 characters`}
              />

              {canSchedule && editingCustomer?.sms_status !== 'sent' && (
                <div>
                  <DateTimePicker
                    label="Schedule SMS Request (Optional)"
                    placeholder="Select date and time"
                    value={
                      editingCustomer?.scheduled_send_at
                        ? new Date(editingCustomer.scheduled_send_at)
                        : null
                    }
                    onChange={(date) => {
                      if (editingCustomer) {
                        setEditingCustomer({
                          ...editingCustomer,
                          scheduled_send_at: date ? date.toISOString() : undefined,
                        });
                      }
                    }}
                    minDate={new Date()}
                    clearable
                    className="w-full"
                    valueFormat="Do MMM YYYY, HH:mm"
                    description="Leave empty to save for manual send later"
                  />
                  {editingCustomer?.scheduled_send_at && (
                    <Text size="xs" className="text-blue-400 mt-1">
                      SMS will be sent automatically at the scheduled time
                    </Text>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-3 pt-4 border-t border-[#2a2a2a]">
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="subtle"
                    onClick={() => {
                      setEditModalOpen(false);
                      setEditingCustomer(null);
                      editForm.reset();
                    }}
                    className="flex-1"
                    disabled={saving || deleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={saving}
                    className="flex-1 font-semibold"
                    disabled={deleting}
                  >
                    Save
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="light"
                  color="red"
                  onClick={() => {
                    setEditModalOpen(false);
                    setDeleteConfirmOpen(true);
                  }}
                  className="w-full"
                  disabled={saving || deleting}
                  leftSection={<IconTrash size={16} />}
                >
                  Delete Customer
                </Button>
              </div>
            </Stack>
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          opened={deleteConfirmOpen}
          onClose={() => !deleting && setDeleteConfirmOpen(false)}
          title="Delete Customer"
          size="md"
          centered
          classNames={{
            body: 'p-0',
          }}
        >
          <Stack gap="md">
            <Text size="sm" className="text-gray-300">
              Are you sure you want to delete <strong>{editingCustomer?.name}</strong>? This action
              cannot be undone.
            </Text>
            <div className="flex gap-3 pt-4">
              <Button
                variant="subtle"
                onClick={() => setDeleteConfirmOpen(false)}
                className="flex-1"
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                color="red"
                onClick={handleDelete}
                loading={deleting}
                className="flex-1 font-semibold"
              >
                Delete
              </Button>
            </div>
          </Stack>
        </Modal>

        {/* Schedule SMS Modal */}
        <Modal
          opened={scheduleModalOpen}
          onClose={() => !updatingSchedule && setScheduleModalOpen(false)}
          title="Schedule SMS Request"
          size="md"
          centered
          classNames={{
            body: 'p-0',
          }}
        >
          <Stack gap="md">
            <Text size="sm" className="text-gray-300">
              {schedulingCustomer && (
                <>
                  Schedule a review request for <strong>{schedulingCustomer.name}</strong>
                </>
              )}
            </Text>

            <DateTimePicker
              label="Send At"
              placeholder="Select date and time"
              value={scheduledDateTime}
              onChange={setScheduledDateTime}
              minDate={new Date()}
              clearable
              className="w-full"
              valueFormat="Do MMM YYYY, HH:mm"
            />

            <Alert color="blue" icon={<IconClock size={16} />}>
              <Text size="xs">
                {scheduledDateTime
                  ? `SMS will be sent automatically at ${scheduledDateTime.toLocaleString()}`
                  : 'Clear the date to remove the schedule'}
              </Text>
            </Alert>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                variant="subtle"
                onClick={() => setScheduleModalOpen(false)}
                fullWidth
                disabled={updatingSchedule}
                size="lg"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateSchedule}
                loading={updatingSchedule}
                fullWidth
                className="font-semibold"
                size="lg"
              >
                {scheduledDateTime ? 'Update Schedule' : 'Clear Schedule'}
              </Button>
            </div>
          </Stack>
        </Modal>

        {/* Consent Confirmation Modal */}
        <Modal
          opened={consentModalOpen}
          onClose={() => {
            if (!sendingCustomerId) {
              setConsentModalOpen(false);
              setConsentConfirmed(false);
              setPendingCustomerId(null);
            }
          }}
          title={<Text className="text-white font-semibold text-lg">Confirm Permission</Text>}
          centered
          styles={{
            content: {
              backgroundColor: '#1a1a1a',
              border: '1px solid #2a2a2a',
            },
            header: {
              backgroundColor: '#1a1a1a',
              borderBottom: '1px solid #2a2a2a',
            },
            close: {
              color: '#fff',
              '&:hover': {
                backgroundColor: '#2a2a2a',
              },
            },
          }}
        >
          <Stack gap="md">
            <Text size="sm" className="text-gray-300">
              Before sending an SMS review request, please confirm you have obtained permission from
              the customer to send them SMS messages, as required by the Terms and Conditions.
            </Text>
            <Checkbox
              label={
                <Text size="sm" className="text-gray-300">
                  I confirm I have permission to send SMS to this person as stated in the Terms and
                  Conditions
                </Text>
              }
              checked={consentConfirmed}
              onChange={(e) => setConsentConfirmed(e.currentTarget.checked)}
              styles={{
                label: {
                  cursor: 'pointer',
                },
              }}
            />
            <div className="flex gap-3 mt-4">
              <Button
                variant="light"
                color="gray"
                onClick={() => {
                  setConsentModalOpen(false);
                  setConsentConfirmed(false);
                  setPendingCustomerId(null);
                }}
                disabled={!!sendingCustomerId}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="filled"
                color="teal"
                onClick={() => {
                  if (pendingCustomerId) {
                    handleSendAgain(pendingCustomerId);
                  }
                }}
                disabled={!consentConfirmed || !!sendingCustomerId}
                loading={!!sendingCustomerId}
                className="flex-1"
              >
                Send SMS
              </Button>
            </div>
          </Stack>
        </Modal>
      </Stack>
    </PageContainer>
  );
};
