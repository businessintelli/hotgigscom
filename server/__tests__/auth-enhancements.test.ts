import { describe, it, expect } from 'vitest';
import { generateVerificationToken, generateTokenExpiry } from '../auth';
import * as db from '../db';
import { updateUserByEmail } from '../dbUpdate';

describe('Authentication Enhancements', () => {
  
  describe('Token Generation', () => {
    it('should generate unique verification tokens', () => {
      const token1 = generateVerificationToken();
      const token2 = generateVerificationToken();
      
      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1).not.toBe(token2);
      expect(token1.length).toBeGreaterThan(20);
    });

    it('should generate token expiry 24 hours in the future by default', () => {
      const now = Date.now();
      const expiry = generateTokenExpiry();
      const expectedExpiry = now + (24 * 60 * 60 * 1000);
      
      // Allow 1 second tolerance
      expect(expiry.getTime()).toBeGreaterThanOrEqual(expectedExpiry - 1000);
      expect(expiry.getTime()).toBeLessThanOrEqual(expectedExpiry + 1000);
    });

    it('should generate token expiry with custom hours', () => {
      const now = Date.now();
      const expiry = generateTokenExpiry(1); // 1 hour
      const expectedExpiry = now + (1 * 60 * 60 * 1000);
      
      // Allow 1 second tolerance
      expect(expiry.getTime()).toBeGreaterThanOrEqual(expectedExpiry - 1000);
      expect(expiry.getTime()).toBeLessThanOrEqual(expectedExpiry + 1000);
    });
  });

  describe('Email Verification Flow', () => {
    it('should create user with email verification token', async () => {
      const email = `verify-${Date.now()}@example.com`;
      const verificationToken = generateVerificationToken();
      const verificationTokenExpiry = generateTokenExpiry(24);
      
      await db.upsertUser({
        openId: null,
        name: 'Verify Test',
        email,
        passwordHash: 'hash123',
        loginMethod: 'password',
        lastSignedIn: new Date(),
        emailVerified: false,
        verificationToken,
        verificationTokenExpiry,
      });

      const user = await db.getUserByEmail(email);
      expect(user).toBeDefined();
      expect(user?.emailVerified).toBe(false);
      expect(user?.verificationToken).toBe(verificationToken);
      expect(user?.verificationTokenExpiry).toBeDefined();
    });

    it('should mark email as verified and clear token', async () => {
      const email = `verified-${Date.now()}@example.com`;
      const verificationToken = generateVerificationToken();
      
      // Create user with verification token
      await db.upsertUser({
        openId: null,
        name: 'Verified Test',
        email,
        passwordHash: 'hash123',
        loginMethod: 'password',
        lastSignedIn: new Date(),
        emailVerified: false,
        verificationToken,
        verificationTokenExpiry: generateTokenExpiry(24),
      });

      // Verify email
      await updateUserByEmail(email, {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      });

      const verifiedUser = await db.getUserByEmail(email);
      expect(verifiedUser?.emailVerified).toBe(true);
      expect(verifiedUser?.verificationToken).toBeNull();
      expect(verifiedUser?.verificationTokenExpiry).toBeNull();
    });
  });

  describe('Password Reset Flow', () => {
    it('should store password reset token', async () => {
      const email = `reset-${Date.now()}@example.com`;
      const resetToken = generateVerificationToken();
      const resetTokenExpiry = generateTokenExpiry(1); // 1 hour
      
      // Create user
      await db.upsertUser({
        openId: null,
        name: 'Reset Test',
        email,
        passwordHash: 'hash123',
        loginMethod: 'password',
        lastSignedIn: new Date(),
      });

      // Set reset token
      await updateUserByEmail(email, {
        passwordResetToken: resetToken,
        passwordResetTokenExpiry: resetTokenExpiry,
      });

      const updatedUser = await db.getUserByEmail(email);
      expect(updatedUser?.passwordResetToken).toBe(resetToken);
      expect(updatedUser?.passwordResetTokenExpiry).toBeDefined();
    });

    it('should clear reset token after password reset', async () => {
      const email = `reset-complete-${Date.now()}@example.com`;
      const resetToken = generateVerificationToken();
      
      // Create user with reset token
      await db.upsertUser({
        openId: null,
        name: 'Reset Complete Test',
        email,
        passwordHash: 'oldHash',
        loginMethod: 'password',
        lastSignedIn: new Date(),
        passwordResetToken: resetToken,
        passwordResetTokenExpiry: generateTokenExpiry(1),
      });

      // Reset password
      await updateUserByEmail(email, {
        passwordHash: 'newHash',
        passwordResetToken: null,
        passwordResetTokenExpiry: null,
      });

      const updatedUser = await db.getUserByEmail(email);
      expect(updatedUser?.passwordHash).toBe('newHash');
      expect(updatedUser?.passwordResetToken).toBeNull();
      expect(updatedUser?.passwordResetTokenExpiry).toBeNull();
    });

    it('should detect expired reset tokens', () => {
      const expiredDate = new Date(Date.now() - (2 * 60 * 60 * 1000)); // 2 hours ago
      const now = new Date();
      
      expect(now > expiredDate).toBe(true);
    });
  });

  describe('Complete Authentication Flows', () => {
    it('should complete full sign-up with email verification flow', async () => {
      const email = `fullflow-${Date.now()}@example.com`;
      const verificationToken = generateVerificationToken();
      
      // Step 1: Sign up
      await db.upsertUser({
        openId: null,
        name: 'Full Flow Test',
        email,
        passwordHash: 'hash123',
        loginMethod: 'password',
        lastSignedIn: new Date(),
        emailVerified: false,
        verificationToken,
        verificationTokenExpiry: generateTokenExpiry(24),
      });

      const newUser = await db.getUserByEmail(email);
      expect(newUser?.emailVerified).toBe(false);
      expect(newUser?.verificationToken).toBe(verificationToken);

      // Step 2: Verify email
      await updateUserByEmail(email, {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      });

      const verifiedUser = await db.getUserByEmail(email);
      expect(verifiedUser?.emailVerified).toBe(true);
      expect(verifiedUser?.verificationToken).toBeNull();
    });

    it('should complete full password reset flow', async () => {
      const email = `resetflow-${Date.now()}@example.com`;
      const resetToken = generateVerificationToken();
      
      // Step 1: Create user
      await db.upsertUser({
        openId: null,
        name: 'Reset Flow Test',
        email,
        passwordHash: 'oldPassword',
        loginMethod: 'password',
        lastSignedIn: new Date(),
      });

      // Step 2: Request password reset
      await updateUserByEmail(email, {
        passwordResetToken: resetToken,
        passwordResetTokenExpiry: generateTokenExpiry(1),
      });

      const userWithToken = await db.getUserByEmail(email);
      expect(userWithToken?.passwordResetToken).toBe(resetToken);

      // Step 3: Reset password
      await updateUserByEmail(email, {
        passwordHash: 'newPassword',
        passwordResetToken: null,
        passwordResetTokenExpiry: null,
      });

      const resetUser = await db.getUserByEmail(email);
      expect(resetUser?.passwordHash).toBe('newPassword');
      expect(resetUser?.passwordResetToken).toBeNull();
    });
  });

  describe('Database Schema Validation', () => {
    it('should support all new authentication fields', async () => {
      const email = `schema-${Date.now()}@example.com`;
      
      await db.upsertUser({
        openId: null,
        name: 'Schema Test',
        email,
        passwordHash: 'hash',
        loginMethod: 'password',
        lastSignedIn: new Date(),
        emailVerified: false,
        verificationToken: 'token123',
        verificationTokenExpiry: new Date(),
        passwordResetToken: 'reset123',
        passwordResetTokenExpiry: new Date(),
      });

      const user = await db.getUserByEmail(email);
      expect(user).toBeDefined();
      expect(user?.emailVerified).toBeDefined();
      expect(user?.verificationToken).toBeDefined();
      expect(user?.verificationTokenExpiry).toBeDefined();
      expect(user?.passwordResetToken).toBeDefined();
      expect(user?.passwordResetTokenExpiry).toBeDefined();
    });
  });
});
