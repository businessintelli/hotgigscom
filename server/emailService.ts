import sgMail from '@sendgrid/mail';
import { ENV } from './_core/env';

/**
 * Email service for sending emails via SendGrid
 */

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

// Initialize SendGrid
if (ENV.sendGridApiKey) {
  sgMail.setApiKey(ENV.sendGridApiKey);
  console.log('[Email Service] SendGrid initialized');
} else {
  console.warn('[Email Service] SENDGRID_API_KEY not found, email sending will be mocked');
}

/**
 * Send email via SendGrid
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const fromEmail = options.from || 'noreply@hotgigs.com';

  // If SendGrid is not configured, use mock implementation
  if (!ENV.sendGridApiKey) {
    console.log('[Email Service] Mock: Sending email:', {
      to: options.to,
      subject: options.subject,
      from: fromEmail,
      htmlLength: options.html.length,
    });
    await new Promise((resolve) => setTimeout(resolve, 100));
    console.log('[Email Service] Mock: Email sent successfully');
    return;
  }

  try {
    // Send via SendGrid
    await sgMail.send({
      to: options.to,
      from: fromEmail,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo,
      cc: options.cc,
      bcc: options.bcc,
    });

    console.log('[Email Service] Email sent successfully via SendGrid:', {
      to: options.to,
      subject: options.subject,
    });
  } catch (error: any) {
    console.error('[Email Service] Failed to send email:', error.message);
    
    // Log detailed error for debugging
    if (error.response) {
      console.error('[Email Service] SendGrid error details:', error.response.body);
    }
    
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Send bulk emails
 */
export async function sendBulkEmails(emails: EmailOptions[]): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const email of emails) {
    try {
      await sendEmail(email);
      sent++;
    } catch (error) {
      console.error("[Email Service] Failed to send email:", error);
      failed++;
    }
  }

  return { sent, failed };
}
