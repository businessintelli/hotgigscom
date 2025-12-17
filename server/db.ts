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
  applications, InsertApplication,
  interviews, InsertInterview,
  interviewQuestions, InsertInterviewQuestion,
  interviewResponses, InsertInterviewResponse,
  savedSearches, InsertSavedSearch,
  savedJobs, InsertSavedJob,
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
  systemHealthMetrics, InsertSystemHealthMetric
} from "../drizzle/schema";
import { ENV } from './_core/env';

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
      
      // Create connection pool
      const connection = await mysql2.createConnection(process.env.DATABASE_URL!);
      
      // Test the connection
      await connection.execute("SELECT 1");
      console.log("[Database] Connection test successful");
      
      // Create drizzle instance
      _db = drizzle(connection);
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
  const result = await db.insert(candidates).values(candidate);
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

export async function getAllApplications() {
  const db = await getDb();
  if (!db) return [];
  
  // Join with users table to get candidate name
  const result = await db
    .select({
      id: applications.id,
      jobId: applications.jobId,
      candidateId: applications.candidateId,
      candidateName: users.name,
      candidateEmail: users.email,
      resumeUrl: applications.resumeUrl,
      coverLetter: applications.coverLetter,
      status: applications.status,
      appliedAt: applications.appliedAt,
      updatedAt: applications.updatedAt,
      videoIntroductionId: applications.videoIntroductionId,
      resumeProfileId: applications.resumeProfileId,
    })
    .from(applications)
    .leftJoin(candidates, eq(applications.candidateId, candidates.id))
    .leftJoin(users, eq(candidates.userId, users.id));
  
  return result;
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

export async function deleteSavedJob(candidateId: number, jobId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(savedJobs).where(and(eq(savedJobs.candidateId, candidateId), eq(savedJobs.jobId, jobId)));
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
import { eq, and, inArray, count, sql, desc } from "drizzle-orm";


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
  
  // Get all recruiters in the company
  const companyUsers = await db.select({ id: users.id })
    .from(users)
    .where(and(eq(users.companyId, companyId), eq(users.role, 'recruiter')));
  
  const recruiterIds = companyUsers.map(u => u.id);
  
  if (recruiterIds.length === 0) {
    return {
      totalJobs: 0,
      activeJobs: 0,
      totalApplications: 0,
      totalCandidates: 0,
      totalAssociates: 0,
      totalInterviews: 0,
      totalPlacements: 0
    };
  }
  
  // Count jobs
  const jobCounts = await db.select({
    total: count(),
    active: count(sql`CASE WHEN ${jobs.status} = 'open' THEN 1 END`)
  })
  .from(jobs)
  .where(inArray(jobs.recruiterId, recruiterIds));
  
  // Count applications
  const appCounts = await db.select({ count: count() })
    .from(applications)
    .where(inArray(applications.recruiterId, recruiterIds));
  
  // Count candidates
  const candidateCounts = await db.select({ count: count() })
    .from(candidates)
    .innerJoin(users, eq(candidates.userId, users.id))
    .where(eq(users.companyId, companyId));
  
  // Count associates
  const associateCounts = await db.select({ count: count() })
    .from(associates)
    .where(inArray(associates.recruiterId, recruiterIds));
  
  // Count interviews
  const interviewCounts = await db.select({ count: count() })
    .from(interviews)
    .where(inArray(interviews.recruiterId, recruiterIds));
  
  // Count placements (hired applications)
  const placementCounts = await db.select({ count: count() })
    .from(applications)
    .where(and(
      inArray(applications.recruiterId, recruiterIds),
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
  
  // Get all recruiters in the company
  const companyRecruiters = await db.select({
    id: users.id,
    name: users.name,
    email: users.email
  })
  .from(users)
  .where(and(eq(users.companyId, companyId), eq(users.role, 'recruiter')));
  
  const performance = [];
  
  for (const recruiter of companyRecruiters) {
    // Count jobs
    const jobCount = await db.select({ count: count() })
      .from(jobs)
      .where(eq(jobs.recruiterId, recruiter.id));
    
    // Count applications
    const appCount = await db.select({ count: count() })
      .from(applications)
      .where(eq(applications.recruiterId, recruiter.id));
    
    // Count interviews
    const interviewCount = await db.select({ count: count() })
      .from(interviews)
      .where(eq(interviews.recruiterId, recruiter.id));
    
    // Count placements
    const placementCount = await db.select({ count: count() })
      .from(applications)
      .where(and(
        eq(applications.recruiterId, recruiter.id),
        eq(applications.status, 'hired')
      ));
    
    performance.push({
      recruiter,
      metrics: {
        jobsPosted: jobCount[0]?.count || 0,
        applications: appCount[0]?.count || 0,
        interviews: interviewCount[0]?.count || 0,
        placements: placementCount[0]?.count || 0
      }
    });
  }
  
  return performance;
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
  
  return await db.select({
    log: userActivityLogs,
    user: users
  })
  .from(userActivityLogs)
  .innerJoin(users, eq(userActivityLogs.userId, users.id))
  .where(eq(userActivityLogs.companyId, companyId))
  .orderBy(desc(userActivityLogs.createdAt))
  .limit(limit);
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
export async function getDashboardStats(recruiterId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const [jobsResult] = await db.select({ count: count() })
    .from(jobs)
    .where(eq(jobs.recruiterId, recruiterId));
  
  const [applicationsResult] = await db.select({ count: count() })
    .from(applications)
    .where(eq(applications.recruiterId, recruiterId));
  
  const [interviewsResult] = await db.select({ count: count() })
    .from(interviews)
    .where(eq(interviews.recruiterId, recruiterId));
  
  const [candidatesResult] = await db.select({ count: count() })
    .from(candidates)
    .where(eq(candidates.recruiterId, recruiterId));
  
  return {
    totalJobs: jobsResult?.count || 0,
    totalApplications: applicationsResult?.count || 0,
    totalInterviews: interviewsResult?.count || 0,
    totalCandidates: candidatesResult?.count || 0,
  };
}

/**
 * Get pending reschedule requests for recruiter
 */
export async function getPendingRescheduleRequests(recruiterId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  return await db.select()
    .from(rescheduleRequests)
    .where(
      and(
        eq(rescheduleRequests.recruiterId, recruiterId),
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
 * Get public jobs (all active jobs)
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
