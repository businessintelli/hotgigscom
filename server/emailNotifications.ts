import { notifyOwner } from "./_core/notification";
import {
  generateInterviewInvitationEmail,
  generateStatusUpdateEmail,
  generateInterviewReminderEmail,
  generateNewApplicationEmail,
} from './emailTemplates';

interface EmailNotification {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

/**
 * Send email notification to a user
 * Note: This uses the owner notification API as a placeholder
 * In production, integrate with a proper email service (SendGrid, AWS SES, etc.)
 */
async function sendEmail(notification: EmailNotification): Promise<boolean> {
  // For now, send to owner as notification
  // TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
  // When integrated, use notification.html for rich email content
  const success = await notifyOwner({
    title: `Email to ${notification.to}: ${notification.subject}`,
    content: notification.html || notification.body,
  });
  
  console.log(`[Email] Sent "${notification.subject}" to ${notification.to}`);
  return success;
}

/**
 * Send interview invitation email
 */
export async function sendInterviewInvitation(params: {
  candidateEmail: string;
  candidateName: string;
  jobTitle: string;
  companyName: string;
  interviewDate: Date;
  interviewType: string;
  interviewLink?: string;
  interviewLocation?: string;
  duration: number;
  notes?: string;
}): Promise<boolean> {
  const {
    candidateEmail,
    candidateName,
    jobTitle,
    companyName,
    interviewDate,
    interviewType,
    interviewLink,
    interviewLocation,
    duration,
    notes,
  } = params;
  
  const subject = `Interview Invitation: ${jobTitle} at ${companyName}`;
  const html = generateInterviewInvitationEmail({
    candidateName,
    jobTitle,
    companyName,
    interviewType,
    interviewDate,
    interviewLink,
    interviewLocation,
    duration,
    notes,
  });
  
  const body = `Dear ${candidateName},\n\nCongratulations! You have been invited to interview for the ${jobTitle} position at ${companyName}.\n\nInterview Type: ${interviewType}\nDate: ${interviewDate.toLocaleString()}\nDuration: ${duration} minutes\n\nPlease log in to your HotGigs account to view full details.\n\nBest regards,\nThe HotGigs Team`;

  return sendEmail({
    to: candidateEmail,
    subject,
    body,
    html,
  });
}

/**
 * Send application status update email
 */
export async function sendApplicationStatusUpdate(params: {
  candidateEmail: string;
  candidateName: string;
  jobTitle: string;
  companyName: string;
  oldStatus: string;
  newStatus: string;
  message?: string;
}): Promise<boolean> {
  const { candidateEmail, candidateName, jobTitle, companyName, oldStatus, newStatus, message } = params;
  
  const subject = `Application Update: ${jobTitle}`;
  const html = generateStatusUpdateEmail({
    candidateName,
    jobTitle,
    companyName,
    oldStatus,
    newStatus,
    message,
  });
  
  const body = `Dear ${candidateName},\n\nYour application for ${jobTitle} at ${companyName} has been updated.\n\nPrevious Status: ${oldStatus}\nNew Status: ${newStatus}\n\n${message || ''}\n\nLog in to your HotGigs account to view full details.\n\nBest regards,\nThe HotGigs Team`;

  return sendEmail({
    to: candidateEmail,
    subject,
    body,
    html,
  });
}

/**
 * Send saved job deadline reminder
 */
export async function sendDeadlineReminder(params: {
  candidateEmail: string;
  candidateName: string;
  jobTitle: string;
  deadline: Date;
  daysRemaining: number;
}): Promise<boolean> {
  const { candidateEmail, candidateName, jobTitle, deadline, daysRemaining } = params;
  
  const subject = `Reminder: Application Deadline Approaching for ${jobTitle}`;
  const body = `
Dear ${candidateName},

This is a friendly reminder that the application deadline for "${jobTitle}" is approaching.

Deadline: ${deadline.toLocaleDateString()}
Days Remaining: ${daysRemaining}

Don't miss this opportunity! Log in to HotGigs to submit your application now.

Best regards,
The HotGigs Team
  `.trim();

  return sendEmail({
    to: candidateEmail,
    subject,
    body,
  });
}

/**
 * Check for upcoming deadlines and send reminders
 * Should be called by a scheduled job (e.g., daily cron)
 */
export async function checkAndSendDeadlineReminders(db: any): Promise<number> {
  // Calculate date 3 days from now
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  threeDaysFromNow.setHours(23, 59, 59, 999);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find all saved jobs with deadlines in 3 days
  // This is a placeholder - actual implementation would query the database
  // for saved jobs with deadlines between today and 3 days from now
  
  let remindersSent = 0;
  
  // TODO: Implement actual database query
  // const savedJobsWithDeadlines = await db.query(`
  //   SELECT sj.*, j.title, j.applicationDeadline, u.email, u.name
  //   FROM savedJobs sj
  //   JOIN jobs j ON sj.jobId = j.id
  //   JOIN users u ON sj.userId = u.id
  //   WHERE j.applicationDeadline BETWEEN ? AND ?
  //   AND sj.reminderSent = false
  // `, [today, threeDaysFromNow]);

  // for (const savedJob of savedJobsWithDeadlines) {
  //   const daysRemaining = Math.ceil(
  //     (savedJob.applicationDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  //   );
  //   
  //   const success = await sendDeadlineReminder({
  //     candidateEmail: savedJob.email,
  //     candidateName: savedJob.name,
  //     jobTitle: savedJob.title,
  //     deadline: savedJob.applicationDeadline,
  //     daysRemaining,
  //   });
  //   
  //   if (success) {
  //     // Mark reminder as sent
  //     await db.update(savedJobs).set({ reminderSent: true }).where(eq(savedJobs.id, savedJob.id));
  //     remindersSent++;
  //   }
  // }

  return remindersSent;
}
