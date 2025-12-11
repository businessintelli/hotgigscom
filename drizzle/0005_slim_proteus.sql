CREATE TABLE `savedSearches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`searchType` enum('candidate','job') NOT NULL DEFAULT 'candidate',
	`keyword` text,
	`location` text,
	`experienceLevel` varchar(50),
	`skills` text,
	`emailAlerts` boolean NOT NULL DEFAULT false,
	`alertFrequency` enum('immediate','daily','weekly') DEFAULT 'daily',
	`lastAlertSent` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `savedSearches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `savedSearches` ADD CONSTRAINT `savedSearches_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;