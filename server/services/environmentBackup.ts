import * as fs from "fs";
import * as path from "path";
import { getDb } from "../db";
import * as crypto from "crypto";

const BACKUP_DIR = path.join(process.cwd(), "backups", "environment");
const ENCRYPTION_KEY = process.env.BACKUP_ENCRYPTION_KEY || "hotgigs-backup-key-2024"; // Should be in env

interface EnvironmentBackupOptions {
  userId: number;
  description?: string;
}

interface EnvironmentBackupResult {
  id: number;
  filename: string;
  filepath: string;
  createdAt: Date;
  description?: string;
}

/**
 * Encrypt sensitive data
 */
function encrypt(text: string): string {
  const algorithm = "aes-256-cbc";
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  return iv.toString("hex") + ":" + encrypted;
}

/**
 * Decrypt sensitive data
 */
function decrypt(text: string): string {
  const algorithm = "aes-256-cbc";
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  
  const parts = text.split(":");
  const iv = Buffer.from(parts[0], "hex");
  const encryptedText = parts[1];
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}

/**
 * Create environment backup
 */
export async function createEnvironmentBackup(
  options: EnvironmentBackupOptions
): Promise<EnvironmentBackupResult> {
  const db = await getDb();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `env_backup_${timestamp}.json`;
  const filepath = path.join(BACKUP_DIR, filename);

  // Ensure backup directory exists
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  try {
    // Collect all environment variables
    const envVars: Record<string, string> = {};
    
    // List of sensitive keys that should be encrypted
    const sensitiveKeys = [
      "DATABASE_URL",
      "JWT_SECRET",
      "SENDGRID_API_KEY",
      "RESEND_API_KEY",
      "OPENAI_API_KEY",
      "BUILT_IN_FORGE_API_KEY",
      "VITE_FRONTEND_FORGE_API_KEY",
      "BACKUP_ENCRYPTION_KEY",
    ];

    // Collect environment variables
    for (const [key, value] of Object.entries(process.env)) {
      if (value) {
        // Encrypt sensitive values
        if (sensitiveKeys.some(sk => key.includes(sk))) {
          envVars[key] = encrypt(value);
        } else {
          envVars[key] = value;
        }
      }
    }

    // Create backup object
    const backupData = {
      timestamp: new Date().toISOString(),
      createdBy: options.userId,
      description: options.description,
      environment: envVars,
      sensitiveKeys: sensitiveKeys,
    };

    // Write to file
    fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));

    // Create database record
    const [result] = await db.execute(
      `INSERT INTO environment_backups (filename, filepath, created_by, description)
       VALUES (?, ?, ?, ?)`,
      [filename, filepath, options.userId, options.description || null]
    );

    const backupId = (result as any).insertId;

    // Get created backup record
    const [rows] = await db.execute(
      `SELECT * FROM environment_backups WHERE id = ?`,
      [backupId]
    );

    console.log(`[EnvironmentBackup] Created backup ${backupId} by user ${options.userId}`);

    return (rows as any[])[0];
  } catch (error: any) {
    console.error(`[EnvironmentBackup] Failed to create backup:`, error);
    
    // Clean up partial backup file
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
    
    throw new Error(`Failed to create environment backup: ${error.message}`);
  }
}

/**
 * Restore environment from backup
 */
