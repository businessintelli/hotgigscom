import { invokeLLM } from "../_core/llm";
import { db } from "../_core/db";
import { aiNotificationQueue, aiNotificationPreferences, candidates, jobs, applications } from "../../drizzle/schema";
import { eq, and, gte, lte, desc, sql, isNull } from "drizzle-orm";
import * as dbHelpers from "../db";

/**
 * Proactive AI Notification Service
 * 
 * Generates and sends intelligent, personalized notifications to users
 * based on their activity, preferences, and AI-driven insights.
 */

/**
 * Generate daily top candidate digest for recruiters
 */
export async function generateTopCandidateDigest(recruiterId: number) {
  try {
    // Get recruiter's active jobs
    const jobs = await dbHelpers.getJobsByRecruiter(recruiterId);
    const activeJobs = jobs.filter((j: any) => j.status === "active");

    if (activeJobs.length === 0) {
      return null; // No active jobs, skip digest
    }

    // Get recent applications (last 24 hours) with high match scores
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const topCandidates: any[] = [];

    for (const job of activeJobs) {
      const jobApplications = await dbHelpers.getApplicationsByJob(job.id);
      const recentHighScoreApps = jobApplications.filter((app: any) => {
        const appDate = new Date(app.createdAt);
        return appDate >= yesterday && (app.matchScore || 0) >= 75;
      });

      if (recentHighScoreApps.length > 0) {
        topCandidates.push({
          jobTitle: job.title,
          jobId: job.id,
          candidates: recentHighScoreApps.slice(0, 3).map((app: any) => ({
            name: app.candidateName || "Candidate",
            matchScore: app.matchScore,
            applicationId: app.id
          }))
        });
      }
    }

    if (topCandidates.length === 0) {
      return null; // No high-scoring candidates today
    }

    // Generate personalized message using AI
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a helpful recruiting assistant. Generate a concise, professional daily digest email highlighting top candidates."
        },
        {
          role: "user",
          content: `Generate a brief, engaging message for a recruiter's daily digest. They have ${topCandidates.length} job(s) with high-scoring candidates today:\n\n${JSON.stringify(topCandidates, null, 2)}\n\nKeep it under 200 words and encourage them to review these candidates.`
        }
      ]
    });

    const message = response.choices[0]?.message?.content || 
      `You have ${topCandidates.length} job(s) with high-scoring candidates today! Check your dashboard to review them.`;

    // Queue notification
    await queueNotification({
      userId: recruiterId,
      notificationType: "top_candidate_digest",
      title: "🌟 Top Candidates Today",
      message,
      actionUrl: "/recruiter/applications",
      priority: "medium",
      scheduledFor: new Date()
    });

    return topCandidates;
  } catch (error) {
    console.error("Error generating top candidate digest:", error);
    return null;
  }
}

/**
 * Generate job match alerts for candidates
 */
export async function generateJobMatchAlerts(candidateId: number) {
  try {
    // Get candidate profile
    const candidate = await db
      .select()
      .from(candidates)
      .where(eq(candidates.id, candidateId))
      .limit(1);

    if (candidate.length === 0) {
      return null;
    }

    const candidateData = candidate[0];
    const candidateSkills = candidateData.skills ? JSON.parse(candidateData.skills) : [];

    // Get recently posted jobs (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const recentJobs = await db
      .select()
      .from(jobs)
      .where(
        and(
          eq(jobs.status, "active"),
          gte(jobs.createdAt, yesterday)
        )
      );

    if (recentJobs.length === 0) {
      return null; // No new jobs
    }

    // Simple skill matching to find relevant jobs
    const matchingJobs = recentJobs.filter(job => {
      const jobRequirements = job.requirements?.toLowerCase() || "";
      return candidateSkills.some((skill: string) => 
        jobRequirements.includes(skill.toLowerCase())
      );
    }).slice(0, 5); // Top 5 matches

    if (matchingJobs.length === 0) {
      return null; // No matching jobs
    }

    // Generate personalized message
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a helpful career coach. Generate a brief, encouraging message about new job matches."
        },
        {
          role: "user",
          content: `Generate a short message for a candidate about ${matchingJobs.length} new job(s) that match their skills: ${candidateSkills.join(", ")}. Jobs: ${matchingJobs.map(j => j.title).join(", ")}. Keep it under 150 words and encouraging.`
        }
      ]
    });

    const message = response.choices[0]?.message?.content || 
      `We found ${matchingJobs.length} new job(s) matching your skills! Check them out now.`;

    // Queue notification
    await queueNotification({
      userId: candidateData.userId,
      notificationType: "job_match_alert",
      title: `🎯 ${matchingJobs.length} New Job Match${matchingJobs.length > 1 ? "es" : ""}`,
      message,
      actionUrl: "/candidate/jobs",
      priority: "high",
      scheduledFor: new Date()
    });

    return matchingJobs;
  } catch (error) {
    console.error("Error generating job match alerts:", error);
    return null;
  }
}

