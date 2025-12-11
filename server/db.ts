import { eq, and, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  recruiters, InsertRecruiter,
  candidates, InsertCandidate,
  customers, InsertCustomer,
  customerContacts, InsertCustomerContact,
  jobs, InsertJob,
  applications, InsertApplication,
  interviews, InsertInterview,
  interviewQuestions, InsertInterviewQuestion,
  interviewResponses, InsertInterviewResponse
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// User operations
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
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

    const textFields = ["name", "email", "loginMethod"] as const;
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
    .select()
    .from(interviews)
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
      job: jobs,
      application: applications,
    })
    .from(interviews)
    .leftJoin(candidates, eq(interviews.candidateId, candidates.id))
    .leftJoin(jobs, eq(interviews.jobId, jobs.id))
    .leftJoin(applications, eq(interviews.applicationId, applications.id))
    .where(eq(interviews.recruiterId, recruiterId))
    .orderBy(desc(interviews.scheduledAt));
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
  return result;
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

// Application operations
export async function createApplication(application: InsertApplication) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(applications).values(application);
  return result;
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
    .leftJoin(jobs, eq(applications.jobId, jobs.id))
    .orderBy(desc(applications.submittedAt));
  
  return results.map((row: any) => ({
    ...row.applications,
    candidate: row.candidates,
    job: row.jobs,
  }));
}

export async function getApplicationsByCandidate(candidateId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(applications).where(eq(applications.candidateId, candidateId)).orderBy(desc(applications.submittedAt));
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
