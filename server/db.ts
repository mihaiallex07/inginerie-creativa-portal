import { and, desc, eq, gte, isNotNull, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  companyEvents,
  documentAuditLog,
  documents,
  InsertUser,
  news,
  newsComments,
  newsReactions,
  notifications,
  pontaj,
  processReadConfirmations,
  processes,
  projects,
  proposalComments,
  proposalVotes,
  proposals,
  timeEntries,
  users,
  appSettings,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// ─── APP SETTINGS ─────────────────────────────────────────────────────────
export async function getAppSetting(key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(appSettings).where(eq(appSettings.key, key)).limit(1);
  return result[0]?.value ?? null;
}

export async function setAppSetting(key: string, value: string, updatedBy: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(appSettings).where(eq(appSettings.key, key)).limit(1);
  if (existing.length > 0) {
    await db.update(appSettings).set({ value, updatedBy }).where(eq(appSettings.key, key));
  } else {
    await db.insert(appSettings).values({ key, value, updatedBy });
  }
}

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── USERS ───────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  textFields.forEach((field) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(eq(users.isActive, true)).orderBy(users.name);
}

export async function updateUser(id: number, data: Partial<typeof users.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, id));
}

// ─── PONTAJ ──────────────────────────────────────────────────────────────────
export async function getTodayPontaj(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const today = new Date().toISOString().split("T")[0];
  const result = await db
    .select()
    .from(pontaj)
    .where(and(eq(pontaj.userId, userId), sql`DATE(${pontaj.date}) = ${today}`))
    .limit(1);
  return result[0] ?? null;
}

export async function upsertPontaj(data: typeof pontaj.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const existing = await getTodayPontaj(data.userId);
  if (existing) {
    await db.update(pontaj).set(data).where(eq(pontaj.id, existing.id));
    return existing.id;
  } else {
    const result = await db.insert(pontaj).values(data);
    return (result[0] as any).insertId;
  }
}

export async function getPontajByMonth(userId: number, year: number, month: number) {
  const db = await getDb();
  if (!db) return [];
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = `${year}-${String(month).padStart(2, "0")}-31`;
  return db
    .select()
    .from(pontaj)
    .where(and(eq(pontaj.userId, userId), sql`DATE(${pontaj.date}) >= ${start}`, sql`DATE(${pontaj.date}) <= ${end}`))
    .orderBy(pontaj.date);
}

export async function getAllPontajByMonth(year: number, month: number) {
  const db = await getDb();
  if (!db) return [];
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = `${year}-${String(month).padStart(2, "0")}-31`;
  return db
    .select({ pontaj, user: { id: users.id, name: users.name, email: users.email, department: users.department } })
    .from(pontaj)
    .leftJoin(users, eq(pontaj.userId, users.id))
    .where(and(sql`DATE(${pontaj.date}) >= ${start}`, sql`DATE(${pontaj.date}) <= ${end}`))
    .orderBy(users.name, pontaj.date);
}

export async function updatePontajEntry(id: number, userId: number, data: Partial<typeof pontaj.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(pontaj).set({ ...data, updatedAt: new Date() }).where(and(eq(pontaj.id, id), eq(pontaj.userId, userId)));
}

export async function deletePontajEntry(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(pontaj).where(and(eq(pontaj.id, id), eq(pontaj.userId, userId)));
}

export async function getPontajById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(pontaj).where(eq(pontaj.id, id)).limit(1);
  return result[0] ?? null;
}

// ─── PROJECTS ────────────────────────────────────────────────────────────────
export async function getProjects(status?: string) {
  const db = await getDb();
  if (!db) return [];
  if (status) {
    return db.select().from(projects).where(eq(projects.status, status as any)).orderBy(projects.name);
  }
  return db.select().from(projects).orderBy(projects.name);
}

export async function upsertProject(data: typeof projects.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  if (data.id) {
    await db.update(projects).set(data).where(eq(projects.id, data.id));
  } else {
    await db.insert(projects).values(data);
  }
}

// ─── TIME ENTRIES ────────────────────────────────────────────────────────────
export async function getTimeEntriesForUser(userId: number, dateFrom?: string, dateTo?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [eq(timeEntries.userId, userId)];
  if (dateFrom) conditions.push(sql`DATE(${timeEntries.date}) >= ${dateFrom}`);
  if (dateTo) conditions.push(sql`DATE(${timeEntries.date}) <= ${dateTo}`);
  return db.select().from(timeEntries).where(and(...conditions)).orderBy(desc(timeEntries.date), desc(timeEntries.createdAt));
}

export async function getRunningTimer(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(timeEntries)
    .where(and(eq(timeEntries.userId, userId), eq(timeEntries.isRunning, true)))
    .limit(1);
  return result[0] ?? null;
}

