import { sendEmail } from './emailService';
import { getVerificationEmailTemplate } from './emailTemplates/verificationEmail';
import { getPasswordResetEmailTemplate } from './emailTemplates/passwordResetEmail';
import {
  getVerificationEmailText,
  getPasswordResetEmailText,
} from './authEmailTemplates';

/**
 * Send authentication email using the configured email service
 * Supports SendGrid, Resend, or mock for testing
 */
async function sendAuthEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    await sendEmail({
      to,
      subject,
      html,
      from: 'noreply@hotgigs.com',
    });
    
    console.log(`[Auth Email] Sent "${subject}" to ${to}`);
    return true;
  } catch (error: any) {
    console.error(`[Auth Email] Failed to send "${subject}" to ${to}:`, error.message);
    return false;
  }
}

/**
 * Send email verification link
 */
export async function sendVerificationEmail(
  email: string,
  userName: string,
  verificationToken: string,
  baseUrl: string
): Promise<boolean> {
  const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
  
  return sendAuthEmail(
    email,
    'Verify Your Email Address',
    getVerificationEmailTemplate(verificationUrl, userName, "HotGigs")
  );
}

/**
 * Send password reset link
 */
export async function sendPasswordResetEmail(
  email: string,
  userName: string,
  resetToken: string,
  baseUrl: string
): Promise<boolean> {
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
  
  return sendAuthEmail(
    email,
    'Reset Your Password',
    getPasswordResetEmailTemplate(resetUrl, userName, "HotGigs")
  );
}
