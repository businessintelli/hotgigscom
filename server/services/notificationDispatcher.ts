import { getDb } from "../db.js";
import { sendSlackNotification, SlackNotification } from "./slackNotifications.js";
import { sendTeamsNotification, TeamsNotification } from "./teamsNotifications.js";
import { integrationSettings, notificationDeliveryLogs } from "../../drizzle/schema.js";
import { eq, and } from "drizzle-orm";

/**
 * Centralized Notification Dispatcher Service
 * 
 * Handles delivery of notifications to configured Slack/Teams webhooks
 * with retry logic, delivery tracking, and error handling
 */

export type NotificationType = 
  | "budget_alert"
  | "llm_usage" 
  | "application_status"
  | "interview_reminder"
  | "system_health"
  | "job_application"
  | "interview_scheduled";

export interface NotificationPayload {
  type: NotificationType;
  companyId: number;
  title: string;
  message: string;
  severity?: "info" | "warning" | "error" | "success";
  metadata?: Record<string, any>;
  actionUrl?: string;
}

export interface DeliveryResult {
  success: boolean;
  provider: "slack" | "teams";
  webhookUrl: string;
  error?: string;
  deliveryTime: number; // milliseconds
}

/**
 * Send notification to all configured webhooks for a company
 */
export async function dispatchNotification(
  payload: NotificationPayload
): Promise<DeliveryResult[]> {
  const db = getDb();
  const results: DeliveryResult[] = [];

  try {
    // Get all active integrations for the company
    const integrations = await db
      .select()
      .from(integrationSettings)
      .where(
        and(
          eq(integrationSettings.companyId, payload.companyId),
          eq(integrationSettings.isActive, true)
        )
      );

    if (integrations.length === 0) {
      console.log(`[NotificationDispatcher] No active integrations for company ${payload.companyId}`);
      return results;
    }

    // Send to each configured webhook
    for (const integration of integrations) {
      const startTime = Date.now();
      
      try {
        if (integration.provider === "slack") {
          await sendToSlack(integration.webhookUrl, payload);
          const deliveryTime = Date.now() - startTime;
          
          results.push({
            success: true,
            provider: "slack",
            webhookUrl: integration.webhookUrl,
            deliveryTime,
          });

          // Log successful delivery
          await logDelivery(integration.id, payload, "delivered", null, deliveryTime);
          
        } else if (integration.provider === "teams") {
          await sendToTeams(integration.webhookUrl, payload);
          const deliveryTime = Date.now() - startTime;
          
          results.push({
            success: true,
            provider: "teams",
            webhookUrl: integration.webhookUrl,
            deliveryTime,
          });

          // Log successful delivery
          await logDelivery(integration.id, payload, "delivered", null, deliveryTime);
        }
      } catch (error: any) {
        const deliveryTime = Date.now() - startTime;
        const errorMessage = error.message || "Unknown error";
        
        results.push({
          success: false,
          provider: integration.provider as "slack" | "teams",
          webhookUrl: integration.webhookUrl,
          error: errorMessage,
          deliveryTime,
        });

        // Log failed delivery
        await logDelivery(integration.id, payload, "failed", errorMessage, deliveryTime);
        
        console.error(`[NotificationDispatcher] Failed to send to ${integration.provider}:`, error);
      }
    }

    return results;
    
  } catch (error) {
    console.error("[NotificationDispatcher] Error dispatching notification:", error);
    throw error;
  }
}

/**
 * Send notification to Slack webhook
 */
async function sendToSlack(webhookUrl: string, payload: NotificationPayload): Promise<void> {
  const slackNotification: SlackNotification = {
    type: payload.type,
    title: payload.title,
    message: payload.message,
    severity: payload.severity || "info",
    metadata: payload.metadata,
    actionUrl: payload.actionUrl,
  };

  await sendSlackNotification(webhookUrl, slackNotification);
}

/**
 * Send notification to Teams webhook
 */
async function sendToTeams(webhookUrl: string, payload: NotificationPayload): Promise<void> {
  const teamsNotification: TeamsNotification = {
    type: payload.type,
    title: payload.title,
    message: payload.message,
    severity: payload.severity || "info",
    metadata: payload.metadata,
    actionUrl: payload.actionUrl,
  };

  await sendTeamsNotification(webhookUrl, teamsNotification);
}

/**
 * Log notification delivery to database
 */
