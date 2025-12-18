import { getDb } from "../db";
import { sendEmail } from "../_core/emailService";

interface UsageAlert {
  id: number;
  userId: number | null;
  companyId: number | null;
  alertType: "usage_threshold" | "cost_threshold" | "error_rate" | "provider_failure";
  threshold: number;
  period: "hourly" | "daily" | "weekly" | "monthly";
  enabled: boolean;
  emailRecipients: string;
}

/**
 * Check all active alerts and trigger if thresholds exceeded
 */
export async function checkAlerts(): Promise<void> {
  const db = await getDb();
  
  // Get all enabled alerts
  const alerts = await db
    .select("*")
    .from("llm_usage_alerts")
    .where("enabled", true);

  for (const alert of alerts) {
    await checkSingleAlert(alert as UsageAlert);
  }
}

/**
 * Check a single alert against current usage
 */
async function checkSingleAlert(alert: UsageAlert): Promise<void> {
  const { startDate, endDate } = getPeriodDates(alert.period);
  
  let actualValue = 0;
  let message = "";

  switch (alert.alertType) {
    case "usage_threshold":
      actualValue = await getUsageForPeriod(startDate, endDate, alert.companyId, alert.userId);
      message = `Token usage has exceeded threshold. Used: ${actualValue.toLocaleString()} tokens, Threshold: ${alert.threshold.toLocaleString()} tokens`;
      break;
      
    case "cost_threshold":
      actualValue = await getCostForPeriod(startDate, endDate, alert.companyId);
      message = `LLM costs have exceeded threshold. Spent: $${actualValue.toFixed(2)}, Threshold: $${alert.threshold.toFixed(2)}`;
      break;
      
    case "error_rate":
      actualValue = await getErrorRateForPeriod(startDate, endDate, alert.companyId);
      message = `LLM error rate has exceeded threshold. Error rate: ${actualValue.toFixed(1)}%, Threshold: ${alert.threshold}%`;
      break;
      
    case "provider_failure":
      const failureCount = await getProviderFailures(startDate, endDate);
      actualValue = failureCount;
      message = `Provider failures detected. Failures: ${failureCount}, Threshold: ${alert.threshold}`;
      break;
  }

  // Trigger alert if threshold exceeded
  if (actualValue > alert.threshold) {
    await triggerAlert(alert, actualValue, message);
  }
}

/**
 * Trigger an alert and send notification
 */
async function triggerAlert(
  alert: UsageAlert,
  actualValue: number,
  message: string
): Promise<void> {
  const db = await getDb();
  
  // Check if alert was already triggered recently (prevent spam)
  const recentAlert = await db
    .select("*")
    .from("llm_alert_history")
    .where("alertId", alert.id)
    .where("triggeredAt", ">", new Date(Date.now() - 3600000)) // Last hour
    .first();

  if (recentAlert) {
    console.log(`[LLM Alert] Skipping duplicate alert ${alert.id}`);
    return;
  }

  // Log alert to history
  const [historyId] = await db
    .insert({
      alertId: alert.id,
      alertType: alert.alertType,
      threshold: alert.threshold,
      actualValue,
      message,
      emailSent: false,
    })
    .into("llm_alert_history");

  // Send email notification
  const recipients = alert.emailRecipients.split(",").map(email => email.trim());
  const emailSent = await sendAlertEmail(recipients, alert, message);

  // Update email sent status
  if (emailSent) {
    await db
      .update({ emailSent: true, emailSentAt: new Date() })
      .table("llm_alert_history")
      .where("id", historyId);
  }
}

/**
 * Send alert email to recipients
 */
