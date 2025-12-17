import { mysqlTable, int, varchar, text, timestamp, boolean, mysqlEnum, date, json } from "drizzle-orm/mysql-core";
import { users, jobs, candidates } from "./schema";

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
 * Email Campaigns - Automated outreach campaigns
 */
export const emailCampaigns = mysqlTable("email_campaigns", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  jobId: int("jobId").references(() => jobs.id),
  sourcingCampaignId: int("sourcingCampaignId").references(() => sourcingCampaigns.id),
  createdBy: int("createdBy").notNull().references(() => users.id),
  
  // Campaign settings
  subject: varchar("subject", { length: 500 }).notNull(),
  emailTemplate: text("emailTemplate").notNull(), // Template with variables like {{name}}, {{company}}
  useAiPersonalization: boolean("useAiPersonalization").default(true),
  
  // Sequence settings
  followUpEnabled: boolean("followUpEnabled").default(true),
  followUpDelayDays: int("followUpDelayDays").default(3),
  maxFollowUps: int("maxFollowUps").default(2),
  
  // Status
  status: mysqlEnum("status", ["draft", "active", "paused", "completed"]).default("draft").notNull(),
  emailsSent: int("emailsSent").default(0),
  emailsOpened: int("emailsOpened").default(0),
  emailsClicked: int("emailsClicked").default(0),
  emailsReplied: int("emailsReplied").default(0),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailCampaign = typeof emailCampaigns.$inferSelect;
export type InsertEmailCampaign = typeof emailCampaigns.$inferInsert;

/**
 * Email Sequences - Individual email steps in a campaign
 */
export const emailSequences = mysqlTable("email_sequences", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull().references(() => emailCampaigns.id),
  
  stepNumber: int("stepNumber").notNull(), // 1 = initial, 2+ = follow-ups
  delayDays: int("delayDays").default(0), // Days after previous step
  
  subject: varchar("subject", { length: 500 }).notNull(),
  emailTemplate: text("emailTemplate").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailSequence = typeof emailSequences.$inferSelect;
export type InsertEmailSequence = typeof emailSequences.$inferInsert;

/**
 * Email Logs - Track individual emails sent
 */
export const emailLogs = mysqlTable("email_logs", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull().references(() => emailCampaigns.id),
  sequenceId: int("sequenceId").references(() => emailSequences.id),
  sourcedCandidateId: int("sourcedCandidateId").references(() => sourcedCandidates.id),
  candidateId: int("candidateId").references(() => candidates.id),
  
  // Email details
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  recipientName: varchar("recipientName", { length: 255 }),
  subject: varchar("subject", { length: 500 }).notNull(),
  emailBody: text("emailBody").notNull(),
  
  // Tracking
  sentAt: timestamp("sentAt"),
  openedAt: timestamp("openedAt"),
  clickedAt: timestamp("clickedAt"),
  repliedAt: timestamp("repliedAt"),
  bouncedAt: timestamp("bouncedAt"),
  unsubscribedAt: timestamp("unsubscribedAt"),
  
  // Status
  status: mysqlEnum("status", ["pending", "sent", "opened", "clicked", "replied", "bounced", "failed"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = typeof emailLogs.$inferInsert;

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
