import { describe, it, expect, beforeEach } from 'vitest';
import * as db from '../db';
import { getDb } from '../db';
import { users, recruiters, candidates } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Profile Completion System', () => {
  let testUserId: number;
  let testRecruiterId: number;
  let testCandidateId: number;

  beforeEach(async () => {
    // Create test user
    const testEmail = `test-${Date.now()}@example.com`;
    await db.upsertUser({
      email: testEmail,
      name: 'Test User',
      loginMethod: 'password',
      passwordHash: 'test-hash',
    });
    const user = await db.getUserByEmail(testEmail);
    if (!user) throw new Error('Failed to create test user');
    testUserId = user.id;
  });

  describe('Recruiter Profile Completion', () => {
    beforeEach(async () => {
      // Create recruiter profile
      const recruiter = await db.createRecruiter({
        userId: testUserId,
      });
      testRecruiterId = recruiter.id;
    });

    it('should create recruiter with profileCompleted = false by default', async () => {
      const recruiter = await db.getRecruiterByUserId(testUserId);
      expect(recruiter).toBeDefined();
      expect(recruiter?.profileCompleted).toBe(false);
      expect(recruiter?.profileCompletionStep).toBe(0);
    });

    it('should update recruiter profile completion step', async () => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error('Database not available');

      await dbInstance.update(recruiters)
        .set({
          profileCompletionStep: 1,
          companyName: 'Test Company',
          phoneNumber: '+1234567890',
        })
        .where(eq(recruiters.id, testRecruiterId));

      const updatedRecruiter = await db.getRecruiterByUserId(testUserId);
      expect(updatedRecruiter?.profileCompletionStep).toBe(1);
      expect(updatedRecruiter?.companyName).toBe('Test Company');
      expect(updatedRecruiter?.phoneNumber).toBe('+1234567890');
    });

    it('should mark recruiter profile as completed', async () => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error('Database not available');

      await dbInstance.update(recruiters)
        .set({
          profileCompleted: 1 as any, // MySQL boolean
          profileCompletionStep: 3,
          companyName: 'Test Company',
          phoneNumber: '+1234567890',
          bio: 'Test bio',
        })
        .where(eq(recruiters.id, testRecruiterId));

      const completedRecruiter = await db.getRecruiterByUserId(testUserId);
      expect(completedRecruiter?.profileCompleted).toBeTruthy();
      expect(completedRecruiter?.profileCompletionStep).toBe(3);
    });

    it('should allow skipping onboarding (mark as completed without data)', async () => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error('Database not available');

      await dbInstance.update(recruiters)
        .set({ profileCompleted: 1 as any }) // MySQL boolean
        .where(eq(recruiters.id, testRecruiterId));

      const skippedRecruiter = await db.getRecruiterByUserId(testUserId);
      expect(skippedRecruiter?.profileCompleted).toBeTruthy();
      expect(skippedRecruiter?.companyName).toBeNull();
    });
  });

  describe('Candidate Profile Completion', () => {
    beforeEach(async () => {
      // Create candidate profile
      const candidate = await db.createCandidate({
        userId: testUserId,
      });
      testCandidateId = candidate.id;
    });

    it('should create candidate with profileCompleted = false by default', async () => {
      const candidate = await db.getCandidateByUserId(testUserId);
      expect(candidate).toBeDefined();
      expect(candidate?.profileCompleted).toBe(false);
      expect(candidate?.profileCompletionStep).toBe(0);
    });

    it('should update candidate profile completion step 1 (basic info)', async () => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error('Database not available');

      await dbInstance.update(candidates)
        .set({
          profileCompletionStep: 1,
          title: 'Software Engineer',
          phoneNumber: '+1234567890',
          location: 'San Francisco, CA',
        })
        .where(eq(candidates.id, testCandidateId));

      const updatedCandidate = await db.getCandidateByUserId(testUserId);
      expect(updatedCandidate?.profileCompletionStep).toBe(1);
      expect(updatedCandidate?.title).toBe('Software Engineer');
      expect(updatedCandidate?.phoneNumber).toBe('+1234567890');
      expect(updatedCandidate?.location).toBe('San Francisco, CA');
    });

    it('should update candidate profile completion step 2 (skills & experience)', async () => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error('Database not available');

      await dbInstance.update(candidates)
        .set({
          profileCompletionStep: 2,
          skills: 'JavaScript, React, Node.js',
          experience: '5 years of experience',
          bio: 'Passionate developer',
        })
        .where(eq(candidates.id, testCandidateId));

      const updatedCandidate = await db.getCandidateByUserId(testUserId);
      expect(updatedCandidate?.profileCompletionStep).toBe(2);
      expect(updatedCandidate?.skills).toBe('JavaScript, React, Node.js');
      expect(updatedCandidate?.experience).toBe('5 years of experience');
      expect(updatedCandidate?.bio).toBe('Passionate developer');
    });

    it('should update candidate profile completion step 3 (preferences)', async () => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error('Database not available');

      await dbInstance.update(candidates)
        .set({
          profileCompletionStep: 3,
          availability: 'immediate',
          expectedSalaryMin: 80000,
          expectedSalaryMax: 120000,
          willingToRelocate: true,
        })
        .where(eq(candidates.id, testCandidateId));

      const updatedCandidate = await db.getCandidateByUserId(testUserId);
      expect(updatedCandidate?.profileCompletionStep).toBe(3);
      expect(updatedCandidate?.availability).toBe('immediate');
      expect(updatedCandidate?.expectedSalaryMin).toBe(80000);
      expect(updatedCandidate?.expectedSalaryMax).toBe(120000);
      expect(updatedCandidate?.willingToRelocate).toBe(true);
    });

    it('should mark candidate profile as completed', async () => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error('Database not available');

      await dbInstance.update(candidates)
        .set({
          profileCompleted: 1 as any, // MySQL boolean
          profileCompletionStep: 4,
        })
        .where(eq(candidates.id, testCandidateId));

      const completedCandidate = await db.getCandidateByUserId(testUserId);
      expect(completedCandidate?.profileCompleted).toBeTruthy();
      expect(completedCandidate?.profileCompletionStep).toBe(4);
    });

    it('should allow skipping onboarding (mark as completed without data)', async () => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error('Database not available');

      await dbInstance.update(candidates)
        .set({ profileCompleted: 1 as any }) // MySQL boolean
        .where(eq(candidates.id, testCandidateId));

      const skippedCandidate = await db.getCandidateByUserId(testUserId);
      expect(skippedCandidate?.profileCompleted).toBeTruthy();
      expect(skippedCandidate?.title).toBeNull();
    });
  });

  describe('Profile Completion Workflow', () => {
    it('should track recruiter progress through all steps', async () => {
      const recruiter = await db.createRecruiter({ userId: testUserId });
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error('Database not available');

      // Step 1: Company info
      await dbInstance.update(recruiters)
        .set({
          profileCompletionStep: 1,
          companyName: 'Test Company',
          phoneNumber: '+1234567890',
        })
        .where(eq(recruiters.id, recruiter.id));

      let current = await db.getRecruiterByUserId(testUserId);
      expect(current?.profileCompletionStep).toBe(1);

      // Step 2: Bio
      await dbInstance.update(recruiters)
        .set({
          profileCompletionStep: 2,
          bio: 'Company bio',
        })
        .where(eq(recruiters.id, recruiter.id));

      current = await db.getRecruiterByUserId(testUserId);
      expect(current?.profileCompletionStep).toBe(2);

      // Step 3: Complete
      await dbInstance.update(recruiters)
        .set({
          profileCompletionStep: 3,
          profileCompleted: 1 as any, // MySQL boolean
        })
        .where(eq(recruiters.id, recruiter.id));

      current = await db.getRecruiterByUserId(testUserId);
      expect(current?.profileCompletionStep).toBe(3);
      expect(current?.profileCompleted).toBeTruthy();
    });

    it('should track candidate progress through all steps', async () => {
      const candidate = await db.createCandidate({ userId: testUserId });
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error('Database not available');

      // Step 1: Basic info
      await dbInstance.update(candidates)
        .set({
          profileCompletionStep: 1,
          title: 'Engineer',
          location: 'NYC',
        })
        .where(eq(candidates.id, candidate.id));

      let current = await db.getCandidateByUserId(testUserId);
      expect(current?.profileCompletionStep).toBe(1);

      // Step 2: Skills
      await dbInstance.update(candidates)
        .set({
          profileCompletionStep: 2,
          skills: 'React, Node',
        })
        .where(eq(candidates.id, candidate.id));

      current = await db.getCandidateByUserId(testUserId);
      expect(current?.profileCompletionStep).toBe(2);

      // Step 3: Preferences
      await dbInstance.update(candidates)
        .set({
          profileCompletionStep: 3,
          availability: 'immediate',
        })
        .where(eq(candidates.id, candidate.id));

      current = await db.getCandidateByUserId(testUserId);
      expect(current?.profileCompletionStep).toBe(3);

      // Step 4: Complete
      await dbInstance.update(candidates)
        .set({
          profileCompletionStep: 4,
          profileCompleted: 1 as any, // MySQL boolean
        })
        .where(eq(candidates.id, candidate.id));

      current = await db.getCandidateByUserId(testUserId);
      expect(current?.profileCompletionStep).toBe(4);
      expect(current?.profileCompleted).toBeTruthy();
    });
  });
});
