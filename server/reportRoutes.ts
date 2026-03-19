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

  // ── Lista angajați activi (pentru selectorul HR) ──────────────────────────
  app.get("/api/reports/users", async (req, res) => {
    const user = await requireHR(req, res);
    if (!user) return;
    const users = await getActiveUsers();
    res.json(users);
  });
}

// Helper exported for use in routes
function monthName(month: number, year: number): string {
  const months = ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
    "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"];
  return `${months[month - 1]} ${year}`;
}