/**
 * Generate profile improvement suggestions for candidates
 */
export async function generateProfileImprovementSuggestions(candidateId: number) {
  try {
    // Get candidate profile
    const candidate = await db
      .select()
      .from(candidates)
      .where(eq(candidates.id, candidateId))
      .limit(1);

    if (candidate.length === 0) {
      return null;
    }

    const candidateData = candidate[0];

    // Check profile completeness
    const missingFields = [];
    if (!candidateData.resumeUrl) missingFields.push("resume");
    if (!candidateData.skills || JSON.parse(candidateData.skills).length === 0) missingFields.push("skills");
    if (!candidateData.bio) missingFields.push("bio");
    if (!candidateData.phoneNumber) missingFields.push("phone number");
    if (!candidateData.location) missingFields.push("location");

    if (missingFields.length === 0) {
      return null; // Profile is complete
    }

    // Generate personalized suggestion
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a helpful career coach. Generate a brief, encouraging message about completing a profile."
        },
        {
          role: "user",
          content: `Generate a short message encouraging a candidate to complete these missing profile fields: ${missingFields.join(", ")}. Explain how it will help them get better job matches. Keep it under 100 words.`
        }
      ]
    });

    const message = response.choices[0]?.message?.content || 
      `Complete your profile by adding: ${missingFields.join(", ")}. This will help you get better job matches!`;

    // Queue notification (only if they haven't been notified recently)
    const recentNotifications = await db
      .select()
      .from(aiNotificationQueue)
      .where(
        and(
          eq(aiNotificationQueue.userId, candidateData.userId),
          eq(aiNotificationQueue.notificationType, "profile_improvement"),
          gte(aiNotificationQueue.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // Last 7 days
        )
      );

    if (recentNotifications.length === 0) {
      await queueNotification({
        userId: candidateData.userId,
        notificationType: "profile_improvement",
        title: "💡 Complete Your Profile",
        message,
        actionUrl: "/candidate/profile",
        priority: "low",
        scheduledFor: new Date()
      });
    }

    return { missingFields, message };
  } catch (error) {
    console.error("Error generating profile improvement suggestions:", error);
    return null;
  }
}

/**
 * Queue a notification for delivery
 */
async function queueNotification(data: {
  userId: number;
  notificationType: string;
  title: string;
  message: string;
  actionUrl?: string;
  priority: "low" | "medium" | "high";
  scheduledFor: Date;
  metadata?: any;
}) {
  try {
    // Check user preferences
    const prefs = await db
      .select()
      .from(aiNotificationPreferences)
      .where(eq(aiNotificationPreferences.userId, data.userId))
      .limit(1);

    // If no preferences exist, create default ones
    if (prefs.length === 0) {
      await db.insert(aiNotificationPreferences).values({
        userId: data.userId
      });
    } else {
      // Check if this notification type is enabled
      const userPrefs = prefs[0];
      const isEnabled = getNotificationPreference(userPrefs, data.notificationType);
      
      if (!isEnabled) {
        console.log(`Notification type ${data.notificationType} disabled for user ${data.userId}`);
        return null;
      }
    }

    // Insert into queue
    await db.insert(aiNotificationQueue).values({
      userId: data.userId,
      notificationType: data.notificationType,
      title: data.title,
      message: data.message,
      actionUrl: data.actionUrl || null,
      priority: data.priority,
      status: "pending",
      scheduledFor: data.scheduledFor,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null
    });

    console.log(`Queued notification for user ${data.userId}: ${data.title}`);
    return true;
  } catch (error) {
    console.error("Error queueing notification:", error);
    return false;
  }
}

