import mysql2 from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  companies, InsertCompany,
  InsertUser, users, 
  recruiters, InsertRecruiter,
  candidates, InsertCandidate,
  resumeProfiles, InsertResumeProfile,
  videoIntroductions, InsertVideoIntroduction,
  customers, InsertCustomer,
  customerContacts, InsertCustomerContact,
  jobs, InsertJob,
  jobDrafts, InsertJobDraft,
  jobTemplates, InsertJobTemplate,
  templateShares, InsertTemplateShare,
  jobViewAnalytics, InsertJobViewAnalytic,
  jobViewSessions, InsertJobViewSession,
  jobApplicationSources, InsertJobApplicationSource,
  jobViews, InsertJobView,
  applications, InsertApplication,
  interviews, InsertInterview,
  interviewQuestions, InsertInterviewQuestion,
  interviewResponses, InsertInterviewResponse,
  savedSearches, InsertSavedSearch,
  savedJobs, InsertSavedJob,
  recentlyViewedJobs, InsertRecentlyViewedJob,
  fraudDetectionEvents, InsertFraudDetectionEvent,
  associates, InsertAssociate,
  onboardingProcesses, InsertOnboardingProcess,
  onboardingTasks, InsertOnboardingTask,
  taskAssignments, InsertTaskAssignment,
  taskReminders, InsertTaskReminder,
  taskTemplates, InsertTaskTemplate,
  applicationFeedback, InsertApplicationFeedback,
  rescheduleRequests, InsertRescheduleRequest,
  jobSkillRequirements, InsertJobSkillRequirement,
  candidateSkillRatings, InsertCandidateSkillRating,
  interviewPanelists, panelistFeedback, notifications,
  candidateProfileShares, InsertCandidateProfileShare,
  environmentVariables, InsertEnvironmentVariable,
  applicationLogs, InsertApplicationLog,
  systemSettings,
  linkedinCreditUsage, InsertLinkedinCreditUsage,
  inmailTemplates, InsertInmailTemplate,
  companySettings, InsertCompanySettings,
  userActivityLogs, InsertUserActivityLog,
  systemHealthMetrics, InsertSystemHealthMetric,
  customReports, InsertCustomReport,
  reportSchedules, InsertReportSchedule,
  reportExecutions, InsertReportExecution,
  guestApplications, InsertGuestApplication,
  bulkUploadJobs, InsertBulkUploadJob
} from "../drizzle/schema";
import { getPaginationLimitOffset, buildPaginatedResponse, type PaginatedResponse, type PaginationParams } from './paginationHelpers';

// Re-export schema tables for use in routers
export { templateShares, jobTemplates };

let _db: ReturnType<typeof drizzle> | null = null;
let _initializationPromise: Promise<ReturnType<typeof drizzle> | null> | null = null;

export async function getDb() {
  // If database is already initialized, return it immediately
  if (_db) {
    return _db;
  }
  
  // If database is currently being initialized, wait for that promise to complete
  if (_initializationPromise) {
    console.log("[Database] Waiting for ongoing initialization to complete...");
    return _initializationPromise;
  }
  
  // Check if DATABASE_URL is available
  if (!process.env.DATABASE_URL) {
    console.error("[Database] DATABASE_URL environment variable is not set");
    return null;
  }
  
  // Start database initialization
  _initializationPromise = (async () => {
    try {
      console.log("[Database] Initializing connection...");
      
      // Create connection pool for better connection management
      const pool = mysql2.createPool({
        uri: process.env.DATABASE_URL!,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0
      });
      
      // Test the connection
      const connection = await pool.getConnection();
      await connection.execute("SELECT 1");
      connection.release();
      console.log("[Database] Connection pool test successful");
      
      // Create drizzle instance with pool
      _db = drizzle(pool);
      console.log("[Database] Drizzle ORM initialized successfully");
      
      return _db;
    } catch (error) {
      console.error("[Database] Failed to initialize:", error);
      _db = null;
      return null;
    } finally {
      // Clear the initialization promise so future calls can retry if needed
      _initializationPromise = null;
    }
  })();
  
  return _initializationPromise;
}

// User operations
export async function upsertUser(user: InsertUser): Promise<void> {
  // For email/password users, openId can be null
  // For OAuth users, openId is required
  if (!user.openId && !user.email) {
    throw new Error("Either openId or email is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "passwordHash", "verificationToken", "passwordResetToken"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      if (user[field] !== undefined) {
        values[field] = user[field];
        updateSet[field] = user[field];
      }
    };

    textFields.forEach(assignNullable);

    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    }
    if (user.companyId !== undefined) {
      values.companyId = user.companyId;
      updateSet.companyId = user.companyId;
    }
    if (user.emailVerified !== undefined) {
      values.emailVerified = user.emailVerified;
      updateSet.emailVerified = user.emailVerified;
    }
    if (user.verificationTokenExpiry !== undefined) {
      values.verificationTokenExpiry = user.verificationTokenExpiry;
      updateSet.verificationTokenExpiry = user.verificationTokenExpiry;
    }
    if (user.passwordResetTokenExpiry !== undefined) {
      values.passwordResetTokenExpiry = user.passwordResetTokenExpiry;
      updateSet.passwordResetTokenExpiry = user.passwordResetTokenExpiry;
    }
    if (user.sessionExpiry !== undefined) {
      values.sessionExpiry = user.sessionExpiry;
      updateSet.sessionExpiry = user.sessionExpiry;
    }
    if (user.rememberMe !== undefined) {
      values.rememberMe = user.rememberMe;
      updateSet.rememberMe = user.rememberMe;
    }

    // For email/password users, use email as the unique key
    if (user.email && !user.openId) {
      await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
    } else {
      // For OAuth users, use openId as the unique key
      await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
    }
  } catch (error) {
    console.error("[Database] Error upserting user:", error);
    throw error;
  }
}

export async function createUser(user: Omit<InsertUser, 'openId'> & { openId?: string | null }) {
  const db = await getDb();
  if (!db) return null;
  
  // Generate a unique openId if not provided
  const openId = user.openId || `local-${user.email}-${Date.now()}`;
  
  const result = await db.insert(users).values({
    ...user,
    openId,
  });
  
  return result;
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0] || null;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0] || null;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] || null;
}

export async function updateUserByEmail(email: string, updates: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(updates).where(eq(users.email, email));
}

export async function updateUserById(id: number, updates: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(updates).where(eq(users.id, id));
}

export async function updateUserRole(id: number, role: 'admin' | 'company_admin' | 'recruiter' | 'candidate') {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, id));
}

// Company operations
export async function createCompany(company: InsertCompany) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(companies).values(company);
  return result;
}

export async function getCompanyByDomain(domain: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(companies).where(eq(companies.domain, domain)).limit(1);
  return result[0] || null;
}

export async function getCompanyById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
  return result[0] || null;
}

export async function getAllCompanies() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(companies);
}

// Recruiter operations
export async function createRecruiter(recruiter: InsertRecruiter) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(recruiters).values(recruiter);
  return result;
}

export async function getRecruiterByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(recruiters).where(eq(recruiters.userId, userId)).limit(1);
  return result[0] || null;
}

export async function updateRecruiter(userId: number, updates: Partial<InsertRecruiter>) {
  const db = await getDb();
  if (!db) return;
  await db.update(recruiters).set(updates).where(eq(recruiters.userId, userId));
}

// Candidate operations
export async function createCandidate(candidate: InsertCandidate) {
  const db = await getDb();
  if (!db) return null;
  
  // Sanitize null and empty string values to undefined for optional fields
  const sanitizedCandidate = {
    ...candidate,
    phoneNumber: candidate.phoneNumber && candidate.phoneNumber.trim() !== '' ? candidate.phoneNumber : undefined,
    location: candidate.location && candidate.location.trim() !== '' ? candidate.location : undefined,
  };
  
  const result = await db.insert(candidates).values(sanitizedCandidate);
  return result;
}

export async function getCandidateByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(candidates).where(eq(candidates.userId, userId)).limit(1);
  return result[0] || null;
}

export async function getCandidateById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(candidates).where(eq(candidates.id, id)).limit(1);
  return result[0] || null;
}

export async function updateCandidate(userId: number, updates: Partial<InsertCandidate>) {
  const db = await getDb();
  if (!db) return;
  await db.update(candidates).set(updates).where(eq(candidates.userId, userId));
}

export async function getAllCandidates() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(candidates);
}

// Resume Profile operations
export async function createResumeProfile(profile: InsertResumeProfile) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(resumeProfiles).values(profile);
  return result;
}

export async function getResumeProfileById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(resumeProfiles).where(eq(resumeProfiles.id, id)).limit(1);
  return result[0] || null;
}

export async function getResumeProfilesByCandidateId(candidateId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(resumeProfiles).where(eq(resumeProfiles.candidateId, candidateId));
}

export async function countResumeProfiles(candidateId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const profiles = await db.select().from(resumeProfiles).where(eq(resumeProfiles.candidateId, candidateId));
  return profiles.length;
}

export async function updateResumeProfile(id: number, updates: Partial<InsertResumeProfile>) {
  const db = await getDb();
  if (!db) return;
  await db.update(resumeProfiles).set(updates).where(eq(resumeProfiles.id, id));
}

export async function deleteResumeProfile(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(resumeProfiles).where(eq(resumeProfiles.id, id));
}

// Video Introduction operations
export async function createVideoIntroduction(video: InsertVideoIntroduction) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(videoIntroductions).values(video);
  return result;
}

export async function getVideoIntroductionById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(videoIntroductions).where(eq(videoIntroductions.id, id)).limit(1);
  return result[0] || null;
}

export async function getVideoIntroductionByCandidateId(candidateId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(videoIntroductions).where(eq(videoIntroductions.candidateId, candidateId)).limit(1);
  return result[0] || null;
}

export async function deleteVideoIntroduction(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(videoIntroductions).where(eq(videoIntroductions.id, id));
}

// Customer operations
export async function createCustomer(customer: InsertCustomer) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(customers).values(customer);
  return result;
}

export async function getCustomerById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return result[0] || null;
}

export async function getAllCustomers(recruiterId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(customers).where(eq(customers.createdBy, recruiterId));
}

export async function updateCustomer(id: number, updates: Partial<InsertCustomer>) {
  const db = await getDb();
  if (!db) return;
  await db.update(customers).set(updates).where(eq(customers.id, id));
}

export async function deleteCustomer(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(customers).where(eq(customers.id, id));
}

