ALTER TABLE `candidates` ADD `parsedResumeData` text;--> statement-breakpoint
ALTER TABLE `candidates` ADD `linkedinUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `candidates` ADD `githubUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `candidates` ADD `certifications` text;--> statement-breakpoint
ALTER TABLE `candidates` ADD `languages` text;--> statement-breakpoint
ALTER TABLE `candidates` ADD `projects` text;--> statement-breakpoint
ALTER TABLE `candidates` ADD `totalExperienceYears` int;--> statement-breakpoint
ALTER TABLE `candidates` ADD `seniorityLevel` varchar(50);--> statement-breakpoint
ALTER TABLE `candidates` ADD `primaryDomain` varchar(100);--> statement-breakpoint
ALTER TABLE `candidates` ADD `skillCategories` text;