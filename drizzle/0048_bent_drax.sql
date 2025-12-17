CREATE TABLE `companySettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`sendgridApiKey` varchar(500),
	`resendApiKey` varchar(500),
	`openaiApiKey` varchar(500),
	`linkedinApiKey` varchar(500),
	`fromEmail` varchar(320),
	`fromName` varchar(255),
	`replyToEmail` varchar(320),
	`enableEmailNotifications` boolean NOT NULL DEFAULT true,
	`enableSmsNotifications` boolean NOT NULL DEFAULT false,
	`companyLogo` varchar(500),
	`primaryColor` varchar(7),
	`secondaryColor` varchar(7),
	`additionalSettings` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `companySettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `systemHealthMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`metricType` varchar(100) NOT NULL,
	`metricValue` decimal(10,2) NOT NULL,
	`unit` varchar(50),
	`source` varchar(100),
	`details` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `systemHealthMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userActivityLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`companyId` int,
	`action` varchar(100) NOT NULL,
	`resource` varchar(100),
	`resourceId` int,
	`ipAddress` varchar(45),
	`userAgent` text,
	`details` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userActivityLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `companySettings` ADD CONSTRAINT `companySettings_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userActivityLogs` ADD CONSTRAINT `userActivityLogs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userActivityLogs` ADD CONSTRAINT `userActivityLogs_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;