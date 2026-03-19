/**
 * reports.ts — Generatoare Excel + PDF branded Inginerie Creativă
 * Brand: #FFCB09 (galben), #221F1F (negru), #FFFFFF (alb)
 */
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { PassThrough } from "stream";

// ─── Brand constants ──────────────────────────────────────────────────────────
const BRAND = {
  yellow: "FFCB09",
  black: "221F1F",
  white: "FFFFFF",
  gray: "F5F5F5",
  grayDark: "CCCCCC",
  grayText: "666666",
};

const COMPANY = "Inginerie Creativă SRL";
const COMPANY_SHORT = "IC";

// ─── Helpers (exported for use in reportRoutes) ─────────────────────────────
export function fmtTime(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const dt = new Date(d);
  return `${String(dt.getUTCHours()).padStart(2, "0")}:${String(dt.getUTCMinutes()).padStart(2, "0")}`;
}

export function fmtDuration(minutes: number | null | undefined): string {
  if (!minutes) return "0h 00m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const dt = new Date(d);
  const days = ["Dum", "Lun", "Mar", "Mie", "Joi", "Vin", "Sâm"];
  const months = ["Ian", "Feb", "Mar", "Apr", "Mai", "Iun", "Iul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${days[dt.getUTCDay()]}, ${dt.getUTCDate()} ${months[dt.getUTCMonth()]}`;
}

function monthName(month: number, year: number): string {
  const months = ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
    "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"];
  return `${months[month - 1]} ${year}`;
}

export function locationLabel(type: string): string {
  const map: Record<string, string> = {
    bucuresti: "București (Caracas 4)",
    cluj: "Cluj (KITE Plopilor 68)",
    miercurea_ciuc: "Miercurea-Ciuc",
    brasov: "Brașov (IASC Livezilor 28)",
    eveniment: "Eveniment",
    deplasare: "Deplasare",
    vizita_santier: "Vizită Șantier",
    telemunca: "Telemuncă",
    concediu: "Concediu",
    medical: "Medical",
    liber_legal: "Liber legal",
    absent: "Absent",
    recuperare: "Recuperare",
  };
  return map[type] ?? type;
}

// ─── Excel helpers ────────────────────────────────────────────────────────────
function applyHeaderStyle(cell: ExcelJS.Cell, bg = BRAND.yellow, fgColor = BRAND.black) {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${bg}` } };
  cell.font = { bold: true, color: { argb: `FF${fgColor}` }, size: 10, name: "Calibri" };
  cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  cell.border = {
    top: { style: "thin", color: { argb: `FF${BRAND.black}` } },
    bottom: { style: "thin", color: { argb: `FF${BRAND.black}` } },
    left: { style: "thin", color: { argb: `FFCCCCCC` } },
    right: { style: "thin", color: { argb: `FFCCCCCC` } },
  };
}

function applyDataStyle(cell: ExcelJS.Cell, isEven: boolean, bold = false) {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: isEven ? `FFF9F9F9` : `FFFFFFFF` } };
  cell.font = { bold, color: { argb: `FF${BRAND.black}` }, size: 9, name: "Calibri" };
  cell.alignment = { vertical: "middle", horizontal: "center" };
  cell.border = {
    bottom: { style: "hair", color: { argb: `FFDDDDDD` } },
    left: { style: "hair", color: { argb: `FFEEEEEE` } },
    right: { style: "hair", color: { argb: `FFEEEEEE` } },
  };
}

function applyTotalStyle(cell: ExcelJS.Cell) {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${BRAND.yellow}` } };
  cell.font = { bold: true, color: { argb: `FF${BRAND.black}` }, size: 10, name: "Calibri" };
  cell.alignment = { vertical: "middle", horizontal: "center" };
  cell.border = {
    top: { style: "medium", color: { argb: `FF${BRAND.black}` } },
    bottom: { style: "medium", color: { argb: `FF${BRAND.black}` } },
  };
}