export async function checkTimeEntryExists(userId: number, date: string, taskName: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  // Only check entries with startHour set (visible in the weekly grid).
  // Old bulk-import entries without startHour are invisible and should not block re-import.
  const result = await db
    .select({ id: timeEntries.id })
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.userId, userId),
        sql`DATE(${timeEntries.date}) = ${date}`,
        eq(timeEntries.taskName, taskName),
        isNotNull(timeEntries.startHour)
      )
    )
    .limit(1);
  return result.length > 0;
}

export async function createTimeEntry(data: typeof timeEntries.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(timeEntries).values(data);
  return (result[0] as any).insertId;
}

export async function updateTimeEntry(id: number, data: Partial<typeof timeEntries.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(timeEntries).set(data).where(eq(timeEntries.id, id));
}

export async function getTimeEntriesForProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ entry: timeEntries, user: { id: users.id, name: users.name } })
    .from(timeEntries)
    .leftJoin(users, eq(timeEntries.userId, users.id))
    .where(eq(timeEntries.projectId, projectId))
    .orderBy(desc(timeEntries.date));
}

// ─── NEWS ────────────────────────────────────────────────────────────────────
export async function getNews(limit = 20, category?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = category ? [eq(news.category, category as any)] : [];
  return db
    .select({ news, author: { id: users.id, name: users.name, avatarUrl: users.avatarUrl } })
    .from(news)
    .leftJoin(users, eq(news.authorId, users.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(news.isPinned), desc(news.publishedAt))
    .limit(limit);
}

export async function getNewsById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select({ news, author: { id: users.id, name: users.name, avatarUrl: users.avatarUrl } })
    .from(news)
    .leftJoin(users, eq(news.authorId, users.id))
    .where(eq(news.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function createNews(data: typeof news.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(news).values(data);
  return (result[0] as any).insertId;
}

export async function updateNews(id: number, data: Partial<typeof news.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(news).set(data).where(eq(news.id, id));
}

export async function deleteNews(id: number) {
  const db = await getDb();
  if (!db) return;
  // Delete related reactions and comments first
  await db.delete(newsReactions).where(eq(newsReactions.newsId, id));
  await db.delete(newsComments).where(eq(newsComments.newsId, id));
  await db.delete(news).where(eq(news.id, id));
}

export async function getNewsComments(newsId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ comment: newsComments, user: { id: users.id, name: users.name, avatarUrl: users.avatarUrl } })
    .from(newsComments)
    .leftJoin(users, eq(newsComments.userId, users.id))
    .where(eq(newsComments.newsId, newsId))
    .orderBy(newsComments.createdAt);
}

export async function addNewsReaction(newsId: number, userId: number, reaction: string) {
  const db = await getDb();
  if (!db) return;
  const existing = await db
    .select()
    .from(newsReactions)
    .where(and(eq(newsReactions.newsId, newsId), eq(newsReactions.userId, userId)))
    .limit(1);
  if (existing.length > 0) {
    await db.update(newsReactions).set({ reaction }).where(eq(newsReactions.id, existing[0].id));
  } else {
    await db.insert(newsReactions).values({ newsId, userId, reaction });
  }
}

// ─── DOCUMENTS ───────────────────────────────────────────────────────────────
export async function getDocumentsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documents).where(eq(documents.userId, userId)).orderBy(desc(documents.createdAt));
}

export async function createDocument(data: typeof documents.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(documents).values(data);
  return (result[0] as any).insertId;
}

export async function logDocumentAccess(documentId: number, userId: number, action: string, ipAddress?: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(documentAuditLog).values({ documentId, userId, action: action as any, ipAddress });
}

// ─── PROCESSES ───────────────────────────────────────────────────────────────
export async function getProcesses(department?: string, category?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(processes.status, "activ")];
  if (department) conditions.push(eq(processes.department, department));
  if (category) conditions.push(eq(processes.category, category as any));
  return db
    .select({ process: processes, owner: { id: users.id, name: users.name } })
    .from(processes)
    .leftJoin(users, eq(processes.ownerId, users.id))
    .where(and(...conditions))
    .orderBy(processes.department, processes.title);
}

export async function getProcessById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select({ process: processes, owner: { id: users.id, name: users.name } })
    .from(processes)
    .leftJoin(users, eq(processes.ownerId, users.id))
    .where(eq(processes.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function confirmProcessRead(processId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  const existing = await db
    .select()
    .from(processReadConfirmations)
    .where(and(eq(processReadConfirmations.processId, processId), eq(processReadConfirmations.userId, userId)))
    .limit(1);
  if (!existing.length) {
    await db.insert(processReadConfirmations).values({ processId, userId });
  }
}

export async function getProcessReadStatus(processId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ confirmation: processReadConfirmations, user: { id: users.id, name: users.name, email: users.email } })
    .from(processReadConfirmations)
    .leftJoin(users, eq(processReadConfirmations.userId, users.id))
    .where(eq(processReadConfirmations.processId, processId));
}

