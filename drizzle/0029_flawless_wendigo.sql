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
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `interview_panelists_id` PRIMARY KEY(`id`)
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
ALTER TABLE `interview_feedback` ADD CONSTRAINT `interview_feedback_interviewId_interviews_id_fk` FOREIGN KEY (`interviewId`) REFERENCES `interviews`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interview_feedback` ADD CONSTRAINT `interview_feedback_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interview_panelists` ADD CONSTRAINT `interview_panelists_interviewId_interviews_id_fk` FOREIGN KEY (`interviewId`) REFERENCES `interviews`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interview_panelists` ADD CONSTRAINT `interview_panelists_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `panelist_feedback` ADD CONSTRAINT `panelist_feedback_interviewId_interviews_id_fk` FOREIGN KEY (`interviewId`) REFERENCES `interviews`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `panelist_feedback` ADD CONSTRAINT `panelist_feedback_panelistId_interview_panelists_id_fk` FOREIGN KEY (`panelistId`) REFERENCES `interview_panelists`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `panelist_feedback` ADD CONSTRAINT `panelist_feedback_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `recruiter_notification_preferences` ADD CONSTRAINT `recruiter_notification_preferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;