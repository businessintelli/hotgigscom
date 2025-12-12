import { notifyOwner } from './_core/notification';
import { getVerificationEmailTemplate } from './emailTemplates/verificationEmail';
import { getPasswordResetEmailTemplate } from './emailTemplates/passwordResetEmail';
import {
  getVerificationEmailText,
  getPasswordResetEmailText,
} from './authEmailTemplates';

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Send email using owner notification as fallback
 * In production, this would use SendGrid, AWS SES, or similar service
 */
async function sendEmail(params: EmailParams): Promise<boolean> {
  // For now, notify owner (in production, use proper email service)
  const success = await notifyOwner({
    title: `Email to ${params.to}: ${params.subject}`,
    content: params.html,
  });
  
  console.log(`[Auth Email] Sent "${params.subject}" to ${params.to}`);
  return success;
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
  
  return sendEmail({
    to: email,
    subject: 'Verify Your Email Address',
    html: getVerificationEmailTemplate(verificationUrl, userName, "HotGigs"),
    text: getVerificationEmailText(verificationUrl, userName),
  });
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
  
  return sendEmail({
    to: email,
    subject: 'Reset Your Password',
    html: getPasswordResetEmailTemplate(resetUrl, userName, "HotGigs"),
    text: getPasswordResetEmailText(resetUrl, userName),
  });
}
