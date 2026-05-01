import { and, asc, desc, eq, gte, isNotNull, isNull, lte, or, sql, ne, inArray } from "drizzle-orm";
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
  projectPhases,
  projectTasks,
  projectMembers,
  taskSessions,
  hourBank,
  taskHourRequests,
  projectTemplates,
  templatePhases,
  templateTasks,
  proposalComments,
  proposalVotes,
  proposals,
  timeEntries,
  users,
  appSettings,
  recurringActivities,
  recurringExceptions,
  activityInvitations,
  employeeDriveFolders,
  driveFileSnapshots,
  DriveFileSnapshot,
  Project,
  ProjectPhase,
  ProjectTask,
  ProjectMember,
  TaskSession,
  HourBank,
  TaskHourRequest,
  ProjectTemplate,
  TemplatePhase,
  TemplateTask,
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

export async function checkTimeEntryExists(
  userId: number,
  date: string,
  taskName: string,
  startHour: number,
  startMin: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  // Match on date + taskName + startHour + startMin so two events with the same
  // title but different start times (e.g. two #Daily15 meetings) are treated as distinct.
  // Only check entries with startHour set (visible in the weekly grid).
  const result = await db
    .select({ id: timeEntries.id })
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.userId, userId),
        sql`DATE(${timeEntries.date}) = ${date}`,
        eq(timeEntries.taskName, taskName),
        isNotNull(timeEntries.startHour),
        sql`${timeEntries.startHour} = ${startHour}`,
        sql`${timeEntries.startMin} = ${startMin}`
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
  await db.execute(sql`DELETE FROM pontaj WHERE userId = ${userId}`);
  await db.execute(sql`DELETE FROM leave_requests WHERE userId = ${userId}`);
  // Ștergem time tracking dacă există tabela
  try {
    await db.execute(sql`DELETE FROM time_entries WHERE userId = ${userId}`);
  } catch {}
  // Ștergem în final utilizatorul
  await db.execute(sql`DELETE FROM users WHERE id = ${userId}`);
  return { success: true };
}

// ─── PROJECT MEMBERS (echipă proiect) ──────────────────────────────────────

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

export async function addProjectMember(projectId: number, userId: number, projectRole: string = "membru", phaseId?: number | null) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(projectMembers).values({
    projectId,
    userId,
    projectRole: projectRole as any,
    phaseId: phaseId ?? null,
  });
  return { success: true };
}

export async function removeProjectMember(projectId: number, userId: number, phaseId?: number | null) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  if (phaseId != null) {
    await db.delete(projectMembers)
      .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId), eq(projectMembers.phaseId, phaseId)));
  } else {
    await db.delete(projectMembers)
      .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId), isNull(projectMembers.phaseId)));
  }
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

