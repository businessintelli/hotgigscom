import { getDb } from "../db.js";
import { sendEmail } from "../emailService.js";
import { sql } from "drizzle-orm";

/**
 * Budget Enforcement Service
 * 
 * Monitors company AI spending and enforces budget limits with grace periods
 */

export interface BudgetStatus {
  companyId: number;
  monthlyLimit: number;
  currentSpending: number;
  percentageUsed: number;
  isPaused: boolean;
  isOverBudget: boolean;
  gracePeriodRemaining: number | null; // hours
  overrideEnabled: boolean;
}

export interface BudgetAlert {
  companyId: number;
  alertType: "warning" | "critical" | "paused" | "override";
  message: string;
  currentSpending: number;
  monthlyLimit: number;
}

/**
 * Get budget status for a company
 */
export async function getBudgetStatus(companyId: number): Promise<BudgetStatus | null> {
  const db = await getDb();
  
  const result = await db.execute(sql`
    SELECT 
      companyId,
      monthlyLimit,
      currentSpending,
      isPaused,
      pausedAt,
      gracePeriodHours,
      overrideEnabled
    FROM company_budgets
    WHERE companyId = ${companyId}
  `);
  
  if (!result || result.length === 0) {
    return null;
  }
  
  const budget = result[0] as any;
  const percentageUsed = (budget.currentSpending / budget.monthlyLimit) * 100;
  const isOverBudget = budget.currentSpending >= budget.monthlyLimit;
  
  let gracePeriodRemaining = null;
  if (budget.pausedAt && !budget.isPaused) {
    const pausedTime = new Date(budget.pausedAt).getTime();
    const now = Date.now();
    const elapsedHours = (now - pausedTime) / (1000 * 60 * 60);
    gracePeriodRemaining = Math.max(0, budget.gracePeriodHours - elapsedHours);
  }
  
  return {
    companyId: budget.companyId,
    monthlyLimit: parseFloat(budget.monthlyLimit),
    currentSpending: parseFloat(budget.currentSpending),
    percentageUsed,
    isPaused: budget.isPaused === 1,
    isOverBudget,
    gracePeriodRemaining,
    overrideEnabled: budget.overrideEnabled === 1
  };
}

/**
 * Check if a company can use AI features
 */
export async function canUseAIFeatures(companyId: number): Promise<boolean> {
  const status = await getBudgetStatus(companyId);
  
  if (!status) {
    // No budget set, allow usage
    return true;
  }
  
  // If override is enabled, always allow
  if (status.overrideEnabled) {
    return true;
  }
  
  // If paused, deny
  if (status.isPaused) {
    return false;
  }
  
  // If in grace period, allow
  if (status.gracePeriodRemaining !== null && status.gracePeriodRemaining > 0) {
    return true;
  }
  
  // If over budget and grace period expired, deny
  if (status.isOverBudget) {
    return false;
  }
  
  return true;
}

/**
 * Track AI spending for a company
 */
export async function trackSpending(companyId: number, cost: number): Promise<void> {
  const db = await getDb();
  
  // Update current spending
  await db.execute(sql`
    UPDATE company_budgets
    SET currentSpending = currentSpending + ${cost}
    WHERE companyId = ${companyId}
  `);
  
  // Check if budget exceeded
  const status = await getBudgetStatus(companyId);
  
  if (status && status.isOverBudget && !status.isPaused && !status.overrideEnabled) {
    // Start grace period
    await db.execute(sql`
      UPDATE company_budgets
      SET pausedAt = NOW()
      WHERE companyId = ${companyId}
    `);
    
    // Send warning email
    await sendBudgetAlert({
      companyId,
      alertType: "warning",
      message: `Your company has exceeded the monthly AI budget of $${status.monthlyLimit}. Grace period of ${status.gracePeriodRemaining || 24} hours has started.`,
      currentSpending: status.currentSpending,
      monthlyLimit: status.monthlyLimit
    });
  }
  
  // Check if alert threshold reached (e.g., 80%)
  if (status && status.percentageUsed >= 80 && status.percentageUsed < 100) {
    const db = await getDb();
    const lastAlert = await db.execute(sql`
      SELECT lastAlertSent FROM company_budgets WHERE companyId = ${companyId}
    `);
    
    const lastAlertTime = lastAlert[0]?.lastAlertSent as Date | null;
    const now = new Date();
    
    // Send alert only once per day
    if (!lastAlertTime || (now.getTime() - new Date(lastAlertTime).getTime()) > 24 * 60 * 60 * 1000) {
      await sendBudgetAlert({
        companyId,
        alertType: "warning",
        message: `Your company has used ${status.percentageUsed.toFixed(1)}% of the monthly AI budget ($${status.currentSpending} / $${status.monthlyLimit}).`,
        currentSpending: status.currentSpending,
        monthlyLimit: status.monthlyLimit
      });
      
      await db.execute(sql`
        UPDATE company_budgets
        SET lastAlertSent = NOW()
        WHERE companyId = ${companyId}
      `);
    }
  }
}

