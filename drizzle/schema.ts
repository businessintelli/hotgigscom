import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(), // Made nullable for custom auth
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(), // Made unique for custom auth
  passwordHash: varchar("passwordHash", { length: 255 }), // For custom auth
  loginMethod: varchar("loginMethod", { length: 64 }), // 'oauth' or 'password'
  role: mysqlEnum("role", ["user", "admin", "recruiter", "candidate"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Recruiter profiles extending user accounts
 */
export const recruiters = mysqlTable("recruiters", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  companyName: varchar("companyName", { length: 255 }),
  phoneNumber: varchar("phoneNumber", { length: 50 }),
  bio: text("bio"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Recruiter = typeof recruiters.$inferSelect;
export type InsertRecruiter = typeof recruiters.$inferInsert;

/**
 * Candidate profiles with resume support
 */
export const candidates = mysqlTable("candidates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }),
  phoneNumber: varchar("phoneNumber", { length: 50 }),
  location: varchar("location", { length: 255 }),
  bio: text("bio"),
  skills: text("skills"), // JSON array of skills
  experience: text("experience"),
  education: text("education"),
  resumeUrl: varchar("resumeUrl", { length: 500 }),
  resumeFilename: varchar("resumeFilename", { length: 255 }),
  resumeUploadedAt: timestamp("resumeUploadedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Candidate = typeof candidates.$inferSelect;
export type InsertCandidate = typeof candidates.$inferInsert;

/**
 * Customer/Client companies
 */
export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  industry: varchar("industry", { length: 255 }),
  website: varchar("website", { length: 500 }),
  description: text("description"),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 50 }),
  address: text("address"),
  createdBy: int("createdBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

/**
 * Customer contacts
 */
export const customerContacts = mysqlTable("customerContacts", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull().references(() => customers.id),
  name: varchar("name", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  isPrimary: boolean("isPrimary").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CustomerContact = typeof customerContacts.$inferSelect;
export type InsertCustomerContact = typeof customerContacts.$inferInsert;

/**
 * Job postings
 */
export const jobs = mysqlTable("jobs", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  companyName: varchar("companyName", { length: 255 }),
  description: text("description").notNull(),
  requirements: text("requirements"),
  responsibilities: text("responsibilities"),
  location: varchar("location", { length: 255 }),
  employmentType: mysqlEnum("employmentType", ["full-time", "part-time", "contract", "temporary", "internship"]).default("full-time"),
  salaryMin: int("salaryMin"),
  salaryMax: int("salaryMax"),
  salaryCurrency: varchar("salaryCurrency", { length: 10 }).default("USD"),
  customerId: int("customerId").references(() => customers.id),
  contactId: int("contactId").references(() => customerContacts.id),
  status: mysqlEnum("status", ["draft", "active", "closed", "filled"]).default("draft"),
  isPublic: boolean("isPublic").default(false),
  postedBy: int("postedBy").notNull().references(() => users.id),
  applicationDeadline: timestamp("applicationDeadline"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  closedAt: timestamp("closedAt"),
});

export type Job = typeof jobs.$inferSelect;
export type InsertJob = typeof jobs.$inferInsert;

/**
 * Job applications
 */
export const applications = mysqlTable("applications", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull().references(() => jobs.id),
  candidateId: int("candidateId").notNull().references(() => candidates.id),
  coverLetter: text("coverLetter"),
  resumeUrl: varchar("resumeUrl", { length: 500 }),
  resumeFilename: varchar("resumeFilename", { length: 255 }),
  status: mysqlEnum("status", ["submitted", "reviewing", "shortlisted", "interviewing", "offered", "rejected", "withdrawn"]).default("submitted"),
  aiScore: int("aiScore"), // AI matching score 0-100
  notes: text("notes"),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Application = typeof applications.$inferSelect;
export type InsertApplication = typeof applications.$inferInsert;

/**
 * Interviews table for scheduling and tracking candidate interviews
 */
export const interviews = mysqlTable("interviews", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId").notNull().references(() => applications.id),
  recruiterId: int("recruiterId").notNull().references(() => recruiters.id),
  candidateId: int("candidateId").notNull().references(() => candidates.id),
  jobId: int("jobId").notNull().references(() => jobs.id),
  scheduledAt: timestamp("scheduledAt").notNull(),
  duration: int("duration").notNull().default(60), // in minutes
  type: mysqlEnum("type", ["phone", "video", "in-person", "ai-interview"]).notNull().default("video"),
  status: mysqlEnum("status", ["scheduled", "in-progress", "completed", "cancelled", "no-show"]).notNull().default("scheduled"),
  meetingLink: text("meetingLink"),
  location: text("location"),
  notes: text("notes"),
  recordingUrl: text("recordingUrl"),
  aiEvaluationScore: int("aiEvaluationScore"), // 0-100
  aiEvaluationReport: text("aiEvaluationReport"),
  interviewerNotes: text("interviewerNotes"),
  candidateFeedback: text("candidateFeedback"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Interview = typeof interviews.$inferSelect;
export type InsertInterview = typeof interviews.$inferInsert;

/**
 * Interview questions table for storing AI-generated questions
 */
export const interviewQuestions = mysqlTable("interviewQuestions", {
  id: int("id").autoincrement().primaryKey(),
  interviewId: int("interviewId").notNull().references(() => interviews.id),
  questionText: text("questionText").notNull(),
  questionType: mysqlEnum("questionType", ["technical", "behavioral", "situational", "experience"]).notNull(),
  orderIndex: int("orderIndex").notNull(),
  expectedDuration: int("expectedDuration").default(120), // seconds
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InterviewQuestion = typeof interviewQuestions.$inferSelect;
export type InsertInterviewQuestion = typeof interviewQuestions.$inferInsert;

/**
 * Interview responses table for storing candidate answers
 */
export const interviewResponses = mysqlTable("interviewResponses", {
  id: int("id").autoincrement().primaryKey(),
  interviewId: int("interviewId").notNull().references(() => interviews.id),
  questionId: int("questionId").notNull().references(() => interviewQuestions.id),
  candidateId: int("candidateId").notNull().references(() => candidates.id),
  audioUrl: text("audioUrl"),
  videoUrl: text("videoUrl"),
  transcription: text("transcription"),
  duration: int("duration"), // seconds
  aiScore: int("aiScore"), // 0-100
  aiEvaluation: text("aiEvaluation"),
  strengths: text("strengths"),
  weaknesses: text("weaknesses"),
  recommendations: text("recommendations"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InterviewResponse = typeof interviewResponses.$inferSelect;
export type InsertInterviewResponse = typeof interviewResponses.$inferInsert;

/**
 * Saved searches for recruiters with email alert configuration
 */
export const savedSearches = mysqlTable("savedSearches", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  searchType: mysqlEnum("searchType", ["candidate", "job"]).notNull().default("candidate"),
  // Search criteria stored as JSON
  keyword: text("keyword"),
  location: text("location"),
  experienceLevel: varchar("experienceLevel", { length: 50 }),
  skills: text("skills"), // JSON array
  // Email alert configuration
  emailAlerts: boolean("emailAlerts").default(false).notNull(),
  alertFrequency: mysqlEnum("alertFrequency", ["immediate", "daily", "weekly"]).default("daily"),
  lastAlertSent: timestamp("lastAlertSent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SavedSearch = typeof savedSearches.$inferSelect;
export type InsertSavedSearch = typeof savedSearches.$inferInsert;

/**
 * Saved jobs for candidates to bookmark interesting positions
 */
export const savedJobs = mysqlTable("savedJobs", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidateId").notNull().references(() => candidates.id),
  jobId: int("jobId").notNull().references(() => jobs.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SavedJob = typeof savedJobs.$inferSelect;
export type InsertSavedJob = typeof savedJobs.$inferInsert;

/**
 * Fraud detection events table for tracking suspicious behavior during AI interviews
 */
export const fraudDetectionEvents = mysqlTable("fraudDetectionEvents", {
  id: int("id").autoincrement().primaryKey(),
  interviewId: int("interviewId").notNull().references(() => interviews.id),
  candidateId: int("candidateId").notNull().references(() => candidates.id),
  eventType: mysqlEnum("eventType", [
    "no_face_detected",
    "multiple_faces_detected",
    "tab_switch",
    "window_blur",
    "audio_anomaly",
    "suspicious_behavior"
  ]).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high"]).notNull().default("medium"),
  description: text("description"),
  metadata: text("metadata"), // JSON data with additional details
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  questionId: int("questionId").references(() => interviewQuestions.id),
});

export type FraudDetectionEvent = typeof fraudDetectionEvents.$inferSelect;
export type InsertFraudDetectionEvent = typeof fraudDetectionEvents.$inferInsert;
