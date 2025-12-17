import { eq, and, desc, sql, or, like, gte, lte, inArray } from "drizzle-orm";
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
  inmailTemplates, InsertInmailTemplate
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _dbInitializing = false;

export async function getDb() {
  // If database is already initialized, return it
  if (_db) {
    return _db;
  }
  
  // If database is currently initializing, wait a bit and retry
  if (_dbInitializing) {
    await new Promise(resolve => setTimeout(resolve, 100));
    return getDb();
  }
  
  // Check if DATABASE_URL is available
  if (!process.env.DATABASE_URL) {
    console.error("[Database] DATABASE_URL environment variable is not set");
    return null;
  }
  
  // Initialize database connection
  _dbInitializing = true;
  try {
    console.log("[Database] Initializing connection...");
    _db = drizzle(process.env.DATABASE_URL);
    console.log("[Database] Connection established successfully");
  } catch (error) {
    console.error("[Database] Failed to connect:", error);
    _db = null;
  } finally {
    _dbInitializing = false;
  }
  
  return _db;
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
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }
    
    // Handle boolean fields
    if (user.emailVerified !== undefined) {
      values.emailVerified = user.emailVerified;
      updateSet.emailVerified = user.emailVerified;
    }
    
    // Handle timestamp fields
    if (user.verificationTokenExpiry !== undefined) {
      values.verificationTokenExpiry = user.verificationTokenExpiry;
      updateSet.verificationTokenExpiry = user.verificationTokenExpiry;
    }
    if (user.passwordResetTokenExpiry !== undefined) {
      values.passwordResetTokenExpiry = user.passwordResetTokenExpiry;
      updateSet.passwordResetTokenExpiry = user.passwordResetTokenExpiry;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUser(user: InsertUser): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(users).values(user);
  return Number((result as any).insertId);
}

export async function updateUserLastSignedIn(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, userId));
}

// Recruiter operations
export async function createRecruiter(recruiter: InsertRecruiter) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(recruiters).values(recruiter);
  return result;
}

export async function getRecruiterByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(recruiters).where(eq(recruiters.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateRecruiter(id: number, data: Partial<InsertRecruiter>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(recruiters).set(data).where(eq(recruiters.id, id));
}

// Candidate operations
export async function createCandidate(candidate: InsertCandidate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(candidates).values(candidate);
  return result;
}

export async function getCandidateByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  // Get candidate data
  const candidateResult = await db.select().from(candidates).where(eq(candidates.userId, userId)).limit(1);
  if (candidateResult.length === 0) return undefined;
  
  // Get user data
  const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const user = userResult.length > 0 ? userResult[0] : null;
  
  // Combine data
  const candidate = candidateResult[0];
  return {
    ...candidate,
    fullName: user?.name || '',
    email: user?.email || '',
    phone: candidate.phoneNumber,
    experienceYears: candidate.experience ? parseInt(candidate.experience) : 0,
  };
}

// Interview functions
export async function createInterview(interview: InsertInterview) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(interviews).values(interview);
  return result;
}

export async function getInterviewById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select({
      interview: interviews,
      candidate: candidates,
      candidateUser: users,
      job: jobs,
      application: applications,
    })
    .from(interviews)
    .leftJoin(candidates, eq(interviews.candidateId, candidates.id))
    .leftJoin(users, eq(candidates.userId, users.id))
    .leftJoin(jobs, eq(interviews.jobId, jobs.id))
    .leftJoin(applications, eq(interviews.applicationId, applications.id))
    .where(eq(interviews.id, id))
    .limit(1);
  return result[0];
}

export async function getInterviewsByRecruiterId(recruiterId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      interview: interviews,
      candidate: candidates,
      candidateUser: users,
      job: jobs,
      application: applications,
    })
    .from(interviews)
    .leftJoin(candidates, eq(interviews.candidateId, candidates.id))
    .leftJoin(users, eq(candidates.userId, users.id))
    .leftJoin(jobs, eq(interviews.jobId, jobs.id))
    .leftJoin(applications, eq(interviews.applicationId, applications.id))
    .where(eq(interviews.recruiterId, recruiterId))
    .orderBy(desc(interviews.scheduledAt));
}

export async function getUpcomingInterviews(startTime: Date, endTime: Date) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      interview: interviews,
      candidate: candidates,
      candidateUser: users,
      job: jobs,
      application: applications,
    })
    .from(interviews)
    .leftJoin(candidates, eq(interviews.candidateId, candidates.id))
    .leftJoin(users, eq(candidates.userId, users.id))
    .leftJoin(jobs, eq(interviews.jobId, jobs.id))
    .leftJoin(applications, eq(interviews.applicationId, applications.id))
    .where(
      and(
        gte(interviews.scheduledAt, startTime),
        lte(interviews.scheduledAt, endTime),
        eq(interviews.status, "scheduled")
      )
    )
    .orderBy(interviews.scheduledAt);
}

export async function checkReminderSent(interviewId: number, hoursBeforeInterview: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  // For now, we'll use a simple check based on interview notes
  // In production, you'd want a separate reminders table
  const interview = await getInterviewById(interviewId);
  if (!interview) return false;
  
  const reminderKey = `reminder_${hoursBeforeInterview}h_sent`;
  const notes = interview.interview.notes || "";
  return notes.includes(reminderKey);
}

export async function markReminderSent(interviewId: number, hoursBeforeInterview: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  // For now, we'll append to notes
  // In production, you'd want a separate reminders table
  const interview = await getInterviewById(interviewId);
  if (!interview) return;
  
  const reminderKey = `reminder_${hoursBeforeInterview}h_sent`;
  const currentNotes = interview.interview.notes || "";
  const updatedNotes = currentNotes + `\n[System] ${reminderKey} at ${new Date().toISOString()}`;
  
  await updateInterview(interviewId, { notes: updatedNotes });
}

export async function getInterviewsByCandidateId(candidateId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      interview: interviews,
      job: jobs,
      recruiter: recruiters,
    })
    .from(interviews)
    .leftJoin(jobs, eq(interviews.jobId, jobs.id))
    .leftJoin(recruiters, eq(interviews.recruiterId, recruiters.id))
    .where(eq(interviews.candidateId, candidateId))
    .orderBy(desc(interviews.scheduledAt));
}

export async function updateInterview(id: number, updates: Partial<InsertInterview>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(interviews).set(updates).where(eq(interviews.id, id));
}

export async function deleteInterview(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(interviews).where(eq(interviews.id, id));
}

export async function getCandidateById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(candidates).where(eq(candidates.id, id)).limit(1);
  if (result.length === 0) return undefined;
  
  const candidate = result[0];
  // Get user data
  const userResult = await db.select().from(users).where(eq(users.id, candidate.userId)).limit(1);
  const user = userResult.length > 0 ? userResult[0] : null;
  
  return {
    ...candidate,
    fullName: user?.name || '',
    email: user?.email || '',
    phone: candidate.phoneNumber,
    experienceYears: candidate.experience ? parseInt(candidate.experience) : 0,
  };
}

