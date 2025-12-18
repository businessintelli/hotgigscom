import { Request, Response } from 'express';
import crypto from 'crypto';
import { getDb } from './db';
import { emailDeliveryEvents, emailWebhookLogs, campaignRecipients } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { ENV } from './_core/env';

/**
 * Verify SendGrid webhook signature
 */
function verifySendGridSignature(payload: string, signature: string, timestamp: string): boolean {
  if (!ENV.sendGridApiKey) return false;
  
  const publicKey = ENV.sendGridApiKey; // In production, use SendGrid's webhook verification key
  const expectedSignature = crypto
    .createHmac('sha256', publicKey)
    .update(timestamp + payload)
    .digest('base64');
  
  return signature === expectedSignature;
}

/**
 * Verify Resend webhook signature
 */
function verifyResendSignature(payload: string, signature: string): boolean {
  if (!ENV.resendApiKey) return false;
  
  const expectedSignature = crypto
    .createHmac('sha256', ENV.resendApiKey)
    .update(payload)
    .digest('hex');
  
  return signature === `sha256=${expectedSignature}`;
}

/**
 * Process delivery event and update campaign recipient status
 */
async function processDeliveryEvent(
  provider: string,
  eventType: string,
  email: string,
  messageId?: string,
  reason?: string,
  metadata?: any
) {
  const db = await getDb();
  if (!db) {
    console.error('[Webhook] Database not available');
    return;
  }

  try {
    // Find campaign recipient by email or message ID
    let recipient = null;
    if (messageId) {
      const [found] = await db
        .select()
        .from(campaignRecipients)
        .where(eq(campaignRecipients.trackingId, messageId))
        .limit(1);
      recipient = found;
    }

    // Log delivery event
    await db.insert(emailDeliveryEvents).values({
      campaignRecipientId: recipient?.id,
      eventType,
      provider,
      email,
      messageId,
      reason,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });

    // Update campaign recipient status
    if (recipient) {
      const statusMap: Record<string, any> = {
        delivered: { sentAt: new Date(), status: 'delivered' },
        bounce: { bouncedAt: new Date(), status: 'bounced' },
        dropped: { bouncedAt: new Date(), status: 'failed' },
        spam_report: { status: 'spam' },
        click: { clickedAt: new Date() },
        open: { openedAt: new Date() },
        deferred: { status: 'deferred' },
        failed: { status: 'failed' },
      };

      const updates = statusMap[eventType];
      if (updates) {
        await db
          .update(campaignRecipients)
          .set(updates)
          .where(eq(campaignRecipients.id, recipient.id));
      }
    }

    console.log(`[Webhook] Processed ${eventType} event for ${email}`);
  } catch (error: any) {
    console.error('[Webhook] Error processing event:', error.message);
    throw error;
  }
}

/**
 * SendGrid webhook handler
 */
export async function handleSendGridWebhook(req: Request, res: Response) {
  const db = await getDb();
  if (!db) {
    return res.status(500).json({ error: 'Database not available' });
  }

  try {
    const events = Array.isArray(req.body) ? req.body : [req.body];
    const signature = req.headers['x-twilio-email-event-webhook-signature'] as string;
    const timestamp = req.headers['x-twilio-email-event-webhook-timestamp'] as string;

    for (const event of events) {
      const payload = JSON.stringify(event);
      
      // Verify signature
      const verified = signature && timestamp 
        ? verifySendGridSignature(payload, signature, timestamp)
        : false;

      // Log webhook call
      const [logEntry] = await db.insert(emailWebhookLogs).values({
        provider: 'sendgrid',
        eventType: event.event,
        payload: event,
        signature,
        verified,
        processed: false,
      }).$returningId();

      try {
        // Process event
        await processDeliveryEvent(
          'sendgrid',
          event.event,
          event.email,
          event.sg_message_id,
          event.reason,
          {
            ip: event.ip,
            useragent: event.useragent,
            url: event.url,
          }
        );

        // Mark as processed
        await db
          .update(emailWebhookLogs)
          .set({ processed: true })
          .where(eq(emailWebhookLogs.id, logEntry.id));

      } catch (error: any) {
        // Log error
        await db
          .update(emailWebhookLogs)
          .set({ error: error.message })
          .where(eq(emailWebhookLogs.id, logEntry.id));
      }
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('[SendGrid Webhook] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Resend webhook handler
 */
export async function handleResendWebhook(req: Request, res: Response) {
  const db = await getDb();
  if (!db) {
    return res.status(500).json({ error: 'Database not available' });
  }

  try {
    const event = req.body;
    const signature = req.headers['svix-signature'] as string;
    const payload = JSON.stringify(event);

    // Verify signature
    const verified = signature ? verifyResendSignature(payload, signature) : false;

    // Log webhook call
    const [logEntry] = await db.insert(emailWebhookLogs).values({
      provider: 'resend',
      eventType: event.type,
      payload: event,
      signature,
      verified,
      processed: false,
    }).$returningId();

    try {
      // Map Resend event types to our standard types
      const eventTypeMap: Record<string, string> = {
        'email.sent': 'delivered',
        'email.delivered': 'delivered',
        'email.delivery_delayed': 'deferred',
        'email.complained': 'spam_report',
        'email.bounced': 'bounce',
        'email.opened': 'open',
        'email.clicked': 'click',
      };

      const standardEventType = eventTypeMap[event.type] || event.type;

      // Process event
      await processDeliveryEvent(
        'resend',
        standardEventType,
        event.data?.to?.[0] || event.data?.email,
        event.data?.email_id,
        event.data?.reason,
        event.data
      );

      // Mark as processed
      await db
        .update(emailWebhookLogs)
        .set({ processed: true })
        .where(eq(emailWebhookLogs.id, logEntry.id));

    } catch (error: any) {
      // Log error
      await db
        .update(emailWebhookLogs)
        .set({ error: error.message })
        .where(eq(emailWebhookLogs.id, logEntry.id));
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('[Resend Webhook] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get delivery statistics for a campaign
 */
export async function getCampaignDeliveryStats(campaignId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const { count, sql } = await import('drizzle-orm');

  // Get all recipients for this campaign
  const recipients = await db
    .select()
    .from(campaignRecipients)
    .where(eq(campaignRecipients.campaignId, campaignId));

  const stats = {
    total: recipients.length,
    sent: recipients.filter(r => r.sentAt).length,
    delivered: 0,
    bounced: recipients.filter(r => r.bouncedAt).length,
    opened: recipients.filter(r => r.openedAt).length,
    clicked: recipients.filter(r => r.clickedAt).length,
    spamReports: 0, // Will count from events
    failed: 0,
  };

  // Get delivery events
  const events = await db
    .select()
    .from(emailDeliveryEvents)
    .where(sql`${emailDeliveryEvents.campaignRecipientId} IN (${recipients.map(r => r.id).join(',')})`);

  stats.delivered = events.filter(e => e.eventType === 'delivered').length;
  stats.failed = events.filter(e => ['bounce', 'dropped', 'failed'].includes(e.eventType)).length;

  return stats;
}
