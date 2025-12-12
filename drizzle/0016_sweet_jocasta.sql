CREATE TABLE `campaignRecipients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`candidateId` int NOT NULL,
	`email` varchar(255) NOT NULL,
	`personalizedSubject` varchar(500),
	`personalizedBody` text,
	`status` varchar(50) NOT NULL DEFAULT 'pending',
	`sentAt` timestamp,
	`openedAt` timestamp,
	`clickedAt` timestamp,
	`bouncedAt` timestamp,
	`repliedAt` timestamp,
	`trackingId` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `campaignRecipients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailCampaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`templateId` int,
	`subject` varchar(500) NOT NULL,
	`body` text NOT NULL,
	`userId` int NOT NULL,
	`status` varchar(50) NOT NULL DEFAULT 'draft',
	`scheduledAt` timestamp,
	`sentAt` timestamp,
	`totalRecipients` int DEFAULT 0,
	`sentCount` int DEFAULT 0,
	`openedCount` int DEFAULT 0,
	`clickedCount` int DEFAULT 0,
	`bouncedCount` int DEFAULT 0,
	`repliedCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailCampaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`body` text NOT NULL,
	`category` varchar(100),
	`userId` int NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `followUpSequences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`userId` int NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `followUpSequences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sequenceEnrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sequenceId` int NOT NULL,
	`candidateId` int NOT NULL,
	`currentStep` int DEFAULT 0,
	`status` varchar(50) NOT NULL DEFAULT 'active',
	`enrolledAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`nextStepAt` timestamp,
	CONSTRAINT `sequenceEnrollments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sequenceSteps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sequenceId` int NOT NULL,
	`stepNumber` int NOT NULL,
	`delayDays` int NOT NULL,
	`templateId` int,
	`subject` varchar(500) NOT NULL,
	`body` text NOT NULL,
	`condition` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sequenceSteps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `campaignRecipients` ADD CONSTRAINT `campaignRecipients_campaignId_emailCampaigns_id_fk` FOREIGN KEY (`campaignId`) REFERENCES `emailCampaigns`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `campaignRecipients` ADD CONSTRAINT `campaignRecipients_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emailCampaigns` ADD CONSTRAINT `emailCampaigns_templateId_emailTemplates_id_fk` FOREIGN KEY (`templateId`) REFERENCES `emailTemplates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emailCampaigns` ADD CONSTRAINT `emailCampaigns_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emailTemplates` ADD CONSTRAINT `emailTemplates_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `followUpSequences` ADD CONSTRAINT `followUpSequences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sequenceEnrollments` ADD CONSTRAINT `sequenceEnrollments_sequenceId_followUpSequences_id_fk` FOREIGN KEY (`sequenceId`) REFERENCES `followUpSequences`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sequenceEnrollments` ADD CONSTRAINT `sequenceEnrollments_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sequenceSteps` ADD CONSTRAINT `sequenceSteps_sequenceId_followUpSequences_id_fk` FOREIGN KEY (`sequenceId`) REFERENCES `followUpSequences`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sequenceSteps` ADD CONSTRAINT `sequenceSteps_templateId_emailTemplates_id_fk` FOREIGN KEY (`templateId`) REFERENCES `emailTemplates`(`id`) ON DELETE no action ON UPDATE no action;