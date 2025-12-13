import { describe, it, expect, beforeEach } from 'vitest';
import * as authService from '../authService';
import * as db from '../db';
import { hashPassword } from '../auth';

describe('AuthService', () => {
  describe('Session Management', () => {
    it('should encode and decode session data correctly', () => {
      const sessionData: authService.SessionData = {
        userId: 123,
        email: 'test@example.com',
        role: 'recruiter',
        expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        rememberMe: true,
      };

      const encoded = authService.encodeSession(sessionData);
      expect(encoded).toBeTruthy();
      expect(typeof encoded).toBe('string');

      const decoded = authService.decodeSession(encoded);
      expect(decoded).toEqual(sessionData);
    });

    it('should return null for invalid session cookie', () => {
      const decoded = authService.decodeSession('invalid-cookie-value');
      expect(decoded).toBeNull();
    });

    it('should extend session expiry correctly', () => {
      const sessionData: authService.SessionData = {
        userId: 123,
        email: 'test@example.com',
        role: 'candidate',
        expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        rememberMe: false,
      };

      const extended = authService.extendSession(sessionData, 30);
      expect(extended.userId).toBe(sessionData.userId);
      expect(extended.email).toBe(sessionData.email);
      expect(extended.role).toBe(sessionData.role);
      expect(new Date(extended.expiry).getTime()).toBeGreaterThan(new Date(sessionData.expiry).getTime());
    });

    it('should reject expired sessions', async () => {
      const expiredSessionData: authService.SessionData = {
        userId: 999,
        email: 'expired@example.com',
        role: 'user',
        expiry: new Date(Date.now() - 1000).toISOString(), // Expired 1 second ago
        rememberMe: false,
      };

      const user = await authService.getUserFromSession(expiredSessionData);
      expect(user).toBeNull();
    });
  });

  describe('Sign Up', () => {
    it('should create a new recruiter account with profile', async () => {
      const signUpData: authService.SignUpData = {
        email: `recruiter-${Date.now()}@test.com`,
        password: 'SecurePass123',
        name: 'Test Recruiter',
        role: 'recruiter',
      };

      const result = await authService.signUp(signUpData, 'http://localhost:3000');

      expect(result.success).toBe(true);
      expect(result.user.email).toBe(signUpData.email);
      expect(result.user.name).toBe(signUpData.name);
      expect(result.user.role).toBe('recruiter');
      expect(result.user.emailVerified).toBe(false);
      expect(result.message).toContain('check your email');

      // Verify recruiter profile was created
      const recruiter = await db.getRecruiterByUserId(result.user.id);
      expect(recruiter).toBeTruthy();
      expect(recruiter?.userId).toBe(result.user.id);
    });

    it('should create a new candidate account with profile', async () => {
      const signUpData: authService.SignUpData = {
        email: `candidate-${Date.now()}@test.com`,
        password: 'SecurePass123',
        name: 'Test Candidate',
        role: 'candidate',
      };

      const result = await authService.signUp(signUpData, 'http://localhost:3000');

      expect(result.success).toBe(true);
      expect(result.user.email).toBe(signUpData.email);
      expect(result.user.name).toBe(signUpData.name);
      expect(result.user.role).toBe('candidate');

      // Verify candidate profile was created
      const candidate = await db.getCandidateByUserId(result.user.id);
      expect(candidate).toBeTruthy();
      expect(candidate?.userId).toBe(result.user.id);
    });

    it('should reject duplicate email addresses', async () => {
      const email = `duplicate-${Date.now()}@test.com`;
      
      // Create first user
      await authService.signUp({
        email,
        password: 'SecurePass123',
        name: 'First User',
        role: 'recruiter',
      }, 'http://localhost:3000');

      // Try to create second user with same email
      await expect(
        authService.signUp({
          email,
          password: 'DifferentPass456',
          name: 'Second User',
          role: 'candidate',
        }, 'http://localhost:3000')
      ).rejects.toThrow('already exists');
    });
  });

  describe('Sign In', () => {
    it('should sign in with correct credentials', async () => {
      const email = `signin-test-${Date.now()}@test.com`;
      const password = 'TestPassword123';

      // Create user first
      await authService.signUp({
        email,
        password,
        name: 'Sign In Test User',
        role: 'recruiter',
      }, 'http://localhost:3000');

      // Sign in
      const result = await authService.signIn({
        email,
        password,
        rememberMe: false,
      });

      expect(result.success).toBe(true);
      expect(result.user.email).toBe(email);
      expect(result.user.role).toBe('recruiter');
      expect(result.sessionData.userId).toBe(result.user.id);
      expect(result.sessionData.email).toBe(email);
      expect(result.sessionData.role).toBe('recruiter');
      expect(result.sessionData.rememberMe).toBe(false);
    });

    it('should reject incorrect password', async () => {
      const email = `wrong-pass-${Date.now()}@test.com`;
      
      // Create user
      await authService.signUp({
        email,
        password: 'CorrectPassword123',
        name: 'Test User',
        role: 'candidate',
      }, 'http://localhost:3000');

      // Try to sign in with wrong password
      await expect(
        authService.signIn({
          email,
          password: 'WrongPassword456',
          rememberMe: false,
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should reject non-existent email', async () => {
      await expect(
        authService.signIn({
          email: 'nonexistent@test.com',
          password: 'AnyPassword123',
          rememberMe: false,
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should set correct session duration for remember me', async () => {
      const email = `remember-me-${Date.now()}@test.com`;
      const password = 'TestPassword123';

      // Create user
      await authService.signUp({
        email,
        password,
        name: 'Remember Me Test',
        role: 'recruiter',
      }, 'http://localhost:3000');

      // Sign in with remember me
      const result = await authService.signIn({
        email,
        password,
        rememberMe: true,
      });

      expect(result.sessionData.rememberMe).toBe(true);
      
      const expiry = new Date(result.sessionData.expiry);
      const now = new Date();
      const daysDiff = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      
      // Should be approximately 30 days
      expect(daysDiff).toBeGreaterThan(29);
      expect(daysDiff).toBeLessThan(31);
    });

    it('should correctly determine user role from profile', async () => {
      const email = `role-test-${Date.now()}@test.com`;
      const password = 'TestPassword123';

      // Create candidate
      const signUpResult = await authService.signUp({
        email,
        password,
        name: 'Role Test User',
        role: 'candidate',
      }, 'http://localhost:3000');

      // Sign in
      const signInResult = await authService.signIn({
        email,
        password,
        rememberMe: false,
      });

      expect(signInResult.user.role).toBe('candidate');
      expect(signInResult.sessionData.role).toBe('candidate');
    });
  });
});
