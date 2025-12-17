CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recruiterId` int NOT NULL,
	`candidateId` int NOT NULL,
	`applicationId` int,
	`jobId` int,
	`subject` varchar(255),
	`lastMessageAt` timestamp NOT NULL DEFAULT (now()),
	`isArchived` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messageAttachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileUrl` varchar(500) NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`fileSize` int NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messageAttachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messageTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recruiterId` int NOT NULL,
	`templateName` varchar(255) NOT NULL,
	`subject` varchar(255),
	`content` text NOT NULL,
	`category` varchar(100),
	`isPublic` boolean NOT NULL DEFAULT false,
	`usageCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `messageTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`senderId` int NOT NULL,
	`senderType` enum('recruiter','candidate') NOT NULL,
	`content` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `personalityQuestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`testId` int NOT NULL,
	`questionText` text NOT NULL,
	`trait` varchar(100) NOT NULL,
	`isReversed` boolean NOT NULL DEFAULT false,
	`order` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `personalityQuestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `personalityResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assignmentId` int NOT NULL,
	`candidateId` int NOT NULL,
	`testType` varchar(50) NOT NULL,
	`openness` int,
	`conscientiousness` int,
	`extraversion` int,
	`agreeableness` int,
	`neuroticism` int,
	`dominance` int,
	`influence` int,
	`steadiness` int,
	`compliance` int,
	`primaryTrait` varchar(100),
	`traitProfile` text,
	`interpretation` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `personalityResults_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `testAssignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`testId` int NOT NULL,
	`candidateId` int NOT NULL,
	`applicationId` int,
	`assignedBy` int NOT NULL,
	`status` enum('assigned','in-progress','completed','expired','cancelled') NOT NULL DEFAULT 'assigned',
	`dueDate` timestamp,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`score` int,
	`passed` boolean,
	`timeSpent` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `testAssignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `testLibrary` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recruiterId` int NOT NULL,
	`testName` varchar(255) NOT NULL,
	`testType` enum('coding','personality','domain-specific','aptitude','technical') NOT NULL,
	`category` varchar(100),
	`description` text,
	`duration` int NOT NULL,
	`passingScore` int NOT NULL,
	`difficulty` enum('easy','medium','hard','expert') NOT NULL,
	`isPublic` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `testLibrary_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `testQuestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`testId` int NOT NULL,
	`questionText` text NOT NULL,
	`questionType` enum('multiple-choice','coding','essay','true-false') NOT NULL,
	`options` text,
	`correctAnswer` text,
	`points` int NOT NULL DEFAULT 10,
	`starterCode` text,
	`testCases` text,
	`language` varchar(50),
	`timeLimit` int,
	`order` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `testQuestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `testResponses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assignmentId` int NOT NULL,
	`questionId` int NOT NULL,
	`candidateAnswer` text NOT NULL,
	`isCorrect` boolean,
	`pointsEarned` int NOT NULL DEFAULT 0,
	`codeOutput` text,
	`executionTime` int,
	`testCasesPassed` int,
	`testCasesTotal` int,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `testResponses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `typingIndicators` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`userId` int NOT NULL,
	`isTyping` boolean NOT NULL DEFAULT false,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `typingIndicators_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_recruiterId_recruiters_id_fk` FOREIGN KEY (`recruiterId`) REFERENCES `recruiters`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_applicationId_applications_id_fk` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messageAttachments` ADD CONSTRAINT `messageAttachments_messageId_messages_id_fk` FOREIGN KEY (`messageId`) REFERENCES `messages`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messageTemplates` ADD CONSTRAINT `messageTemplates_recruiterId_recruiters_id_fk` FOREIGN KEY (`recruiterId`) REFERENCES `recruiters`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_conversationId_conversations_id_fk` FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_senderId_users_id_fk` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `personalityQuestions` ADD CONSTRAINT `personalityQuestions_testId_testLibrary_id_fk` FOREIGN KEY (`testId`) REFERENCES `testLibrary`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `personalityResults` ADD CONSTRAINT `personalityResults_assignmentId_testAssignments_id_fk` FOREIGN KEY (`assignmentId`) REFERENCES `testAssignments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `personalityResults` ADD CONSTRAINT `personalityResults_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `testAssignments` ADD CONSTRAINT `testAssignments_testId_testLibrary_id_fk` FOREIGN KEY (`testId`) REFERENCES `testLibrary`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `testAssignments` ADD CONSTRAINT `testAssignments_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `testAssignments` ADD CONSTRAINT `testAssignments_applicationId_applications_id_fk` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `testAssignments` ADD CONSTRAINT `testAssignments_assignedBy_recruiters_id_fk` FOREIGN KEY (`assignedBy`) REFERENCES `recruiters`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `testLibrary` ADD CONSTRAINT `testLibrary_recruiterId_recruiters_id_fk` FOREIGN KEY (`recruiterId`) REFERENCES `recruiters`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `testQuestions` ADD CONSTRAINT `testQuestions_testId_testLibrary_id_fk` FOREIGN KEY (`testId`) REFERENCES `testLibrary`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `testResponses` ADD CONSTRAINT `testResponses_assignmentId_testAssignments_id_fk` FOREIGN KEY (`assignmentId`) REFERENCES `testAssignments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `testResponses` ADD CONSTRAINT `testResponses_questionId_testQuestions_id_fk` FOREIGN KEY (`questionId`) REFERENCES `testQuestions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `typingIndicators` ADD CONSTRAINT `typingIndicators_conversationId_conversations_id_fk` FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `typingIndicators` ADD CONSTRAINT `typingIndicators_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;