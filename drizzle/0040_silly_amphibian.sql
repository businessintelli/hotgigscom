ALTER TABLE `candidates` ADD `currentSalary` int;--> statement-breakpoint
ALTER TABLE `candidates` ADD `currentHourlyRate` int;--> statement-breakpoint
ALTER TABLE `candidates` ADD `expectedSalary` int;--> statement-breakpoint
ALTER TABLE `candidates` ADD `expectedHourlyRate` int;--> statement-breakpoint
ALTER TABLE `candidates` ADD `salaryType` enum('salary','hourly');