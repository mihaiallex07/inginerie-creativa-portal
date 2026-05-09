var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// drizzle/schema.ts
var schema_exports = {};
__export(schema_exports, {
  activityInvitations: () => activityInvitations,
  activityTypeEnum: () => activityTypeEnum,
  appSettings: () => appSettings,
  bloodTypeEnum: () => bloodTypeEnum,
  companyEvents: () => companyEvents,
  documentActionEnum: () => documentActionEnum,
  documentAuditLog: () => documentAuditLog,
  documentTypeEnum: () => documentTypeEnum,
  documents: () => documents,
  driveFileSnapshots: () => driveFileSnapshots,
  employeeDriveFolders: () => employeeDriveFolders,
  gcalDirectionEnum: () => gcalDirectionEnum,
  gcalSyncMap: () => gcalSyncMap,
  googleCalendarTokens: () => googleCalendarTokens,
  hourBank: () => hourBank,
  hourRequestStatusEnum: () => hourRequestStatusEnum,
  invitationStatusEnum: () => invitationStatusEnum,
  leaveRequests: () => leaveRequests,
  leaveStatusEnum: () => leaveStatusEnum,
  leaveTypeEnum: () => leaveTypeEnum,
  news: () => news,
  newsCategoryEnum: () => newsCategoryEnum,
  newsComments: () => newsComments,
  newsReactions: () => newsReactions,
  notifications: () => notifications,
  phaseStatusEnum: () => phaseStatusEnum,
  pontaj: () => pontaj,
  pontajTypeEnum: () => pontajTypeEnum,
  processCategoryEnum: () => processCategoryEnum,
  processReadConfirmations: () => processReadConfirmations,
  processStatusEnum: () => processStatusEnum,
  processes: () => processes,
  projectMembers: () => projectMembers,
  projectPhases: () => projectPhases,
  projectRoleEnum: () => projectRoleEnum,
  projectStatusEnum: () => projectStatusEnum,
  projectTasks: () => projectTasks,
  projectTemplates: () => projectTemplates,
  projects: () => projects,
  proposalComments: () => proposalComments,
  proposalStatusEnum: () => proposalStatusEnum,
  proposalVotes: () => proposalVotes,
  proposals: () => proposals,
  recurringActivities: () => recurringActivities,
  recurringExceptions: () => recurringExceptions,
  roleEnum: () => roleEnum,
  sessionStatusEnum: () => sessionStatusEnum,
  targetTypeEnum: () => targetTypeEnum,
  taskHourRequests: () => taskHourRequests,
  taskSessions: () => taskSessions,
  taskStatusEnum: () => taskStatusEnum,
  templatePhases: () => templatePhases,
  templateTasks: () => templateTasks,
  timeEntries: () => timeEntries,
  timeEntryStatusEnum: () => timeEntryStatusEnum,
  users: () => users
});
import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
  boolean,
  date,
  numeric,
  json,
  serial
} from "drizzle-orm/pg-core";
var roleEnum, bloodTypeEnum, pontajTypeEnum, projectStatusEnum, phaseStatusEnum, taskStatusEnum, sessionStatusEnum, hourRequestStatusEnum, activityTypeEnum, timeEntryStatusEnum, newsCategoryEnum, documentTypeEnum, documentActionEnum, processCategoryEnum, processStatusEnum, proposalStatusEnum, leaveTypeEnum, leaveStatusEnum, targetTypeEnum, projectRoleEnum, gcalDirectionEnum, invitationStatusEnum, users, pontaj, projects, projectPhases, projectTasks, taskSessions, hourBank, taskHourRequests, projectTemplates, templatePhases, templateTasks, timeEntries, news, newsReactions, newsComments, documents, documentAuditLog, processes, processReadConfirmations, proposals, proposalVotes, proposalComments, notifications, leaveRequests, companyEvents, projectMembers, appSettings, googleCalendarTokens, gcalSyncMap, recurringActivities, recurringExceptions, activityInvitations, employeeDriveFolders, driveFileSnapshots;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    roleEnum = pgEnum("role", ["admin", "coordonator", "angajat", "colaborator"]);
    bloodTypeEnum = pgEnum("blood_type", ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]);
    pontajTypeEnum = pgEnum("pontaj_type", ["bucuresti", "cluj", "miercurea_ciuc", "brasov", "eveniment", "deplasare", "vizita_santier", "telemunca", "concediu", "medical", "liber_legal", "absent", "recuperare"]);
    projectStatusEnum = pgEnum("project_status", ["activ", "suspendat", "finalizat", "intern"]);
    phaseStatusEnum = pgEnum("phase_status", ["activa", "suspendata", "finalizata"]);
    taskStatusEnum = pgEnum("task_status", ["neinceputa", "in_lucru", "in_pauza", "finalizata", "blocata"]);
    sessionStatusEnum = pgEnum("session_status", ["activa", "in_pauza", "finalizata"]);
    hourRequestStatusEnum = pgEnum("hour_request_status", ["in_asteptare", "aprobata", "respinsa"]);
    activityTypeEnum = pgEnum("activity_type", ["proiectare", "consultanta", "sedinta", "documentare", "deplasare", "administrativ", "verificare", "executie"]);
    timeEntryStatusEnum = pgEnum("time_entry_status", ["draft", "salvat", "aprobat", "blocat"]);
    newsCategoryEnum = pgEnum("news_category", ["companie", "proiecte", "hr", "it", "evenimente", "realizari"]);
    documentTypeEnum = pgEnum("document_type", ["contract", "fisa_post", "evaluare", "certificat", "salariu", "concediu", "medical", "alt"]);
    documentActionEnum = pgEnum("document_action", ["view", "download", "upload", "delete", "update"]);
    processCategoryEnum = pgEnum("process_category", ["proiectare", "management", "financiar", "hr", "it", "achizitii", "comunicare", "alt"]);
    processStatusEnum = pgEnum("process_status", ["activ", "in_revizuire", "arhivat"]);
    proposalStatusEnum = pgEnum("proposal_status", ["deschisa", "in_evaluare", "acceptata", "amanata", "respinsa"]);
    leaveTypeEnum = pgEnum("leave_type", ["concediu_odihna", "concediu_medical", "concediu_fara_plata", "liber_legal", "recuperare", "alt"]);
    leaveStatusEnum = pgEnum("leave_status", ["in_asteptare", "aprobata", "respinsa", "anulata"]);
    targetTypeEnum = pgEnum("target_type", ["all", "department", "users"]);
    projectRoleEnum = pgEnum("project_role", ["coordonator", "membru", "consultant"]);
    gcalDirectionEnum = pgEnum("gcal_direction", ["gcal_to_portal", "portal_to_gcal", "both"]);
    invitationStatusEnum = pgEnum("invitation_status", ["pending", "accepted", "declined"]);
    users = pgTable("users", {
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
      lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
    });
    pontaj = pgTable("pontaj", {
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
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    projects = pgTable("projects", {
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
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    projectPhases = pgTable("project_phases", {
      id: serial("id").primaryKey(),
      projectId: integer("projectId").notNull(),
      name: varchar("name", { length: 256 }).notNull(),
      code: varchar("code", { length: 16 }),
      displayOrder: integer("displayOrder").default(0).notNull(),
      budgetHours: numeric("budgetHours", { precision: 8, scale: 2 }).default("0").notNull(),
      color: varchar("color", { length: 16 }).default("#FFCB09"),
      status: phaseStatusEnum("status").default("activa").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    projectTasks = pgTable("project_tasks", {
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
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    taskSessions = pgTable("task_sessions", {
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
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    hourBank = pgTable("hour_bank", {
      id: serial("id").primaryKey(),
      userId: integer("userId").notNull(),
      date: date("date").notNull(),
      minutesWorked: integer("minutesWorked").default(0).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    taskHourRequests = pgTable("task_hour_requests", {
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
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    projectTemplates = pgTable("project_templates", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 256 }).notNull(),
      description: text("description"),
      isDefault: boolean("isDefault").default(false).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    templatePhases = pgTable("template_phases", {
      id: serial("id").primaryKey(),
      templateId: integer("templateId").notNull(),
      name: varchar("name", { length: 256 }).notNull(),
      code: varchar("code", { length: 16 }),
      displayOrder: integer("displayOrder").default(0).notNull(),
      color: varchar("color", { length: 16 }).default("#FFCB09")
    });
    templateTasks = pgTable("template_tasks", {
      id: serial("id").primaryKey(),
      templatePhaseId: integer("templatePhaseId").notNull(),
      name: varchar("name", { length: 256 }).notNull()
    });
    timeEntries = pgTable("time_entries", {
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
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    news = pgTable("news", {
      id: serial("id").primaryKey(),
      title: varchar("title", { length: 512 }).notNull(),
      content: text("content").notNull(),
      excerpt: text("excerpt"),
      category: newsCategoryEnum("category").default("companie").notNull(),
      tags: json("tags").$type().default([]),
      authorId: integer("authorId").notNull(),
      isPinned: boolean("isPinned").default(false),
      isImportant: boolean("isImportant").default(false),
      imageUrl: text("imageUrl"),
      publishedAt: timestamp("publishedAt").defaultNow(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    newsReactions = pgTable("news_reactions", {
      id: serial("id").primaryKey(),
      newsId: integer("newsId").notNull(),
      userId: integer("userId").notNull(),
      reaction: varchar("reaction", { length: 16 }).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    newsComments = pgTable("news_comments", {
      id: serial("id").primaryKey(),
      newsId: integer("newsId").notNull(),
      userId: integer("userId").notNull(),
      content: text("content").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    documents = pgTable("documents", {
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
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    documentAuditLog = pgTable("document_audit_log", {
      id: serial("id").primaryKey(),
      documentId: integer("documentId").notNull(),
      userId: integer("userId").notNull(),
      action: documentActionEnum("action").notNull(),
      ipAddress: varchar("ipAddress", { length: 64 }),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    processes = pgTable("processes", {
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
      targetRoles: json("targetRoles").$type().default([]),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    processReadConfirmations = pgTable("process_read_confirmations", {
      id: serial("id").primaryKey(),
      processId: integer("processId").notNull(),
      userId: integer("userId").notNull(),
      confirmedAt: timestamp("confirmedAt").defaultNow().notNull()
    });
    proposals = pgTable("proposals", {
      id: serial("id").primaryKey(),
      referenceNumber: varchar("referenceNumber", { length: 32 }).notNull().unique(),
      title: varchar("title", { length: 512 }).notNull(),
      description: text("description").notNull(),
      benefits: text("benefits"),
      departments: json("departments").$type().default([]),
      authorId: integer("authorId").notNull(),
      isAnonymous: boolean("isAnonymous").default(false),
      status: proposalStatusEnum("status").default("deschisa").notNull(),
      managerId: integer("managerId"),
      managerDecision: text("managerDecision"),
      committeeDecision: text("committeeDecision"),
      votesCount: integer("votesCount").default(0),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    proposalVotes = pgTable("proposal_votes", {
      id: serial("id").primaryKey(),
      proposalId: integer("proposalId").notNull(),
      userId: integer("userId").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    proposalComments = pgTable("proposal_comments", {
      id: serial("id").primaryKey(),
      proposalId: integer("proposalId").notNull(),
      userId: integer("userId").notNull(),
      content: text("content").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    notifications = pgTable("notifications", {
      id: serial("id").primaryKey(),
      userId: integer("userId").notNull(),
      type: varchar("type", { length: 64 }).notNull(),
      title: varchar("title", { length: 256 }).notNull(),
      message: text("message"),
      link: varchar("link", { length: 512 }),
      isRead: boolean("isRead").default(false),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    leaveRequests = pgTable("leave_requests", {
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
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    companyEvents = pgTable("company_events", {
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
      targetUserIds: json("targetUserIds").$type().default([]),
      activityType: activityTypeEnum("activityType"),
      projectId: integer("projectId"),
      createdBy: integer("createdBy").notNull(),
      isActive: boolean("isActive").default(true),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    projectMembers = pgTable("project_members", {
      id: serial("id").primaryKey(),
      projectId: integer("projectId").notNull(),
      userId: integer("userId").notNull(),
      phaseId: integer("phaseId"),
      projectRole: projectRoleEnum("projectRole").default("membru").notNull(),
      joinedAt: timestamp("joinedAt").defaultNow().notNull()
    });
    appSettings = pgTable("app_settings", {
      id: serial("id").primaryKey(),
      key: varchar("key", { length: 128 }).notNull().unique(),
      value: text("value"),
      updatedBy: integer("updatedBy"),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    googleCalendarTokens = pgTable("google_calendar_tokens", {
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
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    gcalSyncMap = pgTable("gcal_sync_map", {
      id: serial("id").primaryKey(),
      userId: integer("userId").notNull(),
      timeEntryId: integer("timeEntryId"),
      gcalEventId: varchar("gcalEventId", { length: 256 }).notNull(),
      direction: gcalDirectionEnum("direction").default("both").notNull(),
      lastSyncedAt: timestamp("lastSyncedAt").defaultNow().notNull()
    });
    recurringActivities = pgTable("recurring_activities", {
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
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    recurringExceptions = pgTable("recurring_exceptions", {
      id: serial("id").primaryKey(),
      recurringId: integer("recurringId").notNull(),
      userId: integer("userId").notNull(),
      exceptionDate: date("exceptionDate").notNull(),
      overrideStartHour: integer("overrideStartHour"),
      overrideStartMin: integer("overrideStartMin"),
      overrideDuration: integer("overrideDuration"),
      isDeleted: boolean("isDeleted").default(false).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    activityInvitations = pgTable("activity_invitations", {
      id: serial("id").primaryKey(),
      timeEntryId: integer("timeEntryId").notNull(),
      hostUserId: integer("hostUserId").notNull(),
      inviteeUserId: integer("inviteeUserId").notNull(),
      status: invitationStatusEnum("status").default("pending").notNull(),
      inviteeEntryId: integer("inviteeEntryId"),
      notifiedAt: timestamp("notifiedAt"),
      respondedAt: timestamp("respondedAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    employeeDriveFolders = pgTable("employee_drive_folders", {
      id: serial("id").primaryKey(),
      userId: integer("userId").notNull().unique(),
      folderId: varchar("folderId", { length: 256 }).notNull(),
      folderName: varchar("folderName", { length: 256 }).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    driveFileSnapshots = pgTable("drive_file_snapshots", {
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
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
  }
});

// server/_core/env.ts
var ENV;
var init_env = __esm({
  "server/_core/env.ts"() {
    "use strict";
    ENV = {
      appId: process.env.VITE_APP_ID ?? "",
      cookieSecret: process.env.JWT_SECRET ?? "",
      databaseUrl: process.env.DATABASE_URL ?? "",
      oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
      ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
      isProduction: process.env.NODE_ENV === "production",
      forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
      forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
      googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
      googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      googleServiceAccountJson: process.env.GOOGLE_SERVICE_ACCOUNT_JSON ?? ""
    };
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  addNewsReaction: () => addNewsReaction,
  addProjectMember: () => addProjectMember,
  cancelLeaveRequest: () => cancelLeaveRequest,
  checkBudgetAlertsExternal: () => checkBudgetAlerts,
  checkTimeEntryExists: () => checkTimeEntryExists,
  confirmProcessRead: () => confirmProcessRead,
  createActivityInvitation: () => createActivityInvitation,
  createCompanyEvent: () => createCompanyEvent,
  createDocument: () => createDocument,
  createHourRequest: () => createHourRequest,
  createLeaveRequest: () => createLeaveRequest,
  createNews: () => createNews,
  createNotification: () => createNotification,
  createPhase: () => createPhase,
  createProject: () => createProject,
  createProjectFromTemplate: () => createProjectFromTemplate,
  createProposal: () => createProposal,
  createRecurringActivity: () => createRecurringActivity,
  createTask: () => createTask,
  createTimeEntry: () => createTimeEntry,
  deleteCompanyEvent: () => deleteCompanyEvent,
  deleteEmployeeDriveFolder: () => deleteEmployeeDriveFolder,
  deleteNews: () => deleteNews,
  deletePhase: () => deletePhase,
  deletePontajEntry: () => deletePontajEntry,
  deleteProject: () => deleteProject,
  deleteRecurringActivity: () => deleteRecurringActivity,
  deleteTask: () => deleteTask,
  deleteUserCompletely: () => deleteUserCompletely,
  getAbsenteLunare: () => getAbsenteLunare,
  getActiveSession: () => getActiveSession,
  getActiveUsers: () => getActiveUsers,
  getAllActiveDriveSnapshots: () => getAllActiveDriveSnapshots,
  getAllCompanyEvents: () => getAllCompanyEvents,
  getAllEmployeeDriveFolders: () => getAllEmployeeDriveFolders,
  getAllLeaveRequests: () => getAllLeaveRequests,
  getAllPontajByMonth: () => getAllPontajByMonth,
  getAllUsers: () => getAllUsers,
  getAllUsersAdmin: () => getAllUsersAdmin,
  getAppSetting: () => getAppSetting,
  getCompanyEvents: () => getCompanyEvents,
  getDb: () => getDb2,
  getDefaultTemplate: () => getDefaultTemplate,
  getDocumentsForUser: () => getDocumentsForUser,
  getDriveSnapshots: () => getDriveSnapshots,
  getDriveSnapshotsByOwner: () => getDriveSnapshotsByOwner,
  getEmployeeDriveFolder: () => getEmployeeDriveFolder,
  getFullProfile: () => getFullProfile,
  getHRDashboardStats: () => getHRDashboardStats,
  getHourBankAll: () => getHourBankAll,
  getHourBankForUser: () => getHourBankForUser,
  getHourRequestsForProject: () => getHourRequestsForProject,
  getInvitationsForEntry: () => getInvitationsForEntry,
  getLeaveRequestById: () => getLeaveRequestById,
  getLeaveRequestsByUser: () => getLeaveRequestsByUser,
  getMyHourRequests: () => getMyHourRequests,
  getNews: () => getNews,
  getNewsById: () => getNewsById,
  getNewsComments: () => getNewsComments,
  getNotifications: () => getNotifications,
  getOreSuplimentare: () => getOreSuplimentare,
  getOrgChartData: () => getOrgChartData,
  getPendingInvitationsForUser: () => getPendingInvitationsForUser,
  getPontajById: () => getPontajById,
  getPontajByMonth: () => getPontajByMonth,
  getPontajLunarAngajat: () => getPontajLunarAngajat,
  getPontajPerProiect: () => getPontajPerProiect,
  getProcessById: () => getProcessById,
  getProcessOverview: () => getProcessOverview,
  getProcessReadStatus: () => getProcessReadStatus,
  getProcesses: () => getProcesses,
  getProjectById: () => getProjectById,
  getProjectDetail: () => getProjectDetail,
  getProjectMembers: () => getProjectMembers,
  getProjectPhases: () => getProjectPhases,
  getProjectWithTeam: () => getProjectWithTeam,
  getProjects: () => getProjects,
  getProposalById: () => getProposalById,
  getProposals: () => getProposals,
  getRecurringActivities: () => getRecurringActivities,
  getRecurringExceptions: () => getRecurringExceptions,
  getRunningTimer: () => getRunningTimer,
  getSessionsForTask: () => getSessionsForTask,
  getSumarEchipaLunar: () => getSumarEchipaLunar,
  getTasksByPhase: () => getTasksByPhase,
  getTasksByProject: () => getTasksByProject,
  getTimeEntriesForProject: () => getTimeEntriesForProject,
  getTimeEntriesForUser: () => getTimeEntriesForUser,
  getTodayPontaj: () => getTodayPontaj,
  getUnreadNotificationCount: () => getUnreadNotificationCount,
  getUpcomingAnniversaries: () => getUpcomingAnniversaries,
  getUpcomingBirthdays: () => getUpcomingBirthdays,
  getUserByOpenId: () => getUserByOpenId,
  listProjects: () => listProjects,
  listTemplates: () => listTemplates,
  logDocumentAccess: () => logDocumentAccess,
  markDriveSnapshotDeleted: () => markDriveSnapshotDeleted,
  markNotificationsRead: () => markNotificationsRead,
  pauseTaskSession: () => pauseTaskSession,
  removeProjectMember: () => removeProjectMember,
  respondToInvitation: () => respondToInvitation,
  resumeTaskSession: () => resumeTaskSession,
  reviewHourRequest: () => reviewHourRequest,
  reviewLeaveRequest: () => reviewLeaveRequest,
  setAppSetting: () => setAppSetting,
  setEmployeeDriveFolder: () => setEmployeeDriveFolder,
  startTaskSession: () => startTaskSession,
  stopTaskSession: () => stopTaskSession,
  updateCompanyEvent: () => updateCompanyEvent,
  updateFullProfile: () => updateFullProfile,
  updateNews: () => updateNews,
  updatePhase: () => updatePhase,
  updatePontajEntry: () => updatePontajEntry,
  updateProject: () => updateProject,
  updateProjectMemberRole: () => updateProjectMemberRole,
  updateRecurringActivity: () => updateRecurringActivity,
  updateTask: () => updateTask,
  updateTimeEntry: () => updateTimeEntry,
  updateUser: () => updateUser,
  updateUserActive: () => updateUserActive,
  updateUserProfile: () => updateUserProfile,
  updateUserRole: () => updateUserRole,
  updateUsersDisplayOrder: () => updateUsersDisplayOrder,
  upsertDriveSnapshot: () => upsertDriveSnapshot,
  upsertHourBank: () => upsertHourBank,
  upsertPontaj: () => upsertPontaj,
  upsertProject: () => upsertProject,
  upsertRecurringException: () => upsertRecurringException,
  upsertUser: () => upsertUser,
  voteProposal: () => voteProposal
});
import { and, asc, desc, eq, gte, isNotNull, isNull, lte, or, sql as sql2 } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
async function getAppSetting(key) {
  const db = await getDb2();
  if (!db) return null;
  const result = await db.select().from(appSettings).where(eq(appSettings.key, key)).limit(1);
  return result[0]?.value ?? null;
}
async function setAppSetting(key, value, updatedBy) {
  const db = await getDb2();
  if (!db) return;
  const existing = await db.select().from(appSettings).where(eq(appSettings.key, key)).limit(1);
  if (existing.length > 0) {
    await db.update(appSettings).set({ value, updatedBy }).where(eq(appSettings.key, key));
  } else {
    await db.insert(appSettings).values({ key, value, updatedBy });
  }
}
async function getDb2() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL);
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb2();
  if (!db) return;
  const values = { openId: user.openId };
  const updateSet = {};
  const textFields = ["name", "email", "loginMethod"];
  textFields.forEach((field) => {
    const value = user[field];
    if (value === void 0) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });
  if (user.lastSignedIn !== void 0) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== void 0) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = /* @__PURE__ */ new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = /* @__PURE__ */ new Date();
  await db.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: updateSet });
}
async function getUserByOpenId(openId) {
  const db = await getDb2();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}
async function getAllUsers() {
  const db = await getDb2();
  if (!db) return [];
  return db.select().from(users).where(eq(users.isActive, true)).orderBy(users.name);
}
async function updateUser(id, data) {
  const db = await getDb2();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, id));
}
async function getTodayPontaj(userId) {
  const db = await getDb2();
  if (!db) return null;
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const result = await db.select().from(pontaj).where(and(eq(pontaj.userId, userId), sql2`DATE(${pontaj.date}) = ${today}`)).limit(1);
  return result[0] ?? null;
}
async function upsertPontaj(data) {
  const db = await getDb2();
  if (!db) return null;
  const existing = await getTodayPontaj(data.userId);
  if (existing) {
    await db.update(pontaj).set(data).where(eq(pontaj.id, existing.id));
    return existing.id;
  } else {
    const result = await db.insert(pontaj).values(data).returning({ id: pontaj.id });
    return result[0].id;
  }
}
async function getPontajByMonth(userId, year, month) {
  const db = await getDb2();
  if (!db) return [];
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = `${year}-${String(month).padStart(2, "0")}-31`;
  return db.select().from(pontaj).where(and(eq(pontaj.userId, userId), sql2`DATE(${pontaj.date}) >= ${start}`, sql2`DATE(${pontaj.date}) <= ${end}`)).orderBy(pontaj.date);
}
async function getAllPontajByMonth(year, month) {
  const db = await getDb2();
  if (!db) return [];
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = `${year}-${String(month).padStart(2, "0")}-31`;
  return db.select({ pontaj, user: { id: users.id, name: users.name, email: users.email, department: users.department } }).from(pontaj).leftJoin(users, eq(pontaj.userId, users.id)).where(and(sql2`DATE(${pontaj.date}) >= ${start}`, sql2`DATE(${pontaj.date}) <= ${end}`)).orderBy(users.name, pontaj.date);
}
async function updatePontajEntry(id, userId, data) {
  const db = await getDb2();
  if (!db) return;
  await db.update(pontaj).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(pontaj.id, id), eq(pontaj.userId, userId)));
}
async function deletePontajEntry(id, userId) {
  const db = await getDb2();
  if (!db) return;
  await db.delete(pontaj).where(and(eq(pontaj.id, id), eq(pontaj.userId, userId)));
}
async function getPontajById(id) {
  const db = await getDb2();
  if (!db) return null;
  const result = await db.select().from(pontaj).where(eq(pontaj.id, id)).limit(1);
  return result[0] ?? null;
}
async function getProjects(status) {
  const db = await getDb2();
  if (!db) return [];
  if (status) {
    return db.select().from(projects).where(eq(projects.status, status)).orderBy(projects.name);
  }
  return db.select().from(projects).orderBy(projects.name);
}
async function upsertProject(data) {
  const db = await getDb2();
  if (!db) return;
  if (data.id) {
    await db.update(projects).set(data).where(eq(projects.id, data.id));
  } else {
    await db.insert(projects).values(data).returning({ id: projects.id });
  }
}
async function getTimeEntriesForUser(userId, dateFrom, dateTo) {
  const db = await getDb2();
  if (!db) return [];
  const conditions = [eq(timeEntries.userId, userId)];
  if (dateFrom) conditions.push(sql2`DATE(${timeEntries.date}) >= ${dateFrom}`);
  if (dateTo) conditions.push(sql2`DATE(${timeEntries.date}) <= ${dateTo}`);
  return db.select().from(timeEntries).where(and(...conditions)).orderBy(desc(timeEntries.date), desc(timeEntries.createdAt));
}
async function getRunningTimer(userId) {
  const db = await getDb2();
  if (!db) return null;
  const result = await db.select().from(timeEntries).where(and(eq(timeEntries.userId, userId), eq(timeEntries.isRunning, true))).limit(1);
  return result[0] ?? null;
}
async function checkTimeEntryExists(userId, date2, taskName, startHour, startMin) {
  const db = await getDb2();
  if (!db) return false;
  const result = await db.select({ id: timeEntries.id }).from(timeEntries).where(
    and(
      eq(timeEntries.userId, userId),
      sql2`DATE(${timeEntries.date}) = ${date2}`,
      eq(timeEntries.taskName, taskName),
      isNotNull(timeEntries.startHour),
      sql2`${timeEntries.startHour} = ${startHour}`,
      sql2`${timeEntries.startMin} = ${startMin}`
    )
  ).limit(1);
  return result.length > 0;
}
async function createTimeEntry(data) {
  const db = await getDb2();
  if (!db) return null;
  const result = await db.insert(timeEntries).values(data).returning({ id: timeEntries.id });
  return result[0].id;
}
async function updateTimeEntry(id, data) {
  const db = await getDb2();
  if (!db) return;
  await db.update(timeEntries).set(data).where(eq(timeEntries.id, id));
}
async function getTimeEntriesForProject(projectId) {
  const db = await getDb2();
  if (!db) return [];
  return db.select({ entry: timeEntries, user: { id: users.id, name: users.name } }).from(timeEntries).leftJoin(users, eq(timeEntries.userId, users.id)).where(eq(timeEntries.projectId, projectId)).orderBy(desc(timeEntries.date));
}
async function getNews(limit = 20, category) {
  const db = await getDb2();
  if (!db) return [];
  const conditions = category ? [eq(news.category, category)] : [];
  return db.select({ news, author: { id: users.id, name: users.name, avatarUrl: users.avatarUrl } }).from(news).leftJoin(users, eq(news.authorId, users.id)).where(conditions.length ? and(...conditions) : void 0).orderBy(desc(news.isPinned), desc(news.publishedAt)).limit(limit);
}
async function getNewsById(id) {
  const db = await getDb2();
  if (!db) return null;
  const result = await db.select({ news, author: { id: users.id, name: users.name, avatarUrl: users.avatarUrl } }).from(news).leftJoin(users, eq(news.authorId, users.id)).where(eq(news.id, id)).limit(1);
  return result[0] ?? null;
}
async function createNews(data) {
  const db = await getDb2();
  if (!db) return null;
  const result = await db.insert(news).values(data).returning({ id: news.id });
  return result[0].id;
}
async function updateNews(id, data) {
  const db = await getDb2();
  if (!db) return;
  await db.update(news).set(data).where(eq(news.id, id));
}
async function deleteNews(id) {
  const db = await getDb2();
  if (!db) return;
  await db.delete(newsReactions).where(eq(newsReactions.newsId, id));
  await db.delete(newsComments).where(eq(newsComments.newsId, id));
  await db.delete(news).where(eq(news.id, id));
}
async function getNewsComments(newsId) {
  const db = await getDb2();
  if (!db) return [];
  return db.select({ comment: newsComments, user: { id: users.id, name: users.name, avatarUrl: users.avatarUrl } }).from(newsComments).leftJoin(users, eq(newsComments.userId, users.id)).where(eq(newsComments.newsId, newsId)).orderBy(newsComments.createdAt);
}
async function addNewsReaction(newsId, userId, reaction) {
  const db = await getDb2();
  if (!db) return;
  const existing = await db.select().from(newsReactions).where(and(eq(newsReactions.newsId, newsId), eq(newsReactions.userId, userId))).limit(1);
  if (existing.length > 0) {
    await db.update(newsReactions).set({ reaction }).where(eq(newsReactions.id, existing[0].id));
  } else {
    await db.insert(newsReactions).values({ newsId, userId, reaction });
  }
}
async function getDocumentsForUser(userId) {
  const db = await getDb2();
  if (!db) return [];
  return db.select().from(documents).where(eq(documents.userId, userId)).orderBy(desc(documents.createdAt));
}
async function createDocument(data) {
  const db = await getDb2();
  if (!db) return null;
  const result = await db.insert(documents).values(data).returning({ id: documents.id });
  return result[0].id;
}
async function logDocumentAccess(documentId, userId, action, ipAddress) {
  const db = await getDb2();
  if (!db) return;
  await db.insert(documentAuditLog).values({ documentId, userId, action, ipAddress });
}
async function getProcesses(department, category) {
  const db = await getDb2();
  if (!db) return [];
  const conditions = [eq(processes.status, "activ")];
  if (department) conditions.push(eq(processes.department, department));
  if (category) conditions.push(eq(processes.category, category));
  return db.select({ process: processes, owner: { id: users.id, name: users.name } }).from(processes).leftJoin(users, eq(processes.ownerId, users.id)).where(and(...conditions)).orderBy(processes.department, processes.title);
}
async function getProcessById(id) {
  const db = await getDb2();
  if (!db) return null;
  const result = await db.select({ process: processes, owner: { id: users.id, name: users.name } }).from(processes).leftJoin(users, eq(processes.ownerId, users.id)).where(eq(processes.id, id)).limit(1);
  return result[0] ?? null;
}
async function confirmProcessRead(processId, userId) {
  const db = await getDb2();
  if (!db) return;
  const existing = await db.select().from(processReadConfirmations).where(and(eq(processReadConfirmations.processId, processId), eq(processReadConfirmations.userId, userId))).limit(1);
  if (!existing.length) {
    await db.insert(processReadConfirmations).values({ processId, userId });
  }
}
async function getProcessReadStatus(processId) {
  const db = await getDb2();
  if (!db) return [];
  return db.select({ confirmation: processReadConfirmations, user: { id: users.id, name: users.name, email: users.email } }).from(processReadConfirmations).leftJoin(users, eq(processReadConfirmations.userId, users.id)).where(eq(processReadConfirmations.processId, processId));
}
async function getProposals(status) {
  const db = await getDb2();
  if (!db) return [];
  const conditions = status ? [eq(proposals.status, status)] : [];
  return db.select({ proposal: proposals, author: { id: users.id, name: users.name, avatarUrl: users.avatarUrl } }).from(proposals).leftJoin(users, eq(proposals.authorId, users.id)).where(conditions.length ? and(...conditions) : void 0).orderBy(desc(proposals.createdAt));
}
async function getProposalById(id) {
  const db = await getDb2();
  if (!db) return null;
  const result = await db.select({ proposal: proposals, author: { id: users.id, name: users.name } }).from(proposals).leftJoin(users, eq(proposals.authorId, users.id)).where(eq(proposals.id, id)).limit(1);
  return result[0] ?? null;
}
async function createProposal(data) {
  const db = await getDb2();
  if (!db) return null;
  const result = await db.insert(proposals).values(data).returning({ id: proposals.id });
  return result[0].id;
}
async function voteProposal(proposalId, userId) {
  const db = await getDb2();
  if (!db) return false;
  const existing = await db.select().from(proposalVotes).where(and(eq(proposalVotes.proposalId, proposalId), eq(proposalVotes.userId, userId))).limit(1);
  if (existing.length > 0) {
    await db.delete(proposalVotes).where(eq(proposalVotes.id, existing[0].id));
    await db.update(proposals).set({ votesCount: sql2`${proposals.votesCount} - 1` }).where(eq(proposals.id, proposalId));
    return false;
  } else {
    await db.insert(proposalVotes).values({ proposalId, userId });
    await db.update(proposals).set({ votesCount: sql2`${proposals.votesCount} + 1` }).where(eq(proposals.id, proposalId));
    return true;
  }
}
async function getNotifications(userId, limit = 20) {
  const db = await getDb2();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(limit);
}
async function getUnreadNotificationCount(userId) {
  const db = await getDb2();
  if (!db) return 0;
  const result = await db.select({ count: sql2`count(*)` }).from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return result[0]?.count ?? 0;
}
async function markNotificationsRead(userId) {
  const db = await getDb2();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}
async function createNotification(data) {
  const db = await getDb2();
  if (!db) return;
  await db.insert(notifications).values(data);
}
async function getPontajLunarAngajat(userId, year, month) {
  const db = await getDb2();
  if (!db) return [];
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = `${year}-${String(month).padStart(2, "0")}-31`;
  return db.select({
    id: pontaj.id,
    date: pontaj.date,
    checkIn: pontaj.checkIn,
    checkOut: pontaj.checkOut,
    type: pontaj.type,
    breakMinutes: pontaj.breakMinutes,
    totalMinutes: pontaj.totalMinutes,
    notes: pontaj.notes,
    projectName: projects.name
  }).from(pontaj).leftJoin(projects, eq(pontaj.projectId, projects.id)).where(and(eq(pontaj.userId, userId), sql2`DATE(${pontaj.date}) >= ${start}`, sql2`DATE(${pontaj.date}) <= ${end}`)).orderBy(pontaj.date);
}
async function getSumarEchipaLunar(year, month) {
  const db = await getDb2();
  if (!db) return [];
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = `${year}-${String(month).padStart(2, "0")}-31`;
  const allUsers = await db.select().from(users).where(eq(users.isActive, true)).orderBy(users.name);
  const allPontaj = await db.select().from(pontaj).where(and(sql2`DATE(${pontaj.date}) >= ${start}`, sql2`DATE(${pontaj.date}) <= ${end}`));
  const presentTypes = ["bucuresti", "cluj", "miercurea_ciuc", "brasov", "eveniment", "deplasare", "vizita_santier", "telemunca"];
  return allUsers.map((u) => {
    const userPontaj = allPontaj.filter((p) => p.userId === u.id);
    return {
      id: u.id,
      name: u.name ?? u.email ?? "\u2014",
      email: u.email,
      department: u.department,
      presentDays: userPontaj.filter((p) => presentTypes.includes(p.type)).length,
      totalMinutes: userPontaj.reduce((acc, p) => acc + (p.totalMinutes ?? 0), 0),
      concediuDays: userPontaj.filter((p) => p.type === "concediu").length,
      medicalDays: userPontaj.filter((p) => p.type === "medical").length,
      absentDays: userPontaj.filter((p) => p.type === "absent").length,
      liberLegalDays: userPontaj.filter((p) => p.type === "liber_legal").length,
      recuperareDays: userPontaj.filter((p) => p.type === "recuperare").length
    };
  });
}
async function getAbsenteLunare(year, month) {
  const db = await getDb2();
  if (!db) return [];
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = `${year}-${String(month).padStart(2, "0")}-31`;
  const absenceTypes = ["concediu", "medical", "liber_legal", "absent", "recuperare"];
  return db.select({
    name: users.name,
    email: users.email,
    date: pontaj.date,
    type: pontaj.type,
    notes: pontaj.notes
  }).from(pontaj).leftJoin(users, eq(pontaj.userId, users.id)).where(and(
    sql2`DATE(${pontaj.date}) >= ${start}`,
    sql2`DATE(${pontaj.date}) <= ${end}`,
    sql2`${pontaj.type} IN ('concediu','medical','liber_legal','absent','recuperare')`
  )).orderBy(users.name, pontaj.date);
}
async function getOreSuplimentare(year, month, normMinutes = 480) {
  const db = await getDb2();
  if (!db) return [];
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = `${year}-${String(month).padStart(2, "0")}-31`;
  const rows = await db.select({
    name: users.name,
    date: pontaj.date,
    totalMinutes: pontaj.totalMinutes,
    type: pontaj.type
  }).from(pontaj).leftJoin(users, eq(pontaj.userId, users.id)).where(and(
    sql2`DATE(${pontaj.date}) >= ${start}`,
    sql2`DATE(${pontaj.date}) <= ${end}`,
    sql2`${pontaj.totalMinutes} > ${normMinutes}`
  )).orderBy(users.name, pontaj.date);
  return rows.map((r) => ({
    ...r,
    name: r.name ?? "\u2014",
    overMinutes: Math.max(0, (r.totalMinutes ?? 0) - normMinutes)
  }));
}
async function getPontajPerProiect(year, month) {
  const db = await getDb2();
  if (!db) return [];
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = `${year}-${String(month).padStart(2, "0")}-31`;
  const rows = await db.select({
    projectName: projects.name,
    name: users.name,
    date: pontaj.date,
    totalMinutes: pontaj.totalMinutes,
    type: pontaj.type,
    notes: pontaj.notes
  }).from(pontaj).leftJoin(users, eq(pontaj.userId, users.id)).leftJoin(projects, eq(pontaj.projectId, projects.id)).where(and(
    sql2`DATE(${pontaj.date}) >= ${start}`,
    sql2`DATE(${pontaj.date}) <= ${end}`,
    sql2`${pontaj.projectId} IS NOT NULL`
  )).orderBy(projects.name, users.name, pontaj.date);
  return rows.map((r) => ({
    ...r,
    projectName: r.projectName ?? "F\u0103r\u0103 proiect",
    name: r.name ?? "\u2014"
  }));
}
async function getActiveUsers() {
  const db = await getDb2();
  if (!db) return [];
  return db.select({ id: users.id, name: users.name, email: users.email, department: users.department }).from(users).where(eq(users.isActive, true)).orderBy(users.name);
}
async function createLeaveRequest(data) {
  const db = await getDb2();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(leaveRequests).values(data).returning({ id: leaveRequests.id });
  return result;
}
async function getLeaveRequestsByUser(userId) {
  const db = await getDb2();
  if (!db) return [];
  return db.select({
    id: leaveRequests.id,
    type: leaveRequests.type,
    startDate: leaveRequests.startDate,
    endDate: leaveRequests.endDate,
    totalDays: leaveRequests.totalDays,
    reason: leaveRequests.reason,
    status: leaveRequests.status,
    reviewNote: leaveRequests.reviewNote,
    reviewedAt: leaveRequests.reviewedAt,
    createdAt: leaveRequests.createdAt,
    reviewerName: users.name
  }).from(leaveRequests).leftJoin(users, eq(leaveRequests.reviewedBy, users.id)).where(eq(leaveRequests.userId, userId)).orderBy(desc(leaveRequests.createdAt));
}
async function getAllLeaveRequests(statusFilter) {
  const db = await getDb2();
  if (!db) return [];
  const conditions = statusFilter && statusFilter !== "toate" ? [sql2`${leaveRequests.status} = ${statusFilter}`] : [];
  return db.select({
    id: leaveRequests.id,
    userId: leaveRequests.userId,
    type: leaveRequests.type,
    startDate: leaveRequests.startDate,
    endDate: leaveRequests.endDate,
    totalDays: leaveRequests.totalDays,
    reason: leaveRequests.reason,
    status: leaveRequests.status,
    reviewNote: leaveRequests.reviewNote,
    reviewedAt: leaveRequests.reviewedAt,
    createdAt: leaveRequests.createdAt,
    employeeName: users.name,
    employeeEmail: users.email,
    employeeDepartment: users.department
  }).from(leaveRequests).leftJoin(users, eq(leaveRequests.userId, users.id)).where(conditions.length > 0 ? and(...conditions) : void 0).orderBy(desc(leaveRequests.createdAt));
}
async function reviewLeaveRequest(id, reviewedBy, status, reviewNote) {
  const db = await getDb2();
  if (!db) throw new Error("DB unavailable");
  await db.update(leaveRequests).set({ status, reviewedBy, reviewNote: reviewNote ?? null, reviewedAt: /* @__PURE__ */ new Date() }).where(eq(leaveRequests.id, id));
}
async function cancelLeaveRequest(id, userId) {
  const db = await getDb2();
  if (!db) throw new Error("DB unavailable");
  await db.update(leaveRequests).set({ status: "anulata" }).where(and(eq(leaveRequests.id, id), eq(leaveRequests.userId, userId)));
}
async function getLeaveRequestById(id) {
  const db = await getDb2();
  if (!db) return null;
  const [row] = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id));
  return row ?? null;
}
async function getAllUsersAdmin() {
  const db = await getDb2();
  if (!db) return [];
  return db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    department: users.department,
    jobTitle: users.jobTitle,
    isActive: users.isActive,
    lastSignedIn: users.lastSignedIn,
    createdAt: users.createdAt
  }).from(users).orderBy(users.name);
}
async function updateUserRole(id, role) {
  const db = await getDb2();
  if (!db) throw new Error("DB unavailable");
  await db.update(users).set({ role }).where(eq(users.id, id));
}
async function updateUserActive(id, isActive) {
  const db = await getDb2();
  if (!db) throw new Error("DB unavailable");
  await db.update(users).set({ isActive }).where(eq(users.id, id));
}
async function updateUserProfile(id, data) {
  const db = await getDb2();
  if (!db) throw new Error("DB unavailable");
  const updateSet = {};
  if (data.name !== void 0) updateSet.name = data.name;
  if (data.department !== void 0) updateSet.department = data.department;
  if (data.jobTitle !== void 0) updateSet.jobTitle = data.jobTitle;
  if (data.phone !== void 0) updateSet.phone = data.phone;
  if (Object.keys(updateSet).length > 0) {
    await db.update(users).set(updateSet).where(eq(users.id, id));
  }
}
async function getHRDashboardStats(year, month) {
  const db = await getDb2();
  if (!db) return null;
  const startStr = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDay = new Date(year, month, 0).getDate();
  const endStr = `${year}-${String(month).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`;
  const [{ totalUsers }] = await db.select({ totalUsers: sql2`COUNT(*)` }).from(users).where(eq(users.isActive, true));
  const pontajRows = await db.select({
    userId: pontaj.userId,
    type: pontaj.type,
    totalMinutes: pontaj.totalMinutes,
    date: pontaj.date
  }).from(pontaj).where(and(
    sql2`DATE(${pontaj.date}) >= ${startStr}`,
    sql2`DATE(${pontaj.date}) <= ${endStr}`
  ));
  const totalPontajMinutes = pontajRows.reduce((a, r) => a + (r.totalMinutes ?? 0), 0);
  const uniqueUserDays = new Set(pontajRows.map((r) => `${r.userId}-${r.date}`)).size;
  const locationCounts = {};
  pontajRows.forEach((r) => {
    locationCounts[r.type] = (locationCounts[r.type] ?? 0) + 1;
  });
  const todayStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const pontajAziUserIds = await db.select({ userId: pontaj.userId }).from(pontaj).where(sql2`DATE(${pontaj.date}) = ${todayStr}`);
  const pontajAziSet = new Set(pontajAziUserIds.map((r) => r.userId));
  const allActiveUsers = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.isActive, true));
  const farapontajAzi = allActiveUsers.filter((u) => !pontajAziSet.has(u.id));
  const leaveRows = await db.select({
    status: leaveRequests.status,
    totalDays: leaveRequests.totalDays
  }).from(leaveRequests).where(and(
    sql2`DATE(${leaveRequests.startDate}) >= ${startStr}`,
    sql2`DATE(${leaveRequests.startDate}) <= ${endStr}`
  ));
  const leaveStats = {
    total: leaveRows.length,
    inAsteptare: leaveRows.filter((r) => r.status === "in_asteptare").length,
    aprobate: leaveRows.filter((r) => r.status === "aprobata").length,
    respinse: leaveRows.filter((r) => r.status === "respinsa").length,
    totalZile: leaveRows.filter((r) => r.status === "aprobata").reduce((a, r) => a + r.totalDays, 0)
  };
  return {
    totalUsers: Number(totalUsers),
    pontaj: {
      totalMinutes: totalPontajMinutes,
      uniqueUserDays,
      locationCounts
    },
    farapontajAzi: farapontajAzi.map((u) => ({ id: u.id, name: u.name })),
    leaveStats
  };
}
async function getFullProfile(userId) {
  const db = await getDb2();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0] ?? null;
}
async function updateFullProfile(userId, data) {
  const db = await getDb2();
  if (!db) throw new Error("Database unavailable");
  await db.update(users).set(data).where(eq(users.id, userId));
  return { success: true };
}
async function getUpcomingBirthdays(daysAhead = 30) {
  const db = await getDb2();
  if (!db) return [];
  const allUsers = await db.select({
    id: users.id,
    name: users.name,
    avatarUrl: users.avatarUrl,
    department: users.department,
    jobTitle: users.jobTitle,
    birthDate: users.birthDate
  }).from(users).where(and(eq(users.isActive, true)));
  const today = /* @__PURE__ */ new Date();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();
  const result = [];
  for (const u of allUsers) {
    if (!u.birthDate) continue;
    const bd = new Date(u.birthDate);
    const bMonth = bd.getMonth() + 1;
    const bDay = bd.getDate();
    let nextBirthday = new Date(today.getFullYear(), bMonth - 1, bDay);
    if (nextBirthday.getMonth() + 1 < todayMonth || nextBirthday.getMonth() + 1 === todayMonth && bDay < todayDay) {
      nextBirthday = new Date(today.getFullYear() + 1, bMonth - 1, bDay);
    }
    const diffMs = nextBirthday.getTime() - new Date(today.getFullYear(), todayMonth - 1, todayDay).getTime();
    const daysUntil = Math.round(diffMs / (1e3 * 60 * 60 * 24));
    if (daysUntil <= daysAhead) {
      result.push({
        id: u.id,
        name: u.name,
        avatarUrl: u.avatarUrl,
        department: u.department,
        jobTitle: u.jobTitle,
        birthDate: (u.birthDate instanceof Date ? u.birthDate.toISOString() : String(u.birthDate)).slice(0, 10),
        daysUntil,
        isToday: daysUntil === 0
      });
    }
  }
  return result.sort((a, b) => a.daysUntil - b.daysUntil);
}
async function getUpcomingAnniversaries(daysAhead = 30) {
  const db = await getDb2();
  if (!db) return [];
  const allUsers = await db.select({
    id: users.id,
    name: users.name,
    avatarUrl: users.avatarUrl,
    department: users.department,
    jobTitle: users.jobTitle,
    hireDate: users.hireDate
  }).from(users).where(and(eq(users.isActive, true)));
  const today = /* @__PURE__ */ new Date();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();
  const result = [];
  for (const u of allUsers) {
    if (!u.hireDate) continue;
    const hd = new Date(u.hireDate);
    const hMonth = hd.getMonth() + 1;
    const hDay = hd.getDate();
    const hYear = hd.getFullYear();
    if (hYear >= today.getFullYear()) continue;
    let nextAnniv = new Date(today.getFullYear(), hMonth - 1, hDay);
    let yearsCompleted = today.getFullYear() - hYear;
    if (nextAnniv.getMonth() + 1 < todayMonth || nextAnniv.getMonth() + 1 === todayMonth && hDay < todayDay) {
      nextAnniv = new Date(today.getFullYear() + 1, hMonth - 1, hDay);
      yearsCompleted = today.getFullYear() + 1 - hYear;
    }
    const diffMs = nextAnniv.getTime() - new Date(today.getFullYear(), todayMonth - 1, todayDay).getTime();
    const daysUntil = Math.round(diffMs / (1e3 * 60 * 60 * 24));
    if (daysUntil <= daysAhead) {
      result.push({
        id: u.id,
        name: u.name,
        avatarUrl: u.avatarUrl,
        department: u.department,
        jobTitle: u.jobTitle,
        hireDate: (u.hireDate instanceof Date ? u.hireDate.toISOString() : String(u.hireDate)).slice(0, 10),
        yearsCompleted,
        daysUntil,
        isToday: daysUntil === 0
      });
    }
  }
  return result.sort((a, b) => a.daysUntil - b.daysUntil);
}
async function getOrgChartData() {
  const db = await getDb2();
  if (!db) return [];
  return db.select({
    id: users.id,
    name: users.name,
    avatarUrl: users.avatarUrl,
    department: users.department,
    jobTitle: users.jobTitle,
    role: users.role,
    email: users.email,
    isActive: users.isActive
  }).from(users).where(eq(users.isActive, true));
}
async function getCompanyEvents(dateFrom, dateTo) {
  const db = await getDb2();
  if (!db) return [];
  const rows = await db.select().from(companyEvents).where(and(
    eq(companyEvents.isActive, true),
    or(
      // Non-recurring: must overlap with date range
      and(
        sql2`(${companyEvents.isRecurring} = false OR ${companyEvents.isRecurring} IS NULL)`,
        sql2`DATE(${companyEvents.startTime}) <= ${dateTo}`,
        sql2`DATE(${companyEvents.endTime}) >= ${dateFrom}`
      ),
      // Recurring: started before range end and not expired
      and(
        eq(companyEvents.isRecurring, true),
        sql2`DATE(${companyEvents.startTime}) <= ${dateTo}`,
        or(
          sql2`${companyEvents.recurringUntil} IS NULL`,
          sql2`${companyEvents.recurringUntil} >= ${dateFrom}`
        )
      )
    )
  ));
  return rows;
}
async function getAllCompanyEvents() {
  const db = await getDb2();
  if (!db) return [];
  const rows = await db.select().from(companyEvents).where(eq(companyEvents.isActive, true)).orderBy(desc(companyEvents.createdAt));
  return rows;
}
async function createCompanyEvent(data) {
  const db = await getDb2();
  if (!db) throw new Error("DB unavailable");
  const { targetUserIds, recurringUntil, ...rest } = data;
  await db.insert(companyEvents).values({
    ...rest,
    recurringUntil: recurringUntil ?? null
  });
  return { success: true };
}
async function updateCompanyEvent(id, data) {
  const db = await getDb2();
  if (!db) throw new Error("DB unavailable");
  await db.update(companyEvents).set(data).where(eq(companyEvents.id, id));
  return { success: true };
}
async function deleteCompanyEvent(id) {
  const db = await getDb2();
  if (!db) throw new Error("DB unavailable");
  await db.update(companyEvents).set({ isActive: false }).where(eq(companyEvents.id, id));
  return { success: true };
}
async function deleteUserCompletely(userId) {
  const db = await getDb2();
  if (!db) throw new Error("DB unavailable");
  await db.execute(sql2`DELETE FROM pontaj WHERE userId = ${userId}`);
  await db.execute(sql2`DELETE FROM leave_requests WHERE userId = ${userId}`);
  try {
    await db.execute(sql2`DELETE FROM time_entries WHERE userId = ${userId}`);
  } catch {
  }
  await db.execute(sql2`DELETE FROM users WHERE id = ${userId}`);
  return { success: true };
}
async function getProjectMembers(projectId) {
  const db = await getDb2();
  if (!db) return [];
  const rows = await db.execute(
    sql2`SELECT pm.*, u.name, u.email, u.role AS globalRole, u.department, u.jobTitle, u.avatarUrl
        FROM project_members pm
        JOIN users u ON u.id = pm.userId
        WHERE pm.projectId = ${projectId}
        ORDER BY FIELD(pm.projectRole, 'coordonator', 'membru', 'consultant'), u.name`
  );
  return rows[0] ?? [];
}
async function addProjectMember(projectId, userId, projectRole = "membru", phaseId) {
  const db = await getDb2();
  if (!db) throw new Error("DB unavailable");
  await db.insert(projectMembers).values({
    projectId,
    userId,
    projectRole,
    phaseId: phaseId ?? null
  });
  return { success: true };
}
async function removeProjectMember(projectId, userId, phaseId) {
  const db = await getDb2();
  if (!db) throw new Error("DB unavailable");
  if (phaseId != null) {
    await db.delete(projectMembers).where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId), eq(projectMembers.phaseId, phaseId)));
  } else {
    await db.delete(projectMembers).where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId), isNull(projectMembers.phaseId)));
  }
  return { success: true };
}
async function updateProjectMemberRole(projectId, userId, projectRole) {
  const db = await getDb2();
  if (!db) throw new Error("DB unavailable");
  await db.update(projectMembers).set({ projectRole }).where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)));
  return { success: true };
}
async function getProjectWithTeam(projectId) {
  const db = await getDb2();
  if (!db) return null;
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) return null;
  const members = await getProjectMembers(projectId);
  return { ...project, members };
}
async function getProcessOverview(dateFrom, dateTo) {
  const db = await getDb2();
  if (!db) return { users: [], timeEntries: [], leaveRequests: [], projectAssignments: [], projects: [] };
  const allUsers = await db.select({
    id: users.id,
    name: users.name,
    department: users.department,
    role: users.role,
    displayOrder: users.displayOrder
  }).from(users).where(eq(users.isActive, true)).orderBy(users.displayOrder, users.name);
  const entries = await db.execute(
    sql2`SELECT te.userId, te.date, te.projectId, te.startHour, te.startMin, te.endHour, te.endMin,
               te.taskName, te.activityType AS category, p.name AS projectName, p.code AS projectCode
        FROM time_entries te
        LEFT JOIN projects p ON p.id = te.projectId
        WHERE te.date >= ${dateFrom} AND te.date <= ${dateTo}
        ORDER BY te.date, te.startHour`
  );
  const leaves = await db.execute(
    sql2`SELECT lr.userId, lr.type, lr.startDate, lr.endDate, lr.totalDays, lr.status
        FROM leave_requests lr
        WHERE lr.status = 'aprobata'
          AND lr.startDate <= ${dateTo}
          AND lr.endDate >= ${dateFrom}
        ORDER BY lr.startDate`
  );
  const assignments = await db.execute(
    sql2`SELECT pm.userId, pm.projectId, pm.projectRole, p.name AS projectName, p.code AS projectCode,
               p.startDate AS projectStart, p.endDate AS projectEnd, p.status AS projectStatus
        FROM project_members pm
        JOIN projects p ON p.id = pm.projectId
        WHERE p.status = 'activ'
        ORDER BY pm.userId, p.name`
  );
  const activeProjects = await db.select().from(projects).where(eq(projects.status, "activ")).orderBy(projects.name);
  return {
    users: allUsers,
    timeEntries: entries[0] ?? [],
    leaveRequests: leaves[0] ?? [],
    projectAssignments: assignments[0] ?? [],
    projects: activeProjects
  };
}
async function deleteProject(projectId) {
  const db = await getDb2();
  if (!db) throw new Error("DB not available");
  await db.delete(taskSessions).where(eq(taskSessions.projectId, projectId));
  await db.delete(taskHourRequests).where(eq(taskHourRequests.projectId, projectId));
  await db.delete(projectTasks).where(eq(projectTasks.projectId, projectId));
  await db.delete(projectPhases).where(eq(projectPhases.projectId, projectId));
  await db.delete(projectMembers).where(eq(projectMembers.projectId, projectId));
  await db.update(timeEntries).set({ projectId: null }).where(eq(timeEntries.projectId, projectId));
  await db.delete(projects).where(eq(projects.id, projectId));
  return { success: true };
}
async function updateUsersDisplayOrder(orderList) {
  const db = await getDb2();
  if (!db) throw new Error("DB not available");
  for (const item of orderList) {
    await db.update(users).set({ displayOrder: item.displayOrder }).where(eq(users.id, item.userId));
  }
  return { success: true };
}
async function getRecurringActivities(userId) {
  const db = await getDb2();
  if (!db) return [];
  return db.select().from(recurringActivities).where(and(eq(recurringActivities.userId, userId), eq(recurringActivities.isActive, true))).orderBy(asc(recurringActivities.startHour));
}
async function createRecurringActivity(data) {
  const db = await getDb2();
  if (!db) throw new Error("DB not available");
  const [res] = await db.insert(recurringActivities).values({
    userId: data.userId,
    taskName: data.taskName,
    activityType: data.activityType,
    projectId: data.projectId ?? null,
    startHour: data.startHour,
    startMin: data.startMin,
    durationMinutes: data.durationMinutes,
    countInTime: data.countInTime,
    startDate: data.startDate,
    endDate: data.endDate ? data.endDate : null,
    isActive: true
  });
  return res;
}
async function updateRecurringActivity(id, userId, data) {
  const db = await getDb2();
  if (!db) throw new Error("DB not available");
  await db.update(recurringActivities).set(data).where(and(eq(recurringActivities.id, id), eq(recurringActivities.userId, userId)));
  return { success: true };
}
async function deleteRecurringActivity(id, userId) {
  const db = await getDb2();
  if (!db) throw new Error("DB not available");
  await db.update(recurringActivities).set({ isActive: false }).where(and(eq(recurringActivities.id, id), eq(recurringActivities.userId, userId)));
  return { success: true };
}
async function getRecurringExceptions(userId, dateFrom, dateTo) {
  const db = await getDb2();
  if (!db) return [];
  return db.select().from(recurringExceptions).where(and(
    eq(recurringExceptions.userId, userId),
    gte(recurringExceptions.exceptionDate, dateFrom),
    lte(recurringExceptions.exceptionDate, dateTo)
  ));
}
async function upsertRecurringException(data) {
  const db = await getDb2();
  if (!db) throw new Error("DB not available");
  const existing = await db.select().from(recurringExceptions).where(and(
    eq(recurringExceptions.recurringId, data.recurringId),
    eq(recurringExceptions.userId, data.userId),
    eq(recurringExceptions.exceptionDate, data.exceptionDate)
  )).limit(1);
  if (existing.length > 0) {
    await db.update(recurringExceptions).set({
      overrideStartHour: data.overrideStartHour ?? null,
      overrideStartMin: data.overrideStartMin ?? null,
      overrideDuration: data.overrideDuration ?? null,
      isDeleted: data.isDeleted ?? false
    }).where(eq(recurringExceptions.id, existing[0].id));
    return existing[0].id;
  } else {
    const [res] = await db.insert(recurringExceptions).values({
      recurringId: data.recurringId,
      userId: data.userId,
      exceptionDate: data.exceptionDate,
      overrideStartHour: data.overrideStartHour ?? null,
      overrideStartMin: data.overrideStartMin ?? null,
      overrideDuration: data.overrideDuration ?? null,
      isDeleted: data.isDeleted ?? false
    }).returning({ id: recurringExceptions.id });
    return res[0].id;
  }
}
async function createActivityInvitation(data) {
  const db = await getDb2();
  if (!db) throw new Error("DB not available");
  const [res] = await db.insert(activityInvitations).values({
    timeEntryId: data.timeEntryId,
    hostUserId: data.hostUserId,
    inviteeUserId: data.inviteeUserId,
    status: "pending"
  }).returning({ id: activityInvitations.id });
  return res[0].id;
}
async function getPendingInvitationsForUser(userId) {
  const db = await getDb2();
  if (!db) return [];
  const rows = await db.select({
    id: activityInvitations.id,
    status: activityInvitations.status,
    createdAt: activityInvitations.createdAt,
    timeEntryId: activityInvitations.timeEntryId,
    hostUserId: activityInvitations.hostUserId,
    taskName: timeEntries.taskName,
    activityType: timeEntries.activityType,
    date: timeEntries.date,
    startHour: timeEntries.startHour,
    startMin: timeEntries.startMin,
    endHour: timeEntries.endHour,
    endMin: timeEntries.endMin,
    projectId: timeEntries.projectId,
    hostName: users.name
  }).from(activityInvitations).innerJoin(timeEntries, eq(activityInvitations.timeEntryId, timeEntries.id)).innerJoin(users, eq(activityInvitations.hostUserId, users.id)).where(and(
    eq(activityInvitations.inviteeUserId, userId),
    eq(activityInvitations.status, "pending")
  )).orderBy(desc(activityInvitations.createdAt));
  return rows;
}
async function getInvitationsForEntry(timeEntryId) {
  const db = await getDb2();
  if (!db) return [];
  return db.select({
    id: activityInvitations.id,
    status: activityInvitations.status,
    inviteeUserId: activityInvitations.inviteeUserId,
    inviteeName: users.name,
    inviteeEntryId: activityInvitations.inviteeEntryId
  }).from(activityInvitations).innerJoin(users, eq(activityInvitations.inviteeUserId, users.id)).where(eq(activityInvitations.timeEntryId, timeEntryId));
}
async function respondToInvitation(id, inviteeUserId, accept) {
  const db = await getDb2();
  if (!db) throw new Error("DB not available");
  const inv = await db.select().from(activityInvitations).where(and(eq(activityInvitations.id, id), eq(activityInvitations.inviteeUserId, inviteeUserId))).limit(1);
  if (!inv.length) throw new Error("Invita\u021Bie neg\u0103sit\u0103");
  const invitation = inv[0];
  if (!accept) {
    await db.update(activityInvitations).set({ status: "declined", respondedAt: /* @__PURE__ */ new Date() }).where(eq(activityInvitations.id, id));
    return { accepted: false };
  }
  const hostEntry = await db.select().from(timeEntries).where(eq(timeEntries.id, invitation.timeEntryId)).limit(1);
  if (!hostEntry.length) throw new Error("Activitate neg\u0103sit\u0103");
  const he = hostEntry[0];
  const [ins] = await db.insert(timeEntries).values({
    userId: inviteeUserId,
    projectId: he.projectId ?? null,
    date: he.date,
    startHour: he.startHour,
    startMin: he.startMin,
    endHour: he.endHour,
    endMin: he.endMin,
    durationMinutes: he.durationMinutes,
    activityType: he.activityType,
    taskName: he.taskName,
    description: he.description,
    isBillable: he.isBillable,
    status: "salvat"
  }).returning({ id: timeEntries.id });
  const newEntryId = ins[0].id;
  await db.update(activityInvitations).set({ status: "accepted", respondedAt: /* @__PURE__ */ new Date(), inviteeEntryId: newEntryId }).where(eq(activityInvitations.id, id));
  return { accepted: true, newEntryId };
}
async function getEmployeeDriveFolder(userId) {
  const db = await getDb2();
  if (!db) return null;
  const result = await db.select().from(employeeDriveFolders).where(eq(employeeDriveFolders.userId, userId)).limit(1);
  return result[0] ?? null;
}
async function setEmployeeDriveFolder(userId, folderId, folderName) {
  const db = await getDb2();
  if (!db) return;
  const existing = await db.select().from(employeeDriveFolders).where(eq(employeeDriveFolders.userId, userId)).limit(1);
  if (existing.length > 0) {
    await db.update(employeeDriveFolders).set({ folderId, folderName }).where(eq(employeeDriveFolders.userId, userId));
  } else {
    await db.insert(employeeDriveFolders).values({ userId, folderId, folderName });
  }
}
async function getAllEmployeeDriveFolders() {
  const db = await getDb2();
  if (!db) return [];
  return db.select().from(employeeDriveFolders);
}
async function deleteEmployeeDriveFolder(userId) {
  const db = await getDb2();
  if (!db) return;
  await db.delete(employeeDriveFolders).where(eq(employeeDriveFolders.userId, userId));
}
async function getDriveSnapshots(folderId) {
  const db = await getDb2();
  if (!db) return [];
  return db.select().from(driveFileSnapshots).where(and(eq(driveFileSnapshots.folderId, folderId), isNull(driveFileSnapshots.deletedAt)));
}
async function getDriveSnapshotsByOwner(ownerUserId) {
  const db = await getDb2();
  if (!db) return [];
  return db.select().from(driveFileSnapshots).where(and(eq(driveFileSnapshots.ownerUserId, ownerUserId), isNull(driveFileSnapshots.deletedAt)));
}
async function upsertDriveSnapshot(data) {
  const db = await getDb2();
  if (!db) return;
  const existing = await db.select().from(driveFileSnapshots).where(eq(driveFileSnapshots.fileId, data.fileId)).limit(1);
  if (existing.length > 0) {
    await db.update(driveFileSnapshots).set({ ...data, deletedAt: null, updatedAt: /* @__PURE__ */ new Date() }).where(eq(driveFileSnapshots.fileId, data.fileId));
  } else {
    await db.insert(driveFileSnapshots).values(data);
  }
}
async function markDriveSnapshotDeleted(fileId) {
  const db = await getDb2();
  if (!db) return;
  await db.update(driveFileSnapshots).set({ deletedAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() }).where(eq(driveFileSnapshots.fileId, fileId));
}
async function getAllActiveDriveSnapshots() {
  const db = await getDb2();
  if (!db) return [];
  return db.select().from(driveFileSnapshots).where(isNull(driveFileSnapshots.deletedAt));
}
async function listProjects(opts) {
  const db = await getDb2();
  if (!db) return [];
  if (opts?.isAdmin) {
    const rows = await db.execute(
      sql2`SELECT p.id, ANY_VALUE(p.name) AS name, ANY_VALUE(p.code) AS code,
          ANY_VALUE(p.abbreviation) AS abbreviation, ANY_VALUE(p.emoji) AS emoji,
          ANY_VALUE(p.description) AS description, ANY_VALUE(p.clientName) AS clientName,
          ANY_VALUE(p.status) AS status, ANY_VALUE(p.managerId) AS managerId,
          ANY_VALUE(p.driveId) AS driveId, ANY_VALUE(p.color) AS color,
          ANY_VALUE(p.startDate) AS startDate, ANY_VALUE(p.endDate) AS endDate,
          ANY_VALUE(p.isGeneral) AS isGeneral, ANY_VALUE(p.createdAt) AS createdAt,
          ANY_VALUE(p.updatedAt) AS updatedAt,
          ANY_VALUE(u.name) AS managerName,
          COUNT(DISTINCT pm.userId) AS memberCount,
          COUNT(DISTINCT ph.id) AS phaseCount
          FROM projects p
          LEFT JOIN users u ON u.id = p.managerId
          LEFT JOIN project_members pm ON pm.projectId = p.id
          LEFT JOIN project_phases ph ON ph.projectId = p.id
          ${opts.status ? sql2`WHERE p.status = ${opts.status}` : sql2``}
          GROUP BY p.id
          ORDER BY ANY_VALUE(p.isGeneral) DESC, ANY_VALUE(p.name)`
    );
    return rows[0] ?? [];
  } else {
    const rows = await db.execute(
      sql2`SELECT p.id, ANY_VALUE(p.name) AS name, ANY_VALUE(p.code) AS code,
          ANY_VALUE(p.abbreviation) AS abbreviation, ANY_VALUE(p.emoji) AS emoji,
          ANY_VALUE(p.description) AS description, ANY_VALUE(p.clientName) AS clientName,
          ANY_VALUE(p.status) AS status, ANY_VALUE(p.managerId) AS managerId,
          ANY_VALUE(p.driveId) AS driveId, ANY_VALUE(p.color) AS color,
          ANY_VALUE(p.startDate) AS startDate, ANY_VALUE(p.endDate) AS endDate,
          ANY_VALUE(p.isGeneral) AS isGeneral, ANY_VALUE(p.createdAt) AS createdAt,
          ANY_VALUE(p.updatedAt) AS updatedAt,
          pm.projectRole AS myRole,
          COUNT(DISTINCT ph.id) AS phaseCount
          FROM projects p
          JOIN project_members pm ON pm.projectId = p.id AND pm.userId = ${opts?.userId ?? 0}
          LEFT JOIN project_phases ph ON ph.projectId = p.id
          ${opts?.status ? sql2`WHERE p.status = ${opts.status}` : sql2``}
          GROUP BY p.id, pm.projectRole
          ORDER BY ANY_VALUE(p.isGeneral) DESC, ANY_VALUE(p.name)`
    );
    return rows[0] ?? [];
  }
}
async function getProjectById(id) {
  const db = await getDb2();
  if (!db) return null;
  const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return project ?? null;
}
async function createProject(data) {
  const db = await getDb2();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(projects).values({
    name: data.name,
    code: data.code ?? null,
    abbreviation: data.abbreviation ?? null,
    emoji: data.emoji ?? null,
    clientName: data.clientName ?? null,
    status: data.status ?? "activ",
    isGeneral: data.isGeneral ?? false,
    managerId: data.managerId ?? null,
    startDate: data.startDate ? data.startDate : null,
    endDate: data.endDate ? data.endDate : null,
    description: data.description ?? null,
    color: data.color ?? "#FFCB09",
    driveId: data.driveId ?? null
  }).returning({ id: projects.id });
  return { success: true, id: result[0].id };
}
async function updateProject(id, data) {
  const db = await getDb2();
  if (!db) throw new Error("DB unavailable");
  await db.update(projects).set(data).where(eq(projects.id, id));
  return { success: true };
}
async function createProjectFromTemplate(data) {
  const db = await getDb2();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(projects).values({
    name: data.name,
    code: data.code ?? null,
    clientName: data.clientName ?? null,
    status: "activ",
    isGeneral: false,
    managerId: data.managerId ?? null,
    startDate: data.startDate ? data.startDate : null,
    endDate: data.endDate ? data.endDate : null,
    description: data.description ?? null,
    color: data.color ?? "#FFCB09"
  }).returning({ id: projects.id });
  const projectId = result[0].id;
  if (data.templateId) {
    const phases = await db.select().from(templatePhases).where(eq(templatePhases.templateId, data.templateId)).orderBy(templatePhases.displayOrder);
    for (const phase of phases) {
      const phResult = await db.insert(projectPhases).values({
        projectId,
        name: phase.name,
        code: phase.code,
        displayOrder: phase.displayOrder,
        budgetHours: "0",
        color: phase.color,
        status: "activa"
      }).returning({ id: projectPhases.id });
      const phaseId = phResult[0].id;
      const tasks = await db.select().from(templateTasks).where(eq(templateTasks.templatePhaseId, phase.id)).orderBy(templateTasks.displayOrder);
      for (const task of tasks) {
        await db.insert(projectTasks).values({
          phaseId,
          projectId,
          name: task.name,
          displayOrder: task.displayOrder,
          budgetHours: "0",
          minutesWorked: 0,
          status: "neinceputa"
        }).returning({ id: projectTasks.id });
      }
    }
  }
  return { success: true, id: projectId };
}
async function getProjectPhases(projectId) {
  const db = await getDb2();
  if (!db) return [];
  return db.select().from(projectPhases).where(eq(projectPhases.projectId, projectId)).orderBy(projectPhases.displayOrder);
}
async function createPhase(data) {
  const db = await getDb2();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(projectPhases).values({
    projectId: data.projectId,
    name: data.name,
    code: data.code ?? null,
    displayOrder: data.displayOrder ?? 0,
    budgetHours: data.budgetHours ?? "0",
    color: data.color ?? "#FFCB09",
    status: "activa"
  }).returning({ id: projectPhases.id });
  return { success: true, id: result[0].id };
}
async function updatePhase(id, data) {
  const db = await getDb2();
  if (!db) throw new Error("DB unavailable");
  await db.update(projectPhases).set(data).where(eq(projectPhases.id, id));
  return { success: true };
}
async function deletePhase(id) {
  const db = await getDb2();
  if (!db) throw new Error("DB unavailable");
  const tasks = await db.select({ id: projectTasks.id }).from(projectTasks).where(eq(projectTasks.phaseId, id));
  for (const task of tasks) {
    await db.delete(taskSessions).where(eq(taskSessions.taskId, task.id));
    await db.delete(taskHourRequests).where(eq(taskHourRequests.taskId, task.id));
  }
  await db.delete(projectTasks).where(eq(projectTasks.phaseId, id));
  await db.delete(projectPhases).where(eq(projectPhases.id, id));
  return { success: true };
}
async function getTasksByPhase(phaseId) {
  const db = await getDb2();
  if (!db) return [];
  const rows = await db.execute(
    sql2`SELECT pt.*, u.name AS assignedUserName, u.avatarUrl AS assignedUserAvatar
        FROM project_tasks pt
        LEFT JOIN users u ON u.id = pt.assignedUserId
        WHERE pt.phaseId = ${phaseId}
        ORDER BY pt.displayOrder, pt.id`
  );
  return rows[0] ?? [];
}
async function getTasksByProject(projectId, userId) {
  const db = await getDb2();
  if (!db) return [];
  if (userId) {
    const rows2 = await db.execute(
      sql2`SELECT pt.*, ph.name AS phaseName, ph.code AS phaseCode, ph.color AS phaseColor,
               u.name AS assignedUserName
          FROM project_tasks pt
          JOIN project_phases ph ON ph.id = pt.phaseId
          LEFT JOIN users u ON u.id = pt.assignedUserId
          WHERE pt.projectId = ${projectId} AND pt.assignedUserId = ${userId}
          ORDER BY ph.displayOrder, pt.displayOrder`
    );
    return rows2[0] ?? [];
  }
  const rows = await db.execute(
    sql2`SELECT pt.*, ph.name AS phaseName, ph.code AS phaseCode, ph.color AS phaseColor,
             u.name AS assignedUserName
        FROM project_tasks pt
        JOIN project_phases ph ON ph.id = pt.phaseId
        LEFT JOIN users u ON u.id = pt.assignedUserId
        WHERE pt.projectId = ${projectId}
        ORDER BY ph.displayOrder, pt.displayOrder`
  );
  return rows[0] ?? [];
}
async function createTask(data) {
  const db = await getDb2();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(projectTasks).values({
    phaseId: data.phaseId,
    projectId: data.projectId,
    name: data.name,
    description: data.description ?? null,
    displayOrder: data.displayOrder ?? 0,
    budgetHours: data.budgetHours ?? "0",
    minutesWorked: 0,
    status: "neinceputa",
    assignedUserId: data.assignedUserId ?? null
  }).returning({ id: projectTasks.id });
  return { success: true, id: result[0].id };
}
async function updateTask(id, data) {
  const db = await getDb2();
  if (!db) throw new Error("DB unavailable");
  await db.update(projectTasks).set(data).where(eq(projectTasks.id, id));
  return { success: true };
}
async function deleteTask(id) {
  const db = await getDb2();
  if (!db) throw new Error("DB unavailable");
  await db.delete(taskSessions).where(eq(taskSessions.taskId, id));
  await db.delete(taskHourRequests).where(eq(taskHourRequests.taskId, id));
  await db.delete(projectTasks).where(eq(projectTasks.id, id));
  return { success: true };
}
async function getActiveSession(userId) {
  const db = await getDb2();
  if (!db) return null;
  const rows = await db.execute(
    sql2`SELECT ts.*, pt.name AS taskName, pt.budgetHours, pt.minutesWorked,
             ph.name AS phaseName, ph.code AS phaseCode,
             p.name AS projectName, p.color AS projectColor
        FROM task_sessions ts
        JOIN project_tasks pt ON pt.id = ts.taskId
        JOIN project_phases ph ON ph.id = pt.phaseId
        JOIN projects p ON p.id = ts.projectId
        WHERE ts.userId = ${userId} AND ts.status IN ('activa', 'in_pauza')
        LIMIT 1`
  );
  return rows[0]?.[0] ?? null;
}
async function startTaskSession(userId, taskId, projectId) {
  const db = await getDb2();
  if (!db) throw new Error("DB unavailable");
  const existing = await getActiveSession(userId);
  if (existing) throw new Error("Ai deja o sesiune activ\u0103. Opre\u0219te-o \xEEnainte de a \xEEncepe alta.");
  const result = await db.insert(taskSessions).values({
    taskId,
    projectId,
    userId,
    startedAt: /* @__PURE__ */ new Date(),
    status: "activa",
    totalMinutes: 0
  }).returning({ id: taskSessions.id });
  const sessionId = result[0].id;
  await db.update(projectTasks).set({ status: "in_lucru" }).where(eq(projectTasks.id, taskId));
  return { success: true, sessionId };
}
async function pauseTaskSession(sessionId, userId) {
  const db = await getDb2();
  if (!db) throw new Error("DB unavailable");
  const [session] = await db.select().from(taskSessions).where(and(eq(taskSessions.id, sessionId), eq(taskSessions.userId, userId))).limit(1);
  if (!session) throw new Error("Sesiunea nu exist\u0103");
  if (session.status !== "activa") throw new Error("Sesiunea nu este activ\u0103");
  const now = /* @__PURE__ */ new Date();
  const startTime = session.resumedAt ?? session.startedAt;
  const minutesSinceStart = Math.floor((now.getTime() - startTime.getTime()) / 6e4);
  const newTotal = session.totalMinutes + minutesSinceStart;
  await db.update(taskSessions).set({ status: "in_pauza", pausedAt: now, totalMinutes: newTotal }).where(eq(taskSessions.id, sessionId));
  await db.update(projectTasks).set({ status: "in_pauza" }).where(eq(projectTasks.id, session.taskId));
  return { success: true, totalMinutes: newTotal };
}
async function resumeTaskSession(sessionId, userId) {
  const db = await getDb2();
  if (!db) throw new Error("DB unavailable");
  const [session] = await db.select().from(taskSessions).where(and(eq(taskSessions.id, sessionId), eq(taskSessions.userId, userId))).limit(1);
  if (!session) throw new Error("Sesiunea nu exist\u0103");
  if (session.status !== "in_pauza") throw new Error("Sesiunea nu este \xEEn pauz\u0103");
  await db.update(taskSessions).set({ status: "activa", resumedAt: /* @__PURE__ */ new Date() }).where(eq(taskSessions.id, sessionId));
  await db.update(projectTasks).set({ status: "in_lucru" }).where(eq(projectTasks.id, session.taskId));
  return { success: true };
}
async function stopTaskSession(sessionId, userId) {
  const db = await getDb2();
  if (!db) throw new Error("DB unavailable");
  const [session] = await db.select().from(taskSessions).where(and(eq(taskSessions.id, sessionId), eq(taskSessions.userId, userId))).limit(1);
  if (!session) throw new Error("Sesiunea nu exist\u0103");
  if (session.status === "finalizata") throw new Error("Sesiunea este deja finalizat\u0103");
  const now = /* @__PURE__ */ new Date();
  let finalMinutes = session.totalMinutes;
  if (session.status === "activa") {
    const startTime = session.resumedAt ?? session.startedAt;
    const minutesSinceStart = Math.floor((now.getTime() - startTime.getTime()) / 6e4);
    finalMinutes += minutesSinceStart;
  }
  await db.update(taskSessions).set({ status: "finalizata", endedAt: now, totalMinutes: finalMinutes }).where(eq(taskSessions.id, sessionId));
  const totalRows = await db.execute(
    sql2`SELECT COALESCE(SUM(totalMinutes), 0) AS total FROM task_sessions WHERE taskId = ${session.taskId} AND status = 'finalizata'`
  );
  const totalMinutesForTask = Number(totalRows[0]?.[0]?.total ?? 0);
  await db.update(projectTasks).set({ minutesWorked: totalMinutesForTask, status: "in_pauza" }).where(eq(projectTasks.id, session.taskId));
  const today = now.toISOString().split("T")[0];
  await upsertHourBank(userId, today, finalMinutes);
  await checkBudgetAlerts(session.taskId, session.projectId, totalMinutesForTask);
  return { success: true, totalMinutes: finalMinutes };
}
async function getSessionsForTask(taskId) {
  const db = await getDb2();
  if (!db) return [];
  const rows = await db.execute(
    sql2`SELECT ts.*, u.name AS userName FROM task_sessions ts JOIN users u ON u.id = ts.userId WHERE ts.taskId = ${taskId} ORDER BY ts.startedAt DESC`
  );
  return rows[0] ?? [];
}
async function upsertHourBank(userId, date2, additionalMinutes) {
  const db = await getDb2();
  if (!db) return;
  await db.execute(
    sql2`INSERT INTO hour_bank (userId, date, minutesWorked) VALUES (${userId}, ${date2}, ${additionalMinutes}) ON DUPLICATE KEY UPDATE minutesWorked = minutesWorked + ${additionalMinutes}`
  );
}
async function getHourBankForUser(userId, dateFrom, dateTo) {
  const db = await getDb2();
  if (!db) return [];
  const rows = await db.execute(
    sql2`SELECT hb.*, u.name AS userName FROM hour_bank hb JOIN users u ON u.id = hb.userId WHERE hb.userId = ${userId} ${dateFrom ? sql2`AND hb.date >= ${dateFrom}` : sql2``} ${dateTo ? sql2`AND hb.date <= ${dateTo}` : sql2``} ORDER BY hb.date DESC`
  );
  return rows[0] ?? [];
}
async function getHourBankAll(dateFrom, dateTo) {
  const db = await getDb2();
  if (!db) return [];
  const rows = await db.execute(
    sql2`SELECT hb.*, u.name AS userName, u.department FROM hour_bank hb JOIN users u ON u.id = hb.userId WHERE 1=1 ${dateFrom ? sql2`AND hb.date >= ${dateFrom}` : sql2``} ${dateTo ? sql2`AND hb.date <= ${dateTo}` : sql2``} ORDER BY hb.date DESC, u.name`
  );
  return rows[0] ?? [];
}
async function checkBudgetAlerts(taskId, projectId, minutesWorked) {
  const db = await getDb2();
  if (!db) return;
  const [task] = await db.select().from(projectTasks).where(eq(projectTasks.id, taskId)).limit(1);
  if (!task) return;
  const budgetMinutes = Number(task.budgetHours) * 60;
  if (budgetMinutes <= 0) return;
  const pct = minutesWorked / budgetMinutes * 100;
  const coordinators = await db.execute(
    sql2`SELECT pm.userId FROM project_members pm WHERE pm.projectId = ${projectId} AND pm.projectRole = 'coordonator' UNION SELECT u.id FROM users u WHERE u.role = 'admin'`
  );
  const coordIds = (coordinators[0] ?? []).map((r) => r.userId);
  const taskAssigneesRows = await db.execute(
    sql2`SELECT userId FROM task_assignees WHERE taskId = ${taskId}`
  );
  const taskAssigneeIds = (taskAssigneesRows[0] ?? []).map((r) => r.userId);
  const sendAlert = async (threshold, alertField) => {
    if (pct >= threshold && !task[alertField]) {
      await db.update(projectTasks).set({ [alertField]: true }).where(eq(projectTasks.id, taskId));
      const legacyAssigneeIds = task.assignedUserId ? [task.assignedUserId] : [];
      const allRecipients = Array.from(/* @__PURE__ */ new Set([...coordIds, ...taskAssigneeIds, ...legacyAssigneeIds]));
      const [phase] = await db.select().from(projectPhases).where(eq(projectPhases.id, task.phaseId)).limit(1);
      const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
      const title = `\u26A0\uFE0F Budget ${threshold}% \u2014 ${task.name}`;
      const content = `Task-ul "${task.name}" din faza "${phase?.name}" (${project?.name}) a atins ${threshold}% din bugetul alocat (${Math.round(minutesWorked / 60 * 10) / 10}h / ${task.budgetHours}h).`;
      for (const uid of allRecipients) {
        await db.insert(notifications).values({ userId: uid, type: "budget_alert", title, content, isRead: false });
      }
    }
  };
  await sendAlert(25, "alertSent25");
  await sendAlert(50, "alertSent50");
  await sendAlert(75, "alertSent75");
  await sendAlert(90, "alertSent90");
}
async function createHourRequest(data) {
  const db = await getDb2();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(taskHourRequests).values({
    taskId: data.taskId,
    projectId: data.projectId,
    userId: data.userId,
    requestedHours: data.requestedHours,
    justification: data.justification,
    status: "in_asteptare"
  });
  return { success: true, id: result[0].id };
}
async function getHourRequestsForProject(projectId) {
  const db = await getDb2();
  if (!db) return [];
  const rows = await db.execute(
    sql2`SELECT thr.*, u.name AS userName, pt.name AS taskName, ph.name AS phaseName
        FROM task_hour_requests thr JOIN users u ON u.id = thr.userId
        JOIN project_tasks pt ON pt.id = thr.taskId
        JOIN project_phases ph ON ph.id = pt.phaseId
        WHERE thr.projectId = ${projectId} ORDER BY thr.createdAt DESC`
  );
  return rows[0] ?? [];
}
async function getMyHourRequests(userId) {
  const db = await getDb2();
  if (!db) return [];
  const rows = await db.execute(
    sql2`SELECT thr.*, pt.name AS taskName, ph.name AS phaseName, p.name AS projectName
        FROM task_hour_requests thr JOIN project_tasks pt ON pt.id = thr.taskId
        JOIN project_phases ph ON ph.id = pt.phaseId
        JOIN projects p ON p.id = thr.projectId
        WHERE thr.userId = ${userId} ORDER BY thr.createdAt DESC`
  );
  return rows[0] ?? [];
}
async function reviewHourRequest(id, reviewedBy, status, reviewNote) {
  const db = await getDb2();
  if (!db) throw new Error("DB unavailable");
  const [req] = await db.select().from(taskHourRequests).where(eq(taskHourRequests.id, id)).limit(1);
  if (!req) throw new Error("Cererea nu exist\u0103");
  await db.update(taskHourRequests).set({ status, reviewedBy, reviewNote: reviewNote ?? null, reviewedAt: /* @__PURE__ */ new Date() }).where(eq(taskHourRequests.id, id));
  if (status === "aprobata") {
    const [task] = await db.select().from(projectTasks).where(eq(projectTasks.id, req.taskId)).limit(1);
    if (task) {
      const newBudget = Number(task.budgetHours) + Number(req.requestedHours);
      await db.update(projectTasks).set({ budgetHours: String(newBudget) }).where(eq(projectTasks.id, req.taskId));
    }
  }
  const statusLabel = status === "aprobata" ? "aprobat\u0103 \u2705" : "respins\u0103 \u274C";
  await db.insert(notifications).values({
    userId: req.userId,
    type: "hour_request",
    title: `Cerere ore ${statusLabel}`,
    content: `Cererea ta de ${req.requestedHours}h suplimentare a fost ${statusLabel}.${reviewNote ? ` Not\u0103: ${reviewNote}` : ""}`,
    isRead: false
  });
  return { success: true };
}
async function getDefaultTemplate() {
  const db = await getDb2();
  if (!db) return null;
  const [template] = await db.select().from(projectTemplates).where(eq(projectTemplates.isDefault, true)).limit(1);
  if (!template) return null;
  const phases = await db.select().from(templatePhases).where(eq(templatePhases.templateId, template.id)).orderBy(templatePhases.displayOrder);
  const result = [];
  for (const phase of phases) {
    const tasks = await db.select().from(templateTasks).where(eq(templateTasks.templatePhaseId, phase.id)).orderBy(templateTasks.displayOrder);
    result.push({ ...phase, tasks });
  }
  return { ...template, phases: result };
}
async function listTemplates() {
  const db = await getDb2();
  if (!db) return [];
  return db.select().from(projectTemplates).orderBy(desc(projectTemplates.isDefault), projectTemplates.name);
}
async function getProjectDetail(projectId, userId, isAdmin) {
  const db = await getDb2();
  if (!db) return null;
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) return null;
  if (!isAdmin && userId) {
    const [membership] = await db.select().from(projectMembers).where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId))).limit(1);
    if (!membership) return null;
  }
  const phases = await db.select().from(projectPhases).where(eq(projectPhases.projectId, projectId)).orderBy(projectPhases.displayOrder);
  const phasesWithTasks = [];
  for (const phase of phases) {
    const tasks = await getTasksByPhase(phase.id);
    phasesWithTasks.push({ ...phase, tasks });
  }
  const members = await db.execute(
    sql2`SELECT pm.*, u.name, u.email, u.department, u.jobTitle, u.avatarUrl, u.role AS globalRole
        FROM project_members pm JOIN users u ON u.id = pm.userId
        WHERE pm.projectId = ${projectId}
        ORDER BY FIELD(pm.projectRole, 'coordonator', 'membru', 'consultant'), u.name`
  );
  return { ...project, phases: phasesWithTasks, members: members[0] ?? [] };
}
var _db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    init_env();
    init_schema();
    _db = null;
  }
});

// server/googleDrive.ts
var googleDrive_exports = {};
__export(googleDrive_exports, {
  HUB_IC_ROOT_FOLDER_ID: () => HUB_IC_ROOT_FOLDER_ID,
  downloadFileStream: () => downloadFileStream,
  findFolderByName: () => findFolderByName,
  getAngajatiFolder: () => getAngajatiFolder,
  getFileMetadata: () => getFileMetadata,
  isFileInFolder: () => isFileInFolder,
  listFilesInFolder: () => listFilesInFolder,
  listSubfolders: () => listSubfolders,
  testDriveConnection: () => testDriveConnection
});
import { google as google2 } from "googleapis";
function getDriveClient() {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON environment variable is not set");
  }
  const credentials = JSON.parse(serviceAccountJson);
  const auth = new google2.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"]
  });
  return google2.drive({ version: "v3", auth });
}
async function listFilesInFolder(folderId) {
  const drive = getDriveClient();
  const response = await drive.files.list({
    q: `'${folderId}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id, name, mimeType, modifiedTime, size)",
    orderBy: "name"
  });
  const files = response.data.files ?? [];
  return files.map((f) => ({
    id: f.id,
    name: f.name,
    mimeType: f.mimeType,
    modifiedTime: f.modifiedTime ?? null,
    size: f.size ?? null,
    previewUrl: `https://drive.google.com/file/d/${f.id}/preview`
  }));
}
async function listSubfolders(folderId) {
  const drive = getDriveClient();
  const response = await drive.files.list({
    q: `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id, name)",
    orderBy: "name"
  });
  const folders = response.data.files ?? [];
  return folders.map((f) => ({
    id: f.id,
    name: f.name
  }));
}
async function findFolderByName(parentFolderId, name) {
  const drive = getDriveClient();
  const response = await drive.files.list({
    q: `'${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and name = '${name.replace(/'/g, "\\'")}' and trashed = false`,
    fields: "files(id, name)"
  });
  const folders = response.data.files ?? [];
  if (folders.length === 0) return null;
  return { id: folders[0].id, name: folders[0].name };
}
async function getAngajatiFolder() {
  return findFolderByName(HUB_IC_ROOT_FOLDER_ID, "Angaja\u021Bi");
}
async function downloadFileStream(fileId) {
  const drive = getDriveClient();
  const meta = await drive.files.get({
    fileId,
    fields: "id, name, mimeType, size"
  });
  const mimeType = meta.data.mimeType ?? "application/octet-stream";
  const name = meta.data.name ?? "document";
  const size = meta.data.size ?? null;
  if (mimeType.startsWith("application/vnd.google-apps.")) {
    const exportRes = await drive.files.export(
      { fileId, mimeType: "application/pdf" },
      { responseType: "stream" }
    );
    return { stream: exportRes.data, mimeType: "application/pdf", name: name + ".pdf", size: null };
  }
  const dlRes = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "stream" }
  );
  return { stream: dlRes.data, mimeType, name, size };
}
async function getFileMetadata(fileId) {
  try {
    const drive = getDriveClient();
    const res = await drive.files.get({
      fileId,
      fields: "id, name, mimeType, parents"
    });
    return {
      id: res.data.id,
      name: res.data.name,
      mimeType: res.data.mimeType,
      parents: res.data.parents ?? []
    };
  } catch {
    return null;
  }
}
async function isFileInFolder(fileId, folderId) {
  const meta = await getFileMetadata(fileId);
  if (!meta) return false;
  return meta.parents.includes(folderId);
}
async function testDriveConnection() {
  try {
    const drive = getDriveClient();
    await drive.files.get({
      fileId: HUB_IC_ROOT_FOLDER_ID,
      fields: "id, name"
    });
    return true;
  } catch {
    return false;
  }
}
var HUB_IC_ROOT_FOLDER_ID;
var init_googleDrive = __esm({
  "server/googleDrive.ts"() {
    "use strict";
    HUB_IC_ROOT_FOLDER_ID = "1OL49nEvwiwRwPmrTWJUqJpAoUhB3dwRZ";
  }
});

// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/_core/oauth.ts
init_db();
import { google } from "googleapis";

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// server/_core/oauth.ts
init_env();

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
init_db();
init_env();
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function getOAuth2Client(redirectUri) {
  return new google.auth.OAuth2(
    ENV.googleClientId,
    ENV.googleClientSecret,
    redirectUri
  );
}
function getGoogleAuthUrl(origin) {
  const redirectUri = `${origin}/api/oauth/callback`;
  const oauth2Client = getOAuth2Client(redirectUri);
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["openid", "email", "profile"],
    state: Buffer.from(JSON.stringify({ origin })).toString("base64")
  });
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/google-url", (req, res) => {
    const origin = getQueryParam(req, "origin") ?? `${req.protocol}://${req.get("host")}`;
    const url = getGoogleAuthUrl(origin);
    res.json({ url });
  });
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    let origin = "/";
    try {
      const decoded = JSON.parse(Buffer.from(state, "base64").toString("utf-8"));
      origin = decoded.origin ?? "/";
    } catch {
      origin = "/";
    }
    const redirectUri = `${origin}/api/oauth/callback`;
    try {
      const oauth2Client = getOAuth2Client(redirectUri);
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);
      const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
      const { data: googleUser } = await oauth2.userinfo.get();
      const email = googleUser.email ?? "";
      const googleId = googleUser.id ?? "";
      const name = googleUser.name ?? "";
      if (!email || !googleId) {
        res.status(400).json({ error: "Could not get user info from Google" });
        return;
      }
      if (!email.endsWith("@ingineriecreativa.ro")) {
        const errorUrl = `${origin}/?error=unauthorized_domain&email=${encodeURIComponent(email)}`;
        res.redirect(302, errorUrl);
        return;
      }
      const openId = `google:${googleId}`;
      await upsertUser({
        openId,
        name: name || null,
        email: email || null,
        loginMethod: "google",
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(openId, {
        name,
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Google callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/reportRoutes.ts
init_db();

// server/reports.ts
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var FONT_DIR = path.join(__dirname, "fonts");
var FONT_REGULAR = path.join(FONT_DIR, "Roboto-Regular.ttf");
var FONT_BOLD = path.join(FONT_DIR, "Roboto-Bold.ttf");
async function downloadFont(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      res.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve();
      });
    }).on("error", (err) => {
      fs.unlink(dest, () => {
      });
      reject(err);
    });
  });
}
async function ensureFonts() {
  if (!fs.existsSync(FONT_DIR)) fs.mkdirSync(FONT_DIR, { recursive: true });
  const CDN_REGULAR = "https://d2xsxph8kpxj0f.cloudfront.net/310519663448137464/2gvgk32MDhEEiC7DrEzbf4/Roboto-Regular_1db39a61.ttf";
  const CDN_BOLD = "https://d2xsxph8kpxj0f.cloudfront.net/310519663448137464/2gvgk32MDhEEiC7DrEzbf4/Roboto-Bold_8a1fdd58.ttf";
  if (!fs.existsSync(FONT_REGULAR)) await downloadFont(CDN_REGULAR, FONT_REGULAR);
  if (!fs.existsSync(FONT_BOLD)) await downloadFont(CDN_BOLD, FONT_BOLD);
}
var BRAND = {
  yellow: "FFCB09",
  black: "221F1F",
  white: "FFFFFF",
  gray: "F5F5F5",
  grayDark: "CCCCCC",
  grayText: "666666"
};
var COMPANY = "Inginerie Creativ\u0103 SRL";
function fmtTime(d) {
  if (!d) return "\u2014";
  const dt = new Date(d);
  return `${String(dt.getUTCHours()).padStart(2, "0")}:${String(dt.getUTCMinutes()).padStart(2, "0")}`;
}
function fmtDuration(minutes) {
  if (!minutes) return "0h 00m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}
function fmtDate(d) {
  if (!d) return "\u2014";
  const dt = new Date(d);
  const days = ["Dum", "Lun", "Mar", "Mie", "Joi", "Vin", "S\xE2m"];
  const months = ["Ian", "Feb", "Mar", "Apr", "Mai", "Iun", "Iul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${days[dt.getUTCDay()]}, ${dt.getUTCDate()} ${months[dt.getUTCMonth()]}`;
}
function monthName(month, year) {
  const months = [
    "Ianuarie",
    "Februarie",
    "Martie",
    "Aprilie",
    "Mai",
    "Iunie",
    "Iulie",
    "August",
    "Septembrie",
    "Octombrie",
    "Noiembrie",
    "Decembrie"
  ];
  return `${months[month - 1]} ${year}`;
}
function locationLabel(type) {
  const map = {
    bucuresti: "Bucure\u0219ti (Caracas 4)",
    cluj: "Cluj (KITE Plopilor 68)",
    miercurea_ciuc: "Miercurea-Ciuc",
    brasov: "Bra\u0219ov (IASC Livezilor 28)",
    eveniment: "Eveniment",
    deplasare: "Deplasare",
    vizita_santier: "Vizit\u0103 \u0218antier",
    telemunca: "Telemunc\u0103",
    concediu: "Concediu",
    medical: "Medical",
    liber_legal: "Liber legal",
    absent: "Absent",
    recuperare: "Recuperare"
  };
  return map[type] ?? type;
}
function applyHeaderStyle(cell, bg = BRAND.yellow, fgColor = BRAND.black) {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${bg}` } };
  cell.font = { bold: true, color: { argb: `FF${fgColor}` }, size: 10, name: "Calibri" };
  cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  cell.border = {
    top: { style: "thin", color: { argb: `FF${BRAND.black}` } },
    bottom: { style: "thin", color: { argb: `FF${BRAND.black}` } },
    left: { style: "thin", color: { argb: `FFCCCCCC` } },
    right: { style: "thin", color: { argb: `FFCCCCCC` } }
  };
}
function applyDataStyle(cell, isEven, bold = false) {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: isEven ? `FFF9F9F9` : `FFFFFFFF` } };
  cell.font = { bold, color: { argb: `FF${BRAND.black}` }, size: 9, name: "Calibri" };
  cell.alignment = { vertical: "middle", horizontal: "center" };
  cell.border = {
    bottom: { style: "hair", color: { argb: `FFDDDDDD` } },
    left: { style: "hair", color: { argb: `FFEEEEEE` } },
    right: { style: "hair", color: { argb: `FFEEEEEE` } }
  };
}
function applyTotalStyle(cell) {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${BRAND.yellow}` } };
  cell.font = { bold: true, color: { argb: `FF${BRAND.black}` }, size: 10, name: "Calibri" };
  cell.alignment = { vertical: "middle", horizontal: "center" };
  cell.border = {
    top: { style: "medium", color: { argb: `FF${BRAND.black}` } },
    bottom: { style: "medium", color: { argb: `FF${BRAND.black}` } }
  };
}
function addExcelBranding(ws, title, subtitle, colCount) {
  ws.addRow([]);
  const r1 = ws.lastRow;
  ws.mergeCells(`A${r1.number}:${String.fromCharCode(64 + colCount)}${r1.number}`);
  const c1 = r1.getCell(1);
  c1.value = COMPANY;
  c1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${BRAND.black}` } };
  c1.font = { bold: true, color: { argb: `FF${BRAND.yellow}` }, size: 14, name: "Calibri" };
  c1.alignment = { vertical: "middle", horizontal: "center" };
  r1.height = 28;
  ws.addRow([]);
  const r2 = ws.lastRow;
  ws.mergeCells(`A${r2.number}:${String.fromCharCode(64 + colCount)}${r2.number}`);
  const c2 = r2.getCell(1);
  c2.value = title;
  c2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${BRAND.yellow}` } };
  c2.font = { bold: true, color: { argb: `FF${BRAND.black}` }, size: 12, name: "Calibri" };
  c2.alignment = { vertical: "middle", horizontal: "center" };
  r2.height = 22;
  ws.addRow([]);
  const r3 = ws.lastRow;
  ws.mergeCells(`A${r3.number}:${String.fromCharCode(64 + colCount)}${r3.number}`);
  const c3 = r3.getCell(1);
  c3.value = subtitle;
  c3.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FFF5F5F5` } };
  c3.font = { color: { argb: `FF${BRAND.grayText}` }, size: 9, name: "Calibri" };
  c3.alignment = { vertical: "middle", horizontal: "center" };
  r3.height = 16;
  ws.addRow([]);
  ws.lastRow.height = 6;
  return 4;
}
async function generatePontajLunarExcel(employeeName, year, month, rows) {
  const wb = new ExcelJS.Workbook();
  wb.creator = COMPANY;
  wb.created = /* @__PURE__ */ new Date();
  const ws = wb.addWorksheet("Pontaj lunar", { pageSetup: { orientation: "landscape", fitToPage: true } });
  ws.pageSetup.margins = { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 };
  const cols = ["Data", "Loca\u021Bie / Tip", "Intrare", "Ie\u0219ire", "Pauz\u0103", "Total ore", "Proiect", "Not\u0103"];
  const colWidths = [18, 28, 10, 10, 10, 12, 20, 35];
  ws.columns = colWidths.map((w, i) => ({ width: w, key: `c${i}` }));
  addExcelBranding(ws, `Pontaj lunar \u2014 ${employeeName}`, `Perioada: ${monthName(month, year)} | Generat: ${(/* @__PURE__ */ new Date()).toLocaleDateString("ro-RO")}`, cols.length);
  const headerRow = ws.addRow(cols);
  headerRow.height = 20;
  headerRow.eachCell((cell) => applyHeaderStyle(cell));
  let totalMin = 0;
  let presentDays = 0;
  const presentTypes = ["bucuresti", "cluj", "miercurea_ciuc", "brasov", "eveniment", "deplasare", "vizita_santier", "telemunca"];
  rows.forEach((r, idx) => {
    const isEven = idx % 2 === 0;
    const dataRow = ws.addRow([
      fmtDate(r.date),
      locationLabel(r.type),
      fmtTime(r.checkIn),
      fmtTime(r.checkOut),
      r.breakMinutes ? `${r.breakMinutes}m` : "\u2014",
      fmtDuration(r.totalMinutes),
      r.projectName ?? "\u2014",
      r.notes ?? "\u2014"
    ]);
    dataRow.height = 16;
    dataRow.eachCell((cell) => applyDataStyle(cell, isEven));
    dataRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
    dataRow.getCell(2).alignment = { horizontal: "left", vertical: "middle" };
    dataRow.getCell(7).alignment = { horizontal: "left", vertical: "middle" };
    dataRow.getCell(8).alignment = { horizontal: "left", vertical: "middle", wrapText: true };
    totalMin += r.totalMinutes ?? 0;
    if (presentTypes.includes(r.type)) presentDays++;
  });
  const totalRow = ws.addRow(["TOTAL", `${presentDays} zile prezent`, "", "", "", fmtDuration(totalMin), "", ""]);
  totalRow.height = 20;
  totalRow.eachCell((cell) => applyTotalStyle(cell));
  ws.mergeCells(`A${totalRow.number}:B${totalRow.number}`);
  ws.addRow([]);
  const footerRow = ws.addRow([`Document generat automat de ${COMPANY} \u2014 Portal Intern | ${(/* @__PURE__ */ new Date()).toLocaleString("ro-RO")}`]);
  ws.mergeCells(`A${footerRow.number}:H${footerRow.number}`);
  footerRow.getCell(1).font = { size: 8, color: { argb: `FF${BRAND.grayText}` }, italic: true };
  return wb.xlsx.writeBuffer();
}
async function generateSumarEchipaExcel(year, month, rows) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Sumar echip\u0103", { pageSetup: { orientation: "landscape", fitToPage: true } });
  const cols = ["Angajat", "Departament", "Zile prezent", "Total ore", "Concediu", "Medical", "Liber legal", "Recuperare", "Absent"];
  const colWidths = [28, 22, 14, 14, 12, 12, 12, 12, 12];
  ws.columns = colWidths.map((w, i) => ({ width: w, key: `c${i}` }));
  addExcelBranding(ws, `Sumar lunar echip\u0103`, `Perioada: ${monthName(month, year)} | ${rows.length} angaja\u021Bi | Generat: ${(/* @__PURE__ */ new Date()).toLocaleDateString("ro-RO")}`, cols.length);
  const headerRow = ws.addRow(cols);
  headerRow.height = 20;
  headerRow.eachCell((cell) => applyHeaderStyle(cell));
  let totalPresent = 0, totalMinAll = 0;
  rows.forEach((r, idx) => {
    const isEven = idx % 2 === 0;
    const dataRow = ws.addRow([
      r.name,
      r.department ?? "\u2014",
      r.presentDays,
      fmtDuration(r.totalMinutes),
      r.concediuDays || "\u2014",
      r.medicalDays || "\u2014",
      r.liberLegalDays || "\u2014",
      r.recuperareDays || "\u2014",
      r.absentDays || "\u2014"
    ]);
    dataRow.height = 16;
    dataRow.eachCell((cell) => applyDataStyle(cell, isEven));
    dataRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
    dataRow.getCell(2).alignment = { horizontal: "left", vertical: "middle" };
    totalPresent += r.presentDays;
    totalMinAll += r.totalMinutes;
  });
  const totalRow = ws.addRow(["TOTAL", `${rows.length} angaja\u021Bi`, totalPresent, fmtDuration(totalMinAll), "", "", "", "", ""]);
  totalRow.height = 20;
  totalRow.eachCell((cell) => applyTotalStyle(cell));
  return wb.xlsx.writeBuffer();
}
async function generateAbsenteExcel(year, month, rows) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Concedii & Absen\u021Be");
  const cols = ["Angajat", "Data", "Tip absen\u021B\u0103", "Not\u0103"];
  const colWidths = [30, 20, 22, 45];
  ws.columns = colWidths.map((w, i) => ({ width: w, key: `c${i}` }));
  addExcelBranding(ws, `Concedii & Absen\u021Be`, `Perioada: ${monthName(month, year)} | ${rows.length} \xEEnregistr\u0103ri | Generat: ${(/* @__PURE__ */ new Date()).toLocaleDateString("ro-RO")}`, cols.length);
  const headerRow = ws.addRow(cols);
  headerRow.height = 20;
  headerRow.eachCell((cell) => applyHeaderStyle(cell));
  rows.forEach((r, idx) => {
    const dataRow = ws.addRow([r.name, fmtDate(r.date), locationLabel(r.type), r.notes ?? "\u2014"]);
    dataRow.height = 16;
    dataRow.eachCell((cell) => applyDataStyle(cell, idx % 2 === 0));
    dataRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
    dataRow.getCell(4).alignment = { horizontal: "left", vertical: "middle", wrapText: true };
  });
  const totalRow = ws.addRow([`Total: ${rows.length} \xEEnregistr\u0103ri`, "", "", ""]);
  totalRow.height = 18;
  totalRow.eachCell((cell) => applyTotalStyle(cell));
  return wb.xlsx.writeBuffer();
}
async function generateOreSuplimentareExcel(year, month, normMinutes, rows) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Ore suplimentare");
  const cols = ["Angajat", "Data", "Loca\u021Bie", "Total ore", "Ore suplimentare"];
  const colWidths = [30, 20, 28, 14, 18];
  ws.columns = colWidths.map((w, i) => ({ width: w, key: `c${i}` }));
  addExcelBranding(ws, `Ore suplimentare`, `Perioada: ${monthName(month, year)} | Norm\u0103 zilnic\u0103: ${fmtDuration(normMinutes)} | Generat: ${(/* @__PURE__ */ new Date()).toLocaleDateString("ro-RO")}`, cols.length);
  const headerRow = ws.addRow(cols);
  headerRow.height = 20;
  headerRow.eachCell((cell) => applyHeaderStyle(cell));
  let totalOver = 0;
  rows.forEach((r, idx) => {
    const dataRow = ws.addRow([r.name, fmtDate(r.date), locationLabel(r.type), fmtDuration(r.totalMinutes), fmtDuration(r.overMinutes)]);
    dataRow.height = 16;
    dataRow.eachCell((cell) => applyDataStyle(cell, idx % 2 === 0));
    dataRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
    dataRow.getCell(3).alignment = { horizontal: "left", vertical: "middle" };
    const overCell = dataRow.getCell(5);
    overCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FFFFF9C4` } };
    overCell.font = { bold: true, color: { argb: `FF${BRAND.black}` }, size: 9 };
    totalOver += r.overMinutes;
  });
  const totalRow = ws.addRow(["TOTAL ore suplimentare", "", "", "", fmtDuration(totalOver)]);
  totalRow.height = 20;
  totalRow.eachCell((cell) => applyTotalStyle(cell));
  return wb.xlsx.writeBuffer();
}
async function generatePontajProiectExcel(year, month, rows) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Pontaj per proiect");
  const cols = ["Proiect", "Angajat", "Data", "Loca\u021Bie", "Ore lucrate", "Not\u0103"];
  const colWidths = [30, 28, 18, 22, 14, 35];
  ws.columns = colWidths.map((w, i) => ({ width: w, key: `c${i}` }));
  addExcelBranding(ws, `Pontaj per proiect`, `Perioada: ${monthName(month, year)} | Generat: ${(/* @__PURE__ */ new Date()).toLocaleDateString("ro-RO")}`, cols.length);
  const headerRow = ws.addRow(cols);
  headerRow.height = 20;
  headerRow.eachCell((cell) => applyHeaderStyle(cell));
  let totalMin = 0;
  let lastProject = "";
  rows.forEach((r, idx) => {
    const isNewProject = r.projectName !== lastProject;
    if (isNewProject && idx > 0) {
      const sepRow = ws.addRow(["", "", "", "", "", ""]);
      sepRow.height = 6;
    }
    const dataRow = ws.addRow([
      isNewProject ? r.projectName : "",
      r.name,
      fmtDate(r.date),
      locationLabel(r.type),
      fmtDuration(r.totalMinutes),
      r.notes ?? "\u2014"
    ]);
    dataRow.height = 16;
    dataRow.eachCell((cell) => applyDataStyle(cell, idx % 2 === 0));
    dataRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
    dataRow.getCell(1).font = { bold: isNewProject, color: { argb: `FF${BRAND.black}` }, size: 9 };
    dataRow.getCell(2).alignment = { horizontal: "left", vertical: "middle" };
    dataRow.getCell(6).alignment = { horizontal: "left", vertical: "middle", wrapText: true };
    totalMin += r.totalMinutes ?? 0;
    lastProject = r.projectName;
  });
  const totalRow = ws.addRow(["TOTAL", "", "", "", fmtDuration(totalMin), ""]);
  totalRow.height = 20;
  totalRow.eachCell((cell) => applyTotalStyle(cell));
  return wb.xlsx.writeBuffer();
}
async function generatePDF(title, subtitle, headers, rows, totalsRow) {
  await ensureFonts();
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margins: { top: 40, bottom: 40, left: 30, right: 30 }
    });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    const pageW = doc.page.width;
    const pageH = doc.page.height;
    const margin = 30;
    const contentW = pageW - margin * 2;
    doc.registerFont("Regular", FONT_REGULAR);
    doc.registerFont("Bold", FONT_BOLD);
    doc.rect(0, 0, pageW, 50).fill("#221F1F");
    doc.fontSize(18).fillColor("#FFCB09").font("Bold").text(COMPANY, margin, 14, { width: contentW * 0.6 });
    doc.fontSize(9).fillColor("#FFFFFF").font("Regular").text(`Generat: ${(/* @__PURE__ */ new Date()).toLocaleString("ro-RO")}`, margin + contentW * 0.6, 20, { width: contentW * 0.4, align: "right" });
    doc.rect(0, 50, pageW, 28).fill("#FFCB09");
    doc.fontSize(13).fillColor("#221F1F").font("Bold").text(title, margin, 57, { width: contentW });
    doc.rect(0, 78, pageW, 18).fill("#F5F5F5");
    doc.fontSize(8).fillColor("#666666").font("Regular").text(subtitle, margin, 83, { width: contentW });
    let y = 104;
    const colW = contentW / headers.length;
    doc.rect(margin, y, contentW, 18).fill("#221F1F");
    headers.forEach((h, i) => {
      doc.fontSize(8).fillColor("#FFCB09").font("Bold").text(h, margin + i * colW + 3, y + 5, { width: colW - 6, align: "center" });
    });
    y += 18;
    rows.forEach((row, rowIdx) => {
      const rowH = 16;
      if (y + rowH > pageH - 50) {
        doc.addPage();
        y = 40;
        doc.rect(margin, y, contentW, 18).fill("#221F1F");
        headers.forEach((h, i) => {
          doc.fontSize(8).fillColor("#FFCB09").font("Bold").text(h, margin + i * colW + 3, y + 5, { width: colW - 6, align: "center" });
        });
        y += 18;
      }
      const bg = rowIdx % 2 === 0 ? "#FFFFFF" : "#F9F9F9";
      doc.rect(margin, y, contentW, rowH).fill(bg);
      doc.rect(margin, y, contentW, rowH).stroke("#EEEEEE");
      row.forEach((cell, i) => {
        doc.fontSize(8).fillColor("#221F1F").font("Regular").text(cell ?? "\u2014", margin + i * colW + 3, y + 4, { width: colW - 6, align: "center", lineBreak: false });
      });
      y += rowH;
    });
    if (totalsRow) {
      doc.rect(margin, y, contentW, 18).fill("#FFCB09");
      totalsRow.forEach((cell, i) => {
        doc.fontSize(9).fillColor("#221F1F").font("Bold").text(cell ?? "", margin + i * colW + 3, y + 5, { width: colW - 6, align: "center", lineBreak: false });
      });
      y += 18;
    }
    doc.rect(0, pageH - 30, pageW, 30).fill("#221F1F");
    doc.fontSize(7).fillColor("#AAAAAA").font("Regular").text(`${COMPANY} \u2014 Document generat automat de Portalul Intern. Confiden\u021Bial.`, margin, pageH - 20, { width: contentW, align: "center" });
    doc.end();
  });
}

