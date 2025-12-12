import { getDb } from "./db";
import { notifications, InsertNotification } from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

/**
 * Create a new notification for a user
 */
export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [notification] = await db.insert(notifications).values(data);
  return notification;
}

/**
 * Get all notifications for a user
 */
export async function getNotificationsByUserId(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

/**
 * Get unread notifications count for a user
 */
export async function getUnreadCount(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const unreadNotifications = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      )
    );

  return unreadNotifications.length;
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.id, notificationId));
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      )
    );
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(notifications)
    .where(eq(notifications.id, notificationId));
}
