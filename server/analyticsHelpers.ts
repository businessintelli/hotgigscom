import { getDb } from './db';
import { applications, jobs, interviews, candidates, emailCampaigns, campaignRecipients } from '../drizzle/schema';
import { eq, and, gte, lte, sql, count, avg, desc } from 'drizzle-orm';

/**
 * Get application funnel metrics
 */
export async function getApplicationFunnelMetrics(startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  const conditions = [];
  if (startDate) {
    conditions.push(gte(applications.submittedAt, startDate));
  }
  if (endDate) {
    conditions.push(lte(applications.submittedAt, endDate));
  }
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  // Count applications by status
  const statusCounts = await db
    .select({
      status: applications.status,
      count: count()
    })
    .from(applications)
    .where(whereClause)
    .groupBy(applications.status);
  
  // Calculate funnel metrics
  const metrics = {
    submitted: 0,
    reviewing: 0,
    shortlisted: 0,
    interviewing: 0,
    offered: 0,
    rejected: 0,
    withdrawn: 0
  };
  
  statusCounts.forEach(({ status, count: statusCount }) => {
    if (status === 'submitted') metrics.submitted = statusCount;
    else if (status === 'reviewing') metrics.reviewing = statusCount;
    else if (status === 'shortlisted') metrics.shortlisted = statusCount;
    else if (status === 'interviewing') metrics.interviewing = statusCount;
    else if (status === 'offered') metrics.offered = statusCount;
    else if (status === 'rejected') metrics.rejected = statusCount;
    else if (status === 'withdrawn') metrics.withdrawn = statusCount;
  });
  
  // Calculate conversion rates
  const total = metrics.submitted;
  const conversionRates = {
    submittedToReviewing: total > 0 ? (metrics.reviewing / total) * 100 : 0,
    reviewingToShortlisted: metrics.reviewing > 0 ? (metrics.shortlisted / metrics.reviewing) * 100 : 0,
    shortlistedToInterviewing: metrics.shortlisted > 0 ? (metrics.interviewing / metrics.shortlisted) * 100 : 0,
    interviewingToOffered: metrics.interviewing > 0 ? (metrics.offered / metrics.interviewing) * 100 : 0,
    overallConversion: total > 0 ? (metrics.offered / total) * 100 : 0
  };
  
  return {
    metrics,
    conversionRates,
    total
  };
}

/**
 * Get time-to-hire metrics
 */
