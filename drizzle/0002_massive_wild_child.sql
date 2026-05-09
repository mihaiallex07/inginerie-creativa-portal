CREATE TABLE `leave_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('concediu_odihna','concediu_medical','concediu_fara_plata','liber_legal','recuperare','alt') NOT NULL DEFAULT 'concediu_odihna',
	`startDate` date NOT NULL,
	`endDate` date NOT NULL,
	`totalDays` int NOT NULL,
	`reason` text,
	`status` enum('in_asteptare','aprobata','respinsa','anulata') NOT NULL DEFAULT 'in_asteptare',
	`reviewedBy` int,
	`reviewNote` text,
	`reviewedAt` timestamp,
	`substituteUserId` int,
	`attachmentUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leave_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `pontaj` MODIFY COLUMN `type` enum('bucuresti','cluj','miercurea_ciuc','brasov','eveniment','deplasare','vizita_santier','telemunca','concediu','medical','liber_legal','absent','recuperare') NOT NULL DEFAULT 'bucuresti';--> statement-breakpoint
ALTER TABLE `pontaj` ADD `projectId` int;