import { getDb } from "../db.js";
import { interviews, users, candidates, jobs, recruiters } from "../../drizzle/schema.js";
import { eq, and, lte, gte, isNull } from "drizzle-orm";
import { sendInterviewReminderNotification } from "./notificationDispatcher.js";

/**
 * Interview Reminder Cron Service
 * 
 * Sends automated reminders for upcoming interviews to Slack/Teams
 * - 24-hour reminder
 * - 1-hour reminder
 */

/**
 * Send 24-hour interview reminders
 * Should run every hour
 */
export async function send24HourReminders(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("[InterviewReminderCron] Database not available for 24-hour reminders");
    return;
  }
  
  try {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in23Hours = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    
    // Find interviews scheduled in 23-24 hours that haven't been reminded
    const upcomingInterviews = await db
      .select({
        interview: interviews,
        candidate: candidates,
        job: jobs,
        recruiter: recruiters,
      })
      .from(interviews)
      .leftJoin(candidates, eq(interviews.candidateId, candidates.id))
      .leftJoin(jobs, eq(interviews.jobId, jobs.id))
      .leftJoin(recruiters, eq(interviews.recruiterId, recruiters.id))
      .where(
        and(
          gte(interviews.scheduledAt, in23Hours),
          lte(interviews.scheduledAt, in24Hours),
          eq(interviews.candidateReminder24hSent, false),
          eq(interviews.status, "scheduled")
        )
      );
    
    console.log(`[InterviewReminderCron] Found ${upcomingInterviews.length} interviews for 24h reminders`);
    
    for (const { interview, candidate, job, recruiter } of upcomingInterviews) {
      if (!candidate || !job || !recruiter || !interview.scheduledAt) {
        continue;
      }
      
      try {
        // Send Slack/Teams notification to recruiter's company
        if (recruiter.companyId) {
          await sendInterviewReminderNotification(
            recruiter.companyId,
            candidate.fullName || "Candidate",
            job.title,
            interview.scheduledAt,
            24
          );
        }
        
        // Mark as sent
        await db
          .update(interviews)
          .set({ candidateReminder24hSent: true })
          .where(eq(interviews.id, interview.id));
        
        console.log(`[InterviewReminderCron] Sent 24h reminder for interview ${interview.id}`);
        
      } catch (error) {
        console.error(`[InterviewReminderCron] Failed to send 24h reminder for interview ${interview.id}:`, error);
      }
    }
    
  } catch (error) {
    console.error("[InterviewReminderCron] Error in send24HourReminders:", error);
  }
}

/**
 * Send 1-hour interview reminders
 * Should run every 15 minutes
 */
export async function send1HourReminders(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("[InterviewReminderCron] Database not available for 1-hour reminders");
    return;
  }
  
  try {
    const now = new Date();
    const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);
    const in45Minutes = new Date(now.getTime() + 45 * 60 * 1000);
    
    // Find interviews scheduled in 45-60 minutes that haven't been reminded
    const upcomingInterviews = await db
      .select({
        interview: interviews,
        candidate: candidates,
        job: jobs,
        recruiter: recruiters,
      })
      .from(interviews)
      .leftJoin(candidates, eq(interviews.candidateId, candidates.id))
      .leftJoin(jobs, eq(interviews.jobId, jobs.id))
      .leftJoin(recruiters, eq(interviews.recruiterId, recruiters.id))
      .where(
        and(
          gte(interviews.scheduledAt, in45Minutes),
          lte(interviews.scheduledAt, in1Hour),
          eq(interviews.candidateReminder1hSent, false),
          eq(interviews.status, "scheduled")
        )
      );
    
    console.log(`[InterviewReminderCron] Found ${upcomingInterviews.length} interviews for 1h reminders`);
    
    for (const { interview, candidate, job, recruiter } of upcomingInterviews) {
      if (!candidate || !job || !recruiter || !interview.scheduledAt) {
        continue;
      }
      
      try {
        // Send Slack/Teams notification to recruiter's company
        if (recruiter.companyId) {
          await sendInterviewReminderNotification(
            recruiter.companyId,
            candidate.fullName || "Candidate",
            job.title,
            interview.scheduledAt,
            1
          );
        }
        
        // Mark as sent
        await db
          .update(interviews)
          .set({ candidateReminder1hSent: true })
          .where(eq(interviews.id, interview.id));
        
        console.log(`[InterviewReminderCron] Sent 1h reminder for interview ${interview.id}`);
        
      } catch (error) {
        console.error(`[InterviewReminderCron] Failed to send 1h reminder for interview ${interview.id}:`, error);
      }
    }
    
  } catch (error) {
    console.error("[InterviewReminderCron] Error in send1HourReminders:", error);
  }
}

/**
 * Start interview reminder cron jobs
 */
export function startInterviewReminderCron(): void {
  console.log("[InterviewReminderCron] Starting interview reminder cron jobs");
  
  // Run 24-hour reminders every hour
  setInterval(async () => {
    console.log("[InterviewReminderCron] Running 24-hour reminder check");
    await send24HourReminders();
  }, 60 * 60 * 1000); // Every hour
  
  // Run 1-hour reminders every 15 minutes
  setInterval(async () => {
    console.log("[InterviewReminderCron] Running 1-hour reminder check");
    await send1HourReminders();
  }, 15 * 60 * 1000); // Every 15 minutes
  
  // Run immediately on startup
  setTimeout(() => {
    send24HourReminders();
    send1HourReminders();
  }, 5000); // Wait 5 seconds after startup
}