export async function updateCandidate(id: number, data: Partial<InsertCandidate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(candidates).set(data).where(eq(candidates.id, id));
}

export async function getAllCandidates() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(candidates).orderBy(desc(candidates.createdAt));
}

// Customer operations
export async function createCustomer(customer: InsertCustomer) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(customers).values(customer);
  return result;
}

export async function getCustomersByCreator(createdBy: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(customers).where(eq(customers.createdBy, createdBy)).orderBy(desc(customers.createdAt));
}

export async function getAllCustomers() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(customers).orderBy(desc(customers.createdAt));
}

export async function updateCustomer(id: number, data: Partial<InsertCustomer>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(customers).set(data).where(eq(customers.id, id));
}

export async function deleteCustomer(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(customers).where(eq(customers.id, id));
}

// Customer Contact operations
export async function createCustomerContact(contact: InsertCustomerContact) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(customerContacts).values(contact);
  return result;
}

export async function getContactsByCustomer(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(customerContacts).where(eq(customerContacts.customerId, customerId));
}

export async function updateCustomerContact(id: number, data: Partial<InsertCustomerContact>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(customerContacts).set(data).where(eq(customerContacts.id, id));
}

export async function deleteCustomerContact(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(customerContacts).where(eq(customerContacts.id, id));
}

// Job operations
export async function createJob(job: InsertJob) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(jobs).values(job);
  // Return the inserted ID for skill matrix linking
  const insertId = (result as any)[0]?.insertId || (result as any).insertId;
  return { insertId };
}

export async function getJobById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getJobsByRecruiter(postedBy: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(jobs).where(eq(jobs.postedBy, postedBy)).orderBy(desc(jobs.createdAt));
}

export async function getPublicJobs() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(jobs).where(and(eq(jobs.isPublic, true), eq(jobs.status, "active"))).orderBy(desc(jobs.createdAt));
}

export async function updateJob(id: number, data: Partial<InsertJob>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(jobs).set(data).where(eq(jobs.id, id));
}

export async function deleteJob(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(jobs).where(eq(jobs.id, id));
}

export async function searchJobs(filters: {
  keyword?: string;
  location?: string;
  employmentType?: string;
  salaryMin?: number;
  salaryMax?: number;
  experienceLevel?: string;
  remoteOption?: string;
  skills?: string[];
}) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [
    eq(jobs.isPublic, true),
    eq(jobs.status, "active")
  ];
  
  // Keyword search (title, description, requirements)
  if (filters.keyword && filters.keyword.trim()) {
    const keywordPattern = `%${filters.keyword.trim()}%`;
    conditions.push(
      or(
        like(jobs.title, keywordPattern),
        like(jobs.description, keywordPattern),
        like(jobs.requirements, keywordPattern)
      )!
    );
  }
  
  // Location filter
  if (filters.location && filters.location.trim()) {
    const locationPattern = `%${filters.location.trim()}%`;
    conditions.push(like(jobs.location, locationPattern));
  }
  
  // Employment type filter
  if (filters.employmentType && filters.employmentType !== "all") {
    conditions.push(eq(jobs.employmentType, filters.employmentType as any));
  }
  
  // Salary range filter
  if (filters.salaryMin !== undefined) {
    conditions.push(gte(jobs.salaryMax, filters.salaryMin));
  }
  if (filters.salaryMax !== undefined) {
    conditions.push(lte(jobs.salaryMin, filters.salaryMax));
  }
  
  // Remote option filter (check if location contains remote/hybrid keywords)
  if (filters.remoteOption && filters.remoteOption !== "all") {
    if (filters.remoteOption === "remote") {
      conditions.push(like(jobs.location, "%remote%"));
    } else if (filters.remoteOption === "hybrid") {
      conditions.push(like(jobs.location, "%hybrid%"));
    } else if (filters.remoteOption === "onsite") {
      // Onsite means NOT remote and NOT hybrid
      conditions.push(
        and(
          sql`${jobs.location} NOT LIKE '%remote%'`,
          sql`${jobs.location} NOT LIKE '%hybrid%'`
        )!
      );
    }
  }
  
  // Experience level filter (check title and requirements for keywords)
  if (filters.experienceLevel && filters.experienceLevel !== "all") {
    const levelKeywords: Record<string, string[]> = {
      entry: ["junior", "entry", "graduate", "0-2 years", "1-2 years"],
      mid: ["mid", "intermediate", "2-5 years", "3-5 years"],
      senior: ["senior", "5+ years", "7+ years", "experienced"],
      lead: ["lead", "principal", "staff", "architect", "manager"]
    };
    
    const keywords = levelKeywords[filters.experienceLevel] || [];
    if (keywords.length > 0) {
      const levelConditions = keywords.map(keyword => 
        or(
          like(jobs.title, `%${keyword}%`),
          like(jobs.requirements, `%${keyword}%`)
        )!
      );
      conditions.push(or(...levelConditions)!);
    }
  }
  
  // Skills filter (check requirements for skill keywords)
  if (filters.skills && filters.skills.length > 0) {
    const skillConditions = filters.skills.map(skill => 
      like(jobs.requirements, `%${skill}%`)
    );
    conditions.push(or(...skillConditions)!);
  }
  
  return await db.select().from(jobs).where(and(...conditions)).orderBy(desc(jobs.createdAt));
}

// Application operations
export async function createApplication(application: InsertApplication) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(applications).values(application);
  // Return the inserted ID for skill ratings linking
  const insertId = (result as any)[0]?.insertId || (result as any).insertId;
  return { insertId };
}

export async function getApplicationById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
  return result[0] || null;
}

export async function getApplicationsByJob(jobId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(applications).where(eq(applications.jobId, jobId)).orderBy(desc(applications.submittedAt));
}

export async function getAllApplications() {
  const db = await getDb();
  if (!db) return [];
  
  const results = await db
    .select()
    .from(applications)
    .leftJoin(candidates, eq(applications.candidateId, candidates.id))
    .leftJoin(users, eq(candidates.userId, users.id))
    .leftJoin(jobs, eq(applications.jobId, jobs.id))
    .leftJoin(videoIntroductions, eq(applications.videoIntroductionId, videoIntroductions.id))
    .leftJoin(resumeProfiles, eq(applications.resumeProfileId, resumeProfiles.id))
    .orderBy(desc(applications.submittedAt));
  
  return results.map((row: any) => ({
    ...row.applications,
    candidate: row.candidates ? {
      ...row.candidates,
      fullName: row.users?.name || 'Anonymous Candidate',
      email: row.users?.email,
    } : null,
    job: row.jobs,
    videoIntroduction: row.videoIntroductions,
    resumeProfile: row.resumeProfiles,
  }));
}

export async function getApplicationsByCandidate(candidateId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(applications).where(eq(applications.candidateId, candidateId)).orderBy(desc(applications.submittedAt));
}

