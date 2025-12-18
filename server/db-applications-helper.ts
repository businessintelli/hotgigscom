import { getDb } from "./db";
import { applications, candidates, jobs, users, interviews } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Get candidate applications with job details and interview information
 * Optimized to reduce N+1 queries by using joins
 */
export async function getCandidateApplicationsWithDetails(candidateId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      // Application fields
      id: applications.id,
      candidateId: applications.candidateId,
      jobId: applications.jobId,
      status: applications.status,
      coverLetter: applications.coverLetter,
      resumeUrl: applications.resumeUrl,
      appliedAt: applications.appliedAt,
      updatedAt: applications.updatedAt,
      // Job fields
      job: {
        id: jobs.id,
        title: jobs.title,
        companyName: jobs.companyName,
        location: jobs.location,
        employmentType: jobs.employmentType,
        salaryMin: jobs.salaryMin,
        salaryMax: jobs.salaryMax,
        salaryCurrency: jobs.salaryCurrency,
      },
    })
    .from(applications)
    .leftJoin(jobs, eq(applications.jobId, jobs.id))
    .where(eq(applications.candidateId, candidateId))
    .orderBy(desc(applications.appliedAt));

  // Get interview counts for each application in a single query
  const applicationIds = result.map(app => app.id);
  const interviewCounts = applicationIds.length > 0 
    ? await db
        .select({
          applicationId: interviews.applicationId,
        })
        .from(interviews)
        .where(eq(interviews.candidateId, candidateId))
    : [];

  // Create a map of application ID to interview count
  const interviewCountMap = interviewCounts.reduce((acc, interview) => {
    acc[interview.applicationId] = (acc[interview.applicationId] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  // Attach interview counts to applications
  return result.map(app => ({
    ...app,
    interviewCount: interviewCountMap[app.id] || 0,
  }));
}
