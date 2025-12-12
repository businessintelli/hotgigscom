ALTER TABLE `interviews` ADD `videoMeetingId` varchar(255);--> statement-breakpoint
ALTER TABLE `interviews` ADD `videoJoinUrl` text;--> statement-breakpoint
ALTER TABLE `interviews` ADD `videoStartUrl` text;--> statement-breakpoint
ALTER TABLE `interviews` ADD `videoPassword` varchar(255);--> statement-breakpoint
ALTER TABLE `interviews` ADD `videoProvider` enum('zoom','teams','none') DEFAULT 'none';