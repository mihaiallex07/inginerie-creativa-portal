import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  format, startOfWeek, endOfWeek, addDays, subWeeks, addWeeks,
  isSameDay, startOfMonth, endOfMonth, addMonths, subMonths,
  getWeek, getDay, parseISO, isToday,
} from "date-fns";
import { ro } from "date-fns/locale";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, ExternalLink, Cake, Flag, Lock } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────
const START_HOUR = 6;
const END_HOUR = 23;
const TOTAL_HOURS = END_HOUR - START_HOUR + 1; // 18 hours shown
const SLOT_HEIGHT = 40; // px per 30-min slot
const TOTAL_SLOTS = TOTAL_HOURS * 2;

const ACTIVITY_TYPES = [
  { value: "proiectare", label: "Proiectare", color: "#3B82F6" },
  { value: "consultanta", label: "Consultanță", color: "#8B5CF6" },
  { value: "sedinta", label: "Ședință", color: "#F59E0B" },
  { value: "documentare", label: "Documentare", color: "#10B981" },
  { value: "deplasare", label: "Deplasare", color: "#EF4444" },
  { value: "administrativ", label: "Administrativ", color: "#6B7280" },
  { value: "verificare", label: "Verificare", color: "#EC4899" },
  { value: "executie", label: "Execuție", color: "#14B8A6" },
] as const;
type ActivityType = typeof ACTIVITY_TYPES[number]["value"];

