CREATE TABLE `candidate_interactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int,
	`applicationId` int,
	`interviewId` int,
	`interactionType` enum('email_opened','email_clicked','email_replied','calendar_link_clicked','interview_booked','interview_rescheduled','interview_cancelled','application_submitted','profile_viewed') NOT NULL,
	`emailCampaignId` int,
	`sourcingCampaignId` int,
	`linkUrl` varchar(500),
	`metadata` text,
	`userAgent` varchar(500),
	`ipAddress` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `candidate_interactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `candidate_interactions` ADD CONSTRAINT `candidate_interactions_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE no action ON UPDATE no action;