/**
 * Pause AI features for a company (after grace period)
 */
export async function pauseAIFeatures(companyId: number): Promise<void> {
  const db = await getDb();
  
  await db.execute(sql`
    UPDATE company_budgets
    SET isPaused = TRUE
    WHERE companyId = ${companyId}
  `);
  
  const status = await getBudgetStatus(companyId);
  
  if (status) {
    await sendBudgetAlert({
      companyId,
      alertType: "paused",
      message: `AI features have been paused due to budget limit exceeded. Current spending: $${status.currentSpending} / $${status.monthlyLimit}.`,
      currentSpending: status.currentSpending,
      monthlyLimit: status.monthlyLimit
    });
  }
}

/**
 * Enable admin override to bypass budget limits
 */
export async function enableBudgetOverride(
  companyId: number,
  adminId: number,
  reason: string
): Promise<void> {
  const db = await getDb();
  
  await db.execute(sql`
    UPDATE company_budgets
    SET 
      overrideEnabled = TRUE,
      overrideBy = ${adminId},
      overrideReason = ${reason},
      overrideAt = NOW(),
      isPaused = FALSE
    WHERE companyId = ${companyId}
  `);
  
  const status = await getBudgetStatus(companyId);
  
  if (status) {
    await sendBudgetAlert({
      companyId,
      alertType: "override",
      message: `Budget override enabled by admin. AI features are now unrestricted. Reason: ${reason}`,
      currentSpending: status.currentSpending,
      monthlyLimit: status.monthlyLimit
    });
  }
}

/**
 * Disable admin override
 */
export async function disableBudgetOverride(companyId: number): Promise<void> {
  const db = await getDb();
  
  await db.execute(sql`
    UPDATE company_budgets
    SET 
      overrideEnabled = FALSE,
      overrideBy = NULL,
      overrideReason = NULL,
      overrideAt = NULL
    WHERE companyId = ${companyId}
  `);
}

/**
 * Reset monthly spending (run at start of each month)
 */
export async function resetMonthlySpending(): Promise<void> {
  const db = await getDb();
  
  await db.execute(sql`
    UPDATE company_budgets
    SET 
      currentSpending = 0,
      isPaused = FALSE,
      pausedAt = NULL,
      lastAlertSent = NULL
  `);
}

/**
 * Send budget alert email to company admins
 */
async function sendBudgetAlert(alert: BudgetAlert): Promise<void> {
  const db = await getDb();
  
  // Get company admins
  const admins = await db.execute(sql`
    SELECT u.email, u.name
    FROM users u
    WHERE u.companyId = ${alert.companyId}
    AND u.role = 'company_admin'
  `);
  
  if (!admins || admins.length === 0) {
    return;
  }
  
  const subject = getAlertSubject(alert.alertType);
  const html = generateAlertEmail(alert);
  
  for (const admin of admins) {
    try {
      await sendEmail({
        to: (admin as any).email,
        subject,
        html
      });
    } catch (error) {
      console.error(`Failed to send budget alert to ${(admin as any).email}:`, error);
    }
  }
}

