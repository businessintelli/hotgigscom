CREATE TABLE `application_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`level` enum('debug','info','warn','error','critical') NOT NULL,
	`source` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`details` text,
	`userId` int,
	`requestId` varchar(64),
	`ipAddress` varchar(45),
	`userAgent` text,
	`stackTrace` text,
	`resolved` boolean NOT NULL DEFAULT false,
	`resolvedBy` int,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `application_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `environment_variables` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(255) NOT NULL,
	`currentValue` text NOT NULL,
	`previousValue` text,
	`description` varchar(500),
	`category` varchar(100),
	`isEditable` boolean NOT NULL DEFAULT true,
	`isSensitive` boolean NOT NULL DEFAULT false,
	`updatedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `environment_variables_id` PRIMARY KEY(`id`),
	CONSTRAINT `environment_variables_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
ALTER TABLE `application_logs` ADD CONSTRAINT `application_logs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `application_logs` ADD CONSTRAINT `application_logs_resolvedBy_users_id_fk` FOREIGN KEY (`resolvedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `environment_variables` ADD CONSTRAINT `environment_variables_updatedBy_users_id_fk` FOREIGN KEY (`updatedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;