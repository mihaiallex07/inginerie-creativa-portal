CREATE TYPE "public"."activity_type" AS ENUM('proiectare', 'consultanta', 'sedinta', 'documentare', 'deplasare', 'administrativ', 'verificare', 'executie');--> statement-breakpoint
CREATE TYPE "public"."blood_type" AS ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');--> statement-breakpoint
CREATE TYPE "public"."document_action" AS ENUM('view', 'download', 'upload', 'delete', 'update');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('contract', 'fisa_post', 'evaluare', 'certificat', 'salariu', 'concediu', 'medical', 'alt');--> statement-breakpoint
CREATE TYPE "public"."gcal_direction" AS ENUM('gcal_to_portal', 'portal_to_gcal', 'both');--> statement-breakpoint
CREATE TYPE "public"."hour_request_status" AS ENUM('in_asteptare', 'aprobata', 'respinsa');--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'declined');--> statement-breakpoint
CREATE TYPE "public"."leave_status" AS ENUM('in_asteptare', 'aprobata', 'respinsa', 'anulata');--> statement-breakpoint
CREATE TYPE "public"."leave_type" AS ENUM('concediu_odihna', 'concediu_medical', 'concediu_fara_plata', 'liber_legal', 'recuperare', 'alt');--> statement-breakpoint
CREATE TYPE "public"."news_category" AS ENUM('companie', 'proiecte', 'hr', 'it', 'evenimente', 'realizari');--> statement-breakpoint
CREATE TYPE "public"."phase_status" AS ENUM('activa', 'suspendata', 'finalizata');--> statement-breakpoint
CREATE TYPE "public"."pontaj_type" AS ENUM('bucuresti', 'cluj', 'miercurea_ciuc', 'brasov', 'eveniment', 'deplasare', 'vizita_santier', 'telemunca', 'concediu', 'medical', 'liber_legal', 'absent', 'recuperare');--> statement-breakpoint
CREATE TYPE "public"."process_category" AS ENUM('proiectare', 'management', 'financiar', 'hr', 'it', 'achizitii', 'comunicare', 'alt');--> statement-breakpoint
CREATE TYPE "public"."process_status" AS ENUM('activ', 'in_revizuire', 'arhivat');--> statement-breakpoint
CREATE TYPE "public"."project_role" AS ENUM('coordonator', 'membru', 'consultant');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('activ', 'suspendat', 'finalizat', 'intern');--> statement-breakpoint
CREATE TYPE "public"."proposal_status" AS ENUM('deschisa', 'in_evaluare', 'acceptata', 'amanata', 'respinsa');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'coordonator', 'angajat', 'colaborator');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('activa', 'in_pauza', 'finalizata');--> statement-breakpoint
CREATE TYPE "public"."target_type" AS ENUM('all', 'department', 'users');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('neinceputa', 'in_lucru', 'in_pauza', 'finalizata', 'blocata');--> statement-breakpoint
CREATE TYPE "public"."time_entry_status" AS ENUM('draft', 'salvat', 'aprobat', 'blocat');--> statement-breakpoint
CREATE TABLE "activity_invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"timeEntryId" integer NOT NULL,
	"hostUserId" integer NOT NULL,
	"inviteeUserId" integer NOT NULL,
	"status" "invitation_status" DEFAULT 'pending' NOT NULL,
	"inviteeEntryId" integer,
	"notifiedAt" timestamp,
	"respondedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(128) NOT NULL,
	"value" text,
	"updatedBy" integer,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "app_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "company_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(256) NOT NULL,
	"description" text,
	"link" text,
	"startTime" timestamp NOT NULL,
	"endTime" timestamp NOT NULL,
	"isRecurring" boolean DEFAULT false,
	"recurringRule" varchar(128),
	"recurringUntil" date,
	"color" varchar(16) DEFAULT '#FFCB09',
	"targetType" "target_type" DEFAULT 'all' NOT NULL,
	"targetDepartment" varchar(128),
	"targetUserIds" json DEFAULT '[]'::json,
	"activityType" "activity_type",
	"projectId" integer,
	"createdBy" integer NOT NULL,
	"isActive" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"documentId" integer NOT NULL,
	"userId" integer NOT NULL,
	"action" "document_action" NOT NULL,
	"ipAddress" varchar(64),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"uploadedBy" integer NOT NULL,
	"type" "document_type" DEFAULT 'alt' NOT NULL,
	"title" varchar(512) NOT NULL,
	"description" text,
	"fileUrl" text,
	"fileKey" varchar(512),
	"mimeType" varchar(128),
	"fileSize" integer,
	"isConfidential" boolean DEFAULT true,
	"year" integer,
	"month" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drive_file_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"fileId" varchar(256) NOT NULL,
	"fileName" varchar(512) NOT NULL,
	"folderId" varchar(256) NOT NULL,
	"folderType" varchar(32) DEFAULT 'company' NOT NULL,
	"ownerUserId" integer,
	"subfolderName" varchar(256),
	"modifiedTime" varchar(64),
	"size" varchar(32),
	"mimeType" varchar(128),
	"deletedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_drive_folders" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"folderId" varchar(256) NOT NULL,
	"folderName" varchar(256) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "employee_drive_folders_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "gcal_sync_map" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"timeEntryId" integer,
	"gcalEventId" varchar(256) NOT NULL,
	"direction" "gcal_direction" DEFAULT 'both' NOT NULL,
	"lastSyncedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "google_calendar_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"accessToken" text NOT NULL,
	"refreshToken" text,
	"expiresAt" timestamp,
	"scope" text,
	"calendarId" varchar(256) DEFAULT 'primary',
	"syncEnabled" boolean DEFAULT true NOT NULL,
	"lastSyncedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "google_calendar_tokens_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "hour_bank" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"date" date NOT NULL,
	"minutesWorked" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leave_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"type" "leave_type" DEFAULT 'concediu_odihna' NOT NULL,
	"startDate" date NOT NULL,
	"endDate" date NOT NULL,
	"totalDays" integer NOT NULL,
	"reason" text,
	"status" "leave_status" DEFAULT 'in_asteptare' NOT NULL,
	"reviewedBy" integer,
	"reviewNote" text,
	"reviewedAt" timestamp,
	"substituteUserId" integer,
	"attachmentUrl" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(512) NOT NULL,
	"content" text NOT NULL,
	"excerpt" text,
	"category" "news_category" DEFAULT 'companie' NOT NULL,
	"tags" json DEFAULT '[]'::json,
	"authorId" integer NOT NULL,
	"isPinned" boolean DEFAULT false,
	"isImportant" boolean DEFAULT false,
	"imageUrl" text,
	"publishedAt" timestamp DEFAULT now(),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"newsId" integer NOT NULL,
	"userId" integer NOT NULL,
	"content" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news_reactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"newsId" integer NOT NULL,
	"userId" integer NOT NULL,
	"reaction" varchar(16) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"type" varchar(64) NOT NULL,
	"title" varchar(256) NOT NULL,
	"message" text,
	"link" varchar(512),
	"isRead" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pontaj" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"date" date NOT NULL,
	"checkIn" timestamp,
	"checkOut" timestamp,
	"breakMinutes" integer DEFAULT 0,
	"totalMinutes" integer DEFAULT 0,
	"type" "pontaj_type" DEFAULT 'bucuresti' NOT NULL,
	"projectId" integer,
	"notes" text,
	"isApproved" boolean DEFAULT false,
	"approvedBy" integer,
	"correctionRequested" boolean DEFAULT false,
	"correctionNote" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "process_read_confirmations" (
	"id" serial PRIMARY KEY NOT NULL,
	"processId" integer NOT NULL,
	"userId" integer NOT NULL,
	"confirmedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "processes" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(512) NOT NULL,
	"code" varchar(64),
	"department" varchar(128) NOT NULL,
	"category" "process_category" DEFAULT 'alt' NOT NULL,
	"version" varchar(32) DEFAULT '1.0',
	"ownerId" integer,
	"content" text,
	"status" "process_status" DEFAULT 'activ' NOT NULL,
	"isMandatoryRead" boolean DEFAULT false,
	"targetRoles" json DEFAULT '[]'::json,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"projectId" integer NOT NULL,
	"userId" integer NOT NULL,
	"phaseId" integer,
	"projectRole" "project_role" DEFAULT 'membru' NOT NULL,
	"joinedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_phases" (
	"id" serial PRIMARY KEY NOT NULL,
	"projectId" integer NOT NULL,
	"name" varchar(256) NOT NULL,
	"code" varchar(16),
	"displayOrder" integer DEFAULT 0 NOT NULL,
	"budgetHours" numeric(8, 2) DEFAULT '0' NOT NULL,
	"color" varchar(16) DEFAULT '#FFCB09',
	"status" "phase_status" DEFAULT 'activa' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"phaseId" integer NOT NULL,
	"projectId" integer NOT NULL,
	"name" varchar(256) NOT NULL,
	"description" text,
	"displayOrder" integer DEFAULT 0 NOT NULL,
	"budgetHours" numeric(8, 2) DEFAULT '0' NOT NULL,
	"minutesWorked" integer DEFAULT 0 NOT NULL,
	"status" "task_status" DEFAULT 'neinceputa' NOT NULL,
	"assignedUserId" integer,
	"alertSent25" boolean DEFAULT false NOT NULL,
	"alertSent50" boolean DEFAULT false NOT NULL,
	"alertSent75" boolean DEFAULT false NOT NULL,
	"alertSent90" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"description" text,
	"isDefault" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"code" varchar(64),
	"clientName" varchar(256),
	"status" "project_status" DEFAULT 'activ' NOT NULL,
	"isGeneral" boolean DEFAULT false NOT NULL,
	"managerId" integer,
	"startDate" date,
	"endDate" date,
	"description" text,
	"color" varchar(16) DEFAULT '#FFCB09',
	"abbreviation" varchar(16),
	"emoji" varchar(8),
	"driveId" varchar(128),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposal_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"proposalId" integer NOT NULL,
	"userId" integer NOT NULL,
	"content" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposal_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"proposalId" integer NOT NULL,
	"userId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposals" (
	"id" serial PRIMARY KEY NOT NULL,
	"referenceNumber" varchar(32) NOT NULL,
	"title" varchar(512) NOT NULL,
	"description" text NOT NULL,
	"benefits" text,
	"departments" json DEFAULT '[]'::json,
	"authorId" integer NOT NULL,
	"isAnonymous" boolean DEFAULT false,
	"status" "proposal_status" DEFAULT 'deschisa' NOT NULL,
	"managerId" integer,
	"managerDecision" text,
	"committeeDecision" text,
	"votesCount" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "proposals_referenceNumber_unique" UNIQUE("referenceNumber")
);
--> statement-breakpoint
CREATE TABLE "recurring_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"taskName" varchar(256) NOT NULL,
	"activityType" "activity_type" DEFAULT 'administrativ' NOT NULL,
	"projectId" integer,
	"startHour" integer NOT NULL,
	"startMin" integer DEFAULT 0 NOT NULL,
	"durationMinutes" integer NOT NULL,
	"countInTime" boolean DEFAULT true NOT NULL,
	"startDate" date NOT NULL,
	"endDate" date,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recurring_exceptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"recurringId" integer NOT NULL,
	"userId" integer NOT NULL,
	"exceptionDate" date NOT NULL,
	"overrideStartHour" integer,
	"overrideStartMin" integer,
	"overrideDuration" integer,
	"isDeleted" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_hour_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"taskId" integer NOT NULL,
	"projectId" integer NOT NULL,
	"userId" integer NOT NULL,
	"requestedHours" numeric(6, 2) NOT NULL,
	"justification" text NOT NULL,
	"status" "hour_request_status" DEFAULT 'in_asteptare' NOT NULL,
	"reviewedBy" integer,
	"reviewNote" text,
	"reviewedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"taskId" integer NOT NULL,
	"projectId" integer NOT NULL,
	"userId" integer NOT NULL,
	"startedAt" timestamp DEFAULT now() NOT NULL,
	"pausedAt" timestamp,
	"resumedAt" timestamp,
	"endedAt" timestamp,
	"totalMinutes" integer DEFAULT 0 NOT NULL,
	"status" "session_status" DEFAULT 'activa' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "template_phases" (
	"id" serial PRIMARY KEY NOT NULL,
	"templateId" integer NOT NULL,
	"name" varchar(256) NOT NULL,
	"code" varchar(16),
	"displayOrder" integer DEFAULT 0 NOT NULL,
	"color" varchar(16) DEFAULT '#FFCB09'
);
--> statement-breakpoint
CREATE TABLE "template_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"templatePhaseId" integer NOT NULL,
	"name" varchar(256) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "time_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"projectId" integer,
	"date" date NOT NULL,
	"startTime" timestamp,
	"endTime" timestamp,
	"startHour" integer,
	"startMin" integer,
	"endHour" integer,
	"endMin" integer,
	"durationMinutes" integer DEFAULT 0,
	"activityType" "activity_type" DEFAULT 'proiectare' NOT NULL,
	"taskName" varchar(256),
	"description" text,
	"isBillable" boolean DEFAULT true,
	"isRunning" boolean DEFAULT false,
	"status" time_entry_status DEFAULT 'salvat' NOT NULL,
	"approvedBy" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'angajat' NOT NULL,
	"department" varchar(128),
	"jobTitle" varchar(128),
	"avatarUrl" text,
	"phone" varchar(32),
	"phoneMobile" varchar(32),
	"isActive" boolean DEFAULT true NOT NULL,
	"workHoursPerDay" numeric(4, 2) DEFAULT '8.00',
	"birthDate" date,
	"hireDate" date,
	"addressBuletin" text,
	"addressSecondary" text,
	"city" varchar(128),
	"cnp" varchar(13),
	"ciSeries" varchar(4),
	"ciNumber" varchar(10),
	"ciExpiry" date,
	"ciIssuedBy" varchar(128),
	"iban" varchar(34),
	"bankName" varchar(128),
	"emergencyContact" varchar(128),
	"emergencyPhone" varchar(32),
	"emergencyRelation" varchar(64),
	"bloodType" "blood_type",
	"allergies" text,
	"profileNotes" text,
	"displayOrder" integer DEFAULT 999,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
