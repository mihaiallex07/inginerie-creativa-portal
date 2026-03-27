import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, isSameDay, parseISO } from "date-fns";
import { ro } from "date-fns/locale";
import { useState, useMemo, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2, Pencil, Clock, CalendarDays } from "lucide-react";

// ─── Constants ───────────────────────────────────────────────────────────────
const ACTIVITY_TYPES = [
  { value: "proiectare",   label: "Proiectare",    color: "#3B82F6" },
  { value: "consultanta",  label: "Consultanță",   color: "#8B5CF6" },
  { value: "sedinta",      label: "Ședință",        color: "#EC4899" },
  { value: "documentare",  label: "Documentare",   color: "#6B7280" },
  { value: "deplasare",    label: "Deplasare",     color: "#F59E0B" },
  { value: "administrativ",label: "Administrativ", color: "#9CA3AF" },
  { value: "verificare",   label: "Verificare",    color: "#10B981" },
  { value: "executie",     label: "Execuție",      color: "#EF4444" },
] as const;

type ActivityType = typeof ACTIVITY_TYPES[number]["value"];

// Calendar hours range: 06:00 – 21:00 (15 hours)
const START_HOUR = 6;
const END_HOUR = 21;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const SLOT_HEIGHT = 48; // px per 30-min slot → 96px per hour
const HOUR_HEIGHT = SLOT_HEIGHT * 2;

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
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${m > 0 ? ` ${String(m).padStart(2, "0")}m` : ""}`;
}

function extractUTCTime(dateVal: Date | string | null | undefined): string {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getActivityColor(activityType: string, projectColor?: string | null): string {
  if (projectColor && projectColor !== "#FFCB09") return projectColor;
  return ACTIVITY_TYPES.find(a => a.value === activityType)?.color ?? "#3B82F6";
}

// ─── Dialog state ─────────────────────────────────────────────────────────────
interface EntryForm {
  id?: number;
  date: string;
  startTime: string;
  endTime: string;
  activityType: ActivityType;
  taskName: string;
  description: string;
  projectId: string;
  isBillable: boolean;
}

function defaultForm(date: string, startTime?: string): EntryForm {
  return {
    date,
    startTime: startTime ?? "09:00",
    endTime: startTime ? nextHalfHour(startTime) : "10:00",
    activityType: "proiectare",
    taskName: "",
    description: "",
    projectId: "",
    isBillable: true,
  };
}

function nextHalfHour(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + 30;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function TimeTracking() {
  const utils = trpc.useUtils();
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<EntryForm>(defaultForm(todayISO()));
  const [isEditing, setIsEditing] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const dateFrom = format(weekStart, "yyyy-MM-dd");
  const dateTo = format(weekEnd, "yyyy-MM-dd");

  const { data: entries = [], isLoading } = trpc.timeTracking.myEntries.useQuery({ dateFrom, dateTo });
  const { data: projects = [] } = trpc.projects.list.useQuery({ status: "activ" });

  const addEntry = trpc.timeTracking.addCalendarEntry.useMutation({
    onSuccess: () => {
      toast.success("Activitate adăugată!");
      utils.timeTracking.myEntries.invalidate();
      setDialogOpen(false);
    },
    onError: (e) => toast.error("Eroare: " + e.message),
  });

  const updateEntry = trpc.timeTracking.updateCalendarEntry.useMutation({
    onSuccess: () => {
      toast.success("Activitate actualizată!");
      utils.timeTracking.myEntries.invalidate();
      setDialogOpen(false);
    },
    onError: (e) => toast.error("Eroare: " + e.message),
  });

  const deleteEntry = trpc.timeTracking.deleteEntry.useMutation({
    onSuccess: () => {
      toast.success("Activitate ștearsă.");
      utils.timeTracking.myEntries.invalidate();
      setDialogOpen(false);
    },
    onError: (e) => toast.error("Eroare: " + e.message),
  });

  // Group entries by date
  const entriesByDate = useMemo(() => {
    const map: Record<string, typeof entries> = {};
    for (const e of entries) {
    const rawDate = e.date as unknown;
    const dateStr = typeof rawDate === "string" ? (rawDate as string).slice(0, 10) : format(new Date(rawDate as Date), "yyyy-MM-dd");
    if (!map[dateStr]) map[dateStr] = [];
    map[dateStr].push(e);
    }
    return map;
  }, [entries]);

  // Weekly totals
  const weeklyTotal = useMemo(() =>
    entries.reduce((acc, e) => acc + (e.durationMinutes ?? 0), 0),
    [entries]
  );

  const prevWeek = () => setWeekStart(w => subWeeks(w, 1));
  const nextWeek = () => setWeekStart(w => addWeeks(w, 1));
  const goToday = () => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  // Click on empty slot → open dialog with pre-filled time
  const handleSlotClick = useCallback((date: Date, slotIndex: number) => {
    const h = START_HOUR + Math.floor(slotIndex / 2);
    const m = slotIndex % 2 === 0 ? 0 : 30;
    const startTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    const dateStr = format(date, "yyyy-MM-dd");
    setForm(defaultForm(dateStr, startTime));
    setIsEditing(false);
    setDialogOpen(true);
  }, []);

  // Click on existing entry → open edit dialog
  const handleEntryClick = useCallback((e: React.MouseEvent, entry: typeof entries[number]) => {
    e.stopPropagation();
    const rawDate = entry.date as unknown;
    const dateStr = typeof rawDate === "string" ? (rawDate as string).slice(0, 10) : format(new Date(rawDate as Date), "yyyy-MM-dd");
    setForm({
      id: entry.id,
      date: dateStr,
      startTime: extractUTCTime(entry.startTime),
      endTime: extractUTCTime(entry.endTime),
      activityType: (entry.activityType as ActivityType) ?? "proiectare",
      taskName: entry.taskName ?? "",
      description: entry.description ?? "",
      projectId: entry.projectId ? String(entry.projectId) : "",
      isBillable: entry.isBillable ?? true,
    });
    setIsEditing(true);
    setDialogOpen(true);
  }, []);

  const handleSave = () => {
    if (!form.startTime || !form.endTime) {
      toast.error("Selectează ora de start și de final");
      return;
    }
    const payload = {
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      activityType: form.activityType,
      taskName: form.taskName || undefined,
      description: form.description || undefined,
      projectId: form.projectId && form.projectId !== "fara" ? Number(form.projectId) : undefined,
      isBillable: form.isBillable,
    };
    if (isEditing && form.id) {
      updateEntry.mutate({ id: form.id, ...payload });
    } else {
      addEntry.mutate(payload);
    }
  };

  const handleDelete = () => {
    if (!form.id) return;
    if (confirm("Ștergi această activitate?")) {
      deleteEntry.mutate({ id: form.id });
    }
  };

  // Compute entry position and height in the grid
  function getEntryStyle(entry: typeof entries[number]) {
    const startStr = extractUTCTime(entry.startTime);
    const endStr = extractUTCTime(entry.endTime);
    if (!startStr || !endStr) return null;
    const [sh, sm] = startStr.split(":").map(Number);
    const [eh, em] = endStr.split(":").map(Number);
    const startMinutes = sh * 60 + sm - START_HOUR * 60;
    const endMinutes = eh * 60 + em - START_HOUR * 60;
    if (startMinutes < 0 || endMinutes <= startMinutes) return null;
    const top = (startMinutes / 30) * SLOT_HEIGHT;
    const height = Math.max(SLOT_HEIGHT, ((endMinutes - startMinutes) / 30) * SLOT_HEIGHT);
    return { top, height };
  }

  const projectMap = useMemo(() => {
    const m: Record<number, { name: string; color: string | null }> = {};
    for (const p of projects) m[p.id] = { name: p.name, color: p.color ?? null };
    return m;
  }, [projects]);

  const isCurrentWeek = isSameDay(weekStart, startOfWeek(new Date(), { weekStartsOn: 1 }));

  const checkoutSlots = useMemo(() => {
    if (!form.startTime) return TIME_SLOTS;
    const [h, m] = form.startTime.split(":").map(Number);
    const minMinutes = h * 60 + m + 30;
    return TIME_SLOTS.filter(t => {
      const [th, tm] = t.split(":").map(Number);
      return th * 60 + tm >= minMinutes;
    });
  }, [form.startTime]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-foreground">Time-Tracking</h1>
          <Badge variant="outline" className="text-xs font-medium">
            {formatDuration(weeklyTotal)} săptămâna aceasta
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToday}
            className={isCurrentWeek
              ? "opacity-40 cursor-not-allowed"
              : "bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] font-bold border-[#FFCB09] hover:border-yellow-400"
            }
            disabled={isCurrentWeek}
          >
            Azi
          </Button>
          <div className="flex items-center border border-border rounded-lg overflow-hidden">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none" onClick={prevWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 text-sm font-medium min-w-[160px] text-center">
              {format(weekStart, "d MMM", { locale: ro })} – {format(weekEnd, "d MMM yyyy", { locale: ro })}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none" onClick={nextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button
            size="sm"
            className="bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] font-semibold gap-1.5"
            onClick={() => {
              setForm(defaultForm(todayISO()));
              setIsEditing(false);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Adaugă
          </Button>
        </div>
      </div>

      {/* ── Calendar grid ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Time gutter */}
        <div className="w-14 shrink-0 border-r border-border bg-background overflow-hidden">
          <div className="h-10 border-b border-border" /> {/* header spacer */}
          <div className="relative" style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}>
            {Array.from({ length: TOTAL_HOURS }, (_, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 flex items-start justify-end pr-2"
                style={{ top: i * HOUR_HEIGHT, height: HOUR_HEIGHT }}
              >
                <span className="text-[10px] text-muted-foreground font-medium -mt-2 tabular-nums">
                  {String(START_HOUR + i).padStart(2, "0")}:00
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Days columns */}
        <div className="flex flex-1 overflow-x-auto overflow-y-auto" ref={gridRef}>
          {weekDays.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const dayEntries = entriesByDate[dateStr] ?? [];
            const isToday = isSameDay(day, new Date());
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;

            return (
              <div key={dateStr} className="flex-1 min-w-[120px] border-r border-border last:border-r-0 flex flex-col">
                {/* Day header */}
                <div className={`h-10 border-b border-border flex flex-col items-center justify-center shrink-0 sticky top-0 z-10 ${
                  isToday ? "bg-[#FFCB09]" : isWeekend ? "bg-[#2a2727]" : "bg-[#221F1F]"
                }`}>
                  <span className={`text-[10px] uppercase font-semibold tracking-wide ${
                    isToday ? "text-[#221F1F]" : "text-[#FFCB09]"
                  }`}>
                    {format(day, "EEE", { locale: ro })}
                  </span>
                  <span className={`text-sm font-bold leading-none ${
                    isToday ? "text-[#221F1F]" : "text-white"
                  }`}>
                    {format(day, "d")}
                  </span>
                </div>

                {/* Slots */}
                <div
                  className={`relative flex-1 ${isWeekend ? "bg-muted/20" : ""}`}
                  style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}
                  onClick={(e) => {
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    const y = e.clientY - rect.top;
                    const slotIndex = Math.floor(y / SLOT_HEIGHT);
                    handleSlotClick(day, slotIndex);
                  }}
                >
                  {/* Hour lines */}
                  {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                    <div
                      key={i}
                      className="absolute left-0 right-0 border-t border-border/50"
                      style={{ top: i * HOUR_HEIGHT }}
                    />
                  ))}
                  {/* Half-hour lines */}
                  {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                    <div
                      key={`half-${i}`}
                      className="absolute left-0 right-0 border-t border-border/20 border-dashed"
                      style={{ top: i * HOUR_HEIGHT + SLOT_HEIGHT }}
                    />
                  ))}

                  {/* Entries */}
                  {dayEntries.map((entry) => {
                    const style = getEntryStyle(entry);
                    if (!style) return null;
                    const proj = entry.projectId ? projectMap[entry.projectId] : null;
                    const color = getActivityColor(entry.activityType ?? "proiectare", proj?.color);
                    const actLabel = ACTIVITY_TYPES.find(a => a.value === entry.activityType)?.label ?? entry.activityType;
                    const duration = entry.durationMinutes ?? 0;
                    const isShort = style.height < SLOT_HEIGHT * 1.5;

                    return (
                      <div
                        key={entry.id}
                        className="absolute left-0.5 right-0.5 rounded overflow-hidden cursor-pointer group transition-all hover:brightness-90 hover:shadow-md z-10"
                        style={{
                          top: style.top,
                          height: style.height,
                          backgroundColor: color + "55",
                          borderLeft: `3px solid ${color}`,
                          boxShadow: `inset 0 0 0 1px ${color}44`,
                        }}
                        onClick={(e) => handleEntryClick(e, entry)}
                      >
                        <div className="px-1.5 py-0.5 h-full flex flex-col justify-start overflow-hidden">
                          {isShort ? (
                            <span className="text-[10px] font-semibold truncate leading-tight text-white">
                              {entry.taskName || actLabel}
                            </span>
                          ) : (
                            <>
                              <span className="text-[11px] font-bold truncate leading-tight text-white">
                                {entry.taskName || actLabel}
                              </span>
                              {proj && (
                                <span className="text-[9px] truncate leading-tight" style={{ color: color + "cc" }}>
                                  {proj.name}
                                </span>
                              )}
                              <span className="text-[9px] leading-tight mt-auto" style={{ color: color + "cc" }}>
                                {formatDuration(duration)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="shrink-0 border-t border-border bg-background px-4 py-2 flex items-center gap-4 overflow-x-auto">
        <span className="text-xs text-muted-foreground font-medium shrink-0">Tipuri:</span>
        {ACTIVITY_TYPES.map(a => (
          <div key={a.value} className="flex items-center gap-1 shrink-0">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: a.color }} />
            <span className="text-xs text-muted-foreground">{a.label}</span>
          </div>
        ))}
      </div>

      {/* ── Add / Edit Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isEditing ? <Pencil className="h-4 w-4 text-[#FFCB09]" /> : <Plus className="h-4 w-4 text-[#FFCB09]" />}
              {isEditing ? "Editează activitate" : "Adaugă activitate"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {/* Task name */}
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Titlu activitate</Label>
              <Input
                placeholder="ex: Redactare plan arhitectural NOVV B2..."
                value={form.taskName}
                onChange={e => setForm(f => ({ ...f, taskName: e.target.value }))}
                className="text-sm"
              />
            </div>

            {/* Date */}
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Data</Label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                max={todayISO()}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#FFCB09]"
              />
            </div>

            {/* Time range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-semibold mb-1.5 block">Ora start</Label>
                <Select value={form.startTime} onValueChange={v => {
                  setForm(f => {
                    const [h, m] = v.split(":").map(Number);
                    const minEnd = h * 60 + m + 30;
                    const [eh, em] = f.endTime.split(":").map(Number);
                    const endOk = eh * 60 + em >= minEnd;
                    return { ...f, startTime: v, endTime: endOk ? f.endTime : nextHalfHour(v) };
                  });
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {TIME_SLOTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-semibold mb-1.5 block">Ora final</Label>
                <Select value={form.endTime} onValueChange={v => setForm(f => ({ ...f, endTime: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {checkoutSlots.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Duration preview */}
            {form.startTime && form.endTime && (() => {
              const [sh, sm] = form.startTime.split(":").map(Number);
              const [eh, em] = form.endTime.split(":").map(Number);
              const dur = (eh * 60 + em) - (sh * 60 + sm);
              if (dur <= 0) return null;
              return (
                <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                  <Clock className="h-3.5 w-3.5 text-yellow-600" />
                  <span className="text-sm font-semibold text-yellow-700">Durată: {formatDuration(dur)}</span>
                </div>
              );
            })()}

            {/* Activity type */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">Tip activitate</Label>
              <div className="grid grid-cols-4 gap-1.5">
                {ACTIVITY_TYPES.map(a => (
                  <button
                    key={a.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, activityType: a.value }))}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 text-xs font-medium transition-all ${
                      form.activityType === a.value
                        ? "border-current shadow-sm"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    style={form.activityType === a.value ? { borderColor: a.color, backgroundColor: a.color + "15", color: a.color } : {}}
                  >
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: a.color }} />
                    <span className="leading-tight text-center">{a.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Project */}
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Proiect</Label>
              <Select value={form.projectId || "fara"} onValueChange={v => setForm(f => ({ ...f, projectId: v === "fara" ? "" : v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectează proiect..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fara">— Fără proiect specific —</SelectItem>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}{p.code ? ` (${p.code})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Descriere <span className="font-normal text-muted-foreground text-xs">(opțional)</span></Label>
              <Textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
                className="resize-none text-sm"
                placeholder="Detalii suplimentare..."
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            {isEditing && (
              <Button
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50 mr-auto"
                onClick={handleDelete}
                disabled={deleteEntry.isPending}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Șterge
              </Button>
            )}
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Anulează</Button>
            <Button
              onClick={handleSave}
              disabled={addEntry.isPending || updateEntry.isPending}
              className="bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] font-semibold"
            >
              {(addEntry.isPending || updateEntry.isPending) ? (
                <span className="animate-spin inline-block h-4 w-4 border-2 border-[#221F1F] border-t-transparent rounded-full mr-2" />
              ) : null}
              {isEditing ? "Salvează" : "Adaugă"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
