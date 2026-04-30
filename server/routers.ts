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
  getUpcomingAnniversaries,
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
  checkTimeEntryExists,
  getRecurringActivities,
  createRecurringActivity,
  updateRecurringActivity,
  deleteRecurringActivity,
  getRecurringExceptions,
  upsertRecurringException,
  createActivityInvitation,
  getPendingInvitationsForUser,
  getInvitationsForEntry,
  respondToInvitation,
  getEmployeeDriveFolder,
  setEmployeeDriveFolder,
  getAllEmployeeDriveFolders,
  deleteEmployeeDriveFolder,
} from "./db";
import {
  listFilesInFolder,
  listSubfolders,
  HUB_IC_ROOT_FOLDER_ID,
  testDriveConnection,
  findFolderByName,
} from "./googleDrive";

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
  upcomingAnniversaries: protectedProcedure
    .input(z.object({ daysAhead: z.number().min(1).max(365).default(30) }).optional())
    .query(async ({ input }) => {
      return getUpcomingAnniversaries(input?.daysAhead ?? 30);
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

// ─── RECURRING ACTIVITIES ROUTER ───────────────────────────────────────────
const recurringRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getRecurringActivities(ctx.user.id);
  }),

  create: protectedProcedure
    .input(z.object({
      taskName: z.string().min(1),
      activityType: z.enum(["proiectare","consultanta","sedinta","documentare","deplasare","administrativ","verificare","executie"]),
      projectId: z.number().optional(),
      startHour: z.number().min(0).max(23),
      startMin: z.number().min(0).max(59).default(0),
      durationMinutes: z.number().min(5).max(480),
      countInTime: z.boolean().default(true),
      startDate: z.string(),
      endDate: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return createRecurringActivity({ ...input, userId: ctx.user.id });
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      taskName: z.string().optional(),
      activityType: z.enum(["proiectare","consultanta","sedinta","documentare","deplasare","administrativ","verificare","executie"]).optional(),
      projectId: z.number().optional().nullable(),
      startHour: z.number().optional(),
      startMin: z.number().optional(),
      durationMinutes: z.number().optional(),
      countInTime: z.boolean().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional().nullable(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return updateRecurringActivity(id, ctx.user.id, data as any);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return deleteRecurringActivity(input.id, ctx.user.id);
    }),

  // Get exceptions for a date range (to resolve overrides in the calendar)
  exceptions: protectedProcedure
    .input(z.object({ dateFrom: z.string(), dateTo: z.string() }))
    .query(async ({ ctx, input }) => {
      return getRecurringExceptions(ctx.user.id, input.dateFrom, input.dateTo);
    }),

  // Create/update an exception for a specific day (from drag or edit)
  upsertException: protectedProcedure
    .input(z.object({
      recurringId: z.number(),
      exceptionDate: z.string(),
      overrideStartHour: z.number().optional(),
      overrideStartMin: z.number().optional(),
      overrideDuration: z.number().optional(),
      isDeleted: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return upsertRecurringException({ ...input, userId: ctx.user.id });
    }),
});

// ─── ACTIVITY INVITATIONS ROUTER ─────────────────────────────────────────────
const invitationsRouter = router({
  // Get pending invitations for the current user
  pending: protectedProcedure.query(async ({ ctx }) => {
    return getPendingInvitationsForUser(ctx.user.id);
  }),

  // Get invitation statuses for a specific time entry (host view)
  forEntry: protectedProcedure
    .input(z.object({ timeEntryId: z.number() }))
    .query(async ({ input }) => {
      return getInvitationsForEntry(input.timeEntryId);
    }),

  // Invite a user to a time entry
  invite: protectedProcedure
    .input(z.object({ timeEntryId: z.number(), inviteeUserId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const id = await createActivityInvitation({
        timeEntryId: input.timeEntryId,
        hostUserId: ctx.user.id,
        inviteeUserId: input.inviteeUserId,
      });
      return { id };
    }),

  // Accept or decline an invitation
  respond: protectedProcedure
    .input(z.object({ id: z.number(), accept: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return respondToInvitation(input.id, ctx.user.id, input.accept);
    }),
});

// ─── DOCUMENTS (GOOGLE DRIVE + LEGACY S3) ───────────────────────────────────────────────
const documentsRouter = router({
  // ─ Legacy S3 documents ────────────────────────────────────────────────
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

  // ─ Google Drive documents ───────────────────────────────────────────────
  listMyFiles: protectedProcedure.query(async ({ ctx }) => {
    const mapping = await getEmployeeDriveFolder(ctx.user.id);
    if (!mapping) return { files: [], folderName: null, hasDriveFolder: false };
    const files = await listFilesInFolder(mapping.folderId);
    return { files, folderName: mapping.folderName, hasDriveFolder: true };
  }),

  // Get files from a named subfolder of HUB IC root (e.g. "Regulament intern", "Viziune & Valori")
  listSubfolderFiles: protectedProcedure
    .input(z.object({ subfolderName: z.string() }))
    .query(async ({ input }) => {
      const subfolders = await listSubfolders(HUB_IC_ROOT_FOLDER_ID);
      const target = subfolders.find(f => f.name === input.subfolderName);
      if (!target) return { files: [], folderId: null };
      const files = await listFilesInFolder(target.id);
      return { files, folderId: target.id };
    }),

  // Admin: list all Drive subfolders inside "Angajați" folder for mapping
  listAngajatiSubfolders: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") {
      throw new Error("Acces interzis");
    }
    // Find "Angajați" subfolder in root
    const subfolders = await listSubfolders(HUB_IC_ROOT_FOLDER_ID);
    const angajatiFolder = subfolders.find(f => f.name === "Angajați");
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
    return mappings.map(m => ({
      ...m,
      userName: allUsers.find(u => u.id === m.userId)?.name ?? "Utilizator necunoscut",
    }));
  }),

  // Admin: set folder mapping for an employee
  setMapping: protectedProcedure
    .input(z.object({
      userId: z.number(),
      folderId: z.string(),
      folderName: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "coordonator") {
        throw new Error("Acces interzis");
      }
      await setEmployeeDriveFolder(input.userId, input.folderId, input.folderName);
      return { success: true };
    }),

  // Admin: remove folder mapping
  removeMapping: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
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
      isCustom: !!rootFolderId,
    };
  }),

  // Admin: update HUB IC root folder ID
  updateDriveSettings: protectedProcedure
    .input(z.object({ rootFolderId: z.string().min(10) }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Acces interzis");
      await setAppSetting("drive_hub_ic_root_folder_id", input.rootFolderId, ctx.user.id);
      return { success: true };
    }),

  // Admin: get file count for a specific employee's mapped folder
  getEmployeeFileCount: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
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
    const rootFolderId = (await getAppSetting("drive_hub_ic_root_folder_id")) ?? HUB_IC_ROOT_FOLDER_ID;
    const folder = await findFolderByName(rootFolderId, "Angaja\u021bi");
    return { folderId: folder?.id ?? null, rootFolderId };
  }),
});

export const appRouter = router({
  system: systemRouter,
  settings: settingsRouter,
  recurring: recurringRouter,
  invitations: invitationsRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── PONTAJ (REMOVED — migrat la iFlow)

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
        // Deduplication: skip if entry with same date + taskName + startHour + startMin already exists.
        // Including start time ensures two events with the same title at different hours are both imported.
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
        return { success: true, id, skipped: false };
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

  documents: documentsRouter,

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
  // ─── LEAVE REQUESTS (REMOVED — migrat la iFlow)

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

  // ─── HR DASHBOARD (REMOVED — migrat la iFlow)

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
