/**
 * Interview Reminder Service
 * Checks for upcoming interviews and sends reminder emails
 */

import { notifyOwner } from "./_core/notification";
import { getInterviewReminderEmail } from "./interviewReminderEmails";
import { getDb } from "./db";
import { interviews, candidates, jobs, users } from "../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";

interface UpcomingInterview {
  id: number;
  scheduledAt: Date;
  duration: number;
  type: string;
  meetingLink: string | null;
  location: string | null;
  reminder24hSent: boolean;
  reminder1hSent: boolean;
  candidateId: number;
  jobId: number;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  companyName: string;
}

/**
 * Get interviews that need reminders
 */
export async function getInterviewsNeedingReminders(): Promise<{
  need24hReminder: UpcomingInterview[];
  need1hReminder: UpcomingInterview[];
}> {
  const now = new Date();
  
  // 24 hours from now (with 30 min buffer)
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in23Hours30Min = new Date(now.getTime() + 23.5 * 60 * 60 * 1000);
  
  // 1 hour from now (with 15 min buffer)
  const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);
  const in45Min = new Date(now.getTime() + 45 * 60 * 1000);
  
  try {
    const database = await getDb();
    if (!database) {
      console.error("[InterviewReminder] Database not available");
      return { need24hReminder: [], need1hReminder: [] };
    }
    
    // Get interviews scheduled in ~24 hours that haven't received 24h reminder
    const interviews24h = await database
      .select({
        id: interviews.id,
        scheduledAt: interviews.scheduledAt,
        duration: interviews.duration,
        type: interviews.type,
        meetingLink: interviews.meetingLink,
        location: interviews.location,
        reminder24hSent: interviews.reminder24hSent,
        reminder1hSent: interviews.reminder1hSent,
        candidateId: interviews.candidateId,
        jobId: interviews.jobId,
        candidateName: users.name,
        candidateEmail: users.email,
        jobTitle: jobs.title,
        companyName: jobs.companyName,
      })
      .from(interviews)
      .innerJoin(candidates, eq(interviews.candidateId, candidates.id))
      .innerJoin(users, eq(candidates.userId, users.id))
      .innerJoin(jobs, eq(interviews.jobId, jobs.id))
      .where(
        and(
          eq(interviews.status, "scheduled"),
          eq(interviews.reminder24hSent, false),
          gte(interviews.scheduledAt, in23Hours30Min),
          lte(interviews.scheduledAt, in24Hours)
        )
      );
    
    // Get interviews scheduled in ~1 hour that haven't received 1h reminder
    const interviews1h = await database
      .select({
        id: interviews.id,
        scheduledAt: interviews.scheduledAt,
        duration: interviews.duration,
        type: interviews.type,
        meetingLink: interviews.meetingLink,
        location: interviews.location,
        reminder24hSent: interviews.reminder24hSent,
        reminder1hSent: interviews.reminder1hSent,
        candidateId: interviews.candidateId,
        jobId: interviews.jobId,
        candidateName: users.name,
        candidateEmail: users.email,
        jobTitle: jobs.title,
        companyName: jobs.companyName,
      })
      .from(interviews)
      .innerJoin(candidates, eq(interviews.candidateId, candidates.id))
      .innerJoin(users, eq(candidates.userId, users.id))
      .innerJoin(jobs, eq(interviews.jobId, jobs.id))
      .where(
        and(
          eq(interviews.status, "scheduled"),
          eq(interviews.reminder1hSent, false),
          gte(interviews.scheduledAt, in45Min),
          lte(interviews.scheduledAt, in1Hour)
        )
      );
    
    return {
      need24hReminder: interviews24h.map((i: typeof interviews24h[number]) => ({
        ...i,
        candidateName: i.candidateName || "Candidate",
        candidateEmail: i.candidateEmail || "",
        companyName: i.companyName || "Company",
      })),
      need1hReminder: interviews1h.map((i: typeof interviews1h[number]) => ({
        ...i,
        candidateName: i.candidateName || "Candidate",
        candidateEmail: i.candidateEmail || "",
        companyName: i.companyName || "Company",
      })),
    };
  } catch (error) {
    console.error("[InterviewReminder] Error fetching interviews:", error);
    return { need24hReminder: [], need1hReminder: [] };
  }
}

