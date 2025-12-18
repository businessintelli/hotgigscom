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
	`isPublic` boolean DEFAULT false,
	`usageCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `job_templates_id` PRIMARY KEY(`id`)
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
ALTER TABLE `job_templates` ADD CONSTRAINT `job_templates_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `job_views` ADD CONSTRAINT `job_views_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `job_views` ADD CONSTRAINT `job_views_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;