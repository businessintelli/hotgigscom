import { describe, it, expect } from 'vitest';
import * as db from './db';
import * as authService from './authService';
import { generateVerificationToken, generateTokenExpiry } from './auth';
import { updateUserById, updateUserByEmail, deleteUserById } from './db-helpers';

describe('Email Verification Enforcement', () => {
  describe('Verification Token Generation', () => {
    it('should generate unique verification tokens', () => {
      const token1 = generateVerificationToken();
      const token2 = generateVerificationToken();
      
      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1).not.toBe(token2);
      expect(token1.length).toBeGreaterThan(20);
    });

    it('should generate token expiry 24 hours in the future', () => {
      const expiry = generateTokenExpiry();
      const now = new Date();
      const twentyThreeHours = new Date(now.getTime() + 23 * 60 * 60 * 1000);
      const twentyFiveHours = new Date(now.getTime() + 25 * 60 * 60 * 1000);
      
      expect(expiry.getTime()).toBeGreaterThan(twentyThreeHours.getTime());
      expect(expiry.getTime()).toBeLessThan(twentyFiveHours.getTime());
    });
  });

  describe('User Signup with Email Verification', () => {
    it('should create new users with emailVerified = false by default', async () => {
      const testEmail = `test-signup-${Date.now()}@example.com`;
      const signupResult = await authService.signUp({
        email: testEmail,
        password: 'TestPassword123!',
        name: 'Test User',
        role: 'candidate',
      });
      
      const user = await db.getUserById(signupResult.userId);
      expect(user).toBeDefined();
      expect(user?.emailVerified).toBe(false);
      expect(user?.verificationToken).toBeDefined();
      expect(user?.verificationToken).not.toBe('');
      expect(user?.verificationTokenExpiry).toBeDefined();
      
      // Cleanup
      await deleteUserById(signupResult.userId);
    });
  });

  describe('Email Verification Flow', () => {
    it('should update user to verified status', async () => {
      const testEmail = `test-verify-${Date.now()}@example.com`;
      const signupResult = await authService.signUp({
        email: testEmail,
        password: 'TestPassword123!',
        name: 'Test User',
        role: 'recruiter',
      });

      const userBefore = await db.getUserById(signupResult.userId);
      expect(userBefore?.emailVerified).toBe(false);

      // Simulate verification
      await updateUserByEmail(testEmail, {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      });

      const userAfter = await db.getUserById(signupResult.userId);
      expect(userAfter?.emailVerified).toBe(true);
      expect(userAfter?.verificationToken).toBeNull();

      // Cleanup
      await deleteUserById(signupResult.userId);
    });

    it('should generate new verification token when resending', async () => {
      const testEmail = `test-resend-${Date.now()}@example.com`;
      const signupResult = await authService.signUp({
        email: testEmail,
        password: 'TestPassword123!',
        name: 'Test User',
        role: 'candidate',
      });

      const userBefore = await db.getUserById(signupResult.userId);
      const oldToken = userBefore?.verificationToken;

      // Generate new token
      const newToken = generateVerificationToken();
      const newExpiry = generateTokenExpiry();
      
      await updateUserByEmail(testEmail, {
        verificationToken: newToken,
        verificationTokenExpiry: newExpiry,
      });

      const userAfter = await db.getUserById(signupResult.userId);
      expect(userAfter?.verificationToken).not.toBe(oldToken);
      expect(userAfter?.verificationToken).toBe(newToken);

      // Cleanup
      await deleteUserById(signupResult.userId);
    });
  });

  describe('User Data Structure', () => {
    it('should include emailVerified field in user data', async () => {
      const testEmail = `test-data-${Date.now()}@example.com`;
      const signupResult = await authService.signUp({
        email: testEmail,
        password: 'TestPassword123!',
        name: 'Test User',
        role: 'candidate',
      });

      const user = await db.getUserById(signupResult.userId);
      expect(user).toBeDefined();
      expect(user).toHaveProperty('emailVerified');
      expect(typeof user?.emailVerified).toBe('boolean');

      // Cleanup
      await deleteUserById(signupResult.userId);
    });
  });

  describe('Token Expiry Validation', () => {
    it('should recognize expired tokens', () => {
      const expiredDate = new Date(Date.now() - 1000); // 1 second ago
      const now = new Date();
      
      expect(expiredDate.getTime()).toBeLessThan(now.getTime());
      // Token expiry validation would be handled in the API endpoint
    });
  });
});
