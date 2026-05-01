import { describe, it, expect, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB (same pattern as portal.test.ts) ──────────────────────────────
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    listProjects: vi.fn().mockResolvedValue([
      { id: 1, name: "Proiect Test", status: "activ", code: "PT", color: "#FFCB09", clientName: "Client SRL" },
    ]),
    getProjectById: vi.fn().mockResolvedValue({ id: 1, name: "Proiect Test", status: "activ" }),
    createProject: vi.fn().mockResolvedValue({ id: 2, name: "Proiect Nou", status: "activ" }),
    updateProject: vi.fn().mockResolvedValue({ id: 1, name: "Proiect Updated" }),
    deleteProject: vi.fn().mockResolvedValue({ success: true }),
    getProjectDetail: vi.fn().mockResolvedValue({ id: 1, name: "Proiect Test", status: "activ" }),
    createProjectFromTemplate: vi.fn().mockResolvedValue({ id: 3, name: "Din Template" }),
    getProjectPhases: vi.fn().mockResolvedValue([
      { id: 10, projectId: 1, name: "Faza A", code: "A", status: "activa", budgetHours: "40" },
    ]),
    createPhase: vi.fn().mockResolvedValue({ id: 11, name: "Faza Noua" }),
    updatePhase: vi.fn().mockResolvedValue({ id: 10, name: "Faza A Updated" }),
    deletePhase: vi.fn().mockResolvedValue({ success: true }),
    getTasksByProject: vi.fn().mockResolvedValue([]),
    getTasksByPhase: vi.fn().mockResolvedValue([
      { id: 100, phaseId: 10, name: "Sarcina 1", status: "neinceputa", workedMinutes: 0 },
    ]),
    createTask: vi.fn().mockResolvedValue({ id: 101, name: "Sarcina Noua" }),
    updateTask: vi.fn().mockResolvedValue({ id: 100, status: "in_lucru" }),
    deleteTask: vi.fn().mockResolvedValue({ success: true }),
    getProjectMembers: vi.fn().mockResolvedValue([
      { userId: 1, name: "Ion Popescu", projectRole: "coordonator" },
    ]),
    addProjectMember: vi.fn().mockResolvedValue({ id: 1 }),
    removeProjectMember: vi.fn().mockResolvedValue({ success: true }),
    updateProjectMemberRole: vi.fn().mockResolvedValue({ id: 1 }),
    getActiveSession: vi.fn().mockResolvedValue(null),
    startTaskSession: vi.fn().mockResolvedValue({ id: 200, status: "activa", taskId: 100 }),
    pauseTaskSession: vi.fn().mockResolvedValue({ id: 200, status: "pauza" }),
    resumeTaskSession: vi.fn().mockResolvedValue({ id: 200, status: "activa" }),
    stopTaskSession: vi.fn().mockResolvedValue({ id: 200, status: "finalizata" }),
    getSessionsForTask: vi.fn().mockResolvedValue([]),
    getHourBankForUser: vi.fn().mockResolvedValue([]),
    getHourBankAll: vi.fn().mockResolvedValue([]),
    createHourRequest: vi.fn().mockResolvedValue({ id: 300 }),
    getHourRequestsForProject: vi.fn().mockResolvedValue([]),
    getMyHourRequests: vi.fn().mockResolvedValue([]),
    reviewHourRequest: vi.fn().mockResolvedValue({ id: 300, status: "aprobata" }),
    getDefaultTemplate: vi.fn().mockResolvedValue(null),
    listTemplates: vi.fn().mockResolvedValue([]),
  };
});

// ─── Context helpers ───────────────────────────────────────────────────────
function makeAdminCtx(): TrpcContext {
  return {
    user: { id: 1, email: "admin@test.ro", name: "Admin Test", role: "admin", openId: "admin-oid" },
  } as any;
}

function makeCoordCtx(): TrpcContext {
  return {
    user: { id: 2, email: "coord@test.ro", name: "Coord Test", role: "coordonator", openId: "coord-oid" },
  } as any;
}

