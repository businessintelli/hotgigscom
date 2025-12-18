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
ALTER TABLE `job_templates` ADD `companyId` int;--> statement-breakpoint
ALTER TABLE `job_templates` ADD `isCompanyWide` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `job_application_sources` ADD CONSTRAINT `job_application_sources_applicationId_applications_id_fk` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `job_view_analytics` ADD CONSTRAINT `job_view_analytics_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `job_view_analytics` ADD CONSTRAINT `job_view_analytics_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `job_view_sessions` ADD CONSTRAINT `job_view_sessions_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `job_view_sessions` ADD CONSTRAINT `job_view_sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `template_shares` ADD CONSTRAINT `template_shares_templateId_job_templates_id_fk` FOREIGN KEY (`templateId`) REFERENCES `job_templates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `template_shares` ADD CONSTRAINT `template_shares_sharedBy_users_id_fk` FOREIGN KEY (`sharedBy`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `template_shares` ADD CONSTRAINT `template_shares_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `job_templates` ADD CONSTRAINT `job_templates_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;