import { getDb } from './db';
import { users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Update specific fields for an existing user by email
 */
export async function updateUserByEmail(
  email: string,
  updates: {
    passwordHash?: string | null;
    emailVerified?: boolean;
    verificationToken?: string | null;
    verificationTokenExpiry?: Date | null;
    passwordResetToken?: string | null;
    passwordResetTokenExpiry?: Date | null;
    lastSignedIn?: Date;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  await db.update(users)
    .set(updates)
    .where(eq(users.email, email));
}

/**
 * Update specific fields for an existing user by ID
 */
export async function updateUserById(
  userId: number,
  updates: {
    passwordHash?: string | null;
    emailVerified?: boolean;
    verificationToken?: string | null;
    verificationTokenExpiry?: Date | null;
    passwordResetToken?: string | null;
    passwordResetTokenExpiry?: Date | null;
    lastSignedIn?: Date;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  await db.update(users)
    .set(updates)
    .where(eq(users.id, userId));
}
