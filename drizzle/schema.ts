import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
  boolean,
  date,
  time,
  numeric,
  json,
  serial,
} from "drizzle-orm/pg-core";

// ─── ENUMS ───────────────────────────────────────────────────────────────────
export const roleEnum = pgEnum("role", ["admin", "coordonator", "angajat", "colaborator"]);
export const bloodTypeEnum = pgEnum("blood_type", ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]);
export const pontajTypeEnum = pgEnum("pontaj_type", ["bucuresti", "cluj", "miercurea_ciuc", "brasov", "eveniment", "deplasare", "vizita_santier", "telemunca", "concediu", "medical", "liber_legal", "absent", "recuperare"]);
export const projectStatusEnum = pgEnum("project_status", ["activ", "suspendat", "finalizat", "intern"]);
export const phaseStatusEnum = pgEnum("phase_status", ["activa", "suspendata", "finalizata"]);
export const taskStatusEnum = pgEnum("task_status", ["neinceputa", "in_lucru", "in_pauza", "finalizata", "blocata"]);
export const sessionStatusEnum = pgEnum("session_status", ["activa", "in_pauza", "finalizata"]);
export const hourRequestStatusEnum = pgEnum("hour_request_status", ["in_asteptare", "aprobata", "respinsa"]);
export const activityTypeEnum = pgEnum("activity_type", ["proiectare", "consultanta", "sedinta", "documentare", "deplasare", "administrativ", "verificare", "executie"]);
export const timeEntryStatusEnum = pgEnum("time_entry_status", ["draft", "salvat", "aprobat", "blocat"]);
export const newsCategoryEnum = pgEnum("news_category", ["companie", "proiecte", "hr", "it", "evenimente", "realizari"]);
export const documentTypeEnum = pgEnum("document_type", ["contract", "fisa_post", "evaluare", "certificat", "salariu", "concediu", "medical", "alt"]);
export const documentActionEnum = pgEnum("document_action", ["view", "download", "upload", "delete", "update"]);
export const processCategoryEnum = pgEnum("process_category", ["proiectare", "management", "financiar", "hr", "it", "achizitii", "comunicare", "alt"]);
export const processStatusEnum = pgEnum("process_status", ["activ", "in_revizuire", "arhivat"]);
export const proposalStatusEnum = pgEnum("proposal_status", ["deschisa", "in_evaluare", "acceptata", "amanata", "respinsa"]);
export const leaveTypeEnum = pgEnum("leave_type", ["concediu_odihna", "concediu_medical", "concediu_fara_plata", "liber_legal", "recuperare", "alt"]);
export const leaveStatusEnum = pgEnum("leave_status", ["in_asteptare", "aprobata", "respinsa", "anulata"]);
export const targetTypeEnum = pgEnum("target_type", ["all", "department", "users"]);
export const projectRoleEnum = pgEnum("project_role", ["coordonator", "membru", "consultant"]);
export const gcalDirectionEnum = pgEnum("gcal_direction", ["gcal_to_portal", "portal_to_gcal", "both"]);
export const invitationStatusEnum = pgEnum("invitation_status", ["pending", "accepted", "declined"]);

// ─── USERS ───────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("angajat").notNull(),
  department: varchar("department", { length: 128 }),
  jobTitle: varchar("jobTitle", { length: 128 }),
  avatarUrl: text("avatarUrl"),
  phone: varchar("phone", { length: 32 }),
  phoneMobile: varchar("phoneMobile", { length: 32 }),
  isActive: boolean("isActive").default(true).notNull(),
  workHoursPerDay: numeric("workHoursPerDay", { precision: 4, scale: 2 }).default("8.00"),
  // ── Profil personal ──
  birthDate: date("birthDate"),
  hireDate: date("hireDate"),
  // ── Adrese ──
  addressBuletin: text("addressBuletin"),
  addressSecondary: text("addressSecondary"),
  city: varchar("city", { length: 128 }),
  // ── Date CI (sensibile) ──
  cnp: varchar("cnp", { length: 13 }),
  ciSeries: varchar("ciSeries", { length: 4 }),
  ciNumber: varchar("ciNumber", { length: 10 }),
  ciExpiry: date("ciExpiry"),
  ciIssuedBy: varchar("ciIssuedBy", { length: 128 }),
  // ── Date financiare (sensibile) ──
  iban: varchar("iban", { length: 34 }),
  bankName: varchar("bankName", { length: 128 }),
  // ── Contact urgență ──
  emergencyContact: varchar("emergencyContact", { length: 128 }),
  emergencyPhone: varchar("emergencyPhone", { length: 32 }),
  emergencyRelation: varchar("emergencyRelation", { length: 64 }),
  // ── Medical ──
  bloodType: bloodTypeEnum("bloodType"),
  allergies: text("allergies"),
  // ── Note interne ──
  profileNotes: text("profileNotes"),
  displayOrder: integer("displayOrder").default(999),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── PONTAJ ──────────────────────────────────────────────────────────────────