// Get placed applications (offered status) for a candidate
export async function getPlacedApplicationsByCandidate(candidateId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      id: applications.id,
      jobId: applications.jobId,
      candidateId: applications.candidateId,
      status: applications.status,
      coverLetter: applications.coverLetter,
      createdAt: applications.submittedAt,
      job: {
        id: jobs.id,
        title: jobs.title,
        companyName: jobs.companyName,
        location: jobs.location,
        employmentType: jobs.employmentType,
        salaryMin: jobs.salaryMin,
        salaryMax: jobs.salaryMax,
      },
    })
    .from(applications)
    .leftJoin(jobs, eq(applications.jobId, jobs.id))
    .where(
      and(
        eq(applications.candidateId, candidateId),
        eq(applications.status, 'offered')
      )
    )
    .orderBy(desc(applications.submittedAt));
  
  return result;
}

export async function updateApplication(id: number, data: Partial<InsertApplication>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(applications).set(data).where(eq(applications.id, id));
}

// Dashboard statistics
export async function getDashboardStats(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const activeJobsCount = await db.select({ count: sql<number>`count(*)` })
    .from(jobs)
    .where(and(eq(jobs.postedBy, userId), eq(jobs.status, "active")));
  
  const totalApplicationsCount = await db.select({ count: sql<number>`count(*)` })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .where(eq(jobs.postedBy, userId));
  
  return {
    activeJobs: Number(activeJobsCount[0]?.count || 0),
    totalApplications: Number(totalApplicationsCount[0]?.count || 0),
    aiMatches: 0, // Placeholder for AI matching feature
    submittedToClients: 0, // Placeholder for submission tracking
  };
}

// Interview Question operations
export async function createInterviewQuestion(question: InsertInterviewQuestion) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(interviewQuestions).values(question);
  return result;
}

export async function getInterviewQuestions(interviewId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(interviewQuestions)
    .where(eq(interviewQuestions.interviewId, interviewId))
    .orderBy(interviewQuestions.orderIndex);
}

export async function getInterviewQuestionById(questionId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(interviewQuestions)
    .where(eq(interviewQuestions.id, questionId))
    .limit(1);
  
  return result[0] || null;
}

// Interview Response operations
export async function createInterviewResponse(response: InsertInterviewResponse) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(interviewResponses).values(response);
  // Get the inserted ID from the result
  const insertId = (result as any).insertId || (result as any)[0]?.insertId;
  
  if (!insertId) {
    throw new Error("Failed to get inserted response ID");
  }
  
  return { id: insertId as number };
}

export async function updateInterviewResponse(id: number, data: Partial<InsertInterviewResponse>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(interviewResponses)
    .set(data)
    .where(eq(interviewResponses.id, id));
}

export async function getInterviewResponses(interviewId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(interviewResponses)
    .where(eq(interviewResponses.interviewId, interviewId));
}

export async function getInterviewResponseWithQuestion(responseId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select({
      response: interviewResponses,
      question: interviewQuestions,
    })
    .from(interviewResponses)
    .leftJoin(interviewQuestions, eq(interviewResponses.questionId, interviewQuestions.id))
    .where(eq(interviewResponses.id, responseId))
    .limit(1);
  
  return result[0] || null;
}

export async function getInterviewWithQuestionsAndResponses(interviewId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const interview = await db
    .select()
    .from(interviews)
    .where(eq(interviews.id, interviewId))
    .limit(1);
  
  if (!interview[0]) return null;
  
  const questions = await getInterviewQuestions(interviewId);
  const responses = await getInterviewResponses(interviewId);
  
  return {
    interview: interview[0],
    questions,
    responses,
  };
}

export async function searchCandidates(filters: {
  keyword?: string;
  location?: string;
  experienceLevel?: string;
  skills?: string[];
  availability?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  
  // Keyword search (name, bio, skills)
  if (filters.keyword && filters.keyword.trim()) {
    const keywordPattern = `%${filters.keyword.trim()}%`;
    conditions.push(
      or(
        like(candidates.skills, keywordPattern),
        like(candidates.bio, keywordPattern)
      )!
    );
  }
  
  // Location filter
  if (filters.location && filters.location.trim()) {
    const locationPattern = `%${filters.location.trim()}%`;
    conditions.push(like(candidates.location, locationPattern));
  }
  
  // Experience level filter (stored in experience text field)
  if (filters.experienceLevel && filters.experienceLevel !== 'all') {
    const expPattern = `%${filters.experienceLevel}%`;
    conditions.push(like(candidates.experience, expPattern));
  }
  
  // Skills filter (check if any of the requested skills are in the candidate's skills)
  if (filters.skills && filters.skills.length > 0) {
    const skillConditions = filters.skills.map(skill => 
      like(candidates.skills, `%${skill}%`)
    );
    conditions.push(or(...skillConditions)!);
  }
  
  // Note: availability field doesn't exist in schema, removing this filter
  
  const query = db
    .select({
      candidate: candidates,
      user: users
    })
    .from(candidates)
    .leftJoin(users, eq(candidates.userId, users.id));
  
  if (conditions.length > 0) {
    return await query.where(and(...conditions));
  }
  
  return await query;
}

// Saved Searches operations
export async function createSavedSearch(search: InsertSavedSearch) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(savedSearches).values(search);
  return result;
}

export async function getSavedSearchesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(savedSearches)
    .where(eq(savedSearches.userId, userId))
    .orderBy(desc(savedSearches.createdAt));
}

export async function getSavedSearchById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(savedSearches)
    .where(eq(savedSearches.id, id))
    .limit(1);
  
  return result[0] || null;
}

export async function updateSavedSearch(id: number, data: Partial<InsertSavedSearch>) {
  const db = await getDb();
  if (!db) return;
  
  await db
    .update(savedSearches)
    .set(data)
    .where(eq(savedSearches.id, id));
}

export async function deleteSavedSearch(id: number) {
  const db = await getDb();
  if (!db) return;
  
  await db
    .delete(savedSearches)
    .where(eq(savedSearches.id, id));
}

export async function getSavedSearchesWithAlerts() {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(savedSearches)
    .where(eq(savedSearches.emailAlerts, true));
}

export async function getCandidateApplicationsWithDetails(candidateId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Get applications
  const apps = await db
    .select()
    .from(applications)
    .where(eq(applications.candidateId, candidateId))
    .orderBy(desc(applications.submittedAt));
  
  // For each application, get job and interview details
  const appsWithDetails = await Promise.all(
    apps.map(async (app) => {
      const job = await getJobById(app.jobId);
      const appInterviews = await db
        .select()
        .from(interviews)
        .where(eq(interviews.applicationId, app.id))
        .orderBy(desc(interviews.scheduledAt));
      
      return {
        ...app,
        job,
        interviews: appInterviews,
      };
    })
  );
  
  return appsWithDetails;
}

