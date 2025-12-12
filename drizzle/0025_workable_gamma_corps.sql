ALTER TABLE `candidates` ADD `profileCompleted` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `candidates` ADD `profileCompletionStep` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `recruiters` ADD `profileCompleted` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `recruiters` ADD `profileCompletionStep` int DEFAULT 0 NOT NULL;