// ─── PROPOSALS ───────────────────────────────────────────────────────────────
export async function getProposals(status?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = status ? [eq(proposals.status, status as any)] : [];
  return db
    .select({ proposal: proposals, author: { id: users.id, name: users.name, avatarUrl: users.avatarUrl } })
    .from(proposals)
    .leftJoin(users, eq(proposals.authorId, users.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(proposals.createdAt));
}

export async function getProposalById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select({ proposal: proposals, author: { id: users.id, name: users.name } })
    .from(proposals)
    .leftJoin(users, eq(proposals.authorId, users.id))
    .where(eq(proposals.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function createProposal(data: typeof proposals.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(proposals).values(data);
  return (result[0] as any).insertId;
}

export async function voteProposal(proposalId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  const existing = await db
    .select()
    .from(proposalVotes)
    .where(and(eq(proposalVotes.proposalId, proposalId), eq(proposalVotes.userId, userId)))
    .limit(1);
  if (existing.length > 0) {
    await db.delete(proposalVotes).where(eq(proposalVotes.id, existing[0].id));
    await db.update(proposals).set({ votesCount: sql`${proposals.votesCount} - 1` }).where(eq(proposals.id, proposalId));
    return false;
  } else {
    await db.insert(proposalVotes).values({ proposalId, userId });
    await db.update(proposals).set({ votesCount: sql`${proposals.votesCount} + 1` }).where(eq(proposals.id, proposalId));
    return true;
  }
}

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
export async function getNotifications(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return result[0]?.count ?? 0;
}

export async function markNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}

export async function createNotification(data: typeof notifications.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values(data);
}

// ─── RAPOARTE HR ─────────────────────────────────────────────────────────────

/** Pontaj complet pentru un singur angajat pe o lună, cu numele proiectului */
export async function getPontajLunarAngajat(userId: number, year: number, month: number) {
  const db = await getDb();
  if (!db) return [];
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = `${year}-${String(month).padStart(2, "0")}-31`;
  return db
    .select({
      id: pontaj.id,
      date: pontaj.date,
      checkIn: pontaj.checkIn,
      checkOut: pontaj.checkOut,
      type: pontaj.type,
      breakMinutes: pontaj.breakMinutes,
      totalMinutes: pontaj.totalMinutes,
      notes: pontaj.notes,
      projectName: projects.name,
    })
    .from(pontaj)
    .leftJoin(projects, eq(pontaj.projectId, projects.id))
    .where(and(eq(pontaj.userId, userId), sql`DATE(${pontaj.date}) >= ${start}`, sql`DATE(${pontaj.date}) <= ${end}`))
    .orderBy(pontaj.date);
}

/** Sumar lunar pentru toți angajații activi */
export async function getSumarEchipaLunar(year: number, month: number) {
  const db = await getDb();
  if (!db) return [];
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = `${year}-${String(month).padStart(2, "0")}-31`;

  // Get all active users
  const allUsers = await db.select().from(users).where(eq(users.isActive, true)).orderBy(users.name);

  // Get all pontaj for the month
  const allPontaj = await db
    .select()
    .from(pontaj)
    .where(and(sql`DATE(${pontaj.date}) >= ${start}`, sql`DATE(${pontaj.date}) <= ${end}`));

  const presentTypes = ["bucuresti", "cluj", "miercurea_ciuc", "brasov", "eveniment", "deplasare", "vizita_santier", "telemunca"];

  return allUsers.map(u => {
    const userPontaj = allPontaj.filter(p => p.userId === u.id);
    return {
      id: u.id,
      name: u.name ?? u.email ?? "—",
      email: u.email,
      department: u.department,
      presentDays: userPontaj.filter(p => presentTypes.includes(p.type)).length,
      totalMinutes: userPontaj.reduce((acc, p) => acc + (p.totalMinutes ?? 0), 0),
      concediuDays: userPontaj.filter(p => p.type === "concediu").length,
      medicalDays: userPontaj.filter(p => p.type === "medical").length,
      absentDays: userPontaj.filter(p => p.type === "absent").length,
      liberLegalDays: userPontaj.filter(p => p.type === "liber_legal").length,
      recuperareDays: userPontaj.filter(p => p.type === "recuperare").length,
    };
  });
}

/** Toate absențele/concediile pe o lună */
export async function getAbsenteLunare(year: number, month: number) {
  const db = await getDb();
  if (!db) return [];
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = `${year}-${String(month).padStart(2, "0")}-31`;
  const absenceTypes = ["concediu", "medical", "liber_legal", "absent", "recuperare"];
  return db
    .select({
      name: users.name,
      email: users.email,
      date: pontaj.date,
      type: pontaj.type,
      notes: pontaj.notes,
    })
    .from(pontaj)
    .leftJoin(users, eq(pontaj.userId, users.id))
    .where(and(
      sql`DATE(${pontaj.date}) >= ${start}`,
      sql`DATE(${pontaj.date}) <= ${end}`,
      sql`${pontaj.type} IN ('concediu','medical','liber_legal','absent','recuperare')`
    ))
    .orderBy(users.name, pontaj.date);
}

/** Ore suplimentare (zile cu totalMinutes > normMinutes) */
export async function getOreSuplimentare(year: number, month: number, normMinutes = 480) {
  const db = await getDb();
  if (!db) return [];
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = `${year}-${String(month).padStart(2, "0")}-31`;
  const rows = await db
    .select({
      name: users.name,
      date: pontaj.date,
      totalMinutes: pontaj.totalMinutes,
      type: pontaj.type,
    })
    .from(pontaj)
    .leftJoin(users, eq(pontaj.userId, users.id))
    .where(and(
      sql`DATE(${pontaj.date}) >= ${start}`,
      sql`DATE(${pontaj.date}) <= ${end}`,
      sql`${pontaj.totalMinutes} > ${normMinutes}`
    ))
    .orderBy(users.name, pontaj.date);

  return rows.map(r => ({
    ...r,
    name: r.name ?? "—",
    overMinutes: Math.max(0, (r.totalMinutes ?? 0) - normMinutes),
  }));
}

/** Pontaj grupat per proiect */
export async function getPontajPerProiect(year: number, month: number) {
  const db = await getDb();
  if (!db) return [];
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = `${year}-${String(month).padStart(2, "0")}-31`;
  const rows = await db
    .select({
      projectName: projects.name,
      name: users.name,
      date: pontaj.date,
      totalMinutes: pontaj.totalMinutes,
      type: pontaj.type,
      notes: pontaj.notes,
    })
    .from(pontaj)
    .leftJoin(users, eq(pontaj.userId, users.id))
    .leftJoin(projects, eq(pontaj.projectId, projects.id))
    .where(and(
      sql`DATE(${pontaj.date}) >= ${start}`,
      sql`DATE(${pontaj.date}) <= ${end}`,
      sql`${pontaj.projectId} IS NOT NULL`
    ))
    .orderBy(projects.name, users.name, pontaj.date);

  return rows.map(r => ({
    ...r,
    projectName: r.projectName ?? "Fără proiect",
    name: r.name ?? "—",
  }));
}

/** Lista angajaților activi pentru selectorul HR */
export async function getActiveUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: users.id, name: users.name, email: users.email, department: users.department })
    .from(users)
    .where(eq(users.isActive, true))
    .orderBy(users.name);
}

