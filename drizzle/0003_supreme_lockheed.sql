CREATE TABLE `company_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`link` text,
	`startTime` timestamp NOT NULL,
	`endTime` timestamp NOT NULL,
	`isRecurring` boolean DEFAULT false,
	`recurringRule` varchar(128),
	`recurringUntil` date,
	`color` varchar(16) DEFAULT '#FFCB09',
	`targetType` enum('all','department','users') NOT NULL DEFAULT 'all',
	`targetDepartment` varchar(128),
	`targetUserIds` json DEFAULT ('[]'),
	`createdBy` int NOT NULL,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `company_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','angajat','colaborator') NOT NULL DEFAULT 'angajat';--> statement-breakpoint
ALTER TABLE `users` ADD `phoneMobile` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `birthDate` date;--> statement-breakpoint
ALTER TABLE `users` ADD `hireDate` date;--> statement-breakpoint
ALTER TABLE `users` ADD `addressBuletin` text;--> statement-breakpoint
ALTER TABLE `users` ADD `addressSecondary` text;--> statement-breakpoint
ALTER TABLE `users` ADD `city` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `cnp` varchar(13);--> statement-breakpoint
ALTER TABLE `users` ADD `ciSeries` varchar(4);--> statement-breakpoint
ALTER TABLE `users` ADD `ciNumber` varchar(10);--> statement-breakpoint
ALTER TABLE `users` ADD `ciExpiry` date;--> statement-breakpoint
ALTER TABLE `users` ADD `ciIssuedBy` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `iban` varchar(34);--> statement-breakpoint
ALTER TABLE `users` ADD `bankName` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `emergencyContact` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `emergencyPhone` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `emergencyRelation` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `bloodType` enum('A+','A-','B+','B-','AB+','AB-','O+','O-');--> statement-breakpoint
ALTER TABLE `users` ADD `allergies` text;--> statement-breakpoint
ALTER TABLE `users` ADD `profileNotes` text;