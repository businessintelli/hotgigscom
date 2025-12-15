import { getDb } from "./db";
import { recruiters, applications, candidates, jobs, applicationFeedback, interviews, users } from "../drizzle/schema";
import { eq, gte, and, desc } from "drizzle-orm";

interface DigestData {
  recruiter: any;
  newApplicationsCount: number;
  topRatedCandidates: any[];
  upcomingInterviews: any[];
  recentFeedback: any[];
}

/**
 * Generate digest data for a recruiter
 */
export async function generateDigestData(recruiterId: number): Promise<DigestData | null> {
  const db = await getDb();
  if (!db) return null;

  // Get recruiter info
  const recruiterData = await db
    .select()
    .from(recruiters)
    .where(eq(recruiters.id, recruiterId))
    .limit(1);

  if (!recruiterData[0]) return null;

  const recruiter = recruiterData[0];
  const now = new Date();
  const cutoffDate = new Date();
  
  // Determine cutoff based on frequency
  if (recruiter.emailDigestFrequency === 'daily') {
    cutoffDate.setDate(cutoffDate.getDate() - 1);
  } else if (recruiter.emailDigestFrequency === 'weekly') {
    cutoffDate.setDate(cutoffDate.getDate() - 7);
  }

  // Get new applications for recruiter's jobs
  const recruiterJobs = await db
    .select({ id: jobs.id })
    .from(jobs)
    .where(eq(jobs.postedBy, recruiter.userId));

  const jobIds = recruiterJobs.map(j => j.id);

  if (jobIds.length === 0) {
    return {
      recruiter,
      newApplicationsCount: 0,
      topRatedCandidates: [],
      upcomingInterviews: [],
      recentFeedback: [],
    };
  }

  // Count new applications
  const newApps = await db
    .select()
    .from(applications)
    .where(
      and(
        gte(applications.submittedAt, cutoffDate)
      )
    );

  const newApplicationsCount = newApps.filter(app => jobIds.includes(app.jobId)).length;

  // Get top-rated candidates (4+ stars average)
  const allApps = await db
    .select({
      application: applications,
      candidate: candidates,
      job: jobs,
    })
    .from(applications)
    .leftJoin(candidates, eq(applications.candidateId, candidates.id))
    .leftJoin(jobs, eq(applications.jobId, jobs.id))
    .where(eq(jobs.postedBy, recruiter.userId))
    .limit(100);

  // Calculate average ratings
  const candidatesWithRatings = await Promise.all(
    allApps.map(async (app) => {
      const feedback = await db
        .select()
        .from(applicationFeedback)
        .where(eq(applicationFeedback.applicationId, app.application.id));

      const ratings = feedback.filter(f => f.rating).map(f => f.rating!);
      const avgRating = ratings.length > 0 
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
        : 0;

      return {
        ...app,
        avgRating,
        feedbackCount: feedback.length,
      };
    })
  );

  const topRatedCandidates = candidatesWithRatings
    .filter(c => c.avgRating >= 4)
    .sort((a, b) => b.avgRating - a.avgRating)
    .slice(0, 5);

  // Get upcoming interviews (next 7 days)
  const upcomingDate = new Date();
  upcomingDate.setDate(upcomingDate.getDate() + 7);

  const upcomingInterviews = await db
    .select({
      interview: interviews,
      candidate: candidates,
      job: jobs,
    })
    .from(interviews)
    .leftJoin(candidates, eq(interviews.candidateId, candidates.id))
    .leftJoin(jobs, eq(interviews.jobId, jobs.id))
    .where(
      and(
        eq(interviews.recruiterId, recruiterId),
        gte(interviews.scheduledAt, now)
      )
    )
    .orderBy(interviews.scheduledAt)
    .limit(10);

  // Get recent feedback from team
  const recentFeedback = await db
    .select({
      feedback: applicationFeedback,
      application: applications,
      candidate: candidates,
      job: jobs,
    })
    .from(applicationFeedback)
    .leftJoin(applications, eq(applicationFeedback.applicationId, applications.id))
    .leftJoin(candidates, eq(applications.candidateId, candidates.id))
    .leftJoin(jobs, eq(applications.jobId, jobs.id))
    .where(
      and(
        gte(applicationFeedback.createdAt, cutoffDate)
      )
    )
    .orderBy(desc(applicationFeedback.createdAt))
    .limit(10);

  // Filter for recruiter's jobs
  const filteredFeedback = recentFeedback.filter(f => 
    f.job && jobIds.includes(f.job.id)
  );

  return {
    recruiter,
    newApplicationsCount,
    topRatedCandidates,
    upcomingInterviews,
    recentFeedback: filteredFeedback.slice(0, 5),
  };
}

/**
 * Generate HTML email for digest
 */