// ─── LEAVE REQUESTS ──────────────────────────────────────────────────────────
import { leaveRequests, type InsertLeaveRequest } from "../drizzle/schema";

export async function createLeaveRequest(data: InsertLeaveRequest) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(leaveRequests).values(data);
  return result;
}

export async function getLeaveRequestsByUser(userId: number) {
  const db = await getDb();
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
    reviewerName: users.name,
  })
    .from(leaveRequests)
    .leftJoin(users, eq(leaveRequests.reviewedBy, users.id))
    .where(eq(leaveRequests.userId, userId))
    .orderBy(desc(leaveRequests.createdAt));
}

export async function getAllLeaveRequests(statusFilter?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = statusFilter && statusFilter !== "toate"
    ? [sql`${leaveRequests.status} = ${statusFilter}`]
    : [];
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
    employeeDepartment: users.department,
  })
    .from(leaveRequests)
    .leftJoin(users, eq(leaveRequests.userId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(leaveRequests.createdAt));
}

export async function reviewLeaveRequest(
  id: number,
  reviewedBy: number,
  status: "aprobata" | "respinsa",
  reviewNote?: string
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(leaveRequests)
    .set({ status, reviewedBy, reviewNote: reviewNote ?? null, reviewedAt: new Date() })
    .where(eq(leaveRequests.id, id));
}

export async function cancelLeaveRequest(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(leaveRequests)
    .set({ status: "anulata" })
    .where(and(eq(leaveRequests.id, id), eq(leaveRequests.userId, userId)));
}

export async function getLeaveRequestById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id));
  return row ?? null;
}

// ─── ADMIN USERS ─────────────────────────────────────────────────────────────
export async function getAllUsersAdmin() {
  const db = await getDb();
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
    createdAt: users.createdAt,
  })
    .from(users)
    .orderBy(users.name);
}

export async function updateUserRole(id: number, role: typeof users.$inferSelect["role"]) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(users).set({ role }).where(eq(users.id, id));
}

export async function updateUserActive(id: number, isActive: boolean) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(users).set({ isActive }).where(eq(users.id, id));
}

