/**
 * Interview Reminder System
 * 
 * Sends automated email reminders to candidates:
 * - 24 hours before the interview
 * - 1 hour before the interview
 */

import * as db from "./db";
import { notifyOwner } from "./_core/notification";

// Simple email sending function using notification system
// In production, you'd integrate with a proper email service (SendGrid, AWS SES, etc.)
async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<void> {
  // For now, we'll log the email and notify the owner
  console.log(`📧 Email to ${to}: ${subject}`);
  // In production, integrate with your email service here
  // For now, just log it
}

interface ReminderConfig {
  hoursBeforeInterview: number;
  subject: string;
  getEmailBody: (candidateName: string, jobTitle: string, interviewDate: string, interviewTime: string, interviewType: string, meetingLink?: string, location?: string) => string;
}

const REMINDER_CONFIGS: ReminderConfig[] = [
  {
    hoursBeforeInterview: 24,
    subject: "Interview Reminder: Tomorrow at {time}",
    getEmailBody: (candidateName, jobTitle, interviewDate, interviewTime, interviewType, meetingLink, location) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Interview Reminder - 24 Hours</h2>
        <p>Hi ${candidateName},</p>
        <p>This is a friendly reminder that you have an interview scheduled for <strong>tomorrow</strong>.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">Interview Details</h3>
          <p><strong>Position:</strong> ${jobTitle}</p>
          <p><strong>Date:</strong> ${interviewDate}</p>
          <p><strong>Time:</strong> ${interviewTime}</p>
          <p><strong>Type:</strong> ${interviewType}</p>
          ${meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${meetingLink}" style="color: #3b82f6;">${meetingLink}</a></p>` : ''}
          ${location ? `<p><strong>Location:</strong> ${location}</p>` : ''}
        </div>
        
        <h3 style="color: #1f2937;">Preparation Tips:</h3>
        <ul>
          <li>Review the job description and your application</li>
          <li>Prepare questions about the role and company</li>
          <li>Test your internet connection and audio/video setup (for virtual interviews)</li>
          <li>Have a copy of your resume handy</li>
          <li>Dress professionally</li>
        </ul>
        
        <p>Good luck with your interview! If you need to reschedule, please contact us as soon as possible.</p>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Best regards,<br/>
          HotGigs Recruitment Team
        </p>
      </div>
    `,
  },
  {
    hoursBeforeInterview: 1,
    subject: "Interview Starting Soon - In 1 Hour",
    getEmailBody: (candidateName, jobTitle, interviewDate, interviewTime, interviewType, meetingLink, location) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">⏰ Interview Starting in 1 Hour!</h2>
        <p>Hi ${candidateName},</p>
        <p>Your interview is starting in <strong>1 hour</strong>. Please make sure you're ready!</p>
        
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #991b1b;">Quick Reminder</h3>
          <p><strong>Position:</strong> ${jobTitle}</p>
          <p><strong>Time:</strong> ${interviewTime}</p>
          <p><strong>Type:</strong> ${interviewType}</p>
          ${meetingLink ? `<p><strong>Join Now:</strong> <a href="${meetingLink}" style="color: #3b82f6; font-size: 16px; font-weight: bold;">${meetingLink}</a></p>` : ''}
          ${location ? `<p><strong>Location:</strong> ${location}</p>` : ''}
        </div>
        
        <h3 style="color: #1f2937;">Final Checklist:</h3>
        <ul>
          <li>✓ Join the meeting 5 minutes early</li>
          <li>✓ Ensure your camera and microphone are working</li>
          <li>✓ Find a quiet, well-lit space</li>
          <li>✓ Have your resume and notes ready</li>
          <li>✓ Close unnecessary applications and browser tabs</li>
        </ul>
        
        <p style="font-size: 16px; font-weight: bold; color: #059669;">We're excited to meet you! Good luck!</p>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Best regards,<br/>
          HotGigs Recruitment Team
        </p>
      </div>
    `,
  },
];

/**
 * Format interview type for display
 */
function formatInterviewType(type: string): string {
  const typeMap: Record<string, string> = {
    "ai-interview": "AI Bot Interview",
    "video": "Video Interview",
    "phone": "Phone Interview",
    "in-person": "In-Person Interview",
  };
  return typeMap[type] || type;
}

/**
 * Format date and time for display
 */
function formatDateTime(date: Date): { date: string; time: string } {
  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  
  return { date: dateStr, time: timeStr };
}

/**
 * Send a reminder email for an interview
 */
async function sendInterviewReminder(
  interviewId: number,
  hoursBeforeInterview: number
): Promise<boolean> {
  try {
    // Get interview details
    const interview = await db.getInterviewById(interviewId);
    if (!interview || !interview.candidate || !interview.candidateUser || !interview.job) {
      console.error(`Interview ${interviewId} not found or missing required data`);
      return false;
    }

    // Find the reminder config
    const config = REMINDER_CONFIGS.find(c => c.hoursBeforeInterview === hoursBeforeInterview);
    if (!config) {
      console.error(`No reminder config found for ${hoursBeforeInterview} hours`);
      return false;
    }

    // Format date and time
    const { date: dateStr, time: timeStr } = formatDateTime(new Date(interview.interview.scheduledAt));
    const interviewType = formatInterviewType(interview.interview.type);

    // Generate email body
    const emailBody = config.getEmailBody(
      interview.candidateUser?.name || "Candidate",
      interview.job?.title || "Position",
      dateStr,
      timeStr,
      interviewType,
      interview.interview.meetingLink || undefined,
      interview.interview.location || undefined
    );

    // Send email
    const subject = config.subject.replace("{time}", timeStr);
    if (!interview.candidateUser?.email) {
      console.error(`No email found for candidate in interview ${interviewId}`);
      return false;
    }
    await sendEmail({
      to: interview.candidateUser.email,
      subject,
      html: emailBody,
    });

    console.log(`✓ Sent ${hoursBeforeInterview}h reminder for interview ${interviewId} to ${interview.candidateUser.email}`);
    return true;
  } catch (error) {
    console.error(`Failed to send reminder for interview ${interviewId}:`, error);
    return false;
  }
}

/**
 * Check and send reminders for upcoming interviews
 * This function should be called periodically (e.g., every 15 minutes via cron job)
 */
export async function processInterviewReminders(): Promise<void> {
  console.log("🔔 Processing interview reminders...");
  
  const now = new Date();
  
  for (const config of REMINDER_CONFIGS) {
    const targetTime = new Date(now.getTime() + config.hoursBeforeInterview * 60 * 60 * 1000);
    const windowStart = new Date(targetTime.getTime() - 15 * 60 * 1000); // 15 minutes before
    const windowEnd = new Date(targetTime.getTime() + 15 * 60 * 1000); // 15 minutes after
    
    // Get interviews scheduled within the reminder window
    const interviews = await db.getUpcomingInterviews(windowStart, windowEnd);
    
    console.log(`Found ${interviews.length} interviews for ${config.hoursBeforeInterview}h reminder window`);
    
    for (const interview of interviews) {
      // Check if reminder was already sent
      const reminderSent = await db.checkReminderSent(interview.interview.id, config.hoursBeforeInterview);
      
      if (!reminderSent) {
        const success = await sendInterviewReminder(interview.interview.id, config.hoursBeforeInterview);
        
        if (success) {
          // Mark reminder as sent
          await db.markReminderSent(interview.interview.id, config.hoursBeforeInterview);
        }
      }
    }
  }
  
  console.log("✓ Interview reminder processing complete");
}

/**
 * Manual trigger for sending a specific reminder
 * Useful for testing or manual intervention
 */
export async function sendManualReminder(
  interviewId: number,
  hoursBeforeInterview: 24 | 1
): Promise<boolean> {
  return await sendInterviewReminder(interviewId, hoursBeforeInterview);
}
