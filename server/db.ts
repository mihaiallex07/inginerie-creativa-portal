import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
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
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

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