// ─── DELETE PROJECT (cascade: phases, tasks, sessions, members, time entries) ──────
export async function deleteProject(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Delete cascade: sessions, tasks, phases, members, then project
  await db.delete(taskSessions).where(eq(taskSessions.projectId, projectId));
  await db.delete(taskHourRequests).where(eq(taskHourRequests.projectId, projectId));
  await db.delete(projectTasks).where(eq(projectTasks.projectId, projectId));
  await db.delete(projectPhases).where(eq(projectPhases.projectId, projectId));
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

// ─── RECURRING ACTIVITIES ────────────────────────────────────────────────────

export async function getRecurringActivities(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(recurringActivities)
    .where(and(eq(recurringActivities.userId, userId), eq(recurringActivities.isActive, true)))
    .orderBy(asc(recurringActivities.startHour));
}

export async function createRecurringActivity(data: {
  userId: number; taskName: string; activityType: string; projectId?: number;
  startHour: number; startMin: number; durationMinutes: number;
  countInTime: boolean; startDate: string; endDate?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [res] = await db.insert(recurringActivities).values({
    userId: data.userId,
    taskName: data.taskName,
    activityType: data.activityType as any,
    projectId: data.projectId ?? null,
    startHour: data.startHour,
    startMin: data.startMin,
    durationMinutes: data.durationMinutes,
    countInTime: data.countInTime,
    startDate: data.startDate as any,
    endDate: data.endDate ? (data.endDate as any) : null,
    isActive: true,
  });
  return res;
}

export async function updateRecurringActivity(id: number, userId: number, data: Partial<{
  taskName: string; activityType: string; projectId: number | null;
  startHour: number; startMin: number; durationMinutes: number;
  countInTime: boolean; startDate: string; endDate: string | null; isActive: boolean;
}>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(recurringActivities)
    .set(data as any)
    .where(and(eq(recurringActivities.id, id), eq(recurringActivities.userId, userId)));
  return { success: true };
}

export async function deleteRecurringActivity(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(recurringActivities)
    .set({ isActive: false })
    .where(and(eq(recurringActivities.id, id), eq(recurringActivities.userId, userId)));
  return { success: true };
}

export async function getRecurringExceptions(userId: number, dateFrom: string, dateTo: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(recurringExceptions)
    .where(and(
      eq(recurringExceptions.userId, userId),
      gte(recurringExceptions.exceptionDate, dateFrom as any),
      lte(recurringExceptions.exceptionDate, dateTo as any),
    ));
}

export async function upsertRecurringException(data: {
  recurringId: number; userId: number; exceptionDate: string;
  overrideStartHour?: number; overrideStartMin?: number; overrideDuration?: number;
  isDeleted?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Check if exception already exists for this recurring+date
  const existing = await db.select().from(recurringExceptions)
    .where(and(
      eq(recurringExceptions.recurringId, data.recurringId),
      eq(recurringExceptions.userId, data.userId),
      eq(recurringExceptions.exceptionDate, data.exceptionDate as any),
    )).limit(1);
  if (existing.length > 0) {
    await db.update(recurringExceptions)
      .set({
        overrideStartHour: data.overrideStartHour ?? null,
        overrideStartMin: data.overrideStartMin ?? null,
        overrideDuration: data.overrideDuration ?? null,
        isDeleted: data.isDeleted ?? false,
      })
      .where(eq(recurringExceptions.id, existing[0].id));
    return existing[0].id;
  } else {
    const [res] = await db.insert(recurringExceptions).values({
      recurringId: data.recurringId,
      userId: data.userId,
      exceptionDate: data.exceptionDate as any,
      overrideStartHour: data.overrideStartHour ?? null,
      overrideStartMin: data.overrideStartMin ?? null,
      overrideDuration: data.overrideDuration ?? null,
      isDeleted: data.isDeleted ?? false,
    });
    return (res as any).insertId;
  }
}

// ─── ACTIVITY INVITATIONS ────────────────────────────────────────────────────

export async function createActivityInvitation(data: {
  timeEntryId: number; hostUserId: number; inviteeUserId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [res] = await db.insert(activityInvitations).values({
    timeEntryId: data.timeEntryId,
    hostUserId: data.hostUserId,
    inviteeUserId: data.inviteeUserId,
    status: "pending",
  });
  return (res as any).insertId as number;
}

export async function getPendingInvitationsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  // Join with time_entries and users for display info
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
    hostName: users.name,
  })
    .from(activityInvitations)
    .innerJoin(timeEntries, eq(activityInvitations.timeEntryId, timeEntries.id))
    .innerJoin(users, eq(activityInvitations.hostUserId, users.id))
    .where(and(
      eq(activityInvitations.inviteeUserId, userId),
      eq(activityInvitations.status, "pending"),
    ))
    .orderBy(desc(activityInvitations.createdAt));
  return rows;
}

export async function getInvitationsForEntry(timeEntryId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: activityInvitations.id,
    status: activityInvitations.status,
    inviteeUserId: activityInvitations.inviteeUserId,
    inviteeName: users.name,
    inviteeEntryId: activityInvitations.inviteeEntryId,
  })
    .from(activityInvitations)
    .innerJoin(users, eq(activityInvitations.inviteeUserId, users.id))
    .where(eq(activityInvitations.timeEntryId, timeEntryId));
}

