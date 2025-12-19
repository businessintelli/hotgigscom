/**
 * Phone number validation and formatting utilities using libphonenumber-js
 * Supports international phone numbers with automatic formatting
 */

import { parsePhoneNumber, isValidPhoneNumber, CountryCode } from 'libphonenumber-js';

export interface PhoneValidationResult {
  isValid: boolean;
  formatted?: string;
  international?: string;
  national?: string;
  country?: string;
  error?: string;
}

/**
 * Validate and parse a phone number
 * @param phoneNumber - The phone number to validate
 * @param defaultCountry - Default country code (e.g., 'US', 'CA', 'GB')
 * @returns Validation result with formatted numbers if valid
 */
export function validatePhoneNumber(
  phoneNumber: string,
  defaultCountry: CountryCode = 'US'
): PhoneValidationResult {
  if (!phoneNumber || phoneNumber.trim() === '') {
    return {
      isValid: false,
      error: 'Phone number is required',
    };
  }

  try {
    // Try to parse with default country first
    const parsed = parsePhoneNumber(phoneNumber, defaultCountry);
    
    if (!parsed) {
      // Try without country code
      if (isValidPhoneNumber(phoneNumber)) {
        const parsedWithoutCountry = parsePhoneNumber(phoneNumber);
        if (parsedWithoutCountry) {
          return {
            isValid: true,
            formatted: parsedWithoutCountry.formatInternational(),
            international: parsedWithoutCountry.formatInternational(),
            national: parsedWithoutCountry.formatNational(),
            country: parsedWithoutCountry.country,
          };
        }
      }
      
      return {
        isValid: false,
        error: 'Invalid phone number format',
      };
    }

    // Check if the parsed number is valid
    if (!parsed.isValid()) {
      return {
        isValid: false,
        error: 'Invalid phone number',
      };
    }

    return {
      isValid: true,
      formatted: parsed.formatInternational(),
      international: parsed.formatInternational(),
      national: parsed.formatNational(),
      country: parsed.country,
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Invalid phone number',
    };
  }
}

/**
 * Format a phone number for display
 * @param phoneNumber - The phone number to format
 * @param defaultCountry - Default country code
 * @param format - Format type: 'international' | 'national'
 * @returns Formatted phone number or original if invalid
 */
export function formatPhoneNumber(
  phoneNumber: string,
  defaultCountry: CountryCode = 'US',
  format: 'international' | 'national' = 'international'
): string {
  const result = validatePhoneNumber(phoneNumber, defaultCountry);
  
  if (!result.isValid) {
    return phoneNumber; // Return original if invalid
  }

  return format === 'international' ? result.international! : result.national!;
}

/**
 * Format phone number as user types (for input fields)
 * @param value - Current input value
 * @param defaultCountry - Default country code
 * @returns Formatted value
 */
export function formatPhoneNumberAsYouType(
  value: string,
  defaultCountry: CountryCode = 'US'
): string {
  // Remove all non-digit characters except + at the start
  const cleaned = value.replace(/[^\d+]/g, '');
  
  if (cleaned.length === 0) {
    return '';
  }

  try {
    const parsed = parsePhoneNumber(cleaned, defaultCountry);
    if (parsed) {
      return parsed.formatInternational();
    }
  } catch {
    // If parsing fails, return cleaned input
  }

  return cleaned;
}

/**
 * Check if a phone number is valid (simple boolean check)
 * @param phoneNumber - The phone number to check
 * @param defaultCountry - Default country code
 * @returns true if valid, false otherwise
 */
export function isPhoneNumberValid(
  phoneNumber: string,
  defaultCountry: CountryCode = 'US'
): boolean {
  return validatePhoneNumber(phoneNumber, defaultCountry).isValid;
}

/**
 * Extract country code from phone number
 * @param phoneNumber - The phone number
 * @param defaultCountry - Default country code
 * @returns Country code or undefined
 */
export function getPhoneCountryCode(
  phoneNumber: string,
  defaultCountry: CountryCode = 'US'
): string | undefined {
  const result = validatePhoneNumber(phoneNumber, defaultCountry);
  return result.country;
}

/**
 * Common country codes for dropdown selection
 */
export const COMMON_COUNTRIES: { code: CountryCode; name: string; dialCode: string }[] = [
  { code: 'US', name: 'United States', dialCode: '+1' },
  { code: 'CA', name: 'Canada', dialCode: '+1' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44' },
  { code: 'AU', name: 'Australia', dialCode: '+61' },
  { code: 'IN', name: 'India', dialCode: '+91' },
  { code: 'DE', name: 'Germany', dialCode: '+49' },
  { code: 'FR', name: 'France', dialCode: '+33' },
  { code: 'JP', name: 'Japan', dialCode: '+81' },
  { code: 'CN', name: 'China', dialCode: '+86' },
  { code: 'BR', name: 'Brazil', dialCode: '+55' },
  { code: 'MX', name: 'Mexico', dialCode: '+52' },
  { code: 'ES', name: 'Spain', dialCode: '+34' },
  { code: 'IT', name: 'Italy', dialCode: '+39' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31' },
  { code: 'SE', name: 'Sweden', dialCode: '+46' },
  { code: 'NO', name: 'Norway', dialCode: '+47' },
  { code: 'DK', name: 'Denmark', dialCode: '+45' },
  { code: 'FI', name: 'Finland', dialCode: '+358' },
  { code: 'PL', name: 'Poland', dialCode: '+48' },
  { code: 'RU', name: 'Russia', dialCode: '+7' },
];
