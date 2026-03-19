import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileSpreadsheet, FileText, Users, Clock, CalendarOff,
  TrendingUp, FolderOpen, Download, ChevronLeft, ChevronRight,
  BarChart3, AlertCircle
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type ActiveUser = { id: number; name: string | null; email: string | null; department: string | null };

// ─── Constants ────────────────────────────────────────────────────────────────
const MONTHS = [
  "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
  "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"
];

const REPORT_TYPES = [
  {
    id: "pontaj-lunar",
    label: "Pontaj lunar",
    icon: Clock,
    description: "Toate zilele de pontaj ale unui angajat pe o lună. Esențial pentru dosarul de contabilitate.",
    requiresEmployee: true,
    color: "bg-amber-50 border-amber-200",
    iconColor: "text-amber-600",
  },
  {
    id: "sumar-echipa",
    label: "Sumar echipă",
    icon: Users,
    description: "Vizualizare rapidă a prezenței, absențelor și orelor totale pentru toți angajații.",
    requiresEmployee: false,
    color: "bg-blue-50 border-blue-200",
    iconColor: "text-blue-600",
  },
  {
    id: "absente",
    label: "Concedii & Absențe",
    icon: CalendarOff,
    description: "Toate concediile, zilele medicale, libere legale și absențele pe o lună.",
    requiresEmployee: false,
    color: "bg-rose-50 border-rose-200",
    iconColor: "text-rose-600",
  },
  {
    id: "ore-suplimentare",
    label: "Ore suplimentare",
    icon: TrendingUp,
    description: "Angajații care au depășit norma zilnică de 8h. Util pentru calcul bonusuri.",
    requiresEmployee: false,
    color: "bg-green-50 border-green-200",
    iconColor: "text-green-600",
  },
  {
    id: "pontaj-proiect",
    label: "Pontaj per proiect",
    icon: FolderOpen,
    description: "Orele lucrate pe fiecare proiect, grupate per angajat. Util pentru facturare client.",
    requiresEmployee: false,
    color: "bg-purple-50 border-purple-200",
    iconColor: "text-purple-600",
  },
] as const;

type ReportId = typeof REPORT_TYPES[number]["id"];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtTime(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const dt = new Date(d);
  return `${String(dt.getUTCHours()).padStart(2, "0")}:${String(dt.getUTCMinutes()).padStart(2, "0")}`;
}

