import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format, getDaysInMonth, parseISO, isToday, isWeekend } from "date-fns";
import { ro } from "date-fns/locale";
import { useState, useMemo } from "react";
import {
  CheckCircle2, Clock, LogIn, LogOut, Coffee,
  ChevronLeft, ChevronRight, CalendarDays, MapPin,
  FileText, Briefcase, Plus, X
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
type PontajType = "birou" | "remote" | "deplasare" | "concediu" | "medical" | "liber_legal" | "absent" | "recuperare" | "santier" | "eveniment";

const LOCATIONS: { value: PontajType; label: string; icon: string; color: string; bg: string }[] = [
  { value: "birou",       label: "Birou",           icon: "🏢", color: "text-blue-700",   bg: "bg-blue-50 border-blue-200 hover:bg-blue-100" },
  { value: "remote",      label: "Telemuncă",        icon: "🏠", color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200 hover:bg-indigo-100" },
  { value: "santier",     label: "Șantier",          icon: "🏗️", color: "text-orange-700", bg: "bg-orange-50 border-orange-200 hover:bg-orange-100" },
  { value: "deplasare",   label: "Deplasare",        icon: "🚗", color: "text-purple-700", bg: "bg-purple-50 border-purple-200 hover:bg-purple-100" },
  { value: "eveniment",   label: "Eveniment",        icon: "📅", color: "text-pink-700",   bg: "bg-pink-50 border-pink-200 hover:bg-pink-100" },
  { value: "concediu",    label: "Concediu",         icon: "🌴", color: "text-amber-700",  bg: "bg-amber-50 border-amber-200 hover:bg-amber-100" },
  { value: "medical",     label: "Medical",          icon: "🏥", color: "text-red-700",    bg: "bg-red-50 border-red-200 hover:bg-red-100" },
  { value: "liber_legal", label: "Liber legal",      icon: "📋", color: "text-gray-700",   bg: "bg-gray-50 border-gray-200 hover:bg-gray-100" },
  { value: "recuperare",  label: "Recuperare",       icon: "🔄", color: "text-teal-700",   bg: "bg-teal-50 border-teal-200 hover:bg-teal-100" },
  { value: "absent",      label: "Absent",           icon: "❌", color: "text-red-700",    bg: "bg-red-50 border-red-200 hover:bg-red-100" },
];

// ─── Generate 30-min time slots ──────────────────────────────────────────────
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
  const total = (oh * 60 + om) - (ih * 60 + im) - breakMin;
  return Math.max(0, total);
}

function getLocationInfo(type: string) {
  return LOCATIONS.find(l => l.value === type) ?? LOCATIONS[0];
}

function todayISO() {
  return format(new Date(), "yyyy-MM-dd");
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function Pontaj() {
  const utils = trpc.useUtils();

  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [viewYear, setViewYear] = useState(now.getFullYear());

  // Form state
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [selectedLocation, setSelectedLocation] = useState<PontajType>("birou");
  const [checkInTime, setCheckInTime] = useState("08:00");
  const [checkOutTime, setCheckOutTime] = useState("");
  const [breakMinutes, setBreakMinutes] = useState(0);
  const [notes, setNotes] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [showForm, setShowForm] = useState(false);

  // Queries
  const { data: todayPontaj, isLoading } = trpc.pontaj.today.useQuery();
  const { data: monthData } = trpc.pontaj.monthReport.useQuery({ year: viewYear, month: viewMonth });
  const { data: projects } = trpc.projects.list.useQuery({ status: "activ" });

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

  const checkOut = trpc.pontaj.checkOut.useMutation({
    onSuccess: (d) => {
      if (d.success) { toast.success("Check-out realizat!"); utils.pontaj.today.invalidate(); utils.pontaj.monthReport.invalidate(); }
      else toast.error(d.message ?? "Eroare");
    },
  });

  // Computed
  const isCheckedIn = !!todayPontaj?.checkIn;
  const isCheckedOut = !!todayPontaj?.checkOut;

  const previewDuration = useMemo(() => {
    if (!checkInTime || !checkOutTime) return null;
    const mins = calcDuration(checkInTime, checkOutTime, breakMinutes);
    return formatDuration(mins);
  }, [checkInTime, checkOutTime, breakMinutes]);

  const prevMonth = () => {
    if (viewMonth === 1) { setViewMonth(12); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 12) { setViewMonth(1); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const totalMinutes = monthData?.reduce((acc, p) => acc + (p.totalMinutes ?? 0), 0) ?? 0;
  const presentDays = monthData?.filter(p => ["birou", "remote", "deplasare", "santier", "eveniment"].includes(p.type)).length ?? 0;

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
                  Intrare: <span className="font-semibold text-foreground">
                    {todayPontaj?.checkIn ? format(new Date(todayPontaj.checkIn), "HH:mm") : "—"}
                  </span>
                </div>
                {isCheckedOut && (
                  <div className="text-sm text-muted-foreground">
                    Ieșire: <span className="font-semibold text-foreground">
                      {todayPontaj?.checkOut ? format(new Date(todayPontaj.checkOut), "HH:mm") : "—"}
                    </span>
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
                onClick={() => checkOut.mutate()}
                disabled={checkOut.isPending}
                className="ml-auto border-[#221F1F] text-[#221F1F] font-semibold gap-1.5 hover:bg-[#221F1F] hover:text-white"
              >
                <LogOut className="h-3.5 w-3.5" />
                Check-out acum
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pontaj Form */}
      {showForm && (
        <Card className="border-2 border-[#FFCB09]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#FFCB09]" />
              Înregistrare pontaj
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">

            {/* Date selector */}
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

            {/* Location selector */}
            <div>
              <Label className="text-sm font-semibold mb-2 block flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Locație / Tip prezență *
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {LOCATIONS.map(loc => (
                  <button
                    key={loc.value}
                    type="button"
                    onClick={() => setSelectedLocation(loc.value)}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border-2 text-xs font-medium transition-all ${
                      selectedLocation === loc.value
                        ? "border-[#FFCB09] bg-[#FFCB09]/10 text-[#221F1F]"
                        : `${loc.bg} ${loc.color} border`
                    }`}
                  >
                    <span className="text-lg leading-none">{loc.icon}</span>
                    <span>{loc.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-semibold mb-1.5 block flex items-center gap-1.5">
                  <LogIn className="h-3.5 w-3.5" /> Intrare *
                </Label>
                <Select value={checkInTime} onValueChange={setCheckInTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ora intrare" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {TIME_SLOTS.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-semibold mb-1.5 block flex items-center gap-1.5">
                  <LogOut className="h-3.5 w-3.5" /> Ieșire
                </Label>
                <Select value={checkOutTime || "fara"} onValueChange={v => setCheckOutTime(v === "fara" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ora ieșire (opțional)" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="fara">— Fără ieșire —</SelectItem>
                    {TIME_SLOTS.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-semibold mb-1.5 block flex items-center gap-1.5">
                  <Coffee className="h-3.5 w-3.5" /> Pauză
                </Label>
                <Select value={String(breakMinutes)} onValueChange={v => setBreakMinutes(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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

            {/* Duration preview */}
            {previewDuration && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-semibold text-green-700">Total ore lucrate: {previewDuration}</span>
              </div>
            )}

            {/* Project association */}
            <div>
              <Label className="text-sm font-semibold mb-1.5 block flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5" /> Proiect asociat
                <span className="font-normal text-muted-foreground text-xs">(opțional — pentru pontaj pe proiect specific)</span>
              </Label>
              <Select value={projectId || "fara"} onValueChange={v => setProjectId(v === "fara" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectează proiect..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fara">— Fără proiect specific —</SelectItem>
                  {projects?.map(p => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name} {p.code ? `(${p.code})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(!projects || projects.length === 0) && (
                <p className="text-xs text-muted-foreground mt-1">Nu există proiecte active. Adaugă proiecte din secțiunea Proiecte (Drive).</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <Label className="text-sm font-semibold mb-1.5 block flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Notă / Observație
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

            {/* Submit */}
            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
                className="flex-1"
              >
                Anulează
              </Button>
              <Button
                onClick={handleSave}
                disabled={manualEntry.isPending || !checkInTime}
                className="flex-1 bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] font-semibold gap-2"
              >
                {manualEntry.isPending ? (
                  <span className="animate-spin inline-block h-4 w-4 border-2 border-[#221F1F] border-t-transparent rounded-full" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
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
          {/* Summary */}
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

          {/* Table */}
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
                  </tr>
                </thead>
                <tbody>
                  {monthData.map((p) => {
                    const loc = getLocationInfo(p.type);
                    const dateObj = new Date(p.date);
                    const weekend = isWeekend(dateObj);
                    return (
                      <tr key={p.id} className={`border-b border-border/50 hover:bg-muted/50 ${weekend ? "bg-amber-50/50" : ""}`}>
                        <td className="py-2 px-2 text-xs">
                          <span className={weekend ? "text-amber-700 font-medium" : ""}>
                            {format(dateObj, "EEE, d MMM", { locale: ro })}
                          </span>
                        </td>
                        <td className="py-2 px-2">
                          <span className="text-xs flex items-center gap-1">
                            <span>{loc.icon}</span>
                            <span className={loc.color}>{loc.label}</span>
                          </span>
                        </td>
                        <td className="py-2 px-2 text-xs tabular-nums font-medium">
                          {p.checkIn ? format(new Date(p.checkIn), "HH:mm") : "—"}
                        </td>
                        <td className="py-2 px-2 text-xs tabular-nums font-medium">
                          {p.checkOut ? format(new Date(p.checkOut), "HH:mm") : "—"}
                        </td>
                        <td className="py-2 px-2 text-xs text-muted-foreground tabular-nums">
                          {p.breakMinutes ? `${p.breakMinutes}m` : "—"}
                        </td>
                        <td className="py-2 px-2 text-xs text-right font-semibold tabular-nums">
                          {formatDuration(p.totalMinutes ?? 0)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/30">
                    <td colSpan={5} className="py-2 px-2 text-xs font-semibold text-right text-muted-foreground">Total luna:</td>
                    <td className="py-2 px-2 text-sm text-right font-bold text-[#221F1F]">{formatDuration(totalMinutes)}</td>
                  </tr>
                </tfoot>
              </table>
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
    </div>
  );
}
