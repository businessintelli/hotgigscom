/**
 * Candidate Reminder Service
 * Handles sending automated reminders to candidates before interviews
 */

import { eq, and, sql, gte, lte } from "drizzle-orm";
import { getDb } from '../db';
import { 
  interviews, 
  applications, 
  jobs, 
  candidates, 
  users,
  recruiters
} from '../../drizzle/schema';
import { generateCandidate24HourReminderEmail, generateCandidate1HourReminderEmail } from '../emails/candidateReminderEmails';
import { sendEmail } from '../emailService';

interface ReminderResult {
  success: boolean;
  sent24h: number;
  sent1h: number;
  errors: string[];
}

/**
 * Get candidates needing reminders
 */
async function getCandidatesNeedingReminders() {
  const db = await getDb();
  if (!db) return { reminder24h: [], reminder1h: [] };
  
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in23h = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const in1h = new Date(now.getTime() + 60 * 60 * 1000);
  const in30m = new Date(now.getTime() + 30 * 60 * 1000);
  
  // Get interviews needing 24h reminder
  const reminder24hResult = await db
    .select()
    .from(interviews)
    .leftJoin(applications, eq(interviews.applicationId, applications.id))
    .leftJoin(jobs, eq(applications.jobId, jobs.id))
    .leftJoin(candidates, eq(applications.candidateId, candidates.id))
    .leftJoin(users, eq(candidates.userId, users.id))
    .leftJoin(recruiters, eq(jobs.postedBy, recruiters.userId))
    .where(
      and(
        eq(interviews.status, 'scheduled'),
        sql`${interviews.candidateReminder24hSent} = false OR ${interviews.candidateReminder24hSent} IS NULL`,
        gte(interviews.scheduledAt, in23h),
        lte(interviews.scheduledAt, in24h)
      )
    );
  
  // Get interviews needing 1h reminder
  const reminder1hResult = await db
    .select()
    .from(interviews)
    .leftJoin(applications, eq(interviews.applicationId, applications.id))
    .leftJoin(jobs, eq(applications.jobId, jobs.id))
    .leftJoin(candidates, eq(applications.candidateId, candidates.id))
    .leftJoin(users, eq(candidates.userId, users.id))
    .leftJoin(recruiters, eq(jobs.postedBy, recruiters.userId))
    .where(
      and(
        eq(interviews.status, 'scheduled'),
        sql`${interviews.candidateReminder1hSent} = false OR ${interviews.candidateReminder1hSent} IS NULL`,
        gte(interviews.scheduledAt, in30m),
        lte(interviews.scheduledAt, in1h)
      )
    );
  
  const mapResult = (rows: any[]) => rows.map((row: any) => ({
    interview: row.interviews,
    job: row.jobs,
    candidate: {
      ...row.candidates,
      user: row.users,
    },
    recruiter: row.recruiters,
  }));
  
  return {
    reminder24h: mapResult(reminder24hResult),
    reminder1h: mapResult(reminder1hResult),
  };
}

/**
 * Mark candidate reminder as sent
 */
async function markCandidateReminderSent(interviewId: number, reminderType: '24h' | '1h') {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData = reminderType === '24h' 
    ? { candidateReminder24hSent: true } 
    : { candidateReminder1hSent: true };
  
  await db.update(interviews).set(updateData as any).where(eq(interviews.id, interviewId));
}

/**
 * Process all pending candidate reminders
 */
