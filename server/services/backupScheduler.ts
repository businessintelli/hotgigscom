import { getDb } from "../db";
import { createDatabaseBackup } from "./databaseBackup";
import { createEnvironmentBackup } from "./environmentBackup";
import { cleanupOldBackups } from "./databaseBackup";

interface ScheduleConfig {
  id: number;
  name: string;
  frequency: "hourly" | "daily" | "weekly" | "monthly";
  retentionDays: number;
  enabled: boolean;
  lastRun: Date | null;
  nextRun: Date | null;
}

/**
 * Calculate next run time based on frequency
 */
function calculateNextRun(frequency: string, fromDate: Date = new Date()): Date {
  const next = new Date(fromDate || 0);
  
  switch (frequency) {
    case "hourly":
      next.setHours(next.getHours() + 1);
      break;
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
  }
  
  return next;
}

/**
 * Get all enabled backup schedules
 */
export async function getEnabledSchedules(): Promise<ScheduleConfig[]> {
  const db = await getDb();
  
  const [rows] = await db.execute(
    `SELECT * FROM backup_schedules WHERE enabled = TRUE`
  );
  
  return rows as any[];
}

/**
 * Get schedule by ID
 */
export async function getSchedule(scheduleId: number): Promise<ScheduleConfig | null> {
  const db = await getDb();
  
  const [rows] = await db.execute(
    `SELECT * FROM backup_schedules WHERE id = ?`,
    [scheduleId]
  );
  
  const schedules = rows as any[];
  return schedules.length > 0 ? schedules[0] : null;
}

/**
 * Create a new backup schedule
 */
export async function createSchedule(
  name: string,
  frequency: "hourly" | "daily" | "weekly" | "monthly",
  retentionDays: number = 30
): Promise<number> {
  const db = await getDb();
  
  const nextRun = calculateNextRun(frequency);
  
  const [result] = await db.execute(
    `INSERT INTO backup_schedules (name, frequency, retention_days, enabled, next_run)
     VALUES (?, ?, ?, TRUE, ?)`,
    [name, frequency, retentionDays, nextRun]
  );
  
  return (result as any).insertId;
}

/**
 * Update a backup schedule
 */
export async function updateSchedule(
  scheduleId: number,
  updates: Partial<{
    name: string;
    frequency: "hourly" | "daily" | "weekly" | "monthly";
    retentionDays: number;
    enabled: boolean;
  }>
): Promise<void> {
  const db = await getDb();
  
  const fields: string[] = [];
  const values: any[] = [];
  
  if (updates.name !== undefined) {
    fields.push("name = ?");
    values.push(updates.name);
  }
  
  if (updates.frequency !== undefined) {
    fields.push("frequency = ?");
    values.push(updates.frequency);
    
    // Recalculate next run if frequency changed
    const nextRun = calculateNextRun(updates.frequency);
    fields.push("next_run = ?");
    values.push(nextRun);
  }
  
  if (updates.retentionDays !== undefined) {
    fields.push("retention_days = ?");
    values.push(updates.retentionDays);
  }
  
  if (updates.enabled !== undefined) {
    fields.push("enabled = ?");
    values.push(updates.enabled);
  }
  
  if (fields.length === 0) {
    return;
  }
  
  values.push(scheduleId);
  
  await db.execute(
    `UPDATE backup_schedules SET ${fields.join(", ")} WHERE id = ?`,
    values
  );
}

/**
 * Delete a backup schedule
 */
export async function deleteSchedule(scheduleId: number): Promise<void> {
  const db = await getDb();
  
  await db.execute(`DELETE FROM backup_schedules WHERE id = ?`, [scheduleId]);
}

/**
 * Execute a scheduled backup
 */
export async function executeScheduledBackup(scheduleId: number): Promise<void> {
  const db = await getDb();
  
  const schedule = await getSchedule(scheduleId);
  
  if (!schedule || !schedule.enabled) {
    throw new Error("Schedule not found or disabled");
  }
  
  console.log(`[BackupScheduler] Executing scheduled backup: ${schedule.name}`);
  
  try {
    // Create database backup (using system user ID 1)
    await createDatabaseBackup({
      userId: 1,
      type: "full",
    });
    
    // Update schedule
    const nextRun = calculateNextRun(schedule.frequency);
    
    await db.execute(
      `UPDATE backup_schedules 
       SET last_run = NOW(), next_run = ?
       WHERE id = ?`,
      [nextRun, scheduleId]
    );
    
    // Cleanup old backups based on retention policy
    await cleanupOldBackups(schedule.retentionDays);
    
    console.log(`[BackupScheduler] Scheduled backup completed: ${schedule.name}`);
  } catch (error: any) {
    console.error(`[BackupScheduler] Scheduled backup failed: ${schedule.name}`, error);
    throw error;
  }
}

/**
 * Check and execute due backups
 */
export async function checkAndExecuteDueBackups(): Promise<void> {
  const db = await getDb();
  
  // Get schedules that are due
  const [rows] = await db.execute(
    `SELECT * FROM backup_schedules 
     WHERE enabled = TRUE 
     AND (next_run IS NULL OR next_run <= NOW())`
  );
  
  const dueSchedules = rows as any[];
  
  if (dueSchedules.length === 0) {
    console.log("[BackupScheduler] No due backups");
    return;
  }
  
  console.log(`[BackupScheduler] Found ${dueSchedules.length} due backup(s)`);
  
  for (const schedule of dueSchedules) {
    try {
      await executeScheduledBackup(schedule.id);
    } catch (error) {
      console.error(`[BackupScheduler] Failed to execute backup ${schedule.id}:`, error);
    }
  }
}

/**
 * Start backup scheduler (call this on server startup)
 */
export function startBackupScheduler(): void {
  console.log("[BackupScheduler] Starting backup scheduler");
  
  // Check for due backups every 5 minutes
  const INTERVAL = 5 * 60 * 1000; // 5 minutes
  
  setInterval(async () => {
    try {
      await checkAndExecuteDueBackups();
    } catch (error) {
      console.error("[BackupScheduler] Error checking due backups:", error);
    }
  }, INTERVAL);
  
  // Run immediately on startup
  checkAndExecuteDueBackups().catch((error) => {
    console.error("[BackupScheduler] Initial backup check failed:", error);
  });
}

/**
 * Get backup schedule statistics
 */
export async function getScheduleStatistics(): Promise<{
  totalSchedules: number;
  enabledSchedules: number;
  nextBackup: Date | null;
}> {
  const db = await getDb();
  
  const [rows] = await db.execute(`
    SELECT 
      COUNT(*) as total_schedules,
      SUM(CASE WHEN enabled = TRUE THEN 1 ELSE 0 END) as enabled_schedules,
      MIN(CASE WHEN enabled = TRUE THEN next_run ELSE NULL END) as next_backup
    FROM backup_schedules
  `);
  
  const stats = (rows as any[])[0];
  
  return {
    totalSchedules: stats.total_schedules || 0,
    enabledSchedules: stats.enabled_schedules || 0,
    nextBackup: stats.next_backup,
  };
}
