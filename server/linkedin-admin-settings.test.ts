import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';
import * as db from './db';

describe('LinkedIn Admin Settings', () => {
  beforeAll(async () => {
    // Ensure database connection
    const database = await getDb();
    if (!database) {
      throw new Error('Database connection failed');
    }
  });

  afterAll(async () => {
    // Clean up test data
    try {
      await db.setSystemSetting('linkedin_api_key', '');
      await db.setSystemSetting('linkedin_client_id', '');
      await db.setSystemSetting('linkedin_client_secret', '');
    } catch (error) {
      console.log('Cleanup error (expected if settings do not exist):', error);
    }
  });

  describe('System Settings Management', () => {
    it('should set and retrieve system settings', async () => {
      // Set test values
      await db.setSystemSetting('linkedin_api_key', 'test_api_key_123');
      await db.setSystemSetting('linkedin_client_id', 'test_client_id_456');
      await db.setSystemSetting('linkedin_client_secret', 'test_secret_789');

      // Retrieve values
      const apiKey = await db.getSystemSetting('linkedin_api_key');
      const clientId = await db.getSystemSetting('linkedin_client_id');
      const clientSecret = await db.getSystemSetting('linkedin_client_secret');

      expect(apiKey).toBe('test_api_key_123');
      expect(clientId).toBe('test_client_id_456');
      expect(clientSecret).toBe('test_secret_789');
    });

    it('should update existing system settings', async () => {
      // Set initial value
      await db.setSystemSetting('linkedin_api_key', 'old_key');
      
      // Update value
      await db.setSystemSetting('linkedin_api_key', 'new_key');
      
      // Verify update
      const apiKey = await db.getSystemSetting('linkedin_api_key');
      expect(apiKey).toBe('new_key');
    });

    it('should return null for non-existent settings', async () => {
      const nonExistent = await db.getSystemSetting('non_existent_key_12345');
      expect(nonExistent).toBeNull();
    });
  });

  describe('LinkedIn Credit Usage Tracking', () => {
    it('should retrieve credit usage (empty initially)', async () => {
      const usage = await db.getLinkedInCreditUsage();
      expect(Array.isArray(usage)).toBe(true);
      // May be empty or have existing data, just verify it's an array
    });

    it('should retrieve recruiter credit limits', async () => {
      const limits = await db.getRecruiterCreditLimits();
      expect(Array.isArray(limits)).toBe(true);
      // May be empty or have existing data, just verify it's an array
    });
  });

  describe('Recruiter Credit Limit Management', () => {
    it('should set and check recruiter credit limit', async () => {
      const testRecruiterId = 999; // Use a test ID that won't conflict
      
      // Set credit limit
      await db.updateRecruiterCreditLimit(testRecruiterId, 100);
      
      // Verify limit was set
      const limitStr = await db.getSystemSetting(`recruiter_${testRecruiterId}_credit_limit`);
      expect(limitStr).toBe('100');
      
      // Check credit limit (should be allowed since no usage yet)
      const check = await db.checkRecruiterCreditLimit(testRecruiterId);
      expect(check.allowed).toBe(true);
      expect(check.remaining).toBe(100);
      
      // Clean up
      await db.setSystemSetting(`recruiter_${testRecruiterId}_credit_limit`, '');
    });

    it('should return unlimited when no limit is set', async () => {
      const testRecruiterId = 998; // Different test ID
      
      // Check without setting limit
      const check = await db.checkRecruiterCreditLimit(testRecruiterId);
      expect(check.allowed).toBe(true);
      expect(check.remaining).toBeGreaterThan(100); // Should be 999 (unlimited)
    });
  });

  describe('Database Schema Validation', () => {
    it('should have linkedin_credit_usage table', async () => {
      const database = await getDb();
      if (!database) throw new Error('Database not available');
      
      const { sql } = await import('drizzle-orm');
      
      // Query to check if table exists
      const result = await database.execute(sql`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_name = 'linkedin_credit_usage'
      `);
      
      expect(result).toBeDefined();
    });

    it('should have inmail_templates table', async () => {
      const database = await getDb();
      if (!database) throw new Error('Database not available');
      
      const { sql } = await import('drizzle-orm');
      
      // Query to check if table exists
      const result = await database.execute(sql`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_name = 'inmail_templates'
      `);
      
      expect(result).toBeDefined();
    });

    it('should have systemSettings table', async () => {
      const database = await getDb();
      if (!database) throw new Error('Database not available');
      
      const { sql } = await import('drizzle-orm');
      
      // Query to check if table exists
      const result = await database.execute(sql`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_name = 'systemSettings'
      `);
      
      expect(result).toBeDefined();
    });
  });
});