export async function processCandidateReminders(): Promise<ReminderResult> {
  const result: ReminderResult = {
    success: true,
    sent24h: 0,
    sent1h: 0,
    errors: [],
  };

  try {
    const { reminder24h, reminder1h } = await getCandidatesNeedingReminders();

    // Process 24-hour reminders
    for (const item of reminder24h) {
      try {
        if (!item.candidate?.user?.email) {
          result.errors.push(`No email for candidate in interview ${item.interview.id}`);
          continue;
        }

        const emailData = {
          candidateName: item.candidate?.user?.name || item.candidate?.fullName || 'Candidate',
          candidateEmail: item.candidate.user.email,
          jobTitle: item.job?.title || 'Position',
          companyName: item.job?.companyName,
          recruiterName: item.recruiter?.companyName || undefined,
          interviewDate: new Date(item.interview.scheduledAt),
          interviewDuration: item.interview.duration || 60,
          interviewType: item.interview.type || 'video',
          meetingLink: item.interview.meetingLink,
          location: item.interview.location,
          notes: item.interview.notes,
        };

        const { subject, html } = generateCandidate24HourReminderEmail(emailData);
        
        await sendEmail({
          to: item.candidate.user.email,
          subject,
          html,
        });

        await markCandidateReminderSent(item.interview.id, '24h');
        result.sent24h++;
        
        console.log(`[Candidate Reminder] Sent 24h reminder to ${item.candidate.user.email}`);
      } catch (error: any) {
        const errorMsg = `Failed to send 24h reminder for interview ${item.interview.id}: ${error.message}`;
        console.error(`[Candidate Reminder] ${errorMsg}`);
        result.errors.push(errorMsg);
      }
    }

    // Process 1-hour reminders
    for (const item of reminder1h) {
      try {
        if (!item.candidate?.user?.email) {
          result.errors.push(`No email for candidate in interview ${item.interview.id}`);
          continue;
        }

        const emailData = {
          candidateName: item.candidate?.user?.name || item.candidate?.fullName || 'Candidate',
          candidateEmail: item.candidate.user.email,
          jobTitle: item.job?.title || 'Position',
          companyName: item.job?.companyName,
          recruiterName: item.recruiter?.companyName || undefined,
          interviewDate: new Date(item.interview.scheduledAt),
          interviewDuration: item.interview.duration || 60,
          interviewType: item.interview.type || 'video',
          meetingLink: item.interview.meetingLink,
          location: item.interview.location,
          notes: item.interview.notes,
        };

        const { subject, html } = generateCandidate1HourReminderEmail(emailData);
        
        await sendEmail({
          to: item.candidate.user.email,
          subject,
          html,
        });

        await markCandidateReminderSent(item.interview.id, '1h');
        result.sent1h++;
        
        console.log(`[Candidate Reminder] Sent 1h reminder to ${item.candidate.user.email}`);
      } catch (error: any) {
        const errorMsg = `Failed to send 1h reminder for interview ${item.interview.id}: ${error.message}`;
        console.error(`[Candidate Reminder] ${errorMsg}`);
        result.errors.push(errorMsg);
      }
    }

    if (result.errors.length > 0) {
      result.success = false;
    }

    console.log(`[Candidate Reminder] Completed: ${result.sent24h} 24h reminders, ${result.sent1h} 1h reminders, ${result.errors.length} errors`);
    return result;
  } catch (error: any) {
    console.error('[Candidate Reminder] Service error:', error.message);
    return {
      success: false,
      sent24h: 0,
      sent1h: 0,
      errors: [error.message],
    };
  }
}

/**
 * Send immediate interview notification to candidate
 */
export async function sendInterviewNotification(interviewId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const [result] = await db
      .select()
      .from(interviews)
      .leftJoin(applications, eq(interviews.applicationId, applications.id))
      .leftJoin(jobs, eq(applications.jobId, jobs.id))
      .leftJoin(candidates, eq(applications.candidateId, candidates.id))
      .leftJoin(users, eq(candidates.userId, users.id))
      .leftJoin(recruiters, eq(jobs.postedBy, recruiters.userId))
      .where(eq(interviews.id, interviewId))
      .limit(1);

    if (!result || !result.users?.email) {
      console.error(`[Candidate Notification] No candidate email found for interview ${interviewId}`);
      return false;
    }

    const emailData = {
      candidateName: result.users?.name || result.candidates?.title || 'Candidate',
      candidateEmail: result.users.email,
      jobTitle: result.jobs?.title || 'Position',
      companyName: result.jobs?.companyName,
      recruiterName: result.recruiters?.companyName || undefined,
      interviewDate: new Date(result.interviews.scheduledAt),
      interviewDuration: result.interviews.duration || 60,
      interviewType: result.interviews.type || 'video',
      meetingLink: result.interviews.meetingLink,
      location: result.interviews.location,
      notes: result.interviews.notes,
    };

    const formattedDate = emailData.interviewDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = emailData.interviewDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const subject = `🎉 Interview Scheduled: ${emailData.jobTitle}${emailData.companyName ? ` at ${emailData.companyName}` : ''}`;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🎉 Interview Scheduled!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hi ${emailData.candidateName},
              </p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Great news! Your interview for the <strong>${emailData.jobTitle}</strong> position has been scheduled.
              </p>
              <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #86efac;">
                <h3 style="color: #059669; margin: 0 0 15px 0;">📋 Interview Details</h3>
                <table width="100%" cellpadding="5" cellspacing="0">
                  <tr><td style="color: #666; width: 100px;">Date:</td><td style="color: #333; font-weight: 600;">${formattedDate}</td></tr>
                  <tr><td style="color: #666;">Time:</td><td style="color: #333; font-weight: 600;">${formattedTime}</td></tr>
                  <tr><td style="color: #666;">Duration:</td><td style="color: #333; font-weight: 600;">${emailData.interviewDuration} minutes</td></tr>
                  <tr><td style="color: #666;">Type:</td><td style="color: #333; font-weight: 600;">${emailData.interviewType}</td></tr>
                </table>
              </div>
              ${emailData.meetingLink ? `
              <div style="text-align: center; margin: 25px 0;">
                <a href="${emailData.meetingLink}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600;">
                  🔗 Save Meeting Link
                </a>
              </div>
              ` : ''}
              <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                We'll send you reminders 24 hours and 1 hour before the interview. Good luck! 🍀
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #999; font-size: 12px; margin: 0;">HotGigs - AI-Powered Recruitment Platform</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    await sendEmail({
      to: result.users.email,
      subject,
      html,
    });

    console.log(`[Candidate Notification] Sent interview notification to ${result.users.email}`);
    return true;
  } catch (error: any) {
    console.error(`[Candidate Notification] Failed to send notification for interview ${interviewId}:`, error.message);
    return false;
  }
}
