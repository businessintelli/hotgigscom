import { useState } from 'react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface PhoneInputWithCountryProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Enhanced phone input component with country code dropdown
 * Features:
 * - Searchable country code dropdown with flags
 * - Auto-formatting based on country
 * - Validation for phone number format
 * - International format (E.164)
 */
export function PhoneInputWithCountry({
  value,
  onChange,
  label = 'Phone Number',
  placeholder = 'Enter phone number',
  error,
  required = false,
  disabled = false,
  className,
}: PhoneInputWithCountryProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <div className="relative">
        <PhoneInput
          international
          defaultCountry="US"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background',
            'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'md:text-sm',
            error && 'border-destructive focus-visible:ring-destructive',
            focused && !error && 'ring-2 ring-ring ring-offset-2'
          )}
        />
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <p className="text-xs text-muted-foreground">
        Include country code (e.g., +1 for US, +44 for UK)
      </p>
    </div>
  );
}