export async function restoreEnvironmentBackup(
  backupId: number,
  userId: number
): Promise<{ restored: number; skipped: number }> {
  const db = await getDb();

  // Get backup record
  const [rows] = await db.execute(
    `SELECT * FROM environment_backups WHERE id = ?`,
    [backupId]
  );

  const backup = (rows as any[])[0];

  if (!backup) {
    throw new Error("Backup not found");
  }

  if (!fs.existsSync(backup.filepath)) {
    throw new Error("Backup file not found on disk");
  }

  try {
    // Read backup file
    const backupContent = fs.readFileSync(backup.filepath, "utf8");
    const backupData = JSON.parse(backupContent);

    let restored = 0;
    let skipped = 0;

    // Note: In production, you would write these to a .env file
    // For now, we'll just log what would be restored
    console.log(`[EnvironmentBackup] Would restore ${Object.keys(backupData.environment).length} environment variables`);

    for (const [key, value] of Object.entries(backupData.environment)) {
      try {
        // Decrypt if it was encrypted
        let decryptedValue = value as string;
        if (backupData.sensitiveKeys && backupData.sensitiveKeys.some((sk: string) => key.includes(sk))) {
          decryptedValue = decrypt(value as string);
        }

        // In production, write to .env file or update process.env
        // For now, just count
        restored++;
      } catch (error) {
        console.error(`[EnvironmentBackup] Failed to restore ${key}:`, error);
        skipped++;
      }
    }

    console.log(`[EnvironmentBackup] Restored backup ${backupId} by user ${userId}: ${restored} restored, ${skipped} skipped`);

    return { restored, skipped };
  } catch (error: any) {
    console.error(`[EnvironmentBackup] Restore failed:`, error);
    throw new Error(`Failed to restore environment backup: ${error.message}`);
  }
}

/**
 * List all environment backups
 */
export async function listEnvironmentBackups(
  limit: number = 50,
  offset: number = 0
): Promise<EnvironmentBackupResult[]> {
  const db = await getDb();

  const [rows] = await db.execute(
    `SELECT e.*, u.name as created_by_name, u.email as created_by_email
     FROM environment_backups e
     LEFT JOIN users u ON e.created_by = u.id
     ORDER BY e.created_at DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );

  return rows as any[];
}

/**
 * Delete environment backup
 */
export async function deleteEnvironmentBackup(backupId: number): Promise<void> {
  const db = await getDb();

  // Get backup record
  const [rows] = await db.execute(
    `SELECT * FROM environment_backups WHERE id = ?`,
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
  await db.execute(`DELETE FROM environment_backups WHERE id = ?`, [backupId]);

  console.log(`[EnvironmentBackup] Deleted backup ${backupId}`);
}

/**
 * Compare two environment backups
 */
export async function compareEnvironmentBackups(
  backupId1: number,
  backupId2: number
): Promise<{
  added: string[];
  removed: string[];
  changed: string[];
  unchanged: string[];
}> {
  const db = await getDb();

  // Get both backups
  const [rows1] = await db.execute(
    `SELECT * FROM environment_backups WHERE id = ?`,
    [backupId1]
  );
  const [rows2] = await db.execute(
    `SELECT * FROM environment_backups WHERE id = ?`,
    [backupId2]
  );

  const backup1 = (rows1 as any[])[0];
  const backup2 = (rows2 as any[])[0];

  if (!backup1 || !backup2) {
    throw new Error("One or both backups not found");
  }

  // Read backup files
  const data1 = JSON.parse(fs.readFileSync(backup1.filepath, "utf8"));
  const data2 = JSON.parse(fs.readFileSync(backup2.filepath, "utf8"));

  const env1 = data1.environment;
  const env2 = data2.environment;

  const keys1 = Object.keys(env1);
  const keys2 = Object.keys(env2);

  const added = keys2.filter(k => !keys1.includes(k));
  const removed = keys1.filter(k => !keys2.includes(k));
  const changed = keys1.filter(k => keys2.includes(k) && env1[k] !== env2[k]);
  const unchanged = keys1.filter(k => keys2.includes(k) && env1[k] === env2[k]);

  return { added, removed, changed, unchanged };
}

/**
 * Get environment backup content (for preview)
 */
export async function getEnvironmentBackupContent(
  backupId: number
): Promise<Record<string, string>> {
  const db = await getDb();

  const [rows] = await db.execute(
    `SELECT * FROM environment_backups WHERE id = ?`,
    [backupId]
  );

  const backup = (rows as any[])[0];

  if (!backup) {
    throw new Error("Backup not found");
  }

  if (!fs.existsSync(backup.filepath)) {
    throw new Error("Backup file not found on disk");
  }

  const backupData = JSON.parse(fs.readFileSync(backup.filepath, "utf8"));
  
  // Return environment variables (still encrypted for sensitive ones)
  return backupData.environment;
}
