import { router, protectedProcedure } from "../\_core/trpc";
import { z } from "zod";
import {
  listProjects,
  getProjectById,
  createProject,
  updateProject,
  createProjectFromTemplate,
  getProjectDetail,
  deleteProject,
  getProjectPhases,
  createPhase,
  updatePhase,
  deletePhase,
  getTasksByProject,
  getTasksByPhase,
  createTask,
  updateTask,
  deleteTask,
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
  updateProjectMemberRole,
  getActiveSession,
  startTaskSession,
  pauseTaskSession,
  resumeTaskSession,
  stopTaskSession,
  getSessionsForTask,
  getHourBankForUser,
  getHourBankAll,
  createHourRequest,
  getHourRequestsForProject,
  getMyHourRequests,
  reviewHourRequest,
  getDefaultTemplate,
  listTemplates,
  getDb,
} from "../db";
import { sql } from "drizzle-orm";

// ─── HELPER: get task assignees ─────────────────────────────────────────────
async function getTaskAssignees(taskId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.execute(
    sql`SELECT ta.userId, u.name, u.avatarUrl, u.jobTitle FROM task_assignees ta
        JOIN users u ON u.id = ta.userId WHERE ta.taskId = ${taskId} ORDER BY ta.assignedAt`
  );
  return (rows as any)[0] ?? [];
}

// ─── HELPER: get phase budget usage ─────────────────────────────────────────
async function getPhaseBudgetUsage(phaseId: number, excludeTaskId?: number) {
  const db = await getDb();
  if (!db) return 0;
  let rows: any;
  if (excludeTaskId) {
    rows = await db.execute(
      sql`SELECT COALESCE(SUM(CAST(budgetHours AS DECIMAL(10,2))), 0) as totalUsed
          FROM project_tasks WHERE phaseId = ${phaseId} AND status != 'finalizata' AND id != ${excludeTaskId}`
    );
  } else {
    rows = await db.execute(
      sql`SELECT COALESCE(SUM(CAST(budgetHours AS DECIMAL(10,2))), 0) as totalUsed
          FROM project_tasks WHERE phaseId = ${phaseId} AND status != 'finalizata'`
    );
  }
  return parseFloat(((rows as any)[0]?.[0])?.totalUsed || "0");
}

// ─── HELPER: get phase budget ────────────────────────────────────────────────
async function getPhaseBudget(phaseId: number) {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.execute(
    sql`SELECT budgetHours FROM project_phases WHERE id = ${phaseId}`
  );
  return parseFloat(((rows as any)[0]?.[0])?.budgetHours || "0");
}

// ─── HELPER: create project with selected phases ─────────────────────────────
async function createProjectWithSelectedPhases(data: {
  name: string; abbreviation?: string | null; emoji?: string | null;
  code?: string | null; clientName?: string | null; status?: "activ" | "suspendat" | "finalizat" | "intern";
  startDate?: string | null; endDate?: string | null; description?: string | null;
  color?: string | null; driveId?: string | null; managerId: number; isGeneral?: boolean;
  selectedPhaseIds?: number[];
}) {
  const { selectedPhaseIds, ...projectData } = data;
  const project = await createProject(projectData);
  if (!selectedPhaseIds || selectedPhaseIds.length === 0) return project;

  const db = await getDb();
  if (!db) return project;

  for (const tplPhaseId of selectedPhaseIds) {
    // Get template phase
    const phaseRows = await db.execute(
      sql`SELECT * FROM template_phases WHERE id = ${tplPhaseId}`
    );
    const phase = ((phaseRows as any)[0])?.[0];
    if (!phase) continue;

    const phaseInsert = await db.execute(
      sql`INSERT INTO project_phases (projectId, name, code, displayOrder, color, status, budgetHours)
          VALUES (${project.id}, ${phase.name}, ${phase.code}, ${phase.displayOrder}, ${phase.color}, 'activa', '0')`
    );
    const phaseId = (phaseInsert as any)[0]?.insertId;
    if (!phaseId) continue;

    // Get tasks for this template phase
    const taskRows = await db.execute(
      sql`SELECT * FROM template_tasks WHERE templatePhaseId = ${tplPhaseId} ORDER BY displayOrder`
    );
    const tasks = (taskRows as any)[0] ?? [];
    for (const task of tasks) {
      await db.execute(
        sql`INSERT INTO project_tasks (phaseId, projectId, name, displayOrder, status, budgetHours, minutesWorked)
            VALUES (${phaseId}, ${project.id}, ${task.name}, ${task.displayOrder}, 'neinceputa', '0', 0)`
      );
    }
  }
  return project;
}