export async function respondToInvitation(id: number, inviteeUserId: number, accept: boolean) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const inv = await db.select().from(activityInvitations)
    .where(and(eq(activityInvitations.id, id), eq(activityInvitations.inviteeUserId, inviteeUserId)))
    .limit(1);
  if (!inv.length) throw new Error("Invitație negăsită");
  const invitation = inv[0];
  if (!accept) {
    await db.update(activityInvitations)
      .set({ status: "declined", respondedAt: new Date() })
      .where(eq(activityInvitations.id, id));
    return { accepted: false };
  }
  // Clone the host's time entry for the invitee
  const hostEntry = await db.select().from(timeEntries)
    .where(eq(timeEntries.id, invitation.timeEntryId)).limit(1);
  if (!hostEntry.length) throw new Error("Activitate negăsită");
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
    status: "salvat",
  });
  const newEntryId = (ins as any).insertId as number;
  await db.update(activityInvitations)
    .set({ status: "accepted", respondedAt: new Date(), inviteeEntryId: newEntryId })
    .where(eq(activityInvitations.id, id));
  return { accepted: true, newEntryId };
}

// ─── EMPLOYEE DRIVE FOLDERS ──────────────────────────────────────────────────
export async function getEmployeeDriveFolder(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(employeeDriveFolders)
    .where(eq(employeeDriveFolders.userId, userId))
    .limit(1);
  return result[0] ?? null;
}

export async function setEmployeeDriveFolder(
  userId: number,
  folderId: string,
  folderName: string
) {
  const db = await getDb();
  if (!db) return;
  const existing = await db
    .select()
    .from(employeeDriveFolders)
    .where(eq(employeeDriveFolders.userId, userId))
    .limit(1);
  if (existing.length > 0) {
    await db
      .update(employeeDriveFolders)
      .set({ folderId, folderName })
      .where(eq(employeeDriveFolders.userId, userId));
  } else {
    await db.insert(employeeDriveFolders).values({ userId, folderId, folderName });
  }
}

export async function getAllEmployeeDriveFolders() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(employeeDriveFolders);
}

export async function deleteEmployeeDriveFolder(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(employeeDriveFolders).where(eq(employeeDriveFolders.userId, userId));
}

// ─── DRIVE FILE SNAPSHOTS ────────────────────────────────────────────────────
export async function getDriveSnapshots(folderId: string): Promise<DriveFileSnapshot[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(driveFileSnapshots)
    .where(and(eq(driveFileSnapshots.folderId, folderId), isNull(driveFileSnapshots.deletedAt)));
}

export async function getDriveSnapshotsByOwner(ownerUserId: number): Promise<DriveFileSnapshot[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(driveFileSnapshots)
    .where(and(eq(driveFileSnapshots.ownerUserId, ownerUserId), isNull(driveFileSnapshots.deletedAt)));
}

export async function upsertDriveSnapshot(data: {
  fileId: string;
  fileName: string;
  folderId: string;
  folderType: string;
  ownerUserId?: number | null;
  subfolderName?: string | null;
  modifiedTime?: string | null;
  size?: string | null;
  mimeType?: string | null;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const existing = await db
    .select()
    .from(driveFileSnapshots)
    .where(eq(driveFileSnapshots.fileId, data.fileId))
    .limit(1);
  if (existing.length > 0) {
    await db
      .update(driveFileSnapshots)
      .set({ ...data, deletedAt: null, updatedAt: new Date() })
      .where(eq(driveFileSnapshots.fileId, data.fileId));
  } else {
    await db.insert(driveFileSnapshots).values(data);
  }
}

export async function markDriveSnapshotDeleted(fileId: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(driveFileSnapshots)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(driveFileSnapshots.fileId, fileId));
}

export async function getAllActiveDriveSnapshots(): Promise<DriveFileSnapshot[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(driveFileSnapshots).where(isNull(driveFileSnapshots.deletedAt));
}

// ─── PROJECT MANAGEMENT HELPERS ──────────────────────────────────────────────