export async function getRecommendedJobsForCandidate(candidateId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  
  // Get candidate details
  const candidate = await getCandidateById(candidateId);
  if (!candidate) return [];
  
  // Get all active public jobs
  const activeJobs = await db
    .select()
    .from(jobs)
    .where(and(
      eq(jobs.status, 'active'),
      eq(jobs.isPublic, true)
    ));
  
  // Calculate match score for each job
  const candidateSkills = candidate.skills ? candidate.skills.toLowerCase().split(',').map((s: string) => s.trim()) : [];
  const candidateLocation = candidate.location?.toLowerCase() || '';
  const candidateExperience = candidate.experienceYears || 0;
  
  const jobsWithScores = activeJobs.map((job) => {
    let score = 0;
    let matchDetails = {
      skillsMatch: 0,
      locationMatch: 0,
      experienceMatch: 0,
      salaryMatch: 0,
    };
    
    // Skills matching (40% weight)
    if (job.requirements) {
      const jobRequirements = job.requirements.toLowerCase();
      const matchingSkills = candidateSkills.filter(skill => 
        jobRequirements.includes(skill)
      );
      matchDetails.skillsMatch = candidateSkills.length > 0 
        ? (matchingSkills.length / candidateSkills.length) * 100 
        : 0;
      score += matchDetails.skillsMatch * 0.4;
    }
    
    // Location matching (20% weight)
    if (job.location && candidateLocation) {
      const jobLocation = job.location.toLowerCase();
      if (jobLocation.includes(candidateLocation) || candidateLocation.includes(jobLocation)) {
        matchDetails.locationMatch = 100;
        score += 100 * 0.2;
      } else if (jobLocation.includes('remote') || candidateLocation.includes('remote')) {
        matchDetails.locationMatch = 80;
        score += 80 * 0.2;
      }
    }
    
    // Experience matching (25% weight)
    // Assume job requires similar experience to candidate's years
    if (candidateExperience > 0) {
      const experienceDiff = Math.abs(candidateExperience - (candidateExperience));
      matchDetails.experienceMatch = Math.max(0, 100 - (experienceDiff * 10));
      score += matchDetails.experienceMatch * 0.25;
    } else {
      matchDetails.experienceMatch = 50; // Neutral for entry-level
      score += 50 * 0.25;
    }
    
    // Salary matching (15% weight) - placeholder for now
    matchDetails.salaryMatch = 75; // Assume reasonable match
    score += 75 * 0.15;
    
    return {
      ...job,
      matchScore: Math.round(score),
      matchDetails,
    };
  });
  
  // Sort by match score and return top N
  return jobsWithScores
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}

// Saved Jobs
export async function saveJob(candidateId: number, jobId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(savedJobs).values({ candidateId, jobId });
}

export async function unsaveJob(candidateId: number, jobId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(savedJobs).where(and(
    eq(savedJobs.candidateId, candidateId),
    eq(savedJobs.jobId, jobId)
  ));
}

export async function getSavedJobs(candidateId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select({
      savedJob: savedJobs,
      job: jobs,
    })
    .from(savedJobs)
    .innerJoin(jobs, eq(savedJobs.jobId, jobs.id))
    .where(eq(savedJobs.candidateId, candidateId))
    .orderBy(desc(savedJobs.createdAt));
}

export async function isJobSaved(candidateId: number, jobId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db
    .select()
    .from(savedJobs)
    .where(and(
      eq(savedJobs.candidateId, candidateId),
      eq(savedJobs.jobId, jobId)
    ))
    .limit(1);
  return result.length > 0;
}


// Fraud Detection operations
export async function createFraudDetectionEvent(event: InsertFraudDetectionEvent) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(fraudDetectionEvents).values(event);
  return result[0].insertId;
}

export async function getFraudEventsByInterview(interviewId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(fraudDetectionEvents)
    .where(eq(fraudDetectionEvents.interviewId, interviewId))
    .orderBy(fraudDetectionEvents.timestamp);
}

export async function getFraudEventsByCandidate(candidateId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(fraudDetectionEvents)
    .where(eq(fraudDetectionEvents.candidateId, candidateId))
    .orderBy(desc(fraudDetectionEvents.timestamp));
}

export async function calculateFraudScore(interviewId: number): Promise<{
  score: number;
  riskLevel: 'low' | 'medium' | 'high';
  eventCounts: Record<string, number>;
}> {
  const events = await getFraudEventsByInterview(interviewId);
  
  // Count events by type
  const eventCounts: Record<string, number> = {};
  let totalScore = 0;
  
  // Weight different event types
  const weights = {
    no_face_detected: 5,
    multiple_faces_detected: 15,
    tab_switch: 3,
    window_blur: 2,
    audio_anomaly: 10,
    suspicious_behavior: 8,
  };
  
  events.forEach(event => {
    const eventType = event.eventType as keyof typeof weights;
    eventCounts[eventType] = (eventCounts[eventType] || 0) + 1;
    totalScore += weights[eventType] || 5;
  });
  
  // Normalize score to 0-100
  const score = Math.min(100, totalScore);
  
  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high';
  if (score < 20) {
    riskLevel = 'low';
  } else if (score < 50) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'high';
  }
  
  return { score, riskLevel, eventCounts };
}

// Resume Profile operations
export async function createResumeProfile(profile: InsertResumeProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(resumeProfiles).values(profile);
  return result;
}

export async function getResumeProfilesByCandidate(candidateId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(resumeProfiles)
    .where(eq(resumeProfiles.candidateId, candidateId))
    .orderBy(desc(resumeProfiles.isDefault), desc(resumeProfiles.createdAt));
}

export async function getResumeProfileById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(resumeProfiles)
    .where(eq(resumeProfiles.id, id))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function updateResumeProfile(id: number, data: Partial<InsertResumeProfile>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(resumeProfiles).set(data).where(eq(resumeProfiles.id, id));
}

export async function deleteResumeProfile(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(resumeProfiles).where(eq(resumeProfiles.id, id));
}

export async function setDefaultResumeProfile(candidateId: number, profileId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // First, unset all defaults for this candidate
  await db
    .update(resumeProfiles)
    .set({ isDefault: false })
    .where(eq(resumeProfiles.candidateId, candidateId));
  
  // Then set the new default
  await db
    .update(resumeProfiles)
    .set({ isDefault: true })
    .where(eq(resumeProfiles.id, profileId));
}

export async function countResumeProfiles(candidateId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(resumeProfiles)
    .where(eq(resumeProfiles.candidateId, candidateId));
  
  return result[0]?.count || 0;
}

// Video Introduction operations
export async function createVideoIntroduction(video: InsertVideoIntroduction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(videoIntroductions).values(video);
  return result;
}

