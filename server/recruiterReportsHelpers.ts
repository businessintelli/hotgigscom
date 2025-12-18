import { getDb } from './db';
import { applications, jobs, interviews, candidates, users, recruiters } from '../drizzle/schema';
import { eq, and, gte, lte, sql, count, desc, asc, between } from 'drizzle-orm';

// Date range helper
export function getDateRange(period: string, customStart?: string, customEnd?: string): { startDate: Date; endDate: Date } {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setHours(23, 59, 59, 999);
  
  let startDate = new Date(now);
  startDate.setHours(0, 0, 0, 0);
  
  switch (period) {
    case 'today':
      break;
    case 'yesterday':
      startDate.setDate(startDate.getDate() - 1);
      endDate.setDate(endDate.getDate() - 1);
      break;
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case 'ytd':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case 'custom':
      if (customStart) startDate = new Date(customStart);
      if (customEnd) {
        endDate.setTime(new Date(customEnd).getTime());
        endDate.setHours(23, 59, 59, 999);
      }
      break;
    default:
      startDate.setMonth(startDate.getMonth() - 1);
  }
  
  return { startDate, endDate };
}

/**
 * Get submissions report data
 */
export async function getSubmissionsReport(recruiterId: number, period: string, customStart?: string, customEnd?: string) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  const { startDate, endDate } = getDateRange(period, customStart, customEnd);
  
  // Get recruiter's jobs
  const recruiterJobs = await db
    .select({ id: jobs.id })
    .from(jobs)
    .innerJoin(recruiters, eq(jobs.postedBy, recruiters.userId))
    .where(eq(recruiters.id, recruiterId));
  
  const jobIds = recruiterJobs.map(j => j.id);
  
  if (jobIds.length === 0) {
    return {
      summary: { total: 0, byStatus: {}, byJob: [] },
      trend: [],
      topJobs: []
    };
  }
  
  // Get applications for these jobs in date range
  const allApplications = await db
    .select({
      id: applications.id,
      status: applications.status,
      jobId: applications.jobId,
      submittedAt: applications.submittedAt,
      jobTitle: jobs.title
    })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .where(and(
      sql`${applications.jobId} IN (${sql.join(jobIds.map(id => sql`${id}`), sql`, `)})`,
      gte(applications.submittedAt, startDate),
      lte(applications.submittedAt, endDate)
    ));
  
  // Calculate summary by status
  const byStatus: Record<string, number> = {};
  allApplications.forEach(app => {
    byStatus[app.status || 'unknown'] = (byStatus[app.status || 'unknown'] || 0) + 1;
  });
  
  // Calculate by job
  const byJobMap: Record<number, { title: string; count: number }> = {};
  allApplications.forEach(app => {
    if (!byJobMap[app.jobId]) {
      byJobMap[app.jobId] = { title: app.jobTitle || 'Unknown', count: 0 };
    }
    byJobMap[app.jobId].count++;
  });
  const byJob = Object.entries(byJobMap)
    .map(([jobId, data]) => ({ jobId: parseInt(jobId), ...data }))
    .sort((a, b) => b.count - a.count);
  
  // Calculate daily trend
  const trendMap: Record<string, number> = {};
  allApplications.forEach(app => {
    const dateKey = new Date(app.submittedAt).toISOString().split('T')[0];
    trendMap[dateKey] = (trendMap[dateKey] || 0) + 1;
  });
  const trend = Object.entries(trendMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
  
  return {
    summary: {
      total: allApplications.length,
      byStatus,
      byJob: byJob.slice(0, 10)
    },
    trend,
    topJobs: byJob.slice(0, 5),
    dateRange: { startDate: startDate.toISOString(), endDate: endDate.toISOString() }
  };
}

/**
 * Get placements report data (offers, acceptances, rejections)
 */
