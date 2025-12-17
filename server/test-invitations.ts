import { getDb } from "./db";
import crypto from "crypto";

export interface TestInvitation {
  id: number;
  testAssignmentId: number;
  candidateId: number;
  recruiterId: number;
  invitationToken: string;
  emailSent: boolean;
  emailSentAt?: Date;
  openedAt?: Date;
  expiresAt: Date;
  reminderSent: boolean;
  reminderSentAt?: Date;
  status: 'pending' | 'sent' | 'opened' | 'expired';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Generate a unique invitation token
 */
export function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create a test invitation
 */
export async function createTestInvitation(
  testAssignmentId: number,
  candidateId: number,
  recruiterId: number,
  expiresInDays: number = 7
): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const { sql } = await import('drizzle-orm');
  
  const token = generateInvitationToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  await db.execute(sql`
    INSERT INTO test_invitations (
      test_assignment_id, candidate_id, recruiter_id,
      invitation_token, expires_at, status
    ) VALUES (
      ${testAssignmentId}, ${candidateId}, ${recruiterId},
      ${token}, ${expiresAt.toISOString()}, 'pending'
    )
  `);

  return token;
}

/**
 * Get invitation by token
 */
export async function getInvitationByToken(token: string) {
  const db = await getDb();
  if (!db) return null;

  const { sql } = await import('drizzle-orm');
  
  const result = await db.execute(sql`
    SELECT * FROM test_invitations 
    WHERE invitation_token = ${token}
    LIMIT 1
  `);

  return result[0] || null;
}

/**
 * Mark invitation as opened
 */
export async function markInvitationAsOpened(token: string) {
  const db = await getDb();
  if (!db) return;

  const { sql } = await import('drizzle-orm');
  
  await db.execute(sql`
    UPDATE test_invitations 
    SET status = 'opened', opened_at = NOW()
    WHERE invitation_token = ${token} AND status = 'sent'
  `);
}

/**
 * Mark invitation as sent
 */
export async function markInvitationAsSent(token: string) {
  const db = await getDb();
  if (!db) return;

  const { sql } = await import('drizzle-orm');
  
  await db.execute(sql`
    UPDATE test_invitations 
    SET status = 'sent', email_sent = true, email_sent_at = NOW()
    WHERE invitation_token = ${token}
  `);
}

/**
 * Send test invitation email
 */
export async function sendTestInvitationEmail(
  candidateEmail: string,
  candidateName: string,
  testName: string,
  invitationToken: string,
  expiresAt: Date
) {
  // Import email service
  const { sendEmail } = await import('./emailService');
  
  const invitationLink = `${process.env.VITE_OAUTH_PORTAL_URL || 'http://localhost:3000'}/test-invitation/${invitationToken}`;
  
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>You've Been Invited to Take a Skills Assessment</h2>
      <p>Hello ${candidateName},</p>
      <p>You have been invited to complete the following assessment:</p>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0;">${testName}</h3>
        <p style="margin: 0; color: #666;">
          This invitation expires on ${expiresAt.toLocaleDateString()}
        </p>
      </div>
      <p>
        <a href="${invitationLink}" 
           style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 4px; font-weight: bold;">
          Start Assessment
        </a>
      </p>
      <p style="color: #666; font-size: 14px;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${invitationLink}">${invitationLink}</a>
      </p>
      <p style="color: #666; font-size: 14px;">
        Good luck!
      </p>
    </div>
  `;

  try {
    await sendEmail({
      to: candidateEmail,
      subject: `Skills Assessment Invitation: ${testName}`,
      html: emailHtml,
    });
    
    await markInvitationAsSent(invitationToken);
    return true;
  } catch (error) {
    console.error('Failed to send invitation email:', error);
    return false;
  }
}

/**
 * Send reminder email for pending invitations
 */
export async function sendReminderEmail(invitationId: number) {
  const db = await getDb();
  if (!db) return false;

  const { sql } = await import('drizzle-orm');
  
  // Get invitation details with candidate and test info
  const result = await db.execute(sql`
    SELECT 
      ti.*,
      u.email as candidate_email,
      u.name as candidate_name,
      ta.test_id
    FROM test_invitations ti
    JOIN candidates c ON ti.candidate_id = c.id
    JOIN users u ON c.user_id = u.id
    JOIN test_assignments ta ON ti.test_assignment_id = ta.id
    WHERE ti.id = ${invitationId}
    LIMIT 1
  `);

  const invitation: any = result[0];
  if (!invitation || invitation.reminder_sent) return false;

  // Send reminder email (similar to invitation email but with "Reminder" in subject)
  const invitationLink = `${process.env.VITE_OAUTH_PORTAL_URL || 'http://localhost:3000'}/test-invitation/${invitation.invitation_token}`;
  
  const { sendEmail } = await import('./emailService');
  
  try {
    await sendEmail({
      to: invitation.candidate_email,
      subject: `Reminder: Skills Assessment Invitation`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reminder: Complete Your Skills Assessment</h2>
          <p>Hello ${invitation.candidate_name},</p>
          <p>This is a friendly reminder that you have a pending skills assessment.</p>
          <p>
            <a href="${invitationLink}" 
               style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 4px; font-weight: bold;">
              Start Assessment
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">
            This invitation expires on ${new Date(invitation.expires_at).toLocaleDateString()}
          </p>
        </div>
      `,
    });

    // Mark reminder as sent
    await db.execute(sql`
      UPDATE test_invitations 
      SET reminder_sent = true, reminder_sent_at = NOW()
      WHERE id = ${invitationId}
    `);

    return true;
  } catch (error) {
    console.error('Failed to send reminder email:', error);
    return false;
  }
}

/**
 * Check and expire old invitations
 */
export async function expireOldInvitations() {
  const db = await getDb();
  if (!db) return;

  const { sql } = await import('drizzle-orm');
  
  await db.execute(sql`
    UPDATE test_invitations 
    SET status = 'expired'
    WHERE expires_at < NOW() AND status != 'expired'
  `);
}
