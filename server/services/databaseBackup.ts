import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import { getDb } from "../db";

const execAsync = promisify(exec);

const BACKUP_DIR = path.join(process.cwd(), "backups", "database");
const MAX_BACKUP_SIZE = 5 * 1024 * 1024 * 1024; // 5GB

interface BackupOptions {
  userId: number;
  type?: "full" | "incremental" | "manual";
  description?: string;
}

interface BackupResult {
  id: number;
  filename: string;
  filepath: string;
  filesize: number;
  status: string;
  createdAt: Date;
}

/**
 * Create a database backup
 */
export async function createDatabaseBackup(
  options: BackupOptions
): Promise<BackupResult> {
  const db = await getDb();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `hotgigs_backup_${timestamp}.sql`;
  const filepath = path.join(BACKUP_DIR, filename);

  // Ensure backup directory exists
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  // Create backup record
  const [result] = await db.execute(
    `INSERT INTO database_backups (filename, filepath, backup_type, status, created_by)
     VALUES (?, ?, ?, 'in_progress', ?)`,
    [filename, filepath, options.type || "manual", options.userId]
  );

  const backupId = (result as any).insertId;

  try {
    // Get database connection details from environment
    const dbUrl = process.env.DATABASE_URL || "";
    const dbMatch = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);

    if (!dbMatch) {
      throw new Error("Invalid DATABASE_URL format");
    }

    const [, user, password, host, port, database] = dbMatch;

    // Execute mysqldump
    const command = `mysqldump -h ${host} -P ${port} -u ${user} -p${password} ${database} > ${filepath}`;

    await execAsync(command);

    // Get file size
    const stats = fs.statSync(filepath);
    const filesize = stats.size;

    // Check file size limit
    if (filesize > MAX_BACKUP_SIZE) {
      fs.unlinkSync(filepath);
      throw new Error(`Backup size (${filesize} bytes) exceeds maximum allowed (${MAX_BACKUP_SIZE} bytes)`);
    }

    // Update backup record
    await db.execute(
      `UPDATE database_backups 
       SET status = 'completed', filesize = ?, completed_at = NOW()
       WHERE id = ?`,
      [filesize, backupId]
    );

    // Get updated backup record
    const [rows] = await db.execute(
      `SELECT * FROM database_backups WHERE id = ?`,
      [backupId]
    );

    return (rows as any[])[0];
  } catch (error: any) {
    // Update backup record with error
    await db.execute(
      `UPDATE database_backups 
       SET status = 'failed', error_message = ?, completed_at = NOW()
       WHERE id = ?`,
      [error.message, backupId]
    );

    // Clean up partial backup file
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    throw error;
  }
}

/**
 * Restore database from backup
 */
export async function restoreDatabaseBackup(
  backupId: number,
  userId: number
): Promise<void> {
  const db = await getDb();

  // Get backup record
  const [rows] = await db.execute(
    `SELECT * FROM database_backups WHERE id = ? AND status = 'completed'`,
    [backupId]
  );

  const backup = (rows as any[])[0];

  if (!backup) {
    throw new Error("Backup not found or not completed");
  }

  if (!fs.existsSync(backup.filepath)) {
    throw new Error("Backup file not found on disk");
  }

  try {
    // Get database connection details
    const dbUrl = process.env.DATABASE_URL || "";
    const dbMatch = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);

    if (!dbMatch) {
      throw new Error("Invalid DATABASE_URL format");
    }

    const [, user, password, host, port, database] = dbMatch;

    // Execute mysql restore
    const command = `mysql -h ${host} -P ${port} -u ${user} -p${password} ${database} < ${backup.filepath}`;

    await execAsync(command);

    console.log(`[DatabaseBackup] Successfully restored backup ${backupId} by user ${userId}`);
  } catch (error: any) {
    console.error(`[DatabaseBackup] Restore failed:`, error);
    throw new Error(`Failed to restore backup: ${error.message}`);
  }
}

/**
 * List all backups
 */
export async function listDatabaseBackups(
  limit: number = 50,
  offset: number = 0
): Promise<BackupResult[]> {
  const db = await getDb();

  const [rows] = await db.execute(
    `SELECT b.*, u.name as created_by_name, u.email as created_by_email
     FROM database_backups b
     LEFT JOIN users u ON b.created_by = u.id
     ORDER BY b.created_at DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );

  return rows as any[];
}

/**
 * Delete a backup
 */
export async function deleteDatabaseBackup(backupId: number): Promise<void> {
  const db = await getDb();

  // Get backup record
  const [rows] = await db.execute(
    `SELECT * FROM database_backups WHERE id = ?`,
    [backupId]
  );

  const backup = (rows as any[])[0];

  if (!backup) {
    throw new Error("Backup not found");
  }

  // Delete file from disk
  if (fs.existsSync(backup.filepath)) {
    fs.unlinkSync(backup.filepath);
  }

  // Delete record from database
  await db.execute(`DELETE FROM database_backups WHERE id = ?`, [backupId]);

  console.log(`[DatabaseBackup] Deleted backup ${backupId}`);
}

/**
 * Get backup statistics
 */
export async function getBackupStatistics(): Promise<{
  totalBackups: number;
  totalSize: number;
  lastBackup: Date | null;
  successRate: number;
}> {
  const db = await getDb();

  const [rows] = await db.execute(`
    SELECT 
      COUNT(*) as total_backups,
      SUM(filesize) as total_size,
      MAX(created_at) as last_backup,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful_backups
    FROM database_backups
  `);

  const stats = (rows as any[])[0];

  return {
    totalBackups: stats.total_backups || 0,
    totalSize: stats.total_size || 0,
    lastBackup: stats.last_backup,
    successRate: stats.total_backups > 0 
      ? (stats.successful_backups / stats.total_backups) * 100 
      : 0,
  };
}

/**
 * Clean up old backups based on retention policy
 */
export async function cleanupOldBackups(retentionDays: number = 30): Promise<number> {
  const db = await getDb();

  // Get backups older than retention period
  const [rows] = await db.execute(
    `SELECT * FROM database_backups 
     WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
    [retentionDays]
  );

  const oldBackups = rows as any[];
  let deletedCount = 0;

  for (const backup of oldBackups) {
    try {
      await deleteDatabaseBackup(backup.id);
      deletedCount++;
    } catch (error) {
      console.error(`[DatabaseBackup] Failed to delete backup ${backup.id}:`, error);
    }
  }

  console.log(`[DatabaseBackup] Cleaned up ${deletedCount} old backups`);
  return deletedCount;
}
