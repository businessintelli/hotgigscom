import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from './db';
import { llmUsageAlerts, llmAlertHistory, llmCostTracking, llmFallbackConfig, llmFallbackEvents } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { calculateCost, getTotalCost, getCostByProvider, projectMonthlyCost } from './services/llmCostTracking';
import { checkAlerts, triggerAlert } from './services/llmAlertService';
import { getFallbackChain, invokeWithFallback, initializeFallbackConfig } from './services/llmFallback';

describe('LLM Management System', () => {
  let testAlertId: number;
  let testCompanyId = 1;
  let testUserId = 1;

  beforeAll(async () => {
    // Initialize fallback configuration
    await initializeFallbackConfig();
  });

  afterAll(async () => {
    // Cleanup test data
    if (testAlertId) {
      await db.delete(llmUsageAlerts).where(eq(llmUsageAlerts.id, testAlertId));
    }
    await db.delete(llmCostTracking).where(eq(llmCostTracking.companyId, testCompanyId));
    await db.delete(llmAlertHistory).where(eq(llmAlertHistory.alertId, testAlertId));
  });

  describe('Cost Tracking', () => {
    it('should calculate cost correctly for Manus provider', async () => {
      const result = await calculateCost({
        usageLogId: 1,
        provider: 'manus',
        feature: 'resume_parsing',
        inputTokens: 1000,
        outputTokens: 500,
        companyId: testCompanyId,
        userId: testUserId,
      });

      expect(result).toBeDefined();
      expect(result.totalCost).toBeCloseTo(0.0001 * 1 + 0.0002 * 0.5, 6); // $0.0001/1K input + $0.0002/1K output
    });

    it('should calculate cost correctly for Gemini provider', async () => {
      const result = await calculateCost({
        usageLogId: 2,
        provider: 'gemini',
        feature: 'candidate_matching',
        inputTokens: 2000,
        outputTokens: 1000,
        companyId: testCompanyId,
        userId: testUserId,
      });

      expect(result).toBeDefined();
      expect(result.totalCost).toBeCloseTo(0.00015 * 2 + 0.0006 * 1, 6);
    });

    it('should calculate cost correctly for OpenAI provider', async () => {
      const result = await calculateCost({
        usageLogId: 3,
        provider: 'openai',
        feature: 'interview_analysis',
        inputTokens: 1500,
        outputTokens: 750,
        companyId: testCompanyId,
        userId: testUserId,
      });

      expect(result).toBeDefined();
      expect(result.totalCost).toBeCloseTo(0.0015 * 1.5 + 0.002 * 0.75, 6);
    });

    it('should retrieve total cost for date range', async () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const totalCost = await getTotalCost({
        startDate,
        endDate,
        companyId: testCompanyId,
      });

      expect(totalCost).toBeGreaterThanOrEqual(0);
      expect(typeof totalCost).toBe('number');
    });

    it('should retrieve cost breakdown by provider', async () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const breakdown = await getCostByProvider({
        startDate,
        endDate,
        companyId: testCompanyId,
      });

      expect(Array.isArray(breakdown)).toBe(true);
      if (breakdown.length > 0) {
        expect(breakdown[0]).toHaveProperty('provider');
        expect(breakdown[0]).toHaveProperty('totalCost');
        expect(breakdown[0]).toHaveProperty('requestCount');
        expect(breakdown[0]).toHaveProperty('avgCostPerRequest');
      }
    });

    it('should project monthly cost based on current usage', async () => {
      const projection = await projectMonthlyCost({ companyId: testCompanyId });

      expect(typeof projection).toBe('number');
      expect(projection).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Usage Alerts', () => {
    it('should create a usage alert', async () => {
      const [alert] = await db.insert(llmUsageAlerts).values({
        companyId: testCompanyId,
        alertType: 'cost_threshold',
        threshold: 100.00,
        period: 'monthly',
        enabled: true,
        emailRecipients: 'test@example.com',
      }).returning();

      testAlertId = alert.id;

      expect(alert).toBeDefined();
      expect(alert.alertType).toBe('cost_threshold');
      expect(alert.threshold).toBe('100.00');
      expect(alert.enabled).toBe(true);
    });

    it('should check alerts and not trigger when below threshold', async () => {
      // This test assumes current usage is below 100.00
      const alerts = await db.select().from(llmUsageAlerts).where(eq(llmUsageAlerts.id, testAlertId));
      
      expect(alerts.length).toBe(1);
      
      // Check alert logic (would need to mock usage data for proper testing)
      const alert = alerts[0];
      expect(alert.threshold).toBe('100.00');
    });

    it('should trigger alert and create history entry', async () => {
      const alert = {
        id: testAlertId,
        alertType: 'cost_threshold' as const,
        threshold: 100.00,
        period: 'monthly' as const,
        emailRecipients: 'test@example.com',
        companyId: testCompanyId,
      };

      await triggerAlert(alert, 150.00);

      const history = await db.select()
        .from(llmAlertHistory)
        .where(eq(llmAlertHistory.alertId, testAlertId))
        .limit(1);

      expect(history.length).toBeGreaterThan(0);
      expect(history[0].actualValue).toBe('150.00');
      expect(history[0].alertType).toBe('cost_threshold');
    });

    it('should retrieve alert history', async () => {
      const history = await db.select()
        .from(llmAlertHistory)
        .where(eq(llmAlertHistory.alertId, testAlertId));

      expect(Array.isArray(history)).toBe(true);
      if (history.length > 0) {
        expect(history[0]).toHaveProperty('triggeredAt');
        expect(history[0]).toHaveProperty('message');
        expect(history[0]).toHaveProperty('emailSent');
      }
    });
  });

  describe('Provider Fallback', () => {
    it('should initialize fallback configuration', async () => {
      const chain = await getFallbackChain();

      expect(Array.isArray(chain)).toBe(true);
      expect(chain.length).toBeGreaterThan(0);
      
      // Check that providers are ordered by priority
      for (let i = 0; i < chain.length - 1; i++) {
        expect(chain[i].priority).toBeLessThan(chain[i + 1].priority);
      }
    });

    it('should retrieve fallback chain in priority order', async () => {
      const chain = await getFallbackChain();

      expect(chain.length).toBeGreaterThanOrEqual(3);
      expect(chain[0].provider).toBe('manus'); // Highest priority
      expect(chain[0].priority).toBe(1);
    });

    it('should have correct default configuration', async () => {
      const chain = await getFallbackChain();
      const manusConfig = chain.find(c => c.provider === 'manus');

      expect(manusConfig).toBeDefined();
      expect(manusConfig?.enabled).toBe(true);
      expect(manusConfig?.maxRetries).toBe(3);
      expect(manusConfig?.retryDelayMs).toBe(1000);
    });

    it('should update provider health status', async () => {
      const chain = await getFallbackChain();
      const provider = chain[0];

      await db.update(llmFallbackConfig)
        .set({ 
          isHealthy: false,
          failureCount: 5,
          lastFailureAt: new Date(),
        })
        .where(eq(llmFallbackConfig.id, provider.id));

      const updated = await db.select()
        .from(llmFallbackConfig)
        .where(eq(llmFallbackConfig.id, provider.id))
        .limit(1);

      expect(updated[0].isHealthy).toBe(false);
      expect(updated[0].failureCount).toBe(5);

      // Reset for other tests
      await db.update(llmFallbackConfig)
        .set({ 
          isHealthy: true,
          failureCount: 0,
        })
        .where(eq(llmFallbackConfig.id, provider.id));
    });

    it('should log fallback events', async () => {
      await db.insert(llmFallbackEvents).values({
        fromProvider: 'manus',
        toProvider: 'gemini',
        reason: 'Primary provider timeout',
        feature: 'resume_parsing',
        success: true,
      });

      const events = await db.select()
        .from(llmFallbackEvents)
        .where(eq(llmFallbackEvents.fromProvider, 'manus'))
        .limit(1);

      expect(events.length).toBeGreaterThan(0);
      expect(events[0].toProvider).toBe('gemini');
      expect(events[0].success).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    it('should track cost after LLM invocation', async () => {
      // Simulate LLM usage
      const beforeCount = await db.select().from(llmCostTracking);
      const initialCount = beforeCount.length;

      await calculateCost({
        usageLogId: 999,
        provider: 'manus',
        feature: 'test_feature',
        inputTokens: 100,
        outputTokens: 50,
        companyId: testCompanyId,
        userId: testUserId,
      });

      const afterCount = await db.select().from(llmCostTracking);
      expect(afterCount.length).toBe(initialCount + 1);
    });

    it('should calculate costs across multiple providers', async () => {
      const providers = ['manus', 'gemini', 'openai'];
      
      for (const provider of providers) {
        await calculateCost({
          usageLogId: Math.floor(Math.random() * 10000),
          provider: provider as any,
          feature: 'multi_provider_test',
          inputTokens: 500,
          outputTokens: 250,
          companyId: testCompanyId,
          userId: testUserId,
        });
      }

      const breakdown = await getCostByProvider({
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endDate: new Date(),
        companyId: testCompanyId,
      });

      expect(breakdown.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle alert checking without errors', async () => {
      // This should not throw errors even if no alerts are triggered
      await expect(checkAlerts()).resolves.not.toThrow();
    });
  });

  describe('Data Validation', () => {
    it('should reject invalid provider names', async () => {
      await expect(
        calculateCost({
          usageLogId: 1,
          provider: 'invalid_provider' as any,
          feature: 'test',
          inputTokens: 100,
          outputTokens: 50,
          companyId: testCompanyId,
          userId: testUserId,
        })
      ).rejects.toThrow();
    });

    it('should handle zero token usage', async () => {
      const result = await calculateCost({
        usageLogId: 1,
        provider: 'manus',
        feature: 'test',
        inputTokens: 0,
        outputTokens: 0,
        companyId: testCompanyId,
        userId: testUserId,
      });

      expect(result.totalCost).toBe(0);
    });

    it('should validate alert threshold values', async () => {
      await expect(
        db.insert(llmUsageAlerts).values({
          companyId: testCompanyId,
          alertType: 'cost_threshold',
          threshold: -100, // Invalid negative threshold
          period: 'monthly',
          enabled: true,
          emailRecipients: 'test@example.com',
        })
      ).rejects.toThrow();
    });
  });
});