function addExcelBranding(ws: ExcelJS.Worksheet, title: string, subtitle: string, colCount: number) {
  // Row 1: Company name
  ws.addRow([]);
  const r1 = ws.lastRow!;
  ws.mergeCells(`A${r1.number}:${String.fromCharCode(64 + colCount)}${r1.number}`);
  const c1 = r1.getCell(1);
  c1.value = COMPANY;
  c1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${BRAND.black}` } };
  c1.font = { bold: true, color: { argb: `FF${BRAND.yellow}` }, size: 14, name: "Calibri" };
  c1.alignment = { vertical: "middle", horizontal: "center" };
  r1.height = 28;

  // Row 2: Report title
  ws.addRow([]);
  const r2 = ws.lastRow!;
  ws.mergeCells(`A${r2.number}:${String.fromCharCode(64 + colCount)}${r2.number}`);
  const c2 = r2.getCell(1);
  c2.value = title;
  c2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${BRAND.yellow}` } };
  c2.font = { bold: true, color: { argb: `FF${BRAND.black}` }, size: 12, name: "Calibri" };
  c2.alignment = { vertical: "middle", horizontal: "center" };
  r2.height = 22;

  // Row 3: Subtitle/period
  ws.addRow([]);
  const r3 = ws.lastRow!;
  ws.mergeCells(`A${r3.number}:${String.fromCharCode(64 + colCount)}${r3.number}`);
  const c3 = r3.getCell(1);
  c3.value = subtitle;
  c3.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FFF5F5F5` } };
  c3.font = { color: { argb: `FF${BRAND.grayText}` }, size: 9, name: "Calibri" };
  c3.alignment = { vertical: "middle", horizontal: "center" };
  r3.height = 16;

  // Row 4: empty spacer
  ws.addRow([]);
  ws.lastRow!.height = 6;

  return 4; // rows used
}

// ═══════════════════════════════════════════════════════════════════════════════
// RAPORT 1: Pontaj lunar per angajat
// ═══════════════════════════════════════════════════════════════════════════════
export type PontajRow = {
  date: Date | string;
  checkIn: Date | string | null;
  checkOut: Date | string | null;
  type: string;
  breakMinutes: number | null;
  totalMinutes: number | null;
  notes: string | null;
  projectName?: string | null;
};

export async function generatePontajLunarExcel(
  employeeName: string,
  year: number,
  month: number,
  rows: PontajRow[]
): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = COMPANY;
  wb.created = new Date();

  const ws = wb.addWorksheet("Pontaj lunar", { pageSetup: { orientation: "landscape", fitToPage: true } });
  ws.pageSetup.margins = { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 };

  const cols = ["Data", "Locație / Tip", "Intrare", "Ieșire", "Pauză", "Total ore", "Proiect", "Notă"];
  const colWidths = [18, 28, 10, 10, 10, 12, 20, 35];
  ws.columns = colWidths.map((w, i) => ({ width: w, key: `c${i}` }));

  addExcelBranding(ws, `Pontaj lunar — ${employeeName}`, `Perioada: ${monthName(month, year)} | Generat: ${new Date().toLocaleDateString("ro-RO")}`, cols.length);

  // Header row
  const headerRow = ws.addRow(cols);
  headerRow.height = 20;
  headerRow.eachCell(cell => applyHeaderStyle(cell));

  // Data rows
  let totalMin = 0;
  let presentDays = 0;
  const presentTypes = ["bucuresti", "cluj", "miercurea_ciuc", "brasov", "eveniment", "deplasare", "vizita_santier", "telemunca"];

  rows.forEach((r, idx) => {
    const isEven = idx % 2 === 0;
    const dataRow = ws.addRow([
      fmtDate(r.date),
      locationLabel(r.type),
      fmtTime(r.checkIn),
      fmtTime(r.checkOut),
      r.breakMinutes ? `${r.breakMinutes}m` : "—",
      fmtDuration(r.totalMinutes),
      r.projectName ?? "—",
      r.notes ?? "—",
    ]);
    dataRow.height = 16;
    dataRow.eachCell(cell => applyDataStyle(cell, isEven));
    // Left-align text columns
    dataRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
    dataRow.getCell(2).alignment = { horizontal: "left", vertical: "middle" };
    dataRow.getCell(7).alignment = { horizontal: "left", vertical: "middle" };
    dataRow.getCell(8).alignment = { horizontal: "left", vertical: "middle", wrapText: true };

    totalMin += r.totalMinutes ?? 0;
    if (presentTypes.includes(r.type)) presentDays++;
  });

  // Total row
  const totalRow = ws.addRow(["TOTAL", `${presentDays} zile prezent`, "", "", "", fmtDuration(totalMin), "", ""]);
  totalRow.height = 20;
  totalRow.eachCell(cell => applyTotalStyle(cell));
  ws.mergeCells(`A${totalRow.number}:B${totalRow.number}`);

  // Footer
  ws.addRow([]);
  const footerRow = ws.addRow([`Document generat automat de ${COMPANY} — Portal Intern | ${new Date().toLocaleString("ro-RO")}`]);
  ws.mergeCells(`A${footerRow.number}:H${footerRow.number}`);
  footerRow.getCell(1).font = { size: 8, color: { argb: `FF${BRAND.grayText}` }, italic: true };

  return wb.xlsx.writeBuffer();
}

// ═══════════════════════════════════════════════════════════════════════════════
// RAPORT 2: Sumar lunar echipă
// ═══════════════════════════════════════════════════════════════════════════════
export type SumarEchipaRow = {
  name: string;
  email: string | null;
  department: string | null;
  presentDays: number;
  totalMinutes: number;
  concediuDays: number;
  medicalDays: number;
  absentDays: number;
  liberLegalDays: number;
  recuperareDays: number;
};

export async function generateSumarEchipaExcel(
  year: number,
  month: number,
  rows: SumarEchipaRow[]
): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Sumar echipă", { pageSetup: { orientation: "landscape", fitToPage: true } });

  const cols = ["Angajat", "Departament", "Zile prezent", "Total ore", "Concediu", "Medical", "Liber legal", "Recuperare", "Absent"];
  const colWidths = [28, 22, 14, 14, 12, 12, 12, 12, 12];
  ws.columns = colWidths.map((w, i) => ({ width: w, key: `c${i}` }));

  addExcelBranding(ws, `Sumar lunar echipă`, `Perioada: ${monthName(month, year)} | ${rows.length} angajați | Generat: ${new Date().toLocaleDateString("ro-RO")}`, cols.length);

  const headerRow = ws.addRow(cols);
  headerRow.height = 20;
  headerRow.eachCell(cell => applyHeaderStyle(cell));

  let totalPresent = 0, totalMinAll = 0;
  rows.forEach((r, idx) => {
    const isEven = idx % 2 === 0;
    const dataRow = ws.addRow([
      r.name,
      r.department ?? "—",
      r.presentDays,
      fmtDuration(r.totalMinutes),
      r.concediuDays || "—",
      r.medicalDays || "—",
      r.liberLegalDays || "—",
      r.recuperareDays || "—",
      r.absentDays || "—",
    ]);
    dataRow.height = 16;
    dataRow.eachCell(cell => applyDataStyle(cell, isEven));
    dataRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
    dataRow.getCell(2).alignment = { horizontal: "left", vertical: "middle" };
    totalPresent += r.presentDays;
    totalMinAll += r.totalMinutes;
  });

  const totalRow = ws.addRow(["TOTAL", `${rows.length} angajați`, totalPresent, fmtDuration(totalMinAll), "", "", "", "", ""]);
  totalRow.height = 20;
  totalRow.eachCell(cell => applyTotalStyle(cell));

  return wb.xlsx.writeBuffer();
}

// ═══════════════════════════════════════════════════════════════════════════════
// RAPORT 3: Concedii & absențe
// ═══════════════════════════════════════════════════════════════════════════════
export type AbsenceRow = {
  name: string;
  date: Date | string;
  type: string;
  notes: string | null;
};

export async function generateAbsenteExcel(
  year: number,
  month: number,
  rows: AbsenceRow[]
): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Concedii & Absențe");

  const cols = ["Angajat", "Data", "Tip absență", "Notă"];
  const colWidths = [30, 20, 22, 45];
  ws.columns = colWidths.map((w, i) => ({ width: w, key: `c${i}` }));

  addExcelBranding(ws, `Concedii & Absențe`, `Perioada: ${monthName(month, year)} | ${rows.length} înregistrări | Generat: ${new Date().toLocaleDateString("ro-RO")}`, cols.length);

  const headerRow = ws.addRow(cols);
  headerRow.height = 20;
  headerRow.eachCell(cell => applyHeaderStyle(cell));

  rows.forEach((r, idx) => {
    const dataRow = ws.addRow([r.name, fmtDate(r.date), locationLabel(r.type), r.notes ?? "—"]);
    dataRow.height = 16;
    dataRow.eachCell(cell => applyDataStyle(cell, idx % 2 === 0));
    dataRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
    dataRow.getCell(4).alignment = { horizontal: "left", vertical: "middle", wrapText: true };
  });

  const totalRow = ws.addRow([`Total: ${rows.length} înregistrări`, "", "", ""]);
  totalRow.height = 18;
  totalRow.eachCell(cell => applyTotalStyle(cell));

  return wb.xlsx.writeBuffer();
}

// ═══════════════════════════════════════════════════════════════════════════════
// RAPORT 4: Ore suplimentare
// ═══════════════════════════════════════════════════════════════════════════════
export type OreSuplRow = {
  name: string;
  date: Date | string;
  totalMinutes: number | null;
  overMinutes: number;
  type: string;
};

export async function generateOreSuplimentareExcel(
  year: number,
  month: number,
  normMinutes: number,
  rows: OreSuplRow[]
): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Ore suplimentare");

  const cols = ["Angajat", "Data", "Locație", "Total ore", "Ore suplimentare"];
  const colWidths = [30, 20, 28, 14, 18];
  ws.columns = colWidths.map((w, i) => ({ width: w, key: `c${i}` }));

  addExcelBranding(ws, `Ore suplimentare`, `Perioada: ${monthName(month, year)} | Normă zilnică: ${fmtDuration(normMinutes)} | Generat: ${new Date().toLocaleDateString("ro-RO")}`, cols.length);

  const headerRow = ws.addRow(cols);
  headerRow.height = 20;
  headerRow.eachCell(cell => applyHeaderStyle(cell));

  let totalOver = 0;
  rows.forEach((r, idx) => {
    const dataRow = ws.addRow([r.name, fmtDate(r.date), locationLabel(r.type), fmtDuration(r.totalMinutes), fmtDuration(r.overMinutes)]);
    dataRow.height = 16;
    dataRow.eachCell(cell => applyDataStyle(cell, idx % 2 === 0));
    dataRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
    dataRow.getCell(3).alignment = { horizontal: "left", vertical: "middle" };
    // Highlight overtime cell in yellow
    const overCell = dataRow.getCell(5);
    overCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FFFFF9C4` } };
    overCell.font = { bold: true, color: { argb: `FF${BRAND.black}` }, size: 9 };
    totalOver += r.overMinutes;
  });

  const totalRow = ws.addRow(["TOTAL ore suplimentare", "", "", "", fmtDuration(totalOver)]);
  totalRow.height = 20;
  totalRow.eachCell(cell => applyTotalStyle(cell));

  return wb.xlsx.writeBuffer();
}

