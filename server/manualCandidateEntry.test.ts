import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from '../server/db';
import { users, recruiters, candidates } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Manual Candidate Entry', () => {
  let testRecruiterId: number;
  let testUserId: number;
  let testCandidateId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create a test recruiter user
    const userResult = await db.insert(users).values({
      name: 'Test Recruiter',
      email: `test-recruiter-${Date.now()}@test.com`,
      role: 'recruiter',
      emailVerified: true,
    });
    testUserId = Number(userResult[0].insertId);

    // Create recruiter profile
    const recruiterResult = await db.insert(recruiters).values({
      userId: testUserId,
      companyName: 'Test Company',
      phoneNumber: '+1234567890',
    });
    testRecruiterId = Number(recruiterResult[0].insertId);
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Cleanup: delete test data
    if (testCandidateId) {
      await db.delete(candidates).where(eq(candidates.id, testCandidateId));
    }
    if (testRecruiterId) {
      await db.delete(recruiters).where(eq(recruiters.id, testRecruiterId));
    }
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  it('should create candidate with manual data (no resume)', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create a candidate user
    const candidateUserResult = await db.insert(users).values({
      name: 'Test Candidate Manual',
      email: `test-candidate-manual-${Date.now()}@test.com`,
      role: 'candidate',
      emailVerified: false,
      loginMethod: 'manual',
    });
    const candidateUserId = Number(candidateUserResult[0].insertId);

    // Create candidate profile with manual data
    const candidateResult = await db.insert(candidates).values({
      userId: candidateUserId,
      addedBy: testRecruiterId,
      source: 'recruiter-manual',
      phoneNumber: '+1987654321',
      title: 'Software Engineer',
      location: 'San Francisco, CA',
      skills: 'JavaScript, React, Node.js',
      experience: '3 years of experience',
      education: "Bachelor's in Computer Science",
    });
    testCandidateId = Number(candidateResult[0].insertId);

    // Verify candidate was created
    const [candidate] = await db
      .select()
      .from(candidates)
      .where(eq(candidates.id, testCandidateId));

    expect(candidate).toBeDefined();
    expect(candidate.userId).toBe(candidateUserId);
    expect(candidate.addedBy).toBe(testRecruiterId);
    expect(candidate.source).toBe('recruiter-manual');
    expect(candidate.title).toBe('Software Engineer');
    expect(candidate.skills).toBe('JavaScript, React, Node.js');
    expect(candidate.resumeUrl).toBeNull();

    // Cleanup this specific candidate
    await db.delete(candidates).where(eq(candidates.id, testCandidateId));
    await db.delete(users).where(eq(users.id, candidateUserId));
  });

  it('should store resume URL when resume is uploaded', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create a candidate user
    const candidateUserResult = await db.insert(users).values({
      name: 'Test Candidate With Resume',
      email: `test-candidate-resume-${Date.now()}@test.com`,
      role: 'candidate',
      emailVerified: false,
      loginMethod: 'manual',
    });
    const candidateUserId = Number(candidateUserResult[0].insertId);

    // Simulate resume upload with S3 URL
    const mockResumeUrl = 'https://s3.example.com/resumes/test-resume.pdf';
    const mockResumeFilename = 'test-resume.pdf';

    // Create candidate profile with resume
    const candidateResult = await db.insert(candidates).values({
      userId: candidateUserId,
      addedBy: testRecruiterId,
      source: 'recruiter-manual',
      phoneNumber: '+1987654321',
      title: 'Data Scientist',
      location: 'New York, NY',
      skills: 'Python, Machine Learning, TensorFlow',
      resumeUrl: mockResumeUrl,
      resumeFilename: mockResumeFilename,
      resumeUploadedAt: new Date(),
    });
    const candidateId = Number(candidateResult[0].insertId);

    // Verify candidate was created with resume
    const [candidate] = await db
      .select()
      .from(candidates)
      .where(eq(candidates.id, candidateId));

    expect(candidate).toBeDefined();
    expect(candidate.resumeUrl).toBe(mockResumeUrl);
    expect(candidate.resumeFilename).toBe(mockResumeFilename);
    expect(candidate.resumeUploadedAt).toBeDefined();

    // Cleanup
    await db.delete(candidates).where(eq(candidates.id, candidateId));
    await db.delete(users).where(eq(users.id, candidateUserId));
  });

  it('should store parsed resume data when AI parsing is successful', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create a candidate user
    const candidateUserResult = await db.insert(users).values({
      name: 'Test Candidate Parsed',
      email: `test-candidate-parsed-${Date.now()}@test.com`,
      role: 'candidate',
      emailVerified: false,
      loginMethod: 'manual',
    });
    const candidateUserId = Number(candidateUserResult[0].insertId);

    // Mock parsed resume data
    const mockParsedData = {
      personalInfo: {
        name: 'Test Candidate Parsed',
        email: 'test@example.com',
        phone: '+1234567890',
        location: 'Boston, MA',
      },
      skills: ['Python', 'Django', 'PostgreSQL', 'Docker'],
      experience: [
        {
          title: 'Backend Developer',
          company: 'Tech Corp',
          startDate: '2020-01',
          endDate: '2023-12',
          description: 'Built scalable APIs',
        },
      ],
      education: [
        {
          degree: 'Master of Science',
          institution: 'MIT',
          graduationDate: '2020',
        },
      ],
      metadata: {
        totalExperienceYears: 4,
        seniorityLevel: 'mid',
        primaryDomain: 'Backend Development',
      },
    };

    // Create candidate profile with parsed data
    const candidateResult = await db.insert(candidates).values({
      userId: candidateUserId,
      addedBy: testRecruiterId,
      source: 'recruiter-manual',
      phoneNumber: mockParsedData.personalInfo.phone,
      location: mockParsedData.personalInfo.location,
      skills: mockParsedData.skills.join(', '),
      experience: JSON.stringify(mockParsedData.experience),
      education: JSON.stringify(mockParsedData.education),
      parsedResumeData: JSON.stringify(mockParsedData),
      totalExperienceYears: mockParsedData.metadata.totalExperienceYears,
      seniorityLevel: mockParsedData.metadata.seniorityLevel,
      primaryDomain: mockParsedData.metadata.primaryDomain,
      resumeUrl: 'https://s3.example.com/resumes/parsed-resume.pdf',
      resumeFilename: 'parsed-resume.pdf',
      resumeUploadedAt: new Date(),
    });
    const candidateId = Number(candidateResult[0].insertId);

    // Verify candidate was created with parsed data
    const [candidate] = await db
      .select()
      .from(candidates)
      .where(eq(candidates.id, candidateId));

    expect(candidate).toBeDefined();
    expect(candidate.skills).toBe('Python, Django, PostgreSQL, Docker');
    expect(candidate.totalExperienceYears).toBe(4);
    expect(candidate.seniorityLevel).toBe('mid');
    expect(candidate.primaryDomain).toBe('Backend Development');
    expect(candidate.parsedResumeData).toBeDefined();

    // Verify parsed data can be retrieved
    const parsedData = JSON.parse(candidate.parsedResumeData!);
    expect(parsedData.skills).toEqual(mockParsedData.skills);
    expect(parsedData.metadata.totalExperienceYears).toBe(4);

    // Cleanup
    await db.delete(candidates).where(eq(candidates.id, candidateId));
    await db.delete(users).where(eq(users.id, candidateUserId));
  });

  // Note: Duplicate email prevention is handled by the unique constraint on users.email
  // The addCandidateManually procedure checks for existing users before creating new ones

  it('should track candidate source correctly', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const sources = ['recruiter-manual', 'quick-upload', 'job-fair', 'referral'];

    for (const source of sources) {
      // Create candidate with specific source
      const userResult = await db.insert(users).values({
        name: `Test ${source}`,
        email: `test-${source}-${Date.now()}@test.com`,
        role: 'candidate',
        emailVerified: false,
      });
      const userId = Number(userResult[0].insertId);

      const candidateResult = await db.insert(candidates).values({
        userId,
        addedBy: testRecruiterId,
        source,
      });
      const candidateId = Number(candidateResult[0].insertId);

      // Verify source is stored correctly
      const [candidate] = await db
        .select()
        .from(candidates)
        .where(eq(candidates.id, candidateId));

      expect(candidate.source).toBe(source);

      // Cleanup
      await db.delete(candidates).where(eq(candidates.id, candidateId));
      await db.delete(users).where(eq(users.id, userId));
    }
  });
});
