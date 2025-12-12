import { describe, it, expect } from 'vitest';
import * as db from '../db';

describe('Authentication Flow', () => {

  describe('User Creation', () => {
    it('should create a new user with OAuth data', async () => {
      await db.upsertUser({
        openId: 'test-open-id-123',
        name: 'Test User',
        email: 'test@example.com',
        loginMethod: 'google',
        lastSignedIn: new Date(),
      });

      const user = await db.getUserByOpenId('test-open-id-123');
      expect(user).toBeDefined();
      expect(user?.name).toBe('Test User');
      expect(user?.email).toBe('test@example.com');
      expect(user?.loginMethod).toBe('google');
    });

    it('should update existing user on subsequent logins', async () => {
      // First login
      await db.upsertUser({
        openId: 'test-open-id-456',
        name: 'Original Name',
        email: 'test2@example.com',
        loginMethod: 'google',
        lastSignedIn: new Date('2024-01-01'),
      });

      // Second login with updated name
      await db.upsertUser({
        openId: 'test-open-id-456',
        name: 'Updated Name',
        email: 'test2@example.com',
        loginMethod: 'google',
        lastSignedIn: new Date('2024-01-02'),
      });

      const user = await db.getUserByOpenId('test-open-id-456');
      expect(user?.name).toBe('Updated Name');
    });
  });

  describe('Role Profile Creation', () => {
    it('should create recruiter profile for new user', async () => {
      // Create user first
      await db.upsertUser({
        openId: 'recruiter-test-123',
        name: 'Recruiter Test',
        email: 'recruiter@example.com',
        loginMethod: 'google',
        lastSignedIn: new Date(),
      });

      const user = await db.getUserByOpenId('recruiter-test-123');
      expect(user).toBeDefined();

      // Create recruiter profile
      await db.createRecruiter({
        userId: user!.id,
        companyName: null,
        phoneNumber: null,
        bio: null,
      });

      const recruiter = await db.getRecruiterByUserId(user!.id);
      expect(recruiter).toBeDefined();
      expect(recruiter?.userId).toBe(user!.id);
    });

    it('should create candidate profile for new user', async () => {
      // Create user first
      await db.upsertUser({
        openId: 'candidate-test-123',
        name: 'Candidate Test',
        email: 'candidate@example.com',
        loginMethod: 'google',
        lastSignedIn: new Date(),
      });

      const user = await db.getUserByOpenId('candidate-test-123');
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

      const candidate = await db.getCandidateByUserId(user!.id);
      expect(candidate).toBeDefined();
      expect(candidate?.userId).toBe(user!.id);
    });

    it('should detect existing recruiter profile', async () => {
      // Create user and recruiter profile
      await db.upsertUser({
        openId: 'existing-recruiter-123',
        name: 'Existing Recruiter',
        email: 'existing.recruiter@example.com',
        loginMethod: 'google',
        lastSignedIn: new Date(),
      });

      const user = await db.getUserByOpenId('existing-recruiter-123');
      await db.createRecruiter({
        userId: user!.id,
        companyName: 'Test Company',
        phoneNumber: null,
        bio: null,
      });

      // Check if profile exists
      const existingRecruiter = await db.getRecruiterByUserId(user!.id);
      expect(existingRecruiter).toBeDefined();
      expect(existingRecruiter?.companyName).toBe('Test Company');
    });

    it('should detect existing candidate profile', async () => {
      // Create user and candidate profile
      await db.upsertUser({
        openId: 'existing-candidate-123',
        name: 'Existing Candidate',
        email: 'existing.candidate@example.com',
        loginMethod: 'google',
        lastSignedIn: new Date(),
      });

      const user = await db.getUserByOpenId('existing-candidate-123');
      await db.createCandidate({
        userId: user!.id,
        title: 'Software Engineer',
        phoneNumber: null,
        location: null,
        bio: null,
        skills: null,
        experience: null,
        education: null,
      });

      // Check if profile exists
      const existingCandidate = await db.getCandidateByUserId(user!.id);
      expect(existingCandidate).toBeDefined();
      expect(existingCandidate?.title).toBe('Software Engineer');
    });
  });

  describe('Role Detection', () => {
    it('should return null for user without any role', async () => {
      await db.upsertUser({
        openId: 'no-role-user-123',
        name: 'No Role User',
        email: 'norole@example.com',
        loginMethod: 'google',
        lastSignedIn: new Date(),
      });

      const user = await db.getUserByOpenId('no-role-user-123');
      const recruiter = await db.getRecruiterByUserId(user!.id);
      const candidate = await db.getCandidateByUserId(user!.id);

      expect(recruiter).toBeUndefined();
      expect(candidate).toBeUndefined();
    });

    it('should correctly identify recruiter role', async () => {
      await db.upsertUser({
        openId: 'role-check-recruiter-123',
        name: 'Role Check Recruiter',
        email: 'rolecheck.recruiter@example.com',
        loginMethod: 'google',
        lastSignedIn: new Date(),
      });

      const user = await db.getUserByOpenId('role-check-recruiter-123');
      await db.createRecruiter({
        userId: user!.id,
        companyName: null,
        phoneNumber: null,
        bio: null,
      });

      const recruiter = await db.getRecruiterByUserId(user!.id);
      const candidate = await db.getCandidateByUserId(user!.id);

      expect(recruiter).toBeDefined();
      expect(candidate).toBeUndefined();
    });

    it('should correctly identify candidate role', async () => {
      await db.upsertUser({
        openId: 'role-check-candidate-123',
        name: 'Role Check Candidate',
        email: 'rolecheck.candidate@example.com',
        loginMethod: 'google',
        lastSignedIn: new Date(),
      });

      const user = await db.getUserByOpenId('role-check-candidate-123');
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

      const recruiter = await db.getRecruiterByUserId(user!.id);
      const candidate = await db.getCandidateByUserId(user!.id);

      expect(recruiter).toBeUndefined();
      expect(candidate).toBeDefined();
    });
  });
});
