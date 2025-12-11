CREATE TABLE `fraudDetectionEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`interviewId` int NOT NULL,
	`candidateId` int NOT NULL,
	`eventType` enum('no_face_detected','multiple_faces_detected','tab_switch','window_blur','audio_anomaly','suspicious_behavior') NOT NULL,
	`severity` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`description` text,
	`metadata` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`questionId` int,
	CONSTRAINT `fraudDetectionEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `fraudDetectionEvents` ADD CONSTRAINT `fraudDetectionEvents_interviewId_interviews_id_fk` FOREIGN KEY (`interviewId`) REFERENCES `interviews`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fraudDetectionEvents` ADD CONSTRAINT `fraudDetectionEvents_candidateId_candidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fraudDetectionEvents` ADD CONSTRAINT `fraudDetectionEvents_questionId_interviewQuestions_id_fk` FOREIGN KEY (`questionId`) REFERENCES `interviewQuestions`(`id`) ON DELETE no action ON UPDATE no action;