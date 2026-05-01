import { protectedProcedure, router } from "../_core/trpc";
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
} from "../db";

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
      code: z.string().optional().nullable(),
      clientName: z.string().optional().nullable(),
      status: z.enum(["activ", "suspendat", "finalizat", "intern"]).optional(),
      isGeneral: z.boolean().optional(),
      startDate: z.string().optional().nullable(),
      endDate: z.string().optional().nullable(),
      description: z.string().optional().nullable(),
      color: z.string().optional().nullable(),
      driveId: z.string().optional().nullable(),
      templateId: z.number().optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") throw new Error("Acces interzis");
      const { templateId, ...rest } = input;
      if (templateId) {
        return createProjectFromTemplate({ ...rest, managerId: ctx.user.id, templateId });
      }
      return createProject({ ...rest, managerId: ctx.user.id });
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      code: z.string().optional().nullable(),
      clientName: z.string().optional().nullable(),
      status: z.enum(["activ", "suspendat", "finalizat", "intern"]).optional(),
      isGeneral: z.boolean().optional(),
      startDate: z.string().optional().nullable(),
      endDate: z.string().optional().nullable(),
      description: z.string().optional().nullable(),
      color: z.string().optional().nullable(),
      driveId: z.string().optional().nullable(),
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
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") throw new Error("Acces interzis");
      return createPhase(input);
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
      assignedUserId: z.number().optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") throw new Error("Acces interzis");
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
      assignedUserId: z.number().optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") throw new Error("Acces interzis");
      const { id, ...data } = input;
      return updateTask(id, data);
    }),

  deleteTask: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") throw new Error("Acces interzis");
      return deleteTask(input.id);
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
});
