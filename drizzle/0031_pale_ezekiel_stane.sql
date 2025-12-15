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
CREATE TABLE `reschedule_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`interviewId` int NOT NULL,
	`panelistId` int NOT NULL,
	`requestedBy` int,
	`reason` text,
	`preferredDates` text,
	`status` enum('pending','approved','rejected','resolved') NOT NULL DEFAULT 'pending',
	`resolvedAt` timestamp,
	`resolvedBy` int,
	`newInterviewTime` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reschedule_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `candidate_skill_ratings` ADD CONSTRAINT `candidate_skill_ratings_applicationId_applications_id_fk` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `candidate_skill_ratings` ADD CONSTRAINT `candidate_skill_ratings_skillRequirementId_job_skill_requirements_id_fk` FOREIGN KEY (`skillRequirementId`) REFERENCES `job_skill_requirements`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `job_skill_requirements` ADD CONSTRAINT `job_skill_requirements_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reschedule_requests` ADD CONSTRAINT `reschedule_requests_interviewId_interviews_id_fk` FOREIGN KEY (`interviewId`) REFERENCES `interviews`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reschedule_requests` ADD CONSTRAINT `reschedule_requests_panelistId_interview_panelists_id_fk` FOREIGN KEY (`panelistId`) REFERENCES `interview_panelists`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reschedule_requests` ADD CONSTRAINT `reschedule_requests_requestedBy_users_id_fk` FOREIGN KEY (`requestedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reschedule_requests` ADD CONSTRAINT `reschedule_requests_resolvedBy_users_id_fk` FOREIGN KEY (`resolvedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;