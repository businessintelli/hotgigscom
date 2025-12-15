import sgMail from '@sendgrid/mail';
import { Resend } from 'resend';
import { ENV } from './_core/env';
import { getDb } from './db';
import { systemSettings } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Multi-provider email service supporting SendGrid and Resend
 */

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export type EmailProvider = 'sendgrid' | 'resend' | 'mock';

// Initialize SendGrid
if (ENV.sendGridApiKey) {
  sgMail.setApiKey(ENV.sendGridApiKey);
  console.log('[Email Service] SendGrid initialized');
}

// Initialize Resend
let resendClient: Resend | null = null;
if (ENV.resendApiKey) {
  resendClient = new Resend(ENV.resendApiKey);
  console.log('[Email Service] Resend initialized');
}

/**
 * Get configured email provider from database
 */
async function getEmailProvider(): Promise<EmailProvider> {
  try {
    const db = await getDb();
    if (!db) return 'mock';

    const [setting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.settingKey, 'email_provider'))
      .limit(1);

    if (setting && setting.settingValue) {
      return setting.settingValue as EmailProvider;
    }

    // Default to SendGrid if available, then Resend, then mock
    if (ENV.sendGridApiKey) return 'sendgrid';
    if (ENV.resendApiKey) return 'resend';
    return 'mock';
  } catch (error) {
    console.error('[Email Service] Failed to get provider from database:', error);
    // Fallback to environment-based detection
    if (ENV.sendGridApiKey) return 'sendgrid';
    if (ENV.resendApiKey) return 'resend';
    return 'mock';
  }
}

/**
 * Send email via SendGrid
 */
async function sendViaSendGrid(options: EmailOptions): Promise<void> {
  if (!ENV.sendGridApiKey) {
    throw new Error('SendGrid API key not configured');
  }

  try {
    await sgMail.send({
      to: options.to,
      from: options.from || 'noreply@hotgigs.com',
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
    console.error('[Email Service] SendGrid error:', error.message);
    if (error.response) {
      console.error('[Email Service] SendGrid error details:', error.response.body);
    }
    throw new Error(`SendGrid failed: ${error.message}`);
  }
}

/**
 * Send email via Resend
 */
async function sendViaResend(options: EmailOptions): Promise<void> {
  if (!resendClient || !ENV.resendApiKey) {
    throw new Error('Resend API key not configured');
  }

  try {
    const result = await resendClient.emails.send({
      from: options.from || 'onboarding@resend.dev',
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo,
      cc: Array.isArray(options.cc) ? options.cc : options.cc ? [options.cc] : undefined,
      bcc: Array.isArray(options.bcc) ? options.bcc : options.bcc ? [options.bcc] : undefined,
    });

    console.log('[Email Service] Email sent successfully via Resend:', {
      to: options.to,
      subject: options.subject,
      id: result.data?.id,
    });
  } catch (error: any) {
    console.error('[Email Service] Resend error:', error.message);
    throw new Error(`Resend failed: ${error.message}`);
  }
}

/**
 * Send email via mock (for testing)
 */
async function sendViaMock(options: EmailOptions): Promise<void> {
  console.log('[Email Service] Mock: Sending email:', {
    to: options.to,
    subject: options.subject,
    from: options.from || 'noreply@hotgigs.com',
    htmlLength: options.html.length,
  });
  await new Promise((resolve) => setTimeout(resolve, 100));
  console.log('[Email Service] Mock: Email sent successfully');
}

/**
 * Send email using the configured provider
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const provider = await getEmailProvider();

  console.log(`[Email Service] Using provider: ${provider}`);

  switch (provider) {
    case 'sendgrid':
      return await sendViaSendGrid(options);
    case 'resend':
      return await sendViaResend(options);
    case 'mock':
      return await sendViaMock(options);
    default:
      throw new Error(`Unknown email provider: ${provider}`);
  }
}

/**
 * Send bulk emails
 */
export async function sendBulkEmails(emails: EmailOptions[]): Promise<void> {
  const provider = await getEmailProvider();
  console.log(`[Email Service] Sending ${emails.length} emails via ${provider}`);

  for (const email of emails) {
    try {
      await sendEmail(email);
    } catch (error: any) {
      console.error('[Email Service] Failed to send email:', error.message);
      // Continue with other emails even if one fails
    }
  }
}

/**
 * Get current email provider configuration
 */
export async function getCurrentEmailProvider(): Promise<EmailProvider> {
  return await getEmailProvider();
}

/**
 * Update email provider configuration
 */
export async function setEmailProvider(provider: EmailProvider): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Validate provider
  if (!['sendgrid', 'resend', 'mock'].includes(provider)) {
    throw new Error(`Invalid email provider: ${provider}`);
  }

  // Check if API key is configured for the selected provider
  if (provider === 'sendgrid' && !ENV.sendGridApiKey) {
    throw new Error('SendGrid API key not configured');
  }
  if (provider === 'resend' && !ENV.resendApiKey) {
    throw new Error('Resend API key not configured');
  }

  // Update or insert setting
  await db
    .insert(systemSettings)
    .values({
      settingKey: 'email_provider',
      settingValue: provider,
      description: 'Active email service provider',
    })
    .onDuplicateKeyUpdate({
      set: {
        settingValue: provider,
        updatedAt: new Date(),
      },
    });

  console.log(`[Email Service] Email provider set to: ${provider}`);
}
