CREATE TABLE `assessmentAnswers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`attemptId` int NOT NULL,
	`questionId` int NOT NULL,
	`answer` text NOT NULL,
	`isCorrect` boolean,
	`pointsEarned` int,
	CONSTRAINT `assessmentAnswers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assessmentAttempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`candidateId` int NOT NULL,
	`applicationId` int,
	`score` int,
	`totalPoints` int,
	`earnedPoints` int,
	`passed` boolean,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`timeSpent` int,
	CONSTRAINT `assessmentAttempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assessmentQuestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`questionText` text NOT NULL,
	`questionType` enum('multiple_choice','true_false','short_answer') NOT NULL,
	`options` text,
	`correctAnswer` text NOT NULL,
	`points` int NOT NULL DEFAULT 1,
	`orderIndex` int NOT NULL,
	CONSTRAINT `assessmentQuestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `skillAssessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int,
	`title` varchar(255) NOT NULL,
	`description` text,
	`duration` int,
	`passingScore` int NOT NULL DEFAULT 70,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `skillAssessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `assessmentAnswers` ADD CONSTRAINT `assessmentAnswers_attemptId_assessmentAttempts_id_fk` FOREIGN KEY (`attemptId`) REFERENCES `assessmentAttempts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessmentAnswers` ADD CONSTRAINT `assessmentAnswers_questionId_assessmentQuestions_id_fk` FOREIGN KEY (`questionId`) REFERENCES `assessmentQuestions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessmentAttempts` ADD CONSTRAINT `assessmentAttempts_assessmentId_skillAssessments_id_fk` FOREIGN KEY (`assessmentId`) REFERENCES `skillAssessments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessmentAttempts` ADD CONSTRAINT `assessmentAttempts_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessmentAttempts` ADD CONSTRAINT `assessmentAttempts_applicationId_applications_id_fk` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessmentQuestions` ADD CONSTRAINT `assessmentQuestions_assessmentId_skillAssessments_id_fk` FOREIGN KEY (`assessmentId`) REFERENCES `skillAssessments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skillAssessments` ADD CONSTRAINT `skillAssessments_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skillAssessments` ADD CONSTRAINT `skillAssessments_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;