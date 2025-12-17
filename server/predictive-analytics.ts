/**
 * Predictive Analytics Service
 * 
 * Provides hiring trends, time-to-hire metrics, pipeline health,
 * and success rate predictions based on historical data.
 */

import * as db from "./db";

// =============================================================================
// Types
// =============================================================================

export interface HiringTrends {
  period: string;
  totalApplications: number;
  totalHires: number;
  averageTimeToHire: number; // in days
  conversionRate: number; // percentage
  topPerformingJobs: Array<{
    jobId: number;
    jobTitle: string;
    applicationsCount: number;
    hiresCount: number;
    conversionRate: number;
  }>;
  applicationsByMonth: Array<{
    month: string;
    applications: number;
    hires: number;
  }>;
}

export interface TimeToHireMetrics {
  overall: {
    averageDays: number;
    medianDays: number;
    minDays: number;
    maxDays: number;
  };
  byStage: Array<{
    stage: string;
    averageDays: number;
  }>;
  byJobType: Array<{
    jobType: string;
    averageDays: number;
  }>;
  trend: "improving" | "stable" | "declining";
  prediction: {
    nextMonthAverage: number;
    confidence: number; // 0-100
  };
}

export interface PipelineHealth {
  totalCandidates: number;
  byStage: Array<{
    stage: string;
    count: number;
    percentage: number;
    avgDaysInStage: number;
  }>;
  bottlenecks: Array<{
    stage: string;
    issue: string;
    severity: "low" | "medium" | "high";
    recommendation: string;
  }>;
  healthScore: number; // 0-100
  conversionRates: Array<{
    fromStage: string;
    toStage: string;
    rate: number; // percentage
  }>;
}

export interface SuccessRatePrediction {
  overallSuccessRate: number; // percentage
  predictedHiresNextMonth: number;
  confidence: number; // 0-100
  factors: Array<{
    factor: string;
    impact: "positive" | "negative" | "neutral";
    weight: number; // 0-100
  }>;
  recommendations: string[];
}

// =============================================================================
// Hiring Trends Analysis
// =============================================================================

