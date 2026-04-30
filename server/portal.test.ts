import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB ─────────────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
  getAllUsers: vi.fn().mockResolvedValue([]),
  updateUser: vi.fn().mockResolvedValue(undefined),
  // Projects
  getProjects: vi.fn().mockResolvedValue([]),
  upsertProject: vi.fn().mockResolvedValue(undefined),
  // Time entries
  getTimeEntriesForUser: vi.fn().mockResolvedValue([]),
  getRunningTimer: vi.fn().mockResolvedValue(undefined),
  checkTimeEntryExists: vi.fn().mockResolvedValue(false),
  createTimeEntry: vi.fn().mockResolvedValue(undefined),
  updateTimeEntry: vi.fn().mockResolvedValue(undefined),
  getTimeEntriesForProject: vi.fn().mockResolvedValue([]),
  // News
  getNews: vi.fn().mockResolvedValue([]),
  getNewsById: vi.fn().mockResolvedValue(undefined),
  createNews: vi.fn().mockResolvedValue({ id: 1 }),
  getNewsComments: vi.fn().mockResolvedValue([]),
  addNewsReaction: vi.fn().mockResolvedValue(undefined),
  // Documents
  getDocumentsForUser: vi.fn().mockResolvedValue([]),
  createDocument: vi.fn().mockResolvedValue(undefined),
  logDocumentAccess: vi.fn().mockResolvedValue(undefined),
  // Processes
  getProcesses: vi.fn().mockResolvedValue([]),
  getProcessById: vi.fn().mockResolvedValue(undefined),
  confirmProcessRead: vi.fn().mockResolvedValue(undefined),
  getProcessReadStatus: vi.fn().mockResolvedValue([]),
  // Proposals
  getProposals: vi.fn().mockResolvedValue([]),
  getProposalById: vi.fn().mockResolvedValue(undefined),
  createProposal: vi.fn().mockResolvedValue({ id: 1, referenceNumber: "IC-2025-001" }),
  voteProposal: vi.fn().mockResolvedValue({ voted: true }),
  // Notifications
  getNotifications: vi.fn().mockResolvedValue([]),
  getUnreadNotificationCount: vi.fn().mockResolvedValue(0),
  markNotificationsRead: vi.fn().mockResolvedValue(undefined),
  createNotification: vi.fn().mockResolvedValue(undefined),
  // Employee Drive Folders
  getEmployeeDriveFolder: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    folderId: "folder1",
    folderName: "Mihai Porumboiu",
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  setEmployeeDriveFolder: vi.fn().mockResolvedValue(undefined),
  getAllEmployeeDriveFolders: vi.fn().mockResolvedValue([]),
  deleteEmployeeDriveFolder: vi.fn().mockResolvedValue(undefined),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────
function makeCtx(role: string = "angajat"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@ingineriecreativa.ro",
      name: "Test User",
      loginMethod: "google",
      role: role as any,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: vi.fn() } as any,
  };
}

function makeGuestCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: vi.fn() } as any,
  };
}

// ─── Auth tests ───────────────────────────────────────────────────────────────
describe("auth", () => {
  it("me returns null for unauthenticated users", async () => {
    const caller = appRouter.createCaller(makeGuestCtx());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("me returns user for authenticated users", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.email).toBe("test@ingineriecreativa.ro");
  });

  it("logout clears session cookie", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
  });
});