export async function getPlacementsReport(recruiterId: number, period: string, customStart?: string, customEnd?: string) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  const { startDate, endDate } = getDateRange(period, customStart, customEnd);
  
  // Get recruiter's jobs
  const recruiterJobs = await db
    .select({ id: jobs.id })
    .from(jobs)
    .innerJoin(recruiters, eq(jobs.postedBy, recruiters.userId))
    .where(eq(recruiters.id, recruiterId));
  
  const jobIds = recruiterJobs.map(j => j.id);
  
  if (jobIds.length === 0) {
    return {
      summary: { offers: 0, acceptances: 0, rejections: 0, pending: 0, conversionRate: 0 },
      byJob: [],
      trend: []
    };
  }
  
  // Get offered/rejected applications
  const placementApps = await db
    .select({
      id: applications.id,
      status: applications.status,
      jobId: applications.jobId,
      updatedAt: applications.updatedAt,
      jobTitle: jobs.title
    })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .where(and(
      sql`${applications.jobId} IN (${sql.join(jobIds.map(id => sql`${id}`), sql`, `)})`,
      sql`${applications.status} IN ('offered', 'rejected')`,
      gte(applications.updatedAt, startDate),
      lte(applications.updatedAt, endDate)
    ));
  
  // Calculate summary
  const offers = placementApps.filter(a => a.status === 'offered').length;
  const rejections = placementApps.filter(a => a.status === 'rejected').length;
  
  // Calculate by job
  const byJobMap: Record<number, { title: string; offers: number; rejections: number }> = {};
  placementApps.forEach(app => {
    if (!byJobMap[app.jobId]) {
      byJobMap[app.jobId] = { title: app.jobTitle || 'Unknown', offers: 0, rejections: 0 };
    }
    if (app.status === 'offered') byJobMap[app.jobId].offers++;
    if (app.status === 'rejected') byJobMap[app.jobId].rejections++;
  });
  const byJob = Object.entries(byJobMap)
    .map(([jobId, data]) => ({ jobId: parseInt(jobId), ...data }))
    .sort((a, b) => b.offers - a.offers);
  
  // Calculate weekly trend
  const trendMap: Record<string, { offers: number; rejections: number }> = {};
  placementApps.forEach(app => {
    const dateKey = new Date(app.updatedAt).toISOString().split('T')[0];
    if (!trendMap[dateKey]) trendMap[dateKey] = { offers: 0, rejections: 0 };
    if (app.status === 'offered') trendMap[dateKey].offers++;
    if (app.status === 'rejected') trendMap[dateKey].rejections++;
  });
  const trend = Object.entries(trendMap)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));
  
  return {
    summary: {
      offers,
      rejections,
      total: offers + rejections,
      offerRate: offers + rejections > 0 ? Math.round((offers / (offers + rejections)) * 100) : 0
    },
    byJob,
    trend,
    dateRange: { startDate: startDate.toISOString(), endDate: endDate.toISOString() }
  };
}

/**
 * Get pipeline report (candidates by stage)
 */
