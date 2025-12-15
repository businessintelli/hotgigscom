CREATE TABLE `company_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`industry` varchar(255),
	`description` text,
	`culture` text,
	`interviewProcess` text,
	`commonQuestions` text,
	`tips` text,
	`website` varchar(500),
	`logoUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `company_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `company_profiles_companyName_unique` UNIQUE(`companyName`)
);
--> statement-breakpoint
CREATE TABLE `interview_prep_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`role` varchar(255) NOT NULL,
	`category` varchar(255) NOT NULL,
	`question` text NOT NULL,
	`sampleAnswer` text,
	`difficulty` enum('easy','medium','hard') DEFAULT 'medium',
	`tags` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `interview_prep_questions_id` PRIMARY KEY(`id`)
);
