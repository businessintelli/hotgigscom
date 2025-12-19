/**
 * Password validation utilities for HotGigs platform
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  score: number; // 0-4
}

/**
 * Validate password against security requirements
 * @param password - The password to validate
 * @returns Validation result with errors and strength score
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;

  // Minimum length requirement
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
    return { isValid: false, errors, score: 0 };
  }

  // Length scoring
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;

  // Character variety requirements
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (!hasLowercase || !hasUppercase) {
    errors.push('Password must contain both uppercase and lowercase letters');
  } else {
    score++;
  }

  if (!hasNumber) {
    errors.push('Password must contain at least one number');
  } else {
    score++;
  }

  if (!hasSpecial) {
    errors.push('Password must contain at least one special character (!@#$%^&*)');
  } else {
    score++;
  }

  // Common password check
  const commonPasswords = [
    'password',
    'password123',
    '123456',
    '12345678',
    'qwerty',
    'abc123',
    'letmein',
  ];
  if (commonPasswords.some((common) => password.toLowerCase().includes(common))) {
    errors.push('Password is too common, please choose a more unique password');
    score = Math.max(0, score - 2);
  }

  // Sequential or repeated characters
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Avoid using repeated characters (e.g., "aaa" or "111")');
    score = Math.max(0, score - 1);
  }

  return {
    isValid: errors.length === 0,
    errors,
    score: Math.min(4, Math.max(0, score)),
  };
}

/**
 * Check if password meets minimum security requirements
 * @param password - The password to check
 * @returns True if password is valid
 */
export function isPasswordValid(password: string): boolean {
  return validatePassword(password).isValid;
}

/**
 * Get password strength label
 * @param score - Password strength score (0-4)
 * @returns Human-readable strength label
 */
export function getPasswordStrengthLabel(score: number): string {
  const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
  return labels[Math.min(4, Math.max(0, score))];
}
