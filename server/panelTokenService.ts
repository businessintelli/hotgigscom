import { randomBytes } from "crypto";
import * as db from "./db";

interface TokenData {
  panelistId: number;
  interviewId: number;
  actionType: "accept" | "decline" | "reschedule" | "feedback";
  expiresInDays?: number;
}

interface TokenValidation {
  valid: boolean;
  expired?: boolean;
  used?: boolean;
  token?: {
    id: number;
    panelistId: number;
    interviewId: number;
    actionType: string;
  };
}

/**
 * Generate a secure random token
 */
function generateSecureToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Create action tokens for a panelist (all 4 types)
 */
export async function createPanelActionTokens(
  panelistId: number,
  interviewId: number,
  expiresInDays: number = 30
): Promise<{
  acceptToken: string;
  declineToken: string;
  rescheduleToken: string;
  feedbackToken: string;
}> {
  const { panelActionTokens } = await import("../drizzle/schema");
  const database = await db.getDb();
  if (!database) throw new Error("Database not available");

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const tokens = {
    acceptToken: generateSecureToken(),
    declineToken: generateSecureToken(),
    rescheduleToken: generateSecureToken(),
    feedbackToken: generateSecureToken(),
  };

  // Insert all tokens
  await database.insert(panelActionTokens).values([
    {
      panelistId,
      interviewId,
      token: tokens.acceptToken,
      actionType: "accept",
      expiresAt,
    },
    {
      panelistId,
      interviewId,
      token: tokens.declineToken,
      actionType: "decline",
      expiresAt,
    },
    {
      panelistId,
      interviewId,
      token: tokens.rescheduleToken,
      actionType: "reschedule",
      expiresAt,
    },
    {
      panelistId,
      interviewId,
      token: tokens.feedbackToken,
      actionType: "feedback",
      expiresAt: new Date(expiresAt.getTime() + 7 * 24 * 60 * 60 * 1000), // Feedback token valid 7 days longer
    },
  ]);

  return tokens;
}

/**
 * Validate a token and return its data
 */
export async function validateToken(token: string): Promise<TokenValidation> {
  const { panelActionTokens } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  const database = await db.getDb();
  if (!database) return { valid: false };

  const [tokenRecord] = await database
    .select()
    .from(panelActionTokens)
    .where(eq(panelActionTokens.token, token));

  if (!tokenRecord) {
    return { valid: false };
  }

  // Check if already used
  if (tokenRecord.usedAt) {
    return { valid: false, used: true };
  }

  // Check if expired
  if (new Date() > new Date(tokenRecord.expiresAt)) {
    return { valid: false, expired: true };
  }

  return {
    valid: true,
    token: {
      id: tokenRecord.id,
      panelistId: tokenRecord.panelistId,
      interviewId: tokenRecord.interviewId,
      actionType: tokenRecord.actionType,
    },
  };
}

/**
 * Mark a token as used (invalidate it)
 */
export async function markTokenAsUsed(tokenId: number): Promise<boolean> {
  const { panelActionTokens } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  const database = await db.getDb();
  if (!database) return false;

  await database
    .update(panelActionTokens)
    .set({ usedAt: new Date() })
    .where(eq(panelActionTokens.id, tokenId));

  return true;
}

/**
 * Get panelist and interview details from token
 */
export async function getTokenDetails(token: string): Promise<{
  panelist: any;
  interview: any;
  job: any;
  candidate: any;
} | null> {
  const validation = await validateToken(token);
  if (!validation.valid || !validation.token) return null;

  const { interviewPanelists, interviews, jobs, candidates, users } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  const database = await db.getDb();
  if (!database) return null;

  // Get panelist
  const [panelist] = await database
    .select()
    .from(interviewPanelists)
    .where(eq(interviewPanelists.id, validation.token.panelistId));

  // Get interview
  const [interview] = await database
    .select()
    .from(interviews)
    .where(eq(interviews.id, validation.token.interviewId));

  if (!interview) return null;

  // Get job
  const [job] = await database
    .select()
    .from(jobs)
    .where(eq(jobs.id, interview.jobId));

  // Get candidate
  const [candidate] = await database
    .select({
      id: candidates.id,
      fullName: users.name,
      email: users.email,
    })
    .from(candidates)
    .innerJoin(users, eq(candidates.userId, users.id))
    .where(eq(candidates.id, interview.candidateId));

  return { panelist, interview, job, candidate };
}

/**
 * Generate action URLs for email
 */
export function generateActionUrls(
  baseUrl: string,
  tokens: {
    acceptToken: string;
    declineToken: string;
    rescheduleToken: string;
    feedbackToken: string;
  }
): {
  acceptUrl: string;
  declineUrl: string;
  rescheduleUrl: string;
  feedbackUrl: string;
} {
  return {
    acceptUrl: `${baseUrl}/panel/accept/${tokens.acceptToken}`,
    declineUrl: `${baseUrl}/panel/decline/${tokens.declineToken}`,
    rescheduleUrl: `${baseUrl}/panel/reschedule/${tokens.rescheduleToken}`,
    feedbackUrl: `${baseUrl}/panel/feedback/${tokens.feedbackToken}`,
  };
}
