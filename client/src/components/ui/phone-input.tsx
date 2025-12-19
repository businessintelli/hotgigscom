/**
 * PhoneInput component with automatic formatting and validation
 * Supports international phone numbers
 */

import * as React from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";
import { validatePhoneNumber, formatPhoneNumberAsYouType, type PhoneValidationResult } from "@shared/phoneValidation";
import type { CountryCode } from "libphonenumber-js";

export interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string;
  onChange?: (value: string, validation: PhoneValidationResult) => void;
  onValidationChange?: (validation: PhoneValidationResult) => void;
  defaultCountry?: CountryCode;
  showValidation?: boolean;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ 
    className, 
    value = '', 
    onChange, 
    onValidationChange,
    defaultCountry = 'US',
    showValidation = true,
    ...props 
  }, ref) => {
    const [internalValue, setInternalValue] = React.useState(value);
    const [validation, setValidation] = React.useState<PhoneValidationResult>({ isValid: true });
    const [isTouched, setIsTouched] = React.useState(false);

    // Update internal value when prop changes
    React.useEffect(() => {
      setInternalValue(value);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInternalValue(newValue);
      
      // Validate the phone number
      const validationResult = validatePhoneNumber(newValue, defaultCountry);
      setValidation(validationResult);
      
      // Call callbacks
      if (onChange) {
        onChange(newValue, validationResult);
      }
      if (onValidationChange) {
        onValidationChange(validationResult);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsTouched(true);
      
      // Format the number on blur if valid
      if (validation.isValid && validation.formatted) {
        setInternalValue(validation.formatted);
        if (onChange) {
          onChange(validation.formatted, validation);
        }
      }
      
      if (props.onBlur) {
        props.onBlur(e);
      }
    };

    const showError = showValidation && isTouched && !validation.isValid && internalValue.length > 0;

    return (
      <div className="space-y-1">
        <Input
          ref={ref}
          type="tel"
          value={internalValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className={cn(
            showError && "border-destructive focus-visible:ring-destructive",
            className
          )}
          placeholder="+1 (555) 123-4567"
          {...props}
        />
        {showError && validation.error && (
          <p className="text-sm text-destructive">{validation.error}</p>
        )}
        {showValidation && validation.isValid && validation.country && isTouched && (
          <p className="text-sm text-muted-foreground">
            {validation.country} • {validation.international}
          </p>
        )}
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