function getNotificationPreference(prefs: any, notificationType: string): boolean {
  const typeMap: { [key: string]: string } = {
    "job_match_alert": "jobMatchAlerts",
    "profile_improvement": "profileImprovementSuggestions",
    "top_candidate_digest": "topCandidateDigest",
    "application_status": "applicationStatusUpdates",
    "interview_reminder": "interviewReminders",
    "new_application": "newApplicationAlerts",
    "bias_alert": "biasAlerts",
    "pipeline_insight": "pipelineInsights"
  };

  const prefKey = typeMap[notificationType];
  return prefKey ? prefs[prefKey] : true; // Default to enabled if not found
}

/**
 * Process pending notifications (should be called by a cron job)
 */
export async function processPendingNotifications() {
  try {
    const now = new Date();
    
    // Get pending notifications that are due
    const pending = await db
      .select()
      .from(aiNotificationQueue)
      .where(
        and(
          eq(aiNotificationQueue.status, "pending"),
          lte(aiNotificationQueue.scheduledFor, now)
        )
      )
      .limit(100); // Process in batches

    console.log(`Processing ${pending.length} pending notifications`);

    for (const notification of pending) {
      try {
        // Here you would integrate with your actual notification delivery system
        // For now, just mark as sent
        await db
          .update(aiNotificationQueue)
          .set({
            status: "sent",
            sentAt: new Date()
          })
          .where(eq(aiNotificationQueue.id, notification.id));

        console.log(`Sent notification ${notification.id} to user ${notification.userId}`);
      } catch (error) {
        console.error(`Error sending notification ${notification.id}:`, error);
        
        // Mark as failed
        await db
          .update(aiNotificationQueue)
          .set({
            status: "failed"
          })
          .where(eq(aiNotificationQueue.id, notification.id));
      }
    }

    return pending.length;
  } catch (error) {
    console.error("Error processing pending notifications:", error);
    return 0;
  }
}

/**
 * Get user's notification preferences
 */
export async function getUserNotificationPreferences(userId: number) {
  const prefs = await db
    .select()
    .from(aiNotificationPreferences)
    .where(eq(aiNotificationPreferences.userId, userId))
    .limit(1);

  if (prefs.length === 0) {
    // Create default preferences
    await db.insert(aiNotificationPreferences).values({
      userId
    });

    return {
      jobMatchAlerts: true,
      profileImprovementSuggestions: true,
      applicationStatusUpdates: true,
      interviewReminders: true,
      topCandidateDigest: true,
      digestFrequency: "daily",
      newApplicationAlerts: true,
      biasAlerts: true,
      pipelineInsights: true,
      emailNotifications: true,
      inAppNotifications: true
    };
  }

  return prefs[0];
}

/**
 * Update user's notification preferences
 */
export async function updateNotificationPreferences(
  userId: number,
  preferences: Partial<typeof aiNotificationPreferences.$inferInsert>
) {
  try {
    const existing = await db
      .select()
      .from(aiNotificationPreferences)
      .where(eq(aiNotificationPreferences.userId, userId))
      .limit(1);

    if (existing.length === 0) {
      // Create new
      await db.insert(aiNotificationPreferences).values({
        userId,
        ...preferences
      });
    } else {
      // Update existing
      await db
        .update(aiNotificationPreferences)
        .set(preferences)
        .where(eq(aiNotificationPreferences.userId, userId));
    }

    return true;
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return false;
  }
}

/**
 * Get user's notification history
 */
export async function getUserNotifications(userId: number, limit: number = 20) {
  return await db
    .select()
    .from(aiNotificationQueue)
    .where(eq(aiNotificationQueue.userId, userId))
    .orderBy(desc(aiNotificationQueue.createdAt))
    .limit(limit);
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: number) {
  await db
    .update(aiNotificationQueue)
    .set({
      readAt: new Date()
    })
    .where(eq(aiNotificationQueue.id, notificationId));
}
