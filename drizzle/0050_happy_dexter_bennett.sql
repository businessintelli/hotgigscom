CREATE TABLE `custom_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`selectedFields` json NOT NULL,
	`filters` json,
	`groupBy` varchar(100),
	`sortBy` varchar(100),
	`sortOrder` enum('asc','desc') DEFAULT 'asc',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `custom_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `report_executions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scheduleId` int NOT NULL,
	`executedAt` timestamp NOT NULL DEFAULT (now()),
	`status` enum('success','failed','pending') DEFAULT 'pending',
	`pdfUrl` varchar(500),
	`errorMessage` text,
	`recipientCount` int DEFAULT 0,
	CONSTRAINT `report_executions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `report_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`reportId` int,
	`reportType` varchar(100) NOT NULL,
	`frequency` enum('daily','weekly','monthly') NOT NULL,
	`dayOfWeek` int,
	`dayOfMonth` int,
	`timeOfDay` time DEFAULT '09:00:00',
	`recipients` json NOT NULL,
	`isActive` boolean DEFAULT true,
	`lastSentAt` timestamp,
	`nextSendAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `report_schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `custom_reports` ADD CONSTRAINT `custom_reports_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `custom_reports` ADD CONSTRAINT `custom_reports_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `report_executions` ADD CONSTRAINT `report_executions_scheduleId_report_schedules_id_fk` FOREIGN KEY (`scheduleId`) REFERENCES `report_schedules`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `report_schedules` ADD CONSTRAINT `report_schedules_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `report_schedules` ADD CONSTRAINT `report_schedules_reportId_custom_reports_id_fk` FOREIGN KEY (`reportId`) REFERENCES `custom_reports`(`id`) ON DELETE cascade ON UPDATE no action;