export async function getVideoIntroductionByCandidate(candidateId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(videoIntroductions)
    .where(eq(videoIntroductions.candidateId, candidateId))
    .orderBy(desc(videoIntroductions.createdAt))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function getVideoIntroductionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(videoIntroductions)
    .where(eq(videoIntroductions.id, id))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function updateVideoIntroduction(id: number, data: Partial<InsertVideoIntroduction>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(videoIntroductions).set(data).where(eq(videoIntroductions.id, id));
}

export async function deleteVideoIntroduction(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(videoIntroductions).where(eq(videoIntroductions.id, id));
}


// Application Feedback Functions
export async function createApplicationFeedback(data: InsertApplicationFeedback) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(applicationFeedback).values(data);
}

export async function getApplicationFeedback(applicationId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(applicationFeedback)
    .leftJoin(recruiters, eq(applicationFeedback.recruiterId, recruiters.id))
    .leftJoin(users, eq(recruiters.userId, users.id))
    .where(eq(applicationFeedback.applicationId, applicationId))
    .orderBy(desc(applicationFeedback.createdAt));
  
  return result.map((row: any) => ({
    ...row.applicationFeedback,
    recruiter: {
      ...row.recruiters,
      user: row.users,
    },
  }));
}

export async function updateApplicationFeedback(id: number, data: Partial<InsertApplicationFeedback>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(applicationFeedback).set(data).where(eq(applicationFeedback.id, id));
}

export async function deleteApplicationFeedback(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(applicationFeedback).where(eq(applicationFeedback.id, id));
}


// Reschedule Request Functions
export async function createRescheduleRequest(data: InsertRescheduleRequest) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(rescheduleRequests).values(data);
  return result;
}

export async function getRescheduleRequestsByInterview(interviewId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select()
    .from(rescheduleRequests)
    .leftJoin(interviewPanelists, eq(rescheduleRequests.panelistId, interviewPanelists.id))
    .where(eq(rescheduleRequests.interviewId, interviewId))
    .orderBy(desc(rescheduleRequests.createdAt));
  
  return result.map((row: any) => ({
    ...row.reschedule_requests,
    panelist: row.interview_panelists,
  }));
}

export async function getPendingRescheduleRequests(recruiterId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Get all pending reschedule requests for interviews created by this recruiter
  const result = await db
    .select()
    .from(rescheduleRequests)
    .leftJoin(interviews, eq(rescheduleRequests.interviewId, interviews.id))
    .leftJoin(interviewPanelists, eq(rescheduleRequests.panelistId, interviewPanelists.id))
    .leftJoin(applications, eq(interviews.applicationId, applications.id))
    .leftJoin(jobs, eq(applications.jobId, jobs.id))
    .leftJoin(candidates, eq(applications.candidateId, candidates.id))
    .leftJoin(users, eq(candidates.userId, users.id))
    .where(
      and(
        eq(rescheduleRequests.status, 'pending'),
        eq(jobs.postedBy, recruiterId)
      )
    )
    .orderBy(desc(rescheduleRequests.createdAt));
  
  return result.map((row: any) => ({
    ...row.reschedule_requests,
    interview: row.interviews,
    panelist: row.interview_panelists,
    job: row.jobs,
    candidate: {
      ...row.candidates,
      user: row.users,
    },
  }));
}

export async function updateRescheduleRequest(id: number, data: Partial<InsertRescheduleRequest>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(rescheduleRequests).set(data).where(eq(rescheduleRequests.id, id));
}

// Job Skill Requirements Functions
export async function createJobSkillRequirements(jobId: number, skills: { skillName: string; isMandatory: boolean }[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete existing requirements for this job
  await db.delete(jobSkillRequirements).where(eq(jobSkillRequirements.jobId, jobId));
  
  // Insert new requirements
  if (skills.length > 0) {
    const values = skills.map((skill, index) => ({
      jobId,
      skillName: skill.skillName,
      isMandatory: skill.isMandatory,
      orderIndex: index,
    }));
    await db.insert(jobSkillRequirements).values(values);
  }
}

export async function getJobSkillRequirements(jobId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select()
    .from(jobSkillRequirements)
    .where(eq(jobSkillRequirements.jobId, jobId))
    .orderBy(jobSkillRequirements.orderIndex);
  
  return result;
}

// Candidate Skill Ratings Functions
export async function createCandidateSkillRatings(applicationId: number, ratings: { skillRequirementId: number; skillName: string; rating: number; yearsExperience: number; lastUsedYear: number }[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete existing ratings for this application
  await db.delete(candidateSkillRatings).where(eq(candidateSkillRatings.applicationId, applicationId));
  
  // Insert new ratings
  if (ratings.length > 0) {
    const values = ratings.map(rating => ({
      applicationId,
      skillRequirementId: rating.skillRequirementId,
      skillName: rating.skillName,
      rating: rating.rating,
      yearsExperience: rating.yearsExperience,
      lastUsedYear: rating.lastUsedYear,
    }));
    await db.insert(candidateSkillRatings).values(values);
  }
}

export async function getCandidateSkillRatings(applicationId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select()
    .from(candidateSkillRatings)
    .leftJoin(jobSkillRequirements, eq(candidateSkillRatings.skillRequirementId, jobSkillRequirements.id))
    .where(eq(candidateSkillRatings.applicationId, applicationId));
  
  return result.map((row: any) => ({
    ...row.candidate_skill_ratings,
    requirement: row.job_skill_requirements,
  }));
}

// Panelist Reminder Functions
export async function getPanelistsNeedingReminders() {
  const db = await getDb();
  if (!db) return { reminder24h: [], reminder1h: [] };
  
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in23h = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const in1h = new Date(now.getTime() + 60 * 60 * 1000);
  const in30m = new Date(now.getTime() + 30 * 60 * 1000);
  
  // Get panelists needing 24h reminder
  const reminder24hResult = await db
    .select()
    .from(interviewPanelists)
    .leftJoin(interviews, eq(interviewPanelists.interviewId, interviews.id))
    .leftJoin(applications, eq(interviews.applicationId, applications.id))
    .leftJoin(jobs, eq(applications.jobId, jobs.id))
    .leftJoin(candidates, eq(applications.candidateId, candidates.id))
    .leftJoin(users, eq(candidates.userId, users.id))
    .where(
      and(
        eq(interviewPanelists.status, 'accepted'),
        sql`${interviewPanelists}.reminder24hSent = false`,
        gte(interviews.scheduledAt, in23h),
        lte(interviews.scheduledAt, in24h)
      )
    );
  
  // Get panelists needing 1h reminder
  const reminder1hResult = await db
    .select()
    .from(interviewPanelists)
    .leftJoin(interviews, eq(interviewPanelists.interviewId, interviews.id))
    .leftJoin(applications, eq(interviews.applicationId, applications.id))
    .leftJoin(jobs, eq(applications.jobId, jobs.id))
    .leftJoin(candidates, eq(applications.candidateId, candidates.id))
    .leftJoin(users, eq(candidates.userId, users.id))
    .where(
      and(
        eq(interviewPanelists.status, 'accepted'),
        sql`${interviewPanelists}.reminder1hSent = false`,
        gte(interviews.scheduledAt, in30m),
        lte(interviews.scheduledAt, in1h)
      )
    );
  
  const mapResult = (rows: any[]) => rows.map((row: any) => ({
    panelist: row.interview_panelists,
    interview: row.interviews,
    job: row.jobs,
    candidate: {
      ...row.candidates,
      user: row.users,
    },
  }));
  
  return {
    reminder24h: mapResult(reminder24hResult),
    reminder1h: mapResult(reminder1hResult),
  };
}

export async function markPanelistReminderSent(panelistId: number, reminderType: '24h' | '1h') {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData = reminderType === '24h' 
    ? { reminder24hSent: true } 
    : { reminder1hSent: true };
  
  await db.update(interviewPanelists).set(updateData as any).where(eq(interviewPanelists.id, panelistId));
}

// Create notification helper
export async function createNotification(data: { userId: number; type: string; title: string; message: string; relatedEntityType?: string; relatedEntityId?: number; actionUrl?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(notifications).values(data);
}

// Get panelist feedback for an interview
export async function getPanelistFeedbackForInterview(interviewId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select()
    .from(panelistFeedback)
    .leftJoin(interviewPanelists, eq(panelistFeedback.panelistId, interviewPanelists.id))
    .where(eq(panelistFeedback.interviewId, interviewId));
  
  return result.map((row: any) => ({
    ...row.panelist_feedback,
    panelist: row.interview_panelists,
  }));
}


// Profile sharing functions
export async function createProfileShare(data: InsertCandidateProfileShare) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(candidateProfileShares).values(data);
}

export async function getProfileShareByToken(shareToken: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(candidateProfileShares)
    .where(eq(candidateProfileShares.shareToken, shareToken))
    .limit(1);
  
  return result[0] || null;
}

export async function incrementShareViewCount(shareId: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(candidateProfileShares)
    .set({ 
      viewCount: sql`${candidateProfileShares.viewCount} + 1`,
      lastViewedAt: new Date()
    })
    .where(eq(candidateProfileShares.id, shareId));
}

export async function getProfileSharesByUser(userId: number, candidateId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(candidateProfileShares.sharedByUserId, userId)];
  if (candidateId) {
    conditions.push(eq(candidateProfileShares.candidateId, candidateId));
  }
  
  const result = await db
    .select({
      share: candidateProfileShares,
      candidate: candidates,
      user: users,
    })
    .from(candidateProfileShares)
    .leftJoin(candidates, eq(candidateProfileShares.candidateId, candidates.id))
    .leftJoin(users, eq(candidates.userId, users.id))
    .where(and(...conditions))
    .orderBy(desc(candidateProfileShares.createdAt));
  
  return result.map(row => ({
    ...row.share,
    candidate: row.candidate,
    user: row.user,
  }));
}

export async function deactivateProfileShare(shareToken: string, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(candidateProfileShares)
    .set({ isActive: false })
    .where(and(
      eq(candidateProfileShares.shareToken, shareToken),
      eq(candidateProfileShares.sharedByUserId, userId)
    ));
}

export async function getResumeProfileByCandidate(candidateId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(resumeProfiles)
    .where(eq(resumeProfiles.candidateId, candidateId))
    .orderBy(desc(resumeProfiles.createdAt))
    .limit(1);
  
  return result[0] || null;
}




// ==================== Environment Variables ====================

export async function getAllEnvironmentVariables() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(environmentVariables).orderBy(environmentVariables.category, environmentVariables.key);
}

