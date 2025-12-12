import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from './db';
import { emailWebhookLogs, emailDeliveryEvents } from '../drizzle/schema';

describe('Email Webhook Integration', () => {
  beforeAll(async () => {
    // Ensure database is available
    const db = await getDb();
    expect(db).toBeDefined();
  });

  it('should have emailWebhookLogs table in database', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Try to query the table
    const logs = await db.select().from(emailWebhookLogs).limit(1);
    expect(Array.isArray(logs)).toBe(true);
  });

  it('should have emailDeliveryEvents table in database', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Try to query the table
    const events = await db.select().from(emailDeliveryEvents).limit(1);
    expect(Array.isArray(events)).toBe(true);
  });

  it('should have webhook endpoints configured', async () => {
    // Test that webhook handler functions exist
    const { handleSendGridWebhook, handleResendWebhook } = await import('./emailWebhooks');
    
    expect(typeof handleSendGridWebhook).toBe('function');
    expect(typeof handleResendWebhook).toBe('function');
  });

  it('should process delivery events correctly', async () => {
    const { getCampaignDeliveryStats } = await import('./emailWebhooks');
    
    // Test with a non-existent campaign (should return zero stats)
    const stats = await getCampaignDeliveryStats(99999);
    
    expect(stats).toBeDefined();
    expect(stats.total).toBe(0);
    expect(stats.sent).toBe(0);
    expect(stats.delivered).toBe(0);
    expect(stats.bounced).toBe(0);
  });
});