/**
 * Send interview reminder email
 */
export async function sendInterviewReminder(
  interview: UpcomingInterview,
  hoursBeforeInterview: number
): Promise<boolean> {
  try {
    const { subject, html } = getInterviewReminderEmail(hoursBeforeInterview, {
      candidateName: interview.candidateName,
      candidateEmail: interview.candidateEmail,
      jobTitle: interview.jobTitle,
      companyName: interview.companyName,
      interviewDate: new Date(interview.scheduledAt),
      interviewType: interview.type,
      interviewLink: interview.meetingLink || undefined,
      interviewLocation: interview.location || undefined,
      duration: interview.duration,
    });
    
    // Send email via notification system
    const success = await notifyOwner({
      title: `Email to ${interview.candidateEmail}: ${subject}`,
      content: html,
    });
    
    if (success) {
      // Mark reminder as sent
      const database = await getDb();
      if (database) {
        if (hoursBeforeInterview <= 1) {
          await database
            .update(interviews)
            .set({ reminder1hSent: true })
            .where(eq(interviews.id, interview.id));
        } else {
          await database
            .update(interviews)
            .set({ reminder24hSent: true })
            .where(eq(interviews.id, interview.id));
        }
      }
      
      console.log(`[InterviewReminder] Sent ${hoursBeforeInterview}h reminder to ${interview.candidateEmail} for interview ${interview.id}`);
    }
    
    return success;
  } catch (error) {
    console.error(`[InterviewReminder] Error sending reminder:`, error);
    return false;
  }
}

/**
 * Process all pending interview reminders
 * This should be called periodically (e.g., every 15 minutes via cron)
 */
export async function processInterviewReminders(): Promise<{
  sent24h: number;
  sent1h: number;
  errors: number;
}> {
  const results = { sent24h: 0, sent1h: 0, errors: 0 };
  
  try {
    const { need24hReminder, need1hReminder } = await getInterviewsNeedingReminders();
    
    // Send 24-hour reminders
    for (const interview of need24hReminder) {
      const success = await sendInterviewReminder(interview, 24);
      if (success) {
        results.sent24h++;
      } else {
        results.errors++;
      }
    }
    
    // Send 1-hour reminders
    for (const interview of need1hReminder) {
      const success = await sendInterviewReminder(interview, 1);
      if (success) {
        results.sent1h++;
      } else {
        results.errors++;
      }
    }
    
    console.log(`[InterviewReminder] Processed reminders: ${results.sent24h} 24h, ${results.sent1h} 1h, ${results.errors} errors`);
  } catch (error) {
    console.error("[InterviewReminder] Error processing reminders:", error);
  }
  
  return results;
}

/**
 * Get upcoming interviews for a candidate (for dashboard display)
 */
export async function getUpcomingInterviewsForCandidate(candidateId: number): Promise<{
  id: number;
  scheduledAt: Date;
  duration: number;
  type: string;
  meetingLink: string | null;
  location: string | null;
  jobTitle: string;
  companyName: string;
  hoursUntilInterview: number;
}[]> {
  const now = new Date();
  
  try {
    const database = await getDb();
    if (!database) {
      return [];
    }
    const upcomingInterviews = await database
      .select({
        id: interviews.id,
        scheduledAt: interviews.scheduledAt,
        duration: interviews.duration,
        type: interviews.type,
        meetingLink: interviews.meetingLink,
        location: interviews.location,
        jobTitle: jobs.title,
        companyName: jobs.companyName,
      })
      .from(interviews)
      .innerJoin(jobs, eq(interviews.jobId, jobs.id))
      .where(
        and(
          eq(interviews.candidateId, candidateId),
          eq(interviews.status, "scheduled"),
          gte(interviews.scheduledAt, now)
        )
      )
      .orderBy(interviews.scheduledAt)
      .limit(5);
    
    return upcomingInterviews.map((interview: typeof upcomingInterviews[number]) => ({
      ...interview,
      companyName: interview.companyName || "Company",
      hoursUntilInterview: Math.round(
        (new Date(interview.scheduledAt).getTime() - now.getTime()) / (1000 * 60 * 60)
      ),
    }));
  } catch (error) {
    console.error("[InterviewReminder] Error fetching upcoming interviews:", error);
    return [];
  }
}
