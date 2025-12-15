ALTER TABLE `resumeProfiles` ADD `domainMatchScore` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `resumeProfiles` ADD `skillMatchScore` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `resumeProfiles` ADD `experienceScore` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `resumeProfiles` ADD `overallScore` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `resumeProfiles` ADD `primaryDomain` varchar(100);--> statement-breakpoint
ALTER TABLE `resumeProfiles` ADD `totalExperienceYears` int DEFAULT 0;