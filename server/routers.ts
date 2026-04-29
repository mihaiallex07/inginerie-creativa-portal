import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getGoogleCalendarAuthUrl,
  exchangeCodeForTokens,
  saveTokens,
  getValidAccessToken,
  fetchCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  hasGoogleCalendarConnected,
  disconnectGoogleCalendar,
  upsertSyncMap,
  getSyncMapByTimeEntry,
  deleteSyncMapByTimeEntry,
} from "./googleCalendar";
import {
  getTodayPontaj,
  upsertPontaj,
  getPontajByMonth,
  getAllPontajByMonth,
  updatePontajEntry,
  deletePontajEntry,
  getPontajById,
  getPontajLunarAngajat,
  getSumarEchipaLunar,
  getAbsenteLunare,
  getOreSuplimentare,
  getPontajPerProiect,
  getProjects,
  upsertProject,
  getTimeEntriesForUser,
  getRunningTimer,
  createTimeEntry,
  updateTimeEntry,
  getTimeEntriesForProject,
  getNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
  getNewsComments,
  addNewsReaction,
  getDocumentsForUser,
  createDocument,
  logDocumentAccess,
  getProcesses,
  getProcessById,
  confirmProcessRead,
  getProcessReadStatus,
  getProposals,
  getProposalById,
  createProposal,
  voteProposal,
  getNotifications,
  getUnreadNotificationCount,
  markNotificationsRead,
  createNotification,
  getAllUsers,
  updateUser,
  createLeaveRequest,
  getLeaveRequestsByUser,
  getAllLeaveRequests,
  reviewLeaveRequest,
  cancelLeaveRequest,
  getLeaveRequestById,
  getAllUsersAdmin,
  updateUserRole,
  updateUserActive,
  updateUserProfile,
  deleteUserCompletely,
  getHRDashboardStats,
  getFullProfile,
  updateFullProfile,
  getUpcomingBirthdays,
  getOrgChartData,
  getCompanyEvents,
  createCompanyEvent,
  updateCompanyEvent,
  deleteCompanyEvent,
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
  updateProjectMemberRole,
  getProjectWithTeam,
  getProjectBudgetItems,
  createBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
  getProjectBudgetSummary,
  getProcessOverview,
  deleteProject,
  updateUsersDisplayOrder,
  getAppSetting,
  setAppSetting,
  getAllCompanyEvents,
} from "./db";

// ─── PEOPLE (BIRTHDAYS + ORG CHART) ────────────────────────────────────────
const peopleRouter = router({
  // List all active users (for audience targeting in events) — admin + coordonator
  list: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") throw new Error("Acces interzis");
    return getAllUsers();
  }),
  upcomingBirthdays: protectedProcedure
    .input(z.object({ daysAhead: z.number().min(1).max(365).default(30) }).optional())
    .query(async ({ input }) => {
      return getUpcomingBirthdays(input?.daysAhead ?? 30);
    }),
  orgChart: protectedProcedure
    .query(async () => {
      return getOrgChartData();
    }),
});

// ─── APP SETTINGS ──────────────────────────────────────────────────────────────────
const settingsRouter = router({
  get: protectedProcedure
    .input(z.object({ key: z.string() }))
    .query(async ({ input }) => {
      const value = await getAppSetting(input.key);
      return { key: input.key, value };
    }),
  set: protectedProcedure
    .input(z.object({ key: z.string(), value: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Doar administratorii pot modifica setările");
      }
      await setAppSetting(input.key, input.value, ctx.user.id);
      return { success: true };
    }),
});