// server/reportRoutes.ts
async function requireHR(req, res) {
  try {
    const user = await sdk.authenticateRequest(req);
    const hrRoles = ["admin"];
    if (!user || !hrRoles.includes(user.role)) {
      res.status(403).json({ error: "Acces interzis. Necesit\u0103 rol HR/Admin." });
      return null;
    }
    return user;
  } catch {
    res.status(401).json({ error: "Neautentificat." });
    return null;
  }
}
function parseParams(req) {
  const year = parseInt(req.query.year) || (/* @__PURE__ */ new Date()).getFullYear();
  const month = parseInt(req.query.month) || (/* @__PURE__ */ new Date()).getMonth() + 1;
  const userId = req.query.userId ? parseInt(req.query.userId) : void 0;
  return { year, month, userId };
}
function sanitizeFilename(s) {
  return s.replace(/[^a-zA-Z0-9_\-\.]/g, "_");
}
function registerReportRoutes(app) {
  app.get("/api/reports/pontaj-lunar/excel", async (req, res) => {
    const user = await requireHR(req, res);
    if (!user) return;
    const { year, month, userId } = parseParams(req);
    if (!userId) {
      res.status(400).json({ error: "userId lips\u0103" });
      return;
    }
    const rows = await getPontajLunarAngajat(userId, year, month);
    const users2 = await getActiveUsers();
    const emp = users2.find((u) => u.id === userId);
    const empName = emp?.name ?? `Angajat_${userId}`;
    const buffer = await generatePontajLunarExcel(empName, year, month, rows.map((r) => ({
      date: r.date,
      checkIn: r.checkIn,
      checkOut: r.checkOut,
      type: r.type,
      breakMinutes: r.breakMinutes,
      totalMinutes: r.totalMinutes,
      notes: r.notes,
      projectName: r.projectName
    })));
    const filename = sanitizeFilename(`Pontaj_${empName}_${year}_${String(month).padStart(2, "0")}.xlsx`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(Buffer.from(buffer));
  });
  app.get("/api/reports/pontaj-lunar/pdf", async (req, res) => {
    const user = await requireHR(req, res);
    if (!user) return;
    const { year, month, userId } = parseParams(req);
    if (!userId) {
      res.status(400).json({ error: "userId lips\u0103" });
      return;
    }
    const rows = await getPontajLunarAngajat(userId, year, month);
    const users2 = await getActiveUsers();
    const emp = users2.find((u) => u.id === userId);
    const empName = emp?.name ?? `Angajat_${userId}`;
    const totalMin = rows.reduce((a, r) => a + (r.totalMinutes ?? 0), 0);
    const buffer = await generatePDF(
      `Pontaj lunar \u2014 ${empName}`,
      `Perioada: ${monthName2(month, year)} | Total: ${fmtDuration(totalMin)}`,
      ["Data", "Loca\u021Bie", "Intrare", "Ie\u0219ire", "Pauz\u0103", "Total", "Proiect"],
      rows.map((r) => [
        fmtDate(r.date),
        locationLabel(r.type),
        fmtTime(r.checkIn),
        fmtTime(r.checkOut),
        r.breakMinutes ? `${r.breakMinutes}m` : "\u2014",
        fmtDuration(r.totalMinutes),
        r.projectName ?? "\u2014"
      ]),
      ["TOTAL", "", "", "", "", fmtDuration(totalMin), ""]
    );
    const filename = sanitizeFilename(`Pontaj_${empName}_${year}_${String(month).padStart(2, "0")}.pdf`);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  });
  app.get("/api/reports/sumar-echipa/excel", async (req, res) => {
    const user = await requireHR(req, res);
    if (!user) return;
    const { year, month } = parseParams(req);
    const rows = await getSumarEchipaLunar(year, month);
    const buffer = await generateSumarEchipaExcel(year, month, rows);
    const filename = `Sumar_Echipa_${year}_${String(month).padStart(2, "0")}.xlsx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(Buffer.from(buffer));
  });
  app.get("/api/reports/sumar-echipa/pdf", async (req, res) => {
    const user = await requireHR(req, res);
    if (!user) return;
    const { year, month } = parseParams(req);
    const rows = await getSumarEchipaLunar(year, month);
    const buffer = await generatePDF(
      `Sumar lunar echip\u0103`,
      `Perioada: ${monthName2(month, year)} | ${rows.length} angaja\u021Bi`,
      ["Angajat", "Departament", "Zile prez.", "Total ore", "CO", "Medical", "Lib.legal", "Absent"],
      rows.map((r) => [
        r.name,
        r.department ?? "\u2014",
        String(r.presentDays),
        fmtDuration(r.totalMinutes),
        r.concediuDays ? String(r.concediuDays) : "\u2014",
        r.medicalDays ? String(r.medicalDays) : "\u2014",
        r.liberLegalDays ? String(r.liberLegalDays) : "\u2014",
        r.absentDays ? String(r.absentDays) : "\u2014"
      ]),
      [
        "TOTAL",
        `${rows.length} angaja\u021Bi`,
        String(rows.reduce((a, r) => a + r.presentDays, 0)),
        fmtDuration(rows.reduce((a, r) => a + r.totalMinutes, 0)),
        "",
        "",
        "",
        ""
      ]
    );
    const filename = `Sumar_Echipa_${year}_${String(month).padStart(2, "0")}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  });
  app.get("/api/reports/absente/excel", async (req, res) => {
    const user = await requireHR(req, res);
    if (!user) return;
    const { year, month } = parseParams(req);
    const rows = await getAbsenteLunare(year, month);
    const buffer = await generateAbsenteExcel(year, month, rows.map((r) => ({
      name: r.name ?? "\u2014",
      date: r.date,
      type: r.type,
      notes: r.notes
    })));
    const filename = `Absente_${year}_${String(month).padStart(2, "0")}.xlsx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(Buffer.from(buffer));
  });
  app.get("/api/reports/absente/pdf", async (req, res) => {
    const user = await requireHR(req, res);
    if (!user) return;
    const { year, month } = parseParams(req);
    const rows = await getAbsenteLunare(year, month);
    const buffer = await generatePDF(
      `Concedii & Absen\u021Be`,
      `Perioada: ${monthName2(month, year)} | ${rows.length} \xEEnregistr\u0103ri`,
      ["Angajat", "Data", "Tip absen\u021B\u0103", "Not\u0103"],
      rows.map((r) => [r.name ?? "\u2014", fmtDate(r.date), locationLabel(r.type), r.notes ?? "\u2014"]),
      [`Total: ${rows.length} \xEEnregistr\u0103ri`, "", "", ""]
    );
    const filename = `Absente_${year}_${String(month).padStart(2, "0")}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  });
  app.get("/api/reports/ore-suplimentare/excel", async (req, res) => {
    const user = await requireHR(req, res);
    if (!user) return;
    const { year, month } = parseParams(req);
    const normMinutes = parseInt(req.query.norm) || 480;
    const rows = await getOreSuplimentare(year, month, normMinutes);
    const buffer = await generateOreSuplimentareExcel(year, month, normMinutes, rows);
    const filename = `Ore_Suplimentare_${year}_${String(month).padStart(2, "0")}.xlsx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(Buffer.from(buffer));
  });
  app.get("/api/reports/ore-suplimentare/pdf", async (req, res) => {
    const user = await requireHR(req, res);
    if (!user) return;
    const { year, month } = parseParams(req);
    const normMinutes = parseInt(req.query.norm) || 480;
    const rows = await getOreSuplimentare(year, month, normMinutes);
    const totalOver = rows.reduce((a, r) => a + r.overMinutes, 0);
    const buffer = await generatePDF(
      `Ore suplimentare`,
      `Perioada: ${monthName2(month, year)} | Norm\u0103: ${fmtDuration(normMinutes)}/zi | Total suplimenare: ${fmtDuration(totalOver)}`,
      ["Angajat", "Data", "Loca\u021Bie", "Total ore", "Ore suplimenare"],
      rows.map((r) => [r.name, fmtDate(r.date), locationLabel(r.type), fmtDuration(r.totalMinutes), fmtDuration(r.overMinutes)]),
      ["TOTAL", "", "", "", fmtDuration(totalOver)]
    );
    const filename = `Ore_Suplimentare_${year}_${String(month).padStart(2, "0")}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  });
  app.get("/api/reports/pontaj-proiect/excel", async (req, res) => {
    const user = await requireHR(req, res);
    if (!user) return;
    const { year, month } = parseParams(req);
    const rows = await getPontajPerProiect(year, month);
    const buffer = await generatePontajProiectExcel(year, month, rows);
    const filename = `Pontaj_Proiecte_${year}_${String(month).padStart(2, "0")}.xlsx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(Buffer.from(buffer));
  });
  app.get("/api/reports/pontaj-proiect/pdf", async (req, res) => {
    const user = await requireHR(req, res);
    if (!user) return;
    const { year, month } = parseParams(req);
    const rows = await getPontajPerProiect(year, month);
    const totalMin = rows.reduce((a, r) => a + (r.totalMinutes ?? 0), 0);
    const buffer = await generatePDF(
      `Pontaj per proiect`,
      `Perioada: ${monthName2(month, year)} | Total: ${fmtDuration(totalMin)}`,
      ["Proiect", "Angajat", "Data", "Loca\u021Bie", "Ore lucrate", "Not\u0103"],
      rows.map((r) => [r.projectName, r.name, fmtDate(r.date), locationLabel(r.type), fmtDuration(r.totalMinutes ?? 0), r.notes ?? "\u2014"]),
      ["TOTAL", "", "", "", fmtDuration(totalMin), ""]
    );
    const filename = `Pontaj_Proiecte_${year}_${String(month).padStart(2, "0")}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  });
  app.get("/api/reports/users", async (req, res) => {
    const user = await requireHR(req, res);
    if (!user) return;
    const users2 = await getActiveUsers();
    res.json(users2);
  });
  async function requireAuth(req, res) {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user) {
        res.status(401).json({ error: "Neautentificat." });
        return null;
      }
      return user;
    } catch {
      res.status(401).json({ error: "Neautentificat." });
      return null;
    }
  }
  app.get("/api/reports/time-tracking/excel", async (req, res) => {
    const user = await requireAuth(req, res);
    if (!user) return;
    const dateFrom = req.query.dateFrom || void 0;
    const dateTo = req.query.dateTo || void 0;
    const projectFilter = req.query.projectId ? parseInt(req.query.projectId) : void 0;
    const typeFilter = req.query.activityType || void 0;
    const taskNameFilter = req.query.taskName || void 0;
    const employeeFilter = req.query.employeeId ? parseInt(req.query.employeeId) : void 0;
    const targetUserId = user.role === "admin" && employeeFilter ? employeeFilter : user.id;
    const allEntries = await getTimeEntriesForUser(targetUserId, dateFrom, dateTo);
    const projects2 = await getProjects();
    const projMap = new Map(projects2.map((p) => [p.id, p.name]));
    let targetUserName = user.name || "Utilizator";
    if (user.role === "admin" && employeeFilter && employeeFilter !== user.id) {
      const allUsers = await getAllUsers();
      const target = allUsers.find((u) => u.id === employeeFilter);
      if (target) targetUserName = target.name || "Utilizator";
    }
    let entries = allEntries.filter((e) => {
      const hasTime = e.startHour != null || e.startTime;
      if (!hasTime) return false;
      if (projectFilter && e.projectId !== projectFilter) return false;
      if (typeFilter && typeFilter !== "all" && e.activityType !== typeFilter) return false;
      if (taskNameFilter && !(e.taskName || "").toLowerCase().includes(taskNameFilter.toLowerCase())) return false;
      return true;
    });
    const ExcelJS2 = (await import("exceljs")).default;
    const wb = new ExcelJS2.Workbook();
    wb.creator = "Inginerie Creativ\u0103 SRL";
    wb.created = /* @__PURE__ */ new Date();
    const ws = wb.addWorksheet("Time Tracking", { pageSetup: { orientation: "landscape", fitToPage: true } });
    const cols = ["Data", "Activitate", "Tip", "Proiect", "Start", "Final", "Durat\u0103", "Descriere"];
    const colCount = cols.length;
    ws.addRow([]);
    const r1 = ws.lastRow;
    ws.mergeCells(`A${r1.number}:${String.fromCharCode(64 + colCount)}${r1.number}`);
    const c1 = r1.getCell(1);
    c1.value = "Inginerie Creativ\u0103 SRL";
    c1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF221F1F" } };
    c1.font = { bold: true, color: { argb: "FFFFCB09" }, size: 14, name: "Calibri" };
    c1.alignment = { vertical: "middle", horizontal: "center" };
    r1.height = 28;
    ws.addRow([]);
    const r2 = ws.lastRow;
    ws.mergeCells(`A${r2.number}:${String.fromCharCode(64 + colCount)}${r2.number}`);
    const c2 = r2.getCell(1);
    c2.value = `Raport Time-Tracking \u2014 ${targetUserName}`;
    c2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFCB09" } };
    c2.font = { bold: true, color: { argb: "FF221F1F" }, size: 12, name: "Calibri" };
    c2.alignment = { vertical: "middle", horizontal: "center" };
    r2.height = 22;
    ws.addRow([]);
    const r3 = ws.lastRow;
    ws.mergeCells(`A${r3.number}:${String.fromCharCode(64 + colCount)}${r3.number}`);
    const c3 = r3.getCell(1);
    c3.value = `Perioad\u0103: ${dateFrom || "\u2014"} \u2192 ${dateTo || "\u2014"} | Generat: ${(/* @__PURE__ */ new Date()).toLocaleString("ro-RO")}`;
    c3.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F5F5" } };
    c3.font = { color: { argb: "FF666666" }, size: 9, name: "Calibri" };
    c3.alignment = { vertical: "middle", horizontal: "center" };
    r3.height = 16;
    ws.addRow([]);
    ws.lastRow.height = 6;
    const headerRow = ws.addRow(cols);
    headerRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFCB09" } };
      cell.font = { bold: true, color: { argb: "FF221F1F" }, size: 10, name: "Calibri" };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.border = {
        top: { style: "thin", color: { argb: "FF221F1F" } },
        bottom: { style: "thin", color: { argb: "FF221F1F" } }
      };
    });
    let totalMins = 0;
    entries.forEach((e, idx) => {
      const sh = e.startHour ?? 0;
      const sm = e.startMin ?? 0;
      const eh = e.endHour ?? 0;
      const em = e.endMin ?? 0;
      const dur = e.durationMinutes || 0;
      totalMins += dur;
      const dateStr = e.date ? new Date(e.date).toLocaleDateString("ro-RO") : "\u2014";
      const row = ws.addRow([
        dateStr,
        e.taskName || "\u2014",
        e.activityType || "\u2014",
        projMap.get(e.projectId) || "\u2014",
        `${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")}`,
        `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`,
        fmtDuration(dur),
        e.description || ""
      ]);
      const isEven = idx % 2 === 0;
      row.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: isEven ? "FFF9F9F9" : "FFFFFFFF" } };
        cell.font = { color: { argb: "FF221F1F" }, size: 9, name: "Calibri" };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = { bottom: { style: "hair", color: { argb: "FFDDDDDD" } } };
      });
    });
    const totRow = ws.addRow(["", "", "", "TOTAL", "", "", fmtDuration(totalMins), ""]);
    totRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFCB09" } };
      cell.font = { bold: true, color: { argb: "FF221F1F" }, size: 10, name: "Calibri" };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "medium", color: { argb: "FF221F1F" } },
        bottom: { style: "medium", color: { argb: "FF221F1F" } }
      };
    });
    ws.columns = [
      { width: 14 },
      { width: 30 },
      { width: 14 },
      { width: 20 },
      { width: 8 },
      { width: 8 },
      { width: 10 },
      { width: 30 }
    ];
    const buffer = await wb.xlsx.writeBuffer();
    const filename = sanitizeFilename(`time-tracking-${user.name || "user"}-${dateFrom || "all"}.xlsx`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(Buffer.from(buffer));
  });
  app.get("/api/reports/time-tracking/pdf", async (req, res) => {
    const user = await requireAuth(req, res);
    if (!user) return;
    const dateFrom = req.query.dateFrom || void 0;
    const dateTo = req.query.dateTo || void 0;
    const projectFilter = req.query.projectId ? parseInt(req.query.projectId) : void 0;
    const typeFilter = req.query.activityType || void 0;
    const taskNameFilter = req.query.taskName || void 0;
    const employeeFilter = req.query.employeeId ? parseInt(req.query.employeeId) : void 0;
    const targetUserId = user.role === "admin" && employeeFilter ? employeeFilter : user.id;
    const allEntries = await getTimeEntriesForUser(targetUserId, dateFrom, dateTo);
    const projects2 = await getProjects();
    const projMap = new Map(projects2.map((p) => [p.id, p.name]));
    let targetUserName = user.name || "Utilizator";
    if (user.role === "admin" && employeeFilter && employeeFilter !== user.id) {
      const allUsers = await getAllUsers();
      const target = allUsers.find((u) => u.id === employeeFilter);
      if (target) targetUserName = target.name || "Utilizator";
    }
    let entries = allEntries.filter((e) => {
      const hasTime = e.startHour != null || e.startTime;
      if (!hasTime) return false;
      if (projectFilter && e.projectId !== projectFilter) return false;
      if (typeFilter && typeFilter !== "all" && e.activityType !== typeFilter) return false;
      if (taskNameFilter && !(e.taskName || "").toLowerCase().includes(taskNameFilter.toLowerCase())) return false;
      return true;
    });
    const headers = ["Data", "Activitate", "Tip", "Proiect", "Start", "Final", "Durat\u0103", "Descriere"];
    let totalMins = 0;
    const rows = entries.map((e) => {
      const sh = e.startHour ?? 0;
      const sm = e.startMin ?? 0;
      const eh = e.endHour ?? 0;
      const em = e.endMin ?? 0;
      const dur = e.durationMinutes || 0;
      totalMins += dur;
      const dateStr = e.date ? new Date(e.date).toLocaleDateString("ro-RO") : "\u2014";
      return [
        dateStr,
        e.taskName || "\u2014",
        e.activityType || "\u2014",
        projMap.get(e.projectId) || "\u2014",
        `${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")}`,
        `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`,
        fmtDuration(dur),
        e.description || ""
      ];
    });
    const totalsRow = ["", "", "", "TOTAL", "", "", fmtDuration(totalMins), ""];
    const title = `Raport Time-Tracking \u2014 ${targetUserName}`;
    const subtitle = `Perioad\u0103: ${dateFrom || "\u2014"} \u2192 ${dateTo || "\u2014"}`;
    const buffer = await generatePDF(title, subtitle, headers, rows, totalsRow);
    const filename = sanitizeFilename(`time-tracking-${targetUserName}-${dateFrom || "all"}.pdf`);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  });
}
function monthName2(month, year) {
  const months = [
    "Ianuarie",
    "Februarie",
    "Martie",
    "Aprilie",
    "Mai",
    "Iunie",
    "Iulie",
    "August",
    "Septembrie",
    "Octombrie",
    "Noiembrie",
    "Decembrie"
  ];
  return `${months[month - 1]} ${year}`;
}