export async function getTimeToHireMetrics(startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  const conditions = [eq(applications.status, 'offered')];
  if (startDate) {
    conditions.push(gte(applications.updatedAt, startDate));
  }
  if (endDate) {
    conditions.push(lte(applications.updatedAt, endDate));
  }
  
  // Get offered applications with time difference
  const offeredApps = await db
    .select({
      id: applications.id,
      submittedAt: applications.submittedAt,
      updatedAt: applications.updatedAt,
      jobTitle: jobs.title
    })
    .from(applications)
    .leftJoin(jobs, eq(applications.jobId, jobs.id))
    .where(and(...conditions));
  
  // Calculate days to offer for each application
  const timeToHireData = offeredApps.map(app => {
    const daysToHire = Math.ceil(
      (new Date(app.updatedAt).getTime() - new Date(app.submittedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    return {
      applicationId: app.id,
      jobTitle: app.jobTitle || 'Unknown',
      daysToHire
    };
  });
  
  // Calculate average time to hire
  const avgTimeToHire = timeToHireData.length > 0
    ? timeToHireData.reduce((sum, item) => sum + item.daysToHire, 0) / timeToHireData.length
    : 0;
  
  // Calculate median
  const sorted = [...timeToHireData].sort((a, b) => a.daysToHire - b.daysToHire);
  const median = sorted.length > 0
    ? sorted[Math.floor(sorted.length / 2)].daysToHire
    : 0;
  
  return {
    average: Math.round(avgTimeToHire),
    median,
    total: timeToHireData.length,
    byJob: timeToHireData
  };
}

/**
 * Get interview completion metrics
 */
export async function getInterviewCompletionMetrics(startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  const conditions = [];
  if (startDate) {
    conditions.push(gte(interviews.scheduledAt, startDate));
  }
  if (endDate) {
    conditions.push(lte(interviews.scheduledAt, endDate));
  }
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  // Count interviews by status
  const statusCounts = await db
    .select({
      status: interviews.status,
      count: count()
    })
    .from(interviews)
    .where(whereClause)
    .groupBy(interviews.status);
  
  const metrics = {
    scheduled: 0,
    completed: 0,
    cancelled: 0,
    noShow: 0
  };
  
  statusCounts.forEach(({ status, count: statusCount }) => {
    if (status === 'scheduled') metrics.scheduled = statusCount;
    else if (status === 'completed') metrics.completed = statusCount;
    else if (status === 'cancelled') metrics.cancelled = statusCount;
    else if (status === 'no-show') metrics.noShow = statusCount;
  });
  
  const total = metrics.scheduled + metrics.completed + metrics.cancelled + metrics.noShow;
  const completionRate = total > 0 ? (metrics.completed / total) * 100 : 0;
  const noShowRate = total > 0 ? (metrics.noShow / total) * 100 : 0;
  
  return {
    metrics,
    completionRate,
    noShowRate,
    total
  };
}

/**
 * Get email campaign performance metrics
 */
export async function getEmailCampaignMetrics(startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  const conditions = [];
  if (startDate) {
    conditions.push(gte(emailCampaigns.createdAt, startDate));
  }
  if (endDate) {
    conditions.push(lte(emailCampaigns.createdAt, endDate));
  }
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  // Get campaign stats
  const campaigns = await db
    .select({
      id: emailCampaigns.id,
      name: emailCampaigns.name,
      status: emailCampaigns.status,
      totalRecipients: emailCampaigns.totalRecipients,
      sentCount: emailCampaigns.sentCount,
      openedCount: emailCampaigns.openedCount,
      clickedCount: emailCampaigns.clickedCount,
      bouncedCount: emailCampaigns.bouncedCount
    })
    .from(emailCampaigns)
    .where(whereClause);
  
  // Calculate aggregate metrics
  const totals = campaigns.reduce((acc, campaign) => ({
    sent: acc.sent + (campaign.sentCount || 0),
    opened: acc.opened + (campaign.openedCount || 0),
    clicked: acc.clicked + (campaign.clickedCount || 0),
    bounced: acc.bounced + (campaign.bouncedCount || 0)
  }), { sent: 0, opened: 0, clicked: 0, bounced: 0 });
  
  const openRate = totals.sent > 0 ? (totals.opened / totals.sent) * 100 : 0;
  const clickRate = totals.sent > 0 ? (totals.clicked / totals.sent) * 100 : 0;
  const bounceRate = totals.sent > 0 ? (totals.bounced / totals.sent) * 100 : 0;
  
  return {
    totals,
    rates: {
      openRate,
      clickRate,
      bounceRate
    },
    campaigns: campaigns.map(c => ({
      ...c,
      openRate: c.sentCount && c.sentCount > 0 ? ((c.openedCount || 0) / c.sentCount) * 100 : 0,
      clickRate: c.sentCount && c.sentCount > 0 ? ((c.clickedCount || 0) / c.sentCount) * 100 : 0
    }))
  };
}

/**
 * Get AI matching accuracy metrics
 */
export async function getAIMatchingMetrics(startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  const conditions = [];
  if (startDate) {
    conditions.push(gte(applications.submittedAt, startDate));
  }
  if (endDate) {
    conditions.push(lte(applications.submittedAt, endDate));
  }
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  // Get applications with AI scores
  const apps = await db
    .select({
      aiScore: applications.aiScore,
      status: applications.status
    })
    .from(applications)
    .where(whereClause);
  
  // Calculate average AI score by outcome
  const offered = apps.filter(a => a.status === 'offered');
  const rejected = apps.filter(a => a.status === 'rejected');
  const inProgress = apps.filter(a => a.status && !['offered', 'rejected', 'withdrawn'].includes(a.status));
  
  const avgAIScoreOffered = offered.length > 0
    ? offered.reduce((sum, a) => sum + (a.aiScore || 0), 0) / offered.length
    : 0;
  
  const avgAIScoreRejected = rejected.length > 0
    ? rejected.reduce((sum, a) => sum + (a.aiScore || 0), 0) / rejected.length
    : 0;
  
  const avgAIScoreInProgress = inProgress.length > 0
    ? inProgress.reduce((sum, a) => sum + (a.aiScore || 0), 0) / inProgress.length
    : 0;
  
  // Calculate accuracy (how well high AI scores predict success)
  const highScoreApps = apps.filter(a => (a.aiScore || 0) >= 80);
  const highScoreOffered = highScoreApps.filter(a => a.status && a.status === 'offered').length;
  const accuracy = highScoreApps.length > 0
    ? (highScoreOffered / highScoreApps.length) * 100
    : 0;
  
  return {
    averageScores: {
      offered: Math.round(avgAIScoreOffered),
      rejected: Math.round(avgAIScoreRejected),
      inProgress: Math.round(avgAIScoreInProgress)
    },
    accuracy: Math.round(accuracy),
    totalApplications: apps.length,
    highScoreApplications: highScoreApps.length
  };
}

/**
 * Get top performing jobs
 */
export async function getTopPerformingJobs(limit: number = 10) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  const topJobs = await db
    .select({
      jobId: applications.jobId,
      jobTitle: jobs.title,
      totalApplications: count(),
      offeredCount: sql<number>`SUM(CASE WHEN ${applications.status} = 'offered' THEN 1 ELSE 0 END)`,
      avgAIScore: avg(applications.aiScore)
    })
    .from(applications)
    .leftJoin(jobs, eq(applications.jobId, jobs.id))
    .groupBy(applications.jobId, jobs.title)
    .orderBy(desc(count()))
    .limit(limit);
  
  return topJobs.map(job => ({
    ...job,
    avgAIScore: job.avgAIScore ? Math.round(Number(job.avgAIScore)) : 0,
    offeredCount: Number(job.offeredCount)
  }));
}

/**
 * Get recruiter performance metrics
 */
export async function getRecruiterPerformance(recruiterId: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  const conditions = [eq(jobs.postedBy, recruiterId)];
  if (startDate) {
    conditions.push(gte(applications.submittedAt, startDate));
  }
  if (endDate) {
    conditions.push(lte(applications.submittedAt, endDate));
  }
  
  // Get applications for recruiter's jobs
  const apps = await db
    .select({
      status: applications.status,
      submittedAt: applications.submittedAt,
      updatedAt: applications.updatedAt
    })
    .from(applications)
    .leftJoin(jobs, eq(applications.jobId, jobs.id))
    .where(and(...conditions));
  
  const totalApplications = apps.length;
  const offered = apps.filter(a => a.status && a.status === 'offered').length;
  const rejected = apps.filter(a => a.status && a.status === 'rejected').length;
  const inProgress = totalApplications - offered - rejected;
  
  const offerRate = totalApplications > 0 ? (offered / totalApplications) * 100 : 0;
  
  return {
    totalApplications,
    offered,
    rejected,
    inProgress,
    offerRate
  };
}