// ═══════════════════════════════════════════════════════════════════════════════
// RAPORT 5: Pontaj per proiect
// ═══════════════════════════════════════════════════════════════════════════════
export type ProiectRow = {
  projectName: string;
  name: string;
  date: Date | string;
  totalMinutes: number | null;
  type: string;
  notes: string | null;
};

export async function generatePontajProiectExcel(
  year: number,
  month: number,
  rows: ProiectRow[]
): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Pontaj per proiect");

  const cols = ["Proiect", "Angajat", "Data", "Locație", "Ore lucrate", "Notă"];
  const colWidths = [30, 28, 18, 22, 14, 35];
  ws.columns = colWidths.map((w, i) => ({ width: w, key: `c${i}` }));

  addExcelBranding(ws, `Pontaj per proiect`, `Perioada: ${monthName(month, year)} | Generat: ${new Date().toLocaleDateString("ro-RO")}`, cols.length);

  const headerRow = ws.addRow(cols);
  headerRow.height = 20;
  headerRow.eachCell(cell => applyHeaderStyle(cell));

  let totalMin = 0;
  let lastProject = "";
  rows.forEach((r, idx) => {
    const isNewProject = r.projectName !== lastProject;
    if (isNewProject && idx > 0) {
      // Separator row between projects
      const sepRow = ws.addRow(["", "", "", "", "", ""]);
      sepRow.height = 6;
    }
    const dataRow = ws.addRow([
      isNewProject ? r.projectName : "",
      r.name,
      fmtDate(r.date),
      locationLabel(r.type),
      fmtDuration(r.totalMinutes),
      r.notes ?? "—",
    ]);
    dataRow.height = 16;
    dataRow.eachCell(cell => applyDataStyle(cell, idx % 2 === 0));
    dataRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
    dataRow.getCell(1).font = { bold: isNewProject, color: { argb: `FF${BRAND.black}` }, size: 9 };
    dataRow.getCell(2).alignment = { horizontal: "left", vertical: "middle" };
    dataRow.getCell(6).alignment = { horizontal: "left", vertical: "middle", wrapText: true };
    totalMin += r.totalMinutes ?? 0;
    lastProject = r.projectName;
  });

  const totalRow = ws.addRow(["TOTAL", "", "", "", fmtDuration(totalMin), ""]);
  totalRow.height = 20;
  totalRow.eachCell(cell => applyTotalStyle(cell));

  return wb.xlsx.writeBuffer();
}