export const projectsRouter = router({
  // ─── PROJECT CRUD ──────────────────────────────────────────────────────────
  list: protectedProcedure
    .input(z.object({ status: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const isAdmin = ctx.user.role === "admin" || ctx.user.role === "coordonator";
      return listProjects({ status: input?.status, userId: ctx.user.id, isAdmin });
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const isAdmin = ctx.user.role === "admin" || ctx.user.role === "coordonator";
      return getProjectDetail(input.id, ctx.user.id, isAdmin);
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      abbreviation: z.string().optional().nullable(),
      emoji: z.string().optional().nullable(),
      code: z.string().optional().nullable(),
      clientName: z.string().optional().nullable(),
      status: z.enum(["activ", "suspendat", "finalizat", "intern"]).optional(),
      isGeneral: z.boolean().optional(),
      startDate: z.string().optional().nullable(),
      endDate: z.string().optional().nullable(),
      description: z.string().optional().nullable(),
      color: z.string().optional().nullable(),
      driveId: z.string().optional().nullable(),
      selectedPhaseIds: z.array(z.number()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") throw new Error("Acces interzis");
      const { selectedPhaseIds, ...rest } = input;
      return createProjectWithSelectedPhases({
        ...rest,
        managerId: ctx.user.id,
        selectedPhaseIds,
      });
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      abbreviation: z.string().optional().nullable(),
      emoji: z.string().optional().nullable(),
      code: z.string().optional().nullable(),
      clientName: z.string().optional().nullable(),
      status: z.enum(["activ", "suspendat", "finalizat", "intern"]).optional(),
      isGeneral: z.boolean().optional(),
      startDate: z.string().optional().nullable(),
      endDate: z.string().optional().nullable(),
      description: z.string().optional().nullable(),
      color: z.string().optional().nullable(),
      driveId: z.string().optional().nullable(),
      managerId: z.number().optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") throw new Error("Acces interzis");
      const { id, ...data } = input;
      return updateProject(id, data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number(), confirmName: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Doar administratorii pot șterge proiecte");
      const project = await getProjectById(input.id);
      if (!project) throw new Error("Proiectul nu există");
      if (project.name !== input.confirmName) throw new Error("Numele proiectului nu corespunde");
      return deleteProject(input.id);
    }),

  // ─── PHASES ────────────────────────────────────────────────────────────────
  phases: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      return getProjectPhases(input.projectId);
    }),

  addPhase: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      name: z.string().min(1),
      code: z.string().optional().nullable(),
      displayOrder: z.number().optional(),
      budgetHours: z.string().optional(),
      color: z.string().optional().nullable(),
      templatePhaseId: z.number().optional().nullable(), // if from template, auto-add tasks
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") throw new Error("Acces interzis");
      const { templatePhaseId, ...phaseData } = input;
      const phase = await createPhase(phaseData);

      // If from template, auto-add tasks
      if (templatePhaseId) {
        const db = await getDb();
        if (db) {
          const taskRows = await db.execute(
            sql`SELECT * FROM template_tasks WHERE templatePhaseId = ${templatePhaseId} ORDER BY displayOrder`
          );
          const tasks = (taskRows as any)[0] ?? [];
          for (const task of tasks as any[]) {
            await db.execute(
              sql`INSERT INTO project_tasks (phaseId, projectId, name, displayOrder, status, budgetHours, minutesWorked)
                  VALUES (${phase.id}, ${input.projectId}, ${task.name}, ${task.displayOrder}, 'neinceputa', '0', 0)`
            );
          }
        }
      }
      return phase;
    }),

  updatePhase: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      code: z.string().optional().nullable(),
      displayOrder: z.number().optional(),
      budgetHours: z.string().optional(),
      color: z.string().optional().nullable(),
      status: z.enum(["activa", "suspendata", "finalizata"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") throw new Error("Acces interzis");
      const { id, ...data } = input;
      return updatePhase(id, data);
    }),

  deletePhase: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") throw new Error("Acces interzis");
      return deletePhase(input.id);
    }),

  // ─── TASKS ─────────────────────────────────────────────────────────────────
  tasks: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const isAdmin = ctx.user.role === "admin" || ctx.user.role === "coordonator";
      return getTasksByProject(input.projectId, isAdmin ? undefined : ctx.user.id);
    }),

  tasksByPhase: protectedProcedure
    .input(z.object({ phaseId: z.number() }))
    .query(async ({ input }) => {
      return getTasksByPhase(input.phaseId);
    }),

  addTask: protectedProcedure
    .input(z.object({
      phaseId: z.number(),
      projectId: z.number(),
      name: z.string().min(1),
      description: z.string().optional().nullable(),
      displayOrder: z.number().optional(),
      budgetHours: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") throw new Error("Acces interzis");
      // Budget validation: check if adding this task would exceed phase budget
      const phaseBudget = await getPhaseBudget(input.phaseId);
      if (phaseBudget > 0 && input.budgetHours) {
        const used = await getPhaseBudgetUsage(input.phaseId);
        const newHours = parseFloat(input.budgetHours || "0");
        if (used + newHours > phaseBudget) {
          throw new Error(`Bugetul etapei este depășit. Disponibil: ${(phaseBudget - used).toFixed(1)}h din ${phaseBudget}h`);
        }
      }
      return createTask(input);
    }),

  updateTask: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional().nullable(),
      displayOrder: z.number().optional(),
      budgetHours: z.string().optional(),
      status: z.enum(["neinceputa", "in_lucru", "in_pauza", "finalizata", "blocata"]).optional(),
      phaseId: z.number().optional(), // needed for budget validation
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") throw new Error("Acces interzis");
      const { id, phaseId, ...data } = input;
      // Budget validation if budgetHours is being updated
      if (phaseId && data.budgetHours !== undefined) {
        const phaseBudget = await getPhaseBudget(phaseId);
        if (phaseBudget > 0) {
          const used = await getPhaseBudgetUsage(phaseId, id);
          const newHours = parseFloat(data.budgetHours || "0");
          if (used + newHours > phaseBudget) {
            throw new Error(`Bugetul etapei este depășit. Disponibil: ${(phaseBudget - used).toFixed(1)}h din ${phaseBudget}h`);
          }
        }
      }
      return updateTask(id, data);
    }),

  deleteTask: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") throw new Error("Acces interzis");
      return deleteTask(input.id);
    }),

  // ─── TASK ASSIGNEES (multi-user) ────────────────────────────────────────────
  taskAssignees: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ input }) => {
      return getTaskAssignees(input.taskId);
    }),

  addTaskAssignee: protectedProcedure
    .input(z.object({ taskId: z.number(), userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") throw new Error("Acces interzis");
      const db = await getDb();
      if (db) {
        await db.execute(
          sql`INSERT IGNORE INTO task_assignees (taskId, userId) VALUES (${input.taskId}, ${input.userId})`
        );
      }
      return { success: true };
    }),

  removeTaskAssignee: protectedProcedure
    .input(z.object({ taskId: z.number(), userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") throw new Error("Acces interzis");
      const db = await getDb();
      if (db) {
        await db.execute(
          sql`DELETE FROM task_assignees WHERE taskId = ${input.taskId} AND userId = ${input.userId}`
        );
      }
      return { success: true };
    }),

  // ─── MEMBERS ───────────────────────────────────────────────────────────────
  members: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      return getProjectMembers(input.projectId);
    }),

  addMember: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      userId: z.number(),
      projectRole: z.enum(["coordonator", "membru", "consultant"]).default("membru"),
      phaseId: z.number().optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") throw new Error("Acces interzis");
      return addProjectMember(input.projectId, input.userId, input.projectRole, input.phaseId);
    }),

  removeMember: protectedProcedure
    .input(z.object({ projectId: z.number(), userId: z.number(), phaseId: z.number().optional().nullable() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") throw new Error("Acces interzis");
      return removeProjectMember(input.projectId, input.userId, input.phaseId);
    }),

  updateMemberRole: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      userId: z.number(),
      projectRole: z.enum(["coordonator", "membru", "consultant"]),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") throw new Error("Acces interzis");
      return updateProjectMemberRole(input.projectId, input.userId, input.projectRole);
    }),

  // ─── TASK SESSIONS ─────────────────────────────────────────────────────────
  activeSession: protectedProcedure.query(async ({ ctx }) => {
    return getActiveSession(ctx.user.id);
  }),

  startSession: protectedProcedure
    .input(z.object({ taskId: z.number(), projectId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return startTaskSession(ctx.user.id, input.taskId, input.projectId);
    }),

  pauseSession: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return pauseTaskSession(input.sessionId, ctx.user.id);
    }),

  resumeSession: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return resumeTaskSession(input.sessionId, ctx.user.id);
    }),

  stopSession: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return stopTaskSession(input.sessionId, ctx.user.id);
    }),

  taskSessions: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ input }) => {
      return getSessionsForTask(input.taskId);
    }),

  // ─── HOUR BANK ─────────────────────────────────────────────────────────────
  myHourBank: protectedProcedure
    .input(z.object({ dateFrom: z.string().optional(), dateTo: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return getHourBankForUser(ctx.user.id, input?.dateFrom, input?.dateTo);
    }),

  hourBankAll: protectedProcedure
    .input(z.object({ dateFrom: z.string().optional(), dateTo: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") throw new Error("Acces interzis");
      return getHourBankAll(input?.dateFrom, input?.dateTo);
    }),

  // ─── HOUR REQUESTS ─────────────────────────────────────────────────────────
  requestMoreHours: protectedProcedure
    .input(z.object({
      taskId: z.number(),
      projectId: z.number(),
      requestedHours: z.string(),
      justification: z.string().min(10),
    }))
    .mutation(async ({ ctx, input }) => {
      return createHourRequest({ ...input, userId: ctx.user.id });
    }),

  hourRequests: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") throw new Error("Acces interzis");
      return getHourRequestsForProject(input.projectId);
    }),

  myHourRequests: protectedProcedure.query(async ({ ctx }) => {
    return getMyHourRequests(ctx.user.id);
  }),

  reviewHourRequest: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["aprobata", "respinsa"]),
      reviewNote: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
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
    const db = await getDb();
    if (!db) return [];
    const rows = await db.execute(
      sql`SELECT pt.id, pt.name, pt.budgetHours, pt.minutesWorked,
              pp.name as phaseName, pp.code as phaseCode,
              p.id as projectId, p.name as projectName,
              CASE
                WHEN pt.budgetHours > 0 THEN ROUND((pt.minutesWorked / (CAST(pt.budgetHours AS DECIMAL) * 60)) * 100)
                ELSE 0
              END as pct
       FROM task_assignees ta
       JOIN project_tasks pt ON pt.id = ta.taskId
       JOIN project_phases pp ON pp.id = pt.phaseId
       JOIN projects p ON p.id = pt.projectId
       WHERE ta.userId = ${ctx.user.id}
         AND pt.status != 'finalizata'
         AND pt.budgetHours > 0
         AND pt.minutesWorked > 0
         AND (pt.minutesWorked / (CAST(pt.budgetHours AS DECIMAL) * 60)) >= 0.25
       ORDER BY pct DESC`
    );
    return ((rows as any)[0] ?? []) as any[];
  }),
});
