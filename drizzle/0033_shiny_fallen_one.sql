CREATE TABLE `notification_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`statusUpdatesEnabled` boolean NOT NULL DEFAULT true,
	`statusUpdatesFrequency` enum('immediate','daily','weekly') NOT NULL DEFAULT 'immediate',
	`interviewRemindersEnabled` boolean NOT NULL DEFAULT true,
	`interviewReminder24h` boolean NOT NULL DEFAULT true,
	`interviewReminder1h` boolean NOT NULL DEFAULT true,
	`jobRecommendationsEnabled` boolean NOT NULL DEFAULT true,
	`jobRecommendationsFrequency` enum('immediate','daily','weekly') NOT NULL DEFAULT 'weekly',
	`marketingEmailsEnabled` boolean NOT NULL DEFAULT false,
	`weeklyDigestEnabled` boolean NOT NULL DEFAULT true,
	`messageNotificationsEnabled` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `notification_preferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `notification_preferences` ADD CONSTRAINT `notification_preferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;