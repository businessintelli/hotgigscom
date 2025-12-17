CREATE TABLE `calendar_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`interviewId` int NOT NULL,
	`calendarIntegrationId` int NOT NULL,
	`externalEventId` varchar(255) NOT NULL,
	`provider` enum('google','microsoft','calendly','cal_com') NOT NULL,
	`title` varchar(500),
	`description` text,
	`location` varchar(500),
	`meetingUrl` varchar(500),
	`startTime` timestamp NOT NULL,
	`endTime` timestamp NOT NULL,
	`timezone` varchar(100) NOT NULL,
	`attendees` text,
	`organizerEmail` varchar(320),
	`syncStatus` enum('pending','synced','failed','cancelled') NOT NULL DEFAULT 'pending',
	`lastSyncAt` timestamp,
	`syncError` text,
	`bookingConfirmedAt` timestamp,
	`bookingCancelledAt` timestamp,
	`cancellationReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calendar_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calendar_integrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`provider` enum('google','microsoft','calendly','cal_com') NOT NULL,
	`providerAccountId` varchar(255),
	`providerEmail` varchar(320),
	`accessToken` text NOT NULL,
	`refreshToken` text,
	`tokenExpiry` timestamp,
	`defaultCalendarId` varchar(255),
	`calendarName` varchar(255),
	`timezone` varchar(100) NOT NULL DEFAULT 'UTC',
	`autoSync` boolean NOT NULL DEFAULT true,
	`syncDirection` enum('one-way','two-way') NOT NULL DEFAULT 'two-way',
	`lastSyncAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calendar_integrations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `linkedin_inmails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`linkedinProfileId` int NOT NULL,
	`candidateId` int,
	`recruiterId` int NOT NULL,
	`subject` varchar(500),
	`message` text,
	`linkedinConversationId` varchar(255),
	`sentAt` timestamp NOT NULL,
	`openedAt` timestamp,
	`repliedAt` timestamp,
	`replied` boolean NOT NULL DEFAULT false,
	`replyMessage` text,
	`sourcingCampaignId` int,
	`emailCampaignId` int,
	`inmailCreditsUsed` int DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `linkedin_inmails_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `linkedin_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int,
	`linkedinId` varchar(255) NOT NULL,
	`profileUrl` varchar(500),
	`publicIdentifier` varchar(255),
	`firstName` varchar(255),
	`lastName` varchar(255),
	`headline` text,
	`summary` text,
	`location` varchar(255),
	`industry` varchar(255),
	`currentCompany` varchar(255),
	`currentTitle` varchar(255),
	`profilePictureUrl` varchar(500),
	`connections` int,
	`followersCount` int,
	`fullProfileData` text,
	`importedBy` int NOT NULL,
	`sourcingCampaignId` int,
	`importSource` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `linkedin_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `linkedin_profiles_linkedinId_unique` UNIQUE(`linkedinId`)
);
--> statement-breakpoint
CREATE TABLE `scheduling_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recruiterId` int NOT NULL,
	`interviewId` int,
	`candidateId` int,
	`provider` enum('calendly','cal_com') NOT NULL,
	`schedulingUrl` varchar(500) NOT NULL,
	`externalLinkId` varchar(255),
	`eventType` varchar(255),
	`duration` int NOT NULL,
	`timezone` varchar(100),
	`availableSlots` text,
	`linkSentAt` timestamp,
	`linkClickedAt` timestamp,
	`bookedAt` timestamp,
	`bookingStatus` enum('pending','clicked','booked','cancelled','expired') NOT NULL DEFAULT 'pending',
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scheduling_links_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `calendar_events` ADD CONSTRAINT `calendar_events_interviewId_interviews_id_fk` FOREIGN KEY (`interviewId`) REFERENCES `interviews`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `calendar_events` ADD CONSTRAINT `calendar_events_calendarIntegrationId_calendar_integrations_id_fk` FOREIGN KEY (`calendarIntegrationId`) REFERENCES `calendar_integrations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `calendar_integrations` ADD CONSTRAINT `calendar_integrations_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `linkedin_inmails` ADD CONSTRAINT `linkedin_inmails_linkedinProfileId_linkedin_profiles_id_fk` FOREIGN KEY (`linkedinProfileId`) REFERENCES `linkedin_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `linkedin_inmails` ADD CONSTRAINT `linkedin_inmails_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `linkedin_inmails` ADD CONSTRAINT `linkedin_inmails_recruiterId_recruiters_id_fk` FOREIGN KEY (`recruiterId`) REFERENCES `recruiters`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `linkedin_inmails` ADD CONSTRAINT `linkedin_inmails_sourcingCampaignId_sourcing_campaigns_id_fk` FOREIGN KEY (`sourcingCampaignId`) REFERENCES `sourcing_campaigns`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `linkedin_profiles` ADD CONSTRAINT `linkedin_profiles_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `linkedin_profiles` ADD CONSTRAINT `linkedin_profiles_sourcingCampaignId_sourcing_campaigns_id_fk` FOREIGN KEY (`sourcingCampaignId`) REFERENCES `sourcing_campaigns`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scheduling_links` ADD CONSTRAINT `scheduling_links_recruiterId_recruiters_id_fk` FOREIGN KEY (`recruiterId`) REFERENCES `recruiters`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scheduling_links` ADD CONSTRAINT `scheduling_links_interviewId_interviews_id_fk` FOREIGN KEY (`interviewId`) REFERENCES `interviews`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scheduling_links` ADD CONSTRAINT `scheduling_links_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE no action ON UPDATE no action;