// server/googleCalendar.ts
init_env();
init_db();
init_schema();
import { eq as eq2, and as and2 } from "drizzle-orm";
var GCAL_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
var GCAL_TOKEN_URL = "https://oauth2.googleapis.com/token";
var GCAL_API_BASE = "https://www.googleapis.com/calendar/v3";
var SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events"
].join(" ");
function getGoogleCalendarAuthUrl(redirectUri, state) {
  const params = new URLSearchParams({
    client_id: ENV.googleClientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    state
  });
  return `${GCAL_AUTH_URL}?${params.toString()}`;
}
async function exchangeCodeForTokens(code, redirectUri) {
  const res = await fetch(GCAL_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: ENV.googleClientId,
      client_secret: ENV.googleClientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code"
    })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${err}`);
  }
  return res.json();
}
async function refreshAccessToken(refreshToken) {
  const res = await fetch(GCAL_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: ENV.googleClientId,
      client_secret: ENV.googleClientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token"
    })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token refresh failed: ${err}`);
  }
  const data = await res.json();
  return data.access_token;
}
async function getValidAccessToken(userId) {
  const db = await getDb2();
  if (!db) return null;
  const [tokenRow] = await db.select().from(googleCalendarTokens).where(eq2(googleCalendarTokens.userId, userId));
  if (!tokenRow) return null;
  const now = /* @__PURE__ */ new Date();
  const isExpired = tokenRow.expiresAt && tokenRow.expiresAt.getTime() < now.getTime() + 5 * 60 * 1e3;
  if (isExpired && tokenRow.refreshToken) {
    try {
      const newAccessToken = await refreshAccessToken(tokenRow.refreshToken);
      const newExpiry = new Date(Date.now() + 3600 * 1e3);
      await db.update(googleCalendarTokens).set({ accessToken: newAccessToken, expiresAt: newExpiry, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(googleCalendarTokens.userId, userId));
      return newAccessToken;
    } catch {
      return null;
    }
  }
  return tokenRow.accessToken;
}
async function saveTokens(userId, accessToken, refreshToken, expiresIn, scope) {
  const db = await getDb2();
  if (!db) return;
  const expiresAt = new Date(Date.now() + expiresIn * 1e3);
  const existing = await db.select({ id: googleCalendarTokens.id }).from(googleCalendarTokens).where(eq2(googleCalendarTokens.userId, userId));
  if (existing.length > 0) {
    await db.update(googleCalendarTokens).set({
      accessToken,
      ...refreshToken ? { refreshToken } : {},
      expiresAt,
      scope,
      syncEnabled: true,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq2(googleCalendarTokens.userId, userId));
  } else {
    await db.insert(googleCalendarTokens).values({
      userId,
      accessToken,
      refreshToken: refreshToken ?? null,
      expiresAt,
      scope,
      syncEnabled: true
    });
  }
}
async function fetchCalendarEvents(accessToken, timeMin, timeMax, calendarId = "primary") {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250"
  });
  const res = await fetch(`${GCAL_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Calendar API error: ${err}`);
  }
  const data = await res.json();
  return data.items ?? [];
}
async function createCalendarEvent(accessToken, event, calendarId = "primary") {
  const res = await fetch(`${GCAL_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(event)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Create event failed: ${err}`);
  }
  return res.json();
}
async function updateCalendarEvent(accessToken, eventId, event, calendarId = "primary") {
  const res = await fetch(`${GCAL_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(event)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Update event failed: ${err}`);
  }
  return res.json();
}
async function deleteCalendarEvent(accessToken, eventId, calendarId = "primary") {
  const res = await fetch(`${GCAL_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    const err = await res.text();
    throw new Error(`Delete event failed: ${err}`);
  }
}
async function hasGoogleCalendarConnected(userId) {
  const db = await getDb2();
  if (!db) return false;
  const [row] = await db.select({ id: googleCalendarTokens.id, syncEnabled: googleCalendarTokens.syncEnabled }).from(googleCalendarTokens).where(eq2(googleCalendarTokens.userId, userId));
  return !!row && row.syncEnabled;
}
async function disconnectGoogleCalendar(userId) {
  const db = await getDb2();
  if (!db) return;
  await db.update(googleCalendarTokens).set({ syncEnabled: false, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(googleCalendarTokens.userId, userId));
}
async function getSyncMapByTimeEntry(userId, timeEntryId) {
  const db = await getDb2();
  if (!db) return null;
  const [row] = await db.select().from(gcalSyncMap).where(and2(eq2(gcalSyncMap.userId, userId), eq2(gcalSyncMap.timeEntryId, timeEntryId)));
  return row ?? null;
}
async function upsertSyncMap(userId, timeEntryId, gcalEventId) {
  const db = await getDb2();
  if (!db) return;
  if (timeEntryId) {
    const existing = await getSyncMapByTimeEntry(userId, timeEntryId);
    if (existing) {
      await db.update(gcalSyncMap).set({ gcalEventId, lastSyncedAt: /* @__PURE__ */ new Date() }).where(eq2(gcalSyncMap.id, existing.id));
      return;
    }
  }
  await db.insert(gcalSyncMap).values({
    userId,
    timeEntryId,
    gcalEventId,
    direction: "both",
    lastSyncedAt: /* @__PURE__ */ new Date()
  });
}
async function deleteSyncMapByTimeEntry(userId, timeEntryId) {
  const db = await getDb2();
  if (!db) return;
  await db.delete(gcalSyncMap).where(and2(eq2(gcalSyncMap.userId, userId), eq2(gcalSyncMap.timeEntryId, timeEntryId)));
}

// server/googleCalendarRoutes.ts
function registerGoogleCalendarRoutes(app) {
  app.get("/api/oauth/google-calendar/callback", async (req, res) => {
    const { code, state, error } = req.query;
    if (error) {
      console.error("[GCal OAuth] Error:", error);
      return res.redirect("/?gcal=error&reason=" + encodeURIComponent(error));
    }
    if (!code || !state) {
      return res.redirect("/?gcal=error&reason=missing_params");
    }
    let parsedState;
    try {
      parsedState = JSON.parse(Buffer.from(state, "base64").toString("utf-8"));
    } catch {
      return res.redirect("/?gcal=error&reason=invalid_state");
    }
    const { userId, origin } = parsedState;
    const redirectUri = `${origin}/api/oauth/google-calendar/callback`;
    try {
      const tokens = await exchangeCodeForTokens(code, redirectUri);
      await saveTokens(
        userId,
        tokens.access_token,
        tokens.refresh_token,
        tokens.expires_in,
        tokens.scope
      );
      console.log(`[GCal OAuth] User ${userId} connected Google Calendar`);
      return res.redirect("/time-tracking?gcal=connected");
    } catch (err) {
      console.error("[GCal OAuth] Token exchange failed:", err);
      return res.redirect("/time-tracking?gcal=error");
    }
  });
}

// server/driveProxyRoutes.ts
init_db();
init_googleDrive();
function isValidFileId(id) {
  return /^[a-zA-Z0-9_\-]{10,100}$/.test(id);
}
function registerDriveProxyRoutes(app) {
  app.get("/api/drive/file/:fileId", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      const { fileId } = req.params;
      if (!isValidFileId(fileId)) {
        res.status(400).json({ error: "Invalid file ID" });
        return;
      }
      const mapping = await getEmployeeDriveFolder(user.id);
      if (!mapping) {
        res.status(403).json({ error: "No Drive folder mapped for your account. Contact administrator." });
        return;
      }
      const inFolder = await isFileInFolder(fileId, mapping.folderId);
      if (!inFolder) {
        res.status(403).json({ error: "Access denied: file does not belong to your folder." });
        return;
      }
      const { stream, mimeType, name, size } = await downloadFileStream(fileId);
      res.setHeader("Content-Type", mimeType);
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${encodeURIComponent(name)}"`
      );
      if (size) res.setHeader("Content-Length", size);
      res.setHeader("Cache-Control", "private, no-store");
      stream.pipe(res);
    } catch (err) {
      if (err?.message?.includes("Invalid session") || err?.message?.includes("Forbidden")) {
        res.status(401).json({ error: "Authentication required" });
      } else {
        console.error("[DriveProxy] Error serving personal file:", err);
        res.status(500).json({ error: "Failed to retrieve file" });
      }
    }
  });
  app.get("/api/drive/public/:fileId", async (req, res) => {
    try {
      await sdk.authenticateRequest(req);
      const { fileId } = req.params;
      if (!isValidFileId(fileId)) {
        res.status(400).json({ error: "Invalid file ID" });
        return;
      }
      let allowed = await isFileInFolder(fileId, HUB_IC_ROOT_FOLDER_ID);
      if (!allowed) {
        const { getFileMetadata: getFileMetadata2 } = await Promise.resolve().then(() => (init_googleDrive(), googleDrive_exports));
        const meta = await getFileMetadata2(fileId);
        if (meta && meta.parents.length > 0) {
          for (const parentId of meta.parents) {
            const parentInRoot = await isFileInFolder(parentId, HUB_IC_ROOT_FOLDER_ID);
            if (parentInRoot) {
              allowed = true;
              break;
            }
          }
        }
      }
      if (!allowed) {
        res.status(403).json({ error: "Access denied: file is not in HUB IC." });
        return;
      }
      const { stream, mimeType, name, size } = await downloadFileStream(fileId);
      res.setHeader("Content-Type", mimeType);
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${encodeURIComponent(name)}"`
      );
      if (size) res.setHeader("Content-Length", size);
      res.setHeader("Cache-Control", "private, max-age=300");
      stream.pipe(res);
    } catch (err) {
      if (err?.message?.includes("Invalid session") || err?.message?.includes("Forbidden")) {
        res.status(401).json({ error: "Authentication required" });
      } else {
        console.error("[DriveProxy] Error serving public file:", err);
        res.status(500).json({ error: "Failed to retrieve file" });
      }
    }
  });
}

