import { useEffect, useState, useRef } from 'react';
import {
  Paper,
  Title,
  Table,
  Button,
  Select,
  Pagination,
  Badge,
  Loader,
  Modal,
  TextInput,
  Textarea,
  Stack,
  Alert,
  Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useForm } from '@mantine/form';
import { CountryCode } from 'libphonenumber-js';
import { apiClient } from '@/lib/api';
import type { Customer } from '@/types';
import { PhoneNumber } from '@/components/PhoneNumber';
import {
  validatePhoneNumber,
  formatPhoneNumberForApi,
  detectCountryFromPhoneNumber,
} from '@/lib/phone-validation';
import { parsePhoneNumberFromString, isValidPhoneNumber } from 'libphonenumber-js';
import { usePayment } from '@/contexts/PaymentContext';
import { IconAlertCircle } from '@tabler/icons-react';

export const CustomerList = () => {
  const { hasPaid } = usePayment();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [total, setTotal] = useState(0);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const limit = 10;

  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode | undefined>('GB');
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

  useEffect(() => {
    loadCustomers();
  }, [page, statusFilter, searchQuery]);

  const loadCustomers = async () => {
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

      // Apply search filter
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        filtered = filtered.filter(
          (c) =>
            c.name.toLowerCase().includes(query) ||
            (c.job_description && c.job_description.toLowerCase().includes(query))
        );
      }

      // Apply pagination
      const start = (page - 1) * limit;
      const end = start + limit;
      setCustomers(filtered.slice(start, end));
      setTotal(filtered.length);
      setLoading(false);
      return;
    }

    try {
      const data = await apiClient.getCustomers({
        page,
        limit,
        status: statusFilter as 'sent' | 'pending' | undefined,
      });

      // Apply search filter on client side
      let filtered = data.customers;
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        filtered = data.customers.filter(
          (c) =>
            c.name.toLowerCase().includes(query) ||
            (c.job_description && c.job_description.toLowerCase().includes(query))
        );
      }

      setCustomers(filtered);
      setTotal(filtered.length);
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to load customers',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    // Log the complete customer object as it comes from/goes to the DB
    console.log('=== CUSTOMER DATA (Full Object) ===');
    console.log('Complete Customer Object:', {
      id: customer.id,
      user_id: customer.user_id,
      name: customer.name,
      phone: {
        countryCode: customer.phone.countryCode,
        country: customer.phone.country,
        number: customer.phone.number,
      },
      job_description: customer.job_description,
      sms_status: customer.sms_status,
      sent_at: customer.sent_at,
    });
    console.log('Raw customer object:', customer);
    console.log('=== END CUSTOMER DATA ===');
    console.log('Country code:', customer.phone.countryCode);
    console.log('Phone number:', customer.phone.number);

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
    console.log('Auto-detected country:', countryToUse);
    console.log('Setting selectedCountry to:', countryToUse);
    setSelectedCountry(countryToUse);
    countryRef.current = countryToUse;
    console.log('selectedCountry state set, countryRef.current set to:', countryRef.current);

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
        jobDescription: values.jobDescription || undefined,
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
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to update customer',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSendAgain = async (customerId: string) => {
    if (!hasPaid) {
      notifications.show({
        title: 'Payment Required',
        message: 'Please set up your payment method to send SMS messages.',
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

    try {
      await apiClient.sendSMS(customerId);
      notifications.show({
        title: 'Success',
        message: 'SMS sent successfully',
        color: 'green',
      });
      loadCustomers();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to send SMS',
        color: 'red',
      });
    }
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

  const formatDate = (dateString?: string) => {
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

    return `${day}${getOrdinalSuffix(day)} ${month} ${year}`;
  };

  return (
    <Paper shadow="md" p="md" className="w-full sm:p-xl">
      <div className="flex flex-col gap-6 mb-8 pb-6 border-b border-[#2a2a2a]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <Title order={2} className="text-2xl sm:text-3xl font-bold mb-2 text-white">
              Customer List
            </Title>
            <p className="text-sm text-gray-400 hidden sm:block">
              Manage your customers and review requests
            </p>
          </div>
          {!hasPaid && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              title="Payment Required"
              color="yellow"
              className="sm:col-span-2"
            >
              <Text size="sm" className="text-gray-300">
                You can add and manage customers, but you need to set up payment to send SMS
                messages.
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
          <Select
            placeholder="Filter by status"
            data={[
              { value: '', label: 'All' },
              { value: 'sent', label: 'Sent' },
              { value: 'pending', label: 'Not Sent' },
            ]}
            value={statusFilter || ''}
            onChange={(value) => {
              setStatusFilter(value || null);
              setPage(1);
            }}
            clearable
            className="w-full sm:w-48"
            size="md"
          />
        </div>
        <TextInput
          placeholder="Search by name or job description..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-96"
          size="md"
        />
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader color="teal" />
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
                    <Table.Td className="text-gray-400">{customer.job_description || '-'}</Table.Td>
                    <Table.Td>
                      <Badge color={customer.sms_status === 'sent' ? 'green' : 'orange'}>
                        {customer.sms_status === 'sent' ? 'Sent' : 'Not Sent'}
                      </Badge>
                    </Table.Td>
                    <Table.Td className="text-gray-400">{formatDate(customer.sent_at)}</Table.Td>
                    <Table.Td>
                      <div className="flex items-center gap-2">
                        <Button
                          size="xs"
                          variant="subtle"
                          onClick={() => handleEdit(customer)}
                          radius="md"
                          className="font-medium flex items-center justify-center"
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant={customer.sms_status === 'sent' ? 'light' : 'filled'}
                          onClick={() => handleSendAgain(customer.id)}
                          radius="md"
                          className="font-medium"
                          disabled={!isPhoneValid(customer.phone)}
                          title={
                            !isPhoneValid(customer.phone)
                              ? getPhoneError(customer.phone) || 'Invalid phone number'
                              : ''
                          }
                        >
                          {customer.sms_status === 'sent'
                            ? 'Request Review Again'
                            : 'Request Review'}
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
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="font-semibold text-lg text-white mb-1">{customer.name}</div>
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
                        color={customer.sms_status === 'sent' ? 'green' : 'orange'}
                        size="md"
                        radius="md"
                      >
                        {customer.sms_status === 'sent' ? 'Sent' : 'Not Sent'}
                      </Badge>
                      {customer.sent_at && (
                        <div className="text-xs text-gray-500 font-medium">
                          {formatDate(customer.sent_at)}
                        </div>
                      )}
                    </div>
                  </div>
                  {customer.job_description && (
                    <div className="text-sm text-gray-300 mb-4 p-4 bg-[#2a2a2a]/50 rounded-lg border border-[#2a2a2a]">
                      {customer.job_description}
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-4 border-t border-[#2a2a2a]">
                    <Button
                      size="xs"
                      variant="subtle"
                      onClick={() => handleEdit(customer)}
                      radius="md"
                      className="font-medium flex items-center justify-center"
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant={customer.sms_status === 'sent' ? 'light' : 'filled'}
                      onClick={() => handleSendAgain(customer.id)}
                      radius="md"
                      className="font-medium"
                      disabled={!phoneValid}
                      title={!phoneValid ? phoneError || 'Invalid phone number' : ''}
                    >
                      {customer.sms_status === 'sent' ? 'Request Review Again' : 'Request Review'}
                    </Button>
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
                Phone Number <span className="text-red-400">*</span>
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
              {/* Debug log */}
              {(() => {
                console.log(
                  '[EditModal] Rendering PhoneNumber with defaultCountry:',
                  selectedCountry || 'GB',
                  'selectedCountry state:',
                  selectedCountry
                );
                return null;
              })()}
            </div>

            <Textarea
              label="Job Description (Optional)"
              placeholder="Brief description of the work done"
              rows={3}
              {...editForm.getInputProps('jobDescription')}
            />

            <div className="flex gap-3 pt-4 border-t border-[#2a2a2a]">
              <Button
                type="button"
                variant="subtle"
                onClick={() => {
                  setEditModalOpen(false);
                  setEditingCustomer(null);
                  editForm.reset();
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" loading={saving} className="flex-1 font-semibold">
                Save
              </Button>
            </div>
          </Stack>
        </form>
      </Modal>
    </Paper>
  );
};