function fmtDuration(minutes: number | null | undefined): string {
  if (!minutes) return "0h 00m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const dt = new Date(d);
  const days = ["Dum", "Lun", "Mar", "Mie", "Joi", "Vin", "Sâm"];
  const months = ["Ian", "Feb", "Mar", "Apr", "Mai", "Iun", "Iul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${days[dt.getUTCDay()]}, ${dt.getUTCDate()} ${months[dt.getUTCMonth()]}`;
}

function locationLabel(type: string): string {
  const map: Record<string, string> = {
    bucuresti: "București",
    cluj: "Cluj",
    miercurea_ciuc: "Miercurea-Ciuc",
    brasov: "Brașov",
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

// ─── Download helper ──────────────────────────────────────────────────────────
function buildUrl(reportId: ReportId, format: "excel" | "pdf", year: number, month: number, userId?: number): string {
  const base = `/api/reports`;
  const params = new URLSearchParams({ year: String(year), month: String(month) });
  if (userId) params.set("userId", String(userId));
  const ext = format === "excel" ? "excel" : "pdf";
  return `${base}/${reportId}/${ext}?${params}`;
}

async function downloadFile(url: string, filename: string) {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Eroare la generarea raportului" }));
    throw new Error(err.error ?? "Eroare necunoscută");
  }
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ─── Preview data fetchers via tRPC ──────────────────────────────────────────
function usePreviewData(reportId: ReportId, year: number, month: number, userId?: number) {
  const enabled = reportId === "pontaj-lunar" ? !!userId : true;

  const pontajLunar = trpc.pontaj.getByMonth.useQuery(
    { year, month, userId: userId! },
    { enabled: enabled && reportId === "pontaj-lunar" && !!userId }
  );
  const sumarEchipa = trpc.pontaj.getAllByMonth.useQuery(
    { year, month },
    { enabled: reportId === "sumar-echipa" }
  );
  const absente = trpc.pontaj.getAbsente.useQuery(
    { year, month },
    { enabled: reportId === "absente" }
  );
  const oreSupl = trpc.pontaj.getOreSuplimentare.useQuery(
    { year, month },
    { enabled: reportId === "ore-suplimentare" }
  );
  const proiect = trpc.pontaj.getPontajProiect.useQuery(
    { year, month },
    { enabled: reportId === "pontaj-proiect" }
  );

  if (reportId === "pontaj-lunar") return { data: pontajLunar.data, isLoading: pontajLunar.isLoading };
  if (reportId === "sumar-echipa") return { data: sumarEchipa.data, isLoading: sumarEchipa.isLoading };
  if (reportId === "absente") return { data: absente.data, isLoading: absente.isLoading };
  if (reportId === "ore-suplimentare") return { data: oreSupl.data, isLoading: oreSupl.isLoading };
  if (reportId === "pontaj-proiect") return { data: proiect.data, isLoading: proiect.isLoading };
  return { data: undefined, isLoading: false };
}

// ─── Preview Table components ─────────────────────────────────────────────────
function PreviewPontajLunar({ data }: { data: any[] }) {
  const total = data.reduce((a: number, r: any) => a + (r.totalMinutes ?? 0), 0);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#221F1F] text-[#FFCB09]">
            {["Data", "Locație", "Intrare", "Ieșire", "Pauză", "Total", "Proiect"].map(h => (
              <th key={h} className="px-3 py-2 text-center font-semibold text-xs">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((r: any, i: number) => (
            <tr key={r.id ?? i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              <td className="px-3 py-1.5 text-xs">{fmtDate(r.date)}</td>
              <td className="px-3 py-1.5 text-xs">{locationLabel(r.type)}</td>
              <td className="px-3 py-1.5 text-xs text-center">{fmtTime(r.checkIn)}</td>
              <td className="px-3 py-1.5 text-xs text-center">{fmtTime(r.checkOut)}</td>
              <td className="px-3 py-1.5 text-xs text-center">{r.breakMinutes ? `${r.breakMinutes}m` : "—"}</td>
              <td className="px-3 py-1.5 text-xs text-center font-medium">{fmtDuration(r.totalMinutes)}</td>
              <td className="px-3 py-1.5 text-xs text-gray-500">{r.projectName ?? "—"}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-[#FFCB09] font-bold">
            <td colSpan={5} className="px-3 py-2 text-xs font-bold">TOTAL</td>
            <td className="px-3 py-2 text-xs font-bold text-center">{fmtDuration(total)}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function PreviewSumarEchipa({ data }: { data: any[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#221F1F] text-[#FFCB09]">
            {["Angajat", "Departament", "Zile prezent", "Total ore", "CO", "Medical", "Lib. legal", "Absent"].map(h => (
              <th key={h} className="px-3 py-2 text-center font-semibold text-xs">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((r: any, i: number) => (
            <tr key={r.id ?? i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              <td className="px-3 py-1.5 text-xs font-medium">{r.name}</td>
              <td className="px-3 py-1.5 text-xs text-gray-500">{r.department ?? "—"}</td>
              <td className="px-3 py-1.5 text-xs text-center">{r.presentDays}</td>
              <td className="px-3 py-1.5 text-xs text-center font-medium">{fmtDuration(r.totalMinutes)}</td>
              <td className="px-3 py-1.5 text-xs text-center">{r.concediuDays || "—"}</td>
              <td className="px-3 py-1.5 text-xs text-center">{r.medicalDays || "—"}</td>
              <td className="px-3 py-1.5 text-xs text-center">{r.liberLegalDays || "—"}</td>
              <td className="px-3 py-1.5 text-xs text-center">{r.absentDays || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PreviewAbsente({ data }: { data: any[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#221F1F] text-[#FFCB09]">
            {["Angajat", "Data", "Tip absență", "Notă"].map(h => (
              <th key={h} className="px-3 py-2 text-left font-semibold text-xs">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((r: any, i: number) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              <td className="px-3 py-1.5 text-xs font-medium">{r.name ?? "—"}</td>
              <td className="px-3 py-1.5 text-xs">{fmtDate(r.date)}</td>
              <td className="px-3 py-1.5 text-xs">
                <Badge variant="outline" className="text-xs">{locationLabel(r.type)}</Badge>
              </td>
              <td className="px-3 py-1.5 text-xs text-gray-500">{r.notes ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PreviewOreSupl({ data }: { data: any[] }) {
  const totalOver = data.reduce((a: number, r: any) => a + (r.overMinutes ?? 0), 0);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#221F1F] text-[#FFCB09]">
            {["Angajat", "Data", "Locație", "Total ore", "Ore suplimentare"].map(h => (
              <th key={h} className="px-3 py-2 text-center font-semibold text-xs">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((r: any, i: number) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              <td className="px-3 py-1.5 text-xs font-medium">{r.name}</td>
              <td className="px-3 py-1.5 text-xs">{fmtDate(r.date)}</td>
              <td className="px-3 py-1.5 text-xs">{locationLabel(r.type)}</td>
              <td className="px-3 py-1.5 text-xs text-center">{fmtDuration(r.totalMinutes)}</td>
              <td className="px-3 py-1.5 text-xs text-center font-bold text-amber-700 bg-amber-50">{fmtDuration(r.overMinutes)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-[#FFCB09] font-bold">
            <td colSpan={4} className="px-3 py-2 text-xs font-bold">TOTAL ore suplimentare</td>
            <td className="px-3 py-2 text-xs font-bold text-center">{fmtDuration(totalOver)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function PreviewProiect({ data }: { data: any[] }) {
  const totalMin = data.reduce((a: number, r: any) => a + (r.totalMinutes ?? 0), 0);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#221F1F] text-[#FFCB09]">
            {["Proiect", "Angajat", "Data", "Locație", "Ore lucrate", "Notă"].map(h => (
              <th key={h} className="px-3 py-2 text-left font-semibold text-xs">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((r: any, i: number) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              <td className="px-3 py-1.5 text-xs font-semibold text-purple-700">{r.projectName}</td>
              <td className="px-3 py-1.5 text-xs">{r.name}</td>
              <td className="px-3 py-1.5 text-xs">{fmtDate(r.date)}</td>
              <td className="px-3 py-1.5 text-xs">{locationLabel(r.type)}</td>
              <td className="px-3 py-1.5 text-xs text-center font-medium">{fmtDuration(r.totalMinutes)}</td>
              <td className="px-3 py-1.5 text-xs text-gray-500">{r.notes ?? "—"}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-[#FFCB09] font-bold">
            <td colSpan={4} className="px-3 py-2 text-xs font-bold">TOTAL</td>
            <td className="px-3 py-2 text-xs font-bold text-center">{fmtDuration(totalMin)}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RapoarteHR() {
  const { user } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [activeReport, setActiveReport] = useState<ReportId>("pontaj-lunar");
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>();
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check HR access
  const hrRoles = ["super_admin", "admin_hr", "manager"];
  const hasAccess = user && hrRoles.includes(user.role ?? "");

  // Fetch active users for selector
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  useEffect(() => {
    if (!hasAccess) return;
    fetch("/api/reports/users", { credentials: "include" })
      .then(r => r.json())
      .then(setActiveUsers)
      .catch(() => {});
  }, [hasAccess]);

  const currentReport = REPORT_TYPES.find(r => r.id === activeReport)!;
  const { data: previewData, isLoading: previewLoading } = usePreviewData(activeReport, year, month, selectedUserId);

  const handleDownload = async (format: "excel" | "pdf") => {
    if (currentReport.requiresEmployee && !selectedUserId) {
      setError("Selectează un angajat pentru acest raport.");
      return;
    }
    setError(null);
    const key = `${activeReport}-${format}`;
    setDownloading(key);
    try {
      const ext = format === "excel" ? "xlsx" : "pdf";
      const empName = activeUsers.find(u => u.id === selectedUserId)?.name ?? "echipa";
      const filename = `${activeReport}_${empName}_${year}_${String(month).padStart(2, "0")}.${ext}`;
      await downloadFile(buildUrl(activeReport, format, year, month, selectedUserId), filename);
    } catch (e: any) {
      setError(e.message ?? "Eroare la descărcare");
    } finally {
      setDownloading(null);
    }
  };

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <h2 className="text-xl font-bold text-foreground">Acces restricționat</h2>
        <p className="text-muted-foreground text-center max-w-sm">
          Această pagină este disponibilă doar pentru rolurile HR Admin, Manager și Super Admin.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-[#FFCB09] flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-[#221F1F]" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Rapoarte HR</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Generează și descarcă rapoarte pentru dosarul de contabilitate și analiza echipei.
          </p>
        </div>

        {/* Month navigator */}
        <div className="flex items-center gap-2 bg-card border rounded-xl px-3 py-2 shadow-sm">
          <button onClick={prevMonth} className="p-1 hover:bg-muted rounded-lg transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-semibold text-sm min-w-[130px] text-center">
            {MONTHS[month - 1]} {year}
          </span>
          <button onClick={nextMonth} className="p-1 hover:bg-muted rounded-lg transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Report type cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {REPORT_TYPES.map(rt => {
          const Icon = rt.icon;
          const isActive = activeReport === rt.id;
          return (
            <button
              key={rt.id}
              onClick={() => { setActiveReport(rt.id); setError(null); }}
              className={`
                relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all
                ${isActive
                  ? "border-[#FFCB09] bg-[#FFCB09]/10 shadow-md ring-2 ring-[#FFCB09]/40"
                  : "border-border bg-card hover:border-[#FFCB09]/50 hover:bg-muted/50"
                }
              `}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isActive ? "bg-[#FFCB09]" : "bg-muted"}`}>
                <Icon className={`h-5 w-5 ${isActive ? "text-[#221F1F]" : "text-muted-foreground"}`} />
              </div>
              <span className={`text-xs font-semibold leading-tight ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                {rt.label}
              </span>
              {isActive && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FFCB09]" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Filters + Export ── */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <currentReport.icon className="h-4 w-4 text-[#FFCB09]" />
            {currentReport.label}
            <span className="text-xs font-normal text-muted-foreground ml-1">— {currentReport.description}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3 items-end">
            {/* Employee selector (only for pontaj-lunar) */}
            {currentReport.requiresEmployee && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Angajat *</label>
                <Select
                  value={selectedUserId ? String(selectedUserId) : ""}
                  onValueChange={v => setSelectedUserId(Number(v))}
                >
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Selectează angajat..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activeUsers.map(u => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.name ?? u.email ?? `User #${u.id}`}
                        {u.department && <span className="text-muted-foreground ml-1 text-xs">({u.department})</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Year selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">An</label>
              <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026, 2027].map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Month selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Lună</label>
              <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1" />

            {/* Export buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-green-600 text-green-700 hover:bg-green-50"
                onClick={() => handleDownload("excel")}
                disabled={!!downloading}
              >
                <FileSpreadsheet className="h-4 w-4" />
                {downloading === `${activeReport}-excel` ? "Generez..." : "Excel"}
                <Download className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-red-500 text-red-600 hover:bg-red-50"
                onClick={() => handleDownload("pdf")}
                disabled={!!downloading}
              >
                <FileText className="h-4 w-4" />
                {downloading === `${activeReport}-pdf` ? "Generez..." : "PDF"}
                <Download className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Preview table ── */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Preview — {MONTHS[month - 1]} {year}
          </CardTitle>
          {previewData && Array.isArray(previewData) && (
            <Badge variant="secondary" className="text-xs">
              {previewData.length} înregistrări
            </Badge>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {previewLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground text-sm gap-2">
              <div className="w-4 h-4 border-2 border-[#FFCB09] border-t-transparent rounded-full animate-spin" />
              Se încarcă datele...
            </div>
          ) : !previewData || (Array.isArray(previewData) && previewData.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <BarChart3 className="h-8 w-8 opacity-30" />
              <p className="text-sm">
                {currentReport.requiresEmployee && !selectedUserId
                  ? "Selectează un angajat pentru a vedea datele."
                  : `Nu există date pentru ${MONTHS[month - 1]} ${year}.`}
              </p>
            </div>
          ) : (
            <div className="rounded-b-xl overflow-hidden border-t">
              {activeReport === "pontaj-lunar" && <PreviewPontajLunar data={previewData as any[]} />}
              {activeReport === "sumar-echipa" && <PreviewSumarEchipa data={previewData as any[]} />}
              {activeReport === "absente" && <PreviewAbsente data={previewData as any[]} />}
              {activeReport === "ore-suplimentare" && <PreviewOreSupl data={previewData as any[]} />}
              {activeReport === "pontaj-proiect" && <PreviewProiect data={previewData as any[]} />}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
