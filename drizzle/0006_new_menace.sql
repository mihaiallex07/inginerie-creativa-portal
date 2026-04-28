CREATE TABLE `gcal_sync_map` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`timeEntryId` int,
	`gcalEventId` varchar(256) NOT NULL,
	`direction` enum('gcal_to_portal','portal_to_gcal','both') NOT NULL DEFAULT 'both',
	`lastSyncedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gcal_sync_map_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `google_calendar_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`accessToken` text NOT NULL,
	`refreshToken` text,
	`expiresAt` timestamp,
	`scope` text,
	`calendarId` varchar(256) DEFAULT 'primary',
	`syncEnabled` boolean NOT NULL DEFAULT true,
	`lastSyncedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `google_calendar_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `google_calendar_tokens_userId_unique` UNIQUE(`userId`)
);