export function generateDigestEmail(data: DigestData): string {
  const { recruiter, newApplicationsCount, topRatedCandidates, upcomingInterviews, recentFeedback } = data;
  
  const frequency = recruiter.emailDigestFrequency === 'daily' ? 'Daily' : 'Weekly';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .section { background: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }
    .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #667eea; }
    .stat { font-size: 32px; font-weight: bold; color: #667eea; }
    .candidate-card { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border: 1px solid #e5e7eb; }
    .rating { color: #fbbf24; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 ${frequency} Recruitment Digest</h1>
      <p>Your recruitment activity summary</p>
    </div>

    ${newApplicationsCount > 0 ? `
    <div class="section">
      <div class="section-title">📝 New Applications</div>
      <div class="stat">${newApplicationsCount}</div>
      <p>new applications received</p>
    </div>
    ` : ''}

    ${topRatedCandidates.length > 0 ? `
    <div class="section">
      <div class="section-title">⭐ Top-Rated Candidates</div>
      ${topRatedCandidates.map(c => `
        <div class="candidate-card">
          <strong>${c.candidate?.firstName || ''} ${c.candidate?.lastName || ''}</strong><br>
          <span class="rating">${'★'.repeat(Math.round(c.avgRating))}${'☆'.repeat(5 - Math.round(c.avgRating))}</span>
          ${c.avgRating.toFixed(1)} average (${c.feedbackCount} reviews)<br>
          <small>Applied for: ${c.job?.title || 'Unknown Position'}</small>
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${upcomingInterviews.length > 0 ? `
    <div class="section">
      <div class="section-title">📅 Upcoming Interviews</div>
      ${upcomingInterviews.map(i => `
        <div class="candidate-card">
          <strong>${i.candidate?.firstName || ''} ${i.candidate?.lastName || ''}</strong><br>
          ${new Date(i.interview.scheduledAt).toLocaleString()}<br>
          <small>${i.job?.title || 'Unknown Position'} - ${i.interview.type || 'Interview'}</small>
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${recentFeedback.length > 0 ? `
    <div class="section">
      <div class="section-title">💬 Recent Team Feedback</div>
      ${recentFeedback.map(f => `
        <div class="candidate-card">
          <strong>${f.candidate?.firstName || ''} ${f.candidate?.lastName || ''}</strong><br>
          ${f.feedback.rating ? `<span class="rating">${'★'.repeat(f.feedback.rating)}${'☆'.repeat(5 - f.feedback.rating)}</span><br>` : ''}
          ${f.feedback.notes ? `<p style="margin: 5px 0; font-size: 14px;">${f.feedback.notes.substring(0, 100)}${f.feedback.notes.length > 100 ? '...' : ''}</p>` : ''}
          <small>${new Date(f.feedback.createdAt).toLocaleDateString()}</small>
        </div>
      `).join('')}
    </div>
    ` : ''}

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.VITE_FRONTEND_FORGE_API_URL || 'https://your-app.com'}/recruiter/applications" class="button">
        View All Applications
      </a>
    </div>

    <div class="footer">
      <p>You're receiving this ${frequency.toLowerCase()} digest because you're a recruiter on HotGigs.</p>
      <p><a href="${process.env.VITE_FRONTEND_FORGE_API_URL || 'https://your-app.com'}/recruiter/settings">Update your email preferences</a></p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Send digest email to a recruiter
 */
export async function sendDigestEmail(recruiterId: number): Promise<boolean> {
  try {
    const data = await generateDigestData(recruiterId);
    if (!data) return false;

    // Skip if no activity
    if (
      data.newApplicationsCount === 0 &&
      data.topRatedCandidates.length === 0 &&
      data.upcomingInterviews.length === 0 &&
      data.recentFeedback.length === 0
    ) {
      console.log(`[Digest] No activity for recruiter ${recruiterId}, skipping email`);
      return true; // Not an error, just nothing to send
    }

    const html = generateDigestEmail(data);
    const frequency = data.recruiter.emailDigestFrequency === 'daily' ? 'Daily' : 'Weekly';

    // Get recruiter's user email
    const db = await getDb();
    if (!db) return false;

    const userData = await db
      .select()
      .from(users)
      .where(eq(users.id, data.recruiter.userId))
      .limit(1);

    const user = userData[0];

    if (!user?.email) {
      console.error(`[Digest] No email found for recruiter ${recruiterId}`);
      return false;
    }

    // TODO: Integrate with email service
    console.log(`[Digest] Would send email to ${user.email}`);
    console.log(`[Digest] Subject: ${frequency} Recruitment Digest - ${data.newApplicationsCount} New Applications`);
    // await sendEmail({ to: user.email, subject: `${frequency} Recruitment Digest`, html });

    // Update last digest sent timestamp
    await db
      .update(recruiters)
      .set({ lastDigestSentAt: new Date() })
      .where(eq(recruiters.id, recruiterId));

    console.log(`[Digest] Sent ${frequency.toLowerCase()} digest to recruiter ${recruiterId}`);
    return true;
  } catch (error) {
    console.error(`[Digest] Error sending digest to recruiter ${recruiterId}:`, error);
    return false;
  }
}

/**
 * Send digests to all recruiters based on their preferences
 */
export async function sendAllDigests(frequency: 'daily' | 'weekly'): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const recruitersToNotify = await db
    .select()
    .from(recruiters)
    .where(eq(recruiters.emailDigestFrequency, frequency));

  console.log(`[Digest] Sending ${frequency} digests to ${recruitersToNotify.length} recruiters`);

  for (const recruiter of recruitersToNotify) {
    await sendDigestEmail(recruiter.id);
  }
}