// ─── Romanian public holidays (fixed + moveable) ─────────────────────────────
function getRomanianHolidays(year: number): Record<string, string> {
  const h: Record<string, string> = {};
  const add = (m: number, d: number, name: string) => {
    h[`${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`] = name;
  };
  add(1, 1, "Anul Nou"); add(1, 2, "Anul Nou");
  add(1, 24, "Unirea Principatelor");
  add(5, 1, "Ziua Muncii");
  add(6, 1, "Ziua Copilului");
  add(8, 15, "Adormirea Maicii Domnului");
  add(11, 30, "Sf. Andrei");
  add(12, 1, "Ziua Națională");
  add(12, 25, "Crăciun"); add(12, 26, "Crăciun");
  // Easter (Orthodox) — approximate for 2025-2027
  const easterDates: Record<number, [number, number]> = { 2024: [5, 5], 2025: [4, 20], 2026: [4, 5], 2027: [4, 25] };
  const e = easterDates[year];
  if (e) {
    const easter = new Date(year, e[0] - 1, e[1]);
    const fmt = (d: Date) => format(d, "yyyy-MM-dd");
    h[fmt(addDays(easter, -2))] = "Vinerea Mare";
    h[fmt(easter)] = "Paști";
    h[fmt(addDays(easter, 1))] = "Paști";
    h[fmt(addDays(easter, 49))] = "Rusalii";
    h[fmt(addDays(easter, 50))] = "Rusalii";
  }
  return h;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayISO() { return format(new Date(), "yyyy-MM-dd"); }
function extractUTCTime(ts: Date | string | null | undefined): string {
  if (!ts) return "";
  const d = typeof ts === "string" ? new Date(ts) : ts;
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}
function formatDuration(minutes: number) {
  if (!minutes) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ""}` : `${m}m`;
}
const TIME_SLOTS = Array.from({ length: 24 * 2 }, (_, i) => {
  const h = Math.floor(i / 2); const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

type EntryForm = {
  id?: number; date: string; startTime: string; endTime: string;
  activityType: ActivityType; taskName: string; description: string;
  projectId: string; isBillable: boolean;
};
function defaultForm(date = todayISO(), startTime = "09:00"): EntryForm {
  return { date, startTime, endTime: "10:00", activityType: "proiectare", taskName: "", description: "", projectId: "", isBillable: true };
}

// ─── Mini Calendar ────────────────────────────────────────────────────────────
function MiniCalendar({ selectedDate, onSelectDate, weekStart }: {
  selectedDate: Date; onSelectDate: (d: Date) => void; weekStart: Date;
}) {
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(selectedDate));
  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const days: Date[] = [];
  let d = calStart;
  while (d <= monthEnd || days.length % 7 !== 0) {
    days.push(d);
    d = addDays(d, 1);
    if (days.length > 42) break;
  }
  const weekDays = ["L", "M", "M", "J", "V", "S", "D"];
  const isInCurrentWeek = (day: Date) => day >= weekStart && day <= addDays(weekStart, 6);

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setViewMonth(m => subMonths(m, 1))} className="p-0.5 rounded hover:bg-[#FFCB09]/20 text-foreground">
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="text-xs font-semibold text-foreground capitalize">
          {format(viewMonth, "MMMM yyyy", { locale: ro })}
        </span>
        <button onClick={() => setViewMonth(m => addMonths(m, 1))} className="p-0.5 rounded hover:bg-[#FFCB09]/20 text-foreground">
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0 mb-1">
        {weekDays.map((wd, i) => (
          <div key={i} className="text-center text-[10px] font-semibold text-muted-foreground py-0.5">{wd}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0">
        {days.map((day, i) => {
          const isThisMonth = day.getMonth() === viewMonth.getMonth();
          const isTodayDay = isToday(day);
          const isSelected = isSameDay(day, selectedDate);
          const inWeek = isInCurrentWeek(day);
          return (
            <button key={i} onClick={() => onSelectDate(day)}
              className={cn(
                "text-[11px] h-6 w-full rounded text-center transition-colors",
                !isThisMonth && "text-muted-foreground/40",
                isThisMonth && !isTodayDay && !isSelected && "text-foreground hover:bg-[#FFCB09]/20",
                inWeek && !isTodayDay && !isSelected && "bg-[#FFCB09]/10",
                isTodayDay && !isSelected && "bg-[#FFCB09] text-[#221F1F] font-bold rounded-full",
                isSelected && "bg-[#221F1F] text-[#FFCB09] font-bold rounded-full",
              )}>
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Time Insights ─────────────────────────────────────────────────────────────
function TimeInsights({ entries, weekStart }: { entries: any[]; weekStart: Date }) {
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const weekEnd = addDays(weekStart, 6);
  const monthStart = startOfMonth(today);

  const todayMins = useMemo(() => entries.filter(e => {
    const ds = typeof e.date === "string" ? e.date.slice(0, 10) : format(new Date(e.date), "yyyy-MM-dd");
    return ds === todayStr;
  }).reduce((s, e) => s + (e.durationMinutes ?? 0), 0), [entries, todayStr]);

  const weekMins = useMemo(() => entries.filter(e => {
    const d = typeof e.date === "string" ? parseISO(e.date.slice(0, 10)) : new Date(e.date);
    return d >= weekStart && d <= weekEnd;
  }).reduce((s, e) => s + (e.durationMinutes ?? 0), 0), [entries, weekStart, weekEnd]);

  const byType = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of entries) {
      const t = e.activityType ?? "proiectare";
      map[t] = (map[t] ?? 0) + (e.durationMinutes ?? 0);
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [entries]);

  const totalWeekMins = byType.reduce((s, [, m]) => s + m, 0);

  return (
    <div className="space-y-3">
      <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Time Insights</div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#221F1F] rounded-lg p-2 text-center">
          <div className="text-[10px]" style={{ color: '#ffffff' }}>Azi</div>
          <div className="text-sm font-bold text-[#FFCB09]">{formatDuration(todayMins)}</div>
        </div>
        <div className="bg-[#221F1F] rounded-lg p-2 text-center">
          <div className="text-[10px]" style={{ color: '#ffffff' }}>Săptămână</div>
          <div className="text-sm font-bold text-[#FFCB09]">{formatDuration(weekMins)}</div>
        </div>
      </div>
      {byType.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] font-semibold text-muted-foreground">Per tip activitate</div>
          {byType.slice(0, 5).map(([type, mins]) => {
            const act = ACTIVITY_TYPES.find(a => a.value === type);
            const pct = totalWeekMins > 0 ? Math.round((mins / totalWeekMins) * 100) : 0;
            return (
              <div key={type} className="space-y-0.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-foreground/80">{act?.label ?? type}</span>
                  <span className="text-muted-foreground">{formatDuration(mins)}</span>
                </div>
                <div className="h-1 bg-border rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: act?.color ?? "#FFCB09" }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function TimeTracking() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const isAdmin = user?.role === "admin";

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [form, setForm] = useState<EntryForm>(defaultForm());
  const [isEditing, setIsEditing] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const dateFrom = format(weekStart, "yyyy-MM-dd");
  const dateTo = format(weekEnd, "yyyy-MM-dd");
  const weekNumber = getWeek(weekStart, { weekStartsOn: 1 });

  const { data: entries = [] } = trpc.timeTracking.myEntries.useQuery({ dateFrom, dateTo });
  const { data: projects = [] } = trpc.projects.list.useQuery({ status: "activ" });
  const { data: companyEvents = [] } = trpc.companyEvents.list.useQuery({ dateFrom, dateTo });
  const { data: birthdays = [] } = trpc.people.upcomingBirthdays.useQuery({ daysAhead: 365 });

  const holidays = useMemo(() => {
    const year = weekStart.getFullYear();
    return { ...getRomanianHolidays(year), ...getRomanianHolidays(year + 1) };
  }, [weekStart]);

  // Birthdays this week
  const birthdaysThisWeek = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const b of birthdays) {
      if (!b.birthDate) continue;
      const bd = typeof b.birthDate === "string" ? b.birthDate : format(new Date(b.birthDate as any), "yyyy-MM-dd");
      // Match month-day against week days
      const monthDay = bd.slice(5); // MM-DD
      for (const day of weekDays) {
        const dayMonthDay = format(day, "MM-dd");
        if (dayMonthDay === monthDay) {
          const key = format(day, "yyyy-MM-dd");
          if (!map[key]) map[key] = [];
          map[key].push(b.name ?? "Coleg");
        }
      }
    }
    return map;
  }, [birthdays, weekDays]);

  const addEntry = trpc.timeTracking.addCalendarEntry.useMutation({
    onSuccess: () => { toast.success("Activitate adăugată!"); utils.timeTracking.myEntries.invalidate(); setDialogOpen(false); },
    onError: (e) => toast.error("Eroare: " + e.message),
  });
  const updateEntry = trpc.timeTracking.updateCalendarEntry.useMutation({
    onSuccess: () => { toast.success("Activitate actualizată!"); utils.timeTracking.myEntries.invalidate(); setDialogOpen(false); },
    onError: (e) => toast.error("Eroare: " + e.message),
  });
  const deleteEntry = trpc.timeTracking.deleteEntry.useMutation({
    onSuccess: () => { toast.success("Activitate ștearsă."); utils.timeTracking.myEntries.invalidate(); setDialogOpen(false); },
    onError: (e) => toast.error("Eroare: " + e.message),
  });
  const createEvent = trpc.companyEvents.create.useMutation({
    onSuccess: () => { toast.success("Eveniment creat!"); utils.companyEvents.list.invalidate(); setAdminDialogOpen(false); },
    onError: (e) => toast.error("Eroare: " + e.message),
  });
  const deleteEvent = trpc.companyEvents.delete.useMutation({
    onSuccess: () => { toast.success("Eveniment șters."); utils.companyEvents.list.invalidate(); },
    onError: (e) => toast.error("Eroare: " + e.message),
  });

  // Group entries by date
  const entriesByDate = useMemo(() => {
    const map: Record<string, typeof entries> = {};
    for (const e of entries) {
      const ds = typeof e.date === "string" ? (e.date as string).slice(0, 10) : format(new Date(e.date as any), "yyyy-MM-dd");
      if (!map[ds]) map[ds] = [];
      map[ds].push(e);
    }
    return map;
  }, [entries]);

  // Group company events by date
  const eventsByDate = useMemo(() => {
    const map: Record<string, typeof companyEvents> = {};
    for (const ev of companyEvents) {
      const ds = format(new Date(ev.startTime), "yyyy-MM-dd");
      if (!map[ds]) map[ds] = [];
      map[ds].push(ev);
    }
    return map;
  }, [companyEvents]);

  const projectMap = useMemo(() => {
    const m: Record<number, { name: string; color: string | null }> = {};
    for (const p of projects) m[p.id] = { name: p.name, color: p.color ?? null };
    return m;
  }, [projects]);

  const todayWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const isCurrentWeek = weekStart.getTime() === todayWeekStart.getTime();

  const prevWeek = () => setWeekStart(w => subWeeks(w, 1));
  const nextWeek = () => setWeekStart(w => addWeeks(w, 1));
  const goToday = () => { setWeekStart(todayWeekStart); setSelectedDate(new Date()); };

  const handleSlotClick = useCallback((date: Date, slotIndex: number) => {
    const h = START_HOUR + Math.floor(slotIndex / 2);
    const m = slotIndex % 2 === 0 ? 0 : 30;
    const startTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    setForm(defaultForm(format(date, "yyyy-MM-dd"), startTime));
    setIsEditing(false);
    setDialogOpen(true);
  }, []);

  const handleEntryClick = useCallback((e: React.MouseEvent, entry: typeof entries[number]) => {
    e.stopPropagation();
    const ds = typeof entry.date === "string" ? (entry.date as string).slice(0, 10) : format(new Date(entry.date as any), "yyyy-MM-dd");
    setForm({
      id: entry.id, date: ds,
      startTime: extractUTCTime(entry.startTime),
      endTime: extractUTCTime(entry.endTime),
      activityType: (entry.activityType as ActivityType) ?? "proiectare",
      taskName: entry.taskName ?? "", description: entry.description ?? "",
      projectId: entry.projectId ? String(entry.projectId) : "",
      isBillable: entry.isBillable ?? true,
    });
    setIsEditing(true);
    setDialogOpen(true);
  }, []);

  const handleSave = () => {
    if (!form.startTime || !form.endTime) { toast.error("Selectează ora de start și de final"); return; }
    const payload = {
      date: form.date, startTime: form.startTime, endTime: form.endTime,
      activityType: form.activityType, taskName: form.taskName || undefined,
      description: form.description || undefined,
      projectId: form.projectId && form.projectId !== "fara" ? Number(form.projectId) : undefined,
      isBillable: form.isBillable,
    };
    if (isEditing && form.id) updateEntry.mutate({ id: form.id, ...payload });
    else addEntry.mutate(payload);
  };

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

  function getEventStyle(ev: typeof companyEvents[number]) {
    const start = new Date(ev.startTime);
    const end = new Date(ev.endTime);
    const startMinutes = start.getHours() * 60 + start.getMinutes() - START_HOUR * 60;
    const endMinutes = end.getHours() * 60 + end.getMinutes() - START_HOUR * 60;
    if (startMinutes < 0 || endMinutes <= startMinutes) return null;
    const top = (startMinutes / 30) * SLOT_HEIGHT;
    const height = Math.max(SLOT_HEIGHT, ((endMinutes - startMinutes) / 30) * SLOT_HEIGHT);
    return { top, height };
  }

  const checkoutSlots = useMemo(() => {
    if (!form.startTime) return TIME_SLOTS;
    const [h, m] = form.startTime.split(":").map(Number);
    const minMinutes = h * 60 + m + 30;
    return TIME_SLOTS.filter(t => { const [th, tm] = t.split(":").map(Number); return th * 60 + tm >= minMinutes; });
  }, [form.startTime]);

  // Admin event form
  const [adminForm, setAdminForm] = useState({
    title: "", description: "", link: "", startDate: todayISO(), startTime: "10:00",
    endTime: "10:15", isRecurring: false, recurringRule: "weekly", color: "#FFCB09",
    targetType: "all" as "all" | "department" | "users",
  });

  // Scroll to 8am on mount
  useEffect(() => {
    if (gridRef.current) {
      const scrollTo = ((8 - START_HOUR) * 2) * SLOT_HEIGHT;
      gridRef.current.scrollTop = scrollTo;
    }
  }, []);

  const DAY_LABELS = ["Lun", "Mar", "Mie", "Joi", "Vin", "Sâm", "Dum"];

  return (
    <div className="flex h-[calc(100vh-3rem)] overflow-hidden bg-background">
      {/* ── Left Sidebar ── */}
      <div className="w-48 shrink-0 border-r border-border flex flex-col gap-3 p-3 overflow-y-auto">
        {/* Add button */}
        <Button size="sm" className="w-full bg-[#FFCB09] text-[#221F1F] hover:bg-[#FFCB09]/90 font-bold text-xs h-8"
          onClick={() => { setForm(defaultForm(format(selectedDate, "yyyy-MM-dd"))); setIsEditing(false); setDialogOpen(true); }}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Adaugă activitate
        </Button>

        {/* Mini Calendar */}
        <MiniCalendar
          selectedDate={selectedDate}
          onSelectDate={(d) => { setSelectedDate(d); setWeekStart(startOfWeek(d, { weekStartsOn: 1 })); }}
          weekStart={weekStart}
        />

        {/* Time Insights */}
        <div className="border-t border-border pt-3">
          <TimeInsights entries={entries} weekStart={weekStart} />
        </div>

        {/* Upcoming birthdays */}
        {Object.keys(birthdaysThisWeek).length > 0 && (
          <div className="border-t border-border pt-3">
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
              <Cake className="h-3 w-3" /> Zile de naștere
            </div>
            {Object.entries(birthdaysThisWeek).map(([date, names]) => (
              <div key={date} className="text-[10px] mb-1">
                <span className="text-muted-foreground">{format(parseISO(date), "d MMM", { locale: ro })}: </span>
                <span className="text-foreground font-medium">{names.join(", ")}</span>
              </div>
            ))}
          </div>
        )}

        {/* Admin: add company event */}
        {isAdmin && (
          <div className="border-t border-border pt-3">
            <Button size="sm" variant="outline" className="w-full text-xs h-7 border-[#FFCB09]/50 text-[#FFCB09] hover:bg-[#FFCB09]/10"
              onClick={() => setAdminDialogOpen(true)}>
              <Flag className="h-3 w-3 mr-1" /> Eveniment firmă
            </Button>
          </div>
        )}
      </div>

      {/* ── Main Calendar Area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-background shrink-0">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={goToday}
              className={cn("h-7 text-xs font-semibold px-3", !isCurrentWeek ? "border-[#FFCB09] text-[#FFCB09] bg-[#FFCB09]/10" : "text-muted-foreground")}>
              Azi
            </Button>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={prevWeek}><ChevronLeft className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={nextWeek}><ChevronRight className="h-4 w-4" /></Button>
            </div>
            <span className="text-sm font-semibold text-foreground">
              {format(weekStart, "d MMM", { locale: ro })} – {format(weekEnd, "d MMM yyyy", { locale: ro })}
            </span>
            <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-muted-foreground">Săpt. {weekNumber}</Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            {entries.length > 0 && `${formatDuration(entries.reduce((s, e) => s + (e.durationMinutes ?? 0), 0))} total`}
          </div>
        </div>

        {/* Day headers */}
        <div className="flex shrink-0 border-b border-border bg-background">
          <div className="w-12 shrink-0" /> {/* time gutter */}
          {weekDays.map((day, i) => {
            const dayStr = format(day, "yyyy-MM-dd");
            const holiday = holidays[dayStr];
            const bdays = birthdaysThisWeek[dayStr];
            const isTodayDay = isToday(day);
            const isWeekend = i >= 5;
            return (
              <div key={i} className={cn(
                "flex-1 min-w-0 text-center py-1.5 border-l border-border",
                isWeekend && "bg-muted/20",
              )}>
                <div className={cn(
                  "text-[10px] font-semibold uppercase tracking-wider",
                  isTodayDay ? "text-[#221F1F]" : "text-muted-foreground"
                )}>{DAY_LABELS[i]}</div>
                <div className={cn(
                  "mx-auto w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold mt-0.5",
                  isTodayDay ? "bg-[#FFCB09] text-[#221F1F]" : "text-foreground"
                )}>{format(day, "d")}</div>
                {holiday && (
                  <div className="text-[9px] text-red-400 truncate px-1 leading-tight">{holiday}</div>
                )}
                {bdays && (
                  <div className="text-[9px] text-pink-400 truncate px-1 leading-tight flex items-center justify-center gap-0.5">
                    <Cake className="h-2 w-2 inline" />{bdays[0]}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Grid */}
        <div ref={gridRef} className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="flex" style={{ height: TOTAL_SLOTS * SLOT_HEIGHT }}>
            {/* Time gutter */}
            <div className="w-12 shrink-0 relative">
              {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                <div key={i} className="absolute right-2 text-[10px] text-muted-foreground leading-none"
                  style={{ top: i * 2 * SLOT_HEIGHT - 6 }}>
                  {String(START_HOUR + i).padStart(2, "0")}:00
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map((day, di) => {
              const dayStr = format(day, "yyyy-MM-dd");
              const dayEntries = entriesByDate[dayStr] ?? [];
              const dayEvents = eventsByDate[dayStr] ?? [];
              const holiday = holidays[dayStr];
              const isWeekend = di >= 5;

              return (
                <div key={di} className={cn(
                  "flex-1 min-w-0 relative border-l border-border",
                  isWeekend && "bg-muted/10",
                  holiday && "bg-red-500/5",
                )}>
                  {/* Slot lines */}
                  {Array.from({ length: TOTAL_SLOTS }, (_, si) => (
                    <div key={si}
                      className={cn(
                        "absolute left-0 right-0 border-t cursor-pointer hover:bg-[#FFCB09]/5 transition-colors",
                        si % 2 === 0 ? "border-border" : "border-border/30"
                      )}
                      style={{ top: si * SLOT_HEIGHT, height: SLOT_HEIGHT }}
                      onClick={() => handleSlotClick(day, si)}
                    />
                  ))}

                  {/* Company events (admin, non-editable) */}
                  {dayEvents.map(ev => {
                    const style = getEventStyle(ev);
                    if (!style) return null;
                    const isShort = style.height <= SLOT_HEIGHT;
                    return (
                      <div key={`ev-${ev.id}`}
                        className="absolute left-0.5 right-0.5 rounded overflow-hidden z-20 group"
                        style={{ top: style.top, height: style.height, backgroundColor: ev.color ?? "#FFCB09", border: `1px solid ${ev.color ?? "#FFCB09"}` }}
                        onClick={e => e.stopPropagation()}>
                        <div className="px-1.5 py-0.5 h-full flex flex-col justify-start overflow-hidden">
                          <div className="flex items-center gap-0.5">
                            <Lock className="h-2.5 w-2.5 text-[#221F1F] shrink-0" />
                            <span className="text-[10px] font-bold truncate text-[#221F1F]">{ev.title}</span>
                          </div>
                          {!isShort && ev.link && (
                            <a href={ev.link} target="_blank" rel="noreferrer"
                              className="text-[9px] text-[#221F1F]/80 underline truncate flex items-center gap-0.5 mt-0.5"
                              onClick={e => e.stopPropagation()}>
                              <ExternalLink className="h-2 w-2" /> Link
                            </a>
                          )}
                          {isAdmin && (
                            <button className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={e => { e.stopPropagation(); if (confirm("Ștergi evenimentul?")) deleteEvent.mutate({ id: ev.id }); }}>
                              <Trash2 className="h-2.5 w-2.5 text-[#221F1F]" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* User time entries */}
                  {dayEntries.map(entry => {
                    const style = getEntryStyle(entry);
                    if (!style) return null;
                    const act = ACTIVITY_TYPES.find(a => a.value === entry.activityType);
                    const color = act?.color ?? "#3B82F6";
                    const actLabel = act?.label ?? entry.activityType;
                    const proj = entry.projectId ? projectMap[entry.projectId] : null;
                    const isShort = style.height <= SLOT_HEIGHT;
                    const duration = entry.durationMinutes ?? 0;

                    // Alternare galben/negru per tip activitate conform brand
                    const actIndex = ACTIVITY_TYPES.findIndex(a => a.value === entry.activityType);
                    const useYellow = actIndex % 2 === 0;
                    const bgColor = useYellow ? "#FFCB09" : "#221F1F";
                    const textColor = useYellow ? "#221F1F" : "#FFCB09";
                    const textColorSub = useYellow ? "#221F1F99" : "#FFCB0999";
                    const borderColor = useYellow ? "#FFCB09" : "#FFCB0933";

                    return (
                      <div key={entry.id}
                        className="absolute left-0.5 right-0.5 rounded overflow-hidden cursor-pointer group transition-all hover:opacity-90 hover:shadow-md z-10"
                        style={{ top: style.top, height: style.height, backgroundColor: bgColor, border: `1.5px solid ${borderColor}` }}
                        onClick={(e) => handleEntryClick(e, entry)}>
                        <div className="px-1.5 py-0.5 h-full flex flex-col justify-start overflow-hidden">
                          {isShort ? (
                            <span className="text-[10px] font-semibold truncate leading-tight" style={{ color: textColor }}>
                              {entry.taskName || actLabel}
                            </span>
                          ) : (
                            <>
                              <span className="text-[11px] font-bold truncate leading-tight" style={{ color: textColor }}>
                                {entry.taskName || actLabel}
                              </span>
                              {proj && (
                                <span className="text-[9px] truncate leading-tight" style={{ color: textColorSub }}>{proj.name}</span>
                              )}
                              <span className="text-[9px] leading-tight mt-auto" style={{ color: textColorSub }}>{formatDuration(duration)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Add/Edit Entry Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isEditing ? <Pencil className="h-4 w-4 text-[#FFCB09]" /> : <Plus className="h-4 w-4 text-[#FFCB09]" />}
              {isEditing ? "Editează activitate" : "Adaugă activitate"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Titlu activitate</Label>
              <Input placeholder="ex: Redactare plan arhitectural..." value={form.taskName}
                onChange={e => setForm(f => ({ ...f, taskName: e.target.value }))} className="text-sm" />
            </div>
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Data</Label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-semibold mb-1.5 block">Ora start</Label>
                <Select value={form.startTime} onValueChange={v => setForm(f => ({ ...f, startTime: v }))}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{TIME_SLOTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-semibold mb-1.5 block">Ora final</Label>
                <Select value={form.endTime} onValueChange={v => setForm(f => ({ ...f, endTime: v }))}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{checkoutSlots.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Tip activitate</Label>
              <Select value={form.activityType} onValueChange={v => setForm(f => ({ ...f, activityType: v as ActivityType }))}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{ACTIVITY_TYPES.map(a => (
                  <SelectItem key={a.value} value={a.value}>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: a.color }} />
                      {a.label}
                    </div>
                  </SelectItem>
                ))}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Proiect (opțional)</Label>
              <Select value={form.projectId || "fara"} onValueChange={v => setForm(f => ({ ...f, projectId: v === "fara" ? "" : v }))}>
                <SelectTrigger className="text-sm"><SelectValue placeholder="Fără proiect" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fara">Fără proiect</SelectItem>
                  {projects.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Descriere (opțional)</Label>
              <Textarea placeholder="Detalii suplimentare..." value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="text-sm resize-none" rows={2} />
            </div>
          </div>
          <div className="flex justify-between pt-2">
            {isEditing ? (
              <Button variant="destructive" size="sm" onClick={() => { if (form.id && confirm("Ștergi activitatea?")) deleteEntry.mutate({ id: form.id }); }}>
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Șterge
              </Button>
            ) : <div />}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Anulează</Button>
              <Button size="sm" className="bg-[#FFCB09] text-[#221F1F] hover:bg-[#FFCB09]/90 font-bold"
                onClick={handleSave} disabled={addEntry.isPending || updateEntry.isPending}>
                {isEditing ? "Salvează" : "Adaugă"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Admin Event Dialog ── */}
      {isAdmin && (
        <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Flag className="h-4 w-4 text-[#FFCB09]" /> Eveniment firmă (admin)
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-1">
              <div>
                <Label className="text-sm font-semibold mb-1.5 block">Titlu eveniment</Label>
                <Input placeholder="ex: Daily standup, Vinerea Tehnică..." value={adminForm.title}
                  onChange={e => setAdminForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <Label className="text-sm font-semibold mb-1.5 block">Descriere</Label>
                <Textarea placeholder="Detalii eveniment..." value={adminForm.description}
                  onChange={e => setAdminForm(f => ({ ...f, description: e.target.value }))} rows={2} className="resize-none" />
              </div>
              <div>
                <Label className="text-sm font-semibold mb-1.5 block">Link (Zoom, adresă etc.)</Label>
                <Input placeholder="https://zoom.us/j/..." value={adminForm.link}
                  onChange={e => setAdminForm(f => ({ ...f, link: e.target.value }))} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block">Data</Label>
                  <input type="date" value={adminForm.startDate}
                    onChange={e => setAdminForm(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block">Ora start</Label>
                  <Select value={adminForm.startTime} onValueChange={v => setAdminForm(f => ({ ...f, startTime: v }))}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{TIME_SLOTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block">Ora final</Label>
                  <Select value={adminForm.endTime} onValueChange={v => setAdminForm(f => ({ ...f, endTime: v }))}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{TIME_SLOTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block">Alocat pentru</Label>
                  <Select value={adminForm.targetType} onValueChange={v => setAdminForm(f => ({ ...f, targetType: v as any }))}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toți angajații</SelectItem>
                      <SelectItem value="department">Departament</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block">Culoare</Label>
                  <div className="flex gap-1.5 flex-wrap pt-1">
                    {["#FFCB09", "#3B82F6", "#EF4444", "#10B981", "#8B5CF6", "#F59E0B"].map(c => (
                      <button key={c} onClick={() => setAdminForm(f => ({ ...f, color: c }))}
                        className={cn("w-5 h-5 rounded-full border-2 transition-all", adminForm.color === c ? "border-foreground scale-110" : "border-transparent")}
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
              </div>
              {adminForm.targetType === "department" && (
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block">Departament</Label>
                  <Input placeholder="ex: Arhitectura, IT, HR..." value={""}
                    onChange={e => setAdminForm(f => ({ ...f }))} />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setAdminDialogOpen(false)}>Anulează</Button>
              <Button size="sm" className="bg-[#FFCB09] text-[#221F1F] hover:bg-[#FFCB09]/90 font-bold"
                disabled={createEvent.isPending}
                onClick={() => {
                  if (!adminForm.title) { toast.error("Titlul este obligatoriu"); return; }
                  const startISO = `${adminForm.startDate}T${adminForm.startTime}:00`;
                  const endISO = `${adminForm.startDate}T${adminForm.endTime}:00`;
                  createEvent.mutate({
                    title: adminForm.title, description: adminForm.description || undefined,
                    link: adminForm.link || undefined,
                    startTime: startISO, endTime: endISO,
                    color: adminForm.color, targetType: adminForm.targetType,
                  });
                }}>
                Creează eveniment
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