// Customer Contact operations
export async function createCustomerContact(contact: InsertCustomerContact) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(customerContacts).values(contact);
  return result;
}

export async function getCustomerContactsByCustomerId(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(customerContacts).where(eq(customerContacts.customerId, customerId));
}

// Job operations
export async function createJob(job: InsertJob) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(jobs).values(job);
  return result;
}

export async function getJobById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  return result[0] || null;
}

export async function getAllJobs() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(jobs);
}

export async function getJobsByRecruiterId(recruiterId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(jobs).where(eq(jobs.postedBy, recruiterId));
}

export async function updateJob(id: number, updates: Partial<InsertJob>) {
  const db = await getDb();
  if (!db) return;
  await db.update(jobs).set(updates).where(eq(jobs.id, id));
}

export async function deleteJob(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(jobs).where(eq(jobs.id, id));
}

// Application operations
export async function createApplication(application: InsertApplication) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(applications).values(application);
  return result;
}

export async function getApplicationById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
  return result[0] || null;
}

export async function getApplicationsByJobId(jobId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(applications).where(eq(applications.jobId, jobId));
}

export async function getApplicationsByCandidateId(candidateId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(applications).where(eq(applications.candidateId, candidateId));
}

// Alias for compatibility
export async function getApplicationsByCandidate(candidateId: number) {
  return getApplicationsByCandidateId(candidateId);
}

/**
 * Get applications by candidate with pagination and full job details
 */
export async function getApplicationsByCandidatePaginated(
  candidateId: number,
  params: PaginationParams
): Promise<PaginatedResponse<any>> {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const { limit, offset, page, pageSize } = getPaginationLimitOffset(params);
  
  // Get total count
  const countResult = await db.select({ count: sql<number>`count(*)` })
    .from(applications)
    .where(eq(applications.candidateId, candidateId));
  const totalItems = Number(countResult[0]?.count || 0);
  
  // Get paginated data with joins
  const data = await db
    .select()
    .from(applications)
    .leftJoin(jobs, eq(applications.jobId, jobs.id))
    .leftJoin(resumeProfiles, eq(applications.resumeProfileId, resumeProfiles.id))
    .where(eq(applications.candidateId, candidateId))
    .orderBy(desc(applications.appliedAt))
    .limit(limit)
    .offset(offset);
  
  const transformedData = data.map((row: any) => ({
    ...row.applications,
    job: row.jobs,
    resumeProfile: row.resume_profiles,
  }));
  
  return buildPaginatedResponse(transformedData, totalItems, { page, pageSize });
}

export async function getGuestApplicationsByRecruiter(recruiterId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Get guest applications for jobs posted by this recruiter
  const result = await db
    .select()
    .from(guestApplications)
    .leftJoin(jobs, eq(guestApplications.jobId, jobs.id))
    .where(eq(jobs.postedBy, recruiterId));
  
  return result.map((row: any) => ({
    ...row.guest_applications,
    job: row.jobs,
    isGuest: true,
  }));
}

export async function getAllApplications() {
  const db = await getDb();
  if (!db) return [];
  
  // Join with all related tables to get complete application data
  const result = await db
    .select()
    .from(applications)
    .leftJoin(candidates, eq(applications.candidateId, candidates.id))
    .leftJoin(users, eq(candidates.userId, users.id))
    .leftJoin(jobs, eq(applications.jobId, jobs.id))
    .leftJoin(resumeProfiles, eq(applications.resumeProfileId, resumeProfiles.id))
    .leftJoin(videoIntroductions, eq(applications.videoIntroductionId, videoIntroductions.id));
  
  // Transform the result to match the expected structure
  return result.map((row: any) => ({
    id: row.applications.id,
    jobId: row.applications.jobId,
    candidateId: row.applications.candidateId,
    resumeUrl: row.applications.resumeUrl,
    coverLetter: row.applications.coverLetter,
    status: row.applications.status,
    appliedAt: row.applications.appliedAt,
    updatedAt: row.applications.updatedAt,
    videoIntroductionId: row.applications.videoIntroductionId,
    resumeProfileId: row.applications.resumeProfileId,
    // Include full nested objects
    candidate: row.candidates ? {
      ...row.candidates,
      fullName: row.users?.name || row.candidates.fullName,
      email: row.users?.email || row.candidates.email,
      phone: row.candidates.phone,
      expectedSalaryMin: row.candidates.expectedSalaryMin,
      expectedSalaryMax: row.candidates.expectedSalaryMax,
    } : null,
    job: row.jobs,
    resumeProfile: row.resume_profiles,
    videoIntroduction: row.video_introductions,
  }));
}

export async function updateApplication(id: number, updates: Partial<InsertApplication>) {
  const db = await getDb();
  if (!db) return;
  await db.update(applications).set(updates).where(eq(applications.id, id));
}

// Interview operations
export async function createInterview(interview: InsertInterview) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(interviews).values(interview);
  return result;
}

export async function getInterviewById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(interviews).where(eq(interviews.id, id)).limit(1);
  return result[0] || null;
}

export async function getInterviewsByApplicationId(applicationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(interviews).where(eq(interviews.applicationId, applicationId));
}

export async function updateInterview(id: number, updates: Partial<InsertInterview>) {
  const db = await getDb();
  if (!db) return;
  await db.update(interviews).set(updates).where(eq(interviews.id, id));
}

export async function getInterviewsByCandidateId(candidateId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Get all applications for this candidate
  const candidateApplications = await db
    .select({ id: applications.id })
    .from(applications)
    .where(eq(applications.candidateId, candidateId));
  
  if (candidateApplications.length === 0) return [];
  
  const applicationIds = candidateApplications.map(app => app.id);
  
  // Get all interviews for these applications
  return db
    .select()
    .from(interviews)
    .where(inArray(interviews.applicationId, applicationIds));
}

// Interview Question operations
export async function createInterviewQuestion(question: InsertInterviewQuestion) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(interviewQuestions).values(question);
  return result;
}

export async function getInterviewQuestionById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(interviewQuestions).where(eq(interviewQuestions.id, id)).limit(1);
  return result[0] || null;
}

export async function getInterviewQuestionsByInterviewId(interviewId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(interviewQuestions).where(eq(interviewQuestions.interviewId, interviewId));
}

// Interview Response operations
export async function createInterviewResponse(response: InsertInterviewResponse) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(interviewResponses).values(response);
  return result;
}

export async function getInterviewResponsesByQuestionId(questionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(interviewResponses).where(eq(interviewResponses.questionId, questionId));
}

export async function updateInterviewResponse(id: number, updates: Partial<InsertInterviewResponse>) {
  const db = await getDb();
  if (!db) return;
  await db.update(interviewResponses).set(updates).where(eq(interviewResponses.id, id));
}

// Saved Search operations
export async function createSavedSearch(search: InsertSavedSearch) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(savedSearches).values(search);
  return result;
}

export async function getSavedSearchesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(savedSearches).where(eq(savedSearches.userId, userId));
}

export async function updateSavedSearch(id: number, updates: Partial<InsertSavedSearch>) {
  const db = await getDb();
  if (!db) return;
  await db.update(savedSearches).set(updates).where(eq(savedSearches.id, id));
}

export async function deleteSavedSearch(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(savedSearches).where(eq(savedSearches.id, id));
}

// Saved Job operations
export async function createSavedJob(savedJob: InsertSavedJob) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(savedJobs).values(savedJob);
  return result;
}

export async function getSavedJobsByCandidateId(candidateId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(savedJobs).where(eq(savedJobs.candidateId, candidateId));
}

/**
 * Get saved jobs by candidate with pagination and full job details
 */
export async function getSavedJobsByCandidatePaginated(
  candidateId: number,
  params: PaginationParams
): Promise<PaginatedResponse<any>> {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const { limit, offset, page, pageSize } = getPaginationLimitOffset(params);
  
  // Get total count
  const countResult = await db.select({ count: sql<number>`count(*)` })
    .from(savedJobs)
    .where(eq(savedJobs.candidateId, candidateId));
  const totalItems = Number(countResult[0]?.count || 0);
  
  // Get paginated data with job details
  const data = await db
    .select()
    .from(savedJobs)
    .leftJoin(jobs, eq(savedJobs.jobId, jobs.id))
    .where(eq(savedJobs.candidateId, candidateId))
    .orderBy(desc(savedJobs.savedAt))
    .limit(limit)
    .offset(offset);
  
  const transformedData = data.map((row: any) => ({
    ...row.saved_jobs,
    job: row.jobs,
  }));
  
  return buildPaginatedResponse(transformedData, totalItems, { page, pageSize });
}

export async function deleteSavedJob(candidateId: number, jobId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(savedJobs).where(and(eq(savedJobs.candidateId, candidateId), eq(savedJobs.jobId, jobId)));
}

// Recently Viewed Jobs operations
export async function trackRecentlyViewedJob(candidateId: number, jobId: number) {
  const db = await getDb();
  if (!db) return null;
  
  // Check if this job was already viewed by this candidate
  const existing = await db.select()
    .from(recentlyViewedJobs)
    .where(and(
      eq(recentlyViewedJobs.candidateId, candidateId),
      eq(recentlyViewedJobs.jobId, jobId)
    ))
    .limit(1);
  
  if (existing.length > 0) {
    // Update the viewedAt timestamp
    await db.update(recentlyViewedJobs)
      .set({ viewedAt: new Date() })
      .where(eq(recentlyViewedJobs.id, existing[0].id));
    return existing[0];
  } else {
    // Insert new view record
    const result = await db.insert(recentlyViewedJobs).values({
      candidateId,
      jobId,
    });
    return result;
  }
}

export async function getRecentlyViewedJobsByCandidateId(candidateId: number, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];
  
  // Get recently viewed jobs with full job details, ordered by most recent first
  const results = await db.select()
    .from(recentlyViewedJobs)
    .leftJoin(jobs, eq(recentlyViewedJobs.jobId, jobs.id))
    .where(eq(recentlyViewedJobs.candidateId, candidateId))
    .orderBy(desc(recentlyViewedJobs.viewedAt))
    .limit(limit);
  
  return results.map(row => ({
    viewRecord: row.recentlyViewedJobs,
    job: row.jobs,
  }));
}

export async function clearRecentlyViewedJobs(candidateId: number) {
  const db = await getDb();
  if (!db) return { success: false };
  
  await db.delete(recentlyViewedJobs)
    .where(eq(recentlyViewedJobs.candidateId, candidateId));
  
  return { success: true };
}