// server/scheduledDriveRoutes.ts
init_db();
init_googleDrive();
var COMPANY_SUBFOLDERS = [
  "Regulament intern",
  "Viziune & Valori",
  "Procese & Proceduri",
  "Biblioteca tehnica"
];
async function runDriveCheck() {
  const rootFolderId = await getAppSetting("drive_hub_ic_root_folder_id") ?? HUB_IC_ROOT_FOLDER_ID;
  let totalNew = 0;
  let totalModified = 0;
  let totalDeleted = 0;
  for (const subfolderName of COMPANY_SUBFOLDERS) {
    try {
      const subfolder = await findFolderByName(rootFolderId, subfolderName);
      if (!subfolder) continue;
      const currentFiles = await listFilesInFolder(subfolder.id);
      const snapshots = await getDriveSnapshots(subfolder.id);
      const snapshotMap = new Map(snapshots.map((s) => [s.fileId, s]));
      const currentIds = new Set(currentFiles.map((f) => f.id));
      for (const file of currentFiles) {
        const snap = snapshotMap.get(file.id);
        if (!snap) {
          totalNew++;
          await upsertDriveSnapshot({
            fileId: file.id,
            fileName: file.name,
            folderId: subfolder.id,
            folderType: "company",
            subfolderName,
            modifiedTime: file.modifiedTime,
            size: file.size,
            mimeType: file.mimeType
          });
          const allUsers = await getAllUsers();
          for (const user of allUsers) {
            await createNotification({
              userId: user.id,
              type: "info",
              title: `Document nou in ${subfolderName}`,
              message: `A fost adaugat documentul "${file.name}" in ${subfolderName}.`,
              link: "/documente"
            });
          }
        } else if (snap.modifiedTime && file.modifiedTime && snap.modifiedTime !== file.modifiedTime) {
          totalModified++;
          await upsertDriveSnapshot({
            fileId: file.id,
            fileName: file.name,
            folderId: subfolder.id,
            folderType: "company",
            subfolderName,
            modifiedTime: file.modifiedTime,
            size: file.size,
            mimeType: file.mimeType
          });
          const allUsers = await getAllUsers();
          for (const user of allUsers) {
            await createNotification({
              userId: user.id,
              type: "info",
              title: `Document actualizat in ${subfolderName}`,
              message: `Documentul "${file.name}" din ${subfolderName} a fost actualizat.`,
              link: "/documente"
            });
          }
        }
      }
      for (const snap of snapshots) {
        if (!currentIds.has(snap.fileId)) {
          totalDeleted++;
          await markDriveSnapshotDeleted(snap.fileId);
          const allUsers = await getAllUsers();
          for (const user of allUsers) {
            await createNotification({
              userId: user.id,
              type: "warning",
              title: `Document sters din ${subfolderName}`,
              message: `Documentul "${snap.fileName}" a fost eliminat din ${subfolderName}.`,
              link: "/documente"
            });
          }
        }
      }
    } catch (err) {
      console.error(`[drive-check] Error checking subfolder ${subfolderName}:`, err);
    }
  }
  try {
    const allMappings = await getAllEmployeeDriveFolders();
    for (const mapping of allMappings) {
      try {
        const currentFiles = await listFilesInFolder(mapping.folderId);
        const snapshots = await getDriveSnapshots(mapping.folderId);
        const snapshotMap = new Map(snapshots.map((s) => [s.fileId, s]));
        const currentIds = new Set(currentFiles.map((f) => f.id));
        for (const file of currentFiles) {
          const snap = snapshotMap.get(file.id);
          if (!snap) {
            totalNew++;
            await upsertDriveSnapshot({
              fileId: file.id,
              fileName: file.name,
              folderId: mapping.folderId,
              folderType: "personal",
              ownerUserId: mapping.userId,
              modifiedTime: file.modifiedTime,
              size: file.size,
              mimeType: file.mimeType
            });
            await createNotification({
              userId: mapping.userId,
              type: "info",
              title: "Document personal nou",
              message: `A fost adaugat documentul "${file.name}" in dosarul tau personal.`,
              link: "/documente"
            });
          } else if (snap.modifiedTime && file.modifiedTime && snap.modifiedTime !== file.modifiedTime) {
            totalModified++;
            await upsertDriveSnapshot({
              fileId: file.id,
              fileName: file.name,
              folderId: mapping.folderId,
              folderType: "personal",
              ownerUserId: mapping.userId,
              modifiedTime: file.modifiedTime,
              size: file.size,
              mimeType: file.mimeType
            });
            await createNotification({
              userId: mapping.userId,
              type: "info",
              title: "Document personal actualizat",
              message: `Documentul "${file.name}" din dosarul tau personal a fost actualizat.`,
              link: "/documente"
            });
          }
        }
        for (const snap of snapshots) {
          if (!currentIds.has(snap.fileId)) {
            totalDeleted++;
            await markDriveSnapshotDeleted(snap.fileId);
            await createNotification({
              userId: mapping.userId,
              type: "warning",
              title: "Document personal sters",
              message: `Documentul "${snap.fileName}" a fost eliminat din dosarul tau personal.`,
              link: "/documente"
            });
          }
        }
      } catch (err) {
        console.error(`[drive-check] Error checking personal folder for user ${mapping.userId}:`, err);
      }
    }
  } catch (err) {
    console.error("[drive-check] Error fetching employee mappings:", err);
  }
  return { success: true, totalNew, totalModified, totalDeleted };
}
function registerScheduledDriveRoutes(app) {
  app.post("/api/scheduled/drive-check", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const result = await runDriveCheck();
      console.log(`[drive-check] Completed: ${result.totalNew} new, ${result.totalModified} modified, ${result.totalDeleted} deleted`);
      return res.json(result);
    } catch (err) {
      console.error("[drive-check] Fatal error:", err);
      return res.status(500).json({ error: err.message ?? "Internal server error" });
    }
  });
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
init_env();
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers/projects.ts
init_db();
import { z as z2 } from "zod";
import { sql as sql3 } from "drizzle-orm";
async function getTaskAssignees(taskId) {
  const db = await getDb2();
  if (!db) return [];
  const rows = await db.execute(
    sql3`SELECT ta.userId, u.name, u.avatarUrl, u.jobTitle FROM task_assignees ta
        JOIN users u ON u.id = ta.userId WHERE ta.taskId = ${taskId} ORDER BY ta.assignedAt`
  );
  return rows[0] ?? [];
}
async function getPhaseBudgetUsage(phaseId, excludeTaskId) {
  const db = await getDb2();
  if (!db) return 0;
  let rows;
  if (excludeTaskId) {
    rows = await db.execute(
      sql3`SELECT COALESCE(SUM(CAST(budgetHours AS DECIMAL(10,2))), 0) as totalUsed
          FROM project_tasks WHERE phaseId = ${phaseId} AND status != 'finalizata' AND id != ${excludeTaskId}`
    );
  } else {
    rows = await db.execute(
      sql3`SELECT COALESCE(SUM(CAST(budgetHours AS DECIMAL(10,2))), 0) as totalUsed
          FROM project_tasks WHERE phaseId = ${phaseId} AND status != 'finalizata'`
    );
  }
  return parseFloat(rows[0]?.[0]?.totalUsed || "0");
}
async function getPhaseBudget(phaseId) {
  const db = await getDb2();
  if (!db) return 0;
  const rows = await db.execute(
    sql3`SELECT budgetHours FROM project_phases WHERE id = ${phaseId}`
  );
  return parseFloat(rows[0]?.[0]?.budgetHours || "0");
}
async function createProjectWithSelectedPhases(data) {
  const { selectedPhaseIds, ...projectData } = data;
  const project = await createProject(projectData);
  if (!selectedPhaseIds || selectedPhaseIds.length === 0) return project;
  const db = await getDb2();
  if (!db) return project;
  for (const tplPhaseId of selectedPhaseIds) {
    const phaseRows = await db.execute(
      sql3`SELECT * FROM template_phases WHERE id = ${tplPhaseId}`
    );
    const phase = phaseRows[0]?.[0];
    if (!phase) continue;
    const phaseInsert = await db.execute(
      sql3`INSERT INTO project_phases (projectId, name, code, displayOrder, color, status, budgetHours)
          VALUES (${project.id}, ${phase.name}, ${phase.code}, ${phase.displayOrder}, ${phase.color}, 'activa', '0')`
    );
    const phaseId = phaseInsert[0]?.insertId;
    if (!phaseId) continue;
    const taskRows = await db.execute(
      sql3`SELECT * FROM template_tasks WHERE templatePhaseId = ${tplPhaseId} ORDER BY displayOrder`
    );
    const tasks = taskRows[0] ?? [];
    for (const task of tasks) {
      await db.execute(
        sql3`INSERT INTO project_tasks (phaseId, projectId, name, displayOrder, status, budgetHours, minutesWorked)
            VALUES (${phaseId}, ${project.id}, ${task.name}, ${task.displayOrder}, 'neinceputa', '0', 0)`
      );
    }
  }
  return project;
}
var projectsRouter = router({
  // ─── PROJECT CRUD ──────────────────────────────────────────────────────────
  list: protectedProcedure.input(z2.object({ status: z2.string().optional() }).optional()).query(async ({ ctx, input }) => {
    const isAdmin = ctx.user.role === "admin" || ctx.user.role === "coordonator";
    return listProjects({ status: input?.status, userId: ctx.user.id, isAdmin });
  }),
  get: protectedProcedure.input(z2.object({ id: z2.number() })).query(async ({ ctx, input }) => {
    const isAdmin = ctx.user.role === "admin" || ctx.user.role === "coordonator";
    return getProjectDetail(input.id, ctx.user.id, isAdmin);
  }),
  create: protectedProcedure.input(z2.object({
    name: z2.string().min(1),
    abbreviation: z2.string().optional().nullable(),
    emoji: z2.string().optional().nullable(),
    code: z2.string().optional().nullable(),
    clientName: z2.string().optional().nullable(),
    status: z2.enum(["activ", "suspendat", "finalizat", "intern"]).optional(),
    isGeneral: z2.boolean().optional(),
    startDate: z2.string().optional().nullable(),
    endDate: z2.string().optional().nullable(),
    description: z2.string().optional().nullable(),
    color: z2.string().optional().nullable(),
    driveId: z2.string().optional().nullable(),
    selectedPhaseIds: z2.array(z2.number()).optional()
  })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") throw new Error("Acces interzis");
    const { selectedPhaseIds, ...rest } = input;
    return createProjectWithSelectedPhases({
      ...rest,
      managerId: ctx.user.id,
      selectedPhaseIds
    });
  }),
  update: protectedProcedure.input(z2.object({
    id: z2.number(),
    name: z2.string().optional(),
    abbreviation: z2.string().optional().nullable(),
    emoji: z2.string().optional().nullable(),
    code: z2.string().optional().nullable(),
    clientName: z2.string().optional().nullable(),
    status: z2.enum(["activ", "suspendat", "finalizat", "intern"]).optional(),
    isGeneral: z2.boolean().optional(),
    startDate: z2.string().optional().nullable(),
    endDate: z2.string().optional().nullable(),
    description: z2.string().optional().nullable(),
    color: z2.string().optional().nullable(),
    driveId: z2.string().optional().nullable(),
    managerId: z2.number().optional().nullable()
  })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") throw new Error("Acces interzis");
    const { id, ...data } = input;
    const normalizeDate = (d) => {
      if (!d) return null;
      const parsed = new Date(d);
      if (isNaN(parsed.getTime())) return null;
      return parsed.toISOString().slice(0, 10);
    };
    return updateProject(id, {
      ...data,
      startDate: normalizeDate(data.startDate),
      endDate: normalizeDate(data.endDate)
    });
  }),
  delete: protectedProcedure.input(z2.object({ id: z2.number(), confirmName: z2.string() })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") throw new Error("Doar administratorii pot \u0219terge proiecte");
    const project = await getProjectById(input.id);
    if (!project) throw new Error("Proiectul nu exist\u0103");
    if (project.name !== input.confirmName) throw new Error("Numele proiectului nu corespunde");
    return deleteProject(input.id);
  }),
  // ─── PHASES ────────────────────────────────────────────────────────────────
  phases: protectedProcedure.input(z2.object({ projectId: z2.number() })).query(async ({ input }) => {
    return getProjectPhases(input.projectId);
  }),
  addPhase: protectedProcedure.input(z2.object({
    projectId: z2.number(),
    name: z2.string().min(1),
    code: z2.string().optional().nullable(),
    displayOrder: z2.number().optional(),
    budgetHours: z2.string().optional(),
    color: z2.string().optional().nullable(),
    templatePhaseId: z2.number().optional().nullable()
    // if from template, auto-add tasks
  })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") throw new Error("Acces interzis");
    const { templatePhaseId, ...phaseData } = input;
    const phase = await createPhase(phaseData);
    if (templatePhaseId) {
      const db = await getDb2();
      if (db) {
        const taskRows = await db.execute(
          sql3`SELECT * FROM template_tasks WHERE templatePhaseId = ${templatePhaseId} ORDER BY displayOrder`
        );
        const tasks = taskRows[0] ?? [];
        for (const task of tasks) {
          await db.execute(
            sql3`INSERT INTO project_tasks (phaseId, projectId, name, displayOrder, status, budgetHours, minutesWorked)
                  VALUES (${phase.id}, ${input.projectId}, ${task.name}, ${task.displayOrder}, 'neinceputa', '0', 0)`
          );
        }
      }
    }
    return phase;
  }),
  updatePhase: protectedProcedure.input(z2.object({
    id: z2.number(),
    name: z2.string().optional(),
    code: z2.string().optional().nullable(),
    displayOrder: z2.number().optional(),
    budgetHours: z2.string().optional(),
    color: z2.string().optional().nullable(),
    status: z2.enum(["activa", "suspendata", "finalizata"]).optional()
  })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") throw new Error("Acces interzis");
    const { id, ...data } = input;
    return updatePhase(id, data);
  }),
  deletePhase: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") throw new Error("Acces interzis");
    return deletePhase(input.id);
  }),
  // ─── TASKS ─────────────────────────────────────────────────────────────────
  tasks: protectedProcedure.input(z2.object({ projectId: z2.number() })).query(async ({ ctx, input }) => {
    const isAdmin = ctx.user.role === "admin" || ctx.user.role === "coordonator";
    return getTasksByProject(input.projectId, isAdmin ? void 0 : ctx.user.id);
  }),
  tasksByPhase: protectedProcedure.input(z2.object({ phaseId: z2.number() })).query(async ({ input }) => {
    return getTasksByPhase(input.phaseId);
  }),
  addTask: protectedProcedure.input(z2.object({
    phaseId: z2.number(),
    projectId: z2.number(),
    name: z2.string().min(1),
    description: z2.string().optional().nullable(),
    displayOrder: z2.number().optional(),
    budgetHours: z2.string().optional()
  })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") throw new Error("Acces interzis");
    const phaseBudget = await getPhaseBudget(input.phaseId);
    if (phaseBudget > 0 && input.budgetHours) {
      const used = await getPhaseBudgetUsage(input.phaseId);
      const newHours = parseFloat(input.budgetHours || "0");
      if (used + newHours > phaseBudget) {
        throw new Error(`Bugetul etapei este dep\u0103\u0219it. Disponibil: ${(phaseBudget - used).toFixed(1)}h din ${phaseBudget}h`);
      }
    }
    return createTask(input);
  }),
  updateTask: protectedProcedure.input(z2.object({
    id: z2.number(),
    name: z2.string().optional(),
    description: z2.string().optional().nullable(),
    displayOrder: z2.number().optional(),
    budgetHours: z2.string().optional(),
    status: z2.enum(["neinceputa", "in_lucru", "in_pauza", "finalizata", "blocata"]).optional(),
    phaseId: z2.number().optional()
    // needed for budget validation
  })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") throw new Error("Acces interzis");
    const { id, phaseId, ...data } = input;
    if (phaseId && data.budgetHours !== void 0) {
      const phaseBudget = await getPhaseBudget(phaseId);
      if (phaseBudget > 0) {
        const used = await getPhaseBudgetUsage(phaseId, id);
        const newHours = parseFloat(data.budgetHours || "0");
        if (used + newHours > phaseBudget) {
          throw new Error(`Bugetul etapei este dep\u0103\u0219it. Disponibil: ${(phaseBudget - used).toFixed(1)}h din ${phaseBudget}h`);
        }
      }
    }
    return updateTask(id, data);
  }),
  deleteTask: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") throw new Error("Acces interzis");
    return deleteTask(input.id);
  }),
  // ─── TASK ASSIGNEES (multi-user) ────────────────────────────────────────────
  taskAssignees: protectedProcedure.input(z2.object({ taskId: z2.number() })).query(async ({ input }) => {
    return getTaskAssignees(input.taskId);
  }),
  addTaskAssignee: protectedProcedure.input(z2.object({ taskId: z2.number(), userId: z2.number() })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") throw new Error("Acces interzis");
    const db = await getDb2();
    if (db) {
      await db.execute(
        sql3`INSERT IGNORE INTO task_assignees (taskId, userId) VALUES (${input.taskId}, ${input.userId})`
      );
    }
    return { success: true };
  }),
  removeTaskAssignee: protectedProcedure.input(z2.object({ taskId: z2.number(), userId: z2.number() })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") throw new Error("Acces interzis");
    const db = await getDb2();
    if (db) {
      await db.execute(
        sql3`DELETE FROM task_assignees WHERE taskId = ${input.taskId} AND userId = ${input.userId}`
      );
    }
    return { success: true };
  }),
  // ─── MEMBERS ───────────────────────────────────────────────────────────────
  members: protectedProcedure.input(z2.object({ projectId: z2.number() })).query(async ({ input }) => {
    return getProjectMembers(input.projectId);
  }),
  addMember: protectedProcedure.input(z2.object({
    projectId: z2.number(),
    userId: z2.number(),
    projectRole: z2.enum(["coordonator", "membru", "consultant"]).default("membru"),
    phaseId: z2.number().optional().nullable()
  })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") throw new Error("Acces interzis");
    return addProjectMember(input.projectId, input.userId, input.projectRole, input.phaseId);
  }),
  removeMember: protectedProcedure.input(z2.object({ projectId: z2.number(), userId: z2.number(), phaseId: z2.number().optional().nullable() })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") throw new Error("Acces interzis");
    return removeProjectMember(input.projectId, input.userId, input.phaseId);
  }),
  updateMemberRole: protectedProcedure.input(z2.object({
    projectId: z2.number(),
    userId: z2.number(),
    projectRole: z2.enum(["coordonator", "membru", "consultant"])
  })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") throw new Error("Acces interzis");
    return updateProjectMemberRole(input.projectId, input.userId, input.projectRole);
  }),
  // ─── TASK SESSIONS ─────────────────────────────────────────────────────────
  activeSession: protectedProcedure.query(async ({ ctx }) => {
    return getActiveSession(ctx.user.id);
  }),
  startSession: protectedProcedure.input(z2.object({ taskId: z2.number(), projectId: z2.number() })).mutation(async ({ ctx, input }) => {
    return startTaskSession(ctx.user.id, input.taskId, input.projectId);
  }),
  pauseSession: protectedProcedure.input(z2.object({ sessionId: z2.number() })).mutation(async ({ ctx, input }) => {
    return pauseTaskSession(input.sessionId, ctx.user.id);
  }),
  resumeSession: protectedProcedure.input(z2.object({ sessionId: z2.number() })).mutation(async ({ ctx, input }) => {
    return resumeTaskSession(input.sessionId, ctx.user.id);
  }),
  stopSession: protectedProcedure.input(z2.object({ sessionId: z2.number() })).mutation(async ({ ctx, input }) => {
    return stopTaskSession(input.sessionId, ctx.user.id);
  }),
  taskSessions: protectedProcedure.input(z2.object({ taskId: z2.number() })).query(async ({ input }) => {
    return getSessionsForTask(input.taskId);
  }),
  // ─── HOUR BANK ─────────────────────────────────────────────────────────────
  myHourBank: protectedProcedure.input(z2.object({ dateFrom: z2.string().optional(), dateTo: z2.string().optional() }).optional()).query(async ({ ctx, input }) => {
    return getHourBankForUser(ctx.user.id, input?.dateFrom, input?.dateTo);
  }),
  hourBankAll: protectedProcedure.input(z2.object({ dateFrom: z2.string().optional(), dateTo: z2.string().optional() }).optional()).query(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") throw new Error("Acces interzis");
    return getHourBankAll(input?.dateFrom, input?.dateTo);
  }),
  // ─── HOUR REQUESTS ─────────────────────────────────────────────────────────
  requestMoreHours: protectedProcedure.input(z2.object({
    taskId: z2.number(),
    projectId: z2.number(),
    requestedHours: z2.string(),
    justification: z2.string().min(10)
  })).mutation(async ({ ctx, input }) => {
    return createHourRequest({ ...input, userId: ctx.user.id });
  }),
  hourRequests: protectedProcedure.input(z2.object({ projectId: z2.number() })).query(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") throw new Error("Acces interzis");
    return getHourRequestsForProject(input.projectId);
  }),
  myHourRequests: protectedProcedure.query(async ({ ctx }) => {
    return getMyHourRequests(ctx.user.id);
  }),
  reviewHourRequest: protectedProcedure.input(z2.object({
    id: z2.number(),
    status: z2.enum(["aprobata", "respinsa"]),
    reviewNote: z2.string().optional()
  })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") throw new Error("Acces interzis");
    return reviewHourRequest(input.id, ctx.user.id, input.status, input.reviewNote);
  }),
  // ─── TEMPLATES ─────────────────────────────────────────────────────────────
  defaultTemplate: protectedProcedure.query(async () => {
    return getDefaultTemplate();
  }),
  templates: protectedProcedure.query(async () => {
    return listTemplates();
  }),
  // ─── BUDGET NOTIFICATIONS (for current user's assigned tasks) ───────────────
  myBudgetAlerts: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb2();
    if (!db) return [];
    const rows = await db.execute(
      sql3`SELECT DISTINCT pt.id, pt.name, pt.budgetHours, pt.minutesWorked,
              pp.name as phaseName, pp.code as phaseCode,
              p.id as projectId, p.name as projectName,
              CASE
                WHEN pt.budgetHours > 0 THEN ROUND((pt.minutesWorked / (CAST(pt.budgetHours AS DECIMAL) * 60)) * 100)
                ELSE 0
              END as pct
       FROM project_tasks pt
       JOIN project_phases pp ON pp.id = pt.phaseId
       JOIN projects p ON p.id = pt.projectId
       WHERE (
         pt.id IN (SELECT taskId FROM task_assignees WHERE userId = ${ctx.user.id})
         OR pt.assignedUserId = ${ctx.user.id}
       )
         AND pt.status != 'finalizata'
         AND pt.budgetHours > 0
         AND pt.minutesWorked > 0
         AND (pt.minutesWorked / (CAST(pt.budgetHours AS DECIMAL) * 60)) >= 0.25
       ORDER BY pct DESC`
    );
    return rows[0] ?? [];
  }),
  // ─── GANTT DATA (for Process Overview) ───────────────────────────────────────────
  ganttData: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb2();
    if (!db) return [];
    const isAdmin = ctx.user.role === "admin";
    const usersRows = await db.execute(
      isAdmin ? sql3`SELECT id, name, department, jobTitle, avatarUrl
                FROM users
                WHERE isActive = 1
                ORDER BY department, displayOrder, name` : sql3`SELECT id, name, department, jobTitle, avatarUrl
                FROM users
                WHERE isActive = 1 AND id = ${ctx.user.id}`
    );
    const users2 = usersRows[0] ?? [];
    if (users2.length === 0) return [];
    const userIds = users2.map((u) => u.id);
    const memberRows = await db.execute(
      sql3`SELECT pm.userId, pm.projectRole,
                   p.id AS projectId, p.name AS projectName, p.code AS projectCode,
                   p.color AS projectColor, p.emoji AS projectEmoji, p.abbreviation AS projectAbbreviation,
                   p.startDate, p.endDate, p.status AS projectStatus, p.clientName
            FROM project_members pm
            JOIN projects p ON p.id = pm.projectId
            WHERE pm.userId IN (${sql3.raw(userIds.join(","))})
              AND p.status IN ('activ', 'suspendat')
            ORDER BY p.startDate`
    );
    const memberProjects = memberRows[0] ?? [];
    const projectIds = [...new Set(memberProjects.map((r) => r.projectId))];
    let userTasks = [];
    if (projectIds.length > 0) {
      const taskRows = await db.execute(
        sql3`SELECT ta.userId, pt.id AS taskId, pt.name AS taskName, pt.projectId,
                     pt.status AS taskStatus, pt.budgetHours, pt.minutesWorked,
                     pp.name AS phaseName, pp.code AS phaseCode
              FROM task_assignees ta
              JOIN project_tasks pt ON pt.id = ta.taskId
              JOIN project_phases pp ON pp.id = pt.phaseId
              WHERE ta.userId IN (${sql3.raw(userIds.join(","))})
                AND pt.projectId IN (${sql3.raw(projectIds.join(","))})
                AND pt.status != 'finalizata'
              ORDER BY pp.displayOrder, pt.displayOrder`
      );
      userTasks = taskRows[0] ?? [];
    }
    return users2.map((u) => ({
      userId: u.id,
      userName: u.name,
      department: u.department || "F\u0103r\u0103 departament",
      jobTitle: u.jobTitle,
      avatarUrl: u.avatarUrl,
      projects: memberProjects.filter((mp) => mp.userId === u.id).map((mp) => ({
        projectId: mp.projectId,
        projectName: mp.projectName,
        projectCode: mp.projectCode,
        projectColor: mp.projectColor,
        projectEmoji: mp.projectEmoji,
        projectAbbreviation: mp.projectAbbreviation,
        startDate: mp.startDate,
        endDate: mp.endDate,
        projectStatus: mp.projectStatus,
        clientName: mp.clientName,
        projectRole: mp.projectRole,
        tasks: userTasks.filter((t2) => t2.userId === u.id && t2.projectId === mp.projectId)
      }))
    }));
  }),
  // ─── ENROLLED TASKS (for Time-Tracking picker) ─────────────────────────────
  myEnrolledTasks: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb2();
    if (!db) return [];
    const rows = await db.execute(
      sql3`SELECT DISTINCT
              p.id AS projectId, p.name AS projectName, p.color AS projectColor, p.emoji AS projectEmoji,
              p.code AS projectCode, p.abbreviation AS projectAbbreviation,
              pp.id AS phaseId, pp.name AS phaseName, pp.code AS phaseCode, pp.displayOrder AS phaseOrder,
              pt.id AS taskId, pt.name AS taskName, pt.budgetHours, pt.minutesWorked, pt.status AS taskStatus, pt.displayOrder AS taskOrder
           FROM project_tasks pt
           JOIN project_phases pp ON pp.id = pt.phaseId
           JOIN projects p ON p.id = pt.projectId
           WHERE (
             pt.id IN (SELECT taskId FROM task_assignees WHERE userId = ${ctx.user.id})
             OR pt.assignedUserId = ${ctx.user.id}
           )
             AND pt.status != 'finalizata'
             AND p.status = 'activ'
           ORDER BY p.name, phaseOrder, taskOrder`
    );
    const flat = rows[0] ?? [];
    const projectMap = /* @__PURE__ */ new Map();
    for (const row of flat) {
      if (!projectMap.has(row.projectId)) {
        projectMap.set(row.projectId, {
          projectId: row.projectId,
          projectName: row.projectName,
          projectColor: row.projectColor,
          projectEmoji: row.projectEmoji,
          projectCode: row.projectCode ?? null,
          projectAbbreviation: row.projectAbbreviation ?? null,
          tasks: []
        });
      }
      projectMap.get(row.projectId).tasks.push({
        taskId: row.taskId,
        taskName: row.taskName,
        phaseId: row.phaseId,
        phaseName: row.phaseName,
        phaseCode: row.phaseCode,
        budgetHours: row.budgetHours,
        minutesWorked: row.minutesWorked,
        taskStatus: row.taskStatus
      });
    }
    return Array.from(projectMap.values());
  })
});

