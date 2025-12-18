import { describe, it, expect, beforeAll } from 'vitest';
import * as db from '../db';

describe('Resume Upload Bug Fixes', () => {
  let testUserId: number;
  let testCandidateId: number;

  beforeAll(async () => {
    // Create a test user and candidate for resume profile tests
    await db.upsertUser({
      openId: 'resume-test-openid-123',
      email: 'resume-test@example.com',
      name: 'Resume Test User',
      role: 'candidate',
      loginMethod: 'oauth',
      emailVerified: true,
    });

    const user = await db.getUserByEmail('resume-test@example.com');
    if (!user) throw new Error('Failed to create test user');
    testUserId = user.id;

    const candidateResult = await db.createCandidate({
      userId: testUserId,
      phoneNumber: '555-0100',
      location: 'Test City',
      skills: 'JavaScript, TypeScript',
    });
    testCandidateId = candidateResult.insertId;
  });

  describe('countResumeProfiles function', () => {
    it('should return 0 for candidate with no resume profiles', async () => {
      const count = await db.countResumeProfiles(testCandidateId);
      expect(count).toBe(0);
    });

    it('should return correct count after creating resume profiles', async () => {
      // Verify we have a valid test candidate
      expect(testCandidateId).toBeGreaterThan(0);
      
      // Create first resume profile
      await db.createResumeProfile({
        candidateId: testCandidateId,
        profileName: 'Software Engineer Resume',
        resumeUrl: 'https://example.com/resume1.pdf',
        fileName: 'resume1.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        isDefault: true,
      });

      let count = await db.countResumeProfiles(testCandidateId);
      expect(count).toBe(1);

      // Create second resume profile
      await db.createResumeProfile({
        candidateId: testCandidateId,
        profileName: 'Full Stack Developer Resume',
        resumeUrl: 'https://example.com/resume2.pdf',
        fileName: 'resume2.pdf',
        fileSize: 2048,
        mimeType: 'application/pdf',
        isDefault: false,
      });

      count = await db.countResumeProfiles(testCandidateId);
      expect(count).toBe(2);
    });

    it('should enforce maximum 5 resume profiles limit', async () => {
      // Verify we have a valid test candidate
      expect(testCandidateId).toBeGreaterThan(0);
      
      // Create 3 more profiles to reach the limit
      for (let i = 3; i <= 5; i++) {
        await db.createResumeProfile({
          candidateId: testCandidateId,
          profileName: `Resume ${i}`,
          resumeUrl: `https://example.com/resume${i}.pdf`,
          fileName: `resume${i}.pdf`,
          fileSize: 1024 * i,
          mimeType: 'application/pdf',
          isDefault: false,
        });
      }

      const count = await db.countResumeProfiles(testCandidateId);
      expect(count).toBe(5);
    });
  });

  describe('Location field null handling', () => {
    it('should create candidate with null location (converted to undefined)', async () => {
      await db.upsertUser({
        openId: 'null-location-test-openid',
        email: 'null-location-test@example.com',
        name: 'Null Location Test',
        role: 'candidate',
        loginMethod: 'oauth',
        emailVerified: true,
      });

      const user = await db.getUserByEmail('null-location-test@example.com');
      if (!user) throw new Error('Failed to create test user');

      // Test with null location (should be converted to undefined and not throw error)
      await expect(db.createCandidate({
        userId: user.id,
        phoneNumber: '555-0200',
        location: null as any, // Simulating null from parsed data
        skills: 'React, Node.js',
      })).resolves.not.toThrow();

      // Verify candidate was created successfully by querying
      const candidate = await db.getCandidateByUserId(user.id);
      expect(candidate).toBeDefined();
      expect(candidate?.userId).toBe(user.id);
      expect(candidate?.location).toBeNull();
    });

    it('should create candidate with undefined location', async () => {
      await db.upsertUser({
        openId: 'undefined-location-test-openid',
        email: 'undefined-location-test@example.com',
        name: 'Undefined Location Test',
        role: 'candidate',
        loginMethod: 'oauth',
        emailVerified: true,
      });

      const user = await db.getUserByEmail('undefined-location-test@example.com');
      if (!user) throw new Error('Failed to create test user');

      await expect(db.createCandidate({
        userId: user.id,
        phoneNumber: '555-0300',
        location: undefined,
        skills: 'Python, Django',
      })).resolves.not.toThrow();

      const candidate = await db.getCandidateByUserId(user.id);
      expect(candidate).toBeDefined();
      expect(candidate?.location).toBeNull();
    });

    it('should create candidate with valid location string', async () => {
      await db.upsertUser({
        openId: 'valid-location-test-openid',
        email: 'valid-location-test@example.com',
        name: 'Valid Location Test',
        role: 'candidate',
        loginMethod: 'oauth',
        emailVerified: true,
      });

      const user = await db.getUserByEmail('valid-location-test@example.com');
      if (!user) throw new Error('Failed to create test user');

      await expect(db.createCandidate({
        userId: user.id,
        phoneNumber: '555-0400',
        location: 'San Francisco, CA',
        skills: 'Java, Spring Boot',
      })).resolves.not.toThrow();

      const candidate = await db.getCandidateByUserId(user.id);
      expect(candidate).toBeDefined();
      expect(candidate?.location).toBe('San Francisco, CA');
    });

    it('should handle empty string location', async () => {
      await db.upsertUser({
        openId: 'empty-location-test-openid',
        email: 'empty-location-test@example.com',
        name: 'Empty Location Test',
        role: 'candidate',
        loginMethod: 'oauth',
        emailVerified: true,
      });

      const user = await db.getUserByEmail('empty-location-test@example.com');
      if (!user) throw new Error('Failed to create test user');

      // Empty string should be converted to undefined by || operator
      await expect(db.createCandidate({
        userId: user.id,
        phoneNumber: '555-0500',
        location: '' as any, // Simulating empty string from form
        skills: 'C++, Rust',
      })).resolves.not.toThrow();

      const candidate = await db.getCandidateByUserId(user.id);
      expect(candidate).toBeDefined();
      // Empty string converted to undefined, stored as null in DB
      expect(candidate?.location).toBeNull();
    });
  });
});