export async function updateUserProfile(id: number, data: {
  name?: string;
  department?: string;
  jobTitle?: string;
  phone?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const updateSet: Record<string, unknown> = {};
  if (data.name !== undefined) updateSet.name = data.name;
  if (data.department !== undefined) updateSet.department = data.department;
  if (data.jobTitle !== undefined) updateSet.jobTitle = data.jobTitle;
  if (data.phone !== undefined) updateSet.phone = data.phone;
  if (Object.keys(updateSet).length > 0) {
    await db.update(users).set(updateSet).where(eq(users.id, id));
  }
}

// ─── HR DASHBOARD STATISTICS ─────────────────────────────────────────────────
export async function getHRDashboardStats(year: number, month: number) {
  const db = await getDb();
  if (!db) return null;

  const startStr = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDay = new Date(year, month, 0).getDate();
  const endStr = `${year}-${String(month).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`;

  // Total angajați activi
  const [{ totalUsers }] = await db.select({ totalUsers: sql<number>`COUNT(*)` })
    .from(users).where(eq(users.isActive, true));

  // Pontaj luna: zile prezent, total ore, distribuție locații
  const pontajRows = await db.select({
    userId: pontaj.userId,
    type: pontaj.type,
    totalMinutes: pontaj.totalMinutes,
    date: pontaj.date,
  })
    .from(pontaj)
    .where(and(
      sql`DATE(${pontaj.date}) >= ${startStr}`,
      sql`DATE(${pontaj.date}) <= ${endStr}`
    ));

  const totalPontajMinutes = pontajRows.reduce((a, r) => a + (r.totalMinutes ?? 0), 0);
  const uniqueUserDays = new Set(pontajRows.map(r => `${r.userId}-${r.date}`)).size;
  const locationCounts: Record<string, number> = {};
  pontajRows.forEach(r => {
    locationCounts[r.type] = (locationCounts[r.type] ?? 0) + 1;
  });

  // Angajați fără pontaj azi
  const todayStr = new Date().toISOString().slice(0, 10);
  const pontajAziUserIds = await db.select({ userId: pontaj.userId })
    .from(pontaj)
    .where(sql`DATE(${pontaj.date}) = ${todayStr}`);
  const pontajAziSet = new Set(pontajAziUserIds.map(r => r.userId));
  const allActiveUsers = await db.select({ id: users.id, name: users.name })
    .from(users).where(eq(users.isActive, true));
  const farapontajAzi = allActiveUsers.filter(u => !pontajAziSet.has(u.id));

  // Cereri concediu luna
  const leaveRows = await db.select({
    status: leaveRequests.status,
    totalDays: leaveRequests.totalDays,
  })
    .from(leaveRequests)
    .where(and(
      sql`DATE(${leaveRequests.startDate}) >= ${startStr}`,
      sql`DATE(${leaveRequests.startDate}) <= ${endStr}`
    ));

  const leaveStats = {
    total: leaveRows.length,
    inAsteptare: leaveRows.filter(r => r.status === "in_asteptare").length,
    aprobate: leaveRows.filter(r => r.status === "aprobata").length,
    respinse: leaveRows.filter(r => r.status === "respinsa").length,
    totalZile: leaveRows.filter(r => r.status === "aprobata").reduce((a, r) => a + r.totalDays, 0),
  };

  return {
    totalUsers: Number(totalUsers),
    pontaj: {
      totalMinutes: totalPontajMinutes,
      uniqueUserDays,
      locationCounts,
    },
    farapontajAzi: farapontajAzi.map(u => ({ id: u.id, name: u.name })),
    leaveStats,
  };
}

// ─── PROFIL EXTINS ────────────────────────────────────────────────────────────

export async function getFullProfile(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0] ?? null;
}

