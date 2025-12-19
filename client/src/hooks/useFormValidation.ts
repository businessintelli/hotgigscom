import { useState, useCallback, useEffect } from 'react';

/**
 * Hook for real-time form field validation with debouncing
 */
export function useFieldValidation(
  value: string,
  validator: (value: string) => string | null,
  debounceMs: number = 500
) {
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!touched) return;

    const timer = setTimeout(() => {
      const validationError = validator(value);
      setError(validationError);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, validator, debounceMs, touched]);

  const handleBlur = useCallback(() => {
    setTouched(true);
    const validationError = validator(value);
    setError(validationError);
  }, [value, validator]);

  const handleChange = useCallback((newValue: string) => {
    setTouched(true);
    // Clear error immediately on change, will re-validate after debounce
    setError(null);
  }, []);

  return {
    error,
    touched,
    handleBlur,
    handleChange,
    setError,
  };
}

/**
 * Hook for managing form-level validation state
 */
export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  validators: Partial<Record<keyof T, (value: any) => string | null>>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const validateField = useCallback(
    (field: keyof T, value: any) => {
      const validator = validators[field];
      if (!validator) return null;
      return validator(value);
    },
    [validators]
  );

  const validateAll = useCallback(() => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let hasErrors = false;

    Object.keys(validators).forEach((field) => {
      const error = validateField(field as keyof T, values[field as keyof T]);
      if (error) {
        newErrors[field as keyof T] = error;
        hasErrors = true;
      }
    });

    setErrors(newErrors);
    return !hasErrors;
  }, [values, validators, validateField]);

  const handleChange = useCallback(
    (field: keyof T, value: any) => {
      setValues((prev) => ({ ...prev, [field]: value }));
      setTouched((prev) => ({ ...prev, [field]: true }));

      // Clear error immediately, will re-validate on blur
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    },
    []
  );

  const handleBlur = useCallback(
    (field: keyof T) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      const error = validateField(field, values[field]);
      if (error) {
        setErrors((prev) => ({ ...prev, [field]: error }));
      }
    },
    [values, validateField]
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset,
    setValues,
    setErrors,
  };
}
