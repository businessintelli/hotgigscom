ALTER TABLE `candidates` ADD `availability` varchar(50);--> statement-breakpoint
ALTER TABLE `candidates` ADD `visaStatus` varchar(100);--> statement-breakpoint
ALTER TABLE `candidates` ADD `expectedSalaryMin` int;--> statement-breakpoint
ALTER TABLE `candidates` ADD `expectedSalaryMax` int;--> statement-breakpoint
ALTER TABLE `candidates` ADD `noticePeriod` varchar(50);--> statement-breakpoint
ALTER TABLE `candidates` ADD `willingToRelocate` boolean DEFAULT false;