export async function listProjects(opts?: { status?: string; userId?: number; isAdmin?: boolean }) {
  const db = await getDb();
  if (!db) return [];
  if (opts?.isAdmin) {
    const rows = await db.execute(
      sql`SELECT p.id, ANY_VALUE(p.name) AS name, ANY_VALUE(p.code) AS code,
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
          ${opts.status ? sql`WHERE p.status = ${opts.status}` : sql``}
          GROUP BY p.id
          ORDER BY ANY_VALUE(p.isGeneral) DESC, ANY_VALUE(p.name)`
    );
    return (rows as any)[0] ?? [];
  } else {
    const rows = await db.execute(
      sql`SELECT p.id, ANY_VALUE(p.name) AS name, ANY_VALUE(p.code) AS code,
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
          ${opts?.status ? sql`WHERE p.status = ${opts.status}` : sql``}
          GROUP BY p.id, pm.projectRole
          ORDER BY ANY_VALUE(p.isGeneral) DESC, ANY_VALUE(p.name)`
    );
    return (rows as any)[0] ?? [];
  }
}

export async function getProjectById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return project ?? null;
}

export async function createProject(data: {
  name: string;
  code?: string | null;
  abbreviation?: string | null;
  emoji?: string | null;
  clientName?: string | null;
  status?: "activ" | "suspendat" | "finalizat" | "intern";
  isGeneral?: boolean;
  managerId?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
  color?: string | null;
  driveId?: string | null;
}) {
  const db = await getDb();
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
    startDate: data.startDate ? (data.startDate as any) : null,
    endDate: data.endDate ? (data.endDate as any) : null,
    description: data.description ?? null,
    color: data.color ?? "#FFCB09",
    driveId: data.driveId ?? null,
  });
  return { success: true, id: (result as any)[0]?.insertId };
}

export async function updateProject(id: number, data: Partial<{
  name: string;
  code: string | null;
  clientName: string | null;
  status: "activ" | "suspendat" | "finalizat" | "intern";
  isGeneral: boolean;
  managerId: number | null;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
  color: string | null;
  abbreviation: string | null;
  emoji: string | null;
  driveId: string | null;
}>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(projects).set(data as any).where(eq(projects.id, id));
  return { success: true };
}

export async function createProjectFromTemplate(data: {
  name: string;
  code?: string | null;
  clientName?: string | null;
  managerId?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
  color?: string | null;
  templateId?: number | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(projects).values({
    name: data.name,
    code: data.code ?? null,
    clientName: data.clientName ?? null,
    status: "activ",
    isGeneral: false,
    managerId: data.managerId ?? null,
    startDate: data.startDate ? (data.startDate as any) : null,
    endDate: data.endDate ? (data.endDate as any) : null,
    description: data.description ?? null,
    color: data.color ?? "#FFCB09",
  });
  const projectId = (result as any)[0]?.insertId;

  if (data.templateId) {
    const phases = await db.select().from(templatePhases)
      .where(eq(templatePhases.templateId, data.templateId))
      .orderBy(templatePhases.displayOrder);

    for (const phase of phases) {
      const phResult = await db.insert(projectPhases).values({
        projectId,
        name: phase.name,
        code: phase.code,
        displayOrder: phase.displayOrder,
        budgetHours: "0",
        color: phase.color,
        status: "activa",
      });
      const phaseId = (phResult as any)[0]?.insertId;

      const tasks = await db.select().from(templateTasks)
        .where(eq(templateTasks.templatePhaseId, phase.id))
        .orderBy(templateTasks.displayOrder);

      for (const task of tasks) {
        await db.insert(projectTasks).values({
          phaseId,
          projectId,
          name: task.name,
          displayOrder: task.displayOrder,
          budgetHours: "0",
          minutesWorked: 0,
          status: "neinceputa",
        });
      }
    }
  }

  return { success: true, id: projectId };
}

// ─── PROJECT PHASES ──────────────────────────────────────────────────────────

export async function getProjectPhases(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projectPhases)
    .where(eq(projectPhases.projectId, projectId))
    .orderBy(projectPhases.displayOrder);
}

