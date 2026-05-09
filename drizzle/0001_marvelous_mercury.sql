CREATE TABLE `document_audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`userId` int NOT NULL,
	`action` enum('view','download','upload','delete','update') NOT NULL,
	`ipAddress` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `document_audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`uploadedBy` int NOT NULL,
	`type` enum('contract','fisa_post','evaluare','certificat','salariu','concediu','medical','alt') NOT NULL DEFAULT 'alt',
	`title` varchar(512) NOT NULL,
	`description` text,
	`fileUrl` text,
	`fileKey` varchar(512),
	`mimeType` varchar(128),
	`fileSize` int,
	`isConfidential` boolean DEFAULT true,
	`year` int,
	`month` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `news` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(512) NOT NULL,
	`content` text NOT NULL,
	`excerpt` text,
	`category` enum('companie','proiecte','hr','it','evenimente','realizari') NOT NULL DEFAULT 'companie',
	`tags` json DEFAULT ('[]'),
	`authorId` int NOT NULL,
	`isPinned` boolean DEFAULT false,
	`isImportant` boolean DEFAULT false,
	`imageUrl` text,
	`publishedAt` timestamp DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `news_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `news_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`newsId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `news_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `news_reactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`newsId` int NOT NULL,
	`userId` int NOT NULL,
	`reaction` varchar(16) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `news_reactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` varchar(64) NOT NULL,
	`title` varchar(256) NOT NULL,
	`message` text,
	`link` varchar(512),
	`isRead` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pontaj` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` date NOT NULL,
	`checkIn` timestamp,
	`checkOut` timestamp,
	`breakMinutes` int DEFAULT 0,
	`totalMinutes` int DEFAULT 0,
	`type` enum('birou','remote','deplasare','concediu','medical','liber_legal','absent','recuperare') NOT NULL DEFAULT 'birou',
	`notes` text,
	`isApproved` boolean DEFAULT false,
	`approvedBy` int,
	`correctionRequested` boolean DEFAULT false,
	`correctionNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pontaj_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `process_read_confirmations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`processId` int NOT NULL,
	`userId` int NOT NULL,
	`confirmedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `process_read_confirmations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `processes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(512) NOT NULL,
	`code` varchar(64),
	`department` varchar(128) NOT NULL,
	`category` enum('proiectare','management','financiar','hr','it','achizitii','comunicare','alt') NOT NULL DEFAULT 'alt',
	`version` varchar(32) DEFAULT '1.0',
	`ownerId` int,
	`content` text,
	`status` enum('activ','in_revizuire','arhivat') NOT NULL DEFAULT 'activ',
	`isMandatoryRead` boolean DEFAULT false,
	`targetRoles` json DEFAULT ('[]'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `processes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`code` varchar(64),
	`driveId` varchar(128),
	`drivePath` text,
	`status` enum('activ','suspendat','finalizat','intern') NOT NULL DEFAULT 'activ',
	`clientName` varchar(256),
	`estimatedHours` decimal(8,2),
	`managerId` int,
	`description` text,
	`color` varchar(16) DEFAULT '#FFCB09',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `proposal_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`proposalId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `proposal_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `proposal_votes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`proposalId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `proposal_votes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `proposals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referenceNumber` varchar(32) NOT NULL,
	`title` varchar(512) NOT NULL,
	`description` text NOT NULL,
	`benefits` text,
	`departments` json DEFAULT ('[]'),
	`authorId` int NOT NULL,
	`isAnonymous` boolean DEFAULT false,
	`status` enum('deschisa','in_evaluare','acceptata','amanata','respinsa') NOT NULL DEFAULT 'deschisa',
	`managerId` int,
	`managerDecision` text,
	`committeeDecision` text,
	`votesCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `proposals_id` PRIMARY KEY(`id`),
	CONSTRAINT `proposals_referenceNumber_unique` UNIQUE(`referenceNumber`)
);
--> statement-breakpoint
CREATE TABLE `time_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int,
	`date` date NOT NULL,
	`startTime` timestamp,
	`endTime` timestamp,
	`durationMinutes` int DEFAULT 0,
	`activityType` enum('proiectare','consultanta','sedinta','documentare','deplasare','administrativ','verificare','executie') NOT NULL DEFAULT 'proiectare',
	`taskName` varchar(256),
	`description` text,
	`isBillable` boolean DEFAULT true,
	`isRunning` boolean DEFAULT false,
	`status` enum('draft','salvat','aprobat','blocat') NOT NULL DEFAULT 'salvat',
	`approvedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `time_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('super_admin','admin_hr','manager','angajat','colaborator') NOT NULL DEFAULT 'angajat';--> statement-breakpoint
ALTER TABLE `users` ADD `department` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `jobTitle` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `workHoursPerDay` decimal(4,2) DEFAULT '8.00';