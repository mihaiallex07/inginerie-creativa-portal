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
    values.role = "super_admin";
    updateSet.role = "super_admin";
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
