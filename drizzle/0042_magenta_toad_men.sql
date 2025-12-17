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
ALTER TABLE `aiNotificationPreferences` ADD CONSTRAINT `aiNotificationPreferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aiNotificationQueue` ADD CONSTRAINT `aiNotificationQueue_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `diversityMetrics` ADD CONSTRAINT `diversityMetrics_recruiterId_recruiters_id_fk` FOREIGN KEY (`recruiterId`) REFERENCES `recruiters`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `diversityMetrics` ADD CONSTRAINT `diversityMetrics_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `matchOutcomes` ADD CONSTRAINT `matchOutcomes_applicationId_applications_id_fk` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `matchOutcomes` ADD CONSTRAINT `matchOutcomes_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `matchOutcomes` ADD CONSTRAINT `matchOutcomes_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `matchOutcomes` ADD CONSTRAINT `matchOutcomes_recruiterId_recruiters_id_fk` FOREIGN KEY (`recruiterId`) REFERENCES `recruiters`(`id`) ON DELETE no action ON UPDATE no action;