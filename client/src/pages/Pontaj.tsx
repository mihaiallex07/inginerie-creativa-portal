import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format, parseISO, isWeekend, isBefore, startOfMonth } from "date-fns";
import { ro } from "date-fns/locale";
import { useState, useMemo } from "react";
import {
  CheckCircle2, Clock, LogIn, LogOut, Coffee,
  ChevronLeft, ChevronRight, CalendarDays,
  FileText, Briefcase, Plus, X, Pencil, Trash2
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
type PontajType =
  | "bucuresti" | "cluj" | "miercurea_ciuc" | "brasov"
  | "eveniment" | "deplasare" | "vizita_santier" | "telemunca"
  | "concediu" | "medical" | "liber_legal" | "absent" | "recuperare";

interface LocationDef {
  value: PontajType;
  label: string;
  sublabel: string;
  icon: string;
}

const LOCATIONS: LocationDef[] = [
  { value: "bucuresti",     label: "București",        sublabel: "Caracas 4",           icon: "🏢" },
  { value: "cluj",          label: "Cluj",             sublabel: "KITE Plopilor 68",    icon: "🏢" },
  { value: "miercurea_ciuc",label: "Miercurea-Ciuc",   sublabel: "Birou",               icon: "🏢" },
  { value: "brasov",        label: "Brașov",           sublabel: "IASC Livezilor 28",   icon: "🏢" },
  { value: "eveniment",     label: "Eveniment",        sublabel: "Conferință / târg",   icon: "📅" },
  { value: "deplasare",     label: "Deplasare",        sublabel: "Client / partener",   icon: "🚗" },
  { value: "vizita_santier",label: "Vizită Șantier",   sublabel: "Inspecție / supervizare", icon: "🏗️" },
  { value: "telemunca",     label: "Telemuncă",        sublabel: "Lucru de acasă",      icon: "🏠" },
  { value: "concediu",      label: "Concediu",         sublabel: "Odihnă / CO",         icon: "🌴" },
  { value: "medical",       label: "Medical",          sublabel: "Concediu medical",    icon: "🏥" },
  { value: "liber_legal",   label: "Liber legal",      sublabel: "Sărbătoare legală",   icon: "📋" },
  { value: "absent",        label: "Absent",           sublabel: "Nemotivat",           icon: "❌" },
  { value: "recuperare",    label: "Recuperare",       sublabel: "Ore suplimentare",    icon: "🔄" },
];

const PRESENT_TYPES: PontajType[] = ["bucuresti", "cluj", "miercurea_ciuc", "brasov", "eveniment", "deplasare", "vizita_santier", "telemunca"];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
}
const TIME_SLOTS = generateTimeSlots();