// ═══════════════════════════════════════════════════════════════════════════════
// PDF GENERATOR — branded, pentru toate rapoartele
// ═══════════════════════════════════════════════════════════════════════════════
export async function generatePDF(
  title: string,
  subtitle: string,
  headers: string[],
  rows: string[][],
  totalsRow?: string[]
): Promise<Buffer<ArrayBufferLike>> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margins: { top: 40, bottom: 40, left: 30, right: 30 },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageW = doc.page.width;
    const pageH = doc.page.height;
    const margin = 30;
    const contentW = pageW - margin * 2;

    // ── Header band ──
    doc.rect(0, 0, pageW, 50).fill("#221F1F");
    doc.fontSize(18).fillColor("#FFCB09").font("Helvetica-Bold")
      .text(COMPANY, margin, 14, { width: contentW * 0.6 });
    doc.fontSize(9).fillColor("#FFFFFF").font("Helvetica")
      .text(`Generat: ${new Date().toLocaleString("ro-RO")}`, margin + contentW * 0.6, 20, { width: contentW * 0.4, align: "right" });

    // ── Title band ──
    doc.rect(0, 50, pageW, 28).fill("#FFCB09");
    doc.fontSize(13).fillColor("#221F1F").font("Helvetica-Bold")
      .text(title, margin, 57, { width: contentW });

    // ── Subtitle ──
    doc.rect(0, 78, pageW, 18).fill("#F5F5F5");
    doc.fontSize(8).fillColor("#666666").font("Helvetica")
      .text(subtitle, margin, 83, { width: contentW });

    let y = 104;

    // ── Table ──
    const colW = contentW / headers.length;

    // Header row
    doc.rect(margin, y, contentW, 18).fill("#221F1F");
    headers.forEach((h, i) => {
      doc.fontSize(8).fillColor("#FFCB09").font("Helvetica-Bold")
        .text(h, margin + i * colW + 3, y + 5, { width: colW - 6, align: "center" });
    });
    y += 18;

    // Data rows
    rows.forEach((row, rowIdx) => {
      const rowH = 16;
      if (y + rowH > pageH - 50) {
        doc.addPage();
        y = 40;
        // Repeat header
        doc.rect(margin, y, contentW, 18).fill("#221F1F");
        headers.forEach((h, i) => {
          doc.fontSize(8).fillColor("#FFCB09").font("Helvetica-Bold")
            .text(h, margin + i * colW + 3, y + 5, { width: colW - 6, align: "center" });
        });
        y += 18;
      }
      const bg = rowIdx % 2 === 0 ? "#FFFFFF" : "#F9F9F9";
      doc.rect(margin, y, contentW, rowH).fill(bg);
      doc.rect(margin, y, contentW, rowH).stroke("#EEEEEE");
      row.forEach((cell, i) => {
        doc.fontSize(8).fillColor("#221F1F").font("Helvetica")
          .text(cell ?? "—", margin + i * colW + 3, y + 4, { width: colW - 6, align: "center", lineBreak: false });
      });
      y += rowH;
    });

    // Totals row
    if (totalsRow) {
      doc.rect(margin, y, contentW, 18).fill("#FFCB09");
      totalsRow.forEach((cell, i) => {
        doc.fontSize(9).fillColor("#221F1F").font("Helvetica-Bold")
          .text(cell ?? "", margin + i * colW + 3, y + 5, { width: colW - 6, align: "center", lineBreak: false });
      });
      y += 18;
    }

    // ── Footer ──
    doc.rect(0, pageH - 30, pageW, 30).fill("#221F1F");
    doc.fontSize(7).fillColor("#AAAAAA").font("Helvetica")
      .text(`${COMPANY} — Document generat automat de Portalul Intern. Confidențial.`, margin, pageH - 20, { width: contentW, align: "center" });

    doc.end();
  });
}