function makeUserCtx(): TrpcContext {
  return {
    user: { id: 3, email: "user@test.ro", name: "User Test", role: "user", openId: "user-oid" },
  } as any;
}

function makeGuestCtx(): TrpcContext {
  return { user: null } as any;
}

// ─── PROJECT CRUD ──────────────────────────────────────────────────────────
describe("projects.list", () => {
  it("requires authentication", async () => {
    const caller = appRouter.createCaller(makeGuestCtx());
    await expect(caller.projects.list({})).rejects.toThrow();
  });

  it("returns array for authenticated users", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.projects.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("accepts status filter", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.projects.list({ status: "activ" });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("projects.get", () => {
  it("requires authentication", async () => {
    const caller = appRouter.createCaller(makeGuestCtx());
    await expect(caller.projects.get({ id: 1 })).rejects.toThrow();
  });

  it("returns project details for authenticated user", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.projects.get({ id: 1 });
    expect(result).toBeDefined();
    expect(result?.name).toBe("Proiect Test");
  });
});

describe("projects.create", () => {
  it("requires authentication", async () => {
    const caller = appRouter.createCaller(makeGuestCtx());
    await expect(caller.projects.create({ name: "Test" })).rejects.toThrow();
  });

  it("rejects creation for regular users", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(caller.projects.create({ name: "Test" })).rejects.toThrow();
  });

  it("allows admin to create project", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.projects.create({
      name: "Proiect Nou",
      code: "PN",
      status: "activ",
    });
    expect(result).toBeDefined();
    expect(result.id).toBeTypeOf("number");
  });

  it("allows coordonator to create project", async () => {
    const caller = appRouter.createCaller(makeCoordCtx());
    const result = await caller.projects.create({ name: "Proiect Coord" });
    expect(result).toBeDefined();
  });
});

describe("projects.update", () => {
  it("rejects update for regular users", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(caller.projects.update({ id: 1, name: "Updated" })).rejects.toThrow();
  });

  it("allows admin to update project", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.projects.update({ id: 1, name: "Updated", status: "suspendat" });
    expect(result).toBeDefined();
  });
});

describe("projects.delete", () => {
  it("rejects deletion for coordonator", async () => {
    const caller = appRouter.createCaller(makeCoordCtx());
    await expect(caller.projects.delete({ id: 1, confirmName: "Proiect Test" })).rejects.toThrow();
  });

  it("rejects deletion with wrong name", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    // Mock getProjectById returns { name: "Proiect Test" }
    await expect(caller.projects.delete({ id: 1, confirmName: "Wrong Name" })).rejects.toThrow();
  });

  it("allows admin to delete with correct name", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.projects.delete({ id: 1, confirmName: "Proiect Test" });
    expect(result).toBeDefined();
  });
});

// ─── PHASES ────────────────────────────────────────────────────────────────
describe("projects.phases", () => {
  it("requires authentication", async () => {
    const caller = appRouter.createCaller(makeGuestCtx());
    await expect(caller.projects.phases({ projectId: 1 })).rejects.toThrow();
  });

  it("returns phases array", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.projects.phases({ projectId: 1 });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("projects.addPhase", () => {
  it("rejects for regular users", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(caller.projects.addPhase({ projectId: 1, name: "Faza B" })).rejects.toThrow();
  });

  it("allows admin to add phase", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.projects.addPhase({
      projectId: 1,
      name: "Faza B",
      code: "B",
      budgetHours: "20",
    });
    expect(result).toBeDefined();
    expect(result.id).toBeTypeOf("number");
  });
});

describe("projects.updatePhase", () => {
  it("allows admin to update phase", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.projects.updatePhase({ id: 10, name: "Faza A Updated", status: "activa" });
    expect(result).toBeDefined();
  });
});

describe("projects.deletePhase", () => {
  it("rejects for regular users", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(caller.projects.deletePhase({ id: 10 })).rejects.toThrow();
  });

  it("allows admin to delete phase", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.projects.deletePhase({ id: 10 });
    expect(result).toBeDefined();
  });
});

// ─── TASKS ─────────────────────────────────────────────────────────────────
describe("projects.tasksByPhase", () => {
  it("returns tasks array", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.projects.tasksByPhase({ phaseId: 10 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("projects.addTask", () => {
  it("rejects for regular users", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(caller.projects.addTask({ phaseId: 10, projectId: 1, name: "Task" })).rejects.toThrow();
  });

  it("allows admin to add task", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.projects.addTask({
      phaseId: 10,
      projectId: 1,
      name: "Sarcina Noua",
      budgetHours: "8",
    });
    expect(result).toBeDefined();
  });
});

describe("projects.updateTask", () => {
  it("allows admin to update task status", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.projects.updateTask({ id: 100, status: "in_lucru" as any });
    expect(result).toBeDefined();
  });
});

describe("projects.deleteTask", () => {
  it("allows admin to delete task", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.projects.deleteTask({ id: 100 });
    expect(result).toBeDefined();
  });
});

// ─── MEMBERS ───────────────────────────────────────────────────────────────
describe("projects.members", () => {
  it("returns members array", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.projects.members({ projectId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("projects.addMember", () => {
  it("rejects for regular users", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(caller.projects.addMember({ projectId: 1, userId: 5, projectRole: "membru" })).rejects.toThrow();
  });

  it("allows admin to add member", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.projects.addMember({ projectId: 1, userId: 5, projectRole: "membru" });
    expect(result).toBeDefined();
  });
});

describe("projects.removeMember", () => {
  it("allows admin to remove member", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.projects.removeMember({ projectId: 1, userId: 5 });
    expect(result).toBeDefined();
  });
});

// ─── SESSIONS ──────────────────────────────────────────────────────────────
describe("projects.activeSession", () => {
  it("returns null when no active session", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.projects.activeSession();
    expect(result).toBeNull();
  });
});

describe("projects.startSession", () => {
  it("starts a session for a task", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.projects.startSession({ taskId: 100, projectId: 1 });
    expect(result).toBeDefined();
    expect((result as any).status).toBe("activa");
  });
});

describe("projects.pauseSession", () => {
  it("pauses a session", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.projects.pauseSession({ sessionId: 200 });
    expect(result).toBeDefined();
  });
});

describe("projects.stopSession", () => {
  it("stops a session", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.projects.stopSession({ sessionId: 200 });
    expect(result).toBeDefined();
  });
});

// ─── HOUR BANK ─────────────────────────────────────────────────────────────
describe("projects.myHourBank", () => {
  it("returns hour bank for user", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.projects.myHourBank(undefined);
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("projects.hourBankAll", () => {
  it("rejects for regular users", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(caller.projects.hourBankAll(undefined)).rejects.toThrow();
  });

  it("returns all hour bank entries for admin", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.projects.hourBankAll(undefined);
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("projects.requestMoreHours", () => {
  it("allows any authenticated user to request hours", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    const result = await caller.projects.requestMoreHours({
      taskId: 100,
      projectId: 1,
      requestedHours: "8",
      justification: "Avem nevoie de mai mult timp pentru această sarcină",
    });
    expect(result).toBeDefined();
  });
});

describe("projects.reviewHourRequest", () => {
  it("rejects for regular users", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(
      caller.projects.reviewHourRequest({ id: 300, status: "aprobata" })
    ).rejects.toThrow();
  });

  it("allows admin to approve hour request", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.projects.reviewHourRequest({ id: 300, status: "aprobata" });
    expect(result).toBeDefined();
  });

  it("allows admin to reject hour request", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.projects.reviewHourRequest({ id: 300, status: "respinsa" });
    expect(result).toBeDefined();
  });
});

// ─── TEMPLATES ─────────────────────────────────────────────────────────────
describe("projects.templates", () => {
  it("returns templates array", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.projects.templates();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("projects.defaultTemplate", () => {
  it("returns null or object", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.projects.defaultTemplate();
    expect(result === null || typeof result === "object").toBe(true);
  });
});
