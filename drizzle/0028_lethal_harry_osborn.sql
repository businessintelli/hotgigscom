CREATE TABLE `applicationFeedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`recruiterId` int NOT NULL,
	`rating` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `applicationFeedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `applicationFeedback` ADD CONSTRAINT `applicationFeedback_applicationId_applications_id_fk` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `applicationFeedback` ADD CONSTRAINT `applicationFeedback_recruiterId_recruiters_id_fk` FOREIGN KEY (`recruiterId`) REFERENCES `recruiters`(`id`) ON DELETE no action ON UPDATE no action;