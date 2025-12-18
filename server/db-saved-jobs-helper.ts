import { getDb } from "./db";
import { savedJobs, jobs } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

/**
 * Get saved jobs with full job details
 * Optimized to use a single join query instead of N+1 queries
 */
export async function getSavedJobs(candidateId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      // Saved job fields
      savedJob: {
        id: savedJobs.id,
        candidateId: savedJobs.candidateId,
        jobId: savedJobs.jobId,
        savedAt: savedJobs.savedAt,
      },
      // Job fields
      job: {
        id: jobs.id,
        title: jobs.title,
        companyName: jobs.companyName,
        description: jobs.description,
        location: jobs.location,
        employmentType: jobs.employmentType,
        salaryMin: jobs.salaryMin,
        salaryMax: jobs.salaryMax,
        salaryCurrency: jobs.salaryCurrency,
        status: jobs.status,
        postedBy: jobs.postedBy,
        createdAt: jobs.createdAt,
      },
    })
    .from(savedJobs)
    .leftJoin(jobs, eq(savedJobs.jobId, jobs.id))
    .where(eq(savedJobs.candidateId, candidateId))
    .orderBy(desc(savedJobs.savedAt));

  return result;
}
