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
ALTER TABLE `inmail_templates` ADD CONSTRAINT `inmail_templates_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `linkedin_credit_usage` ADD CONSTRAINT `linkedin_credit_usage_recruiterId_recruiters_id_fk` FOREIGN KEY (`recruiterId`) REFERENCES `recruiters`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `linkedin_credit_usage` ADD CONSTRAINT `linkedin_credit_usage_linkedinInmailId_linkedin_inmails_id_fk` FOREIGN KEY (`linkedinInmailId`) REFERENCES `linkedin_inmails`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `linkedin_credit_usage` ADD CONSTRAINT `linkedin_credit_usage_linkedinProfileId_linkedin_profiles_id_fk` FOREIGN KEY (`linkedinProfileId`) REFERENCES `linkedin_profiles`(`id`) ON DELETE no action ON UPDATE no action;