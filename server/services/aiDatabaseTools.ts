import { db } from "../_core/db";
import { candidates, recruiters, jobs, applications, interviews } from "../../drizzle/schema";
import { eq, and, gte, lte, desc, sql, like, or } from "drizzle-orm";
import * as dbHelpers from "../db";

/**
 * AI Database Query Tools
 * 
 * Provides safe, role-specific database query functions that AI assistants
 * can use to answer user questions with real data.
 */

export interface DatabaseQueryTool {
  name: string;
  description: string;
  parameters: any;
  handler: (params: any, userId: number, userRole: string) => Promise<any>;
}

/**
 * Candidate-specific query tools
 */
export const candidateTools: DatabaseQueryTool[] = [
  {
    name: "get_my_applications",
    description: "Get the current user's job applications with status and details",
    parameters: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["all", "pending", "reviewing", "interviewing", "offered", "rejected"],
          description: "Filter by application status"
        },
        limit: {
          type: "number",
          description: "Maximum number of applications to return (default 20)"
        }
      }
    },
    handler: async (params, userId, userRole) => {
      // Get candidate ID from user ID
      const candidate = await db
        .select()
        .from(candidates)
        .where(eq(candidates.userId, userId))
        .limit(1);

      if (candidate.length === 0) {
        return { error: "Candidate profile not found" };
      }

      const candidateId = candidate[0].id;
      const limit = params.limit || 20;

      // Get applications
      let query = db
        .select()
        .from(applications)
        .where(eq(applications.candidateId, candidateId))
        .orderBy(desc(applications.createdAt))
        .limit(limit);

      if (params.status && params.status !== "all") {
        query = db
          .select()
          .from(applications)
          .where(
            and(
              eq(applications.candidateId, candidateId),
              eq(applications.status, params.status)
            )
          )
          .orderBy(desc(applications.createdAt))
          .limit(limit);
      }

      const apps = await query;

      // Enrich with job details
      const enrichedApps = await Promise.all(
        apps.map(async (app) => {
          const job = await db
            .select()
            .from(jobs)
            .where(eq(jobs.id, app.jobId))
            .limit(1);

          return {
            ...app,
            jobTitle: job[0]?.title || "Unknown",
            companyName: job[0]?.companyName || "Unknown"
          };
        })
      );

      return {
        total: enrichedApps.length,
        applications: enrichedApps
      };
    }
  },
  {
    name: "get_my_interviews",
    description: "Get the current user's scheduled interviews",
    parameters: {
      type: "object",
      properties: {
        upcoming: {
          type: "boolean",
          description: "If true, only return future interviews"
        }
      }
    },
    handler: async (params, userId, userRole) => {
      const candidate = await db
        .select()
        .from(candidates)
        .where(eq(candidates.userId, userId))
        .limit(1);

      if (candidate.length === 0) {
        return { error: "Candidate profile not found" };
      }

      const candidateId = candidate[0].id;
      const now = new Date();

      let query = db
        .select()
        .from(interviews)
        .where(eq(interviews.candidateId, candidateId))
        .orderBy(desc(interviews.scheduledAt));

      if (params.upcoming) {
        query = db
          .select()
          .from(interviews)
          .where(
            and(
              eq(interviews.candidateId, candidateId),
              gte(interviews.scheduledAt, now)
            )
          )
          .orderBy(interviews.scheduledAt);
      }

      const interviewList = await query;

      // Enrich with job details
      const enrichedInterviews = await Promise.all(
        interviewList.map(async (interview) => {
          const job = await db
            .select()
            .from(jobs)
            .where(eq(jobs.id, interview.jobId))
            .limit(1);

          return {
            ...interview,
            jobTitle: job[0]?.title || "Unknown",
            companyName: job[0]?.companyName || "Unknown"
          };
        })
      );

      return {
        total: enrichedInterviews.length,
        interviews: enrichedInterviews
      };
    }
  },
  {
    name: "get_application_statistics",
    description: "Get statistics about the current user's applications",
    parameters: {
      type: "object",
      properties: {}
    },
    handler: async (params, userId, userRole) => {
      const candidate = await db
        .select()
        .from(candidates)
        .where(eq(candidates.userId, userId))
        .limit(1);

      if (candidate.length === 0) {
        return { error: "Candidate profile not found" };
      }

      const candidateId = candidate[0].id;

      const apps = await db
        .select()
        .from(applications)
        .where(eq(applications.candidateId, candidateId));

      const stats = {
        total: apps.length,
        pending: apps.filter(a => a.status === "pending").length,
        reviewing: apps.filter(a => a.status === "reviewing").length,
        interviewing: apps.filter(a => a.status === "interviewing").length,
        offered: apps.filter(a => a.status === "offered").length,
        rejected: apps.filter(a => a.status === "rejected").length,
        averageMatchScore: apps.length > 0 
          ? apps.reduce((sum, a) => sum + (a.matchScore || 0), 0) / apps.length 
          : 0,
        recentApplications: apps.filter(a => {
          const appDate = new Date(a.createdAt);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return appDate >= weekAgo;
        }).length
      };

      return stats;
    }
  },
  {
    name: "search_jobs",
    description: "Search for available jobs matching criteria",
    parameters: {
      type: "object",
      properties: {
        keyword: {
          type: "string",
          description: "Search keyword for job title or description"
        },
        location: {
          type: "string",
          description: "Job location"
        },
        limit: {
          type: "number",
          description: "Maximum number of jobs to return (default 10)"
        }
      }
    },
    handler: async (params, userId, userRole) => {
      const limit = params.limit || 10;

      let query = db
        .select()
        .from(jobs)
        .where(eq(jobs.status, "active"))
        .orderBy(desc(jobs.createdAt))
        .limit(limit);

      if (params.keyword) {
        query = db
          .select()
          .from(jobs)
          .where(
            and(
              eq(jobs.status, "active"),
              or(
                like(jobs.title, `%${params.keyword}%`),
                like(jobs.description, `%${params.keyword}%`)
              )
            )
          )
          .orderBy(desc(jobs.createdAt))
          .limit(limit);
      }

      if (params.location) {
        query = db
          .select()
          .from(jobs)
          .where(
            and(
              eq(jobs.status, "active"),
              like(jobs.location, `%${params.location}%`)
            )
          )
          .orderBy(desc(jobs.createdAt))
          .limit(limit);
      }

      const jobList = await query;

      return {
        total: jobList.length,
        jobs: jobList.map(j => ({
          id: j.id,
          title: j.title,
          companyName: j.companyName,
          location: j.location,
          salaryRange: j.salaryRange,
          employmentType: j.employmentType,
          postedDate: j.createdAt
        }))
      };
    }
  }
];