// server/routers.ts
import { z as z3 } from "zod";
init_db();
init_googleDrive();
var peopleRouter = router({
  // List all active users (for task assignment and audience targeting)
  list: protectedProcedure.query(async () => {
    return getAllUsers();
  }),
  upcomingBirthdays: protectedProcedure.input(z3.object({ daysAhead: z3.number().min(1).max(365).default(30) }).optional()).query(async ({ input }) => {
    return getUpcomingBirthdays(input?.daysAhead ?? 30);
  }),
  upcomingAnniversaries: protectedProcedure.input(z3.object({ daysAhead: z3.number().min(1).max(365).default(30) }).optional()).query(async ({ input }) => {
    return getUpcomingAnniversaries(input?.daysAhead ?? 30);
  }),
  orgChart: protectedProcedure.query(async () => {
    return getOrgChartData();
  })
});
var settingsRouter = router({
  get: protectedProcedure.input(z3.object({ key: z3.string() })).query(async ({ input }) => {
    const value = await getAppSetting(input.key);
    return { key: input.key, value };
  }),
  set: protectedProcedure.input(z3.object({ key: z3.string(), value: z3.string() })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Doar administratorii pot modifica set\u0103rile");
    }
    await setAppSetting(input.key, input.value, ctx.user.id);
    return { success: true };
  })
});
var recurringRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getRecurringActivities(ctx.user.id);
  }),
  create: protectedProcedure.input(z3.object({
    taskName: z3.string().min(1),
    activityType: z3.enum(["proiectare", "consultanta", "sedinta", "documentare", "deplasare", "administrativ", "verificare", "executie"]),
    projectId: z3.number().optional(),
    startHour: z3.number().min(0).max(23),
    startMin: z3.number().min(0).max(59).default(0),
    durationMinutes: z3.number().min(5).max(480),
    countInTime: z3.boolean().default(true),
    startDate: z3.string(),
    endDate: z3.string().optional()
  })).mutation(async ({ ctx, input }) => {
    return createRecurringActivity({ ...input, userId: ctx.user.id });
  }),
  update: protectedProcedure.input(z3.object({
    id: z3.number(),
    taskName: z3.string().optional(),
    activityType: z3.enum(["proiectare", "consultanta", "sedinta", "documentare", "deplasare", "administrativ", "verificare", "executie"]).optional(),
    projectId: z3.number().optional().nullable(),
    startHour: z3.number().optional(),
    startMin: z3.number().optional(),
    durationMinutes: z3.number().optional(),
    countInTime: z3.boolean().optional(),
    startDate: z3.string().optional(),
    endDate: z3.string().optional().nullable(),
    isActive: z3.boolean().optional()
  })).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input;
    return updateRecurringActivity(id, ctx.user.id, data);
  }),
  delete: protectedProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ ctx, input }) => {
    return deleteRecurringActivity(input.id, ctx.user.id);
  }),
  // Get exceptions for a date range (to resolve overrides in the calendar)
  exceptions: protectedProcedure.input(z3.object({ dateFrom: z3.string(), dateTo: z3.string() })).query(async ({ ctx, input }) => {
    return getRecurringExceptions(ctx.user.id, input.dateFrom, input.dateTo);
  }),
  // Create/update an exception for a specific day (from drag or edit)
  upsertException: protectedProcedure.input(z3.object({
    recurringId: z3.number(),
    exceptionDate: z3.string(),
    overrideStartHour: z3.number().optional(),
    overrideStartMin: z3.number().optional(),
    overrideDuration: z3.number().optional(),
    isDeleted: z3.boolean().optional()
  })).mutation(async ({ ctx, input }) => {
    return upsertRecurringException({ ...input, userId: ctx.user.id });
  })
});
var invitationsRouter = router({
  // Get pending invitations for the current user
  pending: protectedProcedure.query(async ({ ctx }) => {
    return getPendingInvitationsForUser(ctx.user.id);
  }),
  // Get invitation statuses for a specific time entry (host view)
  forEntry: protectedProcedure.input(z3.object({ timeEntryId: z3.number() })).query(async ({ input }) => {
    return getInvitationsForEntry(input.timeEntryId);
  }),
  // Invite a user to a time entry
  invite: protectedProcedure.input(z3.object({ timeEntryId: z3.number(), inviteeUserId: z3.number() })).mutation(async ({ ctx, input }) => {
    const id = await createActivityInvitation({
      timeEntryId: input.timeEntryId,
      hostUserId: ctx.user.id,
      inviteeUserId: input.inviteeUserId
    });
    return { id };
  }),
  // Accept or decline an invitation
  respond: protectedProcedure.input(z3.object({ id: z3.number(), accept: z3.boolean() })).mutation(async ({ ctx, input }) => {
    return respondToInvitation(input.id, ctx.user.id, input.accept);
  })
});
var documentsRouter = router({
  // ─ Legacy S3 documents ────────────────────────────────────────────────
  myDocuments: protectedProcedure.query(async ({ ctx }) => {
    return getDocumentsForUser(ctx.user.id);
  }),
  userDocuments: protectedProcedure.input(z3.object({ userId: z3.number() })).query(async ({ ctx, input }) => {
    const role = ctx.user.role;
    if (role !== "admin") throw new Error("Acces interzis");
    return getDocumentsForUser(input.userId);
  }),
  upload: protectedProcedure.input(z3.object({
    userId: z3.number(),
    type: z3.enum(["contract", "fisa_post", "evaluare", "certificat", "salariu", "concediu", "medical", "alt"]),
    title: z3.string().min(1),
    description: z3.string().optional(),
    fileUrl: z3.string(),
    fileKey: z3.string(),
    mimeType: z3.string().optional(),
    fileSize: z3.number().optional(),
    year: z3.number().optional(),
    month: z3.number().optional()
  })).mutation(async ({ ctx, input }) => {
    const role = ctx.user.role;
    if (role !== "admin" && input.userId !== ctx.user.id) {
      throw new Error("Acces interzis");
    }
    const id = await createDocument({ ...input, uploadedBy: ctx.user.id });
    await logDocumentAccess(id, ctx.user.id, "upload", ctx.req.ip);
    return { success: true, id };
  }),
  logAccess: protectedProcedure.input(z3.object({ documentId: z3.number(), action: z3.enum(["view", "download"]) })).mutation(async ({ ctx, input }) => {
    await logDocumentAccess(input.documentId, ctx.user.id, input.action, ctx.req.ip);
    return { success: true };
  }),
  // ─ Google Drive documents ───────────────────────────────────────────────
  listMyFiles: protectedProcedure.query(async ({ ctx }) => {
    const mapping = await getEmployeeDriveFolder(ctx.user.id);
    if (!mapping) return { files: [], folderName: null, hasDriveFolder: false };
    const files = await listFilesInFolder(mapping.folderId);
    return { files, folderName: mapping.folderName, hasDriveFolder: true };
  }),
  // Get files from a named subfolder of HUB IC root (e.g. "Regulament intern", "Viziune & Valori")
  listSubfolderFiles: protectedProcedure.input(z3.object({ subfolderName: z3.string() })).query(async ({ input }) => {
    const subfolders = await listSubfolders(HUB_IC_ROOT_FOLDER_ID);
    const target = subfolders.find((f) => f.name === input.subfolderName);
    if (!target) return { files: [], folderId: null };
    const files = await listFilesInFolder(target.id);
    return { files, folderId: target.id };
  }),
  // Admin: list all Drive subfolders inside "Angajați" folder for mapping
  listAngajatiSubfolders: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") {
      throw new Error("Acces interzis");
    }
    const subfolders = await listSubfolders(HUB_IC_ROOT_FOLDER_ID);
    const angajatiFolder = subfolders.find((f) => f.name === "Angaja\u021Bi");
    if (!angajatiFolder) return { subfolders: [], angajatiFolderId: null };
    const employeeFolders = await listSubfolders(angajatiFolder.id);
    return { subfolders: employeeFolders, angajatiFolderId: angajatiFolder.id };
  }),
  // Admin: get all current folder mappings
  listMappings: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") {
      throw new Error("Acces interzis");
    }
    const mappings = await getAllEmployeeDriveFolders();
    const allUsers = await getAllUsers();
    return mappings.map((m) => ({
      ...m,
      userName: allUsers.find((u) => u.id === m.userId)?.name ?? "Utilizator necunoscut"
    }));
  }),
  // Admin: set folder mapping for an employee
  setMapping: protectedProcedure.input(z3.object({
    userId: z3.number(),
    folderId: z3.string(),
    folderName: z3.string()
  })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") {
      throw new Error("Acces interzis");
    }
    await setEmployeeDriveFolder(input.userId, input.folderId, input.folderName);
    return { success: true };
  }),
  // Admin: remove folder mapping
  removeMapping: protectedProcedure.input(z3.object({ userId: z3.number() })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") {
      throw new Error("Acces interzis");
    }
    await deleteEmployeeDriveFolder(input.userId);
    return { success: true };
  }),
  // Test Drive connectivity
  testConnection: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new Error("Acces interzis");
    const ok = await testDriveConnection();
    return { connected: ok };
  }),
  // Admin: get Drive settings (root folder ID)
  getDriveSettings: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new Error("Acces interzis");
    const rootFolderId = await getAppSetting("drive_hub_ic_root_folder_id");
    return {
      rootFolderId: rootFolderId ?? HUB_IC_ROOT_FOLDER_ID,
      isCustom: !!rootFolderId
    };
  }),
  // Admin: update HUB IC root folder ID
  updateDriveSettings: protectedProcedure.input(z3.object({ rootFolderId: z3.string().min(10) })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") throw new Error("Acces interzis");
    await setAppSetting("drive_hub_ic_root_folder_id", input.rootFolderId, ctx.user.id);
    return { success: true };
  }),
  // Admin: get file count for a specific employee's mapped folder
  getEmployeeFileCount: protectedProcedure.input(z3.object({ userId: z3.number() })).query(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") {
      throw new Error("Acces interzis");
    }
    const mapping = await getEmployeeDriveFolder(input.userId);
    if (!mapping) return { count: 0, folderId: null };
    const files = await listFilesInFolder(mapping.folderId);
    return { count: files.length, folderId: mapping.folderId };
  }),
  // Get the Angajati subfolder info (ID for Drive link)
  getAngajatiFolder: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") {
      throw new Error("Acces interzis");
    }
    const rootFolderId = await getAppSetting("drive_hub_ic_root_folder_id") ?? HUB_IC_ROOT_FOLDER_ID;
    const folder = await findFolderByName(rootFolderId, "Angaja\u021Bi");
    return { folderId: folder?.id ?? null, rootFolderId };
  }),
  // ─ Drive change detection & notifications ──────────────────────────────
  // Admin/scheduled: scan all Drive folders, compare with snapshots, send notifications
  checkDriveChanges: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") {
      throw new Error("Acces interzis");
    }
    const rootFolderId = await getAppSetting("drive_hub_ic_root_folder_id") ?? HUB_IC_ROOT_FOLDER_ID;
    const COMPANY_SUBFOLDERS2 = ["Regulament intern", "Viziune & Valori", "Procese & Proceduri", "Biblioteca tehnica"];
    let totalNew = 0, totalModified = 0, totalDeleted = 0;
    for (const subfolderName of COMPANY_SUBFOLDERS2) {
      const subfolder = await findFolderByName(rootFolderId, subfolderName);
      if (!subfolder) continue;
      const currentFiles = await listFilesInFolder(subfolder.id);
      const snapshots = await getDriveSnapshots(subfolder.id);
      const snapshotMap = new Map(snapshots.map((s) => [s.fileId, s]));
      const currentIds = new Set(currentFiles.map((f) => f.id));
      for (const file of currentFiles) {
        const snap = snapshotMap.get(file.id);
        if (!snap) {
          totalNew++;
          await upsertDriveSnapshot({ fileId: file.id, fileName: file.name, folderId: subfolder.id, folderType: "company", subfolderName, modifiedTime: file.modifiedTime, size: file.size, mimeType: file.mimeType });
          const allUsers = await getAllUsers();
          for (const user of allUsers) {
            await createNotification({ userId: user.id, type: "info", title: `Document nou in ${subfolderName}`, message: `A fost adaugat documentul "${file.name}" in ${subfolderName}.`, link: "/documente" });
          }
        } else if (snap.modifiedTime && file.modifiedTime && snap.modifiedTime !== file.modifiedTime) {
          totalModified++;
          await upsertDriveSnapshot({ fileId: file.id, fileName: file.name, folderId: subfolder.id, folderType: "company", subfolderName, modifiedTime: file.modifiedTime, size: file.size, mimeType: file.mimeType });
          const allUsers = await getAllUsers();
          for (const user of allUsers) {
            await createNotification({ userId: user.id, type: "info", title: `Document actualizat in ${subfolderName}`, message: `Documentul "${file.name}" din ${subfolderName} a fost actualizat.`, link: "/documente" });
          }
        }
      }
      for (const snap of snapshots) {
        if (!currentIds.has(snap.fileId)) {
          totalDeleted++;
          await markDriveSnapshotDeleted(snap.fileId);
          const allUsers = await getAllUsers();
          for (const user of allUsers) {
            await createNotification({ userId: user.id, type: "warning", title: `Document sters din ${subfolderName}`, message: `Documentul "${snap.fileName}" a fost eliminat din ${subfolderName}.`, link: "/documente" });
          }
        }
      }
    }
    const allMappings = await getAllEmployeeDriveFolders();
    for (const mapping of allMappings) {
      const currentFiles = await listFilesInFolder(mapping.folderId);
      const snapshots = await getDriveSnapshots(mapping.folderId);
      const snapshotMap = new Map(snapshots.map((s) => [s.fileId, s]));
      const currentIds = new Set(currentFiles.map((f) => f.id));
      for (const file of currentFiles) {
        const snap = snapshotMap.get(file.id);
        if (!snap) {
          totalNew++;
          await upsertDriveSnapshot({ fileId: file.id, fileName: file.name, folderId: mapping.folderId, folderType: "personal", ownerUserId: mapping.userId, modifiedTime: file.modifiedTime, size: file.size, mimeType: file.mimeType });
          await createNotification({ userId: mapping.userId, type: "info", title: "Document personal nou", message: `A fost adaugat documentul "${file.name}" in dosarul tau personal.`, link: "/documente" });
        } else if (snap.modifiedTime && file.modifiedTime && snap.modifiedTime !== file.modifiedTime) {
          totalModified++;
          await upsertDriveSnapshot({ fileId: file.id, fileName: file.name, folderId: mapping.folderId, folderType: "personal", ownerUserId: mapping.userId, modifiedTime: file.modifiedTime, size: file.size, mimeType: file.mimeType });
          await createNotification({ userId: mapping.userId, type: "info", title: "Document personal actualizat", message: `Documentul "${file.name}" din dosarul tau personal a fost actualizat.`, link: "/documente" });
        }
      }
      for (const snap of snapshots) {
        if (!currentIds.has(snap.fileId)) {
          totalDeleted++;
          await markDriveSnapshotDeleted(snap.fileId);
          await createNotification({ userId: mapping.userId, type: "warning", title: "Document personal sters", message: `Documentul "${snap.fileName}" a fost eliminat din dosarul tau personal.`, link: "/documente" });
        }
      }
    }
    return { success: true, totalNew, totalModified, totalDeleted };
  })
});
var appRouter = router({
  system: systemRouter,
  settings: settingsRouter,
  recurring: recurringRouter,
  invitations: invitationsRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  // ─── PONTAJ (REMOVED — migrat la iFlow)
  // ─── PROJECTS (new project management system) ──────────────────────────────
  projects: projectsRouter,
  // ─── TIME TRACKING ───────────────────────────────────────────────────────
  timeTracking: router({
    myEntries: protectedProcedure.input(z3.object({ dateFrom: z3.string().optional(), dateTo: z3.string().optional() })).query(async ({ ctx, input }) => {
      return getTimeEntriesForUser(ctx.user.id, input.dateFrom, input.dateTo);
    }),
    runningTimer: protectedProcedure.query(async ({ ctx }) => {
      return getRunningTimer(ctx.user.id);
    }),
    startTimer: protectedProcedure.input(z3.object({
      projectId: z3.number().optional(),
      taskName: z3.string().optional(),
      activityType: z3.enum(["proiectare", "consultanta", "sedinta", "documentare", "deplasare", "administrativ", "verificare", "executie"]).optional(),
      isBillable: z3.boolean().optional()
    })).mutation(async ({ ctx, input }) => {
      const running = await getRunningTimer(ctx.user.id);
      if (running) {
        const now = /* @__PURE__ */ new Date();
        const start = new Date(running.startTime);
        const duration = Math.floor((now.getTime() - start.getTime()) / 6e4);
        await updateTimeEntry(running.id, { isRunning: false, endTime: now, durationMinutes: duration, status: "salvat" });
      }
      const id = await createTimeEntry({
        userId: ctx.user.id,
        projectId: input.projectId,
        date: /* @__PURE__ */ new Date(),
        startTime: /* @__PURE__ */ new Date(),
        activityType: input.activityType ?? "proiectare",
        taskName: input.taskName,
        isBillable: input.isBillable ?? true,
        isRunning: true,
        status: "draft"
      });
      return { success: true, id };
    }),
    stopTimer: protectedProcedure.input(z3.object({ id: z3.number(), description: z3.string().optional() })).mutation(async ({ ctx, input }) => {
      const now = /* @__PURE__ */ new Date();
      const entries = await getTimeEntriesForUser(ctx.user.id);
      const entry = entries.find((e) => e.id === input.id);
      if (!entry || entry.userId !== ctx.user.id) throw new Error("Intrare neg\u0103sit\u0103");
      const start = new Date(entry.startTime);
      const duration = Math.floor((now.getTime() - start.getTime()) / 6e4);
      await updateTimeEntry(input.id, {
        isRunning: false,
        endTime: now,
        durationMinutes: duration,
        description: input.description,
        status: "salvat"
      });
      return { success: true, durationMinutes: duration };
    }),
    addManual: protectedProcedure.input(z3.object({
      projectId: z3.number().optional(),
      date: z3.string(),
      durationMinutes: z3.number().min(1),
      activityType: z3.enum(["proiectare", "consultanta", "sedinta", "documentare", "deplasare", "administrativ", "verificare", "executie"]),
      taskName: z3.string().optional(),
      description: z3.string().optional(),
      isBillable: z3.boolean().optional()
    })).mutation(async ({ ctx, input }) => {
      await createTimeEntry({
        userId: ctx.user.id,
        ...input,
        date: new Date(input.date),
        status: "salvat",
        isRunning: false
      });
      return { success: true };
    }),
    projectEntries: protectedProcedure.input(z3.object({ projectId: z3.number() })).query(async ({ input }) => {
      return getTimeEntriesForProject(input.projectId);
    }),
    // ── Calendar entry: timezone-safe — receives integers for hours/minutes ──
    addCalendarEntry: protectedProcedure.input(z3.object({
      projectId: z3.number().optional(),
      projectTaskId: z3.number().optional().nullable(),
      date: z3.string(),
      // "YYYY-MM-DD"
      startHour: z3.number(),
      // 0-23
      startMin: z3.number(),
      // 0-59
      endHour: z3.number(),
      // 0-23
      endMin: z3.number(),
      // 0-59
      activityType: z3.enum(["proiectare", "consultanta", "sedinta", "documentare", "deplasare", "administrativ", "verificare", "executie"]).optional(),
      taskName: z3.string().optional(),
      description: z3.string().optional(),
      isBillable: z3.boolean().optional()
    })).mutation(async ({ ctx, input }) => {
      if (input.taskName) {
        const exists = await checkTimeEntryExists(
          ctx.user.id,
          input.date,
          input.taskName,
          input.startHour,
          input.startMin
        );
        if (exists) return { success: true, id: null, skipped: true };
      }
      const durationMinutes = input.endHour * 60 + input.endMin - (input.startHour * 60 + input.startMin);
      const safeDuration = Math.max(0, durationMinutes);
      const id = await createTimeEntry({
        userId: ctx.user.id,
        projectId: input.projectId,
        date: /* @__PURE__ */ new Date(input.date + "T12:00:00Z"),
        startHour: input.startHour,
        startMin: input.startMin,
        endHour: input.endHour,
        endMin: input.endMin,
        durationMinutes: safeDuration,
        activityType: input.activityType ?? "proiectare",
        taskName: input.taskName,
        description: input.description,
        isBillable: input.isBillable ?? true,
        isRunning: false,
        status: "salvat"
      });
      if (input.projectTaskId && safeDuration > 0) {
        const db = await getDb();
        if (db) {
          await db.execute(
            sql`UPDATE project_tasks SET minutesWorked = minutesWorked + ${safeDuration} WHERE id = ${input.projectTaskId}`
          );
          await db.execute(
            sql`UPDATE time_entries SET projectTaskId = ${input.projectTaskId} WHERE id = ${id}`
          );
          const [updatedTask] = await db.execute(
            sql`SELECT minutesWorked, projectId FROM project_tasks WHERE id = ${input.projectTaskId}`
          );
          const taskRow = (updatedTask[0] ?? [])[0];
          if (taskRow) {
            await checkBudgetAlerts(input.projectTaskId, taskRow.projectId, taskRow.minutesWorked);
          }
        }
      }
      return { success: true, id, skipped: false };
    }),
    updateCalendarEntry: protectedProcedure.input(z3.object({
      id: z3.number(),
      projectId: z3.number().optional().nullable(),
      date: z3.string(),
      startHour: z3.number(),
      startMin: z3.number(),
      endHour: z3.number(),
      endMin: z3.number(),
      activityType: z3.enum(["proiectare", "consultanta", "sedinta", "documentare", "deplasare", "administrativ", "verificare", "executie"]).optional(),
      taskName: z3.string().optional(),
      description: z3.string().optional(),
      isBillable: z3.boolean().optional()
    })).mutation(async ({ ctx, input }) => {
      const entries = await getTimeEntriesForUser(ctx.user.id);
      const entry = entries.find((e) => e.id === input.id);
      if (!entry || entry.userId !== ctx.user.id) throw new Error("Intrare neg\u0103sit\u0103");
      const durationMinutes = input.endHour * 60 + input.endMin - (input.startHour * 60 + input.startMin);
      await updateTimeEntry(input.id, {
        projectId: input.projectId ?? void 0,
        date: /* @__PURE__ */ new Date(input.date + "T12:00:00Z"),
        startHour: input.startHour,
        startMin: input.startMin,
        endHour: input.endHour,
        endMin: input.endMin,
        durationMinutes: Math.max(0, durationMinutes),
        activityType: input.activityType ?? "proiectare",
        taskName: input.taskName,
        description: input.description,
        isBillable: input.isBillable ?? true
      });
      return { success: true };
    }),
    deleteEntry: protectedProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ ctx, input }) => {
      const entries = await getTimeEntriesForUser(ctx.user.id);
      const entry = entries.find((e) => e.id === input.id);
      if (!entry || entry.userId !== ctx.user.id) throw new Error("Intrare neg\u0103sit\u0103");
      const db = await (await Promise.resolve().then(() => (init_db(), db_exports))).getDb();
      if (db) {
        const { timeEntries: timeEntries2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
        const { eq: eq3 } = await import("drizzle-orm");
        await db.delete(timeEntries2).where(eq3(timeEntries2.id, input.id));
      }
      return { success: true };
    })
  }),
  // ─── NEWS ────────────────────────────────────────────────────────────────
  news: router({
    list: protectedProcedure.input(z3.object({ category: z3.string().optional(), limit: z3.number().optional() })).query(async ({ input }) => {
      return getNews(input.limit ?? 20, input.category);
    }),
    byId: protectedProcedure.input(z3.object({ id: z3.number() })).query(async ({ input }) => {
      return getNewsById(input.id);
    }),
    comments: protectedProcedure.input(z3.object({ newsId: z3.number() })).query(async ({ input }) => {
      return getNewsComments(input.newsId);
    }),
    create: protectedProcedure.input(z3.object({
      title: z3.string().min(1),
      content: z3.string().min(1),
      excerpt: z3.string().optional(),
      category: z3.enum(["companie", "proiecte", "hr", "it", "evenimente", "realizari"]),
      tags: z3.array(z3.string()).optional(),
      isPinned: z3.boolean().optional(),
      isImportant: z3.boolean().optional(),
      imageUrl: z3.string().optional()
    })).mutation(async ({ ctx, input }) => {
      const role = ctx.user.role;
      if (role !== "admin") {
        throw new Error("Acces interzis");
      }
      const id = await createNews({ ...input, authorId: ctx.user.id });
      return { success: true, id };
    }),
    update: protectedProcedure.input(z3.object({
      id: z3.number(),
      title: z3.string().min(1),
      content: z3.string().min(1),
      excerpt: z3.string().optional(),
      category: z3.enum(["companie", "proiecte", "hr", "it", "evenimente", "realizari"]),
      tags: z3.array(z3.string()).optional(),
      isPinned: z3.boolean().optional(),
      isImportant: z3.boolean().optional(),
      imageUrl: z3.string().optional().nullable()
    })).mutation(async ({ ctx, input }) => {
      const existing = await getNewsById(input.id);
      if (!existing) throw new Error("\u0218tirea nu a fost g\u0103sit\u0103");
      if (ctx.user.role !== "admin" && existing.news.authorId !== ctx.user.id) {
        throw new Error("Nu ai permisiunea de a edita aceast\u0103 \u0219tire");
      }
      const { id, ...data } = input;
      await updateNews(id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ ctx, input }) => {
      const existing = await getNewsById(input.id);
      if (!existing) throw new Error("\u0218tirea nu a fost g\u0103sit\u0103");
      if (ctx.user.role !== "admin" && existing.news.authorId !== ctx.user.id) {
        throw new Error("Nu ai permisiunea de a \u0219terge aceast\u0103 \u0219tire");
      }
      await deleteNews(input.id);
      return { success: true };
    }),
    react: protectedProcedure.input(z3.object({ newsId: z3.number(), reaction: z3.string() })).mutation(async ({ ctx, input }) => {
      await addNewsReaction(input.newsId, ctx.user.id, input.reaction);
      return { success: true };
    })
  }),
  documents: documentsRouter,
  // ─── PROCESSES ───────────────────────────────────────────────────────────
  processes: router({
    list: protectedProcedure.input(z3.object({ department: z3.string().optional(), category: z3.string().optional() })).query(async ({ input }) => {
      return getProcesses(input.department, input.category);
    }),
    byId: protectedProcedure.input(z3.object({ id: z3.number() })).query(async ({ input }) => {
      return getProcessById(input.id);
    }),
    confirmRead: protectedProcedure.input(z3.object({ processId: z3.number() })).mutation(async ({ ctx, input }) => {
      await confirmProcessRead(input.processId, ctx.user.id);
      return { success: true };
    }),
    readStatus: protectedProcedure.input(z3.object({ processId: z3.number() })).query(async ({ ctx, input }) => {
      const role = ctx.user.role;
      if (role !== "admin") {
        throw new Error("Acces interzis");
      }
      return getProcessReadStatus(input.processId);
    })
  }),
  // ─── PROPOSALS ───────────────────────────────────────────────────────────
  proposals: router({
    list: protectedProcedure.input(z3.object({ status: z3.string().optional() })).query(async ({ input }) => {
      return getProposals(input.status);
    }),
    byId: protectedProcedure.input(z3.object({ id: z3.number() })).query(async ({ input }) => {
      return getProposalById(input.id);
    }),
    create: protectedProcedure.input(z3.object({
      title: z3.string().min(1),
      description: z3.string().min(1),
      benefits: z3.string().optional(),
      departments: z3.array(z3.string()).optional(),
      isAnonymous: z3.boolean().optional()
    })).mutation(async ({ ctx, input }) => {
      const year = (/* @__PURE__ */ new Date()).getFullYear();
      const month = String((/* @__PURE__ */ new Date()).getMonth() + 1).padStart(2, "0");
      const rand = Math.floor(Math.random() * 9e3) + 1e3;
      const referenceNumber = `IC-${year}-${month}-${rand}`;
      const id = await createProposal({
        ...input,
        authorId: ctx.user.id,
        referenceNumber
      });
      return { success: true, id, referenceNumber };
    }),
    vote: protectedProcedure.input(z3.object({ proposalId: z3.number() })).mutation(async ({ ctx, input }) => {
      const voted = await voteProposal(input.proposalId, ctx.user.id);
      return { success: true, voted };
    })
  }),
  // ─── NOTIFICATIONS ───────────────────────────────────────────────────────
  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getNotifications(ctx.user.id);
    }),
    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      const count = await getUnreadNotificationCount(ctx.user.id);
      return { count };
    }),
    markRead: protectedProcedure.mutation(async ({ ctx }) => {
      await markNotificationsRead(ctx.user.id);
      return { success: true };
    })
  }),
  // ─── USERS (HR/ADMIN) ────────────────────────────────────────────────────
  users: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const role = ctx.user.role;
      if (role !== "admin") {
        throw new Error("Acces interzis");
      }
      return getAllUsers();
    }),
    updateProfile: protectedProcedure.input(z3.object({
      name: z3.string().optional(),
      phone: z3.string().optional(),
      department: z3.string().optional(),
      jobTitle: z3.string().optional(),
      avatarUrl: z3.string().optional()
    })).mutation(async ({ ctx, input }) => {
      await updateUser(ctx.user.id, input);
      return { success: true };
    })
  }),
  // ─── LEAVE REQUESTS (REMOVED — migrat la iFlow)
  // ─── ADMIN USERS ─────────────────────────────────────────────────────────────────
  adminUsers: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const role = ctx.user.role;
      if (role !== "admin") throw new Error("Acces interzis");
      return getAllUsersAdmin();
    }),
    updateRole: protectedProcedure.input(z3.object({
      id: z3.number(),
      role: z3.enum(["admin", "coordonator", "angajat", "colaborator"])
    })).mutation(async ({ ctx, input }) => {
      const role = ctx.user.role;
      if (role !== "admin") throw new Error("Acces interzis");
      await updateUserRole(input.id, input.role);
      return { success: true };
    }),
    toggleActive: protectedProcedure.input(z3.object({ id: z3.number(), isActive: z3.boolean() })).mutation(async ({ ctx, input }) => {
      const role = ctx.user.role;
      if (role !== "admin") throw new Error("Acces interzis");
      await updateUserActive(input.id, input.isActive);
      return { success: true };
    }),
    updateProfile: protectedProcedure.input(z3.object({
      id: z3.number(),
      name: z3.string().optional(),
      department: z3.string().optional(),
      jobTitle: z3.string().optional(),
      phone: z3.string().optional()
    })).mutation(async ({ ctx, input }) => {
      const role = ctx.user.role;
      if (role !== "admin") throw new Error("Acces interzis");
      const { id, ...data } = input;
      await updateUserProfile(id, data);
      return { success: true };
    }),
    deleteUser: protectedProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Acces interzis");
      if (ctx.user.id === input.id) throw new Error("Nu \u021Bi po\u021Bi \u0219terge propriul cont");
      await deleteUserCompletely(input.id);
      return { success: true };
    }),
    reorderUsers: protectedProcedure.input(z3.object({
      orderList: z3.array(z3.object({ userId: z3.number(), displayOrder: z3.number() }))
    })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Acces interzis");
      await updateUsersDisplayOrder(input.orderList);
      return { success: true };
    })
  }),
  // ─── HR DASHBOARD (REMOVED — migrat la iFlow)
  // ─── PROFIL EXTINS ────────────────────────────────────────────────────────────────────────────────────────
  profile: router({
    getMyProfile: protectedProcedure.query(async ({ ctx }) => {
      return getFullProfile(ctx.user.id);
    }),
    adminGetProfile: protectedProcedure.input(z3.object({ userId: z3.number() })).query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.id !== input.userId)
        throw new Error("Acces interzis");
      return getFullProfile(input.userId);
    }),
    // Any authenticated user can view basic info of a colleague
    viewColleague: protectedProcedure.input(z3.object({ userId: z3.number() })).query(async ({ ctx, input }) => {
      const full = await getFullProfile(input.userId);
      if (!full) return null;
      if (ctx.user.role === "admin") return { ...full, isFullAccess: true };
      return {
        id: full.id,
        name: full.name,
        email: full.email,
        role: full.role,
        department: full.department,
        jobTitle: full.jobTitle,
        phone: full.phone,
        phoneMobile: full.phoneMobile,
        city: full.city,
        birthDate: full.birthDate,
        hireDate: full.hireDate,
        avatarUrl: full.avatarUrl,
        isActive: full.isActive,
        isFullAccess: false
      };
    }),
    updateMyProfile: protectedProcedure.input(z3.object({
      name: z3.string().min(1).optional(),
      phone: z3.string().optional().nullable(),
      phoneMobile: z3.string().optional().nullable(),
      department: z3.string().optional().nullable(),
      jobTitle: z3.string().optional().nullable(),
      birthDate: z3.string().optional().nullable(),
      hireDate: z3.string().optional().nullable(),
      addressBuletin: z3.string().optional().nullable(),
      addressSecondary: z3.string().optional().nullable(),
      city: z3.string().optional().nullable(),
      cnp: z3.string().max(13).optional().nullable(),
      ciSeries: z3.string().max(4).optional().nullable(),
      ciNumber: z3.string().max(10).optional().nullable(),
      ciExpiry: z3.string().optional().nullable(),
      ciIssuedBy: z3.string().optional().nullable(),
      iban: z3.string().max(34).optional().nullable(),
      bankName: z3.string().optional().nullable(),
      emergencyContact: z3.string().optional().nullable(),
      emergencyPhone: z3.string().optional().nullable(),
      emergencyRelation: z3.string().optional().nullable(),
      bloodType: z3.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).optional().nullable(),
      allergies: z3.string().optional().nullable(),
      profileNotes: z3.string().optional().nullable()
    })).mutation(async ({ ctx, input }) => {
      return updateFullProfile(ctx.user.id, input);
    }),
    adminUpdateProfile: protectedProcedure.input(z3.object({
      userId: z3.number(),
      name: z3.string().min(1).optional(),
      phone: z3.string().optional().nullable(),
      phoneMobile: z3.string().optional().nullable(),
      department: z3.string().optional().nullable(),
      jobTitle: z3.string().optional().nullable(),
      birthDate: z3.string().optional().nullable(),
      hireDate: z3.string().optional().nullable(),
      addressBuletin: z3.string().optional().nullable(),
      addressSecondary: z3.string().optional().nullable(),
      city: z3.string().optional().nullable(),
      cnp: z3.string().max(13).optional().nullable(),
      ciSeries: z3.string().max(4).optional().nullable(),
      ciNumber: z3.string().max(10).optional().nullable(),
      ciExpiry: z3.string().optional().nullable(),
      ciIssuedBy: z3.string().optional().nullable(),
      iban: z3.string().max(34).optional().nullable(),
      bankName: z3.string().optional().nullable(),
      emergencyContact: z3.string().optional().nullable(),
      emergencyPhone: z3.string().optional().nullable(),
      emergencyRelation: z3.string().optional().nullable(),
      bloodType: z3.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).optional().nullable(),
      allergies: z3.string().optional().nullable(),
      profileNotes: z3.string().optional().nullable(),
      workHoursPerDay: z3.string().optional().nullable()
    })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Acces interzis");
      const { userId, ...data } = input;
      return updateFullProfile(userId, data);
    })
  }),
  people: peopleRouter,
  // ─── COMPANY EVENTS ──────────────────────────────────────────────────────────────────
  companyEvents: router({
    list: protectedProcedure.input(z3.object({ dateFrom: z3.string(), dateTo: z3.string() })).query(async ({ input }) => {
      return getCompanyEvents(input.dateFrom, input.dateTo);
    }),
    listAll: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") throw new Error("Acces interzis");
      return getAllCompanyEvents();
    }),
    create: protectedProcedure.input(z3.object({
      title: z3.string().min(1),
      description: z3.string().optional(),
      link: z3.string().optional(),
      startTime: z3.string(),
      // ISO string
      endTime: z3.string(),
      isRecurring: z3.boolean().optional(),
      recurringRule: z3.string().optional(),
      recurringUntil: z3.string().optional().nullable(),
      color: z3.string().optional(),
      targetType: z3.enum(["all", "department", "users"]).default("all"),
      targetDepartment: z3.string().optional(),
      targetUserIds: z3.array(z3.number()).optional(),
      activityType: z3.enum(["proiectare", "consultanta", "sedinta", "documentare", "deplasare", "administrativ", "verificare", "executie"]).optional(),
      projectId: z3.number().optional()
    })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") throw new Error("Acces interzis \u2014 doar adminii \u0219i coordonatorii pot crea evenimente");
      return createCompanyEvent({
        ...input,
        startTime: new Date(input.startTime),
        endTime: new Date(input.endTime),
        createdBy: ctx.user.id
      });
    }),
    update: protectedProcedure.input(z3.object({
      id: z3.number(),
      title: z3.string().optional(),
      description: z3.string().optional(),
      link: z3.string().optional(),
      startTime: z3.string().optional(),
      endTime: z3.string().optional(),
      isRecurring: z3.boolean().optional(),
      recurringRule: z3.string().optional(),
      recurringUntil: z3.string().optional().nullable(),
      color: z3.string().optional(),
      targetType: z3.enum(["all", "department", "users"]).optional(),
      targetDepartment: z3.string().optional(),
      targetUserIds: z3.array(z3.number()).optional(),
      activityType: z3.enum(["proiectare", "consultanta", "sedinta", "documentare", "deplasare", "administrativ", "verificare", "executie"]).optional(),
      projectId: z3.number().optional().nullable(),
      isActive: z3.boolean().optional()
    })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") throw new Error("Acces interzis");
      const { id, startTime, endTime, ...rest } = input;
      const { recurringUntil: ru, ...restClean } = rest;
      return updateCompanyEvent(id, {
        ...restClean,
        ...ru != null ? { recurringUntil: ru } : {},
        ...startTime ? { startTime: new Date(startTime) } : {},
        ...endTime ? { endTime: new Date(endTime) } : {}
      });
    }),
    delete: protectedProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") throw new Error("Acces interzis");
      return deleteCompanyEvent(input.id);
    })
  }),
  // ─── PROCESS OVERVIEW (calendar echipă) ──────────────────────────────────────────
  processOverview: router({
    getData: protectedProcedure.input(z3.object({
      dateFrom: z3.string(),
      dateTo: z3.string()
    })).query(async ({ input }) => {
      return getProcessOverview(input.dateFrom, input.dateTo);
    })
  }),
  // ─── GOOGLE CALENDAR ─────────────────────────────────────────────────────────
  googleCalendar: router({
    // Check if user has connected Google Calendar
    status: protectedProcedure.query(async ({ ctx }) => {
      const connected = await hasGoogleCalendarConnected(ctx.user.id);
      return { connected };
    }),
    // Get OAuth URL to connect Google Calendar
    getAuthUrl: protectedProcedure.input(z3.object({ origin: z3.string() })).query(async ({ ctx, input }) => {
      const redirectUri = `${input.origin}/api/oauth/google-calendar/callback`;
      const state = Buffer.from(JSON.stringify({ userId: ctx.user.id, origin: input.origin })).toString("base64");
      const url = getGoogleCalendarAuthUrl(redirectUri, state);
      return { url };
    }),
    // Fetch events from Google Calendar for a date range
    getEvents: protectedProcedure.input(z3.object({ dateFrom: z3.string(), dateTo: z3.string() })).query(async ({ ctx }) => {
      const accessToken = await getValidAccessToken(ctx.user.id);
      if (!accessToken) return { events: [], connected: false };
      return { events: [], connected: true };
    }),
    // Sync time entry to Google Calendar (create/update event)
    syncTimeEntry: protectedProcedure.input(z3.object({
      timeEntryId: z3.number(),
      title: z3.string(),
      startTime: z3.string(),
      endTime: z3.string(),
      description: z3.string().optional()
    })).mutation(async ({ ctx, input }) => {
      const accessToken = await getValidAccessToken(ctx.user.id);
      if (!accessToken) return { success: false, reason: "not_connected" };
      const existing = await getSyncMapByTimeEntry(ctx.user.id, input.timeEntryId);
      const eventPayload = {
        summary: input.title,
        description: input.description,
        start: { dateTime: input.startTime },
        end: { dateTime: input.endTime }
      };
      if (existing) {
        await updateCalendarEvent(accessToken, existing.gcalEventId, eventPayload);
      } else {
        const created = await createCalendarEvent(accessToken, eventPayload);
        await upsertSyncMap(ctx.user.id, input.timeEntryId, created.id);
      }
      return { success: true };
    }),
    // Delete synced Google Calendar event when time entry is deleted
    deleteSyncedEvent: protectedProcedure.input(z3.object({ timeEntryId: z3.number() })).mutation(async ({ ctx, input }) => {
      const accessToken = await getValidAccessToken(ctx.user.id);
      const existing = await getSyncMapByTimeEntry(ctx.user.id, input.timeEntryId);
      if (accessToken && existing) {
        await deleteCalendarEvent(accessToken, existing.gcalEventId);
      }
      await deleteSyncMapByTimeEntry(ctx.user.id, input.timeEntryId);
      return { success: true };
    }),
    // Disconnect Google Calendar
    disconnect: protectedProcedure.mutation(async ({ ctx }) => {
      await disconnectGoogleCalendar(ctx.user.id);
      return { success: true };
    }),
    // Import today's Google Calendar events as time entry suggestions
    importTodayEvents: protectedProcedure.input(z3.object({ date: z3.string(), dateTo: z3.string().optional() })).query(async ({ ctx, input }) => {
      const accessToken = await getValidAccessToken(ctx.user.id);
      if (!accessToken) return { events: [], connected: false };
      const dayStart = new Date(input.date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(input.dateTo ?? input.date);
      dayEnd.setHours(23, 59, 59, 999);
      try {
        const events = await fetchCalendarEvents(
          accessToken,
          dayStart.toISOString(),
          dayEnd.toISOString()
        );
        return {
          connected: true,
          events: events.filter((e) => e.start.dateTime).map((e) => ({
            id: e.id,
            title: e.summary ?? "(f\u0103r\u0103 titlu)",
            startTime: e.start.dateTime,
            endTime: e.end.dateTime,
            htmlLink: e.htmlLink
          }))
        };
      } catch {
        return { events: [], connected: false };
      }
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs3 from "fs";
import { nanoid } from "nanoid";
import path3 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs2 from "node:fs";
import path2 from "node:path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
var PROJECT_ROOT = import.meta.dirname;
var LOG_DIR = path2.join(PROJECT_ROOT, ".manus-logs");
var MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024;
var TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6);
function ensureLogDir() {
  if (!fs2.existsSync(LOG_DIR)) {
    fs2.mkdirSync(LOG_DIR, { recursive: true });
  }
}
function trimLogFile(logPath, maxSize) {
  try {
    if (!fs2.existsSync(logPath) || fs2.statSync(logPath).size <= maxSize) {
      return;
    }
    const lines = fs2.readFileSync(logPath, "utf-8").split("\n");
    const keptLines = [];
    let keptBytes = 0;
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}
`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }
    fs2.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
  }
}
function writeToLogFile(source, entries) {
  if (entries.length === 0) return;
  ensureLogDir();
  const logPath = path2.join(LOG_DIR, `${source}.log`);
  const lines = entries.map((entry) => {
    const ts = (/* @__PURE__ */ new Date()).toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });
  fs2.appendFileSync(logPath, `${lines.join("\n")}
`, "utf-8");
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}
function vitePluginManusDebugCollector() {
  return {
    name: "manus-debug-collector",
    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true
            },
            injectTo: "head"
          }
        ]
      };
    },
    configureServer(server) {
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }
        const handlePayload = (payload) => {
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };
        const reqBody = req.body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    }
  };
}
var plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime(), vitePluginManusDebugCollector()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path2.resolve(import.meta.dirname, "client", "src"),
      "@shared": path2.resolve(import.meta.dirname, "shared"),
      "@assets": path2.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path2.resolve(import.meta.dirname),
  root: path2.resolve(import.meta.dirname, "client"),
  publicDir: path2.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path2.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/_core/vite.ts
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs3.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path3.resolve(import.meta.dirname, "../..", "dist", "public") : path3.resolve(import.meta.dirname, "public");
  if (!fs3.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/_core/index.ts
process.env.TZ = "Europe/Bucharest";
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = express2();
  const server = createServer(app);
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  registerOAuthRoutes(app);
  registerGoogleCalendarRoutes(app);
  registerReportRoutes(app);
  registerDriveProxyRoutes(app);
  registerScheduledDriveRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
startServer().catch(console.error);
