import { describe, it, expect } from 'vitest';
import {
  validatePassword,
  isPasswordValid,
  getPasswordStrengthLabel,
} from '../shared/passwordValidation';

describe('Password Validation', () => {
  describe('validatePassword', () => {
    it('should reject passwords shorter than 8 characters', () => {
      const result = validatePassword('Short1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must be at least 8 characters long'
      );
    });

    it('should reject passwords without uppercase letters', () => {
      const result = validatePassword('password123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain both uppercase and lowercase letters'
      );
    });

    it('should reject passwords without lowercase letters', () => {
      const result = validatePassword('PASSWORD123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain both uppercase and lowercase letters'
      );
    });

    it('should reject passwords without numbers', () => {
      const result = validatePassword('Password!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one number'
      );
    });

    it('should reject passwords without special characters', () => {
      const result = validatePassword('Password123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one special character (!@#$%^&*)'
      );
    });

    it('should reject common passwords', () => {
      const result = validatePassword('Password123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password is too common, please choose a more unique password'
      );
    });

    it('should reject passwords with repeated characters', () => {
      const result = validatePassword('Paaassword123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Avoid using repeated characters (e.g., "aaa" or "111")'
      );
    });

    it('should accept strong passwords', () => {
      const result = validatePassword('MyStr0ng!Pass');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.score).toBeGreaterThanOrEqual(3);
    });
  });

  describe('isPasswordValid', () => {
    it('should return true for valid passwords', () => {
      expect(isPasswordValid('MyStr0ng!Pass')).toBe(true);
    });

    it('should return false for invalid passwords', () => {
      expect(isPasswordValid('weak')).toBe(false);
      expect(isPasswordValid('password123')).toBe(false);
    });
  });

  describe('getPasswordStrengthLabel', () => {
    it('should return correct labels for different scores', () => {
      expect(getPasswordStrengthLabel(0)).toBe('Too weak');
      expect(getPasswordStrengthLabel(1)).toBe('Weak');
      expect(getPasswordStrengthLabel(2)).toBe('Fair');
      expect(getPasswordStrengthLabel(3)).toBe('Good');
      expect(getPasswordStrengthLabel(4)).toBe('Strong');
    });

    it('should handle out-of-range scores', () => {
      expect(getPasswordStrengthLabel(-1)).toBe('Too weak');
      expect(getPasswordStrengthLabel(10)).toBe('Strong');
    });
  });
});