export async function getHiringTrends(
  recruiterId: number,
  startDate: Date,
  endDate: Date
): Promise<HiringTrends> {
  const jobs = await db.getJobsByRecruiter(recruiterId);
  const jobIds = jobs.map(j => j.id);
  
  if (jobIds.length === 0) {
    return {
      period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
      totalApplications: 0,
      totalHires: 0,
      averageTimeToHire: 0,
      conversionRate: 0,
      topPerformingJobs: [],
      applicationsByMonth: [],
    };
  }
  
  // Get all applications in period
  const allApplications = await db.getAllApplications();
  const applications = allApplications.filter(app => 
    jobIds.includes(app.jobId) &&
    new Date(app.submittedAt) >= startDate &&
    new Date(app.submittedAt) <= endDate
  );
  
  // Count hires (offered or onboarded status)
  const hires = applications.filter(app => 
    app.status === 'offered' || app.status === 'onboarded'
  );
  
  // Calculate average time to hire
  const timeToHires = hires.map(hire => {
    const submitted = new Date(hire.submittedAt).getTime();
    const updated = new Date(hire.updatedAt).getTime();
    return (updated - submitted) / (1000 * 60 * 60 * 24); // days
  });
  const averageTimeToHire = timeToHires.length > 0
    ? timeToHires.reduce((a, b) => a + b, 0) / timeToHires.length
    : 0;
  
  // Conversion rate
  const conversionRate = applications.length > 0
    ? (hires.length / applications.length) * 100
    : 0;
  
  // Top performing jobs
  const jobPerformance = new Map<number, {
    jobId: number;
    jobTitle: string;
    applicationsCount: number;
    hiresCount: number;
  }>();
  
  for (const app of applications) {
    const job = jobs.find(j => j.id === app.jobId);
    if (!job) continue;
    
    if (!jobPerformance.has(app.jobId)) {
      jobPerformance.set(app.jobId, {
        jobId: app.jobId,
        jobTitle: job.title,
        applicationsCount: 0,
        hiresCount: 0,
      });
    }
    
    const perf = jobPerformance.get(app.jobId)!;
    perf.applicationsCount++;
    if (app.status === 'offered' || app.status === 'onboarded') {
      perf.hiresCount++;
    }
  }
  
  const topPerformingJobs = Array.from(jobPerformance.values())
    .map(p => ({
      ...p,
      conversionRate: p.applicationsCount > 0 ? (p.hiresCount / p.applicationsCount) * 100 : 0,
    }))
    .sort((a, b) => b.conversionRate - a.conversionRate)
    .slice(0, 5);
  
  // Applications by month
  const monthlyData = new Map<string, { applications: number; hires: number }>();
  for (const app of applications) {
    const month = new Date(app.submittedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    if (!monthlyData.has(month)) {
      monthlyData.set(month, { applications: 0, hires: 0 });
    }
    const data = monthlyData.get(month)!;
    data.applications++;
    if (app.status === 'offered' || app.status === 'onboarded') {
      data.hires++;
    }
  }
  
  const applicationsByMonth = Array.from(monthlyData.entries())
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  
  return {
    period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
    totalApplications: applications.length,
    totalHires: hires.length,
    averageTimeToHire: Math.round(averageTimeToHire),
    conversionRate: Math.round(conversionRate * 10) / 10,
    topPerformingJobs,
    applicationsByMonth,
  };
}

// =============================================================================
// Time to Hire Metrics
// =============================================================================

export async function getTimeToHireMetrics(
  recruiterId: number,
  startDate: Date,
  endDate: Date
): Promise<TimeToHireMetrics> {
  const jobs = await db.getJobsByRecruiter(recruiterId);
  const jobIds = jobs.map(j => j.id);
  
  if (jobIds.length === 0) {
    return {
      overall: { averageDays: 0, medianDays: 0, minDays: 0, maxDays: 0 },
      byStage: [],
      byJobType: [],
      trend: "stable",
      prediction: { nextMonthAverage: 0, confidence: 0 },
    };
  }
  
  const allApplications = await db.getAllApplications();
  const hiredApplications = allApplications.filter(app =>
    jobIds.includes(app.jobId) &&
    (app.status === 'offered' || app.status === 'onboarded') &&
    new Date(app.submittedAt) >= startDate &&
    new Date(app.submittedAt) <= endDate
  );
  
  // Calculate time to hire for each
  const timeToHires = hiredApplications.map(app => {
    const submitted = new Date(app.submittedAt).getTime();
    const updated = new Date(app.updatedAt).getTime();
    return {
      days: (updated - submitted) / (1000 * 60 * 60 * 24),
      jobId: app.jobId,
      status: app.status,
    };
  });
  
  if (timeToHires.length === 0) {
    return {
      overall: { averageDays: 0, medianDays: 0, minDays: 0, maxDays: 0 },
      byStage: [],
      byJobType: [],
      trend: "stable",
      prediction: { nextMonthAverage: 0, confidence: 0 },
    };
  }
  
  const days = timeToHires.map(t => t.days).sort((a, b) => a - b);
  const averageDays = days.reduce((a, b) => a + b, 0) / days.length;
  const medianDays = days[Math.floor(days.length / 2)];
  const minDays = days[0];
  const maxDays = days[days.length - 1];
  
  // By stage (simplified - using final status as proxy)
  const byStage = [
    {
      stage: "Offered",
      averageDays: Math.round(
        timeToHires
          .filter(t => t.status === 'offered')
          .reduce((sum, t) => sum + t.days, 0) /
          Math.max(1, timeToHires.filter(t => t.status === 'offered').length)
      ),
    },
    {
      stage: "Onboarded",
      averageDays: Math.round(
        timeToHires
          .filter(t => t.status === 'onboarded')
          .reduce((sum, t) => sum + t.days, 0) /
          Math.max(1, timeToHires.filter(t => t.status === 'onboarded').length)
      ),
    },
  ];
  
  // By job type
  const jobTypeMap = new Map<string, number[]>();
  for (const t of timeToHires) {
    const job = jobs.find(j => j.id === t.jobId);
    if (!job) continue;
    const type = job.employmentType || 'full-time';
    if (!jobTypeMap.has(type)) {
      jobTypeMap.set(type, []);
    }
    jobTypeMap.get(type)!.push(t.days);
  }
  
  const byJobType = Array.from(jobTypeMap.entries()).map(([jobType, days]) => ({
    jobType,
    averageDays: Math.round(days.reduce((a, b) => a + b, 0) / days.length),
  }));
  
  // Trend analysis (compare first half vs second half)
  const midpoint = Math.floor(timeToHires.length / 2);
  const firstHalfAvg = timeToHires.slice(0, midpoint).reduce((sum, t) => sum + t.days, 0) / midpoint;
  const secondHalfAvg = timeToHires.slice(midpoint).reduce((sum, t) => sum + t.days, 0) / (timeToHires.length - midpoint);
  
  let trend: "improving" | "stable" | "declining";
  if (secondHalfAvg < firstHalfAvg * 0.9) trend = "improving";
  else if (secondHalfAvg > firstHalfAvg * 1.1) trend = "declining";
  else trend = "stable";
  
  // Simple prediction (linear extrapolation)
  const nextMonthAverage = trend === "improving" 
    ? Math.max(minDays, averageDays * 0.9)
    : trend === "declining"
    ? averageDays * 1.1
    : averageDays;
  
  const confidence = timeToHires.length >= 10 ? 75 : timeToHires.length >= 5 ? 50 : 25;
  
  return {
    overall: {
      averageDays: Math.round(averageDays),
      medianDays: Math.round(medianDays),
      minDays: Math.round(minDays),
      maxDays: Math.round(maxDays),
    },
    byStage,
    byJobType,
    trend,
    prediction: {
      nextMonthAverage: Math.round(nextMonthAverage),
      confidence,
    },
  };
}

// =============================================================================
// Pipeline Health Analysis
// =============================================================================

export async function getPipelineHealth(recruiterId: number): Promise<PipelineHealth> {
  const jobs = await db.getJobsByRecruiter(recruiterId);
  const jobIds = jobs.map(j => j.id);
  
  if (jobIds.length === 0) {
    return {
      totalCandidates: 0,
      byStage: [],
      bottlenecks: [],
      healthScore: 0,
      conversionRates: [],
    };
  }
  
  const allApplications = await db.getAllApplications();
  const applications = allApplications.filter(app => jobIds.includes(app.jobId));
  
  // Count by stage
  const stages = ["submitted", "reviewing", "shortlisted", "interviewing", "offered", "rejected", "withdrawn"];
  const stageCounts = new Map<string, { count: number; totalDays: number }>();
  
  for (const stage of stages) {
    stageCounts.set(stage, { count: 0, totalDays: 0 });
  }
  
  for (const app of applications) {
    const stage = app.status || "submitted";
    const data = stageCounts.get(stage);
    if (data) {
      data.count++;
      const daysInStage = (new Date().getTime() - new Date(app.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
      data.totalDays += daysInStage;
    }
  }
  
  const byStage = Array.from(stageCounts.entries()).map(([stage, data]) => ({
    stage,
    count: data.count,
    percentage: applications.length > 0 ? (data.count / applications.length) * 100 : 0,
    avgDaysInStage: data.count > 0 ? Math.round(data.totalDays / data.count) : 0,
  }));
  
  // Identify bottlenecks
  const bottlenecks: PipelineHealth["bottlenecks"] = [];
  
  for (const stageData of byStage) {
    if (stageData.avgDaysInStage > 14 && stageData.count > 0 && stageData.stage !== "rejected" && stageData.stage !== "withdrawn") {
      bottlenecks.push({
        stage: stageData.stage,
        issue: `Candidates spending too long in ${stageData.stage} stage`,
        severity: stageData.avgDaysInStage > 30 ? "high" : stageData.avgDaysInStage > 21 ? "medium" : "low",
        recommendation: `Review and expedite candidates in ${stageData.stage} stage to improve flow`,
      });
    }
  }
  
  // Calculate health score
  const activeStages = byStage.filter(s => !["rejected", "withdrawn"].includes(s.stage));
  const avgDaysAcrossStages = activeStages.reduce((sum, s) => sum + s.avgDaysInStage, 0) / Math.max(1, activeStages.length);
  const healthScore = Math.max(0, Math.min(100, 100 - avgDaysAcrossStages * 2)); // Lower days = higher score
  
  // Conversion rates between stages
  const conversionRates: PipelineHealth["conversionRates"] = [
    {
      fromStage: "submitted",
      toStage: "reviewing",
      rate: calculateConversionRate(applications, "submitted", "reviewing"),
    },
    {
      fromStage: "reviewing",
      toStage: "shortlisted",
      rate: calculateConversionRate(applications, "reviewing", "shortlisted"),
    },
    {
      fromStage: "shortlisted",
      toStage: "interviewing",
      rate: calculateConversionRate(applications, "shortlisted", "interviewing"),
    },
    {
      fromStage: "interviewing",
      toStage: "offered",
      rate: calculateConversionRate(applications, "interviewing", "offered"),
    },
  ];
  
  return {
    totalCandidates: applications.length,
    byStage,
    bottlenecks,
    healthScore: Math.round(healthScore),
    conversionRates,
  };
}

function calculateConversionRate(applications: any[], fromStage: string, toStage: string): number {
  const fromCount = applications.filter(app => app.status === fromStage).length;
  const toCount = applications.filter(app => app.status === toStage).length;
  return fromCount > 0 ? Math.round((toCount / fromCount) * 100) : 0;
}

// =============================================================================
// Success Rate Prediction
// =============================================================================

export async function predictSuccessRate(
  recruiterId: number,
  historicalMonths: number = 6
): Promise<SuccessRatePrediction> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - historicalMonths);
  
  const jobs = await db.getJobsByRecruiter(recruiterId);
  const jobIds = jobs.map(j => j.id);
  
  if (jobIds.length === 0) {
    return {
      overallSuccessRate: 0,
      predictedHiresNextMonth: 0,
      confidence: 0,
      factors: [],
      recommendations: ["Insufficient historical data for predictions"],
    };
  }
  
  const allApplications = await db.getAllApplications();
  const applications = allApplications.filter(app =>
    jobIds.includes(app.jobId) &&
    new Date(app.submittedAt) >= startDate &&
    new Date(app.submittedAt) <= endDate
  );
  
  const hires = applications.filter(app => app.status === 'offered' || app.status === 'onboarded');
  const overallSuccessRate = applications.length > 0
    ? (hires.length / applications.length) * 100
    : 0;
  
  // Calculate monthly average
  const monthlyHires = hires.length / historicalMonths;
  const predictedHiresNextMonth = Math.round(monthlyHires);
  
  // Analyze factors
  const factors: SuccessRatePrediction["factors"] = [];
  
  // Factor 1: AI matching usage
  const aiScoredApps = applications.filter(app => app.aiScore && app.aiScore > 0);
  if (aiScoredApps.length > applications.length * 0.5) {
    factors.push({
      factor: "AI Matching Usage",
      impact: "positive",
      weight: 80,
    });
  }
  
  // Factor 2: Response time
  const avgResponseDays = applications.reduce((sum, app) => {
    const days = (new Date(app.updatedAt).getTime() - new Date(app.submittedAt).getTime()) / (1000 * 60 * 60 * 24);
    return sum + days;
  }, 0) / Math.max(1, applications.length);
  
  factors.push({
    factor: "Response Time",
    impact: avgResponseDays < 7 ? "positive" : avgResponseDays > 14 ? "negative" : "neutral",
    weight: avgResponseDays < 7 ? 70 : avgResponseDays > 14 ? 30 : 50,
  });
  
  // Factor 3: Job posting quality
  const jobsWithDetails = jobs.filter(j => j.description && j.requirements);
  factors.push({
    factor: "Job Posting Quality",
    impact: jobsWithDetails.length > jobs.length * 0.7 ? "positive" : "neutral",
    weight: jobsWithDetails.length > jobs.length * 0.7 ? 60 : 40,
  });
  
  // Recommendations
  const recommendations: string[] = [];
  
  if (overallSuccessRate < 10) {
    recommendations.push("Consider refining job requirements to attract more qualified candidates");
    recommendations.push("Use AI matching to identify top prospects more effectively");
  }
  
  if (avgResponseDays > 14) {
    recommendations.push("Reduce response time to improve candidate engagement and conversion");
  }
  
  if (aiScoredApps.length < applications.length * 0.3) {
    recommendations.push("Increase usage of AI screening to identify best-fit candidates faster");
  }
  
  const confidence = applications.length >= 50 ? 85 : applications.length >= 20 ? 65 : 40;
  
  return {
    overallSuccessRate: Math.round(overallSuccessRate * 10) / 10,
    predictedHiresNextMonth,
    confidence,
    factors,
    recommendations,
  };
}
