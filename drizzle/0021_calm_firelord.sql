CREATE TABLE `resumeProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`profileName` varchar(255) NOT NULL,
	`resumeUrl` varchar(500) NOT NULL,
	`resumeFileKey` varchar(500) NOT NULL,
	`resumeFilename` varchar(255) NOT NULL,
	`parsedData` text,
	`isDefault` boolean NOT NULL DEFAULT false,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resumeProfiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `videoIntroductions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`videoUrl` varchar(500) NOT NULL,
	`videoFileKey` varchar(500) NOT NULL,
	`thumbnailUrl` varchar(500),
	`duration` int NOT NULL,
	`fileSize` int,
	`mimeType` varchar(100),
	`transcription` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `videoIntroductions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `applications` ADD `resumeProfileId` int;--> statement-breakpoint
ALTER TABLE `applications` ADD `videoIntroductionId` int;--> statement-breakpoint
ALTER TABLE `resumeProfiles` ADD CONSTRAINT `resumeProfiles_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `videoIntroductions` ADD CONSTRAINT `videoIntroductions_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `applications` ADD CONSTRAINT `applications_resumeProfileId_resumeProfiles_id_fk` FOREIGN KEY (`resumeProfileId`) REFERENCES `resumeProfiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `applications` ADD CONSTRAINT `applications_videoIntroductionId_videoIntroductions_id_fk` FOREIGN KEY (`videoIntroductionId`) REFERENCES `videoIntroductions`(`id`) ON DELETE no action ON UPDATE no action;