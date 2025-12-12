import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword, isValidEmail, isValidPassword } from '../auth';
import * as db from '../db';

describe('Email/Password Authentication', () => {
  
  describe('Password Hashing', () => {
    it('should hash password correctly', async () => {
      const password = 'Test123';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(20);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'Test123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should verify correct password', async () => {
      const password = 'Test123';
      const hash = await hashPassword(password);
      const isValid = await comparePassword(password, hash);
      
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'Test123';
      const hash = await hashPassword(password);
      const isValid = await comparePassword('WrongPassword', hash);
      
      expect(isValid).toBe(false);
    });
  });

  describe('Email Validation', () => {
    it('should accept valid email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('invalid@domain')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('Password Validation', () => {
    it('should accept valid passwords', () => {
      expect(isValidPassword('Test123')).toBe(true);
      expect(isValidPassword('Password1')).toBe(true);
      expect(isValidPassword('abc123def')).toBe(true);
    });

    it('should reject passwords without numbers', () => {
      expect(isValidPassword('TestPassword')).toBe(false);
    });

    it('should reject passwords without letters', () => {
      expect(isValidPassword('123456')).toBe(false);
    });

    it('should reject passwords shorter than 6 characters', () => {
      expect(isValidPassword('Te1')).toBe(false);
      expect(isValidPassword('Test1')).toBe(false);
    });
  });

  describe('User Creation with Email/Password', () => {
    it('should create user with email and password', async () => {
      const email = `test-${Date.now()}@example.com`;
      const passwordHash = await hashPassword('Test123');
      
      await db.upsertUser({
        openId: null,
        name: 'Test User',
        email,
        passwordHash,
        loginMethod: 'password',
        lastSignedIn: new Date(),
      });

      const user = await db.getUserByEmail(email);
      expect(user).toBeDefined();
      expect(user?.email).toBe(email);
      expect(user?.passwordHash).toBe(passwordHash);
      expect(user?.loginMethod).toBe('password');
    });

    it('should retrieve user by email', async () => {
      const email = `retrieve-${Date.now()}@example.com`;
      const passwordHash = await hashPassword('Test123');
      
      await db.upsertUser({
        openId: null,
        name: 'Retrieve Test',
        email,
        passwordHash,
        loginMethod: 'password',
        lastSignedIn: new Date(),
      });

      const user = await db.getUserByEmail(email);
      expect(user).toBeDefined();
      expect(user?.name).toBe('Retrieve Test');
    });

    it('should retrieve user by ID', async () => {
      const email = `byid-${Date.now()}@example.com`;
      const passwordHash = await hashPassword('Test123');
      
      await db.upsertUser({
        openId: null,
        name: 'By ID Test',
        email,
        passwordHash,
        loginMethod: 'password',
        lastSignedIn: new Date(),
      });

      const userByEmail = await db.getUserByEmail(email);
      expect(userByEmail).toBeDefined();
      
      const userById = await db.getUserById(userByEmail!.id);
      expect(userById).toBeDefined();
      expect(userById?.email).toBe(email);
    });
  });

  describe('Complete Sign-Up Flow', () => {
    it('should complete full sign-up flow for recruiter', async () => {
      const email = `recruiter-${Date.now()}@example.com`;
      const password = 'Test123';
      
      // Validate inputs
      expect(isValidEmail(email)).toBe(true);
      expect(isValidPassword(password)).toBe(true);
      
      // Hash password
      const passwordHash = await hashPassword(password);
      
      // Create user
      await db.upsertUser({
        openId: null,
        name: 'Recruiter Test',
        email,
        passwordHash,
        loginMethod: 'password',
        lastSignedIn: new Date(),
      });
      
      // Get user
      const user = await db.getUserByEmail(email);
      expect(user).toBeDefined();
      
      // Create recruiter profile
      await db.createRecruiter({
        userId: user!.id,
        companyName: null,
        phoneNumber: null,
        bio: null,
      });
      
      // Verify recruiter profile
      const recruiter = await db.getRecruiterByUserId(user!.id);
      expect(recruiter).toBeDefined();
      expect(recruiter?.userId).toBe(user!.id);
    });

    it('should complete full sign-up flow for candidate', async () => {
      const email = `candidate-${Date.now()}@example.com`;
      const password = 'Test123';
      
      // Validate inputs
      expect(isValidEmail(email)).toBe(true);
      expect(isValidPassword(password)).toBe(true);
      
      // Hash password
      const passwordHash = await hashPassword(password);
      
      // Create user
      await db.upsertUser({
        openId: null,
        name: 'Candidate Test',
        email,
        passwordHash,
        loginMethod: 'password',
        lastSignedIn: new Date(),
      });
      
      // Get user
      const user = await db.getUserByEmail(email);
      expect(user).toBeDefined();
      
      // Create candidate profile
      await db.createCandidate({
        userId: user!.id,
        title: null,
        phoneNumber: null,
        location: null,
        bio: null,
        skills: null,
        experience: null,
        education: null,
      });
      
      // Verify candidate profile
      const candidate = await db.getCandidateByUserId(user!.id);
      expect(candidate).toBeDefined();
      expect(candidate?.userId).toBe(user!.id);
    });
  });

  describe('Sign-In Flow', () => {
    it('should verify password during sign-in', async () => {
      const email = `signin-${Date.now()}@example.com`;
      const password = 'Test123';
      const passwordHash = await hashPassword(password);
      
      // Create user
      await db.upsertUser({
        openId: null,
        name: 'Sign In Test',
        email,
        passwordHash,
        loginMethod: 'password',
        lastSignedIn: new Date(),
      });
      
      // Simulate sign-in
      const user = await db.getUserByEmail(email);
      expect(user).toBeDefined();
      expect(user?.passwordHash).toBeDefined();
      
      // Verify correct password
      const isValid = await comparePassword(password, user!.passwordHash!);
      expect(isValid).toBe(true);
      
      // Verify incorrect password
      const isInvalid = await comparePassword('WrongPassword', user!.passwordHash!);
      expect(isInvalid).toBe(false);
    });
  });
});