export async function updateFullProfile(userId: number, data: {
  name?: string | null;
  phone?: string | null;
  phoneMobile?: string | null;
  department?: string | null;
  jobTitle?: string | null;
  birthDate?: string | null;
  hireDate?: string | null;
  addressBuletin?: string | null;
  addressSecondary?: string | null;
  city?: string | null;
  cnp?: string | null;
  ciSeries?: string | null;
  ciNumber?: string | null;
  ciExpiry?: string | null;
  ciIssuedBy?: string | null;
  iban?: string | null;
  bankName?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  emergencyRelation?: string | null;
  bloodType?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | null;
  allergies?: string | null;
  profileNotes?: string | null;
  workHoursPerDay?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(users).set(data as any).where(eq(users.id, userId));
  return { success: true };
}

// ─── ZILE DE NAȘTERE & ORGANIGRAMĂ ───────────────────────────────────────────

export async function getUpcomingBirthdays(daysAhead = 30) {
  const db = await getDb();
  if (!db) return [];
  // Fetch all active users with a birthDate
  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      avatarUrl: users.avatarUrl,
      department: users.department,
      jobTitle: users.jobTitle,
      birthDate: users.birthDate,
    })
    .from(users)
    .where(and(eq(users.isActive, true)));

  const today = new Date();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();

  const result: Array<{
    id: number;
    name: string | null;
    avatarUrl: string | null;
    department: string | null;
    jobTitle: string | null;
    birthDate: string;
    daysUntil: number;
    isToday: boolean;
  }> = [];

  for (const u of allUsers) {
    if (!u.birthDate) continue;
    const bd = new Date(u.birthDate as any);
    const bMonth = bd.getMonth() + 1;
    const bDay = bd.getDate();

    // Calculate days until next birthday this year
    let nextBirthday = new Date(today.getFullYear(), bMonth - 1, bDay);
    if (
      nextBirthday.getMonth() + 1 < todayMonth ||
      (nextBirthday.getMonth() + 1 === todayMonth && bDay < todayDay)
    ) {
      nextBirthday = new Date(today.getFullYear() + 1, bMonth - 1, bDay);
    }

    const diffMs = nextBirthday.getTime() - new Date(today.getFullYear(), todayMonth - 1, todayDay).getTime();
    const daysUntil = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (daysUntil <= daysAhead) {
      result.push({
        id: u.id,
        name: u.name,
        avatarUrl: u.avatarUrl,
        department: u.department,
        jobTitle: u.jobTitle,
        birthDate: (u.birthDate instanceof Date ? u.birthDate.toISOString() : String(u.birthDate)).slice(0, 10),
        daysUntil,
        isToday: daysUntil === 0,
      });
    }
  }

  return result.sort((a, b) => a.daysUntil - b.daysUntil);
}

export async function getUpcomingAnniversaries(daysAhead = 30) {
  const db = await getDb();
  if (!db) return [];
  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      avatarUrl: users.avatarUrl,
      department: users.department,
      jobTitle: users.jobTitle,
      hireDate: users.hireDate,
    })
    .from(users)
    .where(and(eq(users.isActive, true)));

  const today = new Date();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();

  const result: Array<{
    id: number;
    name: string | null;
    avatarUrl: string | null;
    department: string | null;
    jobTitle: string | null;
    hireDate: string;
    yearsCompleted: number;
    daysUntil: number;
    isToday: boolean;
  }> = [];

  for (const u of allUsers) {
    if (!u.hireDate) continue;
    const hd = new Date(u.hireDate as any);
    const hMonth = hd.getMonth() + 1;
    const hDay = hd.getDate();
    const hYear = hd.getFullYear();

    // Skip if hired this year (no anniversary yet)
    if (hYear >= today.getFullYear()) continue;

    // Calculate next anniversary date
    let nextAnniv = new Date(today.getFullYear(), hMonth - 1, hDay);
    // yearsCompleted = how many full years since hire on the anniversary date
    let yearsCompleted = today.getFullYear() - hYear;
    // If this year's anniversary has already passed (strictly before today), push to next year
    if (
      nextAnniv.getMonth() + 1 < todayMonth ||
      (nextAnniv.getMonth() + 1 === todayMonth && hDay < todayDay)
    ) {
      nextAnniv = new Date(today.getFullYear() + 1, hMonth - 1, hDay);
      yearsCompleted = today.getFullYear() + 1 - hYear;
    }
    // If anniversary is today or in the future this year, yearsCompleted = this year - hire year
    // (already set correctly above as today.getFullYear() - hYear)

    const diffMs = nextAnniv.getTime() - new Date(today.getFullYear(), todayMonth - 1, todayDay).getTime();
    const daysUntil = Math.round(diffMs / (1000 * 60 * 60 * 24));

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
        isToday: daysUntil === 0,
      });
    }
  }

  return result.sort((a, b) => a.daysUntil - b.daysUntil);
}

export async function getOrgChartData() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: users.id,
      name: users.name,
      avatarUrl: users.avatarUrl,
      department: users.department,
      jobTitle: users.jobTitle,
      role: users.role,
      email: users.email,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.isActive, true));
}

// ─── COMPANY EVENTS ──────────────────────────────────────────────────────────────────
export async function getCompanyEvents(dateFrom: string, dateTo: string) {
  const db = await getDb();
  if (!db) return [];
  // Get non-recurring events in range + all active recurring events
  const rows = await db.select().from(companyEvents)
    .where(and(
      eq(companyEvents.isActive, true),
      or(
        // Non-recurring: must overlap with date range
        and(
          sql`(${companyEvents.isRecurring} = false OR ${companyEvents.isRecurring} IS NULL)`,
          sql`DATE(${companyEvents.startTime}) <= ${dateTo}`,
          sql`DATE(${companyEvents.endTime}) >= ${dateFrom}`,
        ),
        // Recurring: started before range end and not expired
        and(
          eq(companyEvents.isRecurring, true),
          sql`DATE(${companyEvents.startTime}) <= ${dateTo}`,
          or(
            sql`${companyEvents.recurringUntil} IS NULL`,
            sql`${companyEvents.recurringUntil} >= ${dateFrom}`,
          ),
        ),
      ),
    ));
  return rows;
}