export async function createPhase(data: {
  projectId: number;
  name: string;
  code?: string | null;
  displayOrder?: number;
  budgetHours?: string;
  color?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(projectPhases).values({
    projectId: data.projectId,
    name: data.name,
    code: data.code ?? null,
    displayOrder: data.displayOrder ?? 0,
    budgetHours: data.budgetHours ?? "0",
    color: data.color ?? "#FFCB09",
    status: "activa",
  });
  return { success: true, id: (result as any)[0]?.insertId };
}

export async function updatePhase(id: number, data: Partial<{
  name: string;
  code: string | null;
  displayOrder: number;
  budgetHours: string;
  color: string | null;
  status: "activa" | "suspendata" | "finalizata";
}>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(projectPhases).set(data as any).where(eq(projectPhases.id, id));
  return { success: true };
}

export async function deletePhase(id: number) {
  const db = await getDb();
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

// ─── PROJECT TASKS ───────────────────────────────────────────────────────────

export async function getTasksByPhase(phaseId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.execute(
    sql`SELECT pt.*, u.name AS assignedUserName, u.avatarUrl AS assignedUserAvatar
        FROM project_tasks pt
        LEFT JOIN users u ON u.id = pt.assignedUserId
        WHERE pt.phaseId = ${phaseId}
        ORDER BY pt.displayOrder, pt.id`
  );
  return (rows as any)[0] ?? [];
}

export async function getTasksByProject(projectId: number, userId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (userId) {
    const rows = await db.execute(
      sql`SELECT pt.*, ph.name AS phaseName, ph.code AS phaseCode, ph.color AS phaseColor,
               u.name AS assignedUserName
          FROM project_tasks pt
          JOIN project_phases ph ON ph.id = pt.phaseId
          LEFT JOIN users u ON u.id = pt.assignedUserId
          WHERE pt.projectId = ${projectId} AND pt.assignedUserId = ${userId}
          ORDER BY ph.displayOrder, pt.displayOrder`
    );
    return (rows as any)[0] ?? [];
  }
  const rows = await db.execute(
    sql`SELECT pt.*, ph.name AS phaseName, ph.code AS phaseCode, ph.color AS phaseColor,
             u.name AS assignedUserName
        FROM project_tasks pt
        JOIN project_phases ph ON ph.id = pt.phaseId
        LEFT JOIN users u ON u.id = pt.assignedUserId
        WHERE pt.projectId = ${projectId}
        ORDER BY ph.displayOrder, pt.displayOrder`
  );
  return (rows as any)[0] ?? [];
}

export async function createTask(data: {
  phaseId: number;
  projectId: number;
  name: string;
  description?: string | null;
  displayOrder?: number;
  budgetHours?: string;
  assignedUserId?: number | null;
}) {
  const db = await getDb();
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
    assignedUserId: data.assignedUserId ?? null,
  });
  return { success: true, id: (result as any)[0]?.insertId };
}

export async function updateTask(id: number, data: Partial<{
  name: string;
  description: string | null;
  displayOrder: number;
  budgetHours: string;
  status: "neinceputa" | "in_lucru" | "in_pauza" | "finalizata" | "blocata";
  assignedUserId: number | null;
}>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(projectTasks).set(data as any).where(eq(projectTasks.id, id));
  return { success: true };
}

export async function deleteTask(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(taskSessions).where(eq(taskSessions.taskId, id));
  await db.delete(taskHourRequests).where(eq(taskHourRequests.taskId, id));
  await db.delete(projectTasks).where(eq(projectTasks.id, id));
  return { success: true };
}

// ─── TASK SESSIONS ───────────────────────────────────────────────────────────

export async function getActiveSession(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.execute(
    sql`SELECT ts.*, pt.name AS taskName, pt.budgetHours, pt.minutesWorked,
             ph.name AS phaseName, ph.code AS phaseCode,
             p.name AS projectName, p.color AS projectColor
        FROM task_sessions ts
        JOIN project_tasks pt ON pt.id = ts.taskId
        JOIN project_phases ph ON ph.id = pt.phaseId
        JOIN projects p ON p.id = ts.projectId
        WHERE ts.userId = ${userId} AND ts.status IN ('activa', 'in_pauza')
        LIMIT 1`
  );
  return (rows as any)[0]?.[0] ?? null;
}

