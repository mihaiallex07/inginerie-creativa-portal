import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  date,
  time,
  decimal,
  json,
} from "drizzle-orm/mysql-core";

// ─── USERS ───────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["super_admin", "admin_hr", "manager", "angajat", "colaborator"]).default("angajat").notNull(),
  department: varchar("department", { length: 128 }),
  jobTitle: varchar("jobTitle", { length: 128 }),
  avatarUrl: text("avatarUrl"),
  phone: varchar("phone", { length: 32 }),
  isActive: boolean("isActive").default(true).notNull(),
  workHoursPerDay: decimal("workHoursPerDay", { precision: 4, scale: 2 }).default("8.00"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── PONTAJ ──────────────────────────────────────────────────────────────────
export const pontaj = mysqlTable("pontaj", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: date("date").notNull(),
  checkIn: timestamp("checkIn"),
  checkOut: timestamp("checkOut"),
  breakMinutes: int("breakMinutes").default(0),
  totalMinutes: int("totalMinutes").default(0),
  type: mysqlEnum("type", ["birou", "remote", "deplasare", "concediu", "medical", "liber_legal", "absent", "recuperare", "santier", "eveniment"]).default("birou").notNull(),
  notes: text("notes"),
  isApproved: boolean("isApproved").default(false),
  approvedBy: int("approvedBy"),
  correctionRequested: boolean("correctionRequested").default(false),
  correctionNote: text("correctionNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Pontaj = typeof pontaj.$inferSelect;
export type InsertPontaj = typeof pontaj.$inferInsert;

// ─── PROJECTS ────────────────────────────────────────────────────────────────
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  code: varchar("code", { length: 64 }),
  driveId: varchar("driveId", { length: 128 }),
  drivePath: text("drivePath"),
  status: mysqlEnum("status", ["activ", "suspendat", "finalizat", "intern"]).default("activ").notNull(),
  clientName: varchar("clientName", { length: 256 }),
  estimatedHours: decimal("estimatedHours", { precision: 8, scale: 2 }),
  managerId: int("managerId"),
  description: text("description"),
  color: varchar("color", { length: 16 }).default("#FFCB09"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

// ─── TIME TRACKING ───────────────────────────────────────────────────────────
export const timeEntries = mysqlTable("time_entries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId"),
  date: date("date").notNull(),
  startTime: timestamp("startTime"),
  endTime: timestamp("endTime"),
  durationMinutes: int("durationMinutes").default(0),
  activityType: mysqlEnum("activityType", ["proiectare", "consultanta", "sedinta", "documentare", "deplasare", "administrativ", "verificare", "executie"]).default("proiectare").notNull(),
  taskName: varchar("taskName", { length: 256 }),
  description: text("description"),
  isBillable: boolean("isBillable").default(true),
  isRunning: boolean("isRunning").default(false),
  status: mysqlEnum("status", ["draft", "salvat", "aprobat", "blocat"]).default("salvat").notNull(),
  approvedBy: int("approvedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TimeEntry = typeof timeEntries.$inferSelect;
export type InsertTimeEntry = typeof timeEntries.$inferInsert;

// ─── NEWS ────────────────────────────────────────────────────────────────────
export const news = mysqlTable("news", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 512 }).notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  category: mysqlEnum("category", ["companie", "proiecte", "hr", "it", "evenimente", "realizari"]).default("companie").notNull(),
  tags: json("tags").$type<string[]>().default([]),
  authorId: int("authorId").notNull(),
  isPinned: boolean("isPinned").default(false),
  isImportant: boolean("isImportant").default(false),
  imageUrl: text("imageUrl"),
  publishedAt: timestamp("publishedAt").defaultNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type News = typeof news.$inferSelect;
export type InsertNews = typeof news.$inferInsert;

export const newsReactions = mysqlTable("news_reactions", {
  id: int("id").autoincrement().primaryKey(),
  newsId: int("newsId").notNull(),
  userId: int("userId").notNull(),
  reaction: varchar("reaction", { length: 16 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const newsComments = mysqlTable("news_comments", {
  id: int("id").autoincrement().primaryKey(),
  newsId: int("newsId").notNull(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── DOCUMENTS ───────────────────────────────────────────────────────────────
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  uploadedBy: int("uploadedBy").notNull(),
  type: mysqlEnum("type", ["contract", "fisa_post", "evaluare", "certificat", "salariu", "concediu", "medical", "alt"]).default("alt").notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  description: text("description"),
  fileUrl: text("fileUrl"),
  fileKey: varchar("fileKey", { length: 512 }),
  mimeType: varchar("mimeType", { length: 128 }),
  fileSize: int("fileSize"),
  isConfidential: boolean("isConfidential").default(true),
  year: int("year"),
  month: int("month"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

export const documentAuditLog = mysqlTable("document_audit_log", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(),
  userId: int("userId").notNull(),
  action: mysqlEnum("action", ["view", "download", "upload", "delete", "update"]).notNull(),
  ipAddress: varchar("ipAddress", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── PROCESSES ───────────────────────────────────────────────────────────────
export const processes = mysqlTable("processes", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 512 }).notNull(),
  code: varchar("code", { length: 64 }),
  department: varchar("department", { length: 128 }).notNull(),
  category: mysqlEnum("category", ["proiectare", "management", "financiar", "hr", "it", "achizitii", "comunicare", "alt"]).default("alt").notNull(),
  version: varchar("version", { length: 32 }).default("1.0"),
  ownerId: int("ownerId"),
  content: text("content"),
  status: mysqlEnum("status", ["activ", "in_revizuire", "arhivat"]).default("activ").notNull(),
  isMandatoryRead: boolean("isMandatoryRead").default(false),
  targetRoles: json("targetRoles").$type<string[]>().default([]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Process = typeof processes.$inferSelect;
export type InsertProcess = typeof processes.$inferInsert;

export const processReadConfirmations = mysqlTable("process_read_confirmations", {
  id: int("id").autoincrement().primaryKey(),
  processId: int("processId").notNull(),
  userId: int("userId").notNull(),
  confirmedAt: timestamp("confirmedAt").defaultNow().notNull(),
});

// ─── PROPOSALS ───────────────────────────────────────────────────────────────
export const proposals = mysqlTable("proposals", {
  id: int("id").autoincrement().primaryKey(),
  referenceNumber: varchar("referenceNumber", { length: 32 }).notNull().unique(),
  title: varchar("title", { length: 512 }).notNull(),
  description: text("description").notNull(),
  benefits: text("benefits"),
  departments: json("departments").$type<string[]>().default([]),
  authorId: int("authorId").notNull(),
  isAnonymous: boolean("isAnonymous").default(false),
  status: mysqlEnum("status", ["deschisa", "in_evaluare", "acceptata", "amanata", "respinsa"]).default("deschisa").notNull(),
  managerId: int("managerId"),
  managerDecision: text("managerDecision"),
  committeeDecision: text("committeeDecision"),
  votesCount: int("votesCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Proposal = typeof proposals.$inferSelect;
export type InsertProposal = typeof proposals.$inferInsert;

export const proposalVotes = mysqlTable("proposal_votes", {
  id: int("id").autoincrement().primaryKey(),
  proposalId: int("proposalId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const proposalComments = mysqlTable("proposal_comments", {
  id: int("id").autoincrement().primaryKey(),
  proposalId: int("proposalId").notNull(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: varchar("type", { length: 64 }).notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  message: text("message"),
  link: varchar("link", { length: 512 }),
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