export async function getEditableEnvironmentVariables() {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(environmentVariables)
    .where(eq(environmentVariables.isEditable, true))
    .orderBy(environmentVariables.category, environmentVariables.key);
}

export async function getEnvironmentVariableByKey(key: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select()
    .from(environmentVariables)
    .where(eq(environmentVariables.key, key))
    .limit(1);
  return result[0] || null;
}

export async function upsertEnvironmentVariable(data: InsertEnvironmentVariable) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getEnvironmentVariableByKey(data.key);
  
  if (existing) {
    await db.update(environmentVariables)
      .set({
        previousValue: existing.currentValue,
        currentValue: data.currentValue,
        description: data.description || existing.description,
        category: data.category || existing.category,
        isEditable: data.isEditable ?? existing.isEditable,
        isSensitive: data.isSensitive ?? existing.isSensitive,
        updatedBy: data.updatedBy,
      })
      .where(eq(environmentVariables.key, data.key));
  } else {
    await db.insert(environmentVariables).values({
      ...data,
      previousValue: data.currentValue,
    });
  }
}

export async function updateEnvironmentVariableValue(key: string, newValue: string, updatedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getEnvironmentVariableByKey(key);
  if (!existing) throw new Error(`Environment variable ${key} not found`);
  if (!existing.isEditable) throw new Error(`Environment variable ${key} is not editable`);
  
  await db.update(environmentVariables)
    .set({
      previousValue: existing.currentValue,
      currentValue: newValue,
      updatedBy: updatedBy,
    })
    .where(eq(environmentVariables.key, key));
  
  return getEnvironmentVariableByKey(key);
}

export async function revertEnvironmentVariable(key: string, updatedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getEnvironmentVariableByKey(key);
  if (!existing) throw new Error(`Environment variable ${key} not found`);
  if (!existing.isEditable) throw new Error(`Environment variable ${key} is not editable`);
  if (!existing.previousValue) throw new Error(`No previous value to revert to for ${key}`);
  
  await db.update(environmentVariables)
    .set({
      previousValue: existing.currentValue,
      currentValue: existing.previousValue,
      updatedBy: updatedBy,
    })
    .where(eq(environmentVariables.key, key));
  
  return getEnvironmentVariableByKey(key);
}

export async function deleteEnvironmentVariable(key: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(environmentVariables).where(eq(environmentVariables.key, key));
}

export async function seedDefaultEnvironmentVariables() {
  const defaults = [
    { key: "APP_NAME", currentValue: "HotGigs", description: "Application display name", category: "App Config", isEditable: true, isSensitive: false },
    { key: "SUPPORT_EMAIL", currentValue: "support@hotgigs.com", description: "Support contact email", category: "App Config", isEditable: true, isSensitive: false },
    { key: "MAX_UPLOAD_SIZE_MB", currentValue: "10", description: "Maximum file upload size in MB", category: "App Config", isEditable: true, isSensitive: false },
    { key: "SESSION_TIMEOUT_MINUTES", currentValue: "60", description: "User session timeout in minutes", category: "Security", isEditable: true, isSensitive: false },
    { key: "MAX_LOGIN_ATTEMPTS", currentValue: "5", description: "Maximum failed login attempts before lockout", category: "Security", isEditable: true, isSensitive: false },
    { key: "EMAIL_FROM_NAME", currentValue: "HotGigs Team", description: "Sender name for outgoing emails", category: "Email", isEditable: true, isSensitive: false },
    { key: "EMAIL_FROM_ADDRESS", currentValue: "noreply@hotgigs.com", description: "Sender email for outgoing emails", category: "Email", isEditable: true, isSensitive: false },
    { key: "INTERVIEW_REMINDER_HOURS", currentValue: "24", description: "Hours before interview to send reminder", category: "Interviews", isEditable: true, isSensitive: false },
    { key: "AI_MODEL", currentValue: "gpt-4", description: "AI model for interview analysis", category: "AI", isEditable: true, isSensitive: false },
    { key: "MAINTENANCE_MODE", currentValue: "false", description: "Enable maintenance mode", category: "System", isEditable: true, isSensitive: false },
  ];
  
  for (const envVar of defaults) {
    const existing = await getEnvironmentVariableByKey(envVar.key);
    if (!existing) {
      await upsertEnvironmentVariable({
        ...envVar,
        previousValue: envVar.currentValue,
      });
    }
  }
}

