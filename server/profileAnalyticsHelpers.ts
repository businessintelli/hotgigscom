import { getDb } from "./db";
import { candidates, applications, profileCompletionAnalytics } from "../drizzle/schema";
import { eq, gte, and, sql } from "drizzle-orm";
import { calculateCandidateCompletion } from "./profileCompletionHelpers";

/**
 * Get current profile completion statistics
 */
export async function getProfileCompletionStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all candidates
  const allCandidates = await db.select().from(candidates);

  let completedProfiles = 0;
  let partialProfiles = 0;
  let incompleteProfiles = 0;
  let totalCompletion = 0;

  for (const candidate of allCandidates) {
    const percentage = calculateCandidateCompletion(candidate);
    totalCompletion += percentage;

    if (percentage >= 100) {
      completedProfiles++;
    } else if (percentage >= 50) {
      partialProfiles++;
    } else {
      incompleteProfiles++;
    }
  }

  const averageCompletion = allCandidates.length > 0 
    ? Math.round(totalCompletion / allCandidates.length) 
    : 0;

  return {
    totalCandidates: allCandidates.length,
    completedProfiles,
    partialProfiles,
    incompleteProfiles,
    averageCompletion,
  };
}

/**
 * Get profile completion correlation with placement success
 * Returns data showing how profile completion affects application success rates
 */
export async function getProfileCompletionCorrelation() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all candidates with their applications
  const candidatesWithApps = await db
    .select({
      candidateId: candidates.id,
      candidate: candidates,
      applicationId: applications.id,
      applicationStatus: applications.status,
    })
    .from(candidates)
    .leftJoin(applications, eq(candidates.id, applications.candidateId));

  // Group by completion ranges
  const ranges = [
    { min: 0, max: 25, label: "0-25%" },
    { min: 25, max: 50, label: "25-50%" },
    { min: 50, max: 75, label: "50-75%" },
    { min: 75, max: 100, label: "75-100%" },
  ];

  const correlationData = ranges.map(range => {
    const candidatesInRange = new Set<number>();
    let totalApplications = 0;
    let successfulApplications = 0;

    for (const record of candidatesWithApps) {
      if (!record.candidate) continue;
      
      const completion = calculateCandidateCompletion(record.candidate);
      
      if (completion >= range.min && completion < range.max) {
        candidatesInRange.add(record.candidateId);
        
        if (record.applicationId) {
          totalApplications++;
          if (record.applicationStatus === 'hired' || record.applicationStatus === 'offer') {
            successfulApplications++;
          }
        }
      }
    }

    const successRate = totalApplications > 0 
      ? Math.round((successfulApplications / totalApplications) * 100) 
      : 0;

    return {
      range: range.label,
      candidates: candidatesInRange.size,
      applications: totalApplications,
      successfulPlacements: successfulApplications,
      successRate,
    };
  });

  return correlationData;
}

/**
 * Save daily analytics snapshot
 * Should be run as a daily scheduled job
 */
export async function saveDailyAnalyticsSnapshot(): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const stats = await getProfileCompletionStats();
  const today = new Date().toISOString().split('T')[0];

  // Insert or update today's snapshot
  await db
    .insert(profileCompletionAnalytics)
    .values({
      date: today as any,
      totalCandidates: stats.totalCandidates,
      completedProfiles: stats.completedProfiles,
      partialProfiles: stats.partialProfiles,
      incompleteProfiles: stats.incompleteProfiles,
      averageCompletion: stats.averageCompletion,
    })
    .onDuplicateKeyUpdate({
      set: {
        totalCandidates: stats.totalCandidates,
        completedProfiles: stats.completedProfiles,
        partialProfiles: stats.partialProfiles,
        incompleteProfiles: stats.incompleteProfiles,
        averageCompletion: stats.averageCompletion,
      },
    });
}

/**
 * Get historical analytics data for charts
 */
export async function getHistoricalAnalytics(days: number = 30) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const history = await db
    .select()
    .from(profileCompletionAnalytics)
    .where(gte(profileCompletionAnalytics.date, startDate.toISOString().split('T')[0] as any))
    .orderBy(profileCompletionAnalytics.date);

  return history;
}