export const pontaj = pgTable("pontaj", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  date: date("date").notNull(),
  checkIn: timestamp("checkIn"),
  checkOut: timestamp("checkOut"),
  breakMinutes: integer("breakMinutes").default(0),
  totalMinutes: integer("totalMinutes").default(0),
  type: pontajTypeEnum("type").default("bucuresti").notNull(),
  projectId: integer("projectId"),
  notes: text("notes"),
  isApproved: boolean("isApproved").default(false),
  approvedBy: integer("approvedBy"),
  correctionRequested: boolean("correctionRequested").default(false),
  correctionNote: text("correctionNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Pontaj = typeof pontaj.$inferSelect;
export type InsertPontaj = typeof pontaj.$inferInsert;

// ─── PROJECTS ────────────────────────────────────────────────────────────────
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  code: varchar("code", { length: 64 }),
  clientName: varchar("clientName", { length: 256 }),
  status: projectStatusEnum("status").default("activ").notNull(),
  isGeneral: boolean("isGeneral").default(false).notNull(),
  managerId: integer("managerId"),
  startDate: date("startDate"),
  endDate: date("endDate"),
  description: text("description"),
  color: varchar("color", { length: 16 }).default("#FFCB09"),
  abbreviation: varchar("abbreviation", { length: 16 }),
  emoji: varchar("emoji", { length: 8 }),
  driveId: varchar("driveId", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

// ─── PROJECT PHASES ──────────────────────────────────────────────────────────
export const projectPhases = pgTable("project_phases", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  code: varchar("code", { length: 16 }),
  displayOrder: integer("displayOrder").default(0).notNull(),
  budgetHours: numeric("budgetHours", { precision: 8, scale: 2 }).default("0").notNull(),
  color: varchar("color", { length: 16 }).default("#FFCB09"),
  status: phaseStatusEnum("status").default("activa").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ProjectPhase = typeof projectPhases.$inferSelect;
export type InsertProjectPhase = typeof projectPhases.$inferInsert;

// ─── PROJECT TASKS ───────────────────────────────────────────────────────────
export const projectTasks = pgTable("project_tasks", {
  id: serial("id").primaryKey(),
  phaseId: integer("phaseId").notNull(),
  projectId: integer("projectId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  displayOrder: integer("displayOrder").default(0).notNull(),
  budgetHours: numeric("budgetHours", { precision: 8, scale: 2 }).default("0").notNull(),
  minutesWorked: integer("minutesWorked").default(0).notNull(),
  status: taskStatusEnum("status").default("neinceputa").notNull(),
  assignedUserId: integer("assignedUserId"),
  alertSent25: boolean("alertSent25").default(false).notNull(),
  alertSent50: boolean("alertSent50").default(false).notNull(),
  alertSent75: boolean("alertSent75").default(false).notNull(),
  alertSent90: boolean("alertSent90").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ProjectTask = typeof projectTasks.$inferSelect;
export type InsertProjectTask = typeof projectTasks.$inferInsert;

// ─── TASK SESSIONS ───────────────────────────────────────────────────────────
export const taskSessions = pgTable("task_sessions", {
  id: serial("id").primaryKey(),
  taskId: integer("taskId").notNull(),
  projectId: integer("projectId").notNull(),
  userId: integer("userId").notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  pausedAt: timestamp("pausedAt"),
  resumedAt: timestamp("resumedAt"),
  endedAt: timestamp("endedAt"),
  totalMinutes: integer("totalMinutes").default(0).notNull(),
  status: sessionStatusEnum("status").default("activa").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type TaskSession = typeof taskSessions.$inferSelect;
export type InsertTaskSession = typeof taskSessions.$inferInsert;

// ─── HOUR BANK ───────────────────────────────────────────────────────────────
export const hourBank = pgTable("hour_bank", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  date: date("date").notNull(),
  minutesWorked: integer("minutesWorked").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type HourBank = typeof hourBank.$inferSelect;
export type InsertHourBank = typeof hourBank.$inferInsert;

// ─── TASK HOUR REQUESTS ──────────────────────────────────────────────────────
export const taskHourRequests = pgTable("task_hour_requests", {
  id: serial("id").primaryKey(),
  taskId: integer("taskId").notNull(),
  projectId: integer("projectId").notNull(),
  userId: integer("userId").notNull(),
  requestedHours: numeric("requestedHours", { precision: 6, scale: 2 }).notNull(),
  justification: text("justification").notNull(),
  status: hourRequestStatusEnum("status").default("in_asteptare").notNull(),
  reviewedBy: integer("reviewedBy"),
  reviewNote: text("reviewNote"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type TaskHourRequest = typeof taskHourRequests.$inferSelect;
export type InsertTaskHourRequest = typeof taskHourRequests.$inferInsert;

// ─── PROJECT TEMPLATES ───────────────────────────────────────────────────────
export const projectTemplates = pgTable("project_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  isDefault: boolean("isDefault").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProjectTemplate = typeof projectTemplates.$inferSelect;

export const templatePhases = pgTable("template_phases", {
  id: serial("id").primaryKey(),
  templateId: integer("templateId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  code: varchar("code", { length: 16 }),
  displayOrder: integer("displayOrder").default(0).notNull(),
  color: varchar("color", { length: 16 }).default("#FFCB09"),
});

export type TemplatePhase = typeof templatePhases.$inferSelect;

export const templateTasks = pgTable("template_tasks", {
  id: serial("id").primaryKey(),
  templatePhaseId: integer("templatePhaseId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
});

export type TemplateTask = typeof templateTasks.$inferSelect;

// ─── TIME TRACKING ───────────────────────────────────────────────────────────
export const timeEntries = pgTable("time_entries", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  projectId: integer("projectId"),
  date: date("date").notNull(),
  startTime: timestamp("startTime"),
  endTime: timestamp("endTime"),
  startHour: integer("startHour"),
  startMin: integer("startMin"),
  endHour: integer("endHour"),
  endMin: integer("endMin"),
  durationMinutes: integer("durationMinutes").default(0),
  activityType: activityTypeEnum("activityType").default("proiectare").notNull(),
  taskName: varchar("taskName", { length: 256 }),
  description: text("description"),
  isBillable: boolean("isBillable").default(true),
  isRunning: boolean("isRunning").default(false),
  status: timeEntryStatusEnum("status").default("salvat").notNull(),
  approvedBy: integer("approvedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type TimeEntry = typeof timeEntries.$inferSelect;
export type InsertTimeEntry = typeof timeEntries.$inferInsert;

// ─── NEWS ────────────────────────────────────────────────────────────────────
export const news = pgTable("news", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 512 }).notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  category: newsCategoryEnum("category").default("companie").notNull(),
  tags: json("tags").$type<string[]>().default([]),
  authorId: integer("authorId").notNull(),
  isPinned: boolean("isPinned").default(false),
  isImportant: boolean("isImportant").default(false),
  imageUrl: text("imageUrl"),
  publishedAt: timestamp("publishedAt").defaultNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type News = typeof news.$inferSelect;
export type InsertNews = typeof news.$inferInsert;

export const newsReactions = pgTable("news_reactions", {
  id: serial("id").primaryKey(),
  newsId: integer("newsId").notNull(),
  userId: integer("userId").notNull(),
  reaction: varchar("reaction", { length: 16 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const newsComments = pgTable("news_comments", {
  id: serial("id").primaryKey(),
  newsId: integer("newsId").notNull(),
  userId: integer("userId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// ─── DOCUMENTS ───────────────────────────────────────────────────────────────
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  uploadedBy: integer("uploadedBy").notNull(),
  type: documentTypeEnum("type").default("alt").notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  description: text("description"),
  fileUrl: text("fileUrl"),
  fileKey: varchar("fileKey", { length: 512 }),
  mimeType: varchar("mimeType", { length: 128 }),
  fileSize: integer("fileSize"),
  isConfidential: boolean("isConfidential").default(true),
  year: integer("year"),
  month: integer("month"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

export const documentAuditLog = pgTable("document_audit_log", {
  id: serial("id").primaryKey(),
  documentId: integer("documentId").notNull(),
  userId: integer("userId").notNull(),
  action: documentActionEnum("action").notNull(),
  ipAddress: varchar("ipAddress", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── PROCESSES ───────────────────────────────────────────────────────────────
export const processes = pgTable("processes", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 512 }).notNull(),
  code: varchar("code", { length: 64 }),
  department: varchar("department", { length: 128 }).notNull(),
  category: processCategoryEnum("category").default("alt").notNull(),
  version: varchar("version", { length: 32 }).default("1.0"),
  ownerId: integer("ownerId"),
  content: text("content"),
  status: processStatusEnum("status").default("activ").notNull(),
  isMandatoryRead: boolean("isMandatoryRead").default(false),
  targetRoles: json("targetRoles").$type<string[]>().default([]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Process = typeof processes.$inferSelect;
export type InsertProcess = typeof processes.$inferInsert;

export const processReadConfirmations = pgTable("process_read_confirmations", {
  id: serial("id").primaryKey(),
  processId: integer("processId").notNull(),
  userId: integer("userId").notNull(),
  confirmedAt: timestamp("confirmedAt").defaultNow().notNull(),
});

// ─── PROPOSALS ───────────────────────────────────────────────────────────────
export const proposals = pgTable("proposals", {
  id: serial("id").primaryKey(),
  referenceNumber: varchar("referenceNumber", { length: 32 }).notNull().unique(),
  title: varchar("title", { length: 512 }).notNull(),
  description: text("description").notNull(),
  benefits: text("benefits"),
  departments: json("departments").$type<string[]>().default([]),
  authorId: integer("authorId").notNull(),
  isAnonymous: boolean("isAnonymous").default(false),
  status: proposalStatusEnum("status").default("deschisa").notNull(),
  managerId: integer("managerId"),
  managerDecision: text("managerDecision"),
  committeeDecision: text("committeeDecision"),
  votesCount: integer("votesCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Proposal = typeof proposals.$inferSelect;
export type InsertProposal = typeof proposals.$inferInsert;

export const proposalVotes = pgTable("proposal_votes", {
  id: serial("id").primaryKey(),
  proposalId: integer("proposalId").notNull(),
  userId: integer("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const proposalComments = pgTable("proposal_comments", {
  id: serial("id").primaryKey(),
  proposalId: integer("proposalId").notNull(),
  userId: integer("userId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  type: varchar("type", { length: 64 }).notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  message: text("message"),
  link: varchar("link", { length: 512 }),
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;

// ─── LEAVE REQUESTS ──────────────────────────────────────────────────────────
export const leaveRequests = pgTable("leave_requests", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  type: leaveTypeEnum("type").default("concediu_odihna").notNull(),
  startDate: date("startDate").notNull(),
  endDate: date("endDate").notNull(),
  totalDays: integer("totalDays").notNull(),
  reason: text("reason"),
  status: leaveStatusEnum("status").default("in_asteptare").notNull(),
  reviewedBy: integer("reviewedBy"),
  reviewNote: text("reviewNote"),
  reviewedAt: timestamp("reviewedAt"),
  substituteUserId: integer("substituteUserId"),
  attachmentUrl: text("attachmentUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type InsertLeaveRequest = typeof leaveRequests.$inferInsert;

// ─── COMPANY EVENTS ──────────────────────────────────────────────────────────
export const companyEvents = pgTable("company_events", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  link: text("link"),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime").notNull(),
  isRecurring: boolean("isRecurring").default(false),
  recurringRule: varchar("recurringRule", { length: 128 }),
  recurringUntil: date("recurringUntil"),
  color: varchar("color", { length: 16 }).default("#FFCB09"),
  targetType: targetTypeEnum("targetType").default("all").notNull(),
  targetDepartment: varchar("targetDepartment", { length: 128 }),
  targetUserIds: json("targetUserIds").$type<number[]>().default([]),
  activityType: activityTypeEnum("activityType"),
  projectId: integer("projectId"),
  createdBy: integer("createdBy").notNull(),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type CompanyEvent = typeof companyEvents.$inferSelect;
export type InsertCompanyEvent = typeof companyEvents.$inferInsert;

// ─── PROJECT MEMBERS ─────────────────────────────────────────────────────────
export const projectMembers = pgTable("project_members", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull(),
  userId: integer("userId").notNull(),
  phaseId: integer("phaseId"),
  projectRole: projectRoleEnum("projectRole").default("membru").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type ProjectMember = typeof projectMembers.$inferSelect;
export type InsertProjectMember = typeof projectMembers.$inferInsert;

// ─── APP SETTINGS ────────────────────────────────────────────────────────────
export const appSettings = pgTable("app_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 128 }).notNull().unique(),
  value: text("value"),
  updatedBy: integer("updatedBy"),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type AppSetting = typeof appSettings.$inferSelect;

// ─── GOOGLE CALENDAR TOKENS ──────────────────────────────────────────────────
export const googleCalendarTokens = pgTable("google_calendar_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  accessToken: text("accessToken").notNull(),
  refreshToken: text("refreshToken"),
  expiresAt: timestamp("expiresAt"),
  scope: text("scope"),
  calendarId: varchar("calendarId", { length: 256 }).default("primary"),
  syncEnabled: boolean("syncEnabled").default(true).notNull(),
  lastSyncedAt: timestamp("lastSyncedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type GoogleCalendarToken = typeof googleCalendarTokens.$inferSelect;
export type InsertGoogleCalendarToken = typeof googleCalendarTokens.$inferInsert;

// ─── GOOGLE CALENDAR SYNC MAP ─────────────────────────────────────────────────
export const gcalSyncMap = pgTable("gcal_sync_map", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  timeEntryId: integer("timeEntryId"),
  gcalEventId: varchar("gcalEventId", { length: 256 }).notNull(),
  direction: gcalDirectionEnum("direction").default("both").notNull(),
  lastSyncedAt: timestamp("lastSyncedAt").defaultNow().notNull(),
});

export type GcalSyncMap = typeof gcalSyncMap.$inferSelect;

// ─── RECURRING ACTIVITIES ────────────────────────────────────────────────────
export const recurringActivities = pgTable("recurring_activities", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  taskName: varchar("taskName", { length: 256 }).notNull(),
  activityType: activityTypeEnum("activityType").default("administrativ").notNull(),
  projectId: integer("projectId"),
  startHour: integer("startHour").notNull(),
  startMin: integer("startMin").notNull().default(0),
  durationMinutes: integer("durationMinutes").notNull(),
  countInTime: boolean("countInTime").default(true).notNull(),
  startDate: date("startDate").notNull(),
  endDate: date("endDate"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type RecurringActivity = typeof recurringActivities.$inferSelect;
export type InsertRecurringActivity = typeof recurringActivities.$inferInsert;

// ─── RECURRING EXCEPTIONS ────────────────────────────────────────────────────
export const recurringExceptions = pgTable("recurring_exceptions", {
  id: serial("id").primaryKey(),
  recurringId: integer("recurringId").notNull(),
  userId: integer("userId").notNull(),
  exceptionDate: date("exceptionDate").notNull(),
  overrideStartHour: integer("overrideStartHour"),
  overrideStartMin: integer("overrideStartMin"),
  overrideDuration: integer("overrideDuration"),
  isDeleted: boolean("isDeleted").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RecurringException = typeof recurringExceptions.$inferSelect;
export type InsertRecurringException = typeof recurringExceptions.$inferInsert;

// ─── ACTIVITY INVITATIONS ────────────────────────────────────────────────────
export const activityInvitations = pgTable("activity_invitations", {
  id: serial("id").primaryKey(),
  timeEntryId: integer("timeEntryId").notNull(),
  hostUserId: integer("hostUserId").notNull(),
  inviteeUserId: integer("inviteeUserId").notNull(),
  status: invitationStatusEnum("status").default("pending").notNull(),
  inviteeEntryId: integer("inviteeEntryId"),
  notifiedAt: timestamp("notifiedAt"),
  respondedAt: timestamp("respondedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ActivityInvitation = typeof activityInvitations.$inferSelect;
export type InsertActivityInvitation = typeof activityInvitations.$inferInsert;

// ─── EMPLOYEE DRIVE FOLDERS ──────────────────────────────────────────────────
export const employeeDriveFolders = pgTable("employee_drive_folders", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  folderId: varchar("folderId", { length: 256 }).notNull(),
  folderName: varchar("folderName", { length: 256 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type EmployeeDriveFolder = typeof employeeDriveFolders.$inferSelect;
export type InsertEmployeeDriveFolder = typeof employeeDriveFolders.$inferInsert;

// ─── DRIVE FILE SNAPSHOTS ────────────────────────────────────────────────────
export const driveFileSnapshots = pgTable("drive_file_snapshots", {
  id: serial("id").primaryKey(),
  fileId: varchar("fileId", { length: 256 }).notNull(),
  fileName: varchar("fileName", { length: 512 }).notNull(),
  folderId: varchar("folderId", { length: 256 }).notNull(),
  folderType: varchar("folderType", { length: 32 }).notNull().default("company"),
  ownerUserId: integer("ownerUserId"),
  subfolderName: varchar("subfolderName", { length: 256 }),
  modifiedTime: varchar("modifiedTime", { length: 64 }),
  size: varchar("size", { length: 32 }),
  mimeType: varchar("mimeType", { length: 128 }),
  deletedAt: timestamp("deletedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type DriveFileSnapshot = typeof driveFileSnapshots.$inferSelect;
export type InsertDriveFileSnapshot = typeof driveFileSnapshots.$inferInsert;
