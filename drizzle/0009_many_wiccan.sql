CREATE TABLE `employee_drive_folders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`folderId` varchar(256) NOT NULL,
	`folderName` varchar(256) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employee_drive_folders_id` PRIMARY KEY(`id`),
	CONSTRAINT `employee_drive_folders_userId_unique` UNIQUE(`userId`)
);