export async function startTaskSession(userId: number, taskId: number, projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await getActiveSession(userId);
  if (existing) throw new Error("Ai deja o sesiune activă. Oprește-o înainte de a începe alta.");
  const result = await db.insert(taskSessions).values({
    taskId,
    projectId,
    userId,
    startedAt: new Date(),
    status: "activa",
    totalMinutes: 0,
  });
  const sessionId = (result as any)[0]?.insertId;
  await db.update(projectTasks).set({ status: "in_lucru" }).where(eq(projectTasks.id, taskId));
  return { success: true, sessionId };
}

export async function pauseTaskSession(sessionId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [session] = await db.select().from(taskSessions)
    .where(and(eq(taskSessions.id, sessionId), eq(taskSessions.userId, userId))).limit(1);
  if (!session) throw new Error("Sesiunea nu există");
  if (session.status !== "activa") throw new Error("Sesiunea nu este activă");
  const now = new Date();
  const startTime = session.resumedAt ?? session.startedAt;
  const minutesSinceStart = Math.floor((now.getTime() - startTime.getTime()) / 60000);
  const newTotal = session.totalMinutes + minutesSinceStart;
  await db.update(taskSessions).set({ status: "in_pauza", pausedAt: now, totalMinutes: newTotal }).where(eq(taskSessions.id, sessionId));
  await db.update(projectTasks).set({ status: "in_pauza" }).where(eq(projectTasks.id, session.taskId));
  return { success: true, totalMinutes: newTotal };
}

export async function resumeTaskSession(sessionId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [session] = await db.select().from(taskSessions)
    .where(and(eq(taskSessions.id, sessionId), eq(taskSessions.userId, userId))).limit(1);
  if (!session) throw new Error("Sesiunea nu există");
  if (session.status !== "in_pauza") throw new Error("Sesiunea nu este în pauză");
  await db.update(taskSessions).set({ status: "activa", resumedAt: new Date() }).where(eq(taskSessions.id, sessionId));
  await db.update(projectTasks).set({ status: "in_lucru" }).where(eq(projectTasks.id, session.taskId));
  return { success: true };
}

export async function stopTaskSession(sessionId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [session] = await db.select().from(taskSessions)
    .where(and(eq(taskSessions.id, sessionId), eq(taskSessions.userId, userId))).limit(1);
  if (!session) throw new Error("Sesiunea nu există");
  if (session.status === "finalizata") throw new Error("Sesiunea este deja finalizată");
  const now = new Date();
  let finalMinutes = session.totalMinutes;
  if (session.status === "activa") {
    const startTime = session.resumedAt ?? session.startedAt;
    const minutesSinceStart = Math.floor((now.getTime() - startTime.getTime()) / 60000);
    finalMinutes += minutesSinceStart;
  }
  await db.update(taskSessions).set({ status: "finalizata", endedAt: now, totalMinutes: finalMinutes }).where(eq(taskSessions.id, sessionId));
  const totalRows = await db.execute(
    sql`SELECT COALESCE(SUM(totalMinutes), 0) AS total FROM task_sessions WHERE taskId = ${session.taskId} AND status = 'finalizata'`
  );
  const totalMinutesForTask = Number((totalRows as any)[0]?.[0]?.total ?? 0);
  await db.update(projectTasks).set({ minutesWorked: totalMinutesForTask, status: "in_pauza" }).where(eq(projectTasks.id, session.taskId));
  const today = now.toISOString().split("T")[0];
  await upsertHourBank(userId, today, finalMinutes);
  await checkBudgetAlerts(session.taskId, session.projectId, totalMinutesForTask);
  return { success: true, totalMinutes: finalMinutes };
}

export async function getSessionsForTask(taskId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.execute(
    sql`SELECT ts.*, u.name AS userName FROM task_sessions ts JOIN users u ON u.id = ts.userId WHERE ts.taskId = ${taskId} ORDER BY ts.startedAt DESC`
  );
  return (rows as any)[0] ?? [];
}

// ─── HOUR BANK ───────────────────────────────────────────────────────────────

