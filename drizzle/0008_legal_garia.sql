CREATE TABLE `activity_invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`timeEntryId` int NOT NULL,
	`hostUserId` int NOT NULL,
	`inviteeUserId` int NOT NULL,
	`status` enum('pending','accepted','declined') NOT NULL DEFAULT 'pending',
	`inviteeEntryId` int,
	`notifiedAt` timestamp,
	`respondedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `activity_invitations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recurring_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`taskName` varchar(256) NOT NULL,
	`activityType` enum('proiectare','consultanta','sedinta','documentare','deplasare','administrativ','verificare','executie') NOT NULL DEFAULT 'administrativ',
	`projectId` int,
	`startHour` int NOT NULL,
	`startMin` int NOT NULL DEFAULT 0,
	`durationMinutes` int NOT NULL,
	`countInTime` boolean NOT NULL DEFAULT true,
	`startDate` date NOT NULL,
	`endDate` date,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recurring_activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recurring_exceptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recurringId` int NOT NULL,
	`userId` int NOT NULL,
	`exceptionDate` date NOT NULL,
	`overrideStartHour` int,
	`overrideStartMin` int,
	`overrideDuration` int,
	`isDeleted` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recurring_exceptions_id` PRIMARY KEY(`id`)
);
