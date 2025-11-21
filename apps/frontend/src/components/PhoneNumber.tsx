import { forwardRef, useState, useEffect } from 'react';
import { TextInput, Select, Stack, TextInputProps } from '@mantine/core';
import { CountryCode, getCountryCallingCode } from 'libphonenumber-js';
import { validatePhoneNumber } from '@/lib/phone-validation';

// Country list with flags and names
const COUNTRIES: Array<{ value: CountryCode; label: string; flag: string }> = [
  { value: 'GB', label: 'United Kingdom', flag: '🇬🇧' },
  { value: 'IE', label: 'Ireland', flag: '🇮🇪' },
  { value: 'US', label: 'United States', flag: '🇺🇸' },
  { value: 'CA', label: 'Canada', flag: '🇨🇦' },
  { value: 'AU', label: 'Australia', flag: '🇦🇺' },
  { value: 'NZ', label: 'New Zealand', flag: '🇳🇿' },
  { value: 'FR', label: 'France', flag: '🇫🇷' },
  { value: 'DE', label: 'Germany', flag: '🇩🇪' },
  { value: 'ES', label: 'Spain', flag: '🇪🇸' },
  { value: 'IT', label: 'Italy', flag: '🇮🇹' },
  { value: 'NL', label: 'Netherlands', flag: '🇳🇱' },
  { value: 'BE', label: 'Belgium', flag: '🇧🇪' },
  { value: 'CH', label: 'Switzerland', flag: '🇨🇭' },
  { value: 'AT', label: 'Austria', flag: '🇦🇹' },
  { value: 'SE', label: 'Sweden', flag: '🇸🇪' },
  { value: 'NO', label: 'Norway', flag: '🇳🇴' },
  { value: 'DK', label: 'Denmark', flag: '🇩🇰' },
  { value: 'FI', label: 'Finland', flag: '🇫🇮' },
  { value: 'PL', label: 'Poland', flag: '🇵🇱' },
  { value: 'PT', label: 'Portugal', flag: '🇵🇹' },
];

interface PhoneNumberProps extends Omit<TextInputProps, 'onChange' | 'value'> {
  value?: string;
  onChange?: (value: string | undefined) => void;
  onCountryChange?: (country: CountryCode | undefined) => void;
  defaultCountry?: CountryCode;
  country?: CountryCode; // Controlled country prop
}

export const PhoneNumber = forwardRef<HTMLInputElement, PhoneNumberProps>(
  (
    {
      value,
      onChange,
      onCountryChange,
      defaultCountry = 'GB',
      country: controlledCountry,
      error,
      label,
      description,
      ...props
    },
    ref
  ) => {
    // Use controlled country if provided, otherwise use internal state
    const [internalCountry, setInternalCountry] = useState<CountryCode>(defaultCountry);
    const country = controlledCountry !== undefined ? controlledCountry : internalCountry;
    const [phoneValue, setPhoneValue] = useState<string>(value || '');

    // Update phone value when value prop changes (e.g., when editing)
    useEffect(() => {
      setPhoneValue(value || '');
    }, [value]);

    // Update country when defaultCountry prop changes (e.g., when editing a customer)
    useEffect(() => {
      if (defaultCountry && controlledCountry === undefined) {
        setInternalCountry(defaultCountry);
        onCountryChange?.(defaultCountry);
      }
    }, [defaultCountry, onCountryChange, controlledCountry]);

    // Sync internal state when controlled country changes
    useEffect(() => {
      if (controlledCountry !== undefined && controlledCountry !== country) {
        setInternalCountry(controlledCountry);
      }
    }, [controlledCountry]);

    const handleCountryChange = (newCountry: string | null) => {
      if (newCountry) {
        const countryCode = newCountry as CountryCode;
        // Only update internal state if not controlled
        if (controlledCountry === undefined) {
          setInternalCountry(countryCode);
        }
        // Always notify parent
        onCountryChange?.(countryCode);

        // Re-validate the phone number with the new country
        if (phoneValue) {
          const validation = validatePhoneNumber(phoneValue, countryCode);
          if (!validation.isValid && onChange) {
            // Trigger onChange to update parent's validation state
            onChange(phoneValue);
          }
        }
      }
    };

    const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      setPhoneValue(newValue);
      onChange?.(newValue || undefined);
    };

    const selectedCountry = COUNTRIES.find((c) => c.value === country);

    return (
      <Stack gap="xs">
        <Select
          data={COUNTRIES.map((c) => ({
            value: c.value,
            label: `${c.flag} ${c.label}`,
          }))}
          value={country}
          onChange={handleCountryChange}
          placeholder="Select country"
          searchable
          label={label}
        />
        <TextInput
          ref={ref}
          value={phoneValue}
          onChange={handlePhoneChange}
          placeholder="Enter local phone number"
          error={error}
          {...props}
        />
        {description && <div className="text-xs text-gray-400">{description}</div>}
        {selectedCountry && !phoneValue && !error && (
          <div className="text-xs text-gray-400">
            Enter the local phone number (e.g., 07782385414 for UK). The country code (+
            {getCountryCallingCode(country)}) will be added automatically.
          </div>
        )}
      </Stack>
    );
  }
);

PhoneNumber.displayName = 'PhoneNumber';
