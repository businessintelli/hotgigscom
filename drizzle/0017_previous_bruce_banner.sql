CREATE TABLE `emailUnsubscribes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`trackingId` varchar(100),
	`reason` text,
	`unsubscribedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailUnsubscribes_id` PRIMARY KEY(`id`),
	CONSTRAINT `emailUnsubscribes_email_unique` UNIQUE(`email`)
);
