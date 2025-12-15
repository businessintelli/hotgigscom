ALTER TABLE `recruiters` ADD `emailDigestFrequency` enum('never','daily','weekly') DEFAULT 'weekly';--> statement-breakpoint
ALTER TABLE `recruiters` ADD `lastDigestSentAt` timestamp;