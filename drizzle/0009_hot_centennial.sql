CREATE TABLE `codingChallenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`interviewId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`language` enum('python','javascript','java','cpp') NOT NULL,
	`starterCode` text,
	`testCases` text,
	`difficulty` enum('easy','medium','hard') NOT NULL,
	`timeLimit` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `codingChallenges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `codingSubmissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`challengeId` int NOT NULL,
	`candidateId` int NOT NULL,
	`code` text NOT NULL,
	`language` varchar(50) NOT NULL,
	`status` enum('pending','running','passed','failed','error') NOT NULL DEFAULT 'pending',
	`testResults` text,
	`executionTime` int,
	`score` int,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `codingSubmissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `codingChallenges` ADD CONSTRAINT `codingChallenges_interviewId_interviews_id_fk` FOREIGN KEY (`interviewId`) REFERENCES `interviews`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `codingSubmissions` ADD CONSTRAINT `codingSubmissions_challengeId_codingChallenges_id_fk` FOREIGN KEY (`challengeId`) REFERENCES `codingChallenges`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `codingSubmissions` ADD CONSTRAINT `codingSubmissions_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE no action ON UPDATE no action;