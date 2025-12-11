ALTER TABLE `codingChallenges` MODIFY COLUMN `interviewId` int;--> statement-breakpoint
ALTER TABLE `codingChallenges` ADD `createdBy` int;--> statement-breakpoint
ALTER TABLE `codingChallenges` ADD CONSTRAINT `codingChallenges_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;