export const appRouter = router({
  system: systemRouter,
  settings: settingsRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── PONTAJ ──────────────────────────────────────────────────────────────
  pontaj: router({
    today: protectedProcedure.query(async ({ ctx }) => {
      return getTodayPontaj(ctx.user.id);
    }),

    checkIn: protectedProcedure
      .input(z.object({ type: z.enum(["bucuresti", "cluj", "miercurea_ciuc", "brasov", "eveniment", "deplasare", "vizita_santier", "telemunca", "concediu", "medical", "liber_legal", "absent", "recuperare"]).optional() }))
      .mutation(async ({ ctx, input }) => {
        const existing = await getTodayPontaj(ctx.user.id);
        if (existing?.checkIn) return { success: false, message: "Deja ai făcut check-in astăzi" };
        await upsertPontaj({
          userId: ctx.user.id,
          date: new Date(),
          checkIn: new Date(),
          type: input.type ?? "bucuresti",
        });
        return { success: true };
      }),

    checkOut: protectedProcedure.mutation(async ({ ctx }) => {
      const existing = await getTodayPontaj(ctx.user.id);
      if (!existing?.checkIn) return { success: false, message: "Nu ai făcut check-in astăzi" };
      if (existing.checkOut) return { success: false, message: "Deja ai făcut check-out astăzi" };
      const now = new Date();
      const checkInTime = new Date(existing.checkIn);
      const totalMinutes = Math.floor((now.getTime() - checkInTime.getTime()) / 60000) - (existing.breakMinutes ?? 0);
      await upsertPontaj({
        userId: ctx.user.id,
        date: new Date(),
        checkIn: existing.checkIn,
        checkOut: now,
        totalMinutes: Math.max(0, totalMinutes),
        type: existing.type,
        breakMinutes: existing.breakMinutes ?? 0,
      });
      return { success: true };
    }),

    addBreak: protectedProcedure
      .input(z.object({ minutes: z.number().min(1).max(120) }))
      .mutation(async ({ ctx, input }) => {
        const existing = await getTodayPontaj(ctx.user.id);
        if (!existing) return { success: false };
        await upsertPontaj({
          ...existing,
          date: new Date(),
          breakMinutes: (existing.breakMinutes ?? 0) + input.minutes,
        });
        return { success: true };
      }),

    monthReport: protectedProcedure
      .input(z.object({ year: z.number(), month: z.number() }))
      .query(async ({ ctx, input }) => {
        return getPontajByMonth(ctx.user.id, input.year, input.month);
      }),

    allMonthReport: protectedProcedure
      .input(z.object({ year: z.number(), month: z.number() }))
      .query(async ({ ctx, input }) => {
        const role = ctx.user.role;
        if (role !== "admin") {
          throw new Error("Acces interzis");
        }
        return getAllPontajByMonth(input.year, input.month);
      }),

    // Manual entry with specific date + time (30-min slots)
    manualEntry: protectedProcedure
      .input(z.object({
        date: z.string(), // "YYYY-MM-DD"
        checkInTime: z.string(), // "HH:MM"
        checkOutTime: z.string().optional(), // "HH:MM"
        type: z.enum(["bucuresti", "cluj", "miercurea_ciuc", "brasov", "eveniment", "deplasare", "vizita_santier", "telemunca", "concediu", "medical", "liber_legal", "absent", "recuperare"]),
        location: z.string().optional(),
        notes: z.string().optional(),
        projectId: z.number().optional(),
        breakMinutes: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Build dates as UTC to avoid server timezone offset (server runs in America/New_York)
        // input.date = "YYYY-MM-DD", input.checkInTime = "HH:MM" — treat as UTC directly
        const [inH, inM] = input.checkInTime.split(":").map(Number);
        const [year, month, day] = input.date.split("-").map(Number);
        const checkIn = new Date(Date.UTC(year, month - 1, day, inH, inM, 0, 0));
        const dateObj = new Date(Date.UTC(year, month - 1, day));

        let checkOut: Date | undefined;
        let totalMinutes = 0;
        if (input.checkOutTime) {
          const [outH, outM] = input.checkOutTime.split(":").map(Number);
          checkOut = new Date(Date.UTC(year, month - 1, day, outH, outM, 0, 0));
          totalMinutes = Math.max(0, Math.floor((checkOut.getTime() - checkIn.getTime()) / 60000) - (input.breakMinutes ?? 0));
        }

        await upsertPontaj({
          userId: ctx.user.id,
          date: dateObj,
          checkIn,
          checkOut,
          type: input.type,
          notes: input.notes,
          breakMinutes: input.breakMinutes ?? 0,
          totalMinutes,
        });
        return { success: true };
      }),

    updateEntry: protectedProcedure
      .input(z.object({
        id: z.number(),
        date: z.string(),
        checkInTime: z.string(),
        checkOutTime: z.string().optional(),
        type: z.enum(["bucuresti", "cluj", "miercurea_ciuc", "brasov", "eveniment", "deplasare", "vizita_santier", "telemunca", "concediu", "medical", "liber_legal", "absent", "recuperare"]),
        notes: z.string().optional(),
        projectId: z.number().optional(),
        breakMinutes: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const entry = await getPontajById(input.id);
        if (!entry || entry.userId !== ctx.user.id) throw new Error("Intrare negăsită");
        // Build dates as UTC to avoid server timezone offset
        const [year, month, day] = input.date.split("-").map(Number);
        const dateObj = new Date(Date.UTC(year, month - 1, day));
        const [inH, inM] = input.checkInTime.split(":").map(Number);
        const checkIn = new Date(Date.UTC(year, month - 1, day, inH, inM, 0, 0));
        let checkOut: Date | undefined;
        let totalMinutes = 0;
        if (input.checkOutTime) {
          const [outH, outM] = input.checkOutTime.split(":").map(Number);
          checkOut = new Date(Date.UTC(year, month - 1, day, outH, outM, 0, 0));
          totalMinutes = Math.max(0, Math.floor((checkOut.getTime() - checkIn.getTime()) / 60000) - (input.breakMinutes ?? 0));
        }
        await updatePontajEntry(input.id, ctx.user.id, {
          date: dateObj,
          checkIn,
          checkOut,
          type: input.type,
          notes: input.notes,
          breakMinutes: input.breakMinutes ?? 0,
          totalMinutes,
          projectId: input.projectId,
        });
        return { success: true };
      }),

    deleteEntry: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const entry = await getPontajById(input.id);
        if (!entry || entry.userId !== ctx.user.id) throw new Error("Intrare negăsită");
        await deletePontajEntry(input.id, ctx.user.id);
        return { success: true };
      }),

    // ── HR Report preview procedures ──────────────────────────────────────
    getByMonth: protectedProcedure
      .input(z.object({ year: z.number(), month: z.number(), userId: z.number() }))
      .query(async ({ ctx, input }) => {
        const role = ctx.user.role;
        if (role !== "admin") throw new Error("Acces interzis");
        return getPontajLunarAngajat(input.userId, input.year, input.month);
      }),

    getAllByMonth: protectedProcedure
      .input(z.object({ year: z.number(), month: z.number() }))
      .query(async ({ ctx, input }) => {
        const role = ctx.user.role;
        if (role !== "admin") throw new Error("Acces interzis");
        return getSumarEchipaLunar(input.year, input.month);
      }),

    getAbsente: protectedProcedure
      .input(z.object({ year: z.number(), month: z.number() }))
      .query(async ({ ctx, input }) => {
        const role = ctx.user.role;
        if (role !== "admin") throw new Error("Acces interzis");
        return getAbsenteLunare(input.year, input.month);
      }),

    getOreSuplimentare: protectedProcedure
      .input(z.object({ year: z.number(), month: z.number(), norm: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const role = ctx.user.role;
        if (role !== "admin") throw new Error("Acces interzis");
        return getOreSuplimentare(input.year, input.month, input.norm ?? 480);
      }),

    getPontajProiect: protectedProcedure
      .input(z.object({ year: z.number(), month: z.number() }))
      .query(async ({ ctx, input }) => {
        const role = ctx.user.role;
        if (role !== "admin") throw new Error("Acces interzis");
        return getPontajPerProiect(input.year, input.month);
      }),
  }),

  // ─── PROJECTS ────────────────────────────────────────────────────────────
  projects: router({
    list: protectedProcedure
      .input(z.object({ status: z.string().optional() }))
      .query(async ({ input }) => {
        return getProjects(input.status);
      }),

    upsert: protectedProcedure
      .input(z.object({
        id: z.number().optional(),
        name: z.string().min(1),
        code: z.string().optional(),
        abbreviation: z.string().optional(),
        driveId: z.string().optional(),
        status: z.enum(["activ", "suspendat", "finalizat", "intern"]).optional(),
        clientName: z.string().optional(),
        estimatedHours: z.string().optional(),
        description: z.string().optional(),
        color: z.string().optional(),
        coordinatorId: z.number().optional().nullable(),
        startDate: z.string().optional().nullable(),
        endDate: z.string().optional().nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        const role = ctx.user.role;
        if (role !== "admin" && role !== "coordonator") {
          throw new Error("Acces interzis");
        }
        const { startDate, endDate, ...rest } = input;
        await upsertProject({
          ...rest,
          managerId: ctx.user.id,
          coordinatorId: input.coordinatorId,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
        });
        return { success: true };
      }),

    // Get project with full team
    getWithTeam: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getProjectWithTeam(input.id);
      }),

    // Get project members
    members: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return getProjectMembers(input.projectId);
      }),

    // Add member to project (admin or coordonator)
    addMember: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        userId: z.number(),
        projectRole: z.enum(["coordonator", "membru", "consultant"]).default("membru"),
        allocatedHours: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const role = ctx.user.role;
        if (role !== "admin" && role !== "coordonator") {
          throw new Error("Acces interzis");
        }
        await addProjectMember(input.projectId, input.userId, input.projectRole, input.allocatedHours);
        // If adding as coordonator, also update the project's coordinatorId
        if (input.projectRole === "coordonator") {
          await upsertProject({ id: input.projectId, name: "", coordinatorId: input.userId });
        }
        return { success: true };
      }),

    // Remove member from project
    removeMember: protectedProcedure
      .input(z.object({ projectId: z.number(), userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const role = ctx.user.role;
        if (role !== "admin" && role !== "coordonator") {
          throw new Error("Acces interzis");
        }
        await removeProjectMember(input.projectId, input.userId);
        return { success: true };
      }),

    // ── Budget items (bugetare ore pe categorii) ──
    budgetItems: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return getProjectBudgetSummary(input.projectId);
      }),

    addBudgetItem: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        category: z.enum(["proiectare", "consultanta", "sedinta", "documentare", "deplasare", "administrativ", "verificare", "executie"]),
        description: z.string().optional(),
        budgetedHours: z.string(),
        assignedUserId: z.number().optional().nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        const role = ctx.user.role;
        if (role !== "admin" && role !== "coordonator") throw new Error("Acces interzis");
        return createBudgetItem(input);
      }),

    updateBudgetItem: protectedProcedure
      .input(z.object({
        id: z.number(),
        category: z.enum(["proiectare", "consultanta", "sedinta", "documentare", "deplasare", "administrativ", "verificare", "executie"]).optional(),
        description: z.string().optional().nullable(),
        budgetedHours: z.string().optional(),
        assignedUserId: z.number().optional().nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        const role = ctx.user.role;
        if (role !== "admin" && role !== "coordonator") throw new Error("Acces interzis");
        const { id, ...data } = input;
        return updateBudgetItem(id, data);
      }),

    deleteBudgetItem: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const role = ctx.user.role;
        if (role !== "admin" && role !== "coordonator") throw new Error("Acces interzis");
        return deleteBudgetItem(input.id);
      }),

    // Update member role on project
    updateMemberRole: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        userId: z.number(),
        projectRole: z.enum(["coordonator", "membru", "consultant"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const role = ctx.user.role;
        if (role !== "admin" && role !== "coordonator") {
          throw new Error("Acces interzis");
        }
        await updateProjectMemberRole(input.projectId, input.userId, input.projectRole);
        if (input.projectRole === "coordonator") {
          await upsertProject({ id: input.projectId, name: "", coordinatorId: input.userId });
        }
        return { success: true };
      }),

    // Delete project (admin only, with cascade)
    delete: protectedProcedure
      .input(z.object({ id: z.number(), confirmName: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Doar administratorii pot șterge proiecte");
        // Verify project exists and name matches
        const project = await getProjectWithTeam(input.id);
        if (!project) throw new Error("Proiectul nu există");
        if (project.name !== input.confirmName) throw new Error("Numele proiectului nu corespunde");
        await deleteProject(input.id);
        return { success: true };
      }),
  }),

  // ─── TIME TRACKING ───────────────────────────────────────────────────────
  timeTracking: router({
    myEntries: protectedProcedure
      .input(z.object({ dateFrom: z.string().optional(), dateTo: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        return getTimeEntriesForUser(ctx.user.id, input.dateFrom, input.dateTo);
      }),

    runningTimer: protectedProcedure.query(async ({ ctx }) => {
      return getRunningTimer(ctx.user.id);
    }),

    startTimer: protectedProcedure
      .input(z.object({
        projectId: z.number().optional(),
        taskName: z.string().optional(),
        activityType: z.enum(["proiectare", "consultanta", "sedinta", "documentare", "deplasare", "administrativ", "verificare", "executie"]).optional(),
        isBillable: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Stop any running timer first
        const running = await getRunningTimer(ctx.user.id);
        if (running) {
          const now = new Date();
          const start = new Date(running.startTime!);
          const duration = Math.floor((now.getTime() - start.getTime()) / 60000);
          await updateTimeEntry(running.id, { isRunning: false, endTime: now, durationMinutes: duration, status: "salvat" });
        }
        const id = await createTimeEntry({
          userId: ctx.user.id,
          projectId: input.projectId,
          date: new Date(),
          startTime: new Date(),
          activityType: input.activityType ?? "proiectare",
          taskName: input.taskName,
          isBillable: input.isBillable ?? true,
          isRunning: true,
          status: "draft",
        });
        return { success: true, id };
      }),

    stopTimer: protectedProcedure
      .input(z.object({ id: z.number(), description: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const now = new Date();
        const entries = await getTimeEntriesForUser(ctx.user.id);
        const entry = entries.find((e) => e.id === input.id);
        if (!entry || entry.userId !== ctx.user.id) throw new Error("Intrare negăsită");
        const start = new Date(entry.startTime!);
        const duration = Math.floor((now.getTime() - start.getTime()) / 60000);
        await updateTimeEntry(input.id, {
          isRunning: false,
          endTime: now,
          durationMinutes: duration,
          description: input.description,
          status: "salvat",
        });
        return { success: true, durationMinutes: duration };
      }),

    addManual: protectedProcedure
      .input(z.object({
        projectId: z.number().optional(),
        date: z.string(),
        durationMinutes: z.number().min(1),
        activityType: z.enum(["proiectare", "consultanta", "sedinta", "documentare", "deplasare", "administrativ", "verificare", "executie"]),
        taskName: z.string().optional(),
        description: z.string().optional(),
        isBillable: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await createTimeEntry({
          userId: ctx.user.id,
          ...input,
          date: new Date(input.date),
          status: "salvat",
          isRunning: false,
        });
        return { success: true };
      }),

    projectEntries: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return getTimeEntriesForProject(input.projectId);
      }),


    // ── Calendar entry: timezone-safe — receives integers for hours/minutes ──
    addCalendarEntry: protectedProcedure
      .input(z.object({
        projectId: z.number().optional(),
        date: z.string(),       // "YYYY-MM-DD"
        startHour: z.number(),  // 0-23
        startMin: z.number(),   // 0-59
        endHour: z.number(),    // 0-23
        endMin: z.number(),     // 0-59
        activityType: z.enum(["proiectare", "consultanta", "sedinta", "documentare", "deplasare", "administrativ", "verificare", "executie"]).optional(),
        taskName: z.string().optional(),
        description: z.string().optional(),
        isBillable: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Store hours as plain integers — NO Date/timezone conversion
        const durationMinutes = (input.endHour * 60 + input.endMin) - (input.startHour * 60 + input.startMin);
        const id = await createTimeEntry({
          userId: ctx.user.id,
          projectId: input.projectId,
          date: new Date(input.date + "T12:00:00Z"),
          startHour: input.startHour,
          startMin: input.startMin,
          endHour: input.endHour,
          endMin: input.endMin,
          durationMinutes: Math.max(0, durationMinutes),
          activityType: input.activityType ?? "proiectare",
          taskName: input.taskName,
          description: input.description,
          isBillable: input.isBillable ?? true,
          isRunning: false,
          status: "salvat",
        });
        return { success: true, id };
      }),

    updateCalendarEntry: protectedProcedure
      .input(z.object({
        id: z.number(),
        projectId: z.number().optional().nullable(),
        date: z.string(),
        startHour: z.number(),
        startMin: z.number(),
        endHour: z.number(),
        endMin: z.number(),
        activityType: z.enum(["proiectare", "consultanta", "sedinta", "documentare", "deplasare", "administrativ", "verificare", "executie"]).optional(),
        taskName: z.string().optional(),
        description: z.string().optional(),
        isBillable: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const entries = await getTimeEntriesForUser(ctx.user.id);
        const entry = entries.find(e => e.id === input.id);
        if (!entry || entry.userId !== ctx.user.id) throw new Error("Intrare negăsită");
        const durationMinutes = (input.endHour * 60 + input.endMin) - (input.startHour * 60 + input.startMin);
        await updateTimeEntry(input.id, {
          projectId: input.projectId ?? undefined,
          date: new Date(input.date + "T12:00:00Z"),
          startHour: input.startHour,
          startMin: input.startMin,
          endHour: input.endHour,
          endMin: input.endMin,
          durationMinutes: Math.max(0, durationMinutes),
          activityType: input.activityType ?? "proiectare",
          taskName: input.taskName,
          description: input.description,
          isBillable: input.isBillable ?? true,
        });
        return { success: true };
      }),

    deleteEntry: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const entries = await getTimeEntriesForUser(ctx.user.id);
        const entry = entries.find(e => e.id === input.id);
        if (!entry || entry.userId !== ctx.user.id) throw new Error("Intrare negăsită");
        const db = await (await import("./db")).getDb();
        if (db) {
          const { timeEntries } = await import("../drizzle/schema");
          const { eq } = await import("drizzle-orm");
          await db.delete(timeEntries).where(eq(timeEntries.id, input.id));
        }
        return { success: true };
      }),
  }),

  // ─── NEWS ────────────────────────────────────────────────────────────────
  news: router({
    list: protectedProcedure
      .input(z.object({ category: z.string().optional(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return getNews(input.limit ?? 20, input.category);
      }),

    byId: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getNewsById(input.id);
      }),

    comments: protectedProcedure
      .input(z.object({ newsId: z.number() }))
      .query(async ({ input }) => {
        return getNewsComments(input.newsId);
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        content: z.string().min(1),
        excerpt: z.string().optional(),
        category: z.enum(["companie", "proiecte", "hr", "it", "evenimente", "realizari"]),
        tags: z.array(z.string()).optional(),
        isPinned: z.boolean().optional(),
        isImportant: z.boolean().optional(),
        imageUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const role = ctx.user.role;
        if (role !== "admin") {
          throw new Error("Acces interzis");
        }
        const id = await createNews({ ...input, authorId: ctx.user.id });
        return { success: true, id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1),
        content: z.string().min(1),
        excerpt: z.string().optional(),
        category: z.enum(["companie", "proiecte", "hr", "it", "evenimente", "realizari"]),
        tags: z.array(z.string()).optional(),
        isPinned: z.boolean().optional(),
        isImportant: z.boolean().optional(),
        imageUrl: z.string().optional().nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Only admin or the author can edit
        const existing = await getNewsById(input.id);
        if (!existing) throw new Error("Știrea nu a fost găsită");
        if (ctx.user.role !== "admin" && existing.news.authorId !== ctx.user.id) {
          throw new Error("Nu ai permisiunea de a edita această știre");
        }
        const { id, ...data } = input;
        await updateNews(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Only admin or the author can delete
        const existing = await getNewsById(input.id);
        if (!existing) throw new Error("Știrea nu a fost găsită");
        if (ctx.user.role !== "admin" && existing.news.authorId !== ctx.user.id) {
          throw new Error("Nu ai permisiunea de a șterge această știre");
        }
        await deleteNews(input.id);
        return { success: true };
      }),

    react: protectedProcedure
      .input(z.object({ newsId: z.number(), reaction: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await addNewsReaction(input.newsId, ctx.user.id, input.reaction);
        return { success: true };
      }),
  }),

  // ─── DOCUMENTS ───────────────────────────────────────────────────────────
  documents: router({
    myDocuments: protectedProcedure.query(async ({ ctx }) => {
      return getDocumentsForUser(ctx.user.id);
    }),

    userDocuments: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ ctx, input }) => {
        const role = ctx.user.role;
        if (role !== "admin") throw new Error("Acces interzis");
        return getDocumentsForUser(input.userId);
      }),

    upload: protectedProcedure
      .input(z.object({
        userId: z.number(),
        type: z.enum(["contract", "fisa_post", "evaluare", "certificat", "salariu", "concediu", "medical", "alt"]),
        title: z.string().min(1),
        description: z.string().optional(),
        fileUrl: z.string(),
        fileKey: z.string(),
        mimeType: z.string().optional(),
        fileSize: z.number().optional(),
        year: z.number().optional(),
        month: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const role = ctx.user.role;
        if (role !== "admin" && input.userId !== ctx.user.id) {
          throw new Error("Acces interzis");
        }
        const id = await createDocument({ ...input, uploadedBy: ctx.user.id });
        await logDocumentAccess(id!, ctx.user.id, "upload", ctx.req.ip);
        return { success: true, id };
      }),

    logAccess: protectedProcedure
      .input(z.object({ documentId: z.number(), action: z.enum(["view", "download"]) }))
      .mutation(async ({ ctx, input }) => {
        await logDocumentAccess(input.documentId, ctx.user.id, input.action, ctx.req.ip);
        return { success: true };
      }),
  }),

  // ─── PROCESSES ───────────────────────────────────────────────────────────
  processes: router({
    list: protectedProcedure
      .input(z.object({ department: z.string().optional(), category: z.string().optional() }))
      .query(async ({ input }) => {
        return getProcesses(input.department, input.category);
      }),

    byId: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getProcessById(input.id);
      }),

    confirmRead: protectedProcedure
      .input(z.object({ processId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await confirmProcessRead(input.processId, ctx.user.id);
        return { success: true };
      }),

    readStatus: protectedProcedure
      .input(z.object({ processId: z.number() }))
      .query(async ({ ctx, input }) => {
        const role = ctx.user.role;
        if (role !== "admin") {
          throw new Error("Acces interzis");
        }
        return getProcessReadStatus(input.processId);
      }),
  }),

  // ─── PROPOSALS ───────────────────────────────────────────────────────────
  proposals: router({
    list: protectedProcedure
      .input(z.object({ status: z.string().optional() }))
      .query(async ({ input }) => {
        return getProposals(input.status);
      }),

    byId: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getProposalById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        benefits: z.string().optional(),
        departments: z.array(z.string()).optional(),
        isAnonymous: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, "0");
        const rand = Math.floor(Math.random() * 9000) + 1000;
        const referenceNumber = `IC-${year}-${month}-${rand}`;
        const id = await createProposal({
          ...input,
          authorId: ctx.user.id,
          referenceNumber,
        });
        return { success: true, id, referenceNumber };
      }),

    vote: protectedProcedure
      .input(z.object({ proposalId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const voted = await voteProposal(input.proposalId, ctx.user.id);
        return { success: true, voted };
      }),
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
    }),
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

    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
        department: z.string().optional(),
        jobTitle: z.string().optional(),
        avatarUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateUser(ctx.user.id, input);
        return { success: true };
      }),
  }),
  // ─── LEAVE REQUESTS (Cereri Concediu) ───────────────────────────────────────────────
  leave: router({
    create: protectedProcedure
      .input(z.object({
        type: z.enum(["concediu_odihna", "concediu_medical", "concediu_fara_plata", "liber_legal", "recuperare", "alt"]),
        startDate: z.string(), // "YYYY-MM-DD"
        endDate: z.string(),
        totalDays: z.number().min(1),
        reason: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await createLeaveRequest({
          userId: ctx.user.id,
          type: input.type,
          startDate: input.startDate as unknown as Date,
          endDate: input.endDate as unknown as Date,
          totalDays: input.totalDays,
          reason: input.reason,
        });
        return { success: true };
      }),

    myRequests: protectedProcedure.query(async ({ ctx }) => {
      return getLeaveRequestsByUser(ctx.user.id);
    }),

    allRequests: protectedProcedure
      .input(z.object({ status: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        const role = ctx.user.role;
        if (role !== "admin") throw new Error("Acces interzis");
        return getAllLeaveRequests(input.status);
      }),

    review: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["aprobata", "respinsa"]),
        reviewNote: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const role = ctx.user.role;
        if (role !== "admin") throw new Error("Acces interzis");
        await reviewLeaveRequest(input.id, ctx.user.id, input.status, input.reviewNote);
        return { success: true };
      }),

    cancel: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const req = await getLeaveRequestById(input.id);
        if (!req || req.userId !== ctx.user.id) throw new Error("Cerere negăsită");
        if (req.status !== "in_asteptare") throw new Error("Cererea nu mai poate fi anulată");
        await cancelLeaveRequest(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ─── ADMIN USERS ─────────────────────────────────────────────────────────────────
  adminUsers: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const role = ctx.user.role;
      if (role !== "admin") throw new Error("Acces interzis");
      return getAllUsersAdmin();
    }),

    updateRole: protectedProcedure
      .input(z.object({
        id: z.number(),
        role: z.enum(["admin", "coordonator", "angajat", "colaborator"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const role = ctx.user.role;
        if (role !== "admin") throw new Error("Acces interzis");
        await updateUserRole(input.id, input.role);
        return { success: true };
      }),

    toggleActive: protectedProcedure
      .input(z.object({ id: z.number(), isActive: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        const role = ctx.user.role;
        if (role !== "admin") throw new Error("Acces interzis");
        await updateUserActive(input.id, input.isActive);
        return { success: true };
      }),

    updateProfile: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        department: z.string().optional(),
        jobTitle: z.string().optional(),
        phone: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const role = ctx.user.role;
        if (role !== "admin") throw new Error("Acces interzis");
        const { id, ...data } = input;
        await updateUserProfile(id, data);
        return { success: true };
      }),

    deleteUser: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Acces interzis");
        if (ctx.user.id === input.id) throw new Error("Nu ți poți șterge propriul cont");
        await deleteUserCompletely(input.id);
        return { success: true };
      }),

    reorderUsers: protectedProcedure
      .input(z.object({
        orderList: z.array(z.object({ userId: z.number(), displayOrder: z.number() })),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Acces interzis");
        await updateUsersDisplayOrder(input.orderList);
        return { success: true };
      }),
  }),

  // ─── HR DASHBOARD ─────────────────────────────────────────────────────────────────
  hrDashboard: router({
    stats: protectedProcedure
      .input(z.object({ year: z.number(), month: z.number() }))
      .query(async ({ ctx, input }) => {
        const role = ctx.user.role;
        if (role !== "admin") throw new Error("Acces interzis");
        return getHRDashboardStats(input.year, input.month);
      }),
  }),
  // ─── PROFIL EXTINS ────────────────────────────────────────────────────────────────────────────────────────
  profile: router({
    getMyProfile: protectedProcedure.query(async ({ ctx }) => {
      return getFullProfile(ctx.user.id);
    }),

    adminGetProfile: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin" && ctx.user.id !== input.userId)
          throw new Error("Acces interzis");
        return getFullProfile(input.userId);
      }),

    // Any authenticated user can view basic info of a colleague
    viewColleague: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ ctx, input }) => {
        const full = await getFullProfile(input.userId);
        if (!full) return null;
        // Admin sees everything
        if (ctx.user.role === "admin") return { ...full, isFullAccess: true };
        // Others see only basic info
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
          isFullAccess: false,
        };
      }),

    updateMyProfile: protectedProcedure
      .input(z.object({
        name: z.string().min(1).optional(),
        phone: z.string().optional().nullable(),
        phoneMobile: z.string().optional().nullable(),
        department: z.string().optional().nullable(),
        jobTitle: z.string().optional().nullable(),
        birthDate: z.string().optional().nullable(),
        hireDate: z.string().optional().nullable(),
        addressBuletin: z.string().optional().nullable(),
        addressSecondary: z.string().optional().nullable(),
        city: z.string().optional().nullable(),
        cnp: z.string().max(13).optional().nullable(),
        ciSeries: z.string().max(4).optional().nullable(),
        ciNumber: z.string().max(10).optional().nullable(),
        ciExpiry: z.string().optional().nullable(),
        ciIssuedBy: z.string().optional().nullable(),
        iban: z.string().max(34).optional().nullable(),
        bankName: z.string().optional().nullable(),
        emergencyContact: z.string().optional().nullable(),
        emergencyPhone: z.string().optional().nullable(),
        emergencyRelation: z.string().optional().nullable(),
        bloodType: z.enum(["A+","A-","B+","B-","AB+","AB-","O+","O-"]).optional().nullable(),
        allergies: z.string().optional().nullable(),
        profileNotes: z.string().optional().nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        return updateFullProfile(ctx.user.id, input);
      }),

    adminUpdateProfile: protectedProcedure
      .input(z.object({
        userId: z.number(),
        name: z.string().min(1).optional(),
        phone: z.string().optional().nullable(),
        phoneMobile: z.string().optional().nullable(),
        department: z.string().optional().nullable(),
        jobTitle: z.string().optional().nullable(),
        birthDate: z.string().optional().nullable(),
        hireDate: z.string().optional().nullable(),
        addressBuletin: z.string().optional().nullable(),
        addressSecondary: z.string().optional().nullable(),
        city: z.string().optional().nullable(),
        cnp: z.string().max(13).optional().nullable(),
        ciSeries: z.string().max(4).optional().nullable(),
        ciNumber: z.string().max(10).optional().nullable(),
        ciExpiry: z.string().optional().nullable(),
        ciIssuedBy: z.string().optional().nullable(),
        iban: z.string().max(34).optional().nullable(),
        bankName: z.string().optional().nullable(),
        emergencyContact: z.string().optional().nullable(),
        emergencyPhone: z.string().optional().nullable(),
        emergencyRelation: z.string().optional().nullable(),
        bloodType: z.enum(["A+","A-","B+","B-","AB+","AB-","O+","O-"]).optional().nullable(),
        allergies: z.string().optional().nullable(),
        profileNotes: z.string().optional().nullable(),
        workHoursPerDay: z.string().optional().nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Acces interzis");
        const { userId, ...data } = input;
        return updateFullProfile(userId, data);
      }),
  }),
   people: peopleRouter,

  // ─── COMPANY EVENTS ──────────────────────────────────────────────────────────────────
  companyEvents: router({
    list: protectedProcedure
      .input(z.object({ dateFrom: z.string(), dateTo: z.string() }))
      .query(async ({ input }) => {
        return getCompanyEvents(input.dateFrom, input.dateTo);
      }),

    listAll: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") throw new Error("Acces interzis");
        return getAllCompanyEvents();
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        link: z.string().optional(),
        startTime: z.string(), // ISO string
        endTime: z.string(),
        isRecurring: z.boolean().optional(),
        recurringRule: z.string().optional(),
        recurringUntil: z.string().optional().nullable(),
        color: z.string().optional(),
        targetType: z.enum(["all", "department", "users"]).default("all"),
        targetDepartment: z.string().optional(),
        targetUserIds: z.array(z.number()).optional(),
        activityType: z.enum(["proiectare", "consultanta", "sedinta", "documentare", "deplasare", "administrativ", "verificare", "executie"]).optional(),
        projectId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") throw new Error("Acces interzis — doar adminii și coordonatorii pot crea evenimente");
        return createCompanyEvent({
          ...input,
          startTime: new Date(input.startTime),
          endTime: new Date(input.endTime),
          createdBy: ctx.user.id,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        link: z.string().optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        isRecurring: z.boolean().optional(),
        recurringRule: z.string().optional(),
        recurringUntil: z.string().optional().nullable(),
        color: z.string().optional(),
        targetType: z.enum(["all", "department", "users"]).optional(),
        targetDepartment: z.string().optional(),
        targetUserIds: z.array(z.number()).optional(),
        activityType: z.enum(["proiectare", "consultanta", "sedinta", "documentare", "deplasare", "administrativ", "verificare", "executie"]).optional(),
        projectId: z.number().optional().nullable(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") throw new Error("Acces interzis");
        const { id, startTime, endTime, ...rest } = input;
        const { recurringUntil: ru, ...restClean } = rest;
        return updateCompanyEvent(id, {
          ...restClean,
          ...(ru != null ? { recurringUntil: ru } : {}),
          ...(startTime ? { startTime: new Date(startTime) } : {}),
          ...(endTime ? { endTime: new Date(endTime) } : {}),
        } as any);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") throw new Error("Acces interzis");
        return deleteCompanyEvent(input.id);
      }),
  }),

  // ─── PROCESS OVERVIEW (calendar echipă) ──────────────────────────────────────────
  processOverview: router({
    getData: protectedProcedure
      .input(z.object({
        dateFrom: z.string(),
        dateTo: z.string(),
      }))
      .query(async ({ input }) => {
        return getProcessOverview(input.dateFrom, input.dateTo);
      }),
  }),
  // ─── GOOGLE CALENDAR ─────────────────────────────────────────────────────────
  googleCalendar: router({
    // Check if user has connected Google Calendar
    status: protectedProcedure.query(async ({ ctx }) => {
      const connected = await hasGoogleCalendarConnected(ctx.user.id);
      return { connected };
    }),

    // Get OAuth URL to connect Google Calendar
    getAuthUrl: protectedProcedure
      .input(z.object({ origin: z.string() }))
      .query(async ({ ctx, input }) => {
        const redirectUri = `${input.origin}/api/oauth/google-calendar/callback`;
        const state = Buffer.from(JSON.stringify({ userId: ctx.user.id, origin: input.origin })).toString("base64");
        const url = getGoogleCalendarAuthUrl(redirectUri, state);
        return { url };
      }),

    // Fetch events from Google Calendar for a date range
    getEvents: protectedProcedure
      .input(z.object({ dateFrom: z.string(), dateTo: z.string() }))
      .query(async ({ ctx }) => {
        const accessToken = await getValidAccessToken(ctx.user.id);
        if (!accessToken) return { events: [], connected: false };
        // Return empty for now - will be populated after OAuth
        return { events: [], connected: true };
      }),

    // Sync time entry to Google Calendar (create/update event)
    syncTimeEntry: protectedProcedure
      .input(z.object({
        timeEntryId: z.number(),
        title: z.string(),
        startTime: z.string(),
        endTime: z.string(),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const accessToken = await getValidAccessToken(ctx.user.id);
        if (!accessToken) return { success: false, reason: "not_connected" };

        const existing = await getSyncMapByTimeEntry(ctx.user.id, input.timeEntryId);
        const eventPayload = {
          summary: input.title,
          description: input.description,
          start: { dateTime: input.startTime },
          end: { dateTime: input.endTime },
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
    deleteSyncedEvent: protectedProcedure
      .input(z.object({ timeEntryId: z.number() }))
      .mutation(async ({ ctx, input }) => {
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
    importTodayEvents: protectedProcedure
      .input(z.object({ date: z.string(), dateTo: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        const accessToken = await getValidAccessToken(ctx.user.id);
        if (!accessToken) return { events: [], connected: false };

        const dayStart = new Date(input.date);
        dayStart.setHours(0, 0, 0, 0);
        // If dateTo is provided, use end of that day; otherwise end of dateFrom day
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
            events: events
              .filter(e => e.start.dateTime) // only timed events, not all-day
              .map(e => ({
                id: e.id,
                title: e.summary ?? "(fără titlu)",
                startTime: e.start.dateTime!,
                endTime: e.end.dateTime!,
                htmlLink: e.htmlLink,
              })),
          };
        } catch {
          return { events: [], connected: false };
        }
      }),
  }),
});
export type AppRouter = typeof appRouter;
