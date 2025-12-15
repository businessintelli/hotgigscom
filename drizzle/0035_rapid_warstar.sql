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
ALTER TABLE `candidate_profile_shares` ADD CONSTRAINT `candidate_profile_shares_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `candidate_profile_shares` ADD CONSTRAINT `candidate_profile_shares_sharedByUserId_users_id_fk` FOREIGN KEY (`sharedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `candidate_profile_shares` ADD CONSTRAINT `candidate_profile_shares_customerId_customers_id_fk` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `candidate_profile_shares` ADD CONSTRAINT `candidate_profile_shares_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE no action ON UPDATE no action;