CREATE TABLE `interviewQuestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`interviewId` int NOT NULL,
	`questionText` text NOT NULL,
	`questionType` enum('technical','behavioral','situational','experience') NOT NULL,
	`orderIndex` int NOT NULL,
	`expectedDuration` int DEFAULT 120,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `interviewQuestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `interviewResponses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`interviewId` int NOT NULL,
	`questionId` int NOT NULL,
	`candidateId` int NOT NULL,
	`audioUrl` text,
	`videoUrl` text,
	`transcription` text,
	`duration` int,
	`aiScore` int,
	`aiEvaluation` text,
	`strengths` text,
	`weaknesses` text,
	`recommendations` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `interviewResponses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `interviewQuestions` ADD CONSTRAINT `interviewQuestions_interviewId_interviews_id_fk` FOREIGN KEY (`interviewId`) REFERENCES `interviews`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interviewResponses` ADD CONSTRAINT `interviewResponses_interviewId_interviews_id_fk` FOREIGN KEY (`interviewId`) REFERENCES `interviews`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interviewResponses` ADD CONSTRAINT `interviewResponses_questionId_interviewQuestions_id_fk` FOREIGN KEY (`questionId`) REFERENCES `interviewQuestions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interviewResponses` ADD CONSTRAINT `interviewResponses_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE no action ON UPDATE no action;