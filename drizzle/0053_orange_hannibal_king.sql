CREATE TABLE `integration_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`provider` enum('slack','teams') NOT NULL,
	`webhookUrl` varchar(500) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`notificationTypes` json,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `integration_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_delivery_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`integrationId` int NOT NULL,
	`notificationType` varchar(100) NOT NULL,
	`status` enum('delivered','failed') NOT NULL,
	`errorMessage` text,
	`deliveryTime` int,
	`payload` text,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notification_delivery_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `integration_settings` ADD CONSTRAINT `integration_settings_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `integration_settings` ADD CONSTRAINT `integration_settings_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notification_delivery_logs` ADD CONSTRAINT `notification_delivery_logs_integrationId_integration_settings_id_fk` FOREIGN KEY (`integrationId`) REFERENCES `integration_settings`(`id`) ON DELETE cascade ON UPDATE no action;