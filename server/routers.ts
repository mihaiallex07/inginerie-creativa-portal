import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
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
  getHRDashboardStats,
  getFullProfile,
  updateFullProfile,
  getUpcomingBirthdays,
  getOrgChartData,
} from "./db";

// ─── PEOPLE (BIRTHDAYS + ORG CHART) ────────────────────────────────────────
const peopleRouter = router({
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

export const appRouter = router({
  system: systemRouter,

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
        driveId: z.string().optional(),
        status: z.enum(["activ", "suspendat", "finalizat", "intern"]).optional(),
        clientName: z.string().optional(),
        estimatedHours: z.string().optional(),
        description: z.string().optional(),
        color: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const role = ctx.user.role;
        if (role !== "admin") {
          throw new Error("Acces interzis");
        }
        await upsertProject({ ...input, managerId: ctx.user.id });
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
        role: z.enum(["admin", "angajat", "colaborator"]),
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
        hireDate: z.string().optional().nullable(),
        profileNotes: z.string().optional().nullable(),
        department: z.string().optional().nullable(),
        jobTitle: z.string().optional().nullable(),
        workHoursPerDay: z.string().optional().nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Acces interzis");
        const { userId, ...data } = input;
        return updateFullProfile(userId, data);
      }),
  }),
  people: peopleRouter,
});

export type AppRouter = typeof appRouter;
