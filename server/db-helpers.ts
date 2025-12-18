import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Update user by ID with partial data
 */
export async function updateUserById(userId: number, data: Partial<{
  emailVerified: boolean;
  verificationToken: string | null;
  verificationTokenExpiry: Date | null;
  passwordResetToken: string | null;
  passwordResetTokenExpiry: Date | null;
  name: string;
  email: string;
  role: string;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users).set(data as any).where(eq(users.id, userId));
}

/**
 * Update user by email with partial data
 */
export async function updateUserByEmail(email: string, data: Partial<{
  emailVerified: boolean;
  verificationToken: string | null;
  verificationTokenExpiry: Date | null;
  passwordResetToken: string | null;
  passwordResetTokenExpiry: Date | null;
  name: string;
  role: string;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users).set(data as any).where(eq(users.email, email));
}

/**
 * Delete user by ID (for testing purposes)
 */
export async function deleteUserById(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(users).where(eq(users.id, userId));
}