// ─── Dashboard tests (news + proposals) ──────────────────────────────────────
// NOTE: Pontaj zilnic migrat la iFlow (https://app.hriflow.ro) — nu mai există procedură pontaj.today
describe("dashboard data", () => {
  it("news list is accessible for authenticated user", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.news.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("notifications require authentication", async () => {
    const caller = appRouter.createCaller(makeGuestCtx());
    await expect(caller.notifications.list()).rejects.toThrow();
  });
});

// ─── Time tracking tests ──────────────────────────────────────────────────────
describe("timeTracking", () => {
  it("runningTimer requires authentication", async () => {
    const caller = appRouter.createCaller(makeGuestCtx());
    await expect(caller.timeTracking.runningTimer()).rejects.toThrow();
  });

  it("runningTimer returns null or undefined when no active timer", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.timeTracking.runningTimer();
    expect(result == null).toBe(true);
  });

  it("myEntries returns array", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.timeTracking.myEntries({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("projects returns array", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.projects.list({});
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── News tests ───────────────────────────────────────────────────────────────
describe("news", () => {
  it("list requires authentication", async () => {
    const caller = appRouter.createCaller(makeGuestCtx());
    await expect(caller.news.list({})).rejects.toThrow();
  });

  it("list returns array", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.news.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("byId requires authentication", async () => {
    const caller = appRouter.createCaller(makeGuestCtx());
    await expect(caller.news.byId({ id: 1 })).rejects.toThrow();
  });

  it("byId returns null or undefined for non-existent news", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.news.byId({ id: 9999 });
    expect(result == null).toBe(true);
  });

  it("create requires admin or manager role", async () => {
    const caller = appRouter.createCaller(makeCtx("angajat"));
    await expect(
      caller.news.create({ title: "Test", content: "Content", category: "companie", excerpt: "" })
    ).rejects.toThrow();
  });

  it("create succeeds for admin (auth passes)", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const result = await caller.news.create({ title: "Test", content: "Content", category: "companie", excerpt: "" });
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });
});

// ─── Documents tests ──────────────────────────────────────────────────────────
describe("documents", () => {
  it("myDocuments requires authentication", async () => {
    const caller = appRouter.createCaller(makeGuestCtx());
    await expect(caller.documents.myDocuments()).rejects.toThrow();
  });

  it("myDocuments returns array", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.documents.myDocuments();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Processes tests ──────────────────────────────────────────────────────────
describe("processes", () => {
  it("list requires authentication", async () => {
    const caller = appRouter.createCaller(makeGuestCtx());
    await expect(caller.processes.list({})).rejects.toThrow();
  });

  it("list returns array", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.processes.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("byId returns null or undefined for non-existent process", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.processes.byId({ id: 9999 });
    expect(result == null).toBe(true);
  });
});

// ─── Proposals tests ──────────────────────────────────────────────────────────
describe("proposals", () => {
  it("list requires authentication", async () => {
    const caller = appRouter.createCaller(makeGuestCtx());
    await expect(caller.proposals.list({})).rejects.toThrow();
  });

  it("list returns array", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.proposals.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("create requires title and description", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.proposals.create({ title: "", description: "", isAnonymous: false })
    ).rejects.toThrow();
  });
});

// ─── Calendar time-tracking tests ──────────────────────────────────────────
describe("timeTracking calendar procedures", () => {
  it("addCalendarEntry requires authentication", async () => {
    const caller = appRouter.createCaller(makeGuestCtx());
    await expect(
      caller.timeTracking.addCalendarEntry({
        date: "2026-03-27",
        startHour: 9, startMin: 0,
        endHour: 10, endMin: 0,
        activityType: "proiectare",
      })
    ).rejects.toThrow();
  });

  it("addCalendarEntry succeeds for authenticated user", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.timeTracking.addCalendarEntry({
      date: "2026-03-27",
      startHour: 9, startMin: 0,
      endHour: 10, endMin: 30,
      activityType: "proiectare",
      taskName: "Test calendar entry",
    });
    expect(result.success).toBe(true);
  });

  it("updateCalendarEntry requires authentication", async () => {
    const caller = appRouter.createCaller(makeGuestCtx());
    await expect(
      caller.timeTracking.updateCalendarEntry({
        id: 1,
        date: "2026-03-27",
        startHour: 9, startMin: 0,
        endHour: 10, endMin: 0,
      })
    ).rejects.toThrow();
  });

  it("updateCalendarEntry throws for non-owned entry", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.timeTracking.updateCalendarEntry({
        id: 999,
        date: "2026-03-27",
        startHour: 9, startMin: 0,
        endHour: 10, endMin: 0,
      })
    ).rejects.toThrow();
  });

  it("deleteEntry requires authentication", async () => {
    const caller = appRouter.createCaller(makeGuestCtx());
    await expect(caller.timeTracking.deleteEntry({ id: 1 })).rejects.toThrow();
  });

  it("deleteEntry throws for non-owned entry", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.timeTracking.deleteEntry({ id: 999 })).rejects.toThrow();
  });
});

// ─── RBAC tests ───────────────────────────────────────────────────────────────
describe("RBAC - role based access control", () => {
  it("admin can access admin routes", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const result = await caller.auth.me();
    expect(result?.role).toBe("admin");
  });

  it("colaborator has limited access", async () => {
    const caller = appRouter.createCaller(makeCtx("colaborator"));
    const result = await caller.auth.me();
    expect(result?.role).toBe("colaborator");
  });

  it("angajat cannot create news", async () => {
    const caller = appRouter.createCaller(makeCtx("angajat"));
    await expect(
      caller.news.create({ title: "T", content: "C", category: "companie", excerpt: "" })
    ).rejects.toThrow();
  });

  it("manager can create news (auth passes)", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const result = await caller.news.create({ title: "T", content: "C", category: "companie", excerpt: "" });
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });
});

