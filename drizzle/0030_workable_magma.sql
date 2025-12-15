CREATE TABLE `panel_action_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`panelistId` int NOT NULL,
	`interviewId` int NOT NULL,
	`token` varchar(255) NOT NULL,
	`actionType` enum('accept','decline','reschedule','feedback') NOT NULL,
	`usedAt` timestamp,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `panel_action_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `panel_action_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','recruiter','candidate','panelist') NOT NULL DEFAULT 'user';