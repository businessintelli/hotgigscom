CREATE TABLE `savedJobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`jobId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `savedJobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `savedJobs` ADD CONSTRAINT `savedJobs_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `savedJobs` ADD CONSTRAINT `savedJobs_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE no action ON UPDATE no action;