export async function getPipelineReport(recruiterId: number, period: string, customStart?: string, customEnd?: string) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  const { startDate, endDate } = getDateRange(period, customStart, customEnd);
  
  // Get recruiter's jobs
  const recruiterJobs = await db
    .select({ id: jobs.id, title: jobs.title })
    .from(jobs)
    .innerJoin(recruiters, eq(jobs.postedBy, recruiters.userId))
    .where(eq(recruiters.id, recruiterId));
  
  const jobIds = recruiterJobs.map(j => j.id);
  
  if (jobIds.length === 0) {
    return {
      stages: [],
      byJob: [],
      conversionFunnel: []
    };
  }
  
  // Get all applications with status
  const pipelineApps = await db
    .select({
      status: applications.status,
      jobId: applications.jobId,
      jobTitle: jobs.title
    })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .where(and(
      sql`${applications.jobId} IN (${sql.join(jobIds.map(id => sql`${id}`), sql`, `)})`,
      gte(applications.submittedAt, startDate),
      lte(applications.submittedAt, endDate)
    ));
  
  // Calculate stage counts
  const stages = [
    { stage: 'submitted', label: 'Submitted', count: 0, color: '#6366f1' },
    { stage: 'reviewing', label: 'Reviewing', count: 0, color: '#8b5cf6' },
    { stage: 'shortlisted', label: 'Shortlisted', count: 0, color: '#a855f7' },
    { stage: 'interviewing', label: 'Interviewing', count: 0, color: '#d946ef' },
    { stage: 'offered', label: 'Offered', count: 0, color: '#22c55e' },
    { stage: 'rejected', label: 'Rejected', count: 0, color: '#ef4444' },
    { stage: 'withdrawn', label: 'Withdrawn', count: 0, color: '#6b7280' }
  ];
  
  pipelineApps.forEach(app => {
    const stageItem = stages.find(s => s.stage === app.status);
    if (stageItem) stageItem.count++;
  });
  
  // Calculate by job
  const byJobMap: Record<number, { title: string; stages: Record<string, number> }> = {};
  pipelineApps.forEach(app => {
    if (!byJobMap[app.jobId]) {
      byJobMap[app.jobId] = { title: app.jobTitle || 'Unknown', stages: {} };
    }
    byJobMap[app.jobId].stages[app.status || 'unknown'] = (byJobMap[app.jobId].stages[app.status || 'unknown'] || 0) + 1;
  });
  const byJob = Object.entries(byJobMap)
    .map(([jobId, data]) => ({ jobId: parseInt(jobId), ...data }))
    .slice(0, 10);
  
  // Calculate conversion funnel
  const total = pipelineApps.length;
  const conversionFunnel = stages.slice(0, 5).map((stage, index) => {
    const cumulativeCount = stages.slice(index).reduce((sum, s) => sum + s.count, 0);
    return {
      stage: stage.label,
      count: stage.count,
      percentage: total > 0 ? Math.round((cumulativeCount / total) * 100) : 0
    };
  });
  
  return {
    stages,
    byJob,
    conversionFunnel,
    total,
    dateRange: { startDate: startDate.toISOString(), endDate: endDate.toISOString() }
  };
}

/**
 * Get time-to-hire report
 */
