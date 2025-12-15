CREATE TABLE `feedbackTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`category` varchar(50) NOT NULL,
	`rating` int,
	`notes` text NOT NULL,
	`isDefault` boolean NOT NULL DEFAULT true,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feedbackTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `feedbackTemplates` ADD CONSTRAINT `feedbackTemplates_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;