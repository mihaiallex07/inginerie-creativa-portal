CREATE TABLE `project_budget_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`category` enum('proiectare','consultanta','sedinta','documentare','deplasare','administrativ','verificare','executie') NOT NULL,
	`description` text,
	`budgetedHours` decimal(8,2) NOT NULL,
	`assignedUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_budget_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`projectRole` enum('coordonator','membru','consultant') NOT NULL DEFAULT 'membru',
	`allocatedHours` decimal(8,2),
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','coordonator','angajat','colaborator') NOT NULL DEFAULT 'angajat';--> statement-breakpoint
ALTER TABLE `projects` ADD `abbreviation` varchar(32);--> statement-breakpoint
ALTER TABLE `projects` ADD `coordinatorId` int;--> statement-breakpoint
ALTER TABLE `projects` ADD `startDate` date;--> statement-breakpoint
ALTER TABLE `projects` ADD `endDate` date;--> statement-breakpoint
ALTER TABLE `time_entries` ADD `startHour` int;--> statement-breakpoint
ALTER TABLE `time_entries` ADD `startMin` int;--> statement-breakpoint
ALTER TABLE `time_entries` ADD `endHour` int;--> statement-breakpoint
ALTER TABLE `time_entries` ADD `endMin` int;--> statement-breakpoint
ALTER TABLE `users` ADD `displayOrder` int DEFAULT 999;