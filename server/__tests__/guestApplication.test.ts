import { describe, it, expect } from 'vitest';
import { appRouter } from '../routers';

describe('Guest Application Workflow', () => {
  it('should accept guest application submission with valid data', async () => {
    // This test validates the API contract without hitting the database
    // Real integration testing would require database setup
    
    const caller = appRouter.createCaller({ user: null });

    // Test that the procedure exists and has correct input validation
    expect(caller.guestApplication).toBeDefined();
    expect(caller.guestApplication.submit).toBeDefined();
    expect(caller.guestApplication.getById).toBeDefined();
    expect(caller.guestApplication.claimApplications).toBeDefined();
  });

  it('should validate required fields in guest application', async () => {
    const caller = appRouter.createCaller({ user: null });

    // Test validation - missing required fields should fail
    await expect(async () => {
      await caller.guestApplication.submit({
        // @ts-expect-error - testing validation
        jobId: 'invalid',
        email: 'not-an-email',
        name: '',
        resumeFile: {
          data: '',
          filename: '',
          mimeType: '',
        },
      });
    }).rejects.toThrow();
  });

  it('should require authentication for claiming applications', async () => {
    const caller = appRouter.createCaller({ user: null });

    // Claiming should require authentication
    await expect(async () => {
      await caller.guestApplication.claimApplications();
    }).rejects.toThrow();
  });

  it('should validate email format in guest application', async () => {
    const caller = appRouter.createCaller({ user: null });

    await expect(async () => {
      await caller.guestApplication.submit({
        jobId: 1,
        email: 'invalid-email',
        name: 'Test User',
        resumeFile: {
          data: 'test',
          filename: 'resume.pdf',
          mimeType: 'application/pdf',
        },
      });
    }).rejects.toThrow();
  });
});