// Get all company events (for admin management)
export async function getAllCompanyEvents() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(companyEvents)
    .where(eq(companyEvents.isActive, true))
    .orderBy(desc(companyEvents.createdAt));
  return rows;
}

export async function createCompanyEvent(data: {
  title: string;
  description?: string;
  link?: string;
  startTime: Date;
  endTime: Date;
  isRecurring?: boolean;
  recurringRule?: string;
  recurringUntil?: string | null;
  color?: string;
  targetType: "all" | "department" | "users";
  targetDepartment?: string;
  targetUserIds?: number[];
  activityType?: string;
  projectId?: number;
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const { targetUserIds, recurringUntil, ...rest } = data;
  await db.insert(companyEvents).values({
    ...rest,
    recurringUntil: recurringUntil ?? null,
  } as any);
  return { success: true };
}

export async function updateCompanyEvent(id: number, data: Partial<{
  title: string;
  description: string;
  link: string;
  startTime: Date;
  endTime: Date;
  isRecurring: boolean;
  recurringRule: string;
  recurringUntil: string;
  color: string;
  targetType: "all" | "department" | "users";
  targetDepartment: string;
  targetUserIds: number[];
  activityType: string;
  projectId: number;
  isActive: boolean;
}>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(companyEvents).set(data as any).where(eq(companyEvents.id, id));
  return { success: true };
}

export async function deleteCompanyEvent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(companyEvents).set({ isActive: false }).where(eq(companyEvents.id, id));
  return { success: true };
}

// ─── DELETE USER COMPLETELY ──────────────────────────────────────────────
export async function deleteUserCompletely(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  // Ștergem mai întâi datele asociate (pontaj, leave requests, time tracking etc.)
  await db.execute(sql`DELETE FROM pontaj WHERE user_id = ${userId}`);
  await db.execute(sql`DELETE FROM leave_requests WHERE user_id = ${userId}`);
  // Ștergem time tracking dacă există tabela
  try {
    await db.execute(sql`DELETE FROM time_entries WHERE user_id = ${userId}`);
  } catch {}
  // Ștergem în final utilizatorul
  await db.execute(sql`DELETE FROM users WHERE id = ${userId}`);
  return { success: true };
}

// ─── PROJECT MEMBERS (echipă proiect) ──────────────────────────────────────
import { projectMembers } from "../drizzle/schema";

export async function getProjectMembers(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.execute(
    sql`SELECT pm.*, u.name, u.email, u.role AS globalRole, u.department, u.jobTitle, u.avatarUrl
        FROM project_members pm
        JOIN users u ON u.id = pm.userId
        WHERE pm.projectId = ${projectId}
        ORDER BY FIELD(pm.projectRole, 'coordonator', 'membru', 'consultant'), u.name`
  );
  return (rows as any)[0] ?? [];
}

export async function addProjectMember(projectId: number, userId: number, projectRole: string = "membru", allocatedHours?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(projectMembers).values({
    projectId,
    userId,
    projectRole: projectRole as any,
    allocatedHours: allocatedHours ?? null,
  }).onDuplicateKeyUpdate({ set: { projectRole: projectRole as any, allocatedHours: allocatedHours ?? null } });
  return { success: true };
}

export async function removeProjectMember(projectId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)));
  return { success: true };
}

export async function updateProjectMemberRole(projectId: number, userId: number, projectRole: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(projectMembers)
    .set({ projectRole: projectRole as any })
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)));
  return { success: true };
}

export async function getProjectWithTeam(projectId: number) {
  const db = await getDb();
  if (!db) return null;
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) return null;
  const members = await getProjectMembers(projectId);
  return { ...project, members };
}

// ─── PROJECT BUDGET ITEMS (bugetare ore pe categorii) ──────────────────────────
import { projectBudgetItems } from "../drizzle/schema";

export async function getProjectBudgetItems(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.execute(
    sql`SELECT pbi.*, u.name AS assignedUserName
        FROM project_budget_items pbi
        LEFT JOIN users u ON u.id = pbi.assignedUserId
        WHERE pbi.projectId = ${projectId}
        ORDER BY pbi.category, pbi.id`
  );
  return (rows as any)[0] ?? [];
}

