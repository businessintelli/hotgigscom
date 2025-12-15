import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, index } from "drizzle-orm/mysql-core";

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