async function logDelivery(
  integrationId: number,
  payload: NotificationPayload,
  status: "delivered" | "failed",
  errorMessage: string | null,
  deliveryTime: number
): Promise<void> {
  const db = getDb();

  try {
    await db.insert(notificationDeliveryLogs).values({
      integrationId,
      notificationType: payload.type,
      status,
      errorMessage,
      deliveryTime,
      payload: JSON.stringify(payload),
      sentAt: new Date(),
    });
  } catch (error) {
    console.error("[NotificationDispatcher] Failed to log delivery:", error);
    // Don't throw - logging failure shouldn't break notification delivery
  }
}

/**
 * Retry failed notification with exponential backoff
 */
export async function retryNotification(
  payload: NotificationPayload,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<DeliveryResult[]> {
  let lastResults: DeliveryResult[] = [];
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    lastResults = await dispatchNotification(payload);
    
    // Check if all deliveries succeeded
    const allSucceeded = lastResults.every(r => r.success);
    if (allSucceeded) {
      return lastResults;
    }

    // Wait before retrying (exponential backoff)
    if (attempt < maxRetries - 1) {
      const delay = initialDelay * Math.pow(2, attempt);
      console.log(`[NotificationDispatcher] Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return lastResults;
}

/**
 * Batch send multiple notifications
 */
export async function dispatchBatch(
  payloads: NotificationPayload[]
): Promise<Map<NotificationPayload, DeliveryResult[]>> {
  const results = new Map<NotificationPayload, DeliveryResult[]>();

  for (const payload of payloads) {
    try {
      const deliveryResults = await dispatchNotification(payload);
      results.set(payload, deliveryResults);
    } catch (error) {
      console.error("[NotificationDispatcher] Error in batch dispatch:", error);
      results.set(payload, []);
    }
  }

  return results;
}

/**
 * Helper: Send budget alert notification
 */
export async function sendBudgetAlert(
  companyId: number,
  currentSpending: number,
  monthlyLimit: number,
  percentageUsed: number,
  alertType: "warning" | "critical" | "paused"
): Promise<DeliveryResult[]> {
  const titles = {
    warning: "⚠️ Budget Alert: 80% Threshold Reached",
    critical: "🚨 Budget Alert: Limit Exceeded",
    paused: "🛑 AI Features Paused: Budget Exceeded",
  };

  const messages = {
    warning: `Your company has used ${percentageUsed.toFixed(1)}% of the monthly AI budget ($${currentSpending.toFixed(2)} of $${monthlyLimit.toFixed(2)}).`,
    critical: `Your company has exceeded the monthly AI budget limit. Current spending: $${currentSpending.toFixed(2)} (Limit: $${monthlyLimit.toFixed(2)}).`,
    paused: `AI features have been automatically paused due to budget limit exceeded. Current spending: $${currentSpending.toFixed(2)} (Limit: $${monthlyLimit.toFixed(2)}).`,
  };

  return await dispatchNotification({
    type: "budget_alert",
    companyId,
    title: titles[alertType],
    message: messages[alertType],
    severity: alertType === "warning" ? "warning" : "error",
    metadata: {
      currentSpending,
      monthlyLimit,
      percentageUsed,
      alertType,
    },
  });
}

/**
 * Helper: Send application status change notification
 */
export async function sendApplicationStatusNotification(
  companyId: number,
  candidateName: string,
  jobTitle: string,
  oldStatus: string,
  newStatus: string,
  recruiterName: string
): Promise<DeliveryResult[]> {
  return await dispatchNotification({
    type: "application_status",
    companyId,
    title: `📋 Application Status Updated`,
    message: `${candidateName}'s application for "${jobTitle}" changed from ${oldStatus} to ${newStatus} by ${recruiterName}.`,
    severity: "info",
    metadata: {
      candidateName,
      jobTitle,
      oldStatus,
      newStatus,
      recruiterName,
    },
  });
}

/**
 * Helper: Send interview reminder notification
 */
export async function sendInterviewReminderNotification(
  companyId: number,
  candidateName: string,
  jobTitle: string,
  interviewTime: Date,
  hoursUntil: number
): Promise<DeliveryResult[]> {
  const emoji = hoursUntil <= 1 ? "🔔" : "📅";
  const urgency = hoursUntil <= 1 ? "in 1 hour" : `in ${hoursUntil} hours`;

  return await dispatchNotification({
    type: "interview_reminder",
    companyId,
    title: `${emoji} Interview Reminder`,
    message: `Interview with ${candidateName} for "${jobTitle}" is scheduled ${urgency} (${interviewTime.toLocaleString()}).`,
    severity: hoursUntil <= 1 ? "warning" : "info",
    metadata: {
      candidateName,
      jobTitle,
      interviewTime: interviewTime.toISOString(),
      hoursUntil,
    },
  });
}
