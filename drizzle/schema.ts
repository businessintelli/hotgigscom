import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, index, date, decimal } from "drizzle-orm/mysql-core";

/**
 * Companies table for multi-tenant architecture
 */
export const companies = mysqlTable("companies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  domain: varchar("domain", { length: 255 }).notNull().unique(),
  settings: json("settings"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

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
  role: mysqlEnum("role", ["admin", "company_admin", "recruiter", "candidate"]).default("candidate").notNull(),
  companyId: int("companyId").references(() => companies.id, { onDelete: "set null" }),
  // Email verification
  emailVerified: boolean("emailVerified").default(false).notNull(),
  verificationToken: varchar("verificationToken", { length: 255 }),
  verificationTokenExpiry: timestamp("verificationTokenExpiry"),
  // Password reset
  passwordResetToken: varchar("passwordResetToken", { length: 255 }),
  passwordResetTokenExpiry: timestamp("passwordResetTokenExpiry"),
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
  profileCompleted: boolean("profileCompleted").default(false).notNull(),
  profileCompletionStep: int("profileCompletionStep").default(0).notNull(),
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
  // Advanced parsed resume data (JSON)
  parsedResumeData: text("parsedResumeData"), // Full ParsedResume JSON
  linkedinUrl: varchar("linkedinUrl", { length: 500 }),
  githubUrl: varchar("githubUrl", { length: 500 }),
  certifications: text("certifications"), // JSON array
  languages: text("languages"), // JSON array
  projects: text("projects"), // JSON array
  totalExperienceYears: int("totalExperienceYears"),
  seniorityLevel: varchar("seniorityLevel", { length: 50 }),
  primaryDomain: varchar("primaryDomain", { length: 100 }),
  skillCategories: text("skillCategories"), // JSON object
  // Smart filter fields for advanced search
  availability: varchar("availability", { length: 50 }), // 'immediate', '2-weeks', '1-month', '2-months', 'not-looking'
  visaStatus: varchar("visaStatus", { length: 100 }), // 'citizen', 'permanent-resident', 'work-visa', 'requires-sponsorship'
  expectedSalaryMin: int("expectedSalaryMin"),
  expectedSalaryMax: int("expectedSalaryMax"),
  noticePeriod: varchar("noticePeriod", { length: 50 }), // 'immediate', '2-weeks', '1-month', '2-months', '3-months'
  willingToRelocate: boolean("willingToRelocate").default(false),
  // Extended candidate information
  workAuthorization: varchar("workAuthorization", { length: 100 }), // 'citizen', 'green-card', 'h1b', 'opt', 'cpt', etc.
  workAuthorizationEndDate: date("workAuthorizationEndDate"),
  w2EmployerName: varchar("w2EmployerName", { length: 255 }),
  nationality: varchar("nationality", { length: 100 }),
  gender: varchar("gender", { length: 50 }), // 'male', 'female', 'non-binary', 'prefer-not-to-say'
  dateOfBirth: date("dateOfBirth"),
  highestEducation: varchar("highestEducation", { length: 255 }), // 'High School', 'Bachelor', 'Master', 'PhD', etc.
  specialization: varchar("specialization", { length: 255 }),
  highestDegreeStartDate: date("highestDegreeStartDate"),
  highestDegreeEndDate: date("highestDegreeEndDate"),
  employmentHistory: text("employmentHistory"), // JSON array of {company, address, startDate, endDate}
  languagesRead: text("languagesRead"), // JSON array of languages
  languagesSpeak: text("languagesSpeak"), // JSON array of languages
  languagesWrite: text("languagesWrite"), // JSON array of languages
  currentResidenceZipCode: varchar("currentResidenceZipCode", { length: 20 }),
  passportNumber: varchar("passportNumber", { length: 100 }),
  sinLast4: varchar("sinLast4", { length: 4 }), // Last 4 digits of SIN
  linkedinId: varchar("linkedinId", { length: 255 }),
  passportCopyUrl: varchar("passportCopyUrl", { length: 500 }), // S3 URL for passport/visa/green card
  dlCopyUrl: varchar("dlCopyUrl", { length: 500 }), // S3 URL for driver's license
  // Salary information
  currentSalary: int("currentSalary"), // Annual salary in USD
  currentHourlyRate: int("currentHourlyRate"), // Hourly rate in USD
  expectedSalary: int("expectedSalary"), // Expected annual salary in USD
  expectedHourlyRate: int("expectedHourlyRate"), // Expected hourly rate in USD
  salaryType: mysqlEnum("salaryType", ["salary", "hourly"]), // Preferred compensation type
  profileCompleted: boolean("profileCompleted").default(false).notNull(),
  profileCompletionStep: int("profileCompletionStep").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Candidate = typeof candidates.$inferSelect;
export type InsertCandidate = typeof candidates.$inferInsert;

/**
 * Resume profiles table - allows candidates to maintain up to 5 different resume versions
 */
export const resumeProfiles = mysqlTable("resumeProfiles", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidateId").notNull().references(() => candidates.id),
  profileName: varchar("profileName", { length: 255 }).notNull(), // e.g., "Software Engineer", "Full Stack Developer"
  resumeUrl: varchar("resumeUrl", { length: 500 }).notNull(),
  resumeFileKey: varchar("resumeFileKey", { length: 500 }).notNull(), // S3 key for file management
  resumeFilename: varchar("resumeFilename", { length: 255 }).notNull(),
  parsedData: text("parsedData"), // Full ParsedResume JSON from AI parsing
  // Ranking and matching scores
  domainMatchScore: int("domainMatchScore").default(0), // 0-100 percentage
  skillMatchScore: int("skillMatchScore").default(0), // 0-100 percentage
  experienceScore: int("experienceScore").default(0), // 0-100 based on years and relevance
  overallScore: int("overallScore").default(0), // 0-100 weighted average
  primaryDomain: varchar("primaryDomain", { length: 100 }), // e.g., "Software Development", "Data Science"
  totalExperienceYears: int("totalExperienceYears").default(0),
  isDefault: boolean("isDefault").default(false).notNull(),
  topDomains: json("topDomains"), // Top 5 domains with percentages [{domain: string, percentage: number}]
  topSkills: json("topSkills"), // Top 5 skills with percentages [{skill: string, percentage: number}]
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ResumeProfile = typeof resumeProfiles.$inferSelect;
export type InsertResumeProfile = typeof resumeProfiles.$inferInsert;

/**
 * Video introductions table - stores candidate self-introduction videos (max 15 minutes)
 */
export const videoIntroductions = mysqlTable("videoIntroductions", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidateId").notNull().references(() => candidates.id),
  videoUrl: varchar("videoUrl", { length: 500 }).notNull(),
  videoFileKey: varchar("videoFileKey", { length: 500 }).notNull(), // S3 key for file management
  thumbnailUrl: varchar("thumbnailUrl", { length: 500 }),
  duration: int("duration").notNull(), // in seconds, max 900 (15 minutes)
  fileSize: int("fileSize"), // in bytes
  mimeType: varchar("mimeType", { length: 100 }),
  transcription: text("transcription"), // Optional: AI-generated transcription
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VideoIntroduction = typeof videoIntroductions.$inferSelect;
export type InsertVideoIntroduction = typeof videoIntroductions.$inferInsert;

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
  resumeProfileId: int("resumeProfileId").references(() => resumeProfiles.id), // Selected resume profile for this application
  videoIntroductionId: int("videoIntroductionId").references(() => videoIntroductions.id), // Optional video introduction
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
  videoMeetingId: varchar("videoMeetingId", { length: 255 }),
  videoJoinUrl: text("videoJoinUrl"),
  videoStartUrl: text("videoStartUrl"),
  videoPassword: varchar("videoPassword", { length: 255 }),
  videoProvider: mysqlEnum("videoProvider", ["zoom", "teams", "none"]).default("none"),
  // Candidate reminder tracking
  candidateReminder24hSent: boolean("candidateReminder24hSent").default(false),
  candidateReminder1hSent: boolean("candidateReminder1hSent").default(false),
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


/**
 * Coding interview challenges table
 */
export const codingChallenges = mysqlTable("codingChallenges", {
  id: int("id").autoincrement().primaryKey(),
  interviewId: int("interviewId").references(() => interviews.id), // Optional: for interview-specific challenges
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  language: mysqlEnum("language", ["python", "javascript", "java", "cpp"]).notNull(),
  starterCode: text("starterCode"),
  testCases: text("testCases"), // JSON array of test cases
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"]).notNull(),
  timeLimit: int("timeLimit"), // seconds
  createdBy: int("createdBy").references(() => users.id), // User who created the challenge
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CodingChallenge = typeof codingChallenges.$inferSelect;
export type InsertCodingChallenge = typeof codingChallenges.$inferInsert;

/**
 * Coding interview submissions table
 */
export const codingSubmissions = mysqlTable("codingSubmissions", {
  id: int("id").autoincrement().primaryKey(),
  challengeId: int("challengeId").notNull().references(() => codingChallenges.id),
  candidateId: int("candidateId").notNull().references(() => candidates.id),
  code: text("code").notNull(),
  language: varchar("language", { length: 50 }).notNull(),
  status: mysqlEnum("status", ["pending", "running", "passed", "failed", "error"]).notNull().default("pending"),
  testResults: text("testResults"), // JSON array of test results
  executionTime: int("executionTime"), // milliseconds
  score: int("score"), // 0-100
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
});

export type CodingSubmission = typeof codingSubmissions.$inferSelect;
export type InsertCodingSubmission = typeof codingSubmissions.$inferInsert;


/**
 * Skill assessments table
 */
export const skillAssessments = mysqlTable("skillAssessments", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").references(() => jobs.id), // Optional: link to specific job
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  duration: int("duration"), // minutes
  passingScore: int("passingScore").notNull().default(70), // percentage
  createdBy: int("createdBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SkillAssessment = typeof skillAssessments.$inferSelect;
export type InsertSkillAssessment = typeof skillAssessments.$inferInsert;

/**
 * Assessment questions table
 */
export const assessmentQuestions = mysqlTable("assessmentQuestions", {
  id: int("id").autoincrement().primaryKey(),
  assessmentId: int("assessmentId").notNull().references(() => skillAssessments.id),
  questionText: text("questionText").notNull(),
  questionType: mysqlEnum("questionType", ["multiple_choice", "true_false", "short_answer"]).notNull(),
  options: text("options"), // JSON array for multiple choice
  correctAnswer: text("correctAnswer").notNull(),
  points: int("points").notNull().default(1),
  orderIndex: int("orderIndex").notNull(),
});

export type AssessmentQuestion = typeof assessmentQuestions.$inferSelect;
export type InsertAssessmentQuestion = typeof assessmentQuestions.$inferInsert;

/**
 * Assessment attempts table
 */
export const assessmentAttempts = mysqlTable("assessmentAttempts", {
  id: int("id").autoincrement().primaryKey(),
  assessmentId: int("assessmentId").notNull().references(() => skillAssessments.id),
  candidateId: int("candidateId").notNull().references(() => candidates.id),
  applicationId: int("applicationId").references(() => applications.id), // Optional: link to application
  score: int("score"), // percentage
  totalPoints: int("totalPoints"),
  earnedPoints: int("earnedPoints"),
  passed: boolean("passed"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  timeSpent: int("timeSpent"), // seconds
});

export type AssessmentAttempt = typeof assessmentAttempts.$inferSelect;
export type InsertAssessmentAttempt = typeof assessmentAttempts.$inferInsert;

/**
 * Assessment answers table
 */
export const assessmentAnswers = mysqlTable("assessmentAnswers", {
  id: int("id").autoincrement().primaryKey(),
  attemptId: int("attemptId").notNull().references(() => assessmentAttempts.id),
  questionId: int("questionId").notNull().references(() => assessmentQuestions.id),
  answer: text("answer").notNull(),
  isCorrect: boolean("isCorrect"),
  pointsEarned: int("pointsEarned"),
});

export type AssessmentAnswer = typeof assessmentAnswers.$inferSelect;
export type InsertAssessmentAnswer = typeof assessmentAnswers.$inferInsert;

/**
 * Notifications table for real-time user notifications
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  type: varchar("type", { length: 50 }).notNull(), // 'application', 'interview', 'status_change', 'message', etc.
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  relatedEntityType: varchar("relatedEntityType", { length: 50 }), // 'job', 'application', 'interview', etc.
  relatedEntityId: int("relatedEntityId"), // ID of the related entity
  actionUrl: varchar("actionUrl", { length: 500 }), // URL to navigate when clicked
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Candidate tags table for organizing candidates
 */
export const candidateTags = mysqlTable("candidateTags", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 50 }).default("blue"), // badge color
  userId: int("userId").notNull().references(() => users.id), // recruiter who created the tag
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CandidateTag = typeof candidateTags.$inferSelect;
export type InsertCandidateTag = typeof candidateTags.$inferInsert;

/**
 * Candidate tag assignments (many-to-many relationship)
 */
export const candidateTagAssignments = mysqlTable("candidateTagAssignments", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidateId").notNull().references(() => candidates.id),
  tagId: int("tagId").notNull().references(() => candidateTags.id),
  assignedBy: int("assignedBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CandidateTagAssignment = typeof candidateTagAssignments.$inferSelect;
export type InsertCandidateTagAssignment = typeof candidateTagAssignments.$inferInsert;

/**
 * Email templates for bulk campaigns
 */
export const emailTemplates = mysqlTable("emailTemplates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body").notNull(), // HTML content with variables like {{name}}, {{jobTitle}}
  category: varchar("category", { length: 100 }), // 'outreach', 'follow-up', 'interview-invite', etc.
  userId: int("userId").notNull().references(() => users.id), // creator
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;

/**
 * Email campaigns for bulk candidate outreach
 */
export const emailCampaigns = mysqlTable("emailCampaigns", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  templateId: int("templateId").references(() => emailTemplates.id),
  subject: varchar("subject", { length: 500 }).notNull(), // can override template subject
  body: text("body").notNull(), // can override template body
  userId: int("userId").notNull().references(() => users.id), // campaign creator
  status: varchar("status", { length: 50 }).default("draft").notNull(), // 'draft', 'scheduled', 'sending', 'sent', 'paused'
  scheduledAt: timestamp("scheduledAt"), // when to send
  sentAt: timestamp("sentAt"), // when actually sent
  totalRecipients: int("totalRecipients").default(0),
  sentCount: int("sentCount").default(0),
  openedCount: int("openedCount").default(0),
  clickedCount: int("clickedCount").default(0),
  bouncedCount: int("bouncedCount").default(0),
  repliedCount: int("repliedCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailCampaign = typeof emailCampaigns.$inferSelect;
export type InsertEmailCampaign = typeof emailCampaigns.$inferInsert;

/**
 * Campaign recipients and tracking
 */
export const campaignRecipients = mysqlTable("campaignRecipients", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull().references(() => emailCampaigns.id),
  candidateId: int("candidateId").notNull().references(() => candidates.id),
  email: varchar("email", { length: 255 }).notNull(),
  personalizedSubject: varchar("personalizedSubject", { length: 500 }),
  personalizedBody: text("personalizedBody"),
  status: varchar("status", { length: 50 }).default("pending").notNull(), // 'pending', 'sent', 'opened', 'clicked', 'bounced', 'replied'
  sentAt: timestamp("sentAt"),
  openedAt: timestamp("openedAt"),
  clickedAt: timestamp("clickedAt"),
  bouncedAt: timestamp("bouncedAt"),
  repliedAt: timestamp("repliedAt"),
  trackingId: varchar("trackingId", { length: 100 }), // unique ID for tracking opens/clicks
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CampaignRecipient = typeof campaignRecipients.$inferSelect;
export type InsertCampaignRecipient = typeof campaignRecipients.$inferInsert;

/**
 * Automated follow-up sequences
 */
export const followUpSequences = mysqlTable("followUpSequences", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  userId: int("userId").notNull().references(() => users.id),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FollowUpSequence = typeof followUpSequences.$inferSelect;
export type InsertFollowUpSequence = typeof followUpSequences.$inferInsert;

/**
 * Steps in a follow-up sequence
 */
export const sequenceSteps = mysqlTable("sequenceSteps", {
  id: int("id").autoincrement().primaryKey(),
  sequenceId: int("sequenceId").notNull().references(() => followUpSequences.id),
  stepNumber: int("stepNumber").notNull(), // order in sequence (1, 2, 3...)
  delayDays: int("delayDays").notNull(), // days after previous step (0 for first step)
  templateId: int("templateId").references(() => emailTemplates.id),
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body").notNull(),
  condition: varchar("condition", { length: 100 }), // 'no_response', 'not_opened', 'always', etc.
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SequenceStep = typeof sequenceSteps.$inferSelect;
export type InsertSequenceStep = typeof sequenceSteps.$inferInsert;

/**
 * Sequence enrollments (candidates enrolled in sequences)
 */
export const sequenceEnrollments = mysqlTable("sequenceEnrollments", {
  id: int("id").autoincrement().primaryKey(),
  sequenceId: int("sequenceId").notNull().references(() => followUpSequences.id),
  candidateId: int("candidateId").notNull().references(() => candidates.id),
  currentStep: int("currentStep").default(0), // which step they're on
  status: varchar("status", { length: 50 }).default("active").notNull(), // 'active', 'completed', 'paused', 'unsubscribed'
  enrolledAt: timestamp("enrolledAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  nextStepAt: timestamp("nextStepAt"), // when to send next email
});

export type SequenceEnrollment = typeof sequenceEnrollments.$inferSelect;
export type InsertSequenceEnrollment = typeof sequenceEnrollments.$inferInsert;

/**
 * Email unsubscribes table
 */
export const emailUnsubscribes = mysqlTable("emailUnsubscribes", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  trackingId: varchar("trackingId", { length: 100 }),
  reason: text("reason"),
  unsubscribedAt: timestamp("unsubscribedAt").defaultNow().notNull(),
});

export type EmailUnsubscribe = typeof emailUnsubscribes.$inferSelect;
export type InsertEmailUnsubscribe = typeof emailUnsubscribes.$inferInsert;

/**
 * System settings table for application configuration
 */
export const systemSettings = mysqlTable("systemSettings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 100 }).notNull().unique(),
  settingValue: text("settingValue"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = typeof systemSettings.$inferInsert;

/**
 * Email delivery events from webhooks
 */
export const emailDeliveryEvents = mysqlTable("emailDeliveryEvents", {
  id: int("id").autoincrement().primaryKey(),
  campaignRecipientId: int("campaignRecipientId"),
  eventType: varchar("eventType", { length: 50 }).notNull(),
  provider: varchar("provider", { length: 20 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  messageId: varchar("messageId", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  reason: text("reason"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  emailIdx: index("idx_email").on(table.email),
  eventTypeIdx: index("idx_event_type").on(table.eventType),
  providerIdx: index("idx_provider").on(table.provider),
  timestampIdx: index("idx_timestamp").on(table.timestamp),
}));

/**
 * Webhook logs for debugging
 */
export const emailWebhookLogs = mysqlTable("emailWebhookLogs", {
  id: int("id").autoincrement().primaryKey(),
  provider: varchar("provider", { length: 20 }).notNull(),
  eventType: varchar("eventType", { length: 50 }),
  payload: json("payload").notNull(),
  signature: text("signature"),
  verified: boolean("verified").default(false),
  processed: boolean("processed").default(false),
  error: text("error"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  providerIdx: index("idx_provider").on(table.provider),
  createdIdx: index("idx_created").on(table.createdAt),
}));

export type EmailDeliveryEvent = typeof emailDeliveryEvents.$inferSelect;
export type InsertEmailDeliveryEvent = typeof emailDeliveryEvents.$inferInsert;
export type EmailWebhookLog = typeof emailWebhookLogs.$inferSelect;
export type InsertEmailWebhookLog = typeof emailWebhookLogs.$inferInsert;


/**
 * Associates table - Onboarded employees/candidates
 */
export const associates = mysqlTable("associates", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidateId").notNull().references(() => candidates.id),
  employeeId: varchar("employeeId", { length: 100 }), // Company employee ID
  jobTitle: varchar("jobTitle", { length: 255 }).notNull(),
  department: varchar("department", { length: 255 }),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"), // null if currently employed
  status: mysqlEnum("status", ["active", "onboarding", "offboarding", "terminated"]).default("onboarding").notNull(),
  managerId: int("managerId").references(() => recruiters.id), // Reporting manager
  onboardedBy: int("onboardedBy").notNull().references(() => recruiters.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Associate = typeof associates.$inferSelect;
export type InsertAssociate = typeof associates.$inferInsert;

/**
 * Onboarding/Offboarding processes
 */
export const onboardingProcesses = mysqlTable("onboardingProcesses", {
  id: int("id").autoincrement().primaryKey(),
  associateId: int("associateId").notNull().references(() => associates.id),
  processType: mysqlEnum("processType", ["onboarding", "offboarding"]).notNull(),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "cancelled"]).default("pending").notNull(),
  startedBy: int("startedBy").notNull().references(() => recruiters.id),
  completedAt: timestamp("completedAt"),
  dueDate: timestamp("dueDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OnboardingProcess = typeof onboardingProcesses.$inferSelect;
export type InsertOnboardingProcess = typeof onboardingProcesses.$inferInsert;

/**
 * Tasks within onboarding/offboarding processes
 */
export const onboardingTasks = mysqlTable("onboardingTasks", {
  id: int("id").autoincrement().primaryKey(),
  processId: int("processId").notNull().references(() => onboardingProcesses.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  taskType: varchar("taskType", { length: 100 }), // e.g., 'documentation', 'equipment', 'training', 'system_access'
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "blocked"]).default("pending").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  dueDate: timestamp("dueDate"),
  completedAt: timestamp("completedAt"),
  completedBy: int("completedBy").references(() => recruiters.id),
  orderIndex: int("orderIndex").default(0).notNull(), // For task ordering
  dependsOnTaskId: int("dependsOnTaskId"), // Task dependency (self-reference)
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OnboardingTask = typeof onboardingTasks.$inferSelect;
export type InsertOnboardingTask = typeof onboardingTasks.$inferInsert;

/**
 * Task assignments - assign tasks to specific recruiters
 */
export const taskAssignments = mysqlTable("taskAssignments", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull().references(() => onboardingTasks.id),
  recruiterId: int("recruiterId").notNull().references(() => recruiters.id),
  assignedBy: int("assignedBy").notNull().references(() => recruiters.id),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TaskAssignment = typeof taskAssignments.$inferSelect;
export type InsertTaskAssignment = typeof taskAssignments.$inferInsert;

/**
 * Task reminders - track reminder emails sent for pending tasks
 */
export const taskReminders = mysqlTable("taskReminders", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull().references(() => onboardingTasks.id),
  recruiterId: int("recruiterId").notNull().references(() => recruiters.id),
  reminderType: mysqlEnum("reminderType", ["due_soon", "overdue", "manual"]).notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  emailStatus: varchar("emailStatus", { length: 50 }), // 'sent', 'delivered', 'failed'
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TaskReminder = typeof taskReminders.$inferSelect;
export type InsertTaskReminder = typeof taskReminders.$inferInsert;

/**
 * Task templates - predefined task lists for onboarding/offboarding
 */
export const taskTemplates = mysqlTable("taskTemplates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  processType: mysqlEnum("processType", ["onboarding", "offboarding"]).notNull(),
  description: text("description"),
  tasks: text("tasks").notNull(), // JSON array of task definitions
  isDefault: boolean("isDefault").default(false).notNull(),
  createdBy: int("createdBy").notNull().references(() => recruiters.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TaskTemplate = typeof taskTemplates.$inferSelect;
export type InsertTaskTemplate = typeof taskTemplates.$inferInsert;

/**
 * Application feedback table - private notes and ratings from recruiters
 */
export const applicationFeedback = mysqlTable("applicationFeedback", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId").notNull().references(() => applications.id),
  recruiterId: int("recruiterId").notNull().references(() => recruiters.id),
  rating: int("rating"), // 1-5 stars
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApplicationFeedback = typeof applicationFeedback.$inferSelect;
export type InsertApplicationFeedback = typeof applicationFeedback.$inferInsert;


/**
 * Interview feedback from candidates (post-interview experience ratings)
 */
export const interviewFeedback = mysqlTable("interview_feedback", {
  id: int("id").autoincrement().primaryKey(),
  interviewId: int("interviewId").notNull().references(() => interviews.id),
  candidateId: int("candidateId").notNull().references(() => candidates.id),
  overallRating: int("overallRating").notNull(),
  interviewerRating: int("interviewerRating"),
  processRating: int("processRating"),
  communicationRating: int("communicationRating"),
  positiveAspects: text("positiveAspects"),
  areasForImprovement: text("areasForImprovement"),
  additionalComments: text("additionalComments"),
  wouldRecommend: boolean("wouldRecommend"),
  isAnonymous: boolean("isAnonymous").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InterviewFeedback = typeof interviewFeedback.$inferSelect;
export type InsertInterviewFeedback = typeof interviewFeedback.$inferInsert;

/**
 * Interview panel members - additional interviewers invited to participate
 */
export const interviewPanelists = mysqlTable("interview_panelists", {
  id: int("id").autoincrement().primaryKey(),
  interviewId: int("interviewId").notNull().references(() => interviews.id),
  userId: int("userId").notNull().references(() => users.id),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  role: varchar("role", { length: 100 }), // e.g., 'Technical Lead', 'HR Manager', 'Team Member'
  status: mysqlEnum("status", ["invited", "accepted", "declined", "attended"]).default("invited").notNull(),
  invitedAt: timestamp("invitedAt").defaultNow().notNull(),
  respondedAt: timestamp("respondedAt"),
  attendedAt: timestamp("attendedAt"),
  reminder24hSent: boolean("reminder24hSent").default(false).notNull(),
  reminder1hSent: boolean("reminder1hSent").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InterviewPanelist = typeof interviewPanelists.$inferSelect;
export type InsertInterviewPanelist = typeof interviewPanelists.$inferInsert;

/**
 * Panel member feedback - feedback submitted by interview panel members
 */
export const panelistFeedback = mysqlTable("panelist_feedback", {
  id: int("id").autoincrement().primaryKey(),
  interviewId: int("interviewId").notNull().references(() => interviews.id),
  panelistId: int("panelistId").notNull().references(() => interviewPanelists.id),
  userId: int("userId").notNull().references(() => users.id),
  overallRating: int("overallRating").notNull(), // 1-5
  technicalSkills: int("technicalSkills"), // 1-5
  communicationSkills: int("communicationSkills"), // 1-5
  problemSolving: int("problemSolving"), // 1-5
  cultureFit: int("cultureFit"), // 1-5
  strengths: text("strengths"),
  weaknesses: text("weaknesses"),
  notes: text("notes"),
  recommendation: mysqlEnum("recommendation", ["strong_hire", "hire", "no_hire", "strong_no_hire"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PanelistFeedback = typeof panelistFeedback.$inferSelect;
export type InsertPanelistFeedback = typeof panelistFeedback.$inferInsert;

/**
 * Recruiter notification preferences
 */
export const recruiterNotificationPreferences = mysqlTable("recruiter_notification_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  // Application notifications
  newApplications: boolean("newApplications").default(true).notNull(),
  applicationStatusChanges: boolean("applicationStatusChanges").default(true).notNull(),
  applicationFrequency: mysqlEnum("applicationFrequency", ["immediate", "daily", "weekly"]).default("immediate").notNull(),
  // Interview notifications
  interviewScheduled: boolean("interviewScheduled").default(true).notNull(),
  interviewReminders: boolean("interviewReminders").default(true).notNull(),
  interviewCompleted: boolean("interviewCompleted").default(true).notNull(),
  panelistResponses: boolean("panelistResponses").default(true).notNull(),
  // Feedback notifications
  candidateFeedback: boolean("candidateFeedback").default(true).notNull(),
  panelistFeedbackSubmitted: boolean("panelistFeedbackSubmitted").default(true).notNull(),
  // Other notifications
  weeklyDigest: boolean("weeklyDigest").default(true).notNull(),
  systemUpdates: boolean("systemUpdates").default(false).notNull(),
  marketingEmails: boolean("marketingEmails").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RecruiterNotificationPreferences = typeof recruiterNotificationPreferences.$inferSelect;
export type InsertRecruiterNotificationPreferences = typeof recruiterNotificationPreferences.$inferInsert;


/**
 * Panel action tokens for one-time email-based actions (accept/decline/reschedule/feedback)
 */
export const panelActionTokens = mysqlTable("panel_action_tokens", {
  id: int("id").autoincrement().primaryKey(),
  panelistId: int("panelistId").notNull(),
  interviewId: int("interviewId").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  actionType: mysqlEnum("actionType", ["accept", "decline", "reschedule", "feedback"]).notNull(),
  usedAt: timestamp("usedAt"),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PanelActionToken = typeof panelActionTokens.$inferSelect;
export type InsertPanelActionToken = typeof panelActionTokens.$inferInsert;


/**
 * Reschedule requests from panel members
 */
export const rescheduleRequests = mysqlTable("reschedule_requests", {
  id: int("id").autoincrement().primaryKey(),
  interviewId: int("interviewId").notNull().references(() => interviews.id),
  panelistId: int("panelistId").notNull().references(() => interviewPanelists.id),
  requestedBy: int("requestedBy").references(() => users.id), // null for non-registered panelists
  reason: text("reason"),
  preferredDates: text("preferredDates"), // JSON array of preferred date/time slots
  status: mysqlEnum("status", ["pending", "approved", "rejected", "resolved", "alternative_proposed"]).default("pending").notNull(),
  resolvedAt: timestamp("resolvedAt"),
  resolvedBy: int("resolvedBy").references(() => users.id),
  newInterviewTime: timestamp("newInterviewTime"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RescheduleRequest = typeof rescheduleRequests.$inferSelect;
export type InsertRescheduleRequest = typeof rescheduleRequests.$inferInsert;

/**
 * Job skill requirements - mandatory skills for job applications
 */
export const jobSkillRequirements = mysqlTable("job_skill_requirements", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull().references(() => jobs.id),
  skillName: varchar("skillName", { length: 255 }).notNull(),
  isMandatory: boolean("isMandatory").default(true).notNull(),
  orderIndex: int("orderIndex").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type JobSkillRequirement = typeof jobSkillRequirements.$inferSelect;
export type InsertJobSkillRequirement = typeof jobSkillRequirements.$inferInsert;

/**
 * Candidate skill ratings - skill matrix submitted with job applications
 */
export const candidateSkillRatings = mysqlTable("candidate_skill_ratings", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId").notNull().references(() => applications.id),
  skillRequirementId: int("skillRequirementId").notNull().references(() => jobSkillRequirements.id),
  skillName: varchar("skillName", { length: 255 }).notNull(),
  rating: int("rating").notNull(), // 1-5 scale
  yearsExperience: int("yearsExperience").notNull(), // years of experience
  lastUsedYear: int("lastUsedYear").notNull(), // e.g., 2024, 2023
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CandidateSkillRating = typeof candidateSkillRatings.$inferSelect;
export type InsertCandidateSkillRating = typeof candidateSkillRatings.$inferInsert;


/**
 * Candidate profile sharing - secure links for sharing profiles with clients
 */
export const candidateProfileShares = mysqlTable("candidate_profile_shares", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidateId").notNull().references(() => candidates.id),
  sharedByUserId: int("sharedByUserId").notNull().references(() => users.id),
  shareToken: varchar("shareToken", { length: 64 }).notNull().unique(),
  recipientEmail: varchar("recipientEmail", { length: 320 }),
  recipientName: varchar("recipientName", { length: 255 }),
  customerId: int("customerId").references(() => customers.id), // Optional: link to client
  jobId: int("jobId").references(() => jobs.id), // Optional: context for which job
  matchScore: int("matchScore"), // Optional: include match score
  includeResume: boolean("includeResume").default(true).notNull(),
  includeVideo: boolean("includeVideo").default(true).notNull(),
  includeContact: boolean("includeContact").default(false).notNull(), // Whether to show contact info
  viewCount: int("viewCount").default(0).notNull(),
  lastViewedAt: timestamp("lastViewedAt"),
  expiresAt: timestamp("expiresAt"), // Optional expiration
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CandidateProfileShare = typeof candidateProfileShares.$inferSelect;
export type InsertCandidateProfileShare = typeof candidateProfileShares.$inferInsert;


/**
 * Environment variables configuration - editable settings stored in database
 * Stores current and previous values for rollback capability
 */
export const environmentVariables = mysqlTable("environment_variables", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  currentValue: text("currentValue").notNull(),
  previousValue: text("previousValue"), // For rollback capability
  description: varchar("description", { length: 500 }),
  category: varchar("category", { length: 100 }), // e.g., 'App Config', 'Email', 'Video'
  isEditable: boolean("isEditable").default(true).notNull(),
  isSensitive: boolean("isSensitive").default(false).notNull(),
  updatedBy: int("updatedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EnvironmentVariable = typeof environmentVariables.$inferSelect;
export type InsertEnvironmentVariable = typeof environmentVariables.$inferInsert;

/**
 * Application logs - store critical application events and errors
 */
export const applicationLogs = mysqlTable("application_logs", {
  id: int("id").autoincrement().primaryKey(),
  level: mysqlEnum("level", ["debug", "info", "warn", "error", "critical"]).notNull(),
  source: varchar("source", { length: 255 }).notNull(), // e.g., 'auth', 'api', 'database', 'email'
  message: text("message").notNull(),
  details: text("details"), // JSON string with additional context
  userId: int("userId").references(() => users.id), // Optional: associated user
  requestId: varchar("requestId", { length: 64 }), // For tracing requests
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  stackTrace: text("stackTrace"), // For errors
  resolved: boolean("resolved").default(false).notNull(),
  resolvedBy: int("resolvedBy").references(() => users.id),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ApplicationLog = typeof applicationLogs.$inferSelect;
export type InsertApplicationLog = typeof applicationLogs.$inferInsert;

/**
 * Profile completion badges - awarded at milestones
 */
export const profileBadges = mysqlTable("profileBadges", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(), // e.g., "Profile Starter", "Profile Pro", "Profile Master"
  description: text("description").notNull(),
  icon: varchar("icon", { length: 100 }).notNull(), // Icon name or emoji
  color: varchar("color", { length: 50 }).notNull(), // Badge color
  milestone: int("milestone").notNull(), // Percentage threshold (50, 75, 100)
  points: int("points").notNull().default(0), // Points awarded
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProfileBadge = typeof profileBadges.$inferSelect;
export type InsertProfileBadge = typeof profileBadges.$inferInsert;

/**
 * User badges - tracks which badges users have earned
 */
export const userBadges = mysqlTable("userBadges", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  badgeId: int("badgeId").notNull().references(() => profileBadges.id),
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
  viewed: boolean("viewed").default(false).notNull(), // For showing "new badge" notification
});

export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = typeof userBadges.$inferInsert;

/**
 * User points - tracks gamification points for profile completion
 */
export const userPoints = mysqlTable("userPoints", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id).unique(),
  totalPoints: int("totalPoints").notNull().default(0),
  level: int("level").notNull().default(1), // Calculated from total points
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserPoints = typeof userPoints.$inferSelect;
export type InsertUserPoints = typeof userPoints.$inferInsert;

/**
 * Profile completion reminders - tracks when reminders were sent
 */
export const profileReminders = mysqlTable("profileReminders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  reminderType: varchar("reminderType", { length: 50 }).notNull(), // '3-day', '7-day'
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  profilePercentage: int("profilePercentage").notNull(), // Profile completion % when reminder was sent
});

export type ProfileReminder = typeof profileReminders.$inferSelect;
export type InsertProfileReminder = typeof profileReminders.$inferInsert;

/**
 * Profile completion analytics - tracks historical completion data
 */
export const profileCompletionAnalytics = mysqlTable("profileCompletionAnalytics", {
  id: int("id").autoincrement().primaryKey(),
  date: date("date").notNull().unique(), // Daily snapshot
  totalCandidates: int("totalCandidates").notNull().default(0),
  completedProfiles: int("completedProfiles").notNull().default(0), // 100% complete
  partialProfiles: int("partialProfiles").notNull().default(0), // 50-99% complete
  incompleteProfiles: int("incompleteProfiles").notNull().default(0), // <50% complete
  averageCompletion: int("averageCompletion").notNull().default(0), // Average percentage
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProfileCompletionAnalytics = typeof profileCompletionAnalytics.$inferSelect;
export type InsertProfileCompletionAnalytics = typeof profileCompletionAnalytics.$inferInsert;

/**
 * Bias Detection Logs - Track potential bias in AI decisions
 */
export const biasDetectionLogs = mysqlTable("biasDetectionLogs", {
  id: int("id").autoincrement().primaryKey(),
  entityType: mysqlEnum("entityType", ["resume", "job_description", "match_score", "interview_evaluation"]).notNull(),
  entityId: int("entityId").notNull(), // ID of the resume, job, application, etc.
  biasType: mysqlEnum("biasType", ["gender", "age", "ethnicity", "disability", "language", "education", "location"]).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high"]).notNull(),
  detectedText: text("detectedText"), // The specific text that triggered the bias detection
  recommendation: text("recommendation"), // Suggested action to mitigate bias
  flaggedBy: varchar("flaggedBy", { length: 50 }).notNull(), // 'ai_system' or user ID
  resolved: boolean("resolved").default(false).notNull(),
  resolvedAt: timestamp("resolvedAt"),
  resolvedBy: int("resolvedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BiasDetectionLog = typeof biasDetectionLogs.$inferSelect;
export type InsertBiasDetectionLog = typeof biasDetectionLogs.$inferInsert;

/**
 * Diversity Metrics - Track diversity statistics for reporting
 */
export const diversityMetrics = mysqlTable("diversityMetrics", {
  id: int("id").autoincrement().primaryKey(),
  recruiterId: int("recruiterId").notNull().references(() => recruiters.id),
  jobId: int("jobId").references(() => jobs.id), // Null for overall recruiter metrics
  metricType: mysqlEnum("metricType", ["applications", "interviews", "offers", "hires"]).notNull(),
  periodStart: date("periodStart").notNull(),
  periodEnd: date("periodEnd").notNull(),
  totalCount: int("totalCount").notNull(),
  // Diversity breakdowns (percentages)
  genderDiversity: json("genderDiversity"), // { male: 45, female: 50, non_binary: 5 }
  ethnicityDiversity: json("ethnicityDiversity"),
  ageDiversity: json("ageDiversity"), // { "18-25": 20, "26-35": 50, "36-45": 25, "46+": 5 }
  educationDiversity: json("educationDiversity"),
  locationDiversity: json("locationDiversity"),
  biasScore: decimal("biasScore", { precision: 5, scale: 2 }), // 0-100, lower is better
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DiversityMetric = typeof diversityMetrics.$inferSelect;
export type InsertDiversityMetric = typeof diversityMetrics.$inferInsert;

/**
 * Match Outcomes - Track hiring outcomes for AI match algorithm learning
 */
export const matchOutcomes = mysqlTable("matchOutcomes", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId").notNull().references(() => applications.id),
  candidateId: int("candidateId").notNull().references(() => candidates.id),
  jobId: int("jobId").notNull().references(() => jobs.id),
  recruiterId: int("recruiterId").notNull().references(() => recruiters.id),
  // AI Match Scores at time of application
  initialMatchScore: decimal("initialMatchScore", { precision: 5, scale: 2 }).notNull(),
  skillsScore: decimal("skillsScore", { precision: 5, scale: 2 }),
  experienceScore: decimal("experienceScore", { precision: 5, scale: 2 }),
  locationScore: decimal("locationScore", { precision: 5, scale: 2 }),
  salaryScore: decimal("salaryScore", { precision: 5, scale: 2 }),
  culturalFitScore: decimal("culturalFitScore", { precision: 5, scale: 2 }),
  // Actual Outcome
  outcome: mysqlEnum("outcome", ["hired", "rejected", "withdrawn", "no_response", "in_progress"]).notNull(),
  outcomeDate: timestamp("outcomeDate"),
  // Performance Tracking (for hired candidates)
  performanceRating: decimal("performanceRating", { precision: 3, scale: 2 }), // 1-5 scale, collected after 90 days
  retentionMonths: int("retentionMonths"), // How long the candidate stayed
  // Feedback
  recruiterFeedback: text("recruiterFeedback"),
  recruiterRating: int("recruiterRating"), // 1-5, how well did AI match perform
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MatchOutcome = typeof matchOutcomes.$inferSelect;
export type InsertMatchOutcome = typeof matchOutcomes.$inferInsert;

/**
 * Algorithm Performance Metrics - Track AI matching algorithm performance over time
 */
export const algorithmPerformance = mysqlTable("algorithmPerformance", {
  id: int("id").autoincrement().primaryKey(),
  algorithmVersion: varchar("algorithmVersion", { length: 50 }).notNull(), // e.g., "v1.0", "v1.1-experimental"
  metricName: varchar("metricName", { length: 100 }).notNull(), // e.g., "precision", "recall", "f1_score"
  metricValue: decimal("metricValue", { precision: 10, scale: 6 }).notNull(),
  sampleSize: int("sampleSize").notNull(), // Number of matches evaluated
  periodStart: date("periodStart").notNull(),
  periodEnd: date("periodEnd").notNull(),
  // Breakdown by job category or industry
  jobCategory: varchar("jobCategory", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AlgorithmPerformance = typeof algorithmPerformance.$inferSelect;
export type InsertAlgorithmPerformance = typeof algorithmPerformance.$inferInsert;

/**
 * AI Notification Preferences - User preferences for proactive AI notifications
 */
export const aiNotificationPreferences = mysqlTable("aiNotificationPreferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  // Candidate preferences
  jobMatchAlerts: boolean("jobMatchAlerts").default(true).notNull(),
  profileImprovementSuggestions: boolean("profileImprovementSuggestions").default(true).notNull(),
  applicationStatusUpdates: boolean("applicationStatusUpdates").default(true).notNull(),
  interviewReminders: boolean("interviewReminders").default(true).notNull(),
  // Recruiter preferences
  topCandidateDigest: boolean("topCandidateDigest").default(true).notNull(),
  digestFrequency: mysqlEnum("digestFrequency", ["daily", "weekly", "realtime"]).default("daily").notNull(),
  newApplicationAlerts: boolean("newApplicationAlerts").default(true).notNull(),
  biasAlerts: boolean("biasAlerts").default(true).notNull(),
  pipelineInsights: boolean("pipelineInsights").default(true).notNull(),
  // Delivery channels
  emailNotifications: boolean("emailNotifications").default(true).notNull(),
  inAppNotifications: boolean("inAppNotifications").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AiNotificationPreference = typeof aiNotificationPreferences.$inferSelect;
export type InsertAiNotificationPreference = typeof aiNotificationPreferences.$inferInsert;

/**
 * AI Notification Queue - Queue for proactive AI-generated notifications
 */
export const aiNotificationQueue = mysqlTable("aiNotificationQueue", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  notificationType: varchar("notificationType", { length: 100 }).notNull(), // e.g., "job_match", "top_candidate_digest"
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  actionUrl: varchar("actionUrl", { length: 500 }), // Link to relevant page
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium").notNull(),
  status: mysqlEnum("status", ["pending", "sent", "failed", "cancelled"]).default("pending").notNull(),
  scheduledFor: timestamp("scheduledFor").notNull(),
  sentAt: timestamp("sentAt"),
  readAt: timestamp("readAt"),
  metadata: json("metadata"), // Additional context data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiNotificationQueue = typeof aiNotificationQueue.$inferSelect;
export type InsertAiNotificationQueue = typeof aiNotificationQueue.$inferInsert;

/**
 * Sourcing Campaigns - Track automated candidate discovery campaigns
 */
export const sourcingCampaigns = mysqlTable("sourcing_campaigns", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  jobId: int("jobId").references(() => jobs.id),
  createdBy: int("createdBy").notNull().references(() => users.id),
  
  // Search criteria
  targetRoles: text("targetRoles"), // JSON array of job titles to search for
  requiredSkills: text("requiredSkills"), // JSON array of skills
  locations: text("locations"), // JSON array of locations
  experienceMin: int("experienceMin"),
  experienceMax: int("experienceMax"),
  
  // Sourcing channels
  searchLinkedIn: boolean("searchLinkedIn").default(true),
  searchGitHub: boolean("searchGitHub").default(true),
  searchStackOverflow: boolean("searchStackOverflow").default(false),
  
  // Campaign settings
  maxCandidates: int("maxCandidates").default(100),
  autoEnrich: boolean("autoEnrich").default(true), // Automatically enrich profiles with AI
  autoAddToPool: boolean("autoAddToPool").default(true), // Add to talent pool automatically
  
  // Status tracking
  status: mysqlEnum("status", ["draft", "active", "paused", "completed", "failed"]).default("draft").notNull(),
  candidatesFound: int("candidatesFound").default(0),
  candidatesEnriched: int("candidatesEnriched").default(0),
  candidatesAdded: int("candidatesAdded").default(0),
  
  // Timestamps
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SourcingCampaign = typeof sourcingCampaigns.$inferSelect;
export type InsertSourcingCampaign = typeof sourcingCampaigns.$inferInsert;

/**
 * Sourced Candidates - Candidates discovered through automated sourcing
 */
export const sourcedCandidates = mysqlTable("sourced_candidates", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull().references(() => sourcingCampaigns.id),
  candidateId: int("candidateId").references(() => candidates.id), // Linked after creating candidate record
  
  // Source information
  sourceType: mysqlEnum("sourceType", ["linkedin", "github", "stackoverflow", "manual"]).notNull(),
  sourceUrl: varchar("sourceUrl", { length: 500 }),
  sourceProfileId: varchar("sourceProfileId", { length: 255 }),
  
  // Raw profile data
  rawProfileData: text("rawProfileData"), // JSON of scraped data
  
  // Extracted information
  fullName: varchar("fullName", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phoneNumber: varchar("phoneNumber", { length: 50 }),
  location: varchar("location", { length: 255 }),
  currentTitle: varchar("currentTitle", { length: 255 }),
  currentCompany: varchar("currentCompany", { length: 255 }),
  
  // AI enrichment
  enrichmentStatus: mysqlEnum("enrichmentStatus", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  enrichedData: text("enrichedData"), // JSON of AI-extracted skills, experience, etc.
  matchScore: int("matchScore"), // 0-100 match score for the job
  
  // Processing status
  addedToPool: boolean("addedToPool").default(false),
  contacted: boolean("contacted").default(false),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SourcedCandidate = typeof sourcedCandidates.$inferSelect;
export type InsertSourcedCandidate = typeof sourcedCandidates.$inferInsert;

/**
 * Candidate Success Predictions - ML-based success scoring
 */
export const candidateSuccessPredictions = mysqlTable("candidate_success_predictions", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId").notNull(), // Reference to applications table
  candidateId: int("candidateId").notNull().references(() => candidates.id),
  jobId: int("jobId").notNull().references(() => jobs.id),
  
  // Prediction scores (0-100)
  overallSuccessScore: int("overallSuccessScore").notNull(),
  skillsMatchScore: int("skillsMatchScore"),
  experienceMatchScore: int("experienceMatchScore"),
  cultureFitScore: int("cultureFitScore"),
  retentionPredictionScore: int("retentionPredictionScore"),
  
  // Feature contributions
  topPositiveFactors: text("topPositiveFactors"), // JSON array of reasons
  topNegativeFactors: text("topNegativeFactors"), // JSON array of concerns
  
  // Model metadata
  modelVersion: varchar("modelVersion", { length: 50 }),
  confidence: int("confidence"), // 0-100 confidence in prediction
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CandidateSuccessPrediction = typeof candidateSuccessPredictions.$inferSelect;
export type InsertCandidateSuccessPrediction = typeof candidateSuccessPredictions.$inferInsert;

/**
 * Candidate Interactions - Track engagement with emails, calendar links, etc.
 * Used to improve prediction models and measure automation effectiveness
 */
export const candidateInteractions = mysqlTable("candidate_interactions", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidateId").references(() => candidates.id),
  applicationId: int("applicationId"), // Optional - may not have applied yet
  interviewId: int("interviewId"), // Optional - for interview-related interactions
  
  // Interaction type
  interactionType: mysqlEnum("interactionType", [
    "email_opened",
    "email_clicked", 
    "email_replied",
    "calendar_link_clicked",
    "interview_booked",
    "interview_rescheduled",
    "interview_cancelled",
    "application_submitted",
    "profile_viewed"
  ]).notNull(),
  
  // Context
  emailCampaignId: int("emailCampaignId"), // If from email campaign
  sourcingCampaignId: int("sourcingCampaignId"), // If from sourcing campaign
  linkUrl: varchar("linkUrl", { length: 500 }), // The link that was clicked
  
  // Metadata
  metadata: text("metadata"), // JSON for additional context
  userAgent: varchar("userAgent", { length: 500 }),
  ipAddress: varchar("ipAddress", { length: 50 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CandidateInteraction = typeof candidateInteractions.$inferSelect;
export type InsertCandidateInteraction = typeof candidateInteractions.$inferInsert;

/**
 * LinkedIn Profiles - Store imported candidate profiles from LinkedIn
 */
export const linkedinProfiles = mysqlTable("linkedin_profiles", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidateId").references(() => candidates.id),
  
  // LinkedIn identifiers
  linkedinId: varchar("linkedinId", { length: 255 }).unique().notNull(),
  profileUrl: varchar("profileUrl", { length: 500 }),
  publicIdentifier: varchar("publicIdentifier", { length: 255 }),
  
  // Profile data
  firstName: varchar("firstName", { length: 255 }),
  lastName: varchar("lastName", { length: 255 }),
  headline: text("headline"),
  summary: text("summary"),
  location: varchar("location", { length: 255 }),
  industry: varchar("industry", { length: 255 }),
  
  // Current position
  currentCompany: varchar("currentCompany", { length: 255 }),
  currentTitle: varchar("currentTitle", { length: 255 }),
  
  // Profile metadata
  profilePictureUrl: varchar("profilePictureUrl", { length: 500 }),
  connections: int("connections"),
  followersCount: int("followersCount"),
  
  // Full profile data (JSON)
  fullProfileData: text("fullProfileData"), // Complete LinkedIn API response
  
  // Import tracking
  importedBy: int("importedBy").notNull(), // Recruiter who imported
  sourcingCampaignId: int("sourcingCampaignId").references(() => sourcingCampaigns.id),
  importSource: varchar("importSource", { length: 100 }), // 'search', 'recruiter', 'manual'
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LinkedinProfile = typeof linkedinProfiles.$inferSelect;
export type InsertLinkedinProfile = typeof linkedinProfiles.$inferInsert;

/**
 * LinkedIn InMails - Track outreach messages sent through LinkedIn
 */
export const linkedinInmails = mysqlTable("linkedin_inmails", {
  id: int("id").autoincrement().primaryKey(),
  linkedinProfileId: int("linkedinProfileId").notNull().references(() => linkedinProfiles.id),
  candidateId: int("candidateId").references(() => candidates.id),
  recruiterId: int("recruiterId").notNull().references(() => recruiters.id),
  
  // InMail details
  subject: varchar("subject", { length: 500 }),
  message: text("message"),
  linkedinConversationId: varchar("linkedinConversationId", { length: 255 }),
  
  // Tracking
  sentAt: timestamp("sentAt").notNull(),
  openedAt: timestamp("openedAt"),
  repliedAt: timestamp("repliedAt"),
  replied: boolean("replied").default(false).notNull(),
  replyMessage: text("replyMessage"),
  
  // Campaign association
  sourcingCampaignId: int("sourcingCampaignId").references(() => sourcingCampaigns.id),
  emailCampaignId: int("emailCampaignId"),
  
  // Metadata
  inmailCreditsUsed: int("inmailCreditsUsed").default(1),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LinkedinInmail = typeof linkedinInmails.$inferSelect;
export type InsertLinkedinInmail = typeof linkedinInmails.$inferInsert;

/**
 * Calendar Integrations - Store OAuth tokens for calendar providers
 */
export const calendarIntegrations = mysqlTable("calendar_integrations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  
  // Provider info
  provider: mysqlEnum("provider", ["google", "microsoft", "calendly", "cal_com"]).notNull(),
  providerAccountId: varchar("providerAccountId", { length: 255 }),
  providerEmail: varchar("providerEmail", { length: 320 }),
  
  // OAuth tokens
  accessToken: text("accessToken").notNull(),
  refreshToken: text("refreshToken"),
  tokenExpiry: timestamp("tokenExpiry"),
  
  // Calendar settings
  defaultCalendarId: varchar("defaultCalendarId", { length: 255 }),
  calendarName: varchar("calendarName", { length: 255 }),
  timezone: varchar("timezone", { length: 100 }).default("UTC").notNull(),
  
  // Sync settings
  autoSync: boolean("autoSync").default(true).notNull(),
  syncDirection: mysqlEnum("syncDirection", ["one-way", "two-way"]).default("two-way").notNull(),
  lastSyncAt: timestamp("lastSyncAt"),
  
  // Status
  isActive: boolean("isActive").default(true).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CalendarIntegration = typeof calendarIntegrations.$inferSelect;
export type InsertCalendarIntegration = typeof calendarIntegrations.$inferInsert;

/**
 * Calendar Events - Sync interview events with external calendars
 */
export const calendarEvents = mysqlTable("calendar_events", {
  id: int("id").autoincrement().primaryKey(),
  interviewId: int("interviewId").notNull().references(() => interviews.id),
  calendarIntegrationId: int("calendarIntegrationId").notNull().references(() => calendarIntegrations.id),
  
  // External calendar event details
  externalEventId: varchar("externalEventId", { length: 255 }).notNull(),
  provider: mysqlEnum("provider", ["google", "microsoft", "calendly", "cal_com"]).notNull(),
  
  // Event details
  title: varchar("title", { length: 500 }),
  description: text("description"),
  location: varchar("location", { length: 500 }),
  meetingUrl: varchar("meetingUrl", { length: 500 }),
  
  // Timing
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime").notNull(),
  timezone: varchar("timezone", { length: 100 }).notNull(),
  
  // Attendees
  attendees: text("attendees"), // JSON array of email addresses
  organizerEmail: varchar("organizerEmail", { length: 320 }),
  
  // Sync status
  syncStatus: mysqlEnum("syncStatus", ["pending", "synced", "failed", "cancelled"]).default("pending").notNull(),
  lastSyncAt: timestamp("lastSyncAt"),
  syncError: text("syncError"),
  
  // Booking tracking (for Calendly/Cal.com)
  bookingConfirmedAt: timestamp("bookingConfirmedAt"),
  bookingCancelledAt: timestamp("bookingCancelledAt"),
  cancellationReason: text("cancellationReason"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = typeof calendarEvents.$inferInsert;

/**
 * Scheduling Links - Calendly/Cal.com scheduling links for candidates
 */
export const schedulingLinks = mysqlTable("scheduling_links", {
  id: int("id").autoincrement().primaryKey(),
  recruiterId: int("recruiterId").notNull().references(() => recruiters.id),
  interviewId: int("interviewId").references(() => interviews.id),
  candidateId: int("candidateId").references(() => candidates.id),
  
  // Link details
  provider: mysqlEnum("provider", ["calendly", "cal_com"]).notNull(),
  schedulingUrl: varchar("schedulingUrl", { length: 500 }).notNull(),
  externalLinkId: varchar("externalLinkId", { length: 255 }),
  
  // Configuration
  eventType: varchar("eventType", { length: 255 }), // e.g., "30min-phone-screen"
  duration: int("duration").notNull(), // in minutes
  timezone: varchar("timezone", { length: 100 }),
  
  // Availability
  availableSlots: text("availableSlots"), // JSON array of time slots
  
  // Tracking
  linkSentAt: timestamp("linkSentAt"),
  linkClickedAt: timestamp("linkClickedAt"),
  bookedAt: timestamp("bookedAt"),
  bookingStatus: mysqlEnum("bookingStatus", ["pending", "clicked", "booked", "cancelled", "expired"]).default("pending").notNull(),
  
  // Expiry
  expiresAt: timestamp("expiresAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SchedulingLink = typeof schedulingLinks.$inferSelect;
export type InsertSchedulingLink = typeof schedulingLinks.$inferInsert;


/**
 * LinkedIn Credit Usage - Track InMail credit usage per recruiter
 */
export const linkedinCreditUsage = mysqlTable("linkedin_credit_usage", {
  id: int("id").autoincrement().primaryKey(),
  recruiterId: int("recruiterId").notNull().references(() => recruiters.id),
  
  // Credit tracking
  creditsUsed: int("creditsUsed").default(1).notNull(),
  creditsRemaining: int("creditsRemaining"),
  creditLimit: int("creditLimit"), // Per-recruiter monthly limit
  
  // Usage details
  usageType: mysqlEnum("usageType", ["inmail", "profile_view", "search"]).notNull(),
  linkedinInmailId: int("linkedinInmailId").references(() => linkedinInmails.id),
  linkedinProfileId: int("linkedinProfileId").references(() => linkedinProfiles.id),
  
  // Metadata
  description: varchar("description", { length: 500 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LinkedinCreditUsage = typeof linkedinCreditUsage.$inferSelect;
export type InsertLinkedinCreditUsage = typeof linkedinCreditUsage.$inferInsert;

/**
 * InMail Templates - Team-level email templates for LinkedIn outreach
 */
export const inmailTemplates = mysqlTable("inmail_templates", {
  id: int("id").autoincrement().primaryKey(),
  
  // Template details
  name: varchar("name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body").notNull(),
  
  // Variables supported in template
  variables: text("variables"), // JSON array: ["firstName", "lastName", "company", "title", "skills"]
  
  // Template metadata
  category: varchar("category", { length: 100 }), // e.g., "initial_outreach", "follow_up", "interview_invite"
  isActive: boolean("isActive").default(true).notNull(),
  
  // Usage tracking
  timesUsed: int("timesUsed").default(0).notNull(),
  responseRate: decimal("responseRate", { precision: 5, scale: 2 }), // Percentage
  
  // Audit
  createdBy: int("createdBy").notNull().references(() => users.id),
  lastUsedAt: timestamp("lastUsedAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InmailTemplate = typeof inmailTemplates.$inferSelect;
export type InsertInmailTemplate = typeof inmailTemplates.$inferInsert;


/**
 * Company settings for API keys and configuration
 */
export const companySettings = mysqlTable("companySettings", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull().references(() => companies.id, { onDelete: "cascade" }),
  
  // API Keys (encrypted)
  sendgridApiKey: varchar("sendgridApiKey", { length: 500 }),
  resendApiKey: varchar("resendApiKey", { length: 500 }),
  openaiApiKey: varchar("openaiApiKey", { length: 500 }),
  linkedinApiKey: varchar("linkedinApiKey", { length: 500 }),
  
  // Email Configuration
  fromEmail: varchar("fromEmail", { length: 320 }),
  fromName: varchar("fromName", { length: 255 }),
  replyToEmail: varchar("replyToEmail", { length: 320 }),
  
  // Notification Settings
  enableEmailNotifications: boolean("enableEmailNotifications").default(true).notNull(),
  enableSmsNotifications: boolean("enableSmsNotifications").default(false).notNull(),
  
  // Branding
  companyLogo: varchar("companyLogo", { length: 500 }),
  primaryColor: varchar("primaryColor", { length: 7 }), // Hex color
  secondaryColor: varchar("secondaryColor", { length: 7 }),
  
  // Other Settings (JSON)
  additionalSettings: json("additionalSettings"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CompanySettings = typeof companySettings.$inferSelect;
export type InsertCompanySettings = typeof companySettings.$inferInsert;

/**
 * User activity logs for audit trail
 */
export const userActivityLogs = mysqlTable("userActivityLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  companyId: int("companyId").references(() => companies.id, { onDelete: "cascade" }),
  
  // Activity Details
  action: varchar("action", { length: 100 }).notNull(), // e.g., "login", "create_job", "update_candidate"
  resource: varchar("resource", { length: 100 }), // e.g., "job", "candidate", "application"
  resourceId: int("resourceId"), // ID of the affected resource
  
  // Request Details
  ipAddress: varchar("ipAddress", { length: 45 }), // IPv6 max length
  userAgent: text("userAgent"),
  
  // Additional Context
  details: json("details"), // Any additional context about the action
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserActivityLog = typeof userActivityLogs.$inferSelect;
export type InsertUserActivityLog = typeof userActivityLogs.$inferInsert;

/**
 * System health metrics for monitoring
 */
export const systemHealthMetrics = mysqlTable("systemHealthMetrics", {
  id: int("id").autoincrement().primaryKey(),
  
  // Metric Details
  metricType: varchar("metricType", { length: 100 }).notNull(), // e.g., "api_response_time", "database_query_time"
  metricValue: decimal("metricValue", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 50 }), // e.g., "ms", "count", "percentage"
  
  // Context
  source: varchar("source", { length: 100 }), // e.g., "api", "database", "email_service"
  details: json("details"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SystemHealthMetric = typeof systemHealthMetrics.$inferSelect;
export type InsertSystemHealthMetric = typeof systemHealthMetrics.$inferInsert;


/**
 * Team members table for company admin to manage recruiters
 */
export const teamMembers = mysqlTable("team_members", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull().references(() => companies.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  recruiterId: int("recruiterId").references(() => recruiters.id, { onDelete: "cascade" }),
  
  // Role and permissions
  role: mysqlEnum("role", ["recruiter", "senior_recruiter", "team_lead"]).notNull().default("recruiter"),
  permissions: json("permissions"), // Custom permissions object
  
  // Status
  status: mysqlEnum("status", ["active", "inactive", "suspended"]).notNull().default("active"),
  
  // Performance tracking
  jobsAssigned: int("jobsAssigned").default(0),
  applicationsProcessed: int("applicationsProcessed").default(0),
  interviewsScheduled: int("interviewsScheduled").default(0),
  hiresCompleted: int("hiresCompleted").default(0),
  
  // Dates
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  lastActiveAt: timestamp("lastActiveAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;