/**
 * Get recommended jobs for a candidate based on their profile
 * This is a simple implementation that returns recent active jobs
 * TODO: Implement AI-based matching algorithm
 */
export async function getRecommendedJobsForCandidate(candidateId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  
  // For now, return recent active jobs
  // In the future, this should use AI matching based on candidate skills and experience
  return db
    .select()
    .from(jobs)
    .where(eq(jobs.status, 'active'))
    .orderBy(desc(jobs.createdAt))
    .limit(limit);
}

// Fraud Detection Event operations
export async function createFraudDetectionEvent(event: InsertFraudDetectionEvent) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(fraudDetectionEvents).values(event);
  return result;
}

export async function getFraudDetectionEventsByInterviewId(interviewId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(fraudDetectionEvents).where(eq(fraudDetectionEvents.interviewId, interviewId));
}

// Associate operations
export async function createAssociate(associate: InsertAssociate) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(associates).values(associate);
  return result;
}

export async function getAssociateById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(associates).where(eq(associates.id, id)).limit(1);
  return result[0] || null;
}

export async function getAllAssociates() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(associates);
}

export async function updateAssociate(id: number, updates: Partial<InsertAssociate>) {
  const db = await getDb();
  if (!db) return;
  await db.update(associates).set(updates).where(eq(associates.id, id));
}

// Onboarding Process operations
export async function createOnboardingProcess(process: InsertOnboardingProcess) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(onboardingProcesses).values(process);
  return result;
}

export async function getOnboardingProcessByAssociateId(associateId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(onboardingProcesses).where(eq(onboardingProcesses.associateId, associateId)).limit(1);
  return result[0] || null;
}

export async function updateOnboardingProcess(id: number, updates: Partial<InsertOnboardingProcess>) {
  const db = await getDb();
  if (!db) return;
  await db.update(onboardingProcesses).set(updates).where(eq(onboardingProcesses.id, id));
}

// Onboarding Task operations
export async function createOnboardingTask(task: InsertOnboardingTask) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(onboardingTasks).values(task);
  return result;
}

export async function getOnboardingTasksByProcessId(processId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(onboardingTasks).where(eq(onboardingTasks.processId, processId));
}

export async function updateOnboardingTask(id: number, updates: Partial<InsertOnboardingTask>) {
  const db = await getDb();
  if (!db) return;
  await db.update(onboardingTasks).set(updates).where(eq(onboardingTasks.id, id));
}

// Task Assignment operations
export async function createTaskAssignment(assignment: InsertTaskAssignment) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(taskAssignments).values(assignment);
  return result;
}

export async function getTaskAssignmentsByTaskId(taskId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(taskAssignments).where(eq(taskAssignments.taskId, taskId));
}

export async function updateTaskAssignment(id: number, updates: Partial<InsertTaskAssignment>) {
  const db = await getDb();
  if (!db) return;
  await db.update(taskAssignments).set(updates).where(eq(taskAssignments.id, id));
}

// Task Reminder operations
export async function createTaskReminder(reminder: InsertTaskReminder) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(taskReminders).values(reminder);
  return result;
}

export async function getTaskRemindersByTaskId(taskId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(taskReminders).where(eq(taskReminders.taskId, taskId));
}

// Task Template operations
export async function createTaskTemplate(template: InsertTaskTemplate) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(taskTemplates).values(template);
  return result;
}

export async function getAllTaskTemplates() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(taskTemplates);
}

// Application Feedback operations
export async function createApplicationFeedback(feedback: InsertApplicationFeedback) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(applicationFeedback).values(feedback);
  return result;
}

export async function getApplicationFeedback(applicationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(applicationFeedback).where(eq(applicationFeedback.applicationId, applicationId));
}

export async function updateApplicationFeedback(id: number, updates: Partial<InsertApplicationFeedback>) {
  const db = await getDb();
  if (!db) return;
  await db.update(applicationFeedback).set(updates).where(eq(applicationFeedback.id, id));
}

export async function deleteApplicationFeedback(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(applicationFeedback).where(eq(applicationFeedback.id, id));
}

// Reschedule Request operations
export async function createRescheduleRequest(request: InsertRescheduleRequest) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(rescheduleRequests).values(request);
  return result;
}

export async function getRescheduleRequestsByInterviewId(interviewId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(rescheduleRequests).where(eq(rescheduleRequests.interviewId, interviewId));
}

export async function updateRescheduleRequest(id: number, updates: Partial<InsertRescheduleRequest>) {
  const db = await getDb();
  if (!db) return;
  await db.update(rescheduleRequests).set(updates).where(eq(rescheduleRequests.id, id));
}

// Job Skill Requirement operations
export async function createJobSkillRequirement(requirement: InsertJobSkillRequirement) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(jobSkillRequirements).values(requirement);
  return result;
}

export async function getJobSkillRequirementsByJobId(jobId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(jobSkillRequirements).where(eq(jobSkillRequirements.jobId, jobId));
}

// Candidate Skill Rating operations
export async function createCandidateSkillRating(rating: InsertCandidateSkillRating) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(candidateSkillRatings).values(rating);
  return result;
}

export async function getCandidateSkillRatingsByApplicationId(applicationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(candidateSkillRatings).where(eq(candidateSkillRatings.applicationId, applicationId));
}

// Notification operations
export async function createNotification(notification: any) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(notifications).values(notification);
  return result;
}

export async function getNotificationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId));
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

// Candidate Profile Share operations
export async function createCandidateProfileShare(share: InsertCandidateProfileShare) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(candidateProfileShares).values(share);
  return result;
}

export async function getCandidateProfileShareByToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(candidateProfileShares).where(eq(candidateProfileShares.shareToken, token)).limit(1);
  return result[0] || null;
}

// Environment Variable operations
export async function createEnvironmentVariable(variable: InsertEnvironmentVariable) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(environmentVariables).values(variable);
  return result;
}

export async function getAllEnvironmentVariables() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(environmentVariables);
}

export async function updateEnvironmentVariable(id: number, updates: Partial<InsertEnvironmentVariable>) {
  const db = await getDb();
  if (!db) return;
  await db.update(environmentVariables).set(updates).where(eq(environmentVariables.id, id));
}

// Application Log operations
export async function createApplicationLog(log: InsertApplicationLog) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(applicationLogs).values(log);
  return result;
}

export async function getAllApplicationLogs() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(applicationLogs);
}

export async function updateApplicationLog(id: number, updates: Partial<InsertApplicationLog>) {
  const db = await getDb();
  if (!db) return;
  await db.update(applicationLogs).set(updates).where(eq(applicationLogs.id, id));
}

// System Settings operations
export async function getSystemSetting(key: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(systemSettings).where(eq(systemSettings.settingKey, key)).limit(1);
  return result[0] || null;
}

export async function upsertSystemSetting(key: string, value: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(systemSettings).values({ settingKey: key, settingValue: value }).onDuplicateKeyUpdate({ set: { settingValue: value } });
}

// LinkedIn Credit Usage operations
export async function createLinkedinCreditUsage(usage: InsertLinkedinCreditUsage) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(linkedinCreditUsage).values(usage);
  return result;
}

export async function getLinkedinCreditUsageByRecruiterId(recruiterId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(linkedinCreditUsage).where(eq(linkedinCreditUsage.recruiterId, recruiterId));
}

// InMail Template operations
export async function createInmailTemplate(template: InsertInmailTemplate) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(inmailTemplates).values(template);
  return result;
}

export async function getAllInmailTemplates(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(inmailTemplates).where(eq(inmailTemplates.companyId, companyId));
}

export async function updateInmailTemplate(id: number, updates: Partial<InsertInmailTemplate>) {
  const db = await getDb();
  if (!db) return;
  await db.update(inmailTemplates).set(updates).where(eq(inmailTemplates.id, id));
}

export async function deleteInmailTemplate(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(inmailTemplates).where(eq(inmailTemplates.id, id));
}

// Import necessary operators
import { eq, and, inArray, count, sql, desc, sum } from "drizzle-orm";


// ============================================
// COMPANY ADMIN OPERATIONS
// ============================================

/**
 * Get company settings for a company
 */
export async function getCompanySettings(companyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const settings = await db.select().from(companySettings).where(eq(companySettings.companyId, companyId)).limit(1);
  return settings[0] || null;
}

/**
 * Upsert company settings
 */
export async function upsertCompanySettings(settings: InsertCompanySettings) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const existing = await getCompanySettings(settings.companyId);
  
  if (existing) {
    await db.update(companySettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(companySettings.id, existing.id));
  } else {
    await db.insert(companySettings).values(settings);
  }
}

/**
 * Get all users in a company
 */
export async function getCompanyUsers(companyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  return await db.select().from(users).where(eq(users.companyId, companyId));
}

/**
 * Get company-wide statistics
 */
export async function getCompanyStats(companyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  // Count jobs posted by company users
  const jobCounts = await db.select({
    total: count(),
    active: count(sql`CASE WHEN ${jobs.status} = 'active' THEN 1 END`)
  })
  .from(jobs)
  .innerJoin(users, eq(jobs.postedBy, users.id))
  .where(eq(users.companyId, companyId));
  
  // Count applications for company jobs
  const appCounts = await db.select({ count: count() })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .innerJoin(users, eq(jobs.postedBy, users.id))
    .where(eq(users.companyId, companyId));
  
  // Count candidates
  const candidateCounts = await db.select({ count: count() })
    .from(candidates)
    .innerJoin(users, eq(candidates.userId, users.id))
    .where(eq(users.companyId, companyId));
  
  // Count associates by companyId
  const associateCounts = await db.select({ count: count() })
    .from(associates)
    .where(eq(associates.companyId, companyId));
  
  // Count interviews for company jobs
  const interviewCounts = await db.select({ count: count() })
    .from(interviews)
    .innerJoin(jobs, eq(interviews.jobId, jobs.id))
    .innerJoin(users, eq(jobs.postedBy, users.id))
    .where(eq(users.companyId, companyId));
  
  // Count placements (hired applications)
  const placementCounts = await db.select({ count: count() })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .innerJoin(users, eq(jobs.postedBy, users.id))
    .where(and(
      eq(users.companyId, companyId),
      eq(applications.status, 'hired')
    ));
  
  return {
    totalJobs: jobCounts[0]?.total || 0,
    activeJobs: jobCounts[0]?.active || 0,
    totalApplications: appCounts[0]?.count || 0,
    totalCandidates: candidateCounts[0]?.count || 0,
    totalAssociates: associateCounts[0]?.count || 0,
    totalInterviews: interviewCounts[0]?.count || 0,
    totalPlacements: placementCounts[0]?.count || 0
  };
}