async function sendAlertEmail(
  recipients: string[],
  alert: UsageAlert,
  message: string
): Promise<boolean> {
  const subject = `⚠️ LLM Usage Alert: ${alert.alertType.replace("_", " ").toUpperCase()}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .alert-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
        .info-item { background: white; padding: 15px; border-radius: 6px; }
        .label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
        .value { font-size: 18px; font-weight: bold; color: #111827; margin-top: 5px; }
        .cta { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">⚠️ LLM Usage Alert</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Threshold Exceeded</p>
        </div>
        <div class="content">
          <div class="alert-box">
            <strong>Alert Triggered:</strong><br/>
            ${message}
          </div>
          
          <div class="info-grid">
            <div class="info-item">
              <div class="label">Alert Type</div>
              <div class="value">${alert.alertType.replace("_", " ")}</div>
            </div>
            <div class="info-item">
              <div class="label">Period</div>
              <div class="value">${alert.period}</div>
            </div>
            <div class="info-item">
              <div class="label">Threshold</div>
              <div class="value">${alert.threshold.toLocaleString()}</div>
            </div>
            <div class="info-item">
              <div class="label">Scope</div>
              <div class="value">${alert.companyId ? "Company" : "System-wide"}</div>
            </div>
          </div>
          
          <p><strong>Recommended Actions:</strong></p>
          <ul>
            <li>Review LLM usage patterns in the cost tracking dashboard</li>
            <li>Consider optimizing prompts to reduce token usage</li>
            <li>Check for any unexpected spikes in API calls</li>
            <li>Adjust alert thresholds if current usage is expected</li>
          </ul>
          
          <a href="${process.env.VITE_FRONTEND_FORGE_API_URL || "https://hotgigs.com"}/admin/llm-cost-tracking" class="cta">
            View Cost Dashboard →
          </a>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    for (const recipient of recipients) {
      await sendEmail({
        to: recipient,
        subject,
        html,
      });
    }
    return true;
  } catch (error) {
    console.error("[LLM Alert] Failed to send email:", error);
    return false;
  }
}

/**
 * Get period date range based on period type
 */
function getPeriodDates(period: string): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case "hourly":
      startDate.setHours(startDate.getHours() - 1);
      break;
    case "daily":
      startDate.setDate(startDate.getDate() - 1);
      break;
    case "weekly":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "monthly":
      startDate.setMonth(startDate.getMonth() - 1);
      break;
  }

  return { startDate, endDate };
}

/**
 * Get total token usage for period
 */
async function getUsageForPeriod(
  startDate: Date,
  endDate: Date,
  companyId: number | null,
  userId: number | null
): Promise<number> {
  const db = await getDb();
  
  let query = db
    .select(db.raw("SUM(tokensUsed) as total"))
    .from("llm_cost_tracking")
    .where("createdAt", ">=", startDate)
    .where("createdAt", "<=", endDate);

  if (companyId) {
    query = query.where("companyId", companyId);
  }

  if (userId) {
    query = query.where("userId", userId);
  }

  const result = await query.first();
  return result?.total || 0;
}

/**
 * Get total cost for period
 */
async function getCostForPeriod(
  startDate: Date,
  endDate: Date,
  companyId: number | null
): Promise<number> {
  const db = await getDb();
  
  let query = db
    .select(db.raw("SUM(totalCost) as total"))
    .from("llm_cost_tracking")
    .where("createdAt", ">=", startDate)
    .where("createdAt", "<=", endDate);

  if (companyId) {
    query = query.where("companyId", companyId);
  }

  const result = await query.first();
  return result?.total || 0;
}

/**
 * Get error rate for period
 */
async function getErrorRateForPeriod(
  startDate: Date,
  endDate: Date,
  companyId: number | null
): Promise<number> {
  const db = await getDb();
  
  let query = db
    .select(db.raw("COUNT(*) as total, SUM(CASE WHEN success = false THEN 1 ELSE 0 END) as errors"))
    .from("llm_usage_logs")
    .where("createdAt", ">=", startDate)
    .where("createdAt", "<=", endDate);

  if (companyId) {
    query = query.where("companyId", companyId);
  }

  const result = await query.first();
  const total = result?.total || 0;
  const errors = result?.errors || 0;

  return total > 0 ? (errors / total) * 100 : 0;
}

/**
 * Get provider failure count for period
 */
async function getProviderFailures(
  startDate: Date,
  endDate: Date
): Promise<number> {
  const db = await getDb();
  
  const result = await db
    .select(db.raw("COUNT(*) as count"))
    .from("llm_fallback_events")
    .where("createdAt", ">=", startDate)
    .where("createdAt", "<=", endDate)
    .where("success", false)
    .first();

  return result?.count || 0;
}
