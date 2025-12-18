/**
 * Application Logger Service
 * Captures and stores application events to the database
 */

import * as db from '../db';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

export interface LogEntry {
  level: LogLevel;
  source: string;
  message: string;
  details?: string;
  userId?: number;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
  stackTrace?: string;
}

/**
 * Log an application event to the database
 */
export async function log(entry: LogEntry): Promise<void> {
  try {
    await db.createApplicationLog({
      level: entry.level,
      source: entry.source,
      message: entry.message,
      details: entry.details,
      userId: entry.userId,
      requestId: entry.requestId,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      stackTrace: entry.stackTrace,
    });
    
    // Also log to console for development
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.source}]`;
    
    if (entry.level === 'error' || entry.level === 'critical') {
      console.error(`${prefix} ${entry.message}`, entry.details || '');
    } else if (entry.level === 'warn') {
      console.warn(`${prefix} ${entry.message}`, entry.details || '');
    } else {
      console.log(`${prefix} ${entry.message}`, entry.details || '');
    }
  } catch (error) {
    // Fallback to console if database logging fails
    console.error('[Logger] Failed to write log to database:', error);
    console.log(`[${entry.level}] [${entry.source}] ${entry.message}`);
  }
}

// Convenience methods
export const logger = {
  debug: (source: string, message: string, details?: Record<string, any>, userId?: number) =>
    log({ level: 'debug', source, message, details: details ? JSON.stringify(details) : undefined, userId }),
  
  info: (source: string, message: string, details?: Record<string, any>, userId?: number) =>
    log({ level: 'info', source, message, details: details ? JSON.stringify(details) : undefined, userId }),
  
  warn: (source: string, message: string, details?: Record<string, any>, userId?: number) =>
    log({ level: 'warn', source, message, details: details ? JSON.stringify(details) : undefined, userId }),
  
  error: (source: string, message: string, error?: Error | Record<string, any>, userId?: number) =>
    log({
      level: 'error',
      source,
      message,
      details: error instanceof Error ? error.message : (error ? JSON.stringify(error) : undefined),
      stackTrace: error instanceof Error ? error.stack : undefined,
      userId,
    }),
  
  critical: (source: string, message: string, error?: Error | Record<string, any>, userId?: number) =>
    log({
      level: 'critical',
      source,
      message,
      details: error instanceof Error ? error.message : (error ? JSON.stringify(error) : undefined),
      stackTrace: error instanceof Error ? error.stack : undefined,
      userId,
    }),
  
  // Auth-specific logging
  authSuccess: (userId: number, email: string, ipAddress?: string) =>
    log({
      level: 'info',
      source: 'auth',
      message: `User logged in successfully: ${email}`,
      userId,
      ipAddress,
    }),
  
  authFailure: (email: string, reason: string, ipAddress?: string) =>
    log({
      level: 'warn',
      source: 'auth',
      message: `Login failed for ${email}: ${reason}`,
      ipAddress,
    }),
  
  // API-specific logging
  apiError: (endpoint: string, error: Error, userId?: number, requestId?: string) =>
    log({
      level: 'error',
      source: 'api',
      message: `API error on ${endpoint}`,
      details: error.message,
      stackTrace: error.stack,
      userId,
      requestId,
    }),
  
  // Email-specific logging
  emailSent: (to: string, subject: string, provider: string, userId?: number) =>
    log({
      level: 'info',
      source: 'email',
      message: `Email sent to ${to}: ${subject}`,
      details: JSON.stringify({ provider }),
      userId,
    }),
  
  emailFailed: (to: string, subject: string, error: Error, userId?: number) =>
    log({
      level: 'error',
      source: 'email',
      message: `Failed to send email to ${to}: ${subject}`,
      details: error.message,
      stackTrace: error.stack,
      userId,
    }),
  
  // Database-specific logging
  dbError: (operation: string, error: Error) =>
    log({
      level: 'error',
      source: 'database',
      message: `Database error during ${operation}`,
      details: error.message,
      stackTrace: error.stack,
    }),
  
  // System events
  systemStart: () =>
    log({
      level: 'info',
      source: 'system',
      message: 'Application server started',
    }),
  
  systemError: (message: string, error?: Error) =>
    log({
      level: 'critical',
      source: 'system',
      message,
      details: error?.message,
      stackTrace: error?.stack,
    }),
};

export default logger;