export async function createBudgetItem(data: {
  projectId: number;
  category: string;
  description?: string | null;
  budgetedHours: string;
  assignedUserId?: number | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(projectBudgetItems).values({
    projectId: data.projectId,
    category: data.category as any,
    description: data.description ?? null,
    budgetedHours: data.budgetedHours,
    assignedUserId: data.assignedUserId ?? null,
  });
  return { success: true, id: (result as any)[0]?.insertId };
}

export async function updateBudgetItem(id: number, data: {
  category?: string;
  description?: string | null;
  budgetedHours?: string;
  assignedUserId?: number | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(projectBudgetItems).set(data as any).where(eq(projectBudgetItems.id, id));
  return { success: true };
}

export async function deleteBudgetItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(projectBudgetItems).where(eq(projectBudgetItems.id, id));
  return { success: true };
}

export async function getProjectBudgetSummary(projectId: number) {
  const db = await getDb();
  if (!db) return { items: [], totalBudgeted: 0, totalWorked: 0 };
  const items = await getProjectBudgetItems(projectId);
  const totalBudgeted = items.reduce((sum: number, i: any) => sum + Number(i.budgetedHours || 0), 0);
  // Get actual worked hours from time_entries for this project
  const workedRows = await db.execute(
    sql`SELECT COALESCE(SUM(durationMinutes), 0) AS totalMinutes
        FROM time_entries
        WHERE projectId = ${projectId}`
  );
  const totalWorkedMinutes = Number((workedRows as any)[0]?.[0]?.totalMinutes ?? 0);
  const totalWorked = Math.round((totalWorkedMinutes / 60) * 100) / 100;
  return { items, totalBudgeted, totalWorked };
}

// ─── PROCESS OVERVIEW (calendar echipă) ──────────────────────────────────────
export async function getProcessOverview(dateFrom: string, dateTo: string) {
  const db = await getDb();
  if (!db) return { users: [], timeEntries: [], leaveRequests: [], projectAssignments: [], projects: [] };

  // 1. All active users
  const allUsers = await db.select({
    id: users.id,
    name: users.name,
    department: users.department,
    role: users.role,
    displayOrder: users.displayOrder,
  }).from(users).where(eq(users.isActive, true)).orderBy(users.displayOrder, users.name);

  // 2. Time entries in range (using date column)
  const entries = await db.execute(
    sql`SELECT te.userId, te.date, te.projectId, te.startHour, te.startMin, te.endHour, te.endMin,
               te.taskName, te.activityType AS category, p.name AS projectName, p.code AS projectCode
        FROM time_entries te
        LEFT JOIN projects p ON p.id = te.projectId
        WHERE te.date >= ${dateFrom} AND te.date <= ${dateTo}
        ORDER BY te.date, te.startHour`
  );

  // 3. Approved leave requests overlapping the range
  const leaves = await db.execute(
    sql`SELECT lr.userId, lr.type, lr.startDate, lr.endDate, lr.totalDays, lr.status
        FROM leave_requests lr
        WHERE lr.status = 'aprobata'
          AND lr.startDate <= ${dateTo}
          AND lr.endDate >= ${dateFrom}
        ORDER BY lr.startDate`
  );

  // 4. Project member assignments (to know which projects each user is on)
  const assignments = await db.execute(
    sql`SELECT pm.userId, pm.projectId, pm.projectRole, p.name AS projectName, p.code AS projectCode,
               p.abbreviation AS projectAbbreviation,
               p.startDate AS projectStart, p.endDate AS projectEnd, p.status AS projectStatus
        FROM project_members pm
        JOIN projects p ON p.id = pm.projectId
        WHERE p.status = 'activ'
        ORDER BY pm.userId, p.name`
  );

  // 5. Active projects with dates
  const activeProjects = await db.select().from(projects).where(eq(projects.status, "activ")).orderBy(projects.name);

  return {
    users: allUsers,
    timeEntries: (entries as any)[0] ?? [],
    leaveRequests: (leaves as any)[0] ?? [],
    projectAssignments: (assignments as any)[0] ?? [],
    projects: activeProjects,
  };
}

// ─── DELETE PROJECT (cascade: members, budget items, time entries) ──────────
export async function deleteProject(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Delete cascade: budget items, members, then project
  await db.delete(projectBudgetItems).where(eq(projectBudgetItems.projectId, projectId));
  await db.delete(projectMembers).where(eq(projectMembers.projectId, projectId));
  // Unlink time entries (set projectId to null instead of deleting)
  await db.update(timeEntries).set({ projectId: null } as any).where(eq(timeEntries.projectId as any, projectId));
  // Delete the project itself
  await db.delete(projects).where(eq(projects.id, projectId));
  return { success: true };
}

// ─── UPDATE USERS DISPLAY ORDER ──────────────────────────────────────────────
export async function updateUsersDisplayOrder(orderList: { userId: number; displayOrder: number }[]) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  for (const item of orderList) {
    await db.update(users).set({ displayOrder: item.displayOrder }).where(eq(users.id, item.userId));
  }
  return { success: true };
}
