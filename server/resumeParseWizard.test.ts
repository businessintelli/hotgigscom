import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { appRouter } from './routers';
import { getDb } from './db';
import { users, candidates } from '../drizzle/schema';
import { hashPassword } from './auth';

describe('Resume Parse Wizard Flow', () => {
  let db: any;
  let testUserId: number;
  let testCandidateId: number;

  beforeAll(async () => {
    db = getDb();
    if (!db) throw new Error('Database not available');

    // Create a test candidate user
    const hashedPassword = await hashPassword('Test123!');
    const userResult = await db.insert(users).values({
      name: 'Test Candidate Wizard',
      email: `test-wizard-${Date.now()}@test.com`,
      role: 'candidate',
      emailVerified: true,
      loginMethod: 'password',
      passwordHash: hashedPassword,
    });
    testUserId = Number(userResult[0].insertId);

    // Create candidate profile
    const candidateResult = await db.insert(candidates).values({
      userId: testUserId,
      fullName: 'Test Candidate Wizard',
      email: `test-wizard-${Date.now()}@test.com`,
    });
    testCandidateId = Number(candidateResult[0].insertId);
  });

  afterAll(async () => {
    // Cleanup
    if (db && testCandidateId) {
      await db.delete(candidates).where({ id: testCandidateId });
    }
    if (db && testUserId) {
      await db.delete(users).where({ id: testUserId });
    }
  });

  it('should parse resume without auto-filling profile', async () => {
    const caller = appRouter.createCaller({
      user: { id: testUserId, email: `test-wizard-${Date.now()}@test.com`, role: 'candidate' },
    });

    // Sample resume data (base64 encoded)
    const sampleResumeText = `
John Doe
john.doe@example.com | (555) 123-4567 | San Francisco, CA

PROFESSIONAL SUMMARY
Experienced software engineer with 5+ years in full-stack development.

SKILLS
JavaScript, TypeScript, React, Node.js, Python, AWS, Docker

EXPERIENCE
Senior Software Engineer | Tech Company | 2020 - Present
- Developed scalable web applications
- Led team of 5 engineers

Software Engineer | Startup Inc | 2018 - 2020
- Built RESTful APIs
- Implemented CI/CD pipelines

EDUCATION
Bachelor of Science in Computer Science
University of California | 2018
`;

    // Create a simple PDF-like base64 (in reality this would be actual PDF data)
    const base64Data = `data:application/pdf;base64,${Buffer.from(sampleResumeText).toString('base64')}`;

    // Test parseResumeOnly procedure
    const result = await caller.candidate.parseResumeOnly({
      fileData: base64Data,
      fileName: 'test-resume.pdf',
    });

    // Verify the result structure
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.parsedData).toBeDefined();
    expect(result.parsedData.personalInfo).toBeDefined();
    expect(result.parsedData.skills).toBeDefined();
    expect(result.parsedData.experience).toBeDefined();
    expect(result.parsedData.education).toBeDefined();

    // Verify bias detection was run
    expect(result.biasDetection).toBeDefined();
  });

  it('should upload resume with auto-fill after wizard confirmation', async () => {
    const caller = appRouter.createCaller({
      user: { id: testUserId, email: `test-wizard-${Date.now()}@test.com`, role: 'candidate' },
    });

    // Sample resume data
    const sampleResumeText = `
Jane Smith
jane.smith@example.com | (555) 987-6543 | New York, NY

PROFESSIONAL SUMMARY
Marketing professional with 3+ years experience.

SKILLS
Digital Marketing, SEO, Content Strategy, Analytics

EXPERIENCE
Marketing Manager | Agency | 2021 - Present
- Managed client campaigns
- Increased ROI by 40%

EDUCATION
Bachelor of Arts in Marketing
NYU | 2020
`;

    const base64Data = `data:application/pdf;base64,${Buffer.from(sampleResumeText).toString('base64')}`;

    // Upload resume with auto-fill enabled (simulating wizard confirmation)
    const uploadResult = await caller.candidate.uploadResume({
      candidateId: testCandidateId,
      fileData: base64Data,
      fileName: 'jane-resume.pdf',
      autoFill: true,
    });

    // Verify upload was successful
    expect(uploadResult).toBeDefined();
    expect(uploadResult.success).toBe(true);
    expect(uploadResult.url).toBeDefined();
    expect(uploadResult.parsedData).toBeDefined();

    // Verify profile was updated
    const updatedCandidate = await db.select()
      .from(candidates)
      .where({ id: testCandidateId })
      .limit(1);

    expect(updatedCandidate).toBeDefined();
    expect(updatedCandidate[0].resumeUrl).toBeDefined();
    expect(updatedCandidate[0].skills).toBeDefined();
  });

  it('should not auto-fill profile when autoFill is false', async () => {
    const caller = appRouter.createCaller({
      user: { id: testUserId, email: `test-wizard-${Date.now()}@test.com`, role: 'candidate' },
    });

    // Get current candidate data
    const beforeCandidate = await db.select()
      .from(candidates)
      .where({ id: testCandidateId })
      .limit(1);

    const beforeSkills = beforeCandidate[0].skills;

    // Sample resume data
    const sampleResumeText = `
Test User
test@example.com

SKILLS
New Skill 1, New Skill 2, New Skill 3
`;

    const base64Data = `data:application/pdf;base64,${Buffer.from(sampleResumeText).toString('base64')}`;

    // Upload resume WITHOUT auto-fill
    const uploadResult = await caller.candidate.uploadResume({
      candidateId: testCandidateId,
      fileData: base64Data,
      fileName: 'test-no-autofill.pdf',
      autoFill: false,
    });

    // Verify upload was successful
    expect(uploadResult).toBeDefined();
    expect(uploadResult.success).toBe(true);

    // Verify profile skills were NOT updated (only resume URL should change)
    const afterCandidate = await db.select()
      .from(candidates)
      .where({ id: testCandidateId })
      .limit(1);

    expect(afterCandidate[0].resumeUrl).toBeDefined();
    expect(afterCandidate[0].skills).toBe(beforeSkills); // Skills should remain unchanged
  });
});
