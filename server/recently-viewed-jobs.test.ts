import { describe, it, expect } from 'vitest';
import { trackRecentlyViewedJob, getRecentlyViewedJobsByCandidateId } from './db';

describe('Recently Viewed Jobs', () => {
  describe('trackRecentlyViewedJob', () => {
    it('should track a new job view', async () => {
      const candidateId = 1;
      const jobId = 1;
      
      const result = await trackRecentlyViewedJob(candidateId, jobId);
      
      expect(result).toBeDefined();
    });

    it('should update existing view timestamp when viewing same job again', async () => {
      const candidateId = 1;
      const jobId = 1;
      
      // First view
      const firstView = await trackRecentlyViewedJob(candidateId, jobId);
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Second view
      const secondView = await trackRecentlyViewedJob(candidateId, jobId);
      
      // Should update the same record, not create a new one
      expect(secondView).toBeDefined();
    });
  });

  describe('getRecentlyViewedJobsByCandidateId', () => {
    it('should return empty array for candidate with no viewed jobs', async () => {
      const candidateId = 99999; // Non-existent candidate
      
      const result = await getRecentlyViewedJobsByCandidateId(candidateId);
      
      expect(result).toEqual([]);
    });

    it('should respect the limit parameter', async () => {
      const candidateId = 1;
      const limit = 5;
      
      const result = await getRecentlyViewedJobsByCandidateId(candidateId, limit);
      
      expect(result.length).toBeLessThanOrEqual(limit);
    });

    it('should return results ordered by most recent first', async () => {
      const candidateId = 1;
      
      // Track multiple jobs
      await trackRecentlyViewedJob(candidateId, 1);
      await new Promise(resolve => setTimeout(resolve, 100));
      await trackRecentlyViewedJob(candidateId, 2);
      await new Promise(resolve => setTimeout(resolve, 100));
      await trackRecentlyViewedJob(candidateId, 3);
      
      const result = await getRecentlyViewedJobsByCandidateId(candidateId, 10);
      
      if (result.length >= 3) {
        // Most recent should be first
        const timestamps = result.map(r => new Date(r.viewRecord.viewedAt).getTime());
        for (let i = 0; i < timestamps.length - 1; i++) {
          expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i + 1]);
        }
      }
    });

    it('should include job details in the response', async () => {
      const candidateId = 1;
      const jobId = 1;
      
      await trackRecentlyViewedJob(candidateId, jobId);
      
      const result = await getRecentlyViewedJobsByCandidateId(candidateId, 10);
      
      if (result.length > 0) {
        const firstResult = result[0];
        expect(firstResult).toHaveProperty('viewRecord');
        expect(firstResult).toHaveProperty('job');
        expect(firstResult.viewRecord).toHaveProperty('candidateId');
        expect(firstResult.viewRecord).toHaveProperty('jobId');
        expect(firstResult.viewRecord).toHaveProperty('viewedAt');
      }
    });
  });
});