function getAlertSubject(alertType: BudgetAlert["alertType"]): string {
  switch (alertType) {
    case "warning":
      return "⚠️ AI Budget Alert - Approaching Limit";
    case "critical":
      return "🚨 AI Budget Critical - Limit Exceeded";
    case "paused":
      return "⏸️ AI Features Paused - Budget Limit Reached";
    case "override":
      return "✅ AI Budget Override Enabled";
    default:
      return "AI Budget Notification";
  }
}

function generateAlertEmail(alert: BudgetAlert): string {
  const percentageUsed = (alert.currentSpending / alert.monthlyLimit) * 100;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .alert-box { background: ${getAlertColor(alert.alertType)}; color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .stats { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .stat-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .progress-bar { background: #e0e0e0; height: 20px; border-radius: 10px; overflow: hidden; margin: 10px 0; }
        .progress-fill { background: ${getProgressColor(percentageUsed)}; height: 100%; transition: width 0.3s; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🤖 AI Budget Alert</h1>
        </div>
        <div class="content">
          <div class="alert-box">
            <h2>${getAlertTitle(alert.alertType)}</h2>
            <p>${alert.message}</p>
          </div>
          
          <div class="stats">
            <h3>Budget Overview</h3>
            <div class="stat-row">
              <span>Current Spending:</span>
              <strong>$${alert.currentSpending.toFixed(2)}</strong>
            </div>
            <div class="stat-row">
              <span>Monthly Limit:</span>
              <strong>$${alert.monthlyLimit.toFixed(2)}</strong>
            </div>
            <div class="stat-row">
              <span>Percentage Used:</span>
              <strong>${percentageUsed.toFixed(1)}%</strong>
            </div>
            
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${Math.min(percentageUsed, 100)}%"></div>
            </div>
          </div>
          
          <p><strong>What to do next:</strong></p>
          <ul>
            <li>Review your AI usage in the Cost Tracking Dashboard</li>
            <li>Adjust your monthly budget limit if needed</li>
            <li>Enable budget override if this is temporary</li>
            <li>Contact support for assistance</li>
          </ul>
          
          <a href="${process.env.VITE_APP_URL || "http://localhost:3000"}/company-admin/llm-cost-tracking" class="button">
            View Cost Dashboard
          </a>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getAlertColor(alertType: BudgetAlert["alertType"]): string {
  switch (alertType) {
    case "warning":
      return "#f59e0b";
    case "critical":
      return "#ef4444";
    case "paused":
      return "#dc2626";
    case "override":
      return "#10b981";
    default:
      return "#6b7280";
  }
}

function getProgressColor(percentage: number): string {
  if (percentage >= 100) return "#dc2626";
  if (percentage >= 80) return "#f59e0b";
  return "#10b981";
}

function getAlertTitle(alertType: BudgetAlert["alertType"]): string {
  switch (alertType) {
    case "warning":
      return "Budget Alert";
    case "critical":
      return "Critical: Budget Exceeded";
    case "paused":
      return "AI Features Paused";
    case "override":
      return "Budget Override Enabled";
    default:
      return "Budget Notification";
  }
}

/**
 * Check grace periods and pause AI features if expired
 * Should be run periodically (e.g., every hour)
 */
export async function checkGracePeriods(): Promise<void> {
  const db = await getDb();
  
  const budgets = await db.execute(sql`
    SELECT companyId, pausedAt, gracePeriodHours
    FROM company_budgets
    WHERE isPaused = FALSE
    AND pausedAt IS NOT NULL
    AND overrideEnabled = FALSE
  `);
  
  const now = Date.now();
  
  for (const budget of budgets as any[]) {
    const pausedTime = new Date(budget.pausedAt).getTime();
    const elapsedHours = (now - pausedTime) / (1000 * 60 * 60);
    
    if (elapsedHours >= budget.gracePeriodHours) {
      await pauseAIFeatures(budget.companyId);
    }
  }
}
