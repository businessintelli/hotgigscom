import { mysqlTable, mysqlSchema, AnyMySqlColumn, int, mysqlEnum, varchar, text, timestamp, foreignKey, index, json, datetime, tinyint } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const applicationLogs = mysqlTable("application_logs", {
	id: int().autoincrement().notNull(),
	level: mysqlEnum(['debug','info','warn','error','critical']).notNull(),
	source: varchar({ length: 255 }).notNull(),
	message: text().notNull(),
	details: text(),
	userId: int(),
	requestId: varchar({ length: 64 }),
	ipAddress: varchar({ length: 45 }),
	userAgent: text(),
	stackTrace: text(),
	resolved: tinyint().default(0).notNull(),
	resolvedBy: int(),
	resolvedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const applications = mysqlTable("applications", {
	id: int().autoincrement().notNull(),
	jobId: int().notNull().references(() => jobs.id),
	candidateId: int().notNull().references(() => candidates.id),
	coverLetter: text(),
	resumeUrl: varchar({ length: 500 }),
	resumeFilename: varchar({ length: 255 }),
	status: mysqlEnum(['submitted','reviewing','shortlisted','interviewing','offered','rejected','withdrawn']).default('submitted'),
	aiScore: int(),
	notes: text(),
	submittedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	resumeProfileId: int().references(() => resumeProfiles.id),
	videoIntroductionId: int().references(() => videoIntroductions.id),
});

export const assessmentAnswers = mysqlTable("assessmentAnswers", {
	id: int().autoincrement().notNull(),
	attemptId: int().notNull().references(() => assessmentAttempts.id),
	questionId: int().notNull().references(() => assessmentQuestions.id),
	answer: text().notNull(),
	isCorrect: tinyint(),
	pointsEarned: int(),
});

export const assessmentAttempts = mysqlTable("assessmentAttempts", {
	id: int().autoincrement().notNull(),
	assessmentId: int().notNull().references(() => skillAssessments.id),
	candidateId: int().notNull().references(() => candidates.id),
	applicationId: int().references(() => applications.id),
	score: int(),
	totalPoints: int(),
	earnedPoints: int(),
	passed: tinyint(),
	startedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	completedAt: timestamp({ mode: 'string' }),
	timeSpent: int(),
});

export const assessmentQuestions = mysqlTable("assessmentQuestions", {
	id: int().autoincrement().notNull(),
	assessmentId: int().notNull().references(() => skillAssessments.id),
	questionText: text().notNull(),
	questionType: mysqlEnum(['multiple_choice','true_false','short_answer']).notNull(),
	options: text(),
	correctAnswer: text().notNull(),
	points: int().default(1).notNull(),
	orderIndex: int().notNull(),
});

export const associates = mysqlTable("associates", {
	id: int().autoincrement().notNull(),
	candidateId: int().notNull().references(() => candidates.id),
	employeeId: varchar({ length: 100 }),
	jobTitle: varchar({ length: 255 }).notNull(),
	department: varchar({ length: 255 }),
	startDate: timestamp({ mode: 'string' }).notNull(),
	endDate: timestamp({ mode: 'string' }),
	status: mysqlEnum(['active','onboarding','offboarding','terminated']).default('onboarding').notNull(),
	managerId: int().references(() => recruiters.id),
	onboardedBy: int().notNull().references(() => recruiters.id),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const campaignRecipients = mysqlTable("campaignRecipients", {
	id: int().autoincrement().notNull(),
	campaignId: int().notNull().references(() => emailCampaigns.id),
	candidateId: int().notNull().references(() => candidates.id),
	email: varchar({ length: 255 }).notNull(),
	personalizedSubject: varchar({ length: 500 }),
	personalizedBody: text(),
	status: varchar({ length: 50 }).default('pending').notNull(),
	sentAt: timestamp({ mode: 'string' }),
	openedAt: timestamp({ mode: 'string' }),
	clickedAt: timestamp({ mode: 'string' }),
	bouncedAt: timestamp({ mode: 'string' }),
	repliedAt: timestamp({ mode: 'string' }),
	trackingId: varchar({ length: 100 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const candidateTagAssignments = mysqlTable("candidateTagAssignments", {
	id: int().autoincrement().notNull(),
	candidateId: int().notNull().references(() => candidates.id),
	tagId: int().notNull().references(() => candidateTags.id),
	assignedBy: int().notNull().references(() => users.id),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const candidateTags = mysqlTable("candidateTags", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 100 }).notNull(),
	color: varchar({ length: 50 }).default('blue'),
	userId: int().notNull().references(() => users.id),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const candidateProfileShares = mysqlTable("candidate_profile_shares", {
	id: int().autoincrement().notNull(),
	candidateId: int().notNull(),
	sharedByUserId: int().notNull(),
	shareToken: varchar({ length: 64 }).notNull(),
	recipientEmail: varchar({ length: 320 }),
	recipientName: varchar({ length: 255 }),
	customerId: int(),
	jobId: int(),
	matchScore: int(),
	includeResume: tinyint().default(1).notNull(),
	includeVideo: tinyint().default(1).notNull(),
	includeContact: tinyint().default(0).notNull(),
	viewCount: int().default(0).notNull(),
	lastViewedAt: timestamp({ mode: 'string' }),
	expiresAt: timestamp({ mode: 'string' }),
	isActive: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("shareToken").on(table.shareToken),
]);

export const candidateSkillRatings = mysqlTable("candidate_skill_ratings", {
	id: int().autoincrement().notNull(),
	applicationId: int().notNull().references(() => applications.id),
	skillRequirementId: int().notNull().references(() => jobSkillRequirements.id),
	skillName: varchar({ length: 255 }).notNull(),
	rating: int().notNull(),
	yearsExperience: int().notNull(),
	lastUsedYear: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const candidates = mysqlTable("candidates", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id),
	title: varchar({ length: 255 }),
	phoneNumber: varchar({ length: 50 }),
	location: varchar({ length: 255 }),
	bio: text(),
	skills: text(),
	experience: text(),
	education: text(),
	resumeUrl: varchar({ length: 500 }),
	resumeFilename: varchar({ length: 255 }),
	resumeUploadedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	parsedResumeData: text(),
	linkedinUrl: varchar({ length: 500 }),
	githubUrl: varchar({ length: 500 }),
	certifications: text(),
	languages: text(),
	projects: text(),
	totalExperienceYears: int(),
	seniorityLevel: varchar({ length: 50 }),
	primaryDomain: varchar({ length: 100 }),
	skillCategories: text(),
	availability: varchar({ length: 50 }),
	visaStatus: varchar({ length: 100 }),
	expectedSalaryMin: int(),
	expectedSalaryMax: int(),
	noticePeriod: varchar({ length: 50 }),
	willingToRelocate: tinyint().default(0),
	profileCompleted: tinyint().default(0).notNull(),
	profileCompletionStep: int().default(0).notNull(),
});

export const codingChallenges = mysqlTable("codingChallenges", {
	id: int().autoincrement().notNull(),
	interviewId: int().references(() => interviews.id),
	title: varchar({ length: 255 }).notNull(),
	description: text().notNull(),
	language: mysqlEnum(['python','javascript','java','cpp']).notNull(),
	starterCode: text(),
	testCases: text(),
	difficulty: mysqlEnum(['easy','medium','hard']).notNull(),
	timeLimit: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	createdBy: int(),
});

export const codingSubmissions = mysqlTable("codingSubmissions", {
	id: int().autoincrement().notNull(),
	challengeId: int().notNull().references(() => codingChallenges.id),
	candidateId: int().notNull().references(() => candidates.id),
	code: text().notNull(),
	language: varchar({ length: 50 }).notNull(),
	status: mysqlEnum(['pending','running','passed','failed','error']).default('pending').notNull(),
	testResults: text(),
	executionTime: int(),
	score: int(),
	submittedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const companyProfiles = mysqlTable("company_profiles", {
	id: int().autoincrement().notNull(),
	companyName: varchar({ length: 255 }).notNull(),
	industry: varchar({ length: 255 }),
	description: text(),
	culture: text(),
	interviewProcess: text(),
	commonQuestions: text(),
	tips: text(),
	website: varchar({ length: 500 }),
	logoUrl: varchar({ length: 500 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("companyName").on(table.companyName),
]);

export const conversations = mysqlTable("conversations", {
	id: int().autoincrement().notNull(),
	recruiterId: int().notNull(),
	candidateId: int().notNull(),
	applicationId: int(),
	jobId: int(),
	subject: varchar({ length: 255 }),
	lastMessageAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	isArchived: tinyint().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const customerContacts = mysqlTable("customerContacts", {
	id: int().autoincrement().notNull(),
	customerId: int().notNull().references(() => customers.id),
	name: varchar({ length: 255 }).notNull(),
	title: varchar({ length: 255 }),
	email: varchar({ length: 320 }),
	phone: varchar({ length: 50 }),
	isPrimary: tinyint().default(0),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const customers = mysqlTable("customers", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	industry: varchar({ length: 255 }),
	website: varchar({ length: 500 }),
	description: text(),
	contactEmail: varchar({ length: 320 }),
	contactPhone: varchar({ length: 50 }),
	address: text(),
	createdBy: int().notNull().references(() => users.id),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const emailCampaigns = mysqlTable("emailCampaigns", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	templateId: int().references(() => emailTemplates.id),
	subject: varchar({ length: 500 }).notNull(),
	body: text().notNull(),
	userId: int().notNull().references(() => users.id),
	status: varchar({ length: 50 }).default('draft').notNull(),
	scheduledAt: timestamp({ mode: 'string' }),
	sentAt: timestamp({ mode: 'string' }),
	totalRecipients: int().default(0),
	sentCount: int().default(0),
	openedCount: int().default(0),
	clickedCount: int().default(0),
	bouncedCount: int().default(0),
	repliedCount: int().default(0),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const emailDeliveryEvents = mysqlTable("emailDeliveryEvents", {
	id: int().autoincrement().notNull(),
	campaignRecipientId: int(),
	eventType: varchar({ length: 50 }).notNull(),
	provider: varchar({ length: 20 }).notNull(),
	timestamp: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	messageId: varchar({ length: 255 }),
	email: varchar({ length: 255 }).notNull(),
	reason: text(),
	metadata: json(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_email").on(table.email),
	index("idx_event_type").on(table.eventType),
	index("idx_provider").on(table.provider),
	index("idx_timestamp").on(table.timestamp),
]);

export const emailTemplates = mysqlTable("emailTemplates", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	subject: varchar({ length: 500 }).notNull(),
	body: text().notNull(),
	category: varchar({ length: 100 }),
	userId: int().notNull().references(() => users.id),
	isActive: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const emailUnsubscribes = mysqlTable("emailUnsubscribes", {
	id: int().autoincrement().notNull(),
	email: varchar({ length: 255 }).notNull(),
	trackingId: varchar({ length: 100 }),
	reason: text(),
	unsubscribedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("emailUnsubscribes_email_unique").on(table.email),
]);

export const emailWebhookLogs = mysqlTable("emailWebhookLogs", {
	id: int().autoincrement().notNull(),
	provider: varchar({ length: 20 }).notNull(),
	eventType: varchar({ length: 50 }),
	payload: json().notNull(),
	signature: text(),
	verified: tinyint().default(0),
	processed: tinyint().default(0),
	error: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_provider").on(table.provider),
	index("idx_created").on(table.createdAt),
]);

export const environmentVariables = mysqlTable("environment_variables", {
	id: int().autoincrement().notNull(),
	key: varchar({ length: 255 }).notNull(),
	currentValue: text().notNull(),
	previousValue: text(),
	description: varchar({ length: 500 }),
	category: varchar({ length: 100 }),
	isEditable: tinyint().default(1).notNull(),
	isSensitive: tinyint().default(0).notNull(),
	updatedBy: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("environment_variables_key_unique").on(table.key),
]);

export const followUpSequences = mysqlTable("followUpSequences", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	userId: int().notNull().references(() => users.id),
	isActive: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const fraudDetectionEvents = mysqlTable("fraudDetectionEvents", {
	id: int().autoincrement().notNull(),
	interviewId: int().notNull().references(() => interviews.id),
	candidateId: int().notNull().references(() => candidates.id),
	eventType: mysqlEnum(['no_face_detected','multiple_faces_detected','tab_switch','window_blur','audio_anomaly','suspicious_behavior']).notNull(),
	severity: mysqlEnum(['low','medium','high']).default('medium').notNull(),
	description: text(),
	metadata: text(),
	timestamp: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	questionId: int().references(() => interviewQuestions.id),
});

export const interviewQuestions = mysqlTable("interviewQuestions", {
	id: int().autoincrement().notNull(),
	interviewId: int().notNull().references(() => interviews.id),
	questionText: text().notNull(),
	questionType: mysqlEnum(['technical','behavioral','situational','experience']).notNull(),
	orderIndex: int().notNull(),
	expectedDuration: int().default(120),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const interviewResponses = mysqlTable("interviewResponses", {
	id: int().autoincrement().notNull(),
	interviewId: int().notNull().references(() => interviews.id),
	questionId: int().notNull().references(() => interviewQuestions.id),
	candidateId: int().notNull().references(() => candidates.id),
	audioUrl: text(),
	videoUrl: text(),
	transcription: text(),
	duration: int(),
	aiScore: int(),
	aiEvaluation: text(),
	strengths: text(),
	weaknesses: text(),
	recommendations: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const interviewFeedback = mysqlTable("interview_feedback", {
	id: int().autoincrement().notNull(),
	interviewId: int().notNull().references(() => interviews.id),
	candidateId: int().notNull().references(() => candidates.id),
	overallRating: int().notNull(),
	interviewerRating: int(),
	processRating: int(),
	communicationRating: int(),
	positiveAspects: text(),
	areasForImprovement: text(),
	additionalComments: text(),
	wouldRecommend: tinyint(),
	isAnonymous: tinyint().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const interviewPanelists = mysqlTable("interview_panelists", {
	id: int().autoincrement().notNull(),
	interviewId: int().notNull(),
	userId: int().notNull(),
	email: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }),
	role: varchar({ length: 100 }),
	status: mysqlEnum(['invited','accepted','declined','attended']).default('invited').notNull(),
	invitedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	respondedAt: timestamp({ mode: 'string' }),
	attendedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	reminder24HSent: tinyint().default(0).notNull(),
	reminder1HSent: tinyint().default(0).notNull(),
},
(table) => [
	index("interviewId").on(table.interviewId),
	index("userId").on(table.userId),
]);

export const interviewPrepQuestions = mysqlTable("interview_prep_questions", {
	id: int().autoincrement().notNull(),
	role: varchar({ length: 255 }).notNull(),
	category: varchar({ length: 255 }).notNull(),
	question: text().notNull(),
	sampleAnswer: text(),
	difficulty: mysqlEnum(['easy','medium','hard']).default('medium'),
	tags: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const interviews = mysqlTable("interviews", {
	id: int().autoincrement().notNull(),
	applicationId: int().notNull().references(() => applications.id),
	recruiterId: int().notNull().references(() => recruiters.id),
	candidateId: int().notNull().references(() => candidates.id),
	jobId: int().notNull().references(() => jobs.id),
	scheduledAt: timestamp({ mode: 'string' }).notNull(),
	duration: int().default(60).notNull(),
	type: mysqlEnum(['phone','video','in-person','ai-interview']).default('video').notNull(),
	status: mysqlEnum(['scheduled','in-progress','completed','cancelled','no-show']).default('scheduled').notNull(),
	meetingLink: text(),
	location: text(),
	notes: text(),
	recordingUrl: text(),
	aiEvaluationScore: int(),
	aiEvaluationReport: text(),
	interviewerNotes: text(),
	candidateFeedback: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	videoMeetingId: varchar({ length: 255 }),
	videoJoinUrl: text(),
	videoStartUrl: text(),
	videoPassword: varchar({ length: 255 }),
	videoProvider: mysqlEnum(['zoom','teams','none']).default('none'),
	reminder24HSent: tinyint().default(0).notNull(),
	reminder1HSent: tinyint().default(0).notNull(),
	candidateReminder24HSent: tinyint().default(0),
	candidateReminder1HSent: tinyint().default(0),
});

export const jobSkillRequirements = mysqlTable("job_skill_requirements", {
	id: int().autoincrement().notNull(),
	jobId: int().notNull().references(() => jobs.id),
	skillName: varchar({ length: 255 }).notNull(),
	isMandatory: tinyint().default(1).notNull(),
	orderIndex: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const jobs = mysqlTable("jobs", {
	id: int().autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	companyName: varchar({ length: 255 }),
	description: text().notNull(),
	requirements: text(),
	responsibilities: text(),
	location: varchar({ length: 255 }),
	employmentType: mysqlEnum(['full-time','part-time','contract','temporary','internship']).default('full-time'),
	salaryMin: int(),
	salaryMax: int(),
	salaryCurrency: varchar({ length: 10 }).default('USD'),
	customerId: int().references(() => customers.id),
	contactId: int().references(() => customerContacts.id),
	status: mysqlEnum(['draft','active','closed','filled']).default('draft'),
	isPublic: tinyint().default(0),
	postedBy: int().notNull().references(() => users.id),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	closedAt: timestamp({ mode: 'string' }),
	applicationDeadline: timestamp({ mode: 'string' }),
});

export const messageAttachments = mysqlTable("messageAttachments", {
	id: int().autoincrement().notNull(),
	messageId: int().notNull(),
	fileName: varchar({ length: 255 }).notNull(),
	fileUrl: varchar({ length: 500 }).notNull(),
	fileKey: varchar({ length: 500 }).notNull(),
	fileSize: int().notNull(),
	mimeType: varchar({ length: 100 }).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const messageTemplates = mysqlTable("messageTemplates", {
	id: int().autoincrement().notNull(),
	recruiterId: int().notNull(),
	templateName: varchar({ length: 255 }).notNull(),
	subject: varchar({ length: 255 }),
	content: text().notNull(),
	category: varchar({ length: 100 }),
	isPublic: tinyint().default(0).notNull(),
	usageCount: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const messages = mysqlTable("messages", {
	id: int().autoincrement().notNull(),
	conversationId: int().notNull(),
	senderId: int().notNull(),
	senderType: mysqlEnum(['recruiter','candidate']).notNull(),
	content: text().notNull(),
	isRead: tinyint().default(0).notNull(),
	readAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const notificationPreferences = mysqlTable("notification_preferences", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id),
	statusUpdatesEnabled: tinyint().default(1).notNull(),
	statusUpdatesFrequency: mysqlEnum(['immediate','daily','weekly']).default('immediate').notNull(),
	interviewRemindersEnabled: tinyint().default(1).notNull(),
	interviewReminder24H: tinyint().default(1).notNull(),
	interviewReminder1H: tinyint().default(1).notNull(),
	jobRecommendationsEnabled: tinyint().default(1).notNull(),
	jobRecommendationsFrequency: mysqlEnum(['immediate','daily','weekly']).default('weekly').notNull(),
	marketingEmailsEnabled: tinyint().default(0).notNull(),
	weeklyDigestEnabled: tinyint().default(1).notNull(),
	messageNotificationsEnabled: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("userId").on(table.userId),
]);

export const notifications = mysqlTable("notifications", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	type: varchar({ length: 50 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	message: text().notNull(),
	link: varchar({ length: 500 }),
	isRead: tinyint().default(0),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP'),
	relatedEntityType: varchar({ length: 50 }),
	relatedEntityId: int(),
	actionUrl: varchar({ length: 500 }),
},
(table) => [
	index("idx_userId").on(table.userId),
	index("idx_isRead").on(table.isRead),
	index("idx_createdAt").on(table.createdAt),
]);

export const onboardingProcesses = mysqlTable("onboardingProcesses", {
	id: int().autoincrement().notNull(),
	associateId: int().notNull().references(() => associates.id),
	processType: mysqlEnum(['onboarding','offboarding']).notNull(),
	status: mysqlEnum(['pending','in_progress','completed','cancelled']).default('pending').notNull(),
	startedBy: int().notNull().references(() => recruiters.id),
	completedAt: timestamp({ mode: 'string' }),
	dueDate: timestamp({ mode: 'string' }),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const onboardingTasks = mysqlTable("onboardingTasks", {
	id: int().autoincrement().notNull(),
	processId: int().notNull().references(() => onboardingProcesses.id),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	taskType: varchar({ length: 100 }),
	status: mysqlEnum(['pending','in_progress','completed','blocked']).default('pending').notNull(),
	priority: mysqlEnum(['low','medium','high','urgent']).default('medium').notNull(),
	dueDate: timestamp({ mode: 'string' }),
	completedAt: timestamp({ mode: 'string' }),
	completedBy: int().references(() => recruiters.id),
	orderIndex: int().default(0).notNull(),
	dependsOnTaskId: int(),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const panelActionTokens = mysqlTable("panel_action_tokens", {
	id: int().autoincrement().notNull(),
	panelistId: int("panelist_id").notNull(),
	interviewId: int("interview_id").notNull(),
	token: varchar({ length: 255 }).notNull(),
	actionType: mysqlEnum("action_type", ['accept','decline','reschedule','feedback']).notNull(),
	usedAt: datetime("used_at", { mode: 'string'}),
	expiresAt: datetime("expires_at", { mode: 'string'}).notNull(),
	createdAt: datetime("created_at", { mode: 'string'}).default('CURRENT_TIMESTAMP'),
},
(table) => [
	index("idx_token").on(table.token),
	index("idx_panelist").on(table.panelistId),
	index("idx_interview").on(table.interviewId),
	index("token").on(table.token),
]);

export const panelistFeedback = mysqlTable("panelist_feedback", {
	id: int().autoincrement().notNull(),
	interviewId: int().notNull(),
	panelistId: int().notNull(),
	userId: int().notNull(),
	overallRating: int().notNull(),
	technicalSkills: int(),
	communicationSkills: int(),
	problemSolving: int(),
	cultureFit: int(),
	strengths: text(),
	weaknesses: text(),
	notes: text(),
	recommendation: mysqlEnum(['strong_hire','hire','no_hire','strong_no_hire']),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("interviewId").on(table.interviewId),
	index("panelistId").on(table.panelistId),
	index("userId").on(table.userId),
]);

export const personalityQuestions = mysqlTable("personalityQuestions", {
	id: int().autoincrement().notNull(),
	testId: int().notNull(),
	questionText: text().notNull(),
	trait: varchar({ length: 100 }).notNull(),
	isReversed: tinyint().default(0).notNull(),
	order: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const personalityResults = mysqlTable("personalityResults", {
	id: int().autoincrement().notNull(),
	assignmentId: int().notNull(),
	candidateId: int().notNull(),
	testType: varchar({ length: 50 }).notNull(),
	openness: int(),
	conscientiousness: int(),
	extraversion: int(),
	agreeableness: int(),
	neuroticism: int(),
	dominance: int(),
	influence: int(),
	steadiness: int(),
	compliance: int(),
	primaryTrait: varchar({ length: 100 }),
	traitProfile: text(),
	interpretation: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const questionBank = mysqlTable("question_bank", {
	id: int().autoincrement().notNull(),
	recruiterId: int("recruiter_id").notNull().references(() => recruiters.id),
	questionText: text("question_text").notNull(),
	questionType: mysqlEnum("question_type", ['coding','multiple-choice','text','personality','technical']).notNull(),
	difficulty: mysqlEnum(['easy','medium','hard','expert']).notNull(),
	category: varchar({ length: 100 }),
	tags: json(),
	correctAnswer: text("correct_answer"),
	codeTemplate: text("code_template"),
	testCases: json("test_cases"),
	timeLimit: int("time_limit").default(300),
	memoryLimit: int("memory_limit").default(256),
	points: int().default(10),
	usageCount: int("usage_count").default(0),
	isPublic: tinyint("is_public").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
});

export const recruiterNotificationPreferences = mysqlTable("recruiter_notification_preferences", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	newApplications: tinyint().default(1).notNull(),
	applicationStatusChanges: tinyint().default(1).notNull(),
	applicationFrequency: mysqlEnum(['immediate','daily','weekly']).default('immediate').notNull(),
	interviewScheduled: tinyint().default(1).notNull(),
	interviewReminders: tinyint().default(1).notNull(),
	interviewCompleted: tinyint().default(1).notNull(),
	panelistResponses: tinyint().default(1).notNull(),
	candidateFeedback: tinyint().default(1).notNull(),
	panelistFeedbackSubmitted: tinyint().default(1).notNull(),
	weeklyDigest: tinyint().default(1).notNull(),
	systemUpdates: tinyint().default(0).notNull(),
	marketingEmails: tinyint().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("userId").on(table.userId),
]);

export const recruiters = mysqlTable("recruiters", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id),
	companyName: varchar({ length: 255 }),
	phoneNumber: varchar({ length: 50 }),
	bio: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	profileCompleted: tinyint().default(0).notNull(),
	profileCompletionStep: int().default(0).notNull(),
	emailDigestFrequency: mysqlEnum(['never','daily','weekly']).default('weekly'),
	lastDigestSentAt: timestamp({ mode: 'string' }),
});

export const rescheduleRequests = mysqlTable("reschedule_requests", {
	id: int().autoincrement().notNull(),
	interviewId: int().notNull().references(() => interviews.id),
	panelistId: int().notNull().references(() => interviewPanelists.id),
	requestedBy: int(),
	reason: text(),
	preferredDates: text(),
	status: mysqlEnum(['pending','approved','rejected','resolved','alternative_proposed']).default('pending').notNull(),
	resolvedAt: timestamp({ mode: 'string' }),
	resolvedBy: int(),
	newInterviewTime: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const resumeProfiles = mysqlTable("resumeProfiles", {
	id: int().autoincrement().notNull(),
	candidateId: int().notNull().references(() => candidates.id),
	profileName: varchar({ length: 255 }).notNull(),
	resumeUrl: varchar({ length: 500 }).notNull(),
	resumeFileKey: varchar({ length: 500 }).notNull(),
	resumeFilename: varchar({ length: 255 }).notNull(),
	parsedData: text(),
	isDefault: tinyint().default(0).notNull(),
	uploadedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	domainMatchScore: int().default(0),
	skillMatchScore: int().default(0),
	experienceScore: int().default(0),
	overallScore: int().default(0),
	primaryDomain: varchar({ length: 100 }),
	totalExperienceYears: int().default(0),
	topDomains: json(),
	topSkills: json(),
});

export const savedJobs = mysqlTable("savedJobs", {
	id: int().autoincrement().notNull(),
	candidateId: int().notNull().references(() => candidates.id),
	jobId: int().notNull().references(() => jobs.id),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("unique_saved_job").on(table.candidateId, table.jobId),
]);

export const savedSearches = mysqlTable("savedSearches", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id),
	name: varchar({ length: 255 }).notNull(),
	searchType: mysqlEnum(['candidate','job']).default('candidate').notNull(),
	keyword: text(),
	location: text(),
	experienceLevel: varchar({ length: 50 }),
	skills: text(),
	emailAlerts: tinyint().default(0).notNull(),
	alertFrequency: mysqlEnum(['immediate','daily','weekly']).default('daily'),
	lastAlertSent: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const sequenceEnrollments = mysqlTable("sequenceEnrollments", {
	id: int().autoincrement().notNull(),
	sequenceId: int().notNull().references(() => followUpSequences.id),
	candidateId: int().notNull().references(() => candidates.id),
	currentStep: int().default(0),
	status: varchar({ length: 50 }).default('active').notNull(),
	enrolledAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	completedAt: timestamp({ mode: 'string' }),
	nextStepAt: timestamp({ mode: 'string' }),
});

export const sequenceSteps = mysqlTable("sequenceSteps", {
	id: int().autoincrement().notNull(),
	sequenceId: int().notNull().references(() => followUpSequences.id),
	stepNumber: int().notNull(),
	delayDays: int().notNull(),
	templateId: int().references(() => emailTemplates.id),
	subject: varchar({ length: 500 }).notNull(),
	body: text().notNull(),
	condition: varchar({ length: 100 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const skillAssessments = mysqlTable("skillAssessments", {
	id: int().autoincrement().notNull(),
	jobId: int().references(() => jobs.id),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	duration: int(),
	passingScore: int().default(70).notNull(),
	createdBy: int().notNull().references(() => users.id),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const systemSettings = mysqlTable("systemSettings", {
	id: int().autoincrement().notNull(),
	settingKey: varchar({ length: 100 }).notNull(),
	settingValue: text(),
	description: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("systemSettings_settingKey_unique").on(table.settingKey),
]);

export const taskAssignments = mysqlTable("taskAssignments", {
	id: int().autoincrement().notNull(),
	taskId: int().notNull().references(() => onboardingTasks.id),
	recruiterId: int().notNull().references(() => recruiters.id),
	assignedBy: int().notNull().references(() => recruiters.id),
	assignedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const taskReminders = mysqlTable("taskReminders", {
	id: int().autoincrement().notNull(),
	taskId: int().notNull().references(() => onboardingTasks.id),
	recruiterId: int().notNull().references(() => recruiters.id),
	reminderType: mysqlEnum(['due_soon','overdue','manual']).notNull(),
	sentAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	emailStatus: varchar({ length: 50 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const taskTemplates = mysqlTable("taskTemplates", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	processType: mysqlEnum(['onboarding','offboarding']).notNull(),
	description: text(),
	tasks: text().notNull(),
	isDefault: tinyint().default(0).notNull(),
	createdBy: int().notNull().references(() => recruiters.id),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const testAssignments = mysqlTable("testAssignments", {
	id: int().autoincrement().notNull(),
	testId: int().notNull(),
	candidateId: int().notNull(),
	applicationId: int(),
	assignedBy: int().notNull(),
	status: mysqlEnum(['assigned','in-progress','completed','expired','cancelled']).default('assigned').notNull(),
	dueDate: timestamp({ mode: 'string' }),
	startedAt: timestamp({ mode: 'string' }),
	completedAt: timestamp({ mode: 'string' }),
	score: int(),
	passed: tinyint(),
	timeSpent: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const testLibrary = mysqlTable("testLibrary", {
	id: int().autoincrement().notNull(),
	recruiterId: int().notNull(),
	testName: varchar({ length: 255 }).notNull(),
	testType: mysqlEnum(['coding','personality','domain-specific','aptitude','technical']).notNull(),
	category: varchar({ length: 100 }),
	description: text(),
	duration: int().notNull(),
	passingScore: int().notNull(),
	difficulty: mysqlEnum(['easy','medium','hard','expert']).notNull(),
	isPublic: tinyint().default(0).notNull(),
	isActive: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const testQuestions = mysqlTable("testQuestions", {
	id: int().autoincrement().notNull(),
	testId: int().notNull(),
	questionText: text().notNull(),
	questionType: mysqlEnum(['multiple-choice','coding','essay','true-false']).notNull(),
	options: text(),
	correctAnswer: text(),
	points: int().default(10).notNull(),
	starterCode: text(),
	testCases: text(),
	language: varchar({ length: 50 }),
	timeLimit: int(),
	order: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const testResponses = mysqlTable("testResponses", {
	id: int().autoincrement().notNull(),
	assignmentId: int().notNull(),
	questionId: int().notNull(),
	candidateAnswer: text().notNull(),
	isCorrect: tinyint(),
	pointsEarned: int().default(0).notNull(),
	codeOutput: text(),
	executionTime: int(),
	testCasesPassed: int(),
	testCasesTotal: int(),
	submittedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const typingIndicators = mysqlTable("typingIndicators", {
	id: int().autoincrement().notNull(),
	conversationId: int().notNull(),
	userId: int().notNull(),
	isTyping: tinyint().default(0).notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const users = mysqlTable("users", {
	id: int().autoincrement().notNull(),
	openId: varchar({ length: 64 }),
	name: text(),
	email: varchar({ length: 320 }),
	loginMethod: varchar({ length: 64 }),
	role: mysqlEnum(['user','admin','recruiter','candidate']).default('user').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	lastSignedIn: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	passwordHash: varchar({ length: 255 }),
	emailVerified: tinyint().default(0).notNull(),
	verificationToken: varchar({ length: 255 }),
	verificationTokenExpiry: timestamp({ mode: 'string' }),
	passwordResetToken: varchar({ length: 255 }),
	passwordResetTokenExpiry: timestamp({ mode: 'string' }),
},
(table) => [
	index("users_openId_unique").on(table.openId),
]);

export const videoIntroductions = mysqlTable("videoIntroductions", {
	id: int().autoincrement().notNull(),
	candidateId: int().notNull().references(() => candidates.id),
	videoUrl: varchar({ length: 500 }).notNull(),
	videoFileKey: varchar({ length: 500 }).notNull(),
	thumbnailUrl: varchar({ length: 500 }),
	duration: int().notNull(),
	fileSize: int(),
	mimeType: varchar({ length: 100 }),
	transcription: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});