/**
 * Get all candidates across company
 */
export async function getCompanyCandidates(companyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  return await db.select({
    candidate: candidates,
    user: users
  })
  .from(candidates)
  .innerJoin(users, eq(candidates.userId, users.id))
  .where(eq(users.companyId, companyId));
}

/**
 * Get all associates across company
 */
export async function getCompanyAssociates(companyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  // Get all recruiters in the company
  const companyUsers = await db.select({ id: users.id })
    .from(users)
    .where(and(eq(users.companyId, companyId), eq(users.role, 'recruiter')));
  
  const recruiterIds = companyUsers.map(u => u.id);
  
  if (recruiterIds.length === 0) {
    return [];
  }
  
  return await db.select({
    associate: associates,
    recruiter: users
  })
  .from(associates)
  .innerJoin(users, eq(associates.recruiterId, users.id))
  .where(inArray(associates.recruiterId, recruiterIds));
}

/**
 * Get all jobs across company
 */
export async function getCompanyJobs(companyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  // Get all recruiters in the company
  const companyUsers = await db.select({ id: users.id })
    .from(users)
    .where(and(eq(users.companyId, companyId), eq(users.role, 'recruiter')));
  
  const recruiterIds = companyUsers.map(u => u.id);
  
  if (recruiterIds.length === 0) {
    return [];
  }
  
  return await db.select({
    job: jobs,
    recruiter: users
  })
  .from(jobs)
  .innerJoin(users, eq(jobs.recruiterId, users.id))
  .where(inArray(jobs.recruiterId, recruiterIds));
}

/**
 * Get recruiter performance metrics
 */
export async function getRecruiterPerformance(companyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  try {
    // Optimized: Get all metrics in a single query using subqueries
    // Note: jobs.postedBy is the recruiter, applications/interviews link through jobId
    const performance = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      jobsPosted: sql<number>`(
        SELECT COUNT(*) FROM ${jobs} 
        WHERE ${jobs.postedBy} = ${users.id}
      )`,
      applications: sql<number>`(
        SELECT COUNT(*) FROM ${applications} 
        INNER JOIN ${jobs} ON ${applications.jobId} = ${jobs.id}
        WHERE ${jobs.postedBy} = ${users.id}
      )`,
      interviews: sql<number>`(
        SELECT COUNT(*) FROM ${interviews} 
        INNER JOIN ${jobs} ON ${interviews.jobId} = ${jobs.id}
        WHERE ${jobs.postedBy} = ${users.id}
      )`,
      placements: sql<number>`(
        SELECT COUNT(*) FROM ${applications} 
        INNER JOIN ${jobs} ON ${applications.jobId} = ${jobs.id}
        WHERE ${jobs.postedBy} = ${users.id} 
        AND ${applications.status} = 'hired'
      )`
    })
    .from(users)
    .where(and(eq(users.companyId, companyId), eq(users.role, 'recruiter')));
    
    // Format to match expected structure
    return performance.map(p => ({
      recruiter: {
        id: p.id,
        name: p.name,
        email: p.email
      },
      metrics: {
        jobsPosted: Number(p.jobsPosted) || 0,
        applications: Number(p.applications) || 0,
        interviews: Number(p.interviews) || 0,
        placements: Number(p.placements) || 0
      }
    }));
  } catch (error: any) {
    console.error('[getRecruiterPerformance] Error:', error?.message || error);
    // Return empty array on error to prevent dashboard from breaking
    return [];
  }
}

/**
 * Log user activity
 */
export async function logUserActivity(log: InsertUserActivityLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  await db.insert(userActivityLogs).values(log);
}

/**
 * Get user activity logs for a company
 */
export async function getCompanyActivityLogs(companyId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  try {
    const results = await db.select({
      log: userActivityLogs,
      user: users
    })
    .from(userActivityLogs)
    .innerJoin(users, eq(userActivityLogs.userId, users.id))
    .where(eq(userActivityLogs.companyId, companyId))
    .orderBy(desc(userActivityLogs.createdAt))
    .limit(limit);
    
    // Map to flat structure with userName
    return results.map(r => ({
      id: r.log.id,
      userId: r.log.userId,
      companyId: r.log.companyId,
      action: r.log.action,
      resource: r.log.resource,
      resourceId: r.log.resourceId,
      ipAddress: r.log.ipAddress,
      userAgent: r.log.userAgent,
      details: r.log.details,
      createdAt: r.log.createdAt,
      userName: r.user.name,
    }));
  } catch (error: any) {
    // If table doesn't exist yet, return empty array instead of crashing
    console.warn('[getCompanyActivityLogs] Error querying activity logs:', error?.message || error);
    if (error?.code === 'ER_NO_SUCH_TABLE' || 
        error?.errno === 1146 || 
        error?.message?.includes('doesn\'t exist') ||
        error?.message?.includes('Table') ||
        error?.sqlMessage?.includes('doesn\'t exist')) {
      console.warn('[getCompanyActivityLogs] userActivityLogs table does not exist yet, returning empty array');
      return [];
    }
    // For any other error, also return empty array to prevent dashboard from breaking
    console.error('[getCompanyActivityLogs] Unexpected error, returning empty array to prevent crash');
    return [];
  }
}

/**
 * Get company candidates for master list (simplified format)
 */
export async function getCompanyCandidatesForMasterList(companyId: number, search?: string, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  // Get all recruiters in the company
  const companyUsers = await db.select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.companyId, companyId));
  
  const recruiterIds = companyUsers.map(u => u.id);
  if (recruiterIds.length === 0) return [];
  
  // Get all resume profiles created by company recruiters
  let query = db.select({
    id: resumeProfiles.id,
    resumeProfileId: resumeProfiles.id,
    candidateName: resumeProfiles.name,
    candidateEmail: resumeProfiles.email,
    title: resumeProfiles.title,
    yearsOfExperience: resumeProfiles.yearsOfExperience,
    location: resumeProfiles.location,
    recruiterId: resumeProfiles.recruiterId,
    recruiterName: users.name,
    createdAt: resumeProfiles.createdAt,
  })
  .from(resumeProfiles)
  .innerJoin(users, eq(resumeProfiles.recruiterId, users.id))
  .where(inArray(resumeProfiles.recruiterId, recruiterIds));
  
  const results = await query.limit(limit);
  
  // Apply search filter if provided
  if (search) {
    const searchLower = search.toLowerCase();
    return results.filter(r => 
      r.candidateName?.toLowerCase().includes(searchLower) ||
      r.candidateEmail?.toLowerCase().includes(searchLower) ||
      r.title?.toLowerCase().includes(searchLower) ||
      r.location?.toLowerCase().includes(searchLower)
    );
  }
  
  return results;
}

/**
 * Get company jobs for master list (simplified format)
 */
export async function getCompanyJobsForMasterList(companyId: number, search?: string, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  // Get all recruiters in the company
  const companyUsers = await db.select({ id: users.id })
    .from(users)
    .where(eq(users.companyId, companyId));
  
  const recruiterIds = companyUsers.map(u => u.id);
  if (recruiterIds.length === 0) return [];
  
  // Get all jobs created by company recruiters
  let query = db.select({
    id: jobs.id,
    title: jobs.title,
    companyName: jobs.companyName,
    location: jobs.location,
    employmentType: jobs.employmentType,
    status: jobs.status,
    recruiterId: jobs.recruiterId,
    recruiterName: users.name,
    createdAt: jobs.createdAt,
    applicationCount: sql<number>`(SELECT COUNT(*) FROM ${applications} WHERE ${applications.jobId} = ${jobs.id})`,
  })
  .from(jobs)
  .innerJoin(users, eq(jobs.recruiterId, users.id))
  .where(inArray(jobs.recruiterId, recruiterIds));
  
  const results = await query.limit(limit);
  
  // Apply search filter if provided
  if (search) {
    const searchLower = search.toLowerCase();
    return results.filter(r => 
      r.title?.toLowerCase().includes(searchLower) ||
      r.companyName?.toLowerCase().includes(searchLower) ||
      r.location?.toLowerCase().includes(searchLower)
    );
  }
  
  return results;
}

/**
 * Get company associates for master list (simplified format)
 */
export async function getCompanyAssociatesForMasterList(companyId: number, search?: string, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  // Get all recruiters in the company
  const companyUsers = await db.select({ id: users.id })
    .from(users)
    .where(eq(users.companyId, companyId));
  
  const recruiterIds = companyUsers.map(u => u.id);
  if (recruiterIds.length === 0) return [];
  
  // Get all associates placed by company recruiters
  let query = db.select({
    id: associates.id,
    candidateName: sql<string>`(SELECT name FROM ${candidates} WHERE ${candidates.id} = ${associates.candidateId})`,
    candidateEmail: sql<string>`(SELECT email FROM ${users} WHERE ${users.id} = (SELECT userId FROM ${candidates} WHERE ${candidates.id} = ${associates.candidateId}))`,
    jobTitle: associates.jobTitle,
    companyName: associates.companyName,
    startDate: associates.startDate,
    recruiterId: associates.recruiterId,
    recruiterName: users.name,
    createdAt: associates.createdAt,
  })
  .from(associates)
  .innerJoin(users, eq(associates.recruiterId, users.id))
  .where(inArray(associates.recruiterId, recruiterIds));
  
  const results = await query.limit(limit);
  
  // Apply search filter if provided
  if (search) {
    const searchLower = search.toLowerCase();
    return results.filter(r => 
      r.candidateName?.toLowerCase().includes(searchLower) ||
      r.candidateEmail?.toLowerCase().includes(searchLower) ||
      r.jobTitle?.toLowerCase().includes(searchLower) ||
      r.companyName?.toLowerCase().includes(searchLower)
    );
  }
  
  return results;
}

/**
 * Create recruiter invitation (simplified - just check for existing user)
 */