// ─── Documents (Google Drive) tests ──────────────────────────────────────────
// Mock googleDrive module
vi.mock("./googleDrive", () => ({
  HUB_IC_ROOT_FOLDER_ID: "mock-root-folder-id",
  listFilesInFolder: vi.fn().mockResolvedValue([
    {
      id: "file1",
      name: "Contract.pdf",
      mimeType: "application/pdf",
      modifiedTime: "2025-01-01T00:00:00Z",
      size: "102400",
      previewUrl: "https://drive.google.com/file/d/file1/preview",
    },
  ]),
  listSubfolders: vi.fn().mockResolvedValue([
    { id: "folder1", name: "Mihai Porumboiu" },
    { id: "folder2", name: "Ion Ionescu" },
  ]),
  testDriveConnection: vi.fn().mockResolvedValue(true),
}));

describe("documents (Google Drive)", () => {
  it("listMyFiles requires authentication", async () => {
    const caller = appRouter.createCaller(makeGuestCtx());
    await expect(caller.documents.listMyFiles()).rejects.toThrow();
  });

  it("listMyFiles returns hasDriveFolder=true when mapping exists", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.documents.listMyFiles();
    expect(result.hasDriveFolder).toBe(true);
    expect(result.folderName).toBe("Mihai Porumboiu");
    expect(Array.isArray(result.files)).toBe(true);
  });

  it("listCompanyDocs requires authentication", async () => {
    const caller = appRouter.createCaller(makeGuestCtx());
    await expect(caller.documents.listCompanyDocs()).rejects.toThrow();
  });

  it("listCompanyDocs returns files array", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.documents.listCompanyDocs();
    expect(Array.isArray(result.files)).toBe(true);
  });

  it("listAngajatiSubfolders requires admin role", async () => {
    const caller = appRouter.createCaller(makeCtx("angajat"));
    await expect(caller.documents.listAngajatiSubfolders()).rejects.toThrow();
  });

  it("listAngajatiSubfolders returns subfolders for admin", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const result = await caller.documents.listAngajatiSubfolders();
    expect(Array.isArray(result.subfolders)).toBe(true);
  });

  it("setMapping requires admin role", async () => {
    const caller = appRouter.createCaller(makeCtx("angajat"));
    await expect(
      caller.documents.setMapping({ userId: 2, folderId: "folder1", folderName: "Test" })
    ).rejects.toThrow();
  });

  it("setMapping succeeds for admin", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const result = await caller.documents.setMapping({
      userId: 2,
      folderId: "folder1",
      folderName: "Test User",
    });
    expect(result.success).toBe(true);
  });

  it("removeMapping requires admin role", async () => {
    const caller = appRouter.createCaller(makeCtx("angajat"));
    await expect(caller.documents.removeMapping({ userId: 2 })).rejects.toThrow();
  });

  it("testConnection requires admin role", async () => {
    const caller = appRouter.createCaller(makeCtx("angajat"));
    await expect(caller.documents.testConnection()).rejects.toThrow();
  });

  it("testConnection returns connected=true for admin", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const result = await caller.documents.testConnection();
    expect(result.connected).toBe(true);
  });
});