// ==================== Application Logs ====================

export async function createApplicationLog(data: InsertApplicationLog) {
  const db = await getDb();
  if (!db) {
    console.error("[Logs] Database not available, log not saved:", data);
    return null;
  }
  
  const result = await db.insert(applicationLogs).values(data);
  return result;
}

export async function getApplicationLogs(options: {
  level?: string;
  source?: string;
  search?: string;
  resolved?: boolean;
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) return { logs: [], total: 0 };
  
  const conditions = [];
  
  if (options.level) {
    conditions.push(eq(applicationLogs.level, options.level as any));
  }
  if (options.source) {
    conditions.push(eq(applicationLogs.source, options.source));
  }
  if (options.search) {
    conditions.push(or(
      like(applicationLogs.message, `%${options.search}%`),
      like(applicationLogs.details, `%${options.search}%`)
    ));
  }
  if (options.resolved !== undefined) {
    conditions.push(eq(applicationLogs.resolved, options.resolved));
  }
  if (options.startDate) {
    conditions.push(gte(applicationLogs.createdAt, options.startDate));
  }
  if (options.endDate) {
    conditions.push(lte(applicationLogs.createdAt, options.endDate));
  }
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  const logs = await db.select()
    .from(applicationLogs)
    .where(whereClause)
    .orderBy(desc(applicationLogs.createdAt))
    .limit(options.limit || 50)
    .offset(options.offset || 0);
  
  const countResult = await db.select({ count: sql<number>`count(*)` })
    .from(applicationLogs)
    .where(whereClause);
  
  return {
    logs,
    total: countResult[0]?.count || 0
  };
}

export async function getLogById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select()
    .from(applicationLogs)
    .where(eq(applicationLogs.id, id))
    .limit(1);
  
  return result[0] || null;
}

export async function resolveLog(id: number, resolvedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(applicationLogs)
    .set({
      resolved: true,
      resolvedBy,
      resolvedAt: new Date(),
    })
    .where(eq(applicationLogs.id, id));
  
  return getLogById(id);
}

export async function getLogStats() {
  const db = await getDb();
  if (!db) return { total: 0, byLevel: {}, bySource: {}, unresolvedCount: 0 };
  
  const total = await db.select({ count: sql<number>`count(*)` }).from(applicationLogs);
  const unresolved = await db.select({ count: sql<number>`count(*)` })
    .from(applicationLogs)
    .where(eq(applicationLogs.resolved, false));
  
  const byLevel = await db.select({
    level: applicationLogs.level,
    count: sql<number>`count(*)`
  })
    .from(applicationLogs)
    .groupBy(applicationLogs.level);
  
  const bySource = await db.select({
    source: applicationLogs.source,
    count: sql<number>`count(*)`
  })
    .from(applicationLogs)
    .groupBy(applicationLogs.source);
  
  return {
    total: total[0]?.count || 0,
    unresolvedCount: unresolved[0]?.count || 0,
    byLevel: Object.fromEntries(byLevel.map(r => [r.level, r.count])),
    bySource: Object.fromEntries(bySource.map(r => [r.source, r.count]))
  };
}

export async function deleteOldLogs(daysToKeep: number = 30) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  await db.delete(applicationLogs)
    .where(and(
      lte(applicationLogs.createdAt, cutoffDate),
      eq(applicationLogs.resolved, true)
    ));
}


// Log retention policy functions
export async function getLogRetentionDays(): Promise<number> {
  const db = await getDb();
  if (!db) return 30; // Default to 30 days
  
  const [setting] = await db
    .select()
    .from(environmentVariables)
    .where(eq(environmentVariables.key, 'LOG_RETENTION_DAYS'))
    .limit(1);
  
  if (setting) {
    const days = parseInt(setting.currentValue, 10);
    return isNaN(days) ? 30 : days;
  }
  
  return 30; // Default
}

export async function setLogRetentionDays(days: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db
    .select()
    .from(environmentVariables)
    .where(eq(environmentVariables.key, 'LOG_RETENTION_DAYS'))
    .limit(1);
  
  if (existing.length > 0) {
    await db.update(environmentVariables)
      .set({
        previousValue: existing[0].currentValue,
        currentValue: days.toString(),
        updatedAt: new Date()
      })
      .where(eq(environmentVariables.key, 'LOG_RETENTION_DAYS'));
  } else {
    await db.insert(environmentVariables).values({
      key: 'LOG_RETENTION_DAYS',
      currentValue: days.toString(),
      previousValue: days.toString(),
      description: 'Number of days to retain resolved logs before auto-cleanup',
      category: 'System',
      isEditable: true,
      isSensitive: false
    });
  }
}

export async function cleanupOldLogs(): Promise<{ deletedCount: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const retentionDays = await getLogRetentionDays();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  
  // Count logs to be deleted
  const [countResult] = await db.select({ count: sql<number>`count(*)` })
    .from(applicationLogs)
    .where(and(
      lte(applicationLogs.createdAt, cutoffDate),
      eq(applicationLogs.resolved, true)
    ));
  
  const deletedCount = countResult?.count || 0;
  
  // Delete old resolved logs
  if (deletedCount > 0) {
    await db.delete(applicationLogs)
      .where(and(
        lte(applicationLogs.createdAt, cutoffDate),
        eq(applicationLogs.resolved, true)
      ));
  }
  
  return { deletedCount };
}


// LinkedIn Settings helpers
export async function getSystemSetting(key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  
  const [setting] = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.settingKey, key))
    .limit(1);
  
  return setting?.settingValue || null;
}

export async function setSystemSetting(key: string, value: string, description?: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.settingKey, key))
    .limit(1);
  
  if (existing.length > 0) {
    await db.update(systemSettings)
      .set({
        settingValue: value,
        updatedAt: new Date()
      })
      .where(eq(systemSettings.settingKey, key));
  } else {
    await db.insert(systemSettings).values({
      settingKey: key,
      settingValue: value,
      description: description || `System setting for ${key}`
    });
  }
}

