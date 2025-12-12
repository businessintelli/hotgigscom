CREATE TABLE `emailDeliveryEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignRecipientId` int,
	`eventType` varchar(50) NOT NULL,
	`provider` varchar(20) NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`messageId` varchar(255),
	`email` varchar(255) NOT NULL,
	`reason` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailDeliveryEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailWebhookLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider` varchar(20) NOT NULL,
	`eventType` varchar(50),
	`payload` json NOT NULL,
	`signature` text,
	`verified` boolean DEFAULT false,
	`processed` boolean DEFAULT false,
	`error` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailWebhookLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_email` ON `emailDeliveryEvents` (`email`);--> statement-breakpoint
CREATE INDEX `idx_event_type` ON `emailDeliveryEvents` (`eventType`);--> statement-breakpoint
CREATE INDEX `idx_provider` ON `emailDeliveryEvents` (`provider`);--> statement-breakpoint
CREATE INDEX `idx_timestamp` ON `emailDeliveryEvents` (`timestamp`);--> statement-breakpoint
CREATE INDEX `idx_provider` ON `emailWebhookLogs` (`provider`);--> statement-breakpoint
CREATE INDEX `idx_created` ON `emailWebhookLogs` (`createdAt`);