export async function createRecruiterInvitation(invitation: {
  companyId: number;
  email: string;
  name: string;
  invitedBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  // Check if user already exists with this email
  const existing = await db.select()
    .from(users)
    .where(eq(users.email, invitation.email))
    .limit(1);
  
  if (existing.length > 0) {
    throw new Error("User with this email already exists");
  }
  
  // In a real implementation, this would send an invitation email
  // For now, we just return success
  return { success: true, message: "Invitation would be sent to " + invitation.email };
}

/**
 * Get dashboard stats for recruiter
 */
export async function getDashboardStats(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  // Jobs are posted by users (postedBy column)
  const [jobsResult] = await db.select({ count: count() })
    .from(jobs)
    .where(eq(jobs.postedBy, userId));
  
  // Get recruiter ID from user ID
  const recruiter = await db.select({ id: recruiters.id })
    .from(recruiters)
    .where(eq(recruiters.userId, userId))
    .limit(1);
  
  const recruiterId = recruiter[0]?.id;
  
  if (!recruiterId) {
    return {
      totalJobs: jobsResult?.count || 0,
      totalApplications: 0,
      totalInterviews: 0,
      totalCandidates: 0,
    };
  }
  
  // Applications are linked to jobs, and jobs are posted by users
  // So we need to JOIN applications with jobs to filter by recruiter
  const [applicationsResult] = await db.select({ count: count() })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .where(eq(jobs.postedBy, userId));
  
  const [interviewsResult] = await db.select({ count: count() })
    .from(interviews)
    .where(eq(interviews.recruiterId, recruiterId));
  
  // Candidates table doesn't have recruiterId either
  // Count unique candidates who applied to this recruiter's jobs
  const candidatesForJobsResult = await db.selectDistinct({ candidateId: applications.candidateId })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .where(eq(jobs.postedBy, userId));
  
  const totalCandidates = candidatesForJobsResult.length;
  
  return {
    totalJobs: jobsResult?.count || 0,
    totalApplications: applicationsResult?.count || 0,
    totalInterviews: interviewsResult?.count || 0,
    totalCandidates: totalCandidates,
  };
}

/**
 * Get pending reschedule requests for recruiter
 */
export async function getPendingRescheduleRequests(recruiterId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  // Join with interviews table to filter by recruiter
  return await db.select({
    id: rescheduleRequests.id,
    interviewId: rescheduleRequests.interviewId,
    panelistId: rescheduleRequests.panelistId,
    requestedBy: rescheduleRequests.requestedBy,
    reason: rescheduleRequests.reason,
    preferredDates: rescheduleRequests.preferredDates,
    status: rescheduleRequests.status,
    resolvedAt: rescheduleRequests.resolvedAt,
    resolvedBy: rescheduleRequests.resolvedBy,
    newInterviewTime: rescheduleRequests.newInterviewTime,
    createdAt: rescheduleRequests.createdAt,
    updatedAt: rescheduleRequests.updatedAt,
  })
    .from(rescheduleRequests)
    .innerJoin(interviews, eq(rescheduleRequests.interviewId, interviews.id))
    .where(
      and(
        eq(interviews.recruiterId, recruiterId),
        eq(rescheduleRequests.status, 'pending')
      )
    )
    .orderBy(desc(rescheduleRequests.createdAt));
}

/**
 * Get interviews by recruiter ID
 */
export async function getInterviewsByRecruiterId(recruiterId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  return await db.select()
    .from(interviews)
    .where(eq(interviews.recruiterId, recruiterId))
    .orderBy(desc(interviews.scheduledAt));
}

/**
 * Get jobs by recruiter (alias for getJobsByRecruiterId)
 */
export async function getJobsByRecruiter(recruiterId: number) {
  return await getJobsByRecruiterId(recruiterId);
}

/**
 * Search candidates with filters
 */
export async function searchCandidates(filters: {
  recruiterId?: number;
  skills?: string[];
  location?: string;
  experienceLevel?: string;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  let query = db.select()
    .from(candidates)
    .limit(filters.limit || 50);
  
  if (filters.recruiterId) {
    query = query.where(eq(candidates.recruiterId, filters.recruiterId));
  }
  
  return await query;
}

/**
 * Get saved searches by user (alias for getSavedSearchesByUserId)
 */
export async function getSavedSearchesByUser(userId: number) {
  return await getSavedSearchesByUserId(userId);
}

/**
 * Get all public jobs (active status)
 */
export async function getPublicJobs(filters?: {
  search?: string;
  location?: string;
  employmentType?: string;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  let query = db.select()
    .from(jobs)
    .where(eq(jobs.status, 'active'))
    .orderBy(desc(jobs.createdAt))
    .limit(filters?.limit || 50);
  
  return await query;
}

/**
 * Get public jobs with pagination
 */
export async function getPublicJobsPaginated(
  filters: {
    search?: string;
    location?: string;
    employmentType?: string;
  } & PaginationParams
): Promise<PaginatedResponse<typeof jobs.$inferSelect>> {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const { limit, offset, page, pageSize } = getPaginationLimitOffset(filters);
  
  // Build base query
  let query = db.select()
    .from(jobs)
    .where(eq(jobs.status, 'active'))
    .orderBy(desc(jobs.createdAt))
    .$dynamic();
  
  // Get total count
  const countResult = await db.select({ count: sql<number>`count(*)` })
    .from(jobs)
    .where(eq(jobs.status, 'active'));
  const totalItems = Number(countResult[0]?.count || 0);
  
  // Get paginated data
  const data = await query.limit(limit).offset(offset);
  
  return buildPaginatedResponse(data, totalItems, { page, pageSize });
}

/**
 * Search jobs with filters
 */
export async function searchJobs(filters: {
  search?: string;
  location?: string;
  employmentType?: string;
  experienceLevel?: string;
  salaryMin?: number;
  salaryMax?: number;
  recruiterId?: number;
  status?: string;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  let query = db.select()
    .from(jobs)
    .orderBy(desc(jobs.createdAt))
    .limit(filters.limit || 50);
  
  // Apply filters
  const conditions = [];
  
  if (filters.recruiterId) {
    conditions.push(eq(jobs.recruiterId, filters.recruiterId));
  }
  
  if (filters.status) {
    conditions.push(eq(jobs.status, filters.status));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  
  const results = await query;
  
  // Apply text search filter if provided (client-side filtering for simplicity)
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    return results.filter(job => 
      job.title?.toLowerCase().includes(searchLower) ||
      job.description?.toLowerCase().includes(searchLower) ||
      job.companyName?.toLowerCase().includes(searchLower)
    );
  }
  
  return results;
}

// ============================================================================
// Custom Reports Database Helpers
// ============================================================================

/**
 * Create a new custom report
 */
export async function createCustomReport(data: InsertCustomReport) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const [report] = await db.insert(customReports).values(data);
  return report;
}

/**
 * Get custom reports by company ID
 */
export async function getCustomReportsByCompany(companyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  return await db.select()
    .from(customReports)
    .where(eq(customReports.companyId, companyId))
    .orderBy(desc(customReports.createdAt));
}

/**
 * Get custom report by ID
 */
export async function getCustomReportById(reportId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const [report] = await db.select()
    .from(customReports)
    .where(eq(customReports.id, reportId));
  
  return report || null;
}

/**
 * Update custom report
 */
export async function updateCustomReport(reportId: number, data: Partial<InsertCustomReport>) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  await db.update(customReports)
    .set(data)
    .where(eq(customReports.id, reportId));
  
  return await getCustomReportById(reportId);
}

/**
 * Delete custom report
 */
export async function deleteCustomReport(reportId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  await db.delete(customReports)
    .where(eq(customReports.id, reportId));
}

// ============================================================================
// Report Schedules Database Helpers
// ============================================================================

/**
 * Create a new report schedule
 */
export async function createReportSchedule(data: InsertReportSchedule) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const [schedule] = await db.insert(reportSchedules).values(data);
  return schedule;
}

/**
 * Get report schedules by company ID
 */
export async function getReportSchedulesByCompany(companyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  return await db.select()
    .from(reportSchedules)
    .where(eq(reportSchedules.companyId, companyId))
    .orderBy(desc(reportSchedules.createdAt));
}

/**
 * Get report schedule by ID
 */
export async function getReportScheduleById(scheduleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const [schedule] = await db.select()
    .from(reportSchedules)
    .where(eq(reportSchedules.id, scheduleId));
  
  return schedule || null;
}

/**
 * Update report schedule
 */
export async function updateReportSchedule(scheduleId: number, data: Partial<InsertReportSchedule>) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  await db.update(reportSchedules)
    .set(data)
    .where(eq(reportSchedules.id, scheduleId));
  
  return await getReportScheduleById(scheduleId);
}

/**
 * Delete report schedule
 */
export async function deleteReportSchedule(scheduleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  await db.delete(reportSchedules)
    .where(eq(reportSchedules.id, scheduleId));
}

/**
 * Get active schedules that need to be executed
 */
export async function getSchedulesDueForExecution() {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const now = new Date();
  
  return await db.select()
    .from(reportSchedules)
    .where(
      and(
        eq(reportSchedules.isActive, true),
        or(
          isNull(reportSchedules.nextSendAt),
          lte(reportSchedules.nextSendAt, now)
        )
      )
    );
}

// ============================================================================
// Report Executions Database Helpers
// ============================================================================

/**
 * Create a new report execution record
 */
export async function createReportExecution(data: InsertReportExecution) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const [execution] = await db.insert(reportExecutions).values(data);
  return execution;
}

/**
 * Get report executions by schedule ID
 */
export async function getReportExecutionsBySchedule(scheduleId: number, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  return await db.select()
    .from(reportExecutions)
    .where(eq(reportExecutions.scheduleId, scheduleId))
    .orderBy(desc(reportExecutions.executedAt))
    .limit(limit);
}

/**
 * Update report execution status
 */
export async function updateReportExecution(executionId: number, data: Partial<InsertReportExecution>) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  await db.update(reportExecutions)
    .set(data)
    .where(eq(reportExecutions.id, executionId));
}

// ============================================================================
// Job Application Stats Helpers
// ============================================================================

/**
 * Get application statistics by status for a specific job
 */
export async function getJobApplicationStats(jobId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const apps = await db.select({
    status: applications.status,
  })
    .from(applications)
    .where(eq(applications.jobId, jobId));
  
  // Count applications by status
  const stats = {
    submitted: 0,
    reviewing: 0,
    shortlisted: 0,
    interviewing: 0,
    offered: 0,
    rejected: 0,
    withdrawn: 0,
    total: apps.length,
  };
  
  apps.forEach((app) => {
    if (app.status && stats.hasOwnProperty(app.status)) {
      stats[app.status as keyof typeof stats]++;
    }
  });
  
  return stats;
}


// Budget management operations
export async function getCompanyBudget(companyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const result = await db.execute(sql`
    SELECT * FROM company_budgets WHERE companyId = ${companyId}
  `);
  
  return result && result.length > 0 ? result[0] : null;
}

