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
ALTER TABLE `team_members` ADD CONSTRAINT `team_members_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `team_members` ADD CONSTRAINT `team_members_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `team_members` ADD CONSTRAINT `team_members_recruiterId_recruiters_id_fk` FOREIGN KEY (`recruiterId`) REFERENCES `recruiters`(`id`) ON DELETE cascade ON UPDATE no action;