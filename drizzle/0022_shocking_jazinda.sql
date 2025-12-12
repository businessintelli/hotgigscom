CREATE TABLE `associates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`employeeId` varchar(100),
	`jobTitle` varchar(255) NOT NULL,
	`department` varchar(255),
	`startDate` timestamp NOT NULL,
	`endDate` timestamp,
	`status` enum('active','onboarding','offboarding','terminated') NOT NULL DEFAULT 'onboarding',
	`managerId` int,
	`onboardedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `associates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `onboardingProcesses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`associateId` int NOT NULL,
	`processType` enum('onboarding','offboarding') NOT NULL,
	`status` enum('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
	`startedBy` int NOT NULL,
	`completedAt` timestamp,
	`dueDate` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `onboardingProcesses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `onboardingTasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`processId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`taskType` varchar(100),
	`status` enum('pending','in_progress','completed','blocked') NOT NULL DEFAULT 'pending',
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`dueDate` timestamp,
	`completedAt` timestamp,
	`completedBy` int,
	`orderIndex` int NOT NULL DEFAULT 0,
	`dependsOnTaskId` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `onboardingTasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `taskAssignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`recruiterId` int NOT NULL,
	`assignedBy` int NOT NULL,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `taskAssignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `taskReminders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`recruiterId` int NOT NULL,
	`reminderType` enum('due_soon','overdue','manual') NOT NULL,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`emailStatus` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `taskReminders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `taskTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`processType` enum('onboarding','offboarding') NOT NULL,
	`description` text,
	`tasks` text NOT NULL,
	`isDefault` boolean NOT NULL DEFAULT false,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `taskTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `associates` ADD CONSTRAINT `associates_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `associates` ADD CONSTRAINT `associates_managerId_recruiters_id_fk` FOREIGN KEY (`managerId`) REFERENCES `recruiters`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `associates` ADD CONSTRAINT `associates_onboardedBy_recruiters_id_fk` FOREIGN KEY (`onboardedBy`) REFERENCES `recruiters`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `onboardingProcesses` ADD CONSTRAINT `onboardingProcesses_associateId_associates_id_fk` FOREIGN KEY (`associateId`) REFERENCES `associates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `onboardingProcesses` ADD CONSTRAINT `onboardingProcesses_startedBy_recruiters_id_fk` FOREIGN KEY (`startedBy`) REFERENCES `recruiters`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `onboardingTasks` ADD CONSTRAINT `onboardingTasks_processId_onboardingProcesses_id_fk` FOREIGN KEY (`processId`) REFERENCES `onboardingProcesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `onboardingTasks` ADD CONSTRAINT `onboardingTasks_completedBy_recruiters_id_fk` FOREIGN KEY (`completedBy`) REFERENCES `recruiters`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `onboardingTasks` ADD CONSTRAINT `onboardingTasks_dependsOnTaskId_onboardingTasks_id_fk` FOREIGN KEY (`dependsOnTaskId`) REFERENCES `onboardingTasks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `taskAssignments` ADD CONSTRAINT `taskAssignments_taskId_onboardingTasks_id_fk` FOREIGN KEY (`taskId`) REFERENCES `onboardingTasks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `taskAssignments` ADD CONSTRAINT `taskAssignments_recruiterId_recruiters_id_fk` FOREIGN KEY (`recruiterId`) REFERENCES `recruiters`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `taskAssignments` ADD CONSTRAINT `taskAssignments_assignedBy_recruiters_id_fk` FOREIGN KEY (`assignedBy`) REFERENCES `recruiters`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `taskReminders` ADD CONSTRAINT `taskReminders_taskId_onboardingTasks_id_fk` FOREIGN KEY (`taskId`) REFERENCES `onboardingTasks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `taskReminders` ADD CONSTRAINT `taskReminders_recruiterId_recruiters_id_fk` FOREIGN KEY (`recruiterId`) REFERENCES `recruiters`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `taskTemplates` ADD CONSTRAINT `taskTemplates_createdBy_recruiters_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `recruiters`(`id`) ON DELETE no action ON UPDATE no action;