export async function upsertHourBank(userId: number, date: string, additionalMinutes: number) {
  const db = await getDb();
  if (!db) return;
  await db.execute(
    sql`INSERT INTO hour_bank (userId, date, minutesWorked) VALUES (${userId}, ${date}, ${additionalMinutes}) ON DUPLICATE KEY UPDATE minutesWorked = minutesWorked + ${additionalMinutes}`
  );
}

export async function getHourBankForUser(userId: number, dateFrom?: string, dateTo?: string) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.execute(
    sql`SELECT hb.*, u.name AS userName FROM hour_bank hb JOIN users u ON u.id = hb.userId WHERE hb.userId = ${userId} ${dateFrom ? sql`AND hb.date >= ${dateFrom}` : sql``} ${dateTo ? sql`AND hb.date <= ${dateTo}` : sql``} ORDER BY hb.date DESC`
  );
  return (rows as any)[0] ?? [];
}

export async function getHourBankAll(dateFrom?: string, dateTo?: string) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.execute(
    sql`SELECT hb.*, u.name AS userName, u.department FROM hour_bank hb JOIN users u ON u.id = hb.userId WHERE 1=1 ${dateFrom ? sql`AND hb.date >= ${dateFrom}` : sql``} ${dateTo ? sql`AND hb.date <= ${dateTo}` : sql``} ORDER BY hb.date DESC, u.name`
  );
  return (rows as any)[0] ?? [];
}

async function checkBudgetAlerts(taskId: number, projectId: number, minutesWorked: number) {
  const db = await getDb();
  if (!db) return;
  const [task] = await db.select().from(projectTasks).where(eq(projectTasks.id, taskId)).limit(1);
  if (!task) return;
  const budgetMinutes = Number(task.budgetHours) * 60;
  if (budgetMinutes <= 0) return;
  const pct = (minutesWorked / budgetMinutes) * 100;
  const coordinators = await db.execute(
    sql`SELECT pm.userId FROM project_members pm WHERE pm.projectId = ${projectId} AND pm.projectRole = 'coordonator' UNION SELECT u.id FROM users u WHERE u.role = 'admin'`
  );
  const coordIds: number[] = ((coordinators as any)[0] ?? []).map((r: any) => r.userId);
  const taskAssigneesRows = await db.execute(
    sql`SELECT userId FROM task_assignees WHERE taskId = ${taskId}`
  );
  const taskAssigneeIds: number[] = ((taskAssigneesRows as any)[0] ?? []).map((r: any) => r.userId);
  const sendAlert = async (threshold: number, alertField: string) => {
    if (pct >= threshold && !(task as any)[alertField]) {
      await db.update(projectTasks).set({ [alertField]: true } as any).where(eq(projectTasks.id, taskId));
      const legacyAssigneeIds = task.assignedUserId ? [task.assignedUserId] : [];
      const allRecipients = Array.from(new Set([...coordIds, ...taskAssigneeIds, ...legacyAssigneeIds]));
      const [phase] = await db.select().from(projectPhases).where(eq(projectPhases.id, task.phaseId)).limit(1);
      const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
      const title = `⚠️ Budget ${threshold}% — ${task.name}`;
      const content = `Task-ul "${task.name}" din faza "${phase?.name}" (${project?.name}) a atins ${threshold}% din bugetul alocat (${Math.round(minutesWorked / 60 * 10) / 10}h / ${task.budgetHours}h).`;
      for (const uid of allRecipients) {
        await db.insert(notifications).values({ userId: uid, type: "budget_alert", title, content, isRead: false } as any);
      }
    }
  };
  await sendAlert(25, "alertSent25");
  await sendAlert(50, "alertSent50");
  await sendAlert(75, "alertSent75");
  await sendAlert(90, "alertSent90");
}

// ─── TASK HOUR REQUESTS ──────────────────────────────────────────────────────