export async function getLinkedInCreditUsage() {
  const db = await getDb();
  if (!db) return [];
  
  const { desc } = await import("drizzle-orm");
  
  return await db
    .select()
    .from(linkedinCreditUsage)
    .orderBy(desc(linkedinCreditUsage.createdAt))
    .limit(100);
}

export async function getRecruiterCreditLimits() {
  const db = await getDb();
  if (!db) return [];
  
  const { sql } = await import("drizzle-orm");
  
  // Get aggregated credit usage per recruiter with their limits
  const result = await db.execute(sql`
    SELECT 
      r.id as recruiterId,
      u.name as recruiterName,
      COALESCE(SUM(lcu.creditsUsed), 0) as currentUsage,
      MAX(lcu.creditLimit) as creditLimit
    FROM recruiters r
    INNER JOIN users u ON r.userId = u.id
    LEFT JOIN linkedin_credit_usage lcu ON lcu.recruiterId = r.id
      AND MONTH(lcu.createdAt) = MONTH(CURRENT_DATE())
      AND YEAR(lcu.createdAt) = YEAR(CURRENT_DATE())
    GROUP BY r.id, u.name
  `);
  
  return result as any[];
}

export async function updateRecruiterCreditLimit(recruiterId: number, creditLimit: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Update or insert credit limit for recruiter
  // This will be stored in the next credit usage record
  // For now, we'll use a system setting approach
  await setSystemSetting(`recruiter_${recruiterId}_credit_limit`, creditLimit.toString());
}

export async function trackLinkedInCreditUsage(data: InsertLinkedinCreditUsage): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(linkedinCreditUsage).values(data);
}

export async function checkRecruiterCreditLimit(recruiterId: number): Promise<{ allowed: boolean; remaining: number }> {
  const db = await getDb();
  if (!db) return { allowed: true, remaining: 999 };
  
  // Get recruiter's credit limit
  const limitStr = await getSystemSetting(`recruiter_${recruiterId}_credit_limit`);
  const limit = limitStr ? parseInt(limitStr) : null;
  
  if (!limit) {
    return { allowed: true, remaining: 999 }; // No limit set
  }
  
  // Get current month usage
  const { sql } = await import("drizzle-orm");
  const [usage] = await db.execute(sql`
    SELECT COALESCE(SUM(creditsUsed), 0) as used
    FROM linkedin_credit_usage
    WHERE recruiterId = ${recruiterId}
      AND MONTH(createdAt) = MONTH(CURRENT_DATE())
      AND YEAR(createdAt) = YEAR(CURRENT_DATE())
  `) as any[];
  
  const used = usage?.used || 0;
  const remaining = limit - used;
  
  return {
    allowed: remaining > 0,
    remaining: Math.max(0, remaining)
  };
}


// InMail Template helpers
export async function getInMailTemplates() {
  const db = await getDb();
  if (!db) return [];
  
  const { desc } = await import("drizzle-orm");
  
  return await db
    .select()
    .from(inmailTemplates)
    .orderBy(desc(inmailTemplates.createdAt));
}

export async function getActiveInMailTemplates() {
  const db = await getDb();
  if (!db) return [];
  
  const { desc } = await import("drizzle-orm");
  
  return await db
    .select()
    .from(inmailTemplates)
    .where(eq(inmailTemplates.isActive, true))
    .orderBy(desc(inmailTemplates.timesUsed));
}

export async function getInMailTemplateById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const [template] = await db
    .select()
    .from(inmailTemplates)
    .where(eq(inmailTemplates.id, id))
    .limit(1);
  
  return template || null;
}

export async function createInMailTemplate(data: InsertInmailTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(inmailTemplates).values(data);
  return result;
}

export async function updateInMailTemplate(id: number, data: Partial<InsertInmailTemplate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(inmailTemplates)
    .set({
      ...data,
      updatedAt: new Date()
    })
    .where(eq(inmailTemplates.id, id));
}

export async function deleteInMailTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(inmailTemplates)
    .where(eq(inmailTemplates.id, id));
}

export async function toggleInMailTemplateStatus(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const template = await getInMailTemplateById(id);
  if (!template) throw new Error("Template not found");
  
  await db.update(inmailTemplates)
    .set({
      isActive: !template.isActive,
      updatedAt: new Date()
    })
    .where(eq(inmailTemplates.id, id));
}

export async function incrementTemplateUsage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { sql } = await import("drizzle-orm");
  
  await db.update(inmailTemplates)
    .set({
      timesUsed: sql`${inmailTemplates.timesUsed} + 1`,
      lastUsedAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(inmailTemplates.id, id));
}

// ============================================================================
// Company Management Functions
// ============================================================================

/**
 * Extract domain from email address
 */
export function extractDomainFromEmail(email: string): string {
  const parts = email.split('@');
  return parts.length === 2 ? parts[1].toLowerCase() : '';
}

/**
 * Get company by domain
 */
export async function getCompanyByDomain(domain: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [company] = await db.select()
    .from(companies)
    .where(eq(companies.domain, domain.toLowerCase()));
  
  return company || null;
}

/**
 * Get company by ID
 */
export async function getCompanyById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [company] = await db.select()
    .from(companies)
    .where(eq(companies.id, id));
  
  return company || null;
}

/**
 * Create a new company
 */
export async function createCompany(data: { name: string; domain: string; settings?: any }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [company] = await db.insert(companies)
    .values({
      name: data.name,
      domain: data.domain.toLowerCase(),
      settings: data.settings || null
    })
    .returning();
  
  return company;
}

/**
 * Auto-detect and assign company to user based on email domain
 */
export async function autoAssignCompanyToUser(userId: number, email: string) {
  const domain = extractDomainFromEmail(email);
  if (!domain) return null;
  
  // Skip generic email domains
  const genericDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'];
  if (genericDomains.includes(domain)) return null;
  
  // Find or create company
  let company = await getCompanyByDomain(domain);
  if (!company) {
    // Create company with domain as name (can be updated later)
    const companyName = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
    company = await createCompany({
      name: companyName,
      domain: domain
    });
  }
  
  // Assign company to user
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users)
    .set({ companyId: company.id })
    .where(eq(users.id, userId));
  
  return company;
}

/**
 * Get all users in a company
 */
export async function getCompanyUsers(companyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    emailVerified: users.emailVerified,
    createdAt: users.createdAt,
    lastSignedIn: users.lastSignedIn
  })
    .from(users)
    .where(eq(users.companyId, companyId))
    .orderBy(users.createdAt);
}

/**
 * Get all companies (admin only)
 */
export async function getAllCompanies() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select()
    .from(companies)
    .orderBy(companies.createdAt);
}

/**
 * Update company settings
 */
export async function updateCompanySettings(companyId: number, settings: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(companies)
    .set({ 
      settings: settings,
      updatedAt: new Date()
    })
    .where(eq(companies.id, companyId));
}
