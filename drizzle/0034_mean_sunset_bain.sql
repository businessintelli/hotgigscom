CREATE TABLE `interview_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`interviewId` int NOT NULL,
	`candidateId` int NOT NULL,
	`overallRating` int NOT NULL,
	`interviewerRating` int,
	`processRating` int,
	`communicationRating` int,
	`positiveAspects` text,
	`areasForImprovement` text,
	`additionalComments` text,
	`wouldRecommend` boolean,
	`isAnonymous` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `interview_feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `interview_feedback` ADD CONSTRAINT `interview_feedback_interviewId_interviews_id_fk` FOREIGN KEY (`interviewId`) REFERENCES `interviews`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interview_feedback` ADD CONSTRAINT `interview_feedback_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE no action ON UPDATE no action;