/**
 * Recruiter-specific query tools
 */
export const recruiterTools: DatabaseQueryTool[] = [
  {
    name: "get_my_jobs",
    description: "Get the current recruiter's job postings",
    parameters: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["all", "active", "closed", "draft"],
          description: "Filter by job status"
        },
        limit: {
          type: "number",
          description: "Maximum number of jobs to return (default 20)"
        }
      }
    },
    handler: async (params, userId, userRole) => {
      const recruiter = await db
        .select()
        .from(recruiters)
        .where(eq(recruiters.userId, userId))
        .limit(1);

      if (recruiter.length === 0) {
        return { error: "Recruiter profile not found" };
      }

      const recruiterId = recruiter[0].id;
      const limit = params.limit || 20;

      let query = db
        .select()
        .from(jobs)
        .where(eq(jobs.recruiterId, recruiterId))
        .orderBy(desc(jobs.createdAt))
        .limit(limit);

      if (params.status && params.status !== "all") {
        query = db
          .select()
          .from(jobs)
          .where(
            and(
              eq(jobs.recruiterId, recruiterId),
              eq(jobs.status, params.status)
            )
          )
          .orderBy(desc(jobs.createdAt))
          .limit(limit);
      }

      const jobList = await query;

      // Enrich with application counts
      const enrichedJobs = await Promise.all(
        jobList.map(async (job) => {
          const appCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(applications)
            .where(eq(applications.jobId, job.id));

          return {
            ...job,
            applicationCount: appCount[0]?.count || 0
          };
        })
      );

      return {
        total: enrichedJobs.length,
        jobs: enrichedJobs
      };
    }
  },
  {
    name: "get_job_applications",
    description: "Get applications for a specific job",
    parameters: {
      type: "object",
      properties: {
        jobId: {
          type: "number",
          description: "The job ID to get applications for"
        },
        status: {
          type: "string",
          enum: ["all", "pending", "reviewing", "interviewing", "offered", "rejected"],
          description: "Filter by application status"
        },
        minMatchScore: {
          type: "number",
          description: "Minimum match score (0-100)"
        }
      },
      required: ["jobId"]
    },
    handler: async (params, userId, userRole) => {
      // Verify recruiter owns this job
      const recruiter = await db
        .select()
        .from(recruiters)
        .where(eq(recruiters.userId, userId))
        .limit(1);

      if (recruiter.length === 0) {
        return { error: "Recruiter profile not found" };
      }

      const job = await db
        .select()
        .from(jobs)
        .where(
          and(
            eq(jobs.id, params.jobId),
            eq(jobs.recruiterId, recruiter[0].id)
          )
        )
        .limit(1);

      if (job.length === 0) {
        return { error: "Job not found or access denied" };
      }

      let query = db
        .select()
        .from(applications)
        .where(eq(applications.jobId, params.jobId))
        .orderBy(desc(applications.matchScore));

      if (params.status && params.status !== "all") {
        query = db
          .select()
          .from(applications)
          .where(
            and(
              eq(applications.jobId, params.jobId),
              eq(applications.status, params.status)
            )
          )
          .orderBy(desc(applications.matchScore));
      }

      let apps = await query;

      if (params.minMatchScore) {
        apps = apps.filter(a => (a.matchScore || 0) >= params.minMatchScore);
      }

      // Enrich with candidate details
      const enrichedApps = await Promise.all(
        apps.map(async (app) => {
          const candidate = await db
            .select()
            .from(candidates)
            .where(eq(candidates.id, app.candidateId))
            .limit(1);

          return {
            ...app,
            candidateName: candidate[0]?.name || "Unknown",
            candidateEmail: candidate[0]?.email || "Unknown"
          };
        })
      );

      return {
        total: enrichedApps.length,
        applications: enrichedApps
      };
    }
  },
  {
    name: "get_pipeline_statistics",
    description: "Get hiring pipeline statistics for the recruiter",
    parameters: {
      type: "object",
      properties: {
        jobId: {
          type: "number",
          description: "Optional: Get stats for a specific job"
        }
      }
    },
    handler: async (params, userId, userRole) => {
      const recruiter = await db
        .select()
        .from(recruiters)
        .where(eq(recruiters.userId, userId))
        .limit(1);

      if (recruiter.length === 0) {
        return { error: "Recruiter profile not found" };
      }

      const recruiterId = recruiter[0].id;

      let jobsQuery = db
        .select()
        .from(jobs)
        .where(eq(jobs.recruiterId, recruiterId));

      if (params.jobId) {
        jobsQuery = db
          .select()
          .from(jobs)
          .where(
            and(
              eq(jobs.recruiterId, recruiterId),
              eq(jobs.id, params.jobId)
            )
          );
      }

      const jobList = await jobsQuery;
      const jobIds = jobList.map(j => j.id);

      if (jobIds.length === 0) {
        return { totalJobs: 0, totalApplications: 0, byStatus: {} };
      }

      // Get all applications for these jobs
      const apps = await db
        .select()
        .from(applications)
        .where(sql`${applications.jobId} IN (${sql.join(jobIds.map(id => sql`${id}`), sql`, `)})`);

      const stats = {
        totalJobs: jobList.length,
        activeJobs: jobList.filter(j => j.status === "active").length,
        totalApplications: apps.length,
        byStatus: {
          pending: apps.filter(a => a.status === "pending").length,
          reviewing: apps.filter(a => a.status === "reviewing").length,
          interviewing: apps.filter(a => a.status === "interviewing").length,
          offered: apps.filter(a => a.status === "offered").length,
          rejected: apps.filter(a => a.status === "rejected").length
        },
        averageMatchScore: apps.length > 0 
          ? apps.reduce((sum, a) => sum + (a.matchScore || 0), 0) / apps.length 
          : 0,
        highQualityApplications: apps.filter(a => (a.matchScore || 0) >= 75).length
      };

      return stats;
    }
  },
  {
    name: "search_candidates",
    description: "Search for candidates matching criteria",
    parameters: {
      type: "object",
      properties: {
        skills: {
          type: "string",
          description: "Comma-separated list of required skills"
        },
        location: {
          type: "string",
          description: "Candidate location"
        },
        experienceYears: {
          type: "number",
          description: "Minimum years of experience"
        },
        limit: {
          type: "number",
          description: "Maximum number of candidates to return (default 10)"
        }
      }
    },
    handler: async (params, userId, userRole) => {
      const limit = params.limit || 10;

      let query = db
        .select()
        .from(candidates)
        .limit(limit);

      if (params.location) {
        query = db
          .select()
          .from(candidates)
          .where(like(candidates.location, `%${params.location}%`))
          .limit(limit);
      }

      let candidateList = await query;

      // Filter by skills if provided
      if (params.skills) {
        const requiredSkills = params.skills.toLowerCase().split(",").map(s => s.trim());
        candidateList = candidateList.filter(c => {
          const candidateSkills = c.skills ? JSON.parse(c.skills).map((s: string) => s.toLowerCase()) : [];
          return requiredSkills.some(skill => candidateSkills.includes(skill));
        });
      }

      // Filter by experience if provided
      if (params.experienceYears) {
        candidateList = candidateList.filter(c => 
          (c.experienceYears || 0) >= params.experienceYears
        );
      }

      return {
        total: candidateList.length,
        candidates: candidateList.map(c => ({
          id: c.id,
          name: c.name,
          email: c.email,
          location: c.location,
          experienceYears: c.experienceYears,
          skills: c.skills ? JSON.parse(c.skills) : [],
          resumeUrl: c.resumeUrl
        }))
      };
    }
  }
];

/**
 * Execute a database query tool safely
 */
export async function executeQueryTool(
  toolName: string,
  parameters: any,
  userId: number,
  userRole: string
): Promise<any> {
  try {
    // Get appropriate tools for user role
    const tools = userRole === "candidate" ? candidateTools : recruiterTools;
    
    // Find the tool
    const tool = tools.find(t => t.name === toolName);
    
    if (!tool) {
      return {
        error: `Tool '${toolName}' not found for role '${userRole}'`
      };
    }

    // Execute the tool handler
    const result = await tool.handler(parameters, userId, userRole);
    
    return result;
  } catch (error) {
    console.error(`Error executing query tool ${toolName}:`, error);
    return {
      error: `Failed to execute query: ${error instanceof Error ? error.message : "Unknown error"}`
    };
  }
}

/**
 * Get available tools for a user role
 */
export function getAvailableTools(userRole: string): DatabaseQueryTool[] {
  return userRole === "candidate" ? candidateTools : recruiterTools;
}

/**
 * Format tools for LLM function calling
 */
export function formatToolsForLLM(userRole: string) {
  const tools = getAvailableTools(userRole);
  
  return tools.map(tool => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }
  }));
}
