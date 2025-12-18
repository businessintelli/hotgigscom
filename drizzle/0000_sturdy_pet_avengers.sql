CREATE TABLE `aiNotificationPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`jobMatchAlerts` boolean NOT NULL DEFAULT true,
	`profileImprovementSuggestions` boolean NOT NULL DEFAULT true,
	`applicationStatusUpdates` boolean NOT NULL DEFAULT true,
	`interviewReminders` boolean NOT NULL DEFAULT true,
	`topCandidateDigest` boolean NOT NULL DEFAULT true,
	`digestFrequency` enum('daily','weekly','realtime') NOT NULL DEFAULT 'daily',
	`newApplicationAlerts` boolean NOT NULL DEFAULT true,
	`biasAlerts` boolean NOT NULL DEFAULT true,
	`pipelineInsights` boolean NOT NULL DEFAULT true,
	`emailNotifications` boolean NOT NULL DEFAULT true,
	`inAppNotifications` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aiNotificationPreferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aiNotificationQueue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`notificationType` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`actionUrl` varchar(500),
	`priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`status` enum('pending','sent','failed','cancelled') NOT NULL DEFAULT 'pending',
	`scheduledFor` timestamp NOT NULL,
	`sentAt` timestamp,
	`readAt` timestamp,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aiNotificationQueue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `algorithmPerformance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`algorithmVersion` varchar(50) NOT NULL,
	`metricName` varchar(100) NOT NULL,
	`metricValue` decimal(10,6) NOT NULL,
	`sampleSize` int NOT NULL,
	`periodStart` date NOT NULL,
	`periodEnd` date NOT NULL,
	`jobCategory` varchar(100),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `algorithmPerformance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `applicationFeedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`recruiterId` int NOT NULL,
	`rating` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `applicationFeedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `application_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`fromStatus` varchar(50),
	`toStatus` varchar(50) NOT NULL,
	`changedBy` int,
	`notes` text,
	`emailSent` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `application_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `application_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`level` enum('debug','info','warn','error','critical') NOT NULL,
	`source` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`details` text,
	`userId` int,
	`requestId` varchar(64),
	`ipAddress` varchar(45),
	`userAgent` text,
	`stackTrace` text,
	`resolved` boolean NOT NULL DEFAULT false,
	`resolvedBy` int,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `application_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`candidateId` int NOT NULL,
	`resumeProfileId` int,
	`videoIntroductionId` int,
	`coverLetter` text,
	`resumeUrl` varchar(500),
	`resumeFilename` varchar(255),
	`status` enum('submitted','reviewing','shortlisted','interviewing','offered','rejected','withdrawn') DEFAULT 'submitted',
	`aiScore` int,
	`notes` text,
	`currentSalary` int,
	`expectedSalary` int,
	`currentHourlyRate` int,
	`expectedHourlyRate` int,
	`salaryType` varchar(50),
	`workAuthorization` varchar(100),
	`workAuthorizationEndDate` date,
	`w2EmployerName` varchar(255),
	`nationality` varchar(100),
	`gender` varchar(50),
	`dateOfBirth` date,
	`highestEducation` varchar(255),
	`specialization` varchar(255),
	`highestDegreeStartDate` date,
	`highestDegreeEndDate` date,
	`employmentHistory` text,
	`languagesRead` text,
	`languagesSpeak` text,
	`languagesWrite` text,
	`currentResidenceZipCode` varchar(20),
	`passportNumber` varchar(100),
	`sinLast4` varchar(4),
	`linkedinId` varchar(255),
	`passportCopyUrl` varchar(500),
	`dlCopyUrl` varchar(500),
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assessmentAnswers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`attemptId` int NOT NULL,
	`questionId` int NOT NULL,
	`answer` text NOT NULL,
	`isCorrect` boolean,
	`pointsEarned` int,
	CONSTRAINT `assessmentAnswers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assessmentAttempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`candidateId` int NOT NULL,
	`applicationId` int,
	`score` int,
	`totalPoints` int,
	`earnedPoints` int,
	`passed` boolean,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`timeSpent` int,
	CONSTRAINT `assessmentAttempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assessmentQuestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`questionText` text NOT NULL,
	`questionType` enum('multiple_choice','true_false','short_answer') NOT NULL,
	`options` text,
	`correctAnswer` text NOT NULL,
	`points` int NOT NULL DEFAULT 1,
	`orderIndex` int NOT NULL,
	CONSTRAINT `assessmentQuestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `associates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`employeeId` varchar(100),
	`jobTitle` varchar(255) NOT NULL,
	`department` varchar(255),
	`startDate` timestamp NOT NULL,
	`endDate` timestamp,
	`status` enum('active','onboarding','offboarding','terminated') NOT NULL DEFAULT 'onboarding',
	`managerId` int,
	`onboardedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `associates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `biasDetectionLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entityType` enum('resume','job_description','match_score','interview_evaluation') NOT NULL,
	`entityId` int NOT NULL,
	`biasType` enum('gender','age','ethnicity','disability','language','education','location') NOT NULL,
	`severity` enum('low','medium','high') NOT NULL,
	`detectedText` text,
	`recommendation` text,
	`flaggedBy` varchar(50) NOT NULL,
	`resolved` boolean NOT NULL DEFAULT false,
	`resolvedAt` timestamp,
	`resolvedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `biasDetectionLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calendar_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`interviewId` int NOT NULL,
	`calendarIntegrationId` int NOT NULL,
	`externalEventId` varchar(255) NOT NULL,
	`provider` enum('google','microsoft','calendly','cal_com') NOT NULL,
	`title` varchar(500),
	`description` text,
	`location` varchar(500),
	`meetingUrl` varchar(500),
	`startTime` timestamp NOT NULL,
	`endTime` timestamp NOT NULL,
	`timezone` varchar(100) NOT NULL,
	`attendees` text,
	`organizerEmail` varchar(320),
	`syncStatus` enum('pending','synced','failed','cancelled') NOT NULL DEFAULT 'pending',
	`lastSyncAt` timestamp,
	`syncError` text,
	`bookingConfirmedAt` timestamp,
	`bookingCancelledAt` timestamp,
	`cancellationReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calendar_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calendar_integrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`provider` enum('google','microsoft','calendly','cal_com') NOT NULL,
	`providerAccountId` varchar(255),
	`providerEmail` varchar(320),
	`accessToken` text NOT NULL,
	`refreshToken` text,
	`tokenExpiry` timestamp,
	`defaultCalendarId` varchar(255),
	`calendarName` varchar(255),
	`timezone` varchar(100) NOT NULL DEFAULT 'UTC',
	`autoSync` boolean NOT NULL DEFAULT true,
	`syncDirection` enum('one-way','two-way') NOT NULL DEFAULT 'two-way',
	`lastSyncAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calendar_integrations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campaignRecipients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`candidateId` int NOT NULL,
	`email` varchar(255) NOT NULL,
	`personalizedSubject` varchar(500),
	`personalizedBody` text,
	`status` varchar(50) NOT NULL DEFAULT 'pending',
	`sentAt` timestamp,
	`openedAt` timestamp,
	`clickedAt` timestamp,
	`bouncedAt` timestamp,
	`repliedAt` timestamp,
	`trackingId` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `campaignRecipients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `candidate_interactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int,
	`applicationId` int,
	`interviewId` int,
	`interactionType` enum('email_opened','email_clicked','email_replied','calendar_link_clicked','interview_booked','interview_rescheduled','interview_cancelled','application_submitted','profile_viewed') NOT NULL,
	`emailCampaignId` int,
	`sourcingCampaignId` int,
	`linkUrl` varchar(500),
	`metadata` text,
	`userAgent` varchar(500),
	`ipAddress` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `candidate_interactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `candidate_profile_shares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`sharedByUserId` int NOT NULL,
	`shareToken` varchar(64) NOT NULL,
	`recipientEmail` varchar(320),
	`recipientName` varchar(255),
	`customerId` int,
	`jobId` int,
	`matchScore` int,
	`includeResume` boolean NOT NULL DEFAULT true,
	`includeVideo` boolean NOT NULL DEFAULT true,
	`includeContact` boolean NOT NULL DEFAULT false,
	`viewCount` int NOT NULL DEFAULT 0,
	`lastViewedAt` timestamp,
	`expiresAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `candidate_profile_shares_id` PRIMARY KEY(`id`),
	CONSTRAINT `candidate_profile_shares_shareToken_unique` UNIQUE(`shareToken`)
);
--> statement-breakpoint
CREATE TABLE `candidate_skill_ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`skillRequirementId` int NOT NULL,
	`skillName` varchar(255) NOT NULL,
	`rating` int NOT NULL,
	`yearsExperience` int NOT NULL,
	`lastUsedYear` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `candidate_skill_ratings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `candidate_success_predictions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`candidateId` int NOT NULL,
	`jobId` int NOT NULL,
	`overallSuccessScore` int NOT NULL,
	`skillsMatchScore` int,
	`experienceMatchScore` int,
	`cultureFitScore` int,
	`retentionPredictionScore` int,
	`topPositiveFactors` text,
	`topNegativeFactors` text,
	`modelVersion` varchar(50),
	`confidence` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `candidate_success_predictions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `candidateTagAssignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`tagId` int NOT NULL,
	`assignedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `candidateTagAssignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `candidateTags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`color` varchar(50) DEFAULT 'blue',
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `candidateTags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `candidates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255),
	`phoneNumber` varchar(50),
	`location` varchar(255),
	`bio` text,
	`skills` text,
	`experience` text,
	`education` text,
	`resumeUrl` varchar(500),
	`resumeFilename` varchar(255),
	`resumeUploadedAt` timestamp,
	`parsedResumeData` text,
	`linkedinUrl` varchar(500),
	`githubUrl` varchar(500),
	`certifications` text,
	`languages` text,
	`projects` text,
	`totalExperienceYears` int,
	`seniorityLevel` varchar(50),
	`primaryDomain` varchar(100),
	`skillCategories` text,
	`availability` varchar(50),
	`visaStatus` varchar(100),
	`expectedSalaryMin` int,
	`expectedSalaryMax` int,
	`noticePeriod` varchar(50),
	`willingToRelocate` boolean DEFAULT false,
	`workAuthorization` varchar(100),
	`workAuthorizationEndDate` date,
	`w2EmployerName` varchar(255),
	`nationality` varchar(100),
	`gender` varchar(50),
	`dateOfBirth` date,
	`highestEducation` varchar(255),
	`specialization` varchar(255),
	`highestDegreeStartDate` date,
	`highestDegreeEndDate` date,
	`employmentHistory` text,
	`languagesRead` text,
	`languagesSpeak` text,
	`languagesWrite` text,
	`currentResidenceZipCode` varchar(20),
	`passportNumber` varchar(100),
	`sinLast4` varchar(4),
	`linkedinId` varchar(255),
	`passportCopyUrl` varchar(500),
	`dlCopyUrl` varchar(500),
	`currentSalary` int,
	`currentHourlyRate` int,
	`expectedSalary` int,
	`expectedHourlyRate` int,
	`salaryType` enum('salary','hourly'),
	`profileCompleted` boolean NOT NULL DEFAULT false,
	`profileCompletionStep` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `candidates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codingChallenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`interviewId` int,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`language` enum('python','javascript','java','cpp') NOT NULL,
	`starterCode` text,
	`testCases` text,
	`difficulty` enum('easy','medium','hard') NOT NULL,
	`timeLimit` int,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `codingChallenges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codingSubmissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`challengeId` int NOT NULL,
	`candidateId` int NOT NULL,
	`code` text NOT NULL,
	`language` varchar(50) NOT NULL,
	`status` enum('pending','running','passed','failed','error') NOT NULL DEFAULT 'pending',
	`testResults` text,
	`executionTime` int,
	`score` int,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `codingSubmissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`domain` varchar(255) NOT NULL,
	`settings` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `companies_id` PRIMARY KEY(`id`),
	CONSTRAINT `companies_domain_unique` UNIQUE(`domain`)
);
--> statement-breakpoint
CREATE TABLE `companySettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`sendgridApiKey` varchar(500),
	`resendApiKey` varchar(500),
	`openaiApiKey` varchar(500),
	`linkedinApiKey` varchar(500),
	`fromEmail` varchar(320),
	`fromName` varchar(255),
	`replyToEmail` varchar(320),
	`enableEmailNotifications` boolean NOT NULL DEFAULT true,
	`enableSmsNotifications` boolean NOT NULL DEFAULT false,
	`companyLogo` varchar(500),
	`primaryColor` varchar(7),
	`secondaryColor` varchar(7),
	`additionalSettings` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `companySettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `custom_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`selectedFields` json NOT NULL,
	`filters` json,
	`groupBy` varchar(100),
	`sortBy` varchar(100),
	`sortOrder` enum('asc','desc') DEFAULT 'asc',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `custom_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customerContacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`title` varchar(255),
	`email` varchar(320),
	`phone` varchar(50),
	`isPrimary` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customerContacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`industry` varchar(255),
	`website` varchar(500),
	`description` text,
	`contactEmail` varchar(320),
	`contactPhone` varchar(50),
	`address` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `diversityMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recruiterId` int NOT NULL,
	`jobId` int,
	`metricType` enum('applications','interviews','offers','hires') NOT NULL,
	`periodStart` date NOT NULL,
	`periodEnd` date NOT NULL,
	`totalCount` int NOT NULL,
	`genderDiversity` json,
	`ethnicityDiversity` json,
	`ageDiversity` json,
	`educationDiversity` json,
	`locationDiversity` json,
	`biasScore` decimal(5,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `diversityMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailCampaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`templateId` int,
	`subject` varchar(500) NOT NULL,
	`body` text NOT NULL,
	`userId` int NOT NULL,
	`status` varchar(50) NOT NULL DEFAULT 'draft',
	`scheduledAt` timestamp,
	`sentAt` timestamp,
	`totalRecipients` int DEFAULT 0,
	`sentCount` int DEFAULT 0,
	`openedCount` int DEFAULT 0,
	`clickedCount` int DEFAULT 0,
	`bouncedCount` int DEFAULT 0,
	`repliedCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailCampaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailDeliveryEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignRecipientId` int,
	`eventType` varchar(50) NOT NULL,
	`provider` varchar(20) NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`messageId` varchar(255),
	`email` varchar(255) NOT NULL,
	`reason` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailDeliveryEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`body` text NOT NULL,
	`category` varchar(100),
	`userId` int NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailUnsubscribes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`trackingId` varchar(100),
	`reason` text,
	`unsubscribedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailUnsubscribes_id` PRIMARY KEY(`id`),
	CONSTRAINT `emailUnsubscribes_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `emailWebhookLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider` varchar(20) NOT NULL,
	`eventType` varchar(50),
	`payload` json NOT NULL,
	`signature` text,
	`verified` boolean DEFAULT false,
	`processed` boolean DEFAULT false,
	`error` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailWebhookLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `environment_variables` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(255) NOT NULL,
	`currentValue` text NOT NULL,
	`previousValue` text,
	`description` varchar(500),
	`category` varchar(100),
	`isEditable` boolean NOT NULL DEFAULT true,
	`isSensitive` boolean NOT NULL DEFAULT false,
	`updatedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `environment_variables_id` PRIMARY KEY(`id`),
	CONSTRAINT `environment_variables_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `followUpSequences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`userId` int NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `followUpSequences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fraudDetectionEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`interviewId` int NOT NULL,
	`candidateId` int NOT NULL,
	`eventType` enum('no_face_detected','multiple_faces_detected','tab_switch','window_blur','audio_anomaly','suspicious_behavior') NOT NULL,
	`severity` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`description` text,
	`metadata` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`questionId` int,
	CONSTRAINT `fraudDetectionEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `guest_applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(255) NOT NULL,
	`phoneNumber` varchar(50),
	`resumeUrl` varchar(500) NOT NULL,
	`resumeFilename` varchar(255) NOT NULL,
	`coverLetter` text,
	`parsedResumeData` text,
	`skills` text,
	`experience` text,
	`education` text,
	`totalExperienceYears` int,
	`claimed` boolean NOT NULL DEFAULT false,
	`claimedBy` int,
	`claimedAt` timestamp,
	`applicationId` int,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`invitationSent` boolean NOT NULL DEFAULT false,
	`invitedAt` timestamp,
	`invitationCount` int NOT NULL DEFAULT 0,
	CONSTRAINT `guest_applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inmail_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`body` text NOT NULL,
	`variables` text,
	`category` varchar(100),
	`isActive` boolean NOT NULL DEFAULT true,
	`timesUsed` int NOT NULL DEFAULT 0,
	`responseRate` decimal(5,2),
	`createdBy` int NOT NULL,
	`lastUsedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inmail_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `integration_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`provider` enum('slack','teams') NOT NULL,
	`webhookUrl` varchar(500) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`notificationTypes` json,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `integration_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `interview_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`interviewId` int NOT NULL,
	`candidateId` int NOT NULL,
	`overallRating` int NOT NULL,
	`interviewerRating` int,
	`processRating` int,
	`communicationRating` int,
	`positiveAspects` text,
	`areasForImprovement` text,
	`additionalComments` text,
	`wouldRecommend` boolean,
	`isAnonymous` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `interview_feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `interview_panelists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`interviewId` int NOT NULL,
	`userId` int NOT NULL,
	`email` varchar(255) NOT NULL,
	`name` varchar(255),
	`role` varchar(100),
	`status` enum('invited','accepted','declined','attended') NOT NULL DEFAULT 'invited',
	`invitedAt` timestamp NOT NULL DEFAULT (now()),
	`respondedAt` timestamp,
	`attendedAt` timestamp,
	`reminder24hSent` boolean NOT NULL DEFAULT false,
	`reminder1hSent` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `interview_panelists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `interviewQuestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`interviewId` int NOT NULL,
	`questionText` text NOT NULL,
	`questionType` enum('technical','behavioral','situational','experience') NOT NULL,
	`orderIndex` int NOT NULL,
	`expectedDuration` int DEFAULT 120,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `interviewQuestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `interviewResponses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`interviewId` int NOT NULL,
	`questionId` int NOT NULL,
	`candidateId` int NOT NULL,
	`audioUrl` text,
	`videoUrl` text,
	`transcription` text,
	`duration` int,
	`aiScore` int,
	`aiEvaluation` text,
	`strengths` text,
	`weaknesses` text,
	`recommendations` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `interviewResponses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `interviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`recruiterId` int NOT NULL,
	`candidateId` int NOT NULL,
	`jobId` int NOT NULL,
	`scheduledAt` timestamp NOT NULL,
	`duration` int NOT NULL DEFAULT 60,
	`type` enum('phone','video','in-person','ai-interview') NOT NULL DEFAULT 'video',
	`status` enum('scheduled','in-progress','completed','cancelled','no-show') NOT NULL DEFAULT 'scheduled',
	`meetingLink` text,
	`location` text,
	`notes` text,
	`recordingUrl` text,
	`aiEvaluationScore` int,
	`aiEvaluationReport` text,
	`interviewerNotes` text,
	`candidateFeedback` text,
	`videoMeetingId` varchar(255),
	`videoJoinUrl` text,
	`videoStartUrl` text,
	`videoPassword` varchar(255),
	`videoProvider` enum('zoom','teams','none') DEFAULT 'none',
	`candidateReminder24hSent` boolean DEFAULT false,
	`candidateReminder1hSent` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `interviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `job_application_sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`source` varchar(50),
	`referrer` varchar(255),
	`campaign` varchar(100),
	`utmSource` varchar(100),
	`utmMedium` varchar(100),
	`utmCampaign` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `job_application_sources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `job_skill_requirements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`skillName` varchar(255) NOT NULL,
	`isMandatory` boolean NOT NULL DEFAULT true,
	`orderIndex` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `job_skill_requirements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `job_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`companyName` varchar(255),
	`description` text NOT NULL,
	`requirements` text,
	`responsibilities` text,
	`location` varchar(255),
	`employmentType` enum('full-time','part-time','contract','temporary','internship') DEFAULT 'full-time',
	`salaryMin` int,
	`salaryMax` int,
	`salaryCurrency` varchar(10) DEFAULT 'USD',
	`category` varchar(100),
	`tags` text,
	`createdBy` int NOT NULL,
	`companyId` int,
	`isPublic` boolean DEFAULT false,
	`isCompanyWide` boolean DEFAULT false,
	`usageCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `job_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `job_view_analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`userId` int,
	`viewDate` date NOT NULL,
	`viewCount` int NOT NULL DEFAULT 1,
	`source` varchar(50),
	`deviceType` varchar(20),
	`referrer` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `job_view_analytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `job_view_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`userId` int,
	`sessionId` varchar(255) NOT NULL,
	`lastViewedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `job_view_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `job_views` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`userId` int,
	`viewedAt` timestamp NOT NULL DEFAULT (now()),
	`source` varchar(100),
	`ipAddress` varchar(45),
	`userAgent` text,
	CONSTRAINT `job_views_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`companyName` varchar(255),
	`description` text NOT NULL,
	`requirements` text,
	`responsibilities` text,
	`location` varchar(255),
	`employmentType` enum('full-time','part-time','contract','temporary','internship') DEFAULT 'full-time',
	`salaryMin` int,
	`salaryMax` int,
	`salaryCurrency` varchar(10) DEFAULT 'USD',
	`customerId` int,
	`contactId` int,
	`status` enum('draft','active','closed','filled') DEFAULT 'draft',
	`isPublic` boolean DEFAULT false,
	`postedBy` int NOT NULL,
	`applicationDeadline` timestamp,
	`shareCount` int NOT NULL DEFAULT 0,
	`emailShares` int NOT NULL DEFAULT 0,
	`linkedinShares` int NOT NULL DEFAULT 0,
	`twitterShares` int NOT NULL DEFAULT 0,
	`facebookShares` int NOT NULL DEFAULT 0,
	`whatsappShares` int NOT NULL DEFAULT 0,
	`linkCopies` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`closedAt` timestamp,
	CONSTRAINT `jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `linkedin_credit_usage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recruiterId` int NOT NULL,
	`creditsUsed` int NOT NULL DEFAULT 1,
	`creditsRemaining` int,
	`creditLimit` int,
	`usageType` enum('inmail','profile_view','search') NOT NULL,
	`linkedinInmailId` int,
	`linkedinProfileId` int,
	`description` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `linkedin_credit_usage_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `linkedin_inmails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`linkedinProfileId` int NOT NULL,
	`candidateId` int,
	`recruiterId` int NOT NULL,
	`subject` varchar(500),
	`message` text,
	`linkedinConversationId` varchar(255),
	`sentAt` timestamp NOT NULL,
	`openedAt` timestamp,
	`repliedAt` timestamp,
	`replied` boolean NOT NULL DEFAULT false,
	`replyMessage` text,
	`sourcingCampaignId` int,
	`emailCampaignId` int,
	`inmailCreditsUsed` int DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `linkedin_inmails_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `linkedin_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int,
	`linkedinId` varchar(255) NOT NULL,
	`profileUrl` varchar(500),
	`publicIdentifier` varchar(255),
	`firstName` varchar(255),
	`lastName` varchar(255),
	`headline` text,
	`summary` text,
	`location` varchar(255),
	`industry` varchar(255),
	`currentCompany` varchar(255),
	`currentTitle` varchar(255),
	`profilePictureUrl` varchar(500),
	`connections` int,
	`followersCount` int,
	`fullProfileData` text,
	`importedBy` int NOT NULL,
	`sourcingCampaignId` int,
	`importSource` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `linkedin_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `linkedin_profiles_linkedinId_unique` UNIQUE(`linkedinId`)
);
--> statement-breakpoint
CREATE TABLE `matchOutcomes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`candidateId` int NOT NULL,
	`jobId` int NOT NULL,
	`recruiterId` int NOT NULL,
	`initialMatchScore` decimal(5,2) NOT NULL,
	`skillsScore` decimal(5,2),
	`experienceScore` decimal(5,2),
	`locationScore` decimal(5,2),
	`salaryScore` decimal(5,2),
	`culturalFitScore` decimal(5,2),
	`outcome` enum('hired','rejected','withdrawn','no_response','in_progress') NOT NULL,
	`outcomeDate` timestamp,
	`performanceRating` decimal(3,2),
	`retentionMonths` int,
	`recruiterFeedback` text,
	`recruiterRating` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `matchOutcomes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_delivery_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`integrationId` int NOT NULL,
	`notificationType` varchar(100) NOT NULL,
	`status` enum('delivered','failed') NOT NULL,
	`errorMessage` text,
	`deliveryTime` int,
	`payload` text,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notification_delivery_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` varchar(50) NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`relatedEntityType` varchar(50),
	`relatedEntityId` int,
	`actionUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `onboardingProcesses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`associateId` int NOT NULL,
	`processType` enum('onboarding','offboarding') NOT NULL,
	`status` enum('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
	`startedBy` int NOT NULL,
	`completedAt` timestamp,
	`dueDate` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `onboardingProcesses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `onboardingTasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`processId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`taskType` varchar(100),
	`status` enum('pending','in_progress','completed','blocked') NOT NULL DEFAULT 'pending',
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`dueDate` timestamp,
	`completedAt` timestamp,
	`completedBy` int,
	`orderIndex` int NOT NULL DEFAULT 0,
	`dependsOnTaskId` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `onboardingTasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `panel_action_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`panelistId` int NOT NULL,
	`interviewId` int NOT NULL,
	`token` varchar(255) NOT NULL,
	`actionType` enum('accept','decline','reschedule','feedback') NOT NULL,
	`usedAt` timestamp,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `panel_action_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `panel_action_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `panelist_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`interviewId` int NOT NULL,
	`panelistId` int NOT NULL,
	`userId` int NOT NULL,
	`overallRating` int NOT NULL,
	`technicalSkills` int,
	`communicationSkills` int,
	`problemSolving` int,
	`cultureFit` int,
	`strengths` text,
	`weaknesses` text,
	`notes` text,
	`recommendation` enum('strong_hire','hire','no_hire','strong_no_hire'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `panelist_feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `profileBadges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`icon` varchar(100) NOT NULL,
	`color` varchar(50) NOT NULL,
	`milestone` int NOT NULL,
	`points` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `profileBadges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `profileCompletionAnalytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` date NOT NULL,
	`totalCandidates` int NOT NULL DEFAULT 0,
	`completedProfiles` int NOT NULL DEFAULT 0,
	`partialProfiles` int NOT NULL DEFAULT 0,
	`incompleteProfiles` int NOT NULL DEFAULT 0,
	`averageCompletion` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `profileCompletionAnalytics_id` PRIMARY KEY(`id`),
	CONSTRAINT `profileCompletionAnalytics_date_unique` UNIQUE(`date`)
);
--> statement-breakpoint
CREATE TABLE `profileReminders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`reminderType` varchar(50) NOT NULL,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`profilePercentage` int NOT NULL,
	CONSTRAINT `profileReminders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recentlyViewedJobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`jobId` int NOT NULL,
	`viewedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recentlyViewedJobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recruiter_notification_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`newApplications` boolean NOT NULL DEFAULT true,
	`applicationStatusChanges` boolean NOT NULL DEFAULT true,
	`applicationFrequency` enum('immediate','daily','weekly') NOT NULL DEFAULT 'immediate',
	`interviewScheduled` boolean NOT NULL DEFAULT true,
	`interviewReminders` boolean NOT NULL DEFAULT true,
	`interviewCompleted` boolean NOT NULL DEFAULT true,
	`panelistResponses` boolean NOT NULL DEFAULT true,
	`candidateFeedback` boolean NOT NULL DEFAULT true,
	`panelistFeedbackSubmitted` boolean NOT NULL DEFAULT true,
	`weeklyDigest` boolean NOT NULL DEFAULT true,
	`systemUpdates` boolean NOT NULL DEFAULT false,
	`marketingEmails` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recruiter_notification_preferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recruiters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`companyName` varchar(255),
	`phoneNumber` varchar(50),
	`bio` text,
	`profileCompleted` boolean NOT NULL DEFAULT false,
	`profileCompletionStep` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recruiters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `report_executions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scheduleId` int NOT NULL,
	`executedAt` timestamp NOT NULL DEFAULT (now()),
	`status` enum('success','failed','pending') DEFAULT 'pending',
	`pdfUrl` varchar(500),
	`errorMessage` text,
	`recipientCount` int DEFAULT 0,
	CONSTRAINT `report_executions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `report_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`reportId` int,
	`reportType` varchar(100) NOT NULL,
	`frequency` enum('daily','weekly','monthly') NOT NULL,
	`dayOfWeek` int,
	`dayOfMonth` int,
	`timeOfDay` time DEFAULT '09:00:00',
	`recipients` json NOT NULL,
	`isActive` boolean DEFAULT true,
	`lastSentAt` timestamp,
	`nextSendAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `report_schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reschedule_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`interviewId` int NOT NULL,
	`panelistId` int NOT NULL,
	`requestedBy` int,
	`reason` text,
	`preferredDates` text,
	`status` enum('pending','approved','rejected','resolved','alternative_proposed') NOT NULL DEFAULT 'pending',
	`resolvedAt` timestamp,
	`resolvedBy` int,
	`newInterviewTime` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reschedule_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resumeProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`profileName` varchar(255) NOT NULL,
	`resumeUrl` varchar(500) NOT NULL,
	`resumeFileKey` varchar(500) NOT NULL,
	`resumeFilename` varchar(255) NOT NULL,
	`parsedData` text,
	`domainMatchScore` int DEFAULT 0,
	`skillMatchScore` int DEFAULT 0,
	`experienceScore` int DEFAULT 0,
	`overallScore` int DEFAULT 0,
	`primaryDomain` varchar(100),
	`totalExperienceYears` int DEFAULT 0,
	`isDefault` boolean NOT NULL DEFAULT false,
	`topDomains` json,
	`topSkills` json,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resumeProfiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `savedJobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`jobId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `savedJobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `savedSearches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`searchType` enum('candidate','job') NOT NULL DEFAULT 'candidate',
	`keyword` text,
	`location` text,
	`experienceLevel` varchar(50),
	`skills` text,
	`emailAlerts` boolean NOT NULL DEFAULT false,
	`alertFrequency` enum('immediate','daily','weekly') DEFAULT 'daily',
	`lastAlertSent` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `savedSearches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scheduling_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recruiterId` int NOT NULL,
	`interviewId` int,
	`candidateId` int,
	`provider` enum('calendly','cal_com') NOT NULL,
	`schedulingUrl` varchar(500) NOT NULL,
	`externalLinkId` varchar(255),
	`eventType` varchar(255),
	`duration` int NOT NULL,
	`timezone` varchar(100),
	`availableSlots` text,
	`linkSentAt` timestamp,
	`linkClickedAt` timestamp,
	`bookedAt` timestamp,
	`bookingStatus` enum('pending','clicked','booked','cancelled','expired') NOT NULL DEFAULT 'pending',
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scheduling_links_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sequenceEnrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sequenceId` int NOT NULL,
	`candidateId` int NOT NULL,
	`currentStep` int DEFAULT 0,
	`status` varchar(50) NOT NULL DEFAULT 'active',
	`enrolledAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`nextStepAt` timestamp,
	CONSTRAINT `sequenceEnrollments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sequenceSteps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sequenceId` int NOT NULL,
	`stepNumber` int NOT NULL,
	`delayDays` int NOT NULL,
	`templateId` int,
	`subject` varchar(500) NOT NULL,
	`body` text NOT NULL,
	`condition` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sequenceSteps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `skillAssessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int,
	`title` varchar(255) NOT NULL,
	`description` text,
	`duration` int,
	`passingScore` int NOT NULL DEFAULT 70,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `skillAssessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sourced_candidates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`candidateId` int,
	`sourceType` enum('linkedin','github','stackoverflow','manual') NOT NULL,
	`sourceUrl` varchar(500),
	`sourceProfileId` varchar(255),
	`rawProfileData` text,
	`fullName` varchar(255),
	`email` varchar(320),
	`phoneNumber` varchar(50),
	`location` varchar(255),
	`currentTitle` varchar(255),
	`currentCompany` varchar(255),
	`enrichmentStatus` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`enrichedData` text,
	`matchScore` int,
	`addedToPool` boolean DEFAULT false,
	`contacted` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sourced_candidates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sourcing_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`jobId` int,
	`createdBy` int NOT NULL,
	`targetRoles` text,
	`requiredSkills` text,
	`locations` text,
	`experienceMin` int,
	`experienceMax` int,
	`searchLinkedIn` boolean DEFAULT true,
	`searchGitHub` boolean DEFAULT true,
	`searchStackOverflow` boolean DEFAULT false,
	`maxCandidates` int DEFAULT 100,
	`autoEnrich` boolean DEFAULT true,
	`autoAddToPool` boolean DEFAULT true,
	`status` enum('draft','active','paused','completed','failed') NOT NULL DEFAULT 'draft',
	`candidatesFound` int DEFAULT 0,
	`candidatesEnriched` int DEFAULT 0,
	`candidatesAdded` int DEFAULT 0,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sourcing_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `systemHealthMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`metricType` varchar(100) NOT NULL,
	`metricValue` decimal(10,2) NOT NULL,
	`unit` varchar(50),
	`source` varchar(100),
	`details` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `systemHealthMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `systemSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`settingKey` varchar(100) NOT NULL,
	`settingValue` text,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `systemSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `systemSettings_settingKey_unique` UNIQUE(`settingKey`)
);
--> statement-breakpoint
CREATE TABLE `taskAssignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`recruiterId` int NOT NULL,
	`assignedBy` int NOT NULL,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `taskAssignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `taskReminders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`recruiterId` int NOT NULL,
	`reminderType` enum('due_soon','overdue','manual') NOT NULL,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`emailStatus` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `taskReminders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `taskTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`processType` enum('onboarding','offboarding') NOT NULL,
	`description` text,
	`tasks` text NOT NULL,
	`isDefault` boolean NOT NULL DEFAULT false,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `taskTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`userId` int NOT NULL,
	`recruiterId` int,
	`role` enum('recruiter','senior_recruiter','team_lead') NOT NULL DEFAULT 'recruiter',
	`permissions` json,
	`status` enum('active','inactive','suspended') NOT NULL DEFAULT 'active',
	`jobsAssigned` int DEFAULT 0,
	`applicationsProcessed` int DEFAULT 0,
	`interviewsScheduled` int DEFAULT 0,
	`hiresCompleted` int DEFAULT 0,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	`lastActiveAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `team_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `template_shares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`sharedBy` int NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`requestMessage` text,
	`reviewNotes` text,
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	`reviewedBy` int,
	CONSTRAINT `template_shares_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userActivityLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`companyId` int,
	`action` varchar(100) NOT NULL,
	`resource` varchar(100),
	`resourceId` int,
	`ipAddress` varchar(45),
	`userAgent` text,
	`details` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userActivityLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userBadges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`badgeId` int NOT NULL,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	`viewed` boolean NOT NULL DEFAULT false,
	CONSTRAINT `userBadges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userPoints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalPoints` int NOT NULL DEFAULT 0,
	`level` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userPoints_id` PRIMARY KEY(`id`),
	CONSTRAINT `userPoints_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64),
	`name` text,
	`email` varchar(320),
	`passwordHash` varchar(255),
	`loginMethod` varchar(64),
	`role` enum('admin','company_admin','recruiter','candidate') NOT NULL DEFAULT 'candidate',
	`companyId` int,
	`emailVerified` boolean NOT NULL DEFAULT false,
	`verificationToken` varchar(255),
	`verificationTokenExpiry` timestamp,
	`passwordResetToken` varchar(255),
	`passwordResetTokenExpiry` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `videoIntroductions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`videoUrl` varchar(500) NOT NULL,
	`videoFileKey` varchar(500) NOT NULL,
	`thumbnailUrl` varchar(500),
	`duration` int NOT NULL,
	`fileSize` int,
	`mimeType` varchar(100),
	`transcription` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `videoIntroductions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `aiNotificationPreferences` ADD CONSTRAINT `aiNotificationPreferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aiNotificationQueue` ADD CONSTRAINT `aiNotificationQueue_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `applicationFeedback` ADD CONSTRAINT `applicationFeedback_applicationId_applications_id_fk` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `applicationFeedback` ADD CONSTRAINT `applicationFeedback_recruiterId_recruiters_id_fk` FOREIGN KEY (`recruiterId`) REFERENCES `recruiters`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `application_history` ADD CONSTRAINT `application_history_applicationId_applications_id_fk` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `application_history` ADD CONSTRAINT `application_history_changedBy_users_id_fk` FOREIGN KEY (`changedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `application_logs` ADD CONSTRAINT `application_logs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `application_logs` ADD CONSTRAINT `application_logs_resolvedBy_users_id_fk` FOREIGN KEY (`resolvedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `applications` ADD CONSTRAINT `applications_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `applications` ADD CONSTRAINT `applications_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `applications` ADD CONSTRAINT `applications_resumeProfileId_resumeProfiles_id_fk` FOREIGN KEY (`resumeProfileId`) REFERENCES `resumeProfiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `applications` ADD CONSTRAINT `applications_videoIntroductionId_videoIntroductions_id_fk` FOREIGN KEY (`videoIntroductionId`) REFERENCES `videoIntroductions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessmentAnswers` ADD CONSTRAINT `assessmentAnswers_attemptId_assessmentAttempts_id_fk` FOREIGN KEY (`attemptId`) REFERENCES `assessmentAttempts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessmentAnswers` ADD CONSTRAINT `assessmentAnswers_questionId_assessmentQuestions_id_fk` FOREIGN KEY (`questionId`) REFERENCES `assessmentQuestions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessmentAttempts` ADD CONSTRAINT `assessmentAttempts_assessmentId_skillAssessments_id_fk` FOREIGN KEY (`assessmentId`) REFERENCES `skillAssessments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessmentAttempts` ADD CONSTRAINT `assessmentAttempts_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessmentAttempts` ADD CONSTRAINT `assessmentAttempts_applicationId_applications_id_fk` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessmentQuestions` ADD CONSTRAINT `assessmentQuestions_assessmentId_skillAssessments_id_fk` FOREIGN KEY (`assessmentId`) REFERENCES `skillAssessments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `associates` ADD CONSTRAINT `associates_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `associates` ADD CONSTRAINT `associates_managerId_recruiters_id_fk` FOREIGN KEY (`managerId`) REFERENCES `recruiters`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `associates` ADD CONSTRAINT `associates_onboardedBy_recruiters_id_fk` FOREIGN KEY (`onboardedBy`) REFERENCES `recruiters`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `calendar_events` ADD CONSTRAINT `calendar_events_interviewId_interviews_id_fk` FOREIGN KEY (`interviewId`) REFERENCES `interviews`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `calendar_events` ADD CONSTRAINT `calendar_events_calendarIntegrationId_calendar_integrations_id_fk` FOREIGN KEY (`calendarIntegrationId`) REFERENCES `calendar_integrations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `calendar_integrations` ADD CONSTRAINT `calendar_integrations_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `campaignRecipients` ADD CONSTRAINT `campaignRecipients_campaignId_emailCampaigns_id_fk` FOREIGN KEY (`campaignId`) REFERENCES `emailCampaigns`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `campaignRecipients` ADD CONSTRAINT `campaignRecipients_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `candidate_interactions` ADD CONSTRAINT `candidate_interactions_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `candidate_profile_shares` ADD CONSTRAINT `candidate_profile_shares_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `candidate_profile_shares` ADD CONSTRAINT `candidate_profile_shares_sharedByUserId_users_id_fk` FOREIGN KEY (`sharedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `candidate_profile_shares` ADD CONSTRAINT `candidate_profile_shares_customerId_customers_id_fk` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `candidate_profile_shares` ADD CONSTRAINT `candidate_profile_shares_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `candidate_skill_ratings` ADD CONSTRAINT `candidate_skill_ratings_applicationId_applications_id_fk` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `candidate_skill_ratings` ADD CONSTRAINT `candidate_skill_ratings_skillRequirementId_job_skill_requirements_id_fk` FOREIGN KEY (`skillRequirementId`) REFERENCES `job_skill_requirements`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `candidate_success_predictions` ADD CONSTRAINT `candidate_success_predictions_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `candidate_success_predictions` ADD CONSTRAINT `candidate_success_predictions_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `candidateTagAssignments` ADD CONSTRAINT `candidateTagAssignments_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `candidateTagAssignments` ADD CONSTRAINT `candidateTagAssignments_tagId_candidateTags_id_fk` FOREIGN KEY (`tagId`) REFERENCES `candidateTags`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `candidateTagAssignments` ADD CONSTRAINT `candidateTagAssignments_assignedBy_users_id_fk` FOREIGN KEY (`assignedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `candidateTags` ADD CONSTRAINT `candidateTags_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `candidates` ADD CONSTRAINT `candidates_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `codingChallenges` ADD CONSTRAINT `codingChallenges_interviewId_interviews_id_fk` FOREIGN KEY (`interviewId`) REFERENCES `interviews`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `codingChallenges` ADD CONSTRAINT `codingChallenges_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `codingSubmissions` ADD CONSTRAINT `codingSubmissions_challengeId_codingChallenges_id_fk` FOREIGN KEY (`challengeId`) REFERENCES `codingChallenges`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `codingSubmissions` ADD CONSTRAINT `codingSubmissions_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `companySettings` ADD CONSTRAINT `companySettings_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `custom_reports` ADD CONSTRAINT `custom_reports_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `custom_reports` ADD CONSTRAINT `custom_reports_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customerContacts` ADD CONSTRAINT `customerContacts_customerId_customers_id_fk` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customers` ADD CONSTRAINT `customers_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `diversityMetrics` ADD CONSTRAINT `diversityMetrics_recruiterId_recruiters_id_fk` FOREIGN KEY (`recruiterId`) REFERENCES `recruiters`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `diversityMetrics` ADD CONSTRAINT `diversityMetrics_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emailCampaigns` ADD CONSTRAINT `emailCampaigns_templateId_emailTemplates_id_fk` FOREIGN KEY (`templateId`) REFERENCES `emailTemplates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emailCampaigns` ADD CONSTRAINT `emailCampaigns_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emailTemplates` ADD CONSTRAINT `emailTemplates_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `environment_variables` ADD CONSTRAINT `environment_variables_updatedBy_users_id_fk` FOREIGN KEY (`updatedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `followUpSequences` ADD CONSTRAINT `followUpSequences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fraudDetectionEvents` ADD CONSTRAINT `fraudDetectionEvents_interviewId_interviews_id_fk` FOREIGN KEY (`interviewId`) REFERENCES `interviews`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fraudDetectionEvents` ADD CONSTRAINT `fraudDetectionEvents_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fraudDetectionEvents` ADD CONSTRAINT `fraudDetectionEvents_questionId_interviewQuestions_id_fk` FOREIGN KEY (`questionId`) REFERENCES `interviewQuestions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guest_applications` ADD CONSTRAINT `guest_applications_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guest_applications` ADD CONSTRAINT `guest_applications_claimedBy_candidates_id_fk` FOREIGN KEY (`claimedBy`) REFERENCES `candidates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guest_applications` ADD CONSTRAINT `guest_applications_applicationId_applications_id_fk` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inmail_templates` ADD CONSTRAINT `inmail_templates_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `integration_settings` ADD CONSTRAINT `integration_settings_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `integration_settings` ADD CONSTRAINT `integration_settings_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interview_feedback` ADD CONSTRAINT `interview_feedback_interviewId_interviews_id_fk` FOREIGN KEY (`interviewId`) REFERENCES `interviews`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interview_feedback` ADD CONSTRAINT `interview_feedback_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interview_panelists` ADD CONSTRAINT `interview_panelists_interviewId_interviews_id_fk` FOREIGN KEY (`interviewId`) REFERENCES `interviews`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interview_panelists` ADD CONSTRAINT `interview_panelists_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interviewQuestions` ADD CONSTRAINT `interviewQuestions_interviewId_interviews_id_fk` FOREIGN KEY (`interviewId`) REFERENCES `interviews`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interviewResponses` ADD CONSTRAINT `interviewResponses_interviewId_interviews_id_fk` FOREIGN KEY (`interviewId`) REFERENCES `interviews`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interviewResponses` ADD CONSTRAINT `interviewResponses_questionId_interviewQuestions_id_fk` FOREIGN KEY (`questionId`) REFERENCES `interviewQuestions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interviewResponses` ADD CONSTRAINT `interviewResponses_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interviews` ADD CONSTRAINT `interviews_applicationId_applications_id_fk` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interviews` ADD CONSTRAINT `interviews_recruiterId_recruiters_id_fk` FOREIGN KEY (`recruiterId`) REFERENCES `recruiters`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interviews` ADD CONSTRAINT `interviews_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interviews` ADD CONSTRAINT `interviews_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `job_application_sources` ADD CONSTRAINT `job_application_sources_applicationId_applications_id_fk` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `job_skill_requirements` ADD CONSTRAINT `job_skill_requirements_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `job_templates` ADD CONSTRAINT `job_templates_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `job_templates` ADD CONSTRAINT `job_templates_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `job_view_analytics` ADD CONSTRAINT `job_view_analytics_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `job_view_analytics` ADD CONSTRAINT `job_view_analytics_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `job_view_sessions` ADD CONSTRAINT `job_view_sessions_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `job_view_sessions` ADD CONSTRAINT `job_view_sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `job_views` ADD CONSTRAINT `job_views_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `job_views` ADD CONSTRAINT `job_views_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `jobs` ADD CONSTRAINT `jobs_customerId_customers_id_fk` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `jobs` ADD CONSTRAINT `jobs_contactId_customerContacts_id_fk` FOREIGN KEY (`contactId`) REFERENCES `customerContacts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `jobs` ADD CONSTRAINT `jobs_postedBy_users_id_fk` FOREIGN KEY (`postedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `linkedin_credit_usage` ADD CONSTRAINT `linkedin_credit_usage_recruiterId_recruiters_id_fk` FOREIGN KEY (`recruiterId`) REFERENCES `recruiters`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `linkedin_credit_usage` ADD CONSTRAINT `linkedin_credit_usage_linkedinInmailId_linkedin_inmails_id_fk` FOREIGN KEY (`linkedinInmailId`) REFERENCES `linkedin_inmails`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `linkedin_credit_usage` ADD CONSTRAINT `linkedin_credit_usage_linkedinProfileId_linkedin_profiles_id_fk` FOREIGN KEY (`linkedinProfileId`) REFERENCES `linkedin_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `linkedin_inmails` ADD CONSTRAINT `linkedin_inmails_linkedinProfileId_linkedin_profiles_id_fk` FOREIGN KEY (`linkedinProfileId`) REFERENCES `linkedin_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `linkedin_inmails` ADD CONSTRAINT `linkedin_inmails_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `linkedin_inmails` ADD CONSTRAINT `linkedin_inmails_recruiterId_recruiters_id_fk` FOREIGN KEY (`recruiterId`) REFERENCES `recruiters`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `linkedin_inmails` ADD CONSTRAINT `linkedin_inmails_sourcingCampaignId_sourcing_campaigns_id_fk` FOREIGN KEY (`sourcingCampaignId`) REFERENCES `sourcing_campaigns`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `linkedin_profiles` ADD CONSTRAINT `linkedin_profiles_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `linkedin_profiles` ADD CONSTRAINT `linkedin_profiles_sourcingCampaignId_sourcing_campaigns_id_fk` FOREIGN KEY (`sourcingCampaignId`) REFERENCES `sourcing_campaigns`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `matchOutcomes` ADD CONSTRAINT `matchOutcomes_applicationId_applications_id_fk` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `matchOutcomes` ADD CONSTRAINT `matchOutcomes_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `matchOutcomes` ADD CONSTRAINT `matchOutcomes_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `matchOutcomes` ADD CONSTRAINT `matchOutcomes_recruiterId_recruiters_id_fk` FOREIGN KEY (`recruiterId`) REFERENCES `recruiters`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notification_delivery_logs` ADD CONSTRAINT `notification_delivery_logs_integrationId_integration_settings_id_fk` FOREIGN KEY (`integrationId`) REFERENCES `integration_settings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `onboardingProcesses` ADD CONSTRAINT `onboardingProcesses_associateId_associates_id_fk` FOREIGN KEY (`associateId`) REFERENCES `associates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `onboardingProcesses` ADD CONSTRAINT `onboardingProcesses_startedBy_recruiters_id_fk` FOREIGN KEY (`startedBy`) REFERENCES `recruiters`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `onboardingTasks` ADD CONSTRAINT `onboardingTasks_processId_onboardingProcesses_id_fk` FOREIGN KEY (`processId`) REFERENCES `onboardingProcesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `onboardingTasks` ADD CONSTRAINT `onboardingTasks_completedBy_recruiters_id_fk` FOREIGN KEY (`completedBy`) REFERENCES `recruiters`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `panelist_feedback` ADD CONSTRAINT `panelist_feedback_interviewId_interviews_id_fk` FOREIGN KEY (`interviewId`) REFERENCES `interviews`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `panelist_feedback` ADD CONSTRAINT `panelist_feedback_panelistId_interview_panelists_id_fk` FOREIGN KEY (`panelistId`) REFERENCES `interview_panelists`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `panelist_feedback` ADD CONSTRAINT `panelist_feedback_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `profileReminders` ADD CONSTRAINT `profileReminders_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `recentlyViewedJobs` ADD CONSTRAINT `recentlyViewedJobs_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `recentlyViewedJobs` ADD CONSTRAINT `recentlyViewedJobs_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `recruiter_notification_preferences` ADD CONSTRAINT `recruiter_notification_preferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `recruiters` ADD CONSTRAINT `recruiters_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `report_executions` ADD CONSTRAINT `report_executions_scheduleId_report_schedules_id_fk` FOREIGN KEY (`scheduleId`) REFERENCES `report_schedules`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `report_schedules` ADD CONSTRAINT `report_schedules_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `report_schedules` ADD CONSTRAINT `report_schedules_reportId_custom_reports_id_fk` FOREIGN KEY (`reportId`) REFERENCES `custom_reports`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reschedule_requests` ADD CONSTRAINT `reschedule_requests_interviewId_interviews_id_fk` FOREIGN KEY (`interviewId`) REFERENCES `interviews`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reschedule_requests` ADD CONSTRAINT `reschedule_requests_panelistId_interview_panelists_id_fk` FOREIGN KEY (`panelistId`) REFERENCES `interview_panelists`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reschedule_requests` ADD CONSTRAINT `reschedule_requests_requestedBy_users_id_fk` FOREIGN KEY (`requestedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reschedule_requests` ADD CONSTRAINT `reschedule_requests_resolvedBy_users_id_fk` FOREIGN KEY (`resolvedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resumeProfiles` ADD CONSTRAINT `resumeProfiles_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `savedJobs` ADD CONSTRAINT `savedJobs_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `savedJobs` ADD CONSTRAINT `savedJobs_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `savedSearches` ADD CONSTRAINT `savedSearches_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scheduling_links` ADD CONSTRAINT `scheduling_links_recruiterId_recruiters_id_fk` FOREIGN KEY (`recruiterId`) REFERENCES `recruiters`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scheduling_links` ADD CONSTRAINT `scheduling_links_interviewId_interviews_id_fk` FOREIGN KEY (`interviewId`) REFERENCES `interviews`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scheduling_links` ADD CONSTRAINT `scheduling_links_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sequenceEnrollments` ADD CONSTRAINT `sequenceEnrollments_sequenceId_followUpSequences_id_fk` FOREIGN KEY (`sequenceId`) REFERENCES `followUpSequences`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sequenceEnrollments` ADD CONSTRAINT `sequenceEnrollments_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sequenceSteps` ADD CONSTRAINT `sequenceSteps_sequenceId_followUpSequences_id_fk` FOREIGN KEY (`sequenceId`) REFERENCES `followUpSequences`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sequenceSteps` ADD CONSTRAINT `sequenceSteps_templateId_emailTemplates_id_fk` FOREIGN KEY (`templateId`) REFERENCES `emailTemplates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skillAssessments` ADD CONSTRAINT `skillAssessments_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skillAssessments` ADD CONSTRAINT `skillAssessments_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sourced_candidates` ADD CONSTRAINT `sourced_candidates_campaignId_sourcing_campaigns_id_fk` FOREIGN KEY (`campaignId`) REFERENCES `sourcing_campaigns`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sourced_candidates` ADD CONSTRAINT `sourced_candidates_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sourcing_campaigns` ADD CONSTRAINT `sourcing_campaigns_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sourcing_campaigns` ADD CONSTRAINT `sourcing_campaigns_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `taskAssignments` ADD CONSTRAINT `taskAssignments_taskId_onboardingTasks_id_fk` FOREIGN KEY (`taskId`) REFERENCES `onboardingTasks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `taskAssignments` ADD CONSTRAINT `taskAssignments_recruiterId_recruiters_id_fk` FOREIGN KEY (`recruiterId`) REFERENCES `recruiters`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `taskAssignments` ADD CONSTRAINT `taskAssignments_assignedBy_recruiters_id_fk` FOREIGN KEY (`assignedBy`) REFERENCES `recruiters`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `taskReminders` ADD CONSTRAINT `taskReminders_taskId_onboardingTasks_id_fk` FOREIGN KEY (`taskId`) REFERENCES `onboardingTasks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `taskReminders` ADD CONSTRAINT `taskReminders_recruiterId_recruiters_id_fk` FOREIGN KEY (`recruiterId`) REFERENCES `recruiters`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `taskTemplates` ADD CONSTRAINT `taskTemplates_createdBy_recruiters_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `recruiters`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `team_members` ADD CONSTRAINT `team_members_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `team_members` ADD CONSTRAINT `team_members_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `team_members` ADD CONSTRAINT `team_members_recruiterId_recruiters_id_fk` FOREIGN KEY (`recruiterId`) REFERENCES `recruiters`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `template_shares` ADD CONSTRAINT `template_shares_templateId_job_templates_id_fk` FOREIGN KEY (`templateId`) REFERENCES `job_templates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `template_shares` ADD CONSTRAINT `template_shares_sharedBy_users_id_fk` FOREIGN KEY (`sharedBy`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `template_shares` ADD CONSTRAINT `template_shares_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userActivityLogs` ADD CONSTRAINT `userActivityLogs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userActivityLogs` ADD CONSTRAINT `userActivityLogs_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userBadges` ADD CONSTRAINT `userBadges_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userBadges` ADD CONSTRAINT `userBadges_badgeId_profileBadges_id_fk` FOREIGN KEY (`badgeId`) REFERENCES `profileBadges`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userPoints` ADD CONSTRAINT `userPoints_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `videoIntroductions` ADD CONSTRAINT `videoIntroductions_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_email` ON `emailDeliveryEvents` (`email`);--> statement-breakpoint
CREATE INDEX `idx_event_type` ON `emailDeliveryEvents` (`eventType`);--> statement-breakpoint
CREATE INDEX `idx_provider` ON `emailDeliveryEvents` (`provider`);--> statement-breakpoint
CREATE INDEX `idx_timestamp` ON `emailDeliveryEvents` (`timestamp`);--> statement-breakpoint
CREATE INDEX `idx_provider` ON `emailWebhookLogs` (`provider`);--> statement-breakpoint
CREATE INDEX `idx_created` ON `emailWebhookLogs` (`createdAt`);