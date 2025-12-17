CREATE TABLE `profileBadges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`icon` varchar(100) NOT NULL,
	`color` varchar(50) NOT NULL,
	`milestone` int NOT NULL,
	`points` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `profileBadges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `profileCompletionAnalytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` date NOT NULL,
	`totalCandidates` int NOT NULL DEFAULT 0,
	`completedProfiles` int NOT NULL DEFAULT 0,
	`partialProfiles` int NOT NULL DEFAULT 0,
	`incompleteProfiles` int NOT NULL DEFAULT 0,
	`averageCompletion` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `profileCompletionAnalytics_id` PRIMARY KEY(`id`),
	CONSTRAINT `profileCompletionAnalytics_date_unique` UNIQUE(`date`)
);
--> statement-breakpoint
CREATE TABLE `profileReminders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`reminderType` varchar(50) NOT NULL,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`profilePercentage` int NOT NULL,
	CONSTRAINT `profileReminders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userBadges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`badgeId` int NOT NULL,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	`viewed` boolean NOT NULL DEFAULT false,
	CONSTRAINT `userBadges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userPoints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalPoints` int NOT NULL DEFAULT 0,
	`level` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userPoints_id` PRIMARY KEY(`id`),
	CONSTRAINT `userPoints_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `profileReminders` ADD CONSTRAINT `profileReminders_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userBadges` ADD CONSTRAINT `userBadges_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userBadges` ADD CONSTRAINT `userBadges_badgeId_profileBadges_id_fk` FOREIGN KEY (`badgeId`) REFERENCES `profileBadges`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userPoints` ADD CONSTRAINT `userPoints_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;