function formatDuration(minutes: number) {
  if (!minutes) return "0h 00m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

function calcDuration(checkIn: string, checkOut: string, breakMin: number): number {
  if (!checkIn || !checkOut) return 0;
  const [ih, im] = checkIn.split(":").map(Number);
  const [oh, om] = checkOut.split(":").map(Number);
  return Math.max(0, (oh * 60 + om) - (ih * 60 + im) - breakMin);
}

function getLocationInfo(type: string): LocationDef {
  return LOCATIONS.find(l => l.value === type) ?? LOCATIONS[0];
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Extract HH:MM from a DB timestamp (stored as local time via setHours)
function extractLocalTime(dateVal: Date | string | null | undefined): string {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// A month is "closed" if it's strictly before the current month
function isMonthClosed(year: number, month: number): boolean {
  const currentMonthStart = startOfMonth(new Date());
  const targetMonthStart = new Date(year, month - 1, 1);
  return isBefore(targetMonthStart, currentMonthStart);
}

// ─── Edit state type ──────────────────────────────────────────────────────────
interface EditState {
  id: number;
  date: string;
  checkInTime: string;
  checkOutTime: string;
  type: PontajType;
  notes: string;
  breakMinutes: number;
  projectId: string;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Pontaj() {
  const utils = trpc.useUtils();
  const now = new Date();

  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [viewYear, setViewYear] = useState(now.getFullYear());

  // Add form
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [selectedLocation, setSelectedLocation] = useState<PontajType>("bucuresti");
  const [checkInTime, setCheckInTime] = useState("08:00");
  const [checkOutTime, setCheckOutTime] = useState("");
  const [breakMinutes, setBreakMinutes] = useState(0);
  const [notes, setNotes] = useState("");
  const [projectId, setProjectId] = useState("");

  // Edit dialog
  const [editEntry, setEditEntry] = useState<EditState | null>(null);

  // Queries
  const { data: todayPontaj } = trpc.pontaj.today.useQuery();
  const { data: monthData } = trpc.pontaj.monthReport.useQuery({ year: viewYear, month: viewMonth });
  const { data: projects } = trpc.projects.list.useQuery({ status: "activ" });

  const monthClosed = isMonthClosed(viewYear, viewMonth);

  // Mutations
  const manualEntry = trpc.pontaj.manualEntry.useMutation({
    onSuccess: () => {
      toast.success("Pontajul a fost salvat!");
      utils.pontaj.today.invalidate();
      utils.pontaj.monthReport.invalidate();
      setShowForm(false);
      setCheckOutTime("");
      setNotes("");
      setProjectId("");
    },
    onError: (err) => toast.error("Eroare: " + err.message),
  });

  const updateEntry = trpc.pontaj.updateEntry.useMutation({
    onSuccess: () => {
      toast.success("Pontajul a fost actualizat!");
      utils.pontaj.today.invalidate();
      utils.pontaj.monthReport.invalidate();
      setEditEntry(null);
    },
    onError: (err) => toast.error("Eroare: " + err.message),
  });

  const deleteEntry = trpc.pontaj.deleteEntry.useMutation({
    onSuccess: () => {
      toast.success("Înregistrarea a fost ștearsă.");
      utils.pontaj.today.invalidate();
      utils.pontaj.monthReport.invalidate();
    },
    onError: (err) => toast.error("Eroare: " + err.message),
  });

  const checkOutMutation = trpc.pontaj.checkOut.useMutation({
    onSuccess: (d) => {
      if (d.success) {
        toast.success("Check-out realizat!");
        utils.pontaj.today.invalidate();
        utils.pontaj.monthReport.invalidate();
      } else {
        toast.error(d.message ?? "Eroare");
      }
    },
  });

  // Computed
  const isCheckedIn = !!todayPontaj?.checkIn;
  const isCheckedOut = !!todayPontaj?.checkOut;

  const previewDuration = useMemo(() => {
    if (!checkInTime || !checkOutTime) return null;
    return formatDuration(calcDuration(checkInTime, checkOutTime, breakMinutes));
  }, [checkInTime, checkOutTime, breakMinutes]);

  const editPreviewDuration = useMemo(() => {
    if (!editEntry?.checkInTime || !editEntry?.checkOutTime) return null;
    return formatDuration(calcDuration(editEntry.checkInTime, editEntry.checkOutTime, editEntry.breakMinutes));
  }, [editEntry]);

  const totalMinutes = monthData?.reduce((acc, p) => acc + (p.totalMinutes ?? 0), 0) ?? 0;
  const presentDays = monthData?.filter(p => PRESENT_TYPES.includes(p.type as PontajType)).length ?? 0;

  const prevMonth = () => {
    if (viewMonth === 1) { setViewMonth(12); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 12) { setViewMonth(1); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const handleSave = () => {
    if (!checkInTime) { toast.error("Selectează ora de intrare"); return; }
    manualEntry.mutate({
      date: selectedDate,
      checkInTime,
      checkOutTime: checkOutTime || undefined,
      type: selectedLocation,
      notes: notes || undefined,
      projectId: projectId && projectId !== "fara" ? Number(projectId) : undefined,
      breakMinutes,
    });
  };

  const openEdit = (p: NonNullable<typeof monthData>[number]) => {
    const rawDate = p.date as unknown;
    const dateStr = typeof rawDate === "string" ? (rawDate as string).slice(0, 10) : format(new Date(rawDate as Date), "yyyy-MM-dd");
    setEditEntry({
      id: p.id,
      date: dateStr,
      checkInTime: extractLocalTime(p.checkIn),
      checkOutTime: extractLocalTime(p.checkOut),
      type: p.type as PontajType,
      notes: p.notes ?? "",
      breakMinutes: p.breakMinutes ?? 0,
      projectId: p.projectId ? String(p.projectId) : "",
    });
  };

  const handleUpdate = () => {
    if (!editEntry) return;
    updateEntry.mutate({
      id: editEntry.id,
      date: editEntry.date,
      checkInTime: editEntry.checkInTime,
      checkOutTime: editEntry.checkOutTime || undefined,
      type: editEntry.type,
      notes: editEntry.notes || undefined,
      projectId: editEntry.projectId && editEntry.projectId !== "fara" ? Number(editEntry.projectId) : undefined,
      breakMinutes: editEntry.breakMinutes,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Pontaj zilnic</h1>
          <p className="text-sm text-muted-foreground mt-0.5 capitalize">
            {format(new Date(), "EEEE, d MMMM yyyy", { locale: ro })}
          </p>
        </div>
        <Button
          onClick={() => setShowForm(v => !v)}
          className="bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] font-semibold gap-2"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Anulează" : "Adaugă pontaj"}
        </Button>
      </div>

      {/* Today status bar */}
      <Card className={`border-2 ${isCheckedIn && !isCheckedOut ? "border-green-400" : isCheckedOut ? "border-gray-300" : "border-dashed border-border"}`}>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${isCheckedIn && !isCheckedOut ? "bg-green-500 animate-pulse" : isCheckedOut ? "bg-gray-400" : "bg-red-400"}`} />
              <span className="text-sm font-semibold">
                {isCheckedOut ? "Zi încheiată" : isCheckedIn ? "Prezent" : "Neînregistrat azi"}
              </span>
            </div>
            {isCheckedIn && (
              <>
                <div className="text-sm text-muted-foreground">
                  Intrare: <span className="font-semibold text-foreground">{extractLocalTime(todayPontaj?.checkIn) || "—"}</span>
                </div>
                {isCheckedOut && (
                  <div className="text-sm text-muted-foreground">
                    Ieșire: <span className="font-semibold text-foreground">{extractLocalTime(todayPontaj?.checkOut) || "—"}</span>
                  </div>
                )}
                <div className="text-sm text-muted-foreground">
                  Total: <span className="font-semibold text-foreground">{formatDuration(todayPontaj?.totalMinutes ?? 0)}</span>
                </div>
                {todayPontaj?.type && (
                  <Badge variant="outline" className="text-xs gap-1">
                    {getLocationInfo(todayPontaj.type).icon} {getLocationInfo(todayPontaj.type).label}
                  </Badge>
                )}
              </>
            )}
            {isCheckedIn && !isCheckedOut && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => checkOutMutation.mutate()}
                disabled={checkOutMutation.isPending}
                className="ml-auto border-[#221F1F] text-[#221F1F] font-semibold gap-1.5 hover:bg-[#221F1F] hover:text-white"
              >
                <LogOut className="h-3.5 w-3.5" />
                Check-out acum
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Pontaj Form */}
      {showForm && (
        <Card className="border-2 border-[#FFCB09]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#FFCB09]" />
              Înregistrare pontaj
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Date */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">Data *</Label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                max={todayISO()}
                className="w-full sm:w-48 border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#FFCB09]"
              />
              {selectedDate && (
                <p className="text-xs text-muted-foreground mt-1 capitalize">
                  {format(parseISO(selectedDate), "EEEE, d MMMM yyyy", { locale: ro })}
                  {isWeekend(parseISO(selectedDate)) && (
                    <span className="ml-2 text-amber-600 font-medium">• Weekend</span>
                  )}
                </p>
              )}
            </div>

            <LocationSelector value={selectedLocation} onChange={setSelectedLocation} />

            <TimeSelectors
              checkInTime={checkInTime}
              checkOutTime={checkOutTime}
              breakMinutes={breakMinutes}
              onCheckIn={setCheckInTime}
              onCheckOut={setCheckOutTime}
              onBreak={setBreakMinutes}
            />

            {previewDuration && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-semibold text-green-700">Total ore lucrate: {previewDuration}</span>
              </div>
            )}

            <ProjectSelector projects={projects} value={projectId} onChange={setProjectId} />

            <div>
              <Label className="text-sm font-semibold mb-1.5 block flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Notă
                <span className="font-normal text-muted-foreground text-xs">(opțional)</span>
              </Label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="ex: Lucrat pe proiect Bloc X, ședință client, deplasare Brașov..."
                rows={2}
                className="resize-none text-sm"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Anulează</Button>
              <Button
                onClick={handleSave}
                disabled={manualEntry.isPending || !checkInTime}
                className="flex-1 bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] font-semibold gap-2"
              >
                {manualEntry.isPending
                  ? <span className="animate-spin inline-block h-4 w-4 border-2 border-[#221F1F] border-t-transparent rounded-full" />
                  : <CheckCircle2 className="h-4 w-4" />}
                Salvează pontaj
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Report */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[#FFCB09]" />
              Raport lunar
              {monthClosed && (
                <Badge variant="outline" className="text-xs text-amber-700 border-amber-300 bg-amber-50 ml-1">
                  🔒 Lună închisă
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center capitalize">
                {format(new Date(viewYear, viewMonth - 1), "MMMM yyyy", { locale: ro })}
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-muted rounded-lg p-3 text-center">
              <p className="text-lg font-bold">{presentDays}</p>
              <p className="text-xs text-muted-foreground">Zile prezent</p>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <p className="text-lg font-bold">{formatDuration(totalMinutes)}</p>
              <p className="text-xs text-muted-foreground">Total ore</p>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <p className="text-lg font-bold">{monthData?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">Înregistrări</p>
            </div>
          </div>

          {monthData && monthData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground">Data</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground">Locație</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground">Intrare</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground">Ieșire</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground">Pauză</th>
                    <th className="text-right py-2 px-2 text-xs font-semibold text-muted-foreground">Total</th>
                    {!monthClosed && (
                      <th className="text-right py-2 px-2 text-xs font-semibold text-muted-foreground">Acțiuni</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {monthData.map((p) => {
                    const loc = getLocationInfo(p.type);
                    const dateObj = new Date(typeof p.date === "string" ? p.date + "T12:00:00" : p.date);
                    const weekend = isWeekend(dateObj);
                    return (
                      <tr key={p.id} className={`border-b border-border/50 hover:bg-muted/50 ${weekend ? "bg-amber-50/40" : ""}`}>
                        <td className="py-2 px-2 text-xs">
                          <span className={weekend ? "text-amber-700 font-medium" : ""}>
                            {format(dateObj, "EEE, d MMM", { locale: ro })}
                          </span>
                        </td>
                        <td className="py-2 px-2">
                          <span className="text-xs flex items-center gap-1">
                            <span>{loc.icon}</span>
                            <span className="font-medium">{loc.label}</span>
                            <span className="text-muted-foreground hidden sm:inline text-[10px]">— {loc.sublabel}</span>
                          </span>
                        </td>
                        <td className="py-2 px-2 text-xs tabular-nums font-medium">
                          {extractLocalTime(p.checkIn) || "—"}
                        </td>
                        <td className="py-2 px-2 text-xs tabular-nums font-medium">
                          {extractLocalTime(p.checkOut) || "—"}
                        </td>
                        <td className="py-2 px-2 text-xs text-muted-foreground tabular-nums">
                          {p.breakMinutes ? `${p.breakMinutes}m` : "—"}
                        </td>
                        <td className="py-2 px-2 text-xs text-right font-semibold tabular-nums">
                          {formatDuration(p.totalMinutes ?? 0)}
                        </td>
                        {!monthClosed && (
                          <td className="py-2 px-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                onClick={() => openEdit(p)}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-red-600"
                                onClick={() => {
                                  if (confirm("Ștergi această înregistrare?")) {
                                    deleteEntry.mutate({ id: p.id });
                                  }
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/30">
                    <td colSpan={monthClosed ? 5 : 6} className="py-2 px-2 text-xs font-semibold text-right text-muted-foreground">
                      Total luna:
                    </td>
                    <td className="py-2 px-2 text-sm text-right font-bold">{formatDuration(totalMinutes)}</td>
                  </tr>
                </tfoot>
              </table>
              {monthClosed && (
                <p className="text-xs text-amber-700 mt-3 text-center bg-amber-50 border border-amber-200 rounded-lg py-2 px-3">
                  🔒 Luna este închisă — înregistrările nu mai pot fi modificate. Contactează HR pentru corecții.
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nu există înregistrări pentru această lună</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 gap-1.5"
                onClick={() => setShowForm(true)}
              >
                <Plus className="h-3.5 w-3.5" /> Adaugă primul pontaj
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editEntry} onOpenChange={() => setEditEntry(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-[#FFCB09]" />
              Editează pontaj
              {editEntry && (
                <span className="text-sm font-normal text-muted-foreground ml-1 capitalize">
                  — {format(parseISO(editEntry.date), "EEEE, d MMMM yyyy", { locale: ro })}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {editEntry && (
            <div className="space-y-5 py-2">
              <div>
                <Label className="text-sm font-semibold mb-2 block">Data</Label>
                <input
                  type="date"
                  value={editEntry.date}
                  onChange={e => setEditEntry(prev => prev ? { ...prev, date: e.target.value } : null)}
                  max={todayISO()}
                  className="w-full sm:w-48 border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#FFCB09]"
                />
              </div>

              <LocationSelector
                value={editEntry.type}
                onChange={v => setEditEntry(prev => prev ? { ...prev, type: v } : null)}
              />

              <TimeSelectors
                checkInTime={editEntry.checkInTime}
                checkOutTime={editEntry.checkOutTime}
                breakMinutes={editEntry.breakMinutes}
                onCheckIn={v => setEditEntry(prev => prev ? { ...prev, checkInTime: v } : null)}
                onCheckOut={v => setEditEntry(prev => prev ? { ...prev, checkOutTime: v } : null)}
                onBreak={v => setEditEntry(prev => prev ? { ...prev, breakMinutes: v } : null)}
              />

              {editPreviewDuration && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-700">Total ore lucrate: {editPreviewDuration}</span>
                </div>
              )}

              <ProjectSelector
                projects={projects}
                value={editEntry.projectId}
                onChange={v => setEditEntry(prev => prev ? { ...prev, projectId: v } : null)}
              />

              <div>
                <Label className="text-sm font-semibold mb-1.5 block">Notă</Label>
                <Textarea
                  value={editEntry.notes}
                  onChange={e => setEditEntry(prev => prev ? { ...prev, notes: e.target.value } : null)}
                  rows={2}
                  className="resize-none text-sm"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditEntry(null)}>Anulează</Button>
            <Button
              onClick={handleUpdate}
              disabled={updateEntry.isPending}
              className="bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] font-semibold gap-2"
            >
              {updateEntry.isPending
                ? <span className="animate-spin inline-block h-4 w-4 border-2 border-[#221F1F] border-t-transparent rounded-full" />
                : <CheckCircle2 className="h-4 w-4" />}
              Salvează modificările
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LocationSelector({ value, onChange }: { value: PontajType; onChange: (v: PontajType) => void }) {
  return (
    <div>
      <Label className="text-sm font-semibold mb-2 block">Locație / Tip prezență *</Label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {LOCATIONS.map(loc => {
          const isSelected = value === loc.value;
          return (
            <button
              key={loc.value}
              type="button"
              onClick={() => onChange(loc.value)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-medium transition-all duration-150 ${
                isSelected
                  ? "border-[#FFCB09] bg-[#FFCB09] text-[#221F1F] shadow-md ring-2 ring-[#FFCB09] ring-offset-1"
                  : "border-gray-200 bg-white text-gray-700 hover:border-[#FFCB09] hover:bg-yellow-50"
              }`}
            >
              <span className="text-xl leading-none">{loc.icon}</span>
              <span className="font-semibold">{loc.label}</span>
              <span className={`text-[10px] leading-tight text-center ${isSelected ? "text-[#221F1F]/70" : "text-gray-400"}`}>
                {loc.sublabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TimeSelectors({
  checkInTime, checkOutTime, breakMinutes,
  onCheckIn, onCheckOut, onBreak,
}: {
  checkInTime: string; checkOutTime: string; breakMinutes: number;
  onCheckIn: (v: string) => void; onCheckOut: (v: string) => void; onBreak: (v: number) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div>
        <Label className="text-sm font-semibold mb-1.5 block flex items-center gap-1.5">
          <LogIn className="h-3.5 w-3.5" /> Intrare *
        </Label>
        <Select value={checkInTime} onValueChange={onCheckIn}>
          <SelectTrigger>
            <SelectValue placeholder="Ora intrare" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {TIME_SLOTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-sm font-semibold mb-1.5 block flex items-center gap-1.5">
          <LogOut className="h-3.5 w-3.5" /> Ieșire
        </Label>
        <Select value={checkOutTime || "fara"} onValueChange={v => onCheckOut(v === "fara" ? "" : v)}>
          <SelectTrigger>
            <SelectValue placeholder="Ora ieșire" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            <SelectItem value="fara">— Fără ieșire —</SelectItem>
            {TIME_SLOTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-sm font-semibold mb-1.5 block flex items-center gap-1.5">
          <Coffee className="h-3.5 w-3.5" /> Pauză
        </Label>
        <Select value={String(breakMinutes)} onValueChange={v => onBreak(Number(v))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Fără pauză</SelectItem>
            <SelectItem value="15">15 minute</SelectItem>
            <SelectItem value="30">30 minute</SelectItem>
            <SelectItem value="45">45 minute</SelectItem>
            <SelectItem value="60">1 oră</SelectItem>
            <SelectItem value="90">1h 30min</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function ProjectSelector({
  projects, value, onChange,
}: {
  projects?: { id: number; name: string; code?: string | null }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label className="text-sm font-semibold mb-1.5 block flex items-center gap-1.5">
        <Briefcase className="h-3.5 w-3.5" /> Proiect asociat
        <span className="font-normal text-muted-foreground text-xs">(opțional)</span>
      </Label>
      <Select value={value || "fara"} onValueChange={v => onChange(v === "fara" ? "" : v)}>
        <SelectTrigger>
          <SelectValue placeholder="Selectează proiect..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="fara">— Fără proiect specific —</SelectItem>
          {projects?.map(p => (
            <SelectItem key={p.id} value={String(p.id)}>
              {p.name}{p.code ? ` (${p.code})` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
