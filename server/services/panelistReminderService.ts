/**
 * Panelist Reminder Service
 * Handles sending automated reminders to panel members before interviews
 */

import { eq, and, sql, gte, lte } from "drizzle-orm";
import { getDb } from '../db';
import { 
  interviewPanelists, 
  interviews, 
  applications, 
  jobs, 
  candidates, 
  users 
} from '../../drizzle/schema';
// Removed db import - using local functions instead
import { generate24HourReminderEmail, generate1HourReminderEmail } from '../emails/panelistReminderEmails';
import { sendEmail } from '../emailService';

interface ReminderResult {
  success: boolean;
  sent24h: number;
  sent1h: number;
  errors: string[];
}

/**
 * Get panelists needing reminders
 */
async function getPanelistsNeedingReminders() {
  const db = await getDb();
  if (!db) return { reminder24h: [], reminder1h: [] };
  
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in23h = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const in1h = new Date(now.getTime() + 60 * 60 * 1000);
  const in30m = new Date(now.getTime() + 30 * 60 * 1000);
  
  // Get panelists needing 24h reminder
  const reminder24hResult = await db
    .select()
    .from(interviewPanelists)
    .leftJoin(interviews, eq(interviewPanelists.interviewId, interviews.id))
    .leftJoin(applications, eq(interviews.applicationId, applications.id))
    .leftJoin(jobs, eq(applications.jobId, jobs.id))
    .leftJoin(candidates, eq(applications.candidateId, candidates.id))
    .leftJoin(users, eq(candidates.userId, users.id))
    .where(
      and(
        eq(interviewPanelists.status, 'accepted'),
        sql`${interviewPanelists.reminder24hSent} = false`,
        gte(interviews.scheduledAt, in23h),
        lte(interviews.scheduledAt, in24h)
      )
    );
  
  // Get panelists needing 1h reminder
  const reminder1hResult = await db
    .select()
    .from(interviewPanelists)
    .leftJoin(interviews, eq(interviewPanelists.interviewId, interviews.id))
    .leftJoin(applications, eq(interviews.applicationId, applications.id))
    .leftJoin(jobs, eq(applications.jobId, jobs.id))
    .leftJoin(candidates, eq(applications.candidateId, candidates.id))
    .leftJoin(users, eq(candidates.userId, users.id))
    .where(
      and(
        eq(interviewPanelists.status, 'accepted'),
        sql`${interviewPanelists.reminder1hSent} = false`,
        gte(interviews.scheduledAt, in30m),
        lte(interviews.scheduledAt, in1h)
      )
    );
  
  const mapResult = (rows: any[]) => rows.map((row: any) => ({
    panelist: row.interview_panelists,
    interview: row.interviews,
    job: row.jobs,
    candidate: {
      ...row.candidates,
      user: row.users,
    },
  }));
  
  return {
    reminder24h: mapResult(reminder24hResult),
    reminder1h: mapResult(reminder1hResult),
  };
}

/**
 * Mark panelist reminder as sent
 */
async function markPanelistReminderSent(panelistId: number, reminderType: '24h' | '1h') {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData = reminderType === '24h' 
    ? { reminder24hSent: true } 
    : { reminder1hSent: true };
  
  await db.update(interviewPanelists).set(updateData as any).where(eq(interviewPanelists.id, panelistId));
}

/**
 * Process all pending panelist reminders
 */
export async function processPanelistReminders(): Promise<ReminderResult> {
  const result: ReminderResult = {
    success: true,
    sent24h: 0,
    sent1h: 0,
    errors: [],
  };

  try {
    const { reminder24h, reminder1h } = await getPanelistsNeedingReminders();

    // Process 24-hour reminders
    for (const item of reminder24h) {
      try {
        const emailData = {
          panelistName: item.panelist.name || 'Panel Member',
          panelistEmail: item.panelist.email,
          candidateName: item.candidate?.user?.name || 'Candidate',
          jobTitle: item.job?.title || 'Position',
          companyName: item.job?.companyName,
          interviewDate: new Date(item.interview.scheduledAt),
          interviewDuration: item.interview.duration || 60,
          interviewType: item.interview.type || 'video',
          meetingLink: item.interview.meetingLink,
          location: item.interview.location,
          notes: item.interview.notes,
        };

        const { subject, html } = generate24HourReminderEmail(emailData);
        
        await sendEmail({
          to: item.panelist.email,
          subject,
          html,
        });

        await markPanelistReminderSent(item.panelist.id, '24h');
        result.sent24h++;
        
        console.log(`[Panelist Reminder] Sent 24h reminder to ${item.panelist.email}`);
      } catch (error: any) {
        const errorMsg = `Failed to send 24h reminder to ${item.panelist.email}: ${error.message}`;
        result.errors.push(errorMsg);
        console.error(`[Panelist Reminder] ${errorMsg}`);
      }
    }

    // Process 1-hour reminders
    for (const item of reminder1h) {
      try {
        const emailData = {
          panelistName: item.panelist.name || 'Panel Member',
          panelistEmail: item.panelist.email,
          candidateName: item.candidate?.user?.name || 'Candidate',
          jobTitle: item.job?.title || 'Position',
          companyName: item.job?.companyName,
          interviewDate: new Date(item.interview.scheduledAt),
          interviewDuration: item.interview.duration || 60,
          interviewType: item.interview.type || 'video',
          meetingLink: item.interview.meetingLink,
          location: item.interview.location,
          notes: item.interview.notes,
        };

        const { subject, html } = generate1HourReminderEmail(emailData);
        
        await sendEmail({
          to: item.panelist.email,
          subject,
          html,
        });

        await markPanelistReminderSent(item.panelist.id, '1h');
        result.sent1h++;
        
        console.log(`[Panelist Reminder] Sent 1h reminder to ${item.panelist.email}`);
      } catch (error: any) {
        const errorMsg = `Failed to send 1h reminder to ${item.panelist.email}: ${error.message}`;
        result.errors.push(errorMsg);
        console.error(`[Panelist Reminder] ${errorMsg}`);
      }
    }

    if (result.errors.length > 0) {
      result.success = false;
    }

    console.log(`[Panelist Reminder] Processed: ${result.sent24h} 24h reminders, ${result.sent1h} 1h reminders`);
    return result;
  } catch (error: any) {
    result.success = false;
    result.errors.push(`System error: ${error.message}`);
    console.error(`[Panelist Reminder] System error: ${error.message}`);
    return result;
  }
}