export async function createCompanyBudget(data: {
  companyId: number;
  monthlyLimit: number;
  alertThreshold?: number;
  gracePeriodHours?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  await db.execute(sql`
    INSERT INTO company_budgets (companyId, monthlyLimit, alertThreshold, gracePeriodHours)
    VALUES (${data.companyId}, ${data.monthlyLimit}, ${data.alertThreshold || 80}, ${data.gracePeriodHours || 24})
  `);
  
  return await getCompanyBudget(data.companyId);
}

export async function updateCompanyBudget(companyId: number, updates: {
  monthlyLimit?: number;
  alertThreshold?: number;
  gracePeriodHours?: number;
  currentSpending?: number;
  isPaused?: boolean;
  overrideEnabled?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const setClauses: string[] = [];
  const values: any[] = [];
  
  if (updates.monthlyLimit !== undefined) {
    setClauses.push(`monthlyLimit = ?`);
    values.push(updates.monthlyLimit);
  }
  if (updates.alertThreshold !== undefined) {
    setClauses.push(`alertThreshold = ?`);
    values.push(updates.alertThreshold);
  }
  if (updates.gracePeriodHours !== undefined) {
    setClauses.push(`gracePeriodHours = ?`);
    values.push(updates.gracePeriodHours);
  }
  if (updates.currentSpending !== undefined) {
    setClauses.push(`currentSpending = ?`);
    values.push(updates.currentSpending);
  }
  if (updates.isPaused !== undefined) {
    setClauses.push(`isPaused = ?`);
    values.push(updates.isPaused);
  }
  if (updates.overrideEnabled !== undefined) {
    setClauses.push(`overrideEnabled = ?`);
    values.push(updates.overrideEnabled);
  }
  
  if (setClauses.length === 0) return;
  
  values.push(companyId);
  
  await db.execute(sql.raw(`
    UPDATE company_budgets
    SET ${setClauses.join(', ')}
    WHERE companyId = ?
  `, values));
}

export async function getAllCompanyBudgets() {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const result = await db.execute(sql`
    SELECT cb.*, c.name as companyName
    FROM company_budgets cb
    JOIN companies c ON cb.companyId = c.id
    ORDER BY cb.currentSpending DESC
  `);
  
  return result || [];
}


// Integration settings operations
export async function createIntegrationSetting(data: {
  companyId?: number;
  userId?: number;
  integrationType: 'slack' | 'teams';
  webhookUrl: string;
  channelName?: string;
  enabled?: boolean;
  notificationTypes?: string[];
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  await db.execute(sql`
    INSERT INTO integration_settings (companyId, userId, integrationType, webhookUrl, channelName, enabled, notificationTypes, createdBy)
    VALUES (
      ${data.companyId || null},
      ${data.userId || null},
      ${data.integrationType},
      ${data.webhookUrl},
      ${data.channelName || null},
      ${data.enabled !== false},
      ${data.notificationTypes ? JSON.stringify(data.notificationTypes) : null},
      ${data.createdBy}
    )
  `);
  
  const result = await db.execute(sql`SELECT LAST_INSERT_ID() as id`);
  const id = (result[0] as any).id;
  
  return await getIntegrationSettingById(id);
}

export async function getIntegrationSettingById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const result = await db.execute(sql`
    SELECT * FROM integration_settings WHERE id = ${id}
  `);
  
  return result && result.length > 0 ? result[0] : null;
}

export async function getIntegrationSettingsByCompany(companyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const result = await db.execute(sql`
    SELECT * FROM integration_settings WHERE companyId = ${companyId}
  `);
  
  return result || [];
}

export async function getIntegrationSettingsByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const result = await db.execute(sql`
    SELECT * FROM integration_settings WHERE userId = ${userId}
  `);
  
  return result || [];
}

export async function updateIntegrationSetting(id: number, updates: {
  webhookUrl?: string;
  channelName?: string;
  enabled?: boolean;
  notificationTypes?: string[];
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const setClauses: string[] = [];
  const values: any[] = [];
  
  if (updates.webhookUrl !== undefined) {
    setClauses.push(`webhookUrl = ?`);
    values.push(updates.webhookUrl);
  }
  if (updates.channelName !== undefined) {
    setClauses.push(`channelName = ?`);
    values.push(updates.channelName);
  }
  if (updates.enabled !== undefined) {
    setClauses.push(`enabled = ?`);
    values.push(updates.enabled);
  }
  if (updates.notificationTypes !== undefined) {
    setClauses.push(`notificationTypes = ?`);
    values.push(JSON.stringify(updates.notificationTypes));
  }
  
  if (setClauses.length === 0) return;
  
  values.push(id);
  
  await db.execute(sql.raw(`
    UPDATE integration_settings
    SET ${setClauses.join(', ')}
    WHERE id = ?
  `, values));
}

export async function deleteIntegrationSetting(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  await db.execute(sql`
    DELETE FROM integration_settings WHERE id = ${id}
  `);
}

export async function logNotificationDelivery(data: {
  integrationId: number;
  notificationType: string;
  notificationTitle: string;
  notificationMessage: string;
  deliveryStatus: 'success' | 'failed';
  errorMessage?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  await db.execute(sql`
    INSERT INTO notification_delivery_logs (integrationId, notificationType, notificationTitle, notificationMessage, deliveryStatus, errorMessage)
    VALUES (${data.integrationId}, ${data.notificationType}, ${data.notificationTitle}, ${data.notificationMessage}, ${data.deliveryStatus}, ${data.errorMessage || null})
  `);
}

export async function getNotificationDeliveryLogs(integrationId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const result = await db.execute(sql`
    SELECT * FROM notification_delivery_logs
    WHERE integrationId = ${integrationId}
    ORDER BY sentAt DESC
    LIMIT ${limit}
  `);
  
  return result || [];
}

// ============================================
// Job Templates Functions
// ============================================

export async function createJobTemplate(data: InsertJobTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const [result] = await db.insert(jobTemplates).values(data);
  return result.insertId;
}

export async function getJobTemplatesByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  return await db.select().from(jobTemplates)
    .where(eq(jobTemplates.createdBy, userId))
    .orderBy(desc(jobTemplates.usageCount), desc(jobTemplates.createdAt));
}

export async function getJobTemplateById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const [template] = await db.select().from(jobTemplates)
    .where(eq(jobTemplates.id, id));
  return template;
}

export async function updateJobTemplate(id: number, data: Partial<InsertJobTemplate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  await db.update(jobTemplates)
    .set(data)
    .where(eq(jobTemplates.id, id));
}

export async function deleteJobTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  await db.delete(jobTemplates)
    .where(eq(jobTemplates.id, id));
}

export async function incrementTemplateUsage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  await db.execute(sql`
    UPDATE job_templates 
    SET usageCount = usageCount + 1 
    WHERE id = ${id}
  `);
}

// ============================================
// Job Views Tracking Functions
// ============================================

export async function trackJobView(data: InsertJobView) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  await db.insert(jobViews).values(data);
}

export async function getJobViewCount(jobId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const [result] = await db.execute(sql`
    SELECT COUNT(*) as count FROM job_views WHERE jobId = ${jobId}
  `);
  return result?.[0]?.count || 0;
}

export async function getJobViewsBySource(jobId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const result = await db.execute(sql`
    SELECT source, COUNT(*) as count 
    FROM job_views 
    WHERE jobId = ${jobId} 
    GROUP BY source
  `);
  return result || [];
}

export async function getJobAnalytics(jobId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  // Get view count
  const [viewResult] = await db.execute(sql`
    SELECT COUNT(*) as viewCount FROM job_views WHERE jobId = ${jobId}
  `);
  
  // Get application count and conversion rate
  const [appResult] = await db.execute(sql`
    SELECT COUNT(*) as applicationCount FROM applications WHERE jobId = ${jobId}
  `);
  
  // Get job details for time-to-fill calculation
  const [jobResult] = await db.execute(sql`
    SELECT createdAt, closedAt, status FROM jobs WHERE id = ${jobId}
  `);
  
  const viewCount = viewResult?.[0]?.viewCount || 0;
  const applicationCount = appResult?.[0]?.applicationCount || 0;
  const job = jobResult?.[0];
  
  let timeToFill = null;
  if (job?.closedAt && job?.createdAt) {
    const diffMs = new Date(job.closedAt).getTime() - new Date(job.createdAt).getTime();
    timeToFill = Math.floor(diffMs / (1000 * 60 * 60 * 24)); // days
  }
  
  return {
    viewCount,
    applicationCount,
    conversionRate: viewCount > 0 ? ((applicationCount / viewCount) * 100).toFixed(2) : '0',
    timeToFill,
    status: job?.status
  };
}