export async function createHourRequest(data: {
  taskId: number;
  projectId: number;
  userId: number;
  requestedHours: string;
  justification: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(taskHourRequests).values({
    taskId: data.taskId,
    projectId: data.projectId,
    userId: data.userId,
    requestedHours: data.requestedHours,
    justification: data.justification,
    status: "in_asteptare",
  });
  return { success: true, id: (result as any)[0]?.insertId };
}

export async function getHourRequestsForProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.execute(
    sql`SELECT thr.*, u.name AS userName, pt.name AS taskName, ph.name AS phaseName
        FROM task_hour_requests thr JOIN users u ON u.id = thr.userId
        JOIN project_tasks pt ON pt.id = thr.taskId
        JOIN project_phases ph ON ph.id = pt.phaseId
        WHERE thr.projectId = ${projectId} ORDER BY thr.createdAt DESC`
  );
  return (rows as any)[0] ?? [];
}

export async function getMyHourRequests(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.execute(
    sql`SELECT thr.*, pt.name AS taskName, ph.name AS phaseName, p.name AS projectName
        FROM task_hour_requests thr JOIN project_tasks pt ON pt.id = thr.taskId
        JOIN project_phases ph ON ph.id = pt.phaseId
        JOIN projects p ON p.id = thr.projectId
        WHERE thr.userId = ${userId} ORDER BY thr.createdAt DESC`
  );
  return (rows as any)[0] ?? [];
}

export async function reviewHourRequest(id: number, reviewedBy: number, status: "aprobata" | "respinsa", reviewNote?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [req] = await db.select().from(taskHourRequests).where(eq(taskHourRequests.id, id)).limit(1);
  if (!req) throw new Error("Cererea nu există");
  await db.update(taskHourRequests).set({ status, reviewedBy, reviewNote: reviewNote ?? null, reviewedAt: new Date() }).where(eq(taskHourRequests.id, id));
  if (status === "aprobata") {
    const [task] = await db.select().from(projectTasks).where(eq(projectTasks.id, req.taskId)).limit(1);
    if (task) {
      const newBudget = Number(task.budgetHours) + Number(req.requestedHours);
      await db.update(projectTasks).set({ budgetHours: String(newBudget) }).where(eq(projectTasks.id, req.taskId));
    }
  }
  const statusLabel = status === "aprobata" ? "aprobată ✅" : "respinsă ❌";
  await db.insert(notifications).values({
    userId: req.userId, type: "hour_request",
    title: `Cerere ore ${statusLabel}`,
    content: `Cererea ta de ${req.requestedHours}h suplimentare a fost ${statusLabel}.${reviewNote ? ` Notă: ${reviewNote}` : ""}`,
    isRead: false,
  } as any);
  return { success: true };
}

// ─── PROJECT TEMPLATES ───────────────────────────────────────────────────────

export async function getDefaultTemplate() {
  const db = await getDb();
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

export async function listTemplates() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projectTemplates).orderBy(desc(projectTemplates.isDefault), projectTemplates.name);
}

// ─── PROJECT DETAIL (full with phases, tasks, members) ───────────────────────

export async function getProjectDetail(projectId: number, userId?: number, isAdmin?: boolean) {
  const db = await getDb();
  if (!db) return null;
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) return null;
  if (!isAdmin && userId) {
    const [membership] = await db.select().from(projectMembers)
      .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId))).limit(1);
    if (!membership) return null;
  }
  const phases = await db.select().from(projectPhases).where(eq(projectPhases.projectId, projectId)).orderBy(projectPhases.displayOrder);
  const phasesWithTasks = [];
  for (const phase of phases) {
    const tasks = await getTasksByPhase(phase.id);
    phasesWithTasks.push({ ...phase, tasks });
  }
  const members = await db.execute(
    sql`SELECT pm.*, u.name, u.email, u.department, u.jobTitle, u.avatarUrl, u.role AS globalRole
        FROM project_members pm JOIN users u ON u.id = pm.userId
        WHERE pm.projectId = ${projectId}
        ORDER BY FIELD(pm.projectRole, 'coordonator', 'membru', 'consultant'), u.name`
  );
  return { ...project, phases: phasesWithTasks, members: (members as any)[0] ?? [] };
}

// Export for use in routers.ts
export { checkBudgetAlerts as checkBudgetAlertsExternal };