export async function getTimeToHireReport(recruiterId: number, period: string, customStart?: string, customEnd?: string) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  const { startDate, endDate } = getDateRange(period, customStart, customEnd);
  
  // Get recruiter's jobs
  const recruiterJobs = await db
    .select({ id: jobs.id })
    .from(jobs)
    .innerJoin(recruiters, eq(jobs.postedBy, recruiters.userId))
    .where(eq(recruiters.id, recruiterId));
  
  const jobIds = recruiterJobs.map(j => j.id);
  
  if (jobIds.length === 0) {
    return {
      summary: { avgDays: 0, minDays: 0, maxDays: 0, totalHires: 0 },
      byJob: [],
      distribution: []
    };
  }
  
  // Get offered applications with time data
  const hiredApps = await db
    .select({
      id: applications.id,
      jobId: applications.jobId,
      submittedAt: applications.submittedAt,
      updatedAt: applications.updatedAt,
      jobTitle: jobs.title
    })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .where(and(
      sql`${applications.jobId} IN (${sql.join(jobIds.map(id => sql`${id}`), sql`, `)})`,
      eq(applications.status, 'offered'),
      gte(applications.updatedAt, startDate),
      lte(applications.updatedAt, endDate)
    ));
  
  // Calculate days to hire for each
  const hireTimes = hiredApps.map(app => {
    const days = Math.ceil(
      (new Date(app.updatedAt).getTime() - new Date(app.submittedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    return { ...app, daysToHire: days };
  });
  
  // Calculate summary
  const daysArray = hireTimes.map(h => h.daysToHire);
  const avgDays = daysArray.length > 0 ? Math.round(daysArray.reduce((a, b) => a + b, 0) / daysArray.length) : 0;
  const minDays = daysArray.length > 0 ? Math.min(...daysArray) : 0;
  const maxDays = daysArray.length > 0 ? Math.max(...daysArray) : 0;
  
  // Calculate by job
  const byJobMap: Record<number, { title: string; hires: number; avgDays: number; totalDays: number }> = {};
  hireTimes.forEach(app => {
    if (!byJobMap[app.jobId]) {
      byJobMap[app.jobId] = { title: app.jobTitle || 'Unknown', hires: 0, avgDays: 0, totalDays: 0 };
    }
    byJobMap[app.jobId].hires++;
    byJobMap[app.jobId].totalDays += app.daysToHire;
  });
  const byJob = Object.entries(byJobMap)
    .map(([jobId, data]) => ({
      jobId: parseInt(jobId),
      title: data.title,
      hires: data.hires,
      avgDays: data.hires > 0 ? Math.round(data.totalDays / data.hires) : 0
    }))
    .sort((a, b) => a.avgDays - b.avgDays);
  
  // Calculate distribution (0-7, 8-14, 15-30, 31-60, 60+)
  const distribution = [
    { range: '0-7 days', count: 0 },
    { range: '8-14 days', count: 0 },
    { range: '15-30 days', count: 0 },
    { range: '31-60 days', count: 0 },
    { range: '60+ days', count: 0 }
  ];
  hireTimes.forEach(h => {
    if (h.daysToHire <= 7) distribution[0].count++;
    else if (h.daysToHire <= 14) distribution[1].count++;
    else if (h.daysToHire <= 30) distribution[2].count++;
    else if (h.daysToHire <= 60) distribution[3].count++;
    else distribution[4].count++;
  });
  
  return {
    summary: { avgDays, minDays, maxDays, totalHires: hireTimes.length },
    byJob,
    distribution,
    dateRange: { startDate: startDate.toISOString(), endDate: endDate.toISOString() }
  };
}

/**
 * Get job performance report
 */
export async function getJobPerformanceReport(recruiterId: number, period: string, customStart?: string, customEnd?: string) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  const { startDate, endDate } = getDateRange(period, customStart, customEnd);
  
  // Get recruiter's jobs with application counts
  const jobsWithStats = await db
    .select({
      id: jobs.id,
      title: jobs.title,
      status: jobs.status,
      createdAt: jobs.createdAt,
      applicationCount: sql<number>`COUNT(${applications.id})`,
      offeredCount: sql<number>`SUM(CASE WHEN ${applications.status} = 'offered' THEN 1 ELSE 0 END)`,
      rejectedCount: sql<number>`SUM(CASE WHEN ${applications.status} = 'rejected' THEN 1 ELSE 0 END)`
    })
    .from(jobs)
    .innerJoin(recruiters, eq(jobs.postedBy, recruiters.userId))
    .leftJoin(applications, eq(applications.jobId, jobs.id))
    .where(and(
      eq(recruiters.id, recruiterId),
      gte(jobs.createdAt, startDate),
      lte(jobs.createdAt, endDate)
    ))
    .groupBy(jobs.id, jobs.title, jobs.status, jobs.createdAt);
  
  // Calculate summary
  const activeJobs = jobsWithStats.filter(j => j.status === 'active').length;
  const closedJobs = jobsWithStats.filter(j => j.status === 'closed' || j.status === 'filled').length;
  const totalApplications = jobsWithStats.reduce((sum, j) => sum + (j.applicationCount || 0), 0);
  const totalOffers = jobsWithStats.reduce((sum, j) => sum + (j.offeredCount || 0), 0);
  
  // Format job performance data
  const jobPerformance = jobsWithStats.map(job => ({
    id: job.id,
    title: job.title,
    status: job.status,
    applications: job.applicationCount || 0,
    offers: job.offeredCount || 0,
    rejections: job.rejectedCount || 0,
    conversionRate: job.applicationCount > 0 ? Math.round(((job.offeredCount || 0) / job.applicationCount) * 100) : 0
  })).sort((a, b) => b.applications - a.applications);
  
  return {
    summary: {
      totalJobs: jobsWithStats.length,
      activeJobs,
      closedJobs,
      totalApplications,
      totalOffers,
      avgApplicationsPerJob: jobsWithStats.length > 0 ? Math.round(totalApplications / jobsWithStats.length) : 0
    },
    jobs: jobPerformance,
    dateRange: { startDate: startDate.toISOString(), endDate: endDate.toISOString() }
  };
}

/**
 * Get recruiter dashboard summary
 */
export async function getRecruiterDashboardSummary(recruiterId: number, period: string = 'month') {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  const { startDate, endDate } = getDateRange(period);
  
  // Get recruiter's jobs
  const recruiterJobs = await db
    .select({ id: jobs.id })
    .from(jobs)
    .innerJoin(recruiters, eq(jobs.postedBy, recruiters.userId))
    .where(eq(recruiters.id, recruiterId));
  
  const jobIds = recruiterJobs.map(j => j.id);
  
  if (jobIds.length === 0) {
    return {
      submissions: { current: 0, previous: 0, change: 0 },
      offers: { current: 0, previous: 0, change: 0 },
      interviews: { current: 0, previous: 0, change: 0 },
      activeJobs: { current: 0, previous: 0, change: 0 }
    };
  }
  
  // Current period counts
  const currentSubmissions = await db
    .select({ count: count() })
    .from(applications)
    .where(and(
      sql`${applications.jobId} IN (${sql.join(jobIds.map(id => sql`${id}`), sql`, `)})`,
      gte(applications.submittedAt, startDate),
      lte(applications.submittedAt, endDate)
    ));
  
  const currentOffers = await db
    .select({ count: count() })
    .from(applications)
    .where(and(
      sql`${applications.jobId} IN (${sql.join(jobIds.map(id => sql`${id}`), sql`, `)})`,
      eq(applications.status, 'offered'),
      gte(applications.updatedAt, startDate),
      lte(applications.updatedAt, endDate)
    ));
  
  const currentInterviews = await db
    .select({ count: count() })
    .from(interviews)
    .where(and(
      eq(interviews.recruiterId, recruiterId),
      gte(interviews.scheduledAt, startDate),
      lte(interviews.scheduledAt, endDate)
    ));
  
  const activeJobsCount = await db
    .select({ count: count() })
    .from(jobs)
    .innerJoin(recruiters, eq(jobs.postedBy, recruiters.userId))
    .where(and(
      eq(recruiters.id, recruiterId),
      eq(jobs.status, 'active')
    ));
  
  // Previous period (same duration before start date)
  const periodDuration = endDate.getTime() - startDate.getTime();
  const prevEndDate = new Date(startDate.getTime() - 1);
  const prevStartDate = new Date(prevEndDate.getTime() - periodDuration);
  
  const prevSubmissions = await db
    .select({ count: count() })
    .from(applications)
    .where(and(
      sql`${applications.jobId} IN (${sql.join(jobIds.map(id => sql`${id}`), sql`, `)})`,
      gte(applications.submittedAt, prevStartDate),
      lte(applications.submittedAt, prevEndDate)
    ));
  
  const prevOffers = await db
    .select({ count: count() })
    .from(applications)
    .where(and(
      sql`${applications.jobId} IN (${sql.join(jobIds.map(id => sql`${id}`), sql`, `)})`,
      eq(applications.status, 'offered'),
      gte(applications.updatedAt, prevStartDate),
      lte(applications.updatedAt, prevEndDate)
    ));
  
  // Calculate changes
  const calcChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };
  
  return {
    submissions: {
      current: currentSubmissions[0]?.count || 0,
      previous: prevSubmissions[0]?.count || 0,
      change: calcChange(currentSubmissions[0]?.count || 0, prevSubmissions[0]?.count || 0)
    },
    offers: {
      current: currentOffers[0]?.count || 0,
      previous: prevOffers[0]?.count || 0,
      change: calcChange(currentOffers[0]?.count || 0, prevOffers[0]?.count || 0)
    },
    interviews: {
      current: currentInterviews[0]?.count || 0,
      previous: 0,
      change: 0
    },
    activeJobs: {
      current: activeJobsCount[0]?.count || 0,
      previous: 0,
      change: 0
    }
  };
}
