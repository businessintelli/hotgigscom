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
  body?: string;
  html?: string;
}

/**
 * Send email notification to a user
 * Note: This uses the owner notification API as a placeholder
 * In production, integrate with a proper email service (SendGrid, AWS SES, etc.)
 */
export async function sendEmail(notification: EmailNotification): Promise<boolean> {
  // For now, send to owner as notification
  // TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
  // When integrated, use notification.html for rich email content
  const success = await notifyOwner({
    title: `Email to ${notification.to}: ${notification.subject}`,
    content: notification.html || notification.body || '',
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

/**
 * Send resume upload confirmation email
 */
export async function sendResumeUploadConfirmation(params: {
  candidateEmail: string;
  candidateName: string;
  profileName?: string;
  resumeUrl: string;
}): Promise<boolean> {
  const { candidateEmail, candidateName, profileName, resumeUrl } = params;
  
  const subject = profileName 
    ? `Resume Profile "${profileName}" Uploaded Successfully`
    : 'Resume Uploaded Successfully';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Resume Uploaded Successfully!</h1>
        </div>
        <div class="content">
          <p>Hi ${candidateName},</p>
          <p>Great news! Your resume${profileName ? ` profile "<strong>${profileName}</strong>"` : ''} has been successfully uploaded and processed with AI-powered parsing.</p>
          <p><strong>What's Next?</strong></p>
          <ul>
            <li>Your profile has been automatically updated with information from your resume</li>
            <li>Recruiters can now discover your profile when searching for candidates</li>
            <li>You'll receive notifications when recruiters view your profile or invite you to interviews</li>
          </ul>
          <p style="text-align: center;">
            <a href="https://hotgigs.manus.space/candidate/dashboard" class="button">View Your Profile</a>
          </p>
          <p>Keep your profile up to date to maximize your chances of landing your dream job!</p>
        </div>
        <div class="footer">
          <p>© 2024 HotGigs - AI-Powered Recruitment Platform</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const body = `Hi ${candidateName},\n\nYour resume${profileName ? ` profile "${profileName}"` : ''} has been successfully uploaded and processed!\n\nYour profile has been automatically updated with information from your resume. Recruiters can now discover your profile when searching for candidates.\n\nView your profile: https://hotgigs.manus.space/candidate/dashboard\n\nBest regards,\nThe HotGigs Team`;

  return sendEmail({
    to: candidateEmail,
    subject,
    body,
    html,
  });
}

/**
 * Send profile update confirmation email
 */
export async function sendProfileUpdateConfirmation(params: {
  candidateEmail: string;
  candidateName: string;
  updatedFields: string[];
}): Promise<boolean> {
  const { candidateEmail, candidateName, updatedFields } = params;
  
  const subject = 'Profile Updated Successfully';
  
  const fieldsList = updatedFields.map(field => `<li>${field}</li>`).join('');
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        ul { background: white; padding: 20px; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Profile Updated!</h1>
        </div>
        <div class="content">
          <p>Hi ${candidateName},</p>
          <p>Your profile has been successfully updated with the following changes:</p>
          <ul>
            ${fieldsList}
          </ul>
          <p>Your updated profile is now visible to recruiters searching for candidates with your skills and experience.</p>
          <p style="text-align: center;">
            <a href="https://hotgigs.manus.space/candidate/dashboard" class="button">View Your Profile</a>
          </p>
        </div>
        <div class="footer">
          <p>© 2024 HotGigs - AI-Powered Recruitment Platform</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const body = `Hi ${candidateName},\n\nYour profile has been successfully updated!\n\nUpdated fields:\n${updatedFields.map(f => `- ${f}`).join('\n')}\n\nView your profile: https://hotgigs.manus.space/candidate/dashboard\n\nBest regards,\nThe HotGigs Team`;

  return sendEmail({
    to: candidateEmail,
    subject,
    body,
    html,
  });
}

/**
 * Send video introduction upload confirmation email
 */
export async function sendVideoIntroductionConfirmation(params: {
  candidateEmail: string;
  candidateName: string;
  duration: number;
}): Promise<boolean> {
  const { candidateEmail, candidateName, duration } = params;
  
  const subject = 'Video Introduction Uploaded Successfully';
  
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  const durationText = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .stats { background: white; padding: 20px; border-radius: 5px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎥 Video Introduction Uploaded!</h1>
        </div>
        <div class="content">
          <p>Hi ${candidateName},</p>
          <p>Your video introduction has been successfully uploaded and is now part of your profile!</p>
          <div class="stats">
            <p><strong>Video Duration:</strong> ${durationText}</p>
          </div>
          <p><strong>Why video introductions matter:</strong></p>
          <ul>
            <li>Stand out from other candidates with a personal touch</li>
            <li>Showcase your communication skills and personality</li>
            <li>Help recruiters understand you better before the interview</li>
            <li>Increase your chances of getting interview invitations</li>
          </ul>
          <p style="text-align: center;">
            <a href="https://hotgigs.manus.space/candidate/dashboard" class="button">View Your Profile</a>
          </p>
        </div>
        <div class="footer">
          <p>© 2024 HotGigs - AI-Powered Recruitment Platform</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const body = `Hi ${candidateName},\n\nYour video introduction (${durationText}) has been successfully uploaded!\n\nVideo introductions help you stand out and showcase your personality to recruiters.\n\nView your profile: https://hotgigs.manus.space/candidate/dashboard\n\nBest regards,\nThe HotGigs Team`;

  return sendEmail({
    to: candidateEmail,
    subject,
    body,
    html,
  });
}

/**
 * Notify recruiter when a new candidate completes their profile
 */
export async function notifyRecruiterNewCandidateProfile(params: {
  recruiterEmail: string;
  recruiterName: string;
  candidateName: string;
  candidateTitle: string;
  candidateSkills: string[];
  candidateLocation: string;
  profileUrl: string;
}): Promise<boolean> {
  const { recruiterEmail, recruiterName, candidateName, candidateTitle, candidateSkills, candidateLocation, profileUrl } = params;
  
  const subject = `New Candidate Profile: ${candidateName} - ${candidateTitle}`;
  
  const skillsList = candidateSkills.slice(0, 10).map(skill => `<span style="background: #e0e7ff; padding: 4px 12px; border-radius: 12px; margin: 4px; display: inline-block;">${skill}</span>`).join('');
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .profile-card { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎯 New Candidate Profile</h1>
        </div>
        <div class="content">
          <p>Hi ${recruiterName},</p>
          <p>A new candidate has completed their profile and is now available for recruitment:</p>
          <div class="profile-card">
            <h2>${candidateName}</h2>
            <p><strong>${candidateTitle}</strong></p>
            <p>📍 ${candidateLocation}</p>
            <p><strong>Top Skills:</strong></p>
            <div style="margin: 10px 0;">
              ${skillsList}
            </div>
          </div>
          <p style="text-align: center;">
            <a href="${profileUrl}" class="button">View Full Profile</a>
          </p>
        </div>
        <div class="footer">
          <p>© 2024 HotGigs - AI-Powered Recruitment Platform</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const body = `Hi ${recruiterName},\n\nNew candidate profile available:\n\nName: ${candidateName}\nTitle: ${candidateTitle}\nLocation: ${candidateLocation}\nSkills: ${candidateSkills.slice(0, 5).join(', ')}\n\nView profile: ${profileUrl}\n\nBest regards,\nThe HotGigs Team`;

  return sendEmail({
    to: recruiterEmail,
    subject,
    body,
    html,
  });
}