// Template Sharing operations
export async function createTemplateShare(data: {
  templateId: number;
  sharedBy: number;
  requestMessage?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const [result] = await db.insert(templateShares).values({
    templateId: data.templateId,
    sharedBy: data.sharedBy,
    requestMessage: data.requestMessage,
    status: 'pending'
  });
  
  return result.insertId;
}

export async function getPendingTemplateShares(companyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  return db.select({
    id: templateShares.id,
    templateId: templateShares.templateId,
    templateName: jobTemplates.name,
    templateDescription: jobTemplates.description,
    sharedBy: templateShares.sharedBy,
    sharedByName: users.name,
    requestMessage: templateShares.requestMessage,
    requestedAt: templateShares.requestedAt,
    status: templateShares.status
  })
  .from(templateShares)
  .innerJoin(jobTemplates, eq(templateShares.templateId, jobTemplates.id))
  .innerJoin(users, eq(templateShares.sharedBy, users.id))
  .where(and(
    eq(jobTemplates.companyId, companyId),
    eq(templateShares.status, 'pending')
  ))
  .orderBy(desc(templateShares.requestedAt));
}

export async function approveTemplateShare(shareId: number, reviewedBy: number, reviewNotes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  // Get the template share
  const [share] = await db.select()
    .from(templateShares)
    .where(eq(templateShares.id, shareId));
  
  if (!share) throw new Error("Template share not found");
  
  // Update template to be company-wide
  await db.update(jobTemplates)
    .set({ isCompanyWide: true })
    .where(eq(jobTemplates.id, share.templateId));
  
  // Update share status
  await db.update(templateShares)
    .set({
      status: 'approved',
      reviewedBy,
      reviewedAt: new Date(),
      reviewNotes
    })
    .where(eq(templateShares.id, shareId));
}

export async function rejectTemplateShare(shareId: number, reviewedBy: number, reviewNotes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  await db.update(templateShares)
    .set({
      status: 'rejected',
      reviewedBy,
      reviewedAt: new Date(),
      reviewNotes
    })
    .where(eq(templateShares.id, shareId));
}

export async function getCompanyWideTemplates(companyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  return db.select()
    .from(jobTemplates)
    .where(and(
      eq(jobTemplates.companyId, companyId),
      eq(jobTemplates.isCompanyWide, true)
    ))
    .orderBy(desc(jobTemplates.createdAt));
}

// Job View Analytics operations
export async function trackJobViewAnalytics(data: {
  jobId: number;
  userId?: number;
  sessionId: string;
  source?: string;
  deviceType?: string;
  referrer?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  // Check if this session has viewed this job in the last 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const [existingSession] = await db.select()
    .from(jobViewSessions)
    .where(and(
      eq(jobViewSessions.jobId, data.jobId),
      eq(jobViewSessions.sessionId, data.sessionId),
      gt(jobViewSessions.lastViewedAt, fiveMinutesAgo)
    ));
  
  if (existingSession) {
    // Update last viewed time
    await db.update(jobViewSessions)
      .set({ lastViewedAt: new Date() })
      .where(eq(jobViewSessions.id, existingSession.id));
    return; // Don't count as a new view
  }
  
  // Record or update session
  await db.insert(jobViewSessions)
    .values({
      jobId: data.jobId,
      userId: data.userId,
      sessionId: data.sessionId,
      lastViewedAt: new Date()
    })
    .onDuplicateKeyUpdate({
      set: { lastViewedAt: new Date() }
    });
  
  // Record the view in analytics
  const today = new Date().toISOString().split('T')[0];
  await db.insert(jobViewAnalytics)
    .values({
      jobId: data.jobId,
      userId: data.userId,
      viewDate: today,
      viewCount: 1,
      source: data.source,
      deviceType: data.deviceType,
      referrer: data.referrer
    })
    .onDuplicateKeyUpdate({
      set: { viewCount: sql`viewCount + 1` }
    });
}

export async function getJobViewTrends(jobId: number, days: number = 30) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return db.select({
    date: jobViewAnalytics.viewDate,
    views: sum(jobViewAnalytics.viewCount).as('views')
  })
  .from(jobViewAnalytics)
  .where(and(
    eq(jobViewAnalytics.jobId, jobId),
    gte(jobViewAnalytics.viewDate, startDate.toISOString().split('T')[0])
  ))
  .groupBy(jobViewAnalytics.viewDate)
  .orderBy(jobViewAnalytics.viewDate);
}

export async function getTopPerformingJobs(companyId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  return db.select({
    jobId: jobs.id,
    jobTitle: jobs.title,
    totalViews: sum(jobViewAnalytics.viewCount).as('totalViews'),
    totalApplications: count(applications.id).as('totalApplications'),
    conversionRate: sql`(COUNT(${applications.id}) * 100.0 / NULLIF(SUM(${jobViewAnalytics.viewCount}), 0))`.as('conversionRate')
  })
  .from(jobs)
  .leftJoin(jobViewAnalytics, eq(jobs.id, jobViewAnalytics.jobId))
  .leftJoin(applications, eq(jobs.id, applications.jobId))
  .where(eq(jobs.companyId, companyId))
  .groupBy(jobs.id, jobs.title)
  .orderBy(desc(sql`totalViews`))
  .limit(limit);
}

export async function getSourceAttribution(jobId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  return db.select({
    source: jobViewAnalytics.source,
    views: sum(jobViewAnalytics.viewCount).as('views')
  })
  .from(jobViewAnalytics)
  .where(eq(jobViewAnalytics.jobId, jobId))
  .groupBy(jobViewAnalytics.source)
  .orderBy(desc(sql`views`));
}

export async function getDeviceAnalytics(jobId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  return db.select({
    deviceType: jobViewAnalytics.deviceType,
    views: sum(jobViewAnalytics.viewCount).as('views')
  })
  .from(jobViewAnalytics)
  .where(eq(jobViewAnalytics.jobId, jobId))
  .groupBy(jobViewAnalytics.deviceType)
  .orderBy(desc(sql`views`));
}

export async function trackApplicationSource(data: {
  applicationId: number;
  source?: string;
  referrer?: string;
  campaign?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  await db.insert(jobApplicationSources).values(data);
}

/**
 * Get applications for a recruiter's jobs within a date range (optimized for analytics)
 */
export async function getApplicationsByRecruiterAndDateRange(
  recruiterId: number,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  // Get recruiter's user ID first
  const recruiterRecord = await db.select({ userId: recruiters.userId })
    .from(recruiters)
    .where(eq(recruiters.id, recruiterId))
    .limit(1);
  
  if (!recruiterRecord[0]) return [];
  
  const userId = recruiterRecord[0].userId;
  
  // Get applications for jobs posted by this user, filtered by date range
  return await db.select({
    application: applications,
    job: jobs
  })
  .from(applications)
  .innerJoin(jobs, eq(applications.jobId, jobs.id))
  .where(
    and(
      eq(jobs.postedBy, userId),
      sql`${applications.submittedAt} >= ${startDate.toISOString()}`,
      sql`${applications.submittedAt} <= ${endDate.toISOString()}`
    )
  );
}

// ============================================
// Company Admin - Aggregated Data Functions
// ============================================

/**
 * Get all jobs from all recruiters in a company with pagination
 */
export async function getCompanyJobsPaginated(
  companyId: number,
  params: PaginationParams & {
    search?: string;
    status?: string;
    employmentType?: string;
  }
): Promise<PaginatedResponse<any>> {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const { limit, offset } = getPaginationLimitOffset(params);
  
  // Get all user IDs in the company with recruiter role
  const companyUsers = await db.select({ id: users.id })
    .from(users)
    .where(and(
      eq(users.companyId, companyId),
      eq(users.role, 'recruiter')
    ));
  
  const recruiterIds = companyUsers.map(u => u.id);
  
  if (recruiterIds.length === 0) {
    return buildPaginatedResponse([], 0, params);
  }
  
  // Build where conditions
  const conditions = [inArray(jobs.postedBy, recruiterIds)];
  
  if (params.search) {
    conditions.push(
      sql`(${jobs.title} LIKE ${`%${params.search}%`} OR ${jobs.description} LIKE ${`%${params.search}%`})`
    );
  }
  
  if (params.status) {
    conditions.push(eq(jobs.status, params.status as any));
  }
  
  if (params.employmentType) {
    conditions.push(eq(jobs.employmentType, params.employmentType as any));
  }
  
  // Get total count
  const [countResult] = await db.select({ count: sql<number>`count(*)` })
    .from(jobs)
    .where(and(...conditions));
  
  const total = Number(countResult?.count || 0);
  
  // Get paginated results with recruiter info
  const results = await db.select({
    job: jobs,
    recruiter: {
      id: users.id,
      name: users.name,
      email: users.email,
    },
    customer: customers,
  })
  .from(jobs)
  .leftJoin(users, eq(jobs.postedBy, users.id))
  .leftJoin(customers, eq(jobs.customerId, customers.id))
  .where(and(...conditions))
  .orderBy(desc(jobs.createdAt))
  .limit(limit)
  .offset(offset);
  
  return buildPaginatedResponse(results, total, params);
}

/**
 * Get all applicants from all jobs in a company with pagination
 */
export async function getCompanyApplicantsPaginated(
  companyId: number,
  params: PaginationParams & {
    search?: string;
    status?: string;
    jobId?: number;
  }
): Promise<PaginatedResponse<any>> {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  try {
    const { limit, offset } = getPaginationLimitOffset(params);
  
    // Get all user IDs in the company with recruiter role
    const companyUsers = await db.select({ id: users.id })
      .from(users)
      .where(and(
        eq(users.companyId, companyId),
        eq(users.role, 'recruiter')
      ));
    
    const recruiterIds = companyUsers.map(u => u.id);
    
    if (recruiterIds.length === 0) {
      return buildPaginatedResponse([], 0, params);
    }
    
    // Build where conditions - applications for jobs posted by company recruiters
    const conditions = [inArray(jobs.postedBy, recruiterIds)];
    
    if (params.status) {
      conditions.push(eq(applications.status, params.status as any));
    }
    
    if (params.jobId) {
      conditions.push(eq(applications.jobId, params.jobId));
    }
    
    if (params.search) {
      conditions.push(
        sql`(${users.name} LIKE ${`%${params.search}%`} OR ${users.email} LIKE ${`%${params.search}%`})`
      );
    }
    
    // Get total count
    const [countResult] = await db.select({ count: sql<number>`count(*)` })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .innerJoin(candidates, eq(applications.candidateId, candidates.id))
      .innerJoin(users, eq(candidates.userId, users.id))
      .where(and(...conditions));
    
    const total = Number(countResult?.count || 0);
    
    // Get paginated results
    const results = await db.select({
      application: applications,
      job: {
        id: jobs.id,
        title: jobs.title,
        companyName: jobs.companyName,
        location: jobs.location,
        employmentType: jobs.employmentType,
      },
      candidate: {
        id: candidates.id,
        userId: candidates.userId,
        title: candidates.title,
        location: candidates.location,
        skills: candidates.skills,
        experience: candidates.experience,
        resumeUrl: candidates.resumeUrl,
      },
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .innerJoin(candidates, eq(applications.candidateId, candidates.id))
    .innerJoin(users, eq(candidates.userId, users.id))
    .where(and(...conditions))
    .orderBy(desc(applications.submittedAt))
    .limit(limit)
    .offset(offset);
    
    return buildPaginatedResponse(results, total, params);
  } catch (error: any) {
    console.error('[getCompanyApplicantsPaginated] Error:', error?.message || error);
    // Return empty result on error
    return buildPaginatedResponse([], 0, params);
  }
}

/**
 * Get all candidates (from applications) in a company with pagination
 */
export async function getCompanyCandidatesPaginated(
  companyId: number,
  params: PaginationParams & {
    search?: string;
    skills?: string;
    location?: string;
  }
): Promise<PaginatedResponse<any>> {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const { limit, offset } = getPaginationLimitOffset(params);
  
  // Get all recruiter IDs in the company
  const companyRecruiters = await db.select({ id: recruiters.id })
    .from(recruiters)
    .innerJoin(users, eq(recruiters.userId, users.id))
    .where(eq(users.companyId, companyId));
  
  const recruiterIds = companyRecruiters.map(r => r.id);
  
  if (recruiterIds.length === 0) {
    return buildPaginatedResponse([], 0, params);
  }
  
  // Build conditions for filtering candidates added by company recruiters
  const conditions = [inArray(candidates.addedBy, recruiterIds)];
  
  if (params.search) {
    conditions.push(
      sql`(${users.name} LIKE ${`%${params.search}%`} OR ${users.email} LIKE ${`%${params.search}%`})`
    );
  }
  
  if (params.skills) {
    conditions.push(sql`${candidates.skills} LIKE ${`%${params.skills}%`}`);
  }
  
  if (params.location) {
    conditions.push(sql`${candidates.location} LIKE ${`%${params.location}%`}`);
  }
  
  // Get candidates added by company recruiters with their application count
  const results = await db.select({
    candidate: candidates,
    user: {
      id: users.id,
      name: users.name,
      email: users.email,
    },
    recruiter: {
      id: recruiters.id,
      companyName: recruiters.companyName,
    },
    applicationCount: sql<number>`COUNT(DISTINCT ${applications.id})`,
    latestApplication: sql<string>`MAX(${applications.submittedAt})`,
  })
  .from(candidates)
  .innerJoin(users, eq(candidates.userId, users.id))
  .leftJoin(recruiters, eq(candidates.addedBy, recruiters.id))
  .leftJoin(applications, eq(candidates.id, applications.candidateId))
  .where(and(...conditions))
  .groupBy(candidates.id, users.id, recruiters.id)
  .orderBy(desc(candidates.createdAt))
  .limit(limit)
  .offset(offset);
  
  // Get total count of candidates
  const countResults = await db.select({
    candidateId: candidates.id,
  })
  .from(candidates)
  .innerJoin(users, eq(candidates.userId, users.id))
  .leftJoin(recruiters, eq(candidates.addedBy, recruiters.id))
  .where(and(...conditions))
  .groupBy(candidates.id);
  
  const total = countResults.length;
  
  return buildPaginatedResponse(results, total, params);
}

/**
 * Get all associates (team members) in a company with pagination
 */
export async function getCompanyAssociatesPaginated(
  companyId: number,
  params: PaginationParams & {
    search?: string;
    status?: string;
  }
): Promise<PaginatedResponse<any>> {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const { limit, offset } = getPaginationLimitOffset(params);
  
  // Build where conditions
  const conditions = [eq(associates.companyId, companyId)];
  
  if (params.search) {
    conditions.push(
      sql`(${associates.name} LIKE ${`%${params.search}%`} OR ${associates.email} LIKE ${`%${params.search}%`})`
    );
  }
  
  if (params.status) {
    conditions.push(eq(associates.status, params.status as any));
  }
  
  // Get total count
  const [countResult] = await db.select({ count: sql<number>`count(*)` })
    .from(associates)
    .where(and(...conditions));
  
  const total = Number(countResult?.count || 0);
  
  // Get paginated results
  const results = await db.select()
    .from(associates)
    .where(and(...conditions))
    .orderBy(desc(associates.createdAt))
    .limit(limit)
    .offset(offset);
  
  return buildPaginatedResponse(results, total, params);
}

// Guest Application operations
export async function createGuestApplication(guestApp: InsertGuestApplication) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(guestApplications).values(guestApp);
  return result;
}

export async function getGuestApplicationById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(guestApplications).where(eq(guestApplications.id, id)).limit(1);
  return result[0] || null;
}

export async function getGuestApplicationsByEmail(email: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(guestApplications).where(eq(guestApplications.email, email.toLowerCase()));
}

export async function getUnclaimedGuestApplicationsByEmail(email: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(guestApplications)
    .where(and(
      eq(guestApplications.email, email.toLowerCase()),
      eq(guestApplications.claimed, false)
    ));
}

export async function claimGuestApplication(guestAppId: number, candidateId: number, applicationId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(guestApplications)
    .set({
      claimed: true,
      claimedBy: candidateId,
      claimedAt: new Date(),
      applicationId: applicationId
    })
    .where(eq(guestApplications.id, guestAppId));
}

export async function updateGuestApplicationInvitation(guestAppId: number) {
  const db = await getDb();
  if (!db) return;
  
  // Get current invitation count
  const current = await db.select().from(guestApplications).where(eq(guestApplications.id, guestAppId)).limit(1);
  const currentCount = current[0]?.invitationCount || 0;
  
  await db.update(guestApplications)
    .set({
      invitationSent: true,
      invitedAt: new Date(),
      invitationCount: currentCount + 1
    })
    .where(eq(guestApplications.id, guestAppId));
}

// ============================================
// Job Drafts Functions (Auto-save)
// ============================================

/**
 * Create or update a job draft for auto-save
 */
export async function upsertJobDraft(userId: number, draftData: Partial<InsertJobDraft>) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  // Check if draft already exists for this user
  const existing = await db.select()
    .from(jobDrafts)
    .where(eq(jobDrafts.userId, userId))
    .limit(1);
  
  if (existing.length > 0) {
    // Update existing draft
    await db.update(jobDrafts)
      .set({
        ...draftData,
        lastSavedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(jobDrafts.userId, userId));
    return existing[0].id;
  } else {
    // Create new draft
    const [result] = await db.insert(jobDrafts).values({
      userId,
      ...draftData,
      lastSavedAt: new Date()
    });
    return result.insertId;
  }
}

/**
 * Get the latest job draft for a user
 */
export async function getJobDraftByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const [draft] = await db.select()
    .from(jobDrafts)
    .where(eq(jobDrafts.userId, userId))
    .orderBy(desc(jobDrafts.lastSavedAt))
    .limit(1);
  
  return draft || null;
}

/**
 * Delete a job draft
 */
export async function deleteJobDraft(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  await db.delete(jobDrafts)
    .where(eq(jobDrafts.userId, userId));
}

// ============================================
// Enhanced Job Template Functions
// ============================================

/**
 * Get job templates accessible to a user (own + company-wide)
 */
export async function getAccessibleJobTemplates(userId: number, companyId: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  if (!companyId) {
    // No company - only return user's own templates
    return await db.select()
      .from(jobTemplates)
      .where(eq(jobTemplates.createdBy, userId))
      .orderBy(desc(jobTemplates.usageCount), desc(jobTemplates.createdAt));
  }
  
  // Return user's own templates + company-wide templates
  return await db.select()
    .from(jobTemplates)
    .where(
      or(
        eq(jobTemplates.createdBy, userId),
        and(
          eq(jobTemplates.companyId, companyId),
          eq(jobTemplates.isCompanyWide, true)
        )
      )
    )
    .orderBy(desc(jobTemplates.usageCount), desc(jobTemplates.createdAt));
}

/**
 * Increment template usage count and update last used timestamp
 */
export async function recordTemplateUsage(templateId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  await db.execute(sql`
    UPDATE job_templates 
    SET usageCount = usageCount + 1,
        lastUsedAt = NOW()
    WHERE id = ${templateId}
  `);
}

/**
 * Check if user can access a template
 */
export async function canAccessTemplate(userId: number, templateId: number, companyId: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const [template] = await db.select()
    .from(jobTemplates)
    .where(eq(jobTemplates.id, templateId));
  
  if (!template) return false;
  
  // User is the creator
  if (template.createdBy === userId) return true;
  
  // Template is company-wide and user is in the same company
  if (companyId && template.companyId === companyId && template.isCompanyWide) {
    return true;
  }
  
  return false;
}

// ============================================
// Bulk Upload Jobs Functions
// ============================================

export async function createBulkUploadJob(jobData: Omit<InsertBulkUploadJob, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const result = await db.insert(bulkUploadJobs).values(jobData);
  return { id: Number(result[0].insertId), ...jobData };
}

export async function updateBulkUploadJobStatus(
  jobId: number, 
  status: 'pending' | 'processing' | 'completed' | 'failed',
  updates: Partial<InsertBulkUploadJob>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  await db.update(bulkUploadJobs)
    .set({ status, ...updates })
    .where(eq(bulkUploadJobs.id, jobId));
}

export async function getBulkUploadJobById(jobId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select()
    .from(bulkUploadJobs)
    .where(eq(bulkUploadJobs.id, jobId))
    .limit(1);
  
  return result[0] || null;
}

export async function getBulkUploadJobsByRecruiter(recruiterId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(bulkUploadJobs)
    .where(eq(bulkUploadJobs.recruiterId, recruiterId))
    .orderBy(desc(bulkUploadJobs.createdAt));
}

export async function sendBulkUploadCompletionEmail(params: {
  jobId: number;
  recipientEmail: string;
  recipientName: string;
  fileName: string;
  totalRecords: number;
  successCount: number;
  failureCount: number;
  failedRecordsUrl?: string;
}) {
  const db = await getDb();
  if (!db) return;
  
  try {
    // Import email service
    const { sendEmail } = await import('./_core/email');
    
    const subject = `Bulk Upload Complete: ${params.fileName}`;
    const html = `
      <h2>Bulk Candidate Upload Complete</h2>
      <p>Hello ${params.recipientName},</p>
      <p>Your bulk candidate upload has finished processing.</p>
      
      <h3>Summary</h3>
      <ul>
        <li><strong>File:</strong> ${params.fileName}</li>
        <li><strong>Total Records:</strong> ${params.totalRecords}</li>
        <li><strong>Successfully Imported:</strong> ${params.successCount}</li>
        <li><strong>Failed:</strong> ${params.failureCount}</li>
      </ul>
      
      ${params.failureCount > 0 && params.failedRecordsUrl ? `
        <p>
          <strong>Failed Records:</strong> 
          <a href="${params.failedRecordsUrl}">Download failed records CSV</a>
        </p>
        <p>You can review and correct the failed records, then re-upload them.</p>
      ` : ''}
      
      <p>
        <a href="${process.env.VITE_FRONTEND_FORGE_API_URL || 'https://app.hotgigs.com'}/recruiter/bulk-upload-history">
          View Upload History
        </a>
      </p>
      
      <p>Thank you for using HotGigs!</p>
    `;
    
    await sendEmail({
      to: params.recipientEmail,
      subject,
      html,
    });
    
    // Mark email as sent
    await db.update(bulkUploadJobs)
      .set({ 
        emailNotificationSent: true,
        emailSentAt: new Date()
      })
      .where(eq(bulkUploadJobs.id, params.jobId));
      
  } catch (error) {
    console.error('[sendBulkUploadCompletionEmail] Error:', error);
  }
}
