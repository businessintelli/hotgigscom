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
ALTER TABLE `candidate_success_predictions` ADD CONSTRAINT `candidate_success_predictions_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `candidate_success_predictions` ADD CONSTRAINT `candidate_success_predictions_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sourced_candidates` ADD CONSTRAINT `sourced_candidates_campaignId_sourcing_campaigns_id_fk` FOREIGN KEY (`campaignId`) REFERENCES `sourcing_campaigns`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sourced_candidates` ADD CONSTRAINT `sourced_candidates_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sourcing_campaigns` ADD CONSTRAINT `sourcing_campaigns_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sourcing_campaigns` ADD CONSTRAINT `sourcing_campaigns_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;