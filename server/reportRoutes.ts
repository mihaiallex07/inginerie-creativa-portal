/**
 * reportRoutes.ts — Express endpoints for HR report downloads (Excel + PDF)
 * All routes require authentication and admin/hr role.
 */
import type { Express, Request, Response } from "express";
import { sdk } from "./_core/sdk";
import {
  getPontajLunarAngajat,
  getSumarEchipaLunar,
  getAbsenteLunare,
  getOreSuplimentare,
  getPontajPerProiect,
  getActiveUsers,
  getTimeEntriesForUser,
  getProjects,
} from "./db";
import {
  generatePontajLunarExcel,
  generateSumarEchipaExcel,
  generateAbsenteExcel,
  generateOreSuplimentareExcel,
  generatePontajProiectExcel,
  generatePDF,
  fmtTime,
  fmtDuration,
  fmtDate,
  locationLabel,
} from "./reports";

// Helper: authenticate and check admin/hr role
async function requireHR(req: Request, res: Response): Promise<{ id: number; role: string; name: string | null } | null> {
  try {
    const user = await sdk.authenticateRequest(req);
    const hrRoles = ["admin"] as const;
    if (!user || !hrRoles.includes(user.role as typeof hrRoles[number])) {
      res.status(403).json({ error: "Acces interzis. Necesită rol HR/Admin." });
      return null;
    }
    return user as { id: number; role: string; name: string | null };
  } catch {
    res.status(401).json({ error: "Neautentificat." });
    return null;
  }
}

function parseParams(req: Request): { year: number; month: number; userId?: number } {
  const year = parseInt(req.query.year as string) || new Date().getFullYear();
  const month = parseInt(req.query.month as string) || (new Date().getMonth() + 1);
  const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
  return { year, month, userId };
}

function sanitizeFilename(s: string): string {
  return s.replace(/[^a-zA-Z0-9_\-\.]/g, "_");
}

export function registerReportRoutes(app: Express) {
  // ── 1. Pontaj lunar per angajat — Excel ──────────────────────────────────
  app.get("/api/reports/pontaj-lunar/excel", async (req, res) => {
    const user = await requireHR(req, res);
    if (!user) return;
    const { year, month, userId } = parseParams(req);
    if (!userId) { res.status(400).json({ error: "userId lipsă" }); return; }

    const rows = await getPontajLunarAngajat(userId, year, month);
    const users = await getActiveUsers();
    const emp = users.find(u => u.id === userId);
    const empName = emp?.name ?? `Angajat_${userId}`;

    const buffer = await generatePontajLunarExcel(empName, year, month, rows.map(r => ({
      date: r.date,
      checkIn: r.checkIn,
      checkOut: r.checkOut,
      type: r.type,
      breakMinutes: r.breakMinutes,
      totalMinutes: r.totalMinutes,
      notes: r.notes,
      projectName: r.projectName,
    })));

    const filename = sanitizeFilename(`Pontaj_${empName}_${year}_${String(month).padStart(2, "0")}.xlsx`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(Buffer.from(buffer));
  });

  // ── 1. Pontaj lunar per angajat — PDF ────────────────────────────────────
  app.get("/api/reports/pontaj-lunar/pdf", async (req, res) => {
    const user = await requireHR(req, res);
    if (!user) return;
    const { year, month, userId } = parseParams(req);
    if (!userId) { res.status(400).json({ error: "userId lipsă" }); return; }

    const rows = await getPontajLunarAngajat(userId, year, month);
    const users = await getActiveUsers();
    const emp = users.find(u => u.id === userId);
    const empName = emp?.name ?? `Angajat_${userId}`;

    const totalMin = rows.reduce((a, r) => a + (r.totalMinutes ?? 0), 0);
    const buffer = await generatePDF(
      `Pontaj lunar — ${empName}`,
      `Perioada: ${monthName(month, year)} | Total: ${fmtDuration(totalMin)}`,
      ["Data", "Locație", "Intrare", "Ieșire", "Pauză", "Total", "Proiect"],
      rows.map(r => [
        fmtDate(r.date),
        locationLabel(r.type),
        fmtTime(r.checkIn),
        fmtTime(r.checkOut),
        r.breakMinutes ? `${r.breakMinutes}m` : "—",
        fmtDuration(r.totalMinutes),
        r.projectName ?? "—",
      ]),
      ["TOTAL", "", "", "", "", fmtDuration(totalMin), ""]
    );

    const filename = sanitizeFilename(`Pontaj_${empName}_${year}_${String(month).padStart(2, "0")}.pdf`);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  });

  // ── 2. Sumar echipă — Excel ───────────────────────────────────────────────
  app.get("/api/reports/sumar-echipa/excel", async (req, res) => {
    const user = await requireHR(req, res);
    if (!user) return;
    const { year, month } = parseParams(req);
    const rows = await getSumarEchipaLunar(year, month);
    const buffer = await generateSumarEchipaExcel(year, month, rows);
    const filename = `Sumar_Echipa_${year}_${String(month).padStart(2, "0")}.xlsx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(Buffer.from(buffer));
  });

  // ── 2. Sumar echipă — PDF ─────────────────────────────────────────────────
  app.get("/api/reports/sumar-echipa/pdf", async (req, res) => {
    const user = await requireHR(req, res);
    if (!user) return;
    const { year, month } = parseParams(req);
    const rows = await getSumarEchipaLunar(year, month);
    const buffer = await generatePDF(
      `Sumar lunar echipă`,
      `Perioada: ${monthName(month, year)} | ${rows.length} angajați`,
      ["Angajat", "Departament", "Zile prez.", "Total ore", "CO", "Medical", "Lib.legal", "Absent"],
      rows.map(r => [
        r.name, r.department ?? "—", String(r.presentDays),
        fmtDuration(r.totalMinutes),
        r.concediuDays ? String(r.concediuDays) : "—",
        r.medicalDays ? String(r.medicalDays) : "—",
        r.liberLegalDays ? String(r.liberLegalDays) : "—",
        r.absentDays ? String(r.absentDays) : "—",
      ]),
      ["TOTAL", `${rows.length} angajați`, String(rows.reduce((a, r) => a + r.presentDays, 0)),
        fmtDuration(rows.reduce((a, r) => a + r.totalMinutes, 0)), "", "", "", ""]
    );
    const filename = `Sumar_Echipa_${year}_${String(month).padStart(2, "0")}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  });

  // ── 3. Concedii & absențe — Excel ─────────────────────────────────────────
  app.get("/api/reports/absente/excel", async (req, res) => {
    const user = await requireHR(req, res);
    if (!user) return;
    const { year, month } = parseParams(req);
    const rows = await getAbsenteLunare(year, month);
    const buffer = await generateAbsenteExcel(year, month, rows.map(r => ({
      name: r.name ?? "—",
      date: r.date,
      type: r.type,
      notes: r.notes,
    })));
    const filename = `Absente_${year}_${String(month).padStart(2, "0")}.xlsx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(Buffer.from(buffer));
  });

  // ── 3. Concedii & absențe — PDF ───────────────────────────────────────────
  app.get("/api/reports/absente/pdf", async (req, res) => {
    const user = await requireHR(req, res);
    if (!user) return;
    const { year, month } = parseParams(req);
    const rows = await getAbsenteLunare(year, month);
    const buffer = await generatePDF(
      `Concedii & Absențe`,
      `Perioada: ${monthName(month, year)} | ${rows.length} înregistrări`,
      ["Angajat", "Data", "Tip absență", "Notă"],
      rows.map(r => [r.name ?? "—", fmtDate(r.date), locationLabel(r.type), r.notes ?? "—"]),
      [`Total: ${rows.length} înregistrări`, "", "", ""]
    );
    const filename = `Absente_${year}_${String(month).padStart(2, "0")}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  });

  // ── 4. Ore suplimentare — Excel ───────────────────────────────────────────
  app.get("/api/reports/ore-suplimentare/excel", async (req, res) => {
    const user = await requireHR(req, res);
    if (!user) return;
    const { year, month } = parseParams(req);
    const normMinutes = parseInt(req.query.norm as string) || 480;
    const rows = await getOreSuplimentare(year, month, normMinutes);
    const buffer = await generateOreSuplimentareExcel(year, month, normMinutes, rows);
    const filename = `Ore_Suplimentare_${year}_${String(month).padStart(2, "0")}.xlsx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(Buffer.from(buffer));
  });

  // ── 4. Ore suplimentare — PDF ─────────────────────────────────────────────
  app.get("/api/reports/ore-suplimentare/pdf", async (req, res) => {
    const user = await requireHR(req, res);
    if (!user) return;
    const { year, month } = parseParams(req);
    const normMinutes = parseInt(req.query.norm as string) || 480;
    const rows = await getOreSuplimentare(year, month, normMinutes);
    const totalOver = rows.reduce((a, r) => a + r.overMinutes, 0);
    const buffer = await generatePDF(
      `Ore suplimentare`,
      `Perioada: ${monthName(month, year)} | Normă: ${fmtDuration(normMinutes)}/zi | Total suplimenare: ${fmtDuration(totalOver)}`,
      ["Angajat", "Data", "Locație", "Total ore", "Ore suplimenare"],
      rows.map(r => [r.name, fmtDate(r.date), locationLabel(r.type), fmtDuration(r.totalMinutes), fmtDuration(r.overMinutes)]),
      ["TOTAL", "", "", "", fmtDuration(totalOver)]
    );
    const filename = `Ore_Suplimentare_${year}_${String(month).padStart(2, "0")}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  });

  // ── 5. Pontaj per proiect — Excel ─────────────────────────────────────────
  app.get("/api/reports/pontaj-proiect/excel", async (req, res) => {
    const user = await requireHR(req, res);
    if (!user) return;
    const { year, month } = parseParams(req);
    const rows = await getPontajPerProiect(year, month);
    const buffer = await generatePontajProiectExcel(year, month, rows);
    const filename = `Pontaj_Proiecte_${year}_${String(month).padStart(2, "0")}.xlsx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(Buffer.from(buffer));
  });

  // ── 5. Pontaj per proiect — PDF ───────────────────────────────────────────
  app.get("/api/reports/pontaj-proiect/pdf", async (req, res) => {
    const user = await requireHR(req, res);
    if (!user) return;
    const { year, month } = parseParams(req);
    const rows = await getPontajPerProiect(year, month);
    const totalMin = rows.reduce((a, r) => a + (r.totalMinutes ?? 0), 0);
    const buffer = await generatePDF(
      `Pontaj per proiect`,
      `Perioada: ${monthName(month, year)} | Total: ${fmtDuration(totalMin)}`,
      ["Proiect", "Angajat", "Data", "Locație", "Ore lucrate", "Notă"],
      rows.map(r => [r.projectName, r.name, fmtDate(r.date), locationLabel(r.type), fmtDuration(r.totalMinutes ?? 0), r.notes ?? "—"]),
      ["TOTAL", "", "", "", fmtDuration(totalMin), ""]
    );
    const filename = `Pontaj_Proiecte_${year}_${String(month).padStart(2, "0")}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  });

  // ── Lista angajați activi (pentru selectorul HR) ──────────────────────
  app.get("/api/reports/users", async (req, res) => {
    const user = await requireHR(req, res);
    if (!user) return;
    const users = await getActiveUsers();
    res.json(users);
  });

  // ═══ TIME-TRACKING PERSONAL EXPORT (any authenticated user) ══════════════════

  // Helper: authenticate any user (not just admin)
  async function requireAuth(req: Request, res: Response) {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user) { res.status(401).json({ error: "Neautentificat." }); return null; }
      return user as { id: number; role: string; name: string | null };
    } catch {
      res.status(401).json({ error: "Neautentificat." });
      return null;
    }
  }

  // ── Time-Tracking Excel ────────────────────────────────────────────────
  app.get("/api/reports/time-tracking/excel", async (req, res) => {
    const user = await requireAuth(req, res);
    if (!user) return;
    const dateFrom = (req.query.dateFrom as string) || undefined;
    const dateTo = (req.query.dateTo as string) || undefined;
    const projectFilter = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
    const typeFilter = (req.query.activityType as string) || undefined;
    const taskNameFilter = (req.query.taskName as string) || undefined;

    const allEntries = await getTimeEntriesForUser(user.id, dateFrom, dateTo);
    const projects = await getProjects();
    const projMap = new Map(projects.map((p: any) => [p.id, p.name]));

    let entries = allEntries.filter((e: any) => {
      const hasTime = (e.startHour != null) || e.startTime;
      if (!hasTime) return false;
      if (projectFilter && e.projectId !== projectFilter) return false;
      if (typeFilter && typeFilter !== "all" && e.activityType !== typeFilter) return false;
      if (taskNameFilter && !(e.taskName || "").toLowerCase().includes(taskNameFilter.toLowerCase())) return false;
      return true;
    });

    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();
    wb.creator = "Inginerie Creativ\u0103 SRL";
    wb.created = new Date();
    const ws = wb.addWorksheet("Time Tracking", { pageSetup: { orientation: "landscape", fitToPage: true } });

    const cols = ["Data", "Activitate", "Tip", "Proiect", "Start", "Final", "Durat\u0103", "Descriere"];
    const colCount = cols.length;

    // Branding rows
    ws.addRow([]);
    const r1 = ws.lastRow!;
    ws.mergeCells(`A${r1.number}:${String.fromCharCode(64 + colCount)}${r1.number}`);
    const c1 = r1.getCell(1);
    c1.value = "Inginerie Creativ\u0103 SRL";
    c1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF221F1F" } };
    c1.font = { bold: true, color: { argb: "FFFFCB09" }, size: 14, name: "Calibri" };
    c1.alignment = { vertical: "middle", horizontal: "center" };
    r1.height = 28;

    ws.addRow([]);
    const r2 = ws.lastRow!;
    ws.mergeCells(`A${r2.number}:${String.fromCharCode(64 + colCount)}${r2.number}`);
    const c2 = r2.getCell(1);
    c2.value = `Raport Time-Tracking — ${user.name || "Utilizator"}`;
    c2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFCB09" } };
    c2.font = { bold: true, color: { argb: "FF221F1F" }, size: 12, name: "Calibri" };
    c2.alignment = { vertical: "middle", horizontal: "center" };
    r2.height = 22;

    ws.addRow([]);
    const r3 = ws.lastRow!;
    ws.mergeCells(`A${r3.number}:${String.fromCharCode(64 + colCount)}${r3.number}`);
    const c3 = r3.getCell(1);
    c3.value = `Perioad\u0103: ${dateFrom || "\u2014"} \u2192 ${dateTo || "\u2014"} | Generat: ${new Date().toLocaleString("ro-RO")}`;
    c3.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F5F5" } };
    c3.font = { color: { argb: "FF666666" }, size: 9, name: "Calibri" };
    c3.alignment = { vertical: "middle", horizontal: "center" };
    r3.height = 16;

    ws.addRow([]);
    ws.lastRow!.height = 6;

    // Header row
    const headerRow = ws.addRow(cols);
    headerRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFCB09" } };
      cell.font = { bold: true, color: { argb: "FF221F1F" }, size: 10, name: "Calibri" };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.border = {
        top: { style: "thin", color: { argb: "FF221F1F" } },
        bottom: { style: "thin", color: { argb: "FF221F1F" } },
      };
    });

    // Data rows
    let totalMins = 0;
    entries.forEach((e: any, idx: number) => {
      const sh = e.startHour ?? 0;
      const sm = e.startMin ?? 0;
      const eh = e.endHour ?? 0;
      const em = e.endMin ?? 0;
      const dur = e.durationMinutes || 0;
      totalMins += dur;
      const dateStr = e.date ? new Date(e.date).toLocaleDateString("ro-RO") : "\u2014";
      const row = ws.addRow([
        dateStr,
        e.taskName || "\u2014",
        e.activityType || "\u2014",
        projMap.get(e.projectId) || "\u2014",
        `${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")}`,
        `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`,
        fmtDuration(dur),
        e.description || "",
      ]);
      const isEven = idx % 2 === 0;
      row.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: isEven ? "FFF9F9F9" : "FFFFFFFF" } };
        cell.font = { color: { argb: "FF221F1F" }, size: 9, name: "Calibri" };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = { bottom: { style: "hair", color: { argb: "FFDDDDDD" } } };
      });
    });

    // Totals row
    const totRow = ws.addRow(["", "", "", "TOTAL", "", "", fmtDuration(totalMins), ""]);
    totRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFCB09" } };
      cell.font = { bold: true, color: { argb: "FF221F1F" }, size: 10, name: "Calibri" };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "medium", color: { argb: "FF221F1F" } },
        bottom: { style: "medium", color: { argb: "FF221F1F" } },
      };
    });

    // Column widths
    ws.columns = [
      { width: 14 }, { width: 30 }, { width: 14 }, { width: 20 },
      { width: 8 }, { width: 8 }, { width: 10 }, { width: 30 },
    ];

    const buffer = await wb.xlsx.writeBuffer();
    const filename = sanitizeFilename(`time-tracking-${user.name || "user"}-${dateFrom || "all"}.xlsx`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(Buffer.from(buffer as ArrayBuffer));
  });

  // ── Time-Tracking PDF ─────────────────────────────────────────────────
  app.get("/api/reports/time-tracking/pdf", async (req, res) => {
    const user = await requireAuth(req, res);
    if (!user) return;
    const dateFrom = (req.query.dateFrom as string) || undefined;
    const dateTo = (req.query.dateTo as string) || undefined;
    const projectFilter = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
    const typeFilter = (req.query.activityType as string) || undefined;
    const taskNameFilter = (req.query.taskName as string) || undefined;

    const allEntries = await getTimeEntriesForUser(user.id, dateFrom, dateTo);
    const projects = await getProjects();
    const projMap = new Map(projects.map((p: any) => [p.id, p.name]));

    let entries = allEntries.filter((e: any) => {
      const hasTime = (e.startHour != null) || e.startTime;
      if (!hasTime) return false;
      if (projectFilter && e.projectId !== projectFilter) return false;
      if (typeFilter && typeFilter !== "all" && e.activityType !== typeFilter) return false;
      if (taskNameFilter && !(e.taskName || "").toLowerCase().includes(taskNameFilter.toLowerCase())) return false;
      return true;
    });

    const headers = ["Data", "Activitate", "Tip", "Proiect", "Start", "Final", "Durat\u0103", "Descriere"];
    let totalMins = 0;
    const rows = entries.map((e: any) => {
      const sh = e.startHour ?? 0;
      const sm = e.startMin ?? 0;
      const eh = e.endHour ?? 0;
      const em = e.endMin ?? 0;
      const dur = e.durationMinutes || 0;
      totalMins += dur;
      const dateStr = e.date ? new Date(e.date).toLocaleDateString("ro-RO") : "\u2014";
      return [
        dateStr,
        e.taskName || "\u2014",
        e.activityType || "\u2014",
        projMap.get(e.projectId) || "\u2014",
        `${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")}`,
        `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`,
        fmtDuration(dur),
        e.description || "",
      ];
    });

    const totalsRow = ["", "", "", "TOTAL", "", "", fmtDuration(totalMins), ""];
    const title = `Raport Time-Tracking \u2014 ${user.name || "Utilizator"}`;
    const subtitle = `Perioad\u0103: ${dateFrom || "\u2014"} \u2192 ${dateTo || "\u2014"}`;
    const buffer = await generatePDF(title, subtitle, headers, rows, totalsRow);
    const filename = sanitizeFilename(`time-tracking-${user.name || "user"}-${dateFrom || "all"}.pdf`);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  });
}

// Helper exported for use in routes
function monthName(month: number, year: number): string {
  const months = ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
    "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"];
  return `${months[month - 1]} ${year}`;
}
