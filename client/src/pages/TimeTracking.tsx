import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
  format, startOfWeek, endOfWeek, addDays, subWeeks, addWeeks,
  getWeek, parseISO, isToday,
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
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, ExternalLink, Cake, Flag, Lock, GripVertical } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";
import { DndContext, useDraggable, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

// ─── Constants ────────────────────────────────────────────────────────────────
const START_HOUR = 6;
const END_HOUR = 23;
const TOTAL_HOURS = END_HOUR - START_HOUR + 1;
// SLOT_HEIGHT is computed dynamically to fill the viewport — see below
// Each slot = 30 minutes. We show TOTAL_HOURS * 2 slots.
const TOTAL_SLOTS = TOTAL_HOURS * 2;
// Fixed pixel height per 30-min slot — compact enough to fit without outer scroll
const SLOT_H = 24; // px

const GUTTER_W = 44; // px — time gutter width, shared by header + grid

const ACTIVITY_TYPES = [
  { value: "proiectare",   label: "Proiectare",   color: "#3B82F6" },
  { value: "consultanta",  label: "Consultanță",  color: "#8B5CF6" },
  { value: "sedinta",      label: "Ședință",      color: "#F59E0B" },
  { value: "documentare",  label: "Documentare",  color: "#10B981" },
  { value: "deplasare",    label: "Deplasare",    color: "#EF4444" },
  { value: "administrativ",label: "Administrativ",color: "#6B7280" },
  { value: "verificare",   label: "Verificare",   color: "#EC4899" },
  { value: "executie",     label: "Execuție",     color: "#14B8A6" },
] as const;
type ActivityType = typeof ACTIVITY_TYPES[number]["value"];

// ─── Romanian public holidays ─────────────────────────────────────────────────
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
function extractLocalTime(ts: Date | string | null | undefined): string {
  if (!ts) return "";
  const d = typeof ts === "string" ? new Date(ts) : ts;
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
// Keep alias for backward compat
const extractUTCTime = extractLocalTime;
function formatDuration(minutes: number) {
  if (!minutes) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ""}` : `${m}m`;
}
function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + mins;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}
function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
// All 15-min slots for 00:00–23:45
const ALL_TIME_SLOTS = Array.from({ length: 24 * 4 }, (_, i) => {
  const h = Math.floor(i / 4);
  const m = (i % 4) * 15;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
});

type EntryForm = {
  id?: number; date: string; startTime: string; endTime: string;
  activityType: ActivityType; taskName: string; description: string;
  projectId: string; isBillable: boolean;
};
function defaultForm(date = todayISO(), startTime = "09:00"): EntryForm {
  return { date, startTime, endTime: addMinutes(startTime, 60), activityType: "proiectare", taskName: "", description: "", projectId: "", isBillable: true };
}

// ─── Windowed time slot list: show ±3h around anchor ─────────────────────────
function getWindowedSlots(anchor: string, windowHours = 3): string[] {
  const anchorMin = timeToMinutes(anchor);
  const lo = Math.max(0, anchorMin - windowHours * 60);
  const hi = Math.min(23 * 60 + 45, anchorMin + windowHours * 60);
  return ALL_TIME_SLOTS.filter(t => {
    const m = timeToMinutes(t);
    return m >= lo && m <= hi;
  });
}

// ─── Mini Calendar ────────────────────────────────────────────────────────────
function MiniCalendar({ selectedDate, onSelectDate, weekStart }: {
  selectedDate: Date; onSelectDate: (d: Date) => void; weekStart: Date;
}) {
  const [viewMonth, setViewMonth] = useState(() => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  const days = useMemo(() => {
    const start = startOfWeek(viewMonth, { weekStartsOn: 1 });
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [viewMonth]);
  const weekDayLabels = ["L", "M", "M", "J", "V", "S", "D"];
  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-1">
        <button onClick={() => setViewMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          className="p-0.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-3 w-3" />
        </button>
        <span className="text-[11px] font-bold text-foreground capitalize">
          {format(viewMonth, "MMMM yyyy", { locale: ro })}
        </span>
        <button onClick={() => setViewMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          className="p-0.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0">
        {weekDayLabels.map((l, i) => (
          <div key={i} className="text-center text-[9px] font-bold text-muted-foreground pb-0.5">{l}</div>
        ))}
        {days.map((day, i) => {
          const isCurrentMonth = day.getMonth() === viewMonth.getMonth();
          const isTodayDay = isToday(day);
          const isSelected = format(day, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
          const isInWeek = day >= weekStart && day <= addDays(weekStart, 6);
          return (
            <button key={i} onClick={() => onSelectDate(day)}
              className={cn(
                "text-center text-[10px] h-5 w-full rounded transition-colors",
                !isCurrentMonth && "text-muted-foreground/40",
                isCurrentMonth && !isTodayDay && !isSelected && "hover:bg-muted text-foreground",
                isInWeek && !isTodayDay && !isSelected && "bg-[#FFCB09]/10",
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
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const weekEnd = addDays(weekStart, 6);

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
    <div className="space-y-2">
      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Time Insights</div>
      <div className="grid grid-cols-2 gap-1.5">
        <div className="bg-[#221F1F] rounded p-1.5 text-center">
          <div className="text-[9px] text-white">Azi</div>
          <div className="text-xs font-bold text-[#FFCB09]">{formatDuration(todayMins)}</div>
        </div>
        <div className="bg-[#221F1F] rounded p-1.5 text-center">
          <div className="text-[9px] text-white">Săpt.</div>
          <div className="text-xs font-bold text-[#FFCB09]">{formatDuration(weekMins)}</div>
        </div>
      </div>
      {byType.length > 0 && (
        <div className="space-y-1">
          {byType.slice(0, 4).map(([type, mins]) => {
            const act = ACTIVITY_TYPES.find(a => a.value === type);
            const pct = totalWeekMins > 0 ? Math.round((mins / totalWeekMins) * 100) : 0;
            return (
              <div key={type}>
                <div className="flex justify-between text-[9px] mb-0.5">
                  <span className="text-foreground/80 truncate">{act?.label ?? type}</span>
                  <span className="text-muted-foreground ml-1 shrink-0">{formatDuration(mins)}</span>
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

// ─── Draggable Entry Block ─────────────────────────────────────────────────────
function DraggableEntry({ entry, style, onClick, projectName, onResizeStart }: {
  entry: any; style: { top: number; height: number };
  onClick: (e: React.MouseEvent) => void; projectName?: string;
  onResizeStart?: (e: React.MouseEvent) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `entry-${entry.id}`,
    data: { entry },
  });

  const actIndex = ACTIVITY_TYPES.findIndex(a => a.value === entry.activityType);
  const useYellow = actIndex % 2 === 0;
  const bgColor = useYellow ? "#FFCB09" : "#221F1F";
  const textColor = useYellow ? "#221F1F" : "#FFCB09";
  const textColorSub = useYellow ? "#221F1F99" : "#FFCB0999";
  const act = ACTIVITY_TYPES.find(a => a.value === entry.activityType);
  const actLabel = act?.label ?? entry.activityType;
  const isShort = style.height <= SLOT_H;
  const duration = entry.durationMinutes ?? 0;

  const cssTransform = CSS.Translate.toString(transform);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "absolute left-0.5 right-0.5 rounded overflow-hidden cursor-pointer group transition-opacity z-10 flex",
        isDragging && "opacity-40"
      )}
      style={{
        top: style.top,
        height: style.height,
        backgroundColor: bgColor,
        border: `1.5px solid ${useYellow ? "#e6b800" : "#444"}`,
        transform: cssTransform,
      }}
      onClick={onClick}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="shrink-0 flex items-center justify-center w-4 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-60 transition-opacity"
        onClick={e => e.stopPropagation()}
      >
        <GripVertical className="h-3 w-3" style={{ color: textColor }} />
      </div>
      <div className="flex-1 px-1 py-0.5 overflow-hidden flex flex-col justify-start min-w-0">
        {isShort ? (
          <span className="text-[10px] font-semibold truncate leading-tight" style={{ color: textColor }}>
            {entry.taskName || actLabel}
          </span>
        ) : (
          <>
            <span className="text-[11px] font-bold truncate leading-tight" style={{ color: textColor }}>
              {entry.taskName || actLabel}
            </span>
            {projectName && (
              <span className="text-[9px] truncate leading-tight" style={{ color: textColorSub }}>{projectName}</span>
            )}
            <span className="text-[9px] leading-tight mt-auto" style={{ color: textColorSub }}>{formatDuration(duration)}</span>
          </>
        )}
      </div>
      {/* Resize handle at bottom */}
      {onResizeStart && (
        <div
          className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ backgroundColor: useYellow ? "#e6b800" : "#333" }}
          onMouseDown={e => { e.stopPropagation(); onResizeStart(e); }}
        >
          <div className="w-6 h-0.5 rounded" style={{ backgroundColor: textColor }} />
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
  const [draggingEntry, setDraggingEntry] = useState<any>(null);
  const [resizingEntry, setResizingEntry] = useState<{ entry: any; startY: number; origEndMin: number } | null>(null);
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

  const birthdaysThisWeek = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const b of birthdays) {
      if (!b.birthDate) continue;
      const bd = typeof b.birthDate === "string" ? b.birthDate : format(new Date(b.birthDate as any), "yyyy-MM-dd");
      const monthDay = bd.slice(5);
      for (const day of weekDays) {
        if (format(day, "MM-dd") === monthDay) {
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

  // ─── Resize logic (after updateEntry is declared) ────────────────────────────────
  const handleResizeStart = useCallback((e: React.MouseEvent, entry: any) => {
    e.preventDefault();
    const endStr = extractUTCTime(entry.endTime);
    const origEndMin = timeToMinutes(endStr);
    setResizingEntry({ entry, startY: e.clientY, origEndMin });
  }, []);

  useEffect(() => {
    if (!resizingEntry) return;
    const onMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - resizingEntry.startY;
      const deltaSlots = Math.round(deltaY / SLOT_H);
      const newEndMin = Math.max(resizingEntry.origEndMin + 15, resizingEntry.origEndMin + deltaSlots * 30);
      const clampedEndMin = Math.min(newEndMin, END_HOUR * 60 + 30);
      const el = document.getElementById(`resize-preview-${resizingEntry.entry.id}`);
      if (el) {
        const startStr = extractUTCTime(resizingEntry.entry.startTime);
        const startMin = timeToMinutes(startStr);
        const newHeight = Math.max(SLOT_H, ((clampedEndMin - startMin) / 30) * SLOT_H);
        el.style.height = `${newHeight}px`;
      }
    };
    const onMouseUp = (e: MouseEvent) => {
      const deltaY = e.clientY - resizingEntry.startY;
      const deltaSlots = Math.round(deltaY / SLOT_H);
      const newEndMin = Math.max(resizingEntry.origEndMin + 15, resizingEntry.origEndMin + deltaSlots * 30);
      const clampedEndMin = Math.min(newEndMin, END_HOUR * 60 + 30);
      const newEndStr = `${String(Math.floor(clampedEndMin / 60)).padStart(2, "0")}:${String(clampedEndMin % 60).padStart(2, "0")}`;
      const entry = resizingEntry.entry;
      const ds = typeof entry.date === "string" ? (entry.date as string).slice(0, 10) : format(new Date(entry.date as any), "yyyy-MM-dd");
      const startStr = extractUTCTime(entry.startTime);
      if (newEndStr !== extractUTCTime(entry.endTime)) {
        updateEntry.mutate({
          id: entry.id, date: ds,
          startTime: startStr, endTime: newEndStr,
          activityType: entry.activityType ?? "proiectare",
          taskName: entry.taskName ?? undefined,
          description: entry.description ?? undefined,
          projectId: entry.projectId ?? undefined,
          isBillable: entry.isBillable ?? true,
        });
      }
      setResizingEntry(null);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [resizingEntry, updateEntry]);

  const entriesByDate = useMemo(() => {
    const map: Record<string, typeof entries> = {};
    for (const e of entries) {
      const ds = typeof e.date === "string" ? (e.date as string).slice(0, 10) : format(new Date(e.date as any), "yyyy-MM-dd");
      if (!map[ds]) map[ds] = [];
      map[ds].push(e);
    }
    return map;
  }, [entries]);

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
    setForm({ ...defaultForm(format(date, "yyyy-MM-dd"), startTime) });
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
    const [sh, sm] = form.startTime.split(":").map(Number);
    const [eh, em] = form.endTime.split(":").map(Number);
    if (eh * 60 + em <= sh * 60 + sm) { toast.error("Ora de final trebuie să fie după ora de start"); return; }
    const payload = {
      date: form.date, startTime: form.startTime, endTime: form.endTime,
      activityType: form.activityType, taskName: form.taskName || undefined,
      description: form.description || undefined,
      projectId: (form.projectId && form.projectId !== "" && form.projectId !== "fara") ? Number(form.projectId) : undefined,
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
    const top = (startMinutes / 30) * SLOT_H;
    const height = Math.max(SLOT_H, ((endMinutes - startMinutes) / 30) * SLOT_H);
    return { top, height };
  }

  function getEventStyle(ev: typeof companyEvents[number]) {
    const start = new Date(ev.startTime);
    const end = new Date(ev.endTime);
    const startMinutes = start.getHours() * 60 + start.getMinutes() - START_HOUR * 60;
    const endMinutes = end.getHours() * 60 + end.getMinutes() - START_HOUR * 60;
    if (startMinutes < 0 || endMinutes <= startMinutes) return null;
    const top = (startMinutes / 30) * SLOT_H;
    const height = Math.max(SLOT_H, ((endMinutes - startMinutes) / 30) * SLOT_H);
    return { top, height };
  }

  // Windowed slots for dropdowns — ±3h around selected time
  const startSlots = useMemo(() => getWindowedSlots(form.startTime || "09:00"), [form.startTime]);
  const endSlots = useMemo(() => {
    const anchor = form.startTime || "09:00";
    const anchorMin = timeToMinutes(anchor);
    const lo = anchorMin + 15; // minimum 15 min after start
    const hi = Math.min(23 * 60 + 45, anchorMin + 3 * 60);
    return ALL_TIME_SLOTS.filter(t => {
      const m = timeToMinutes(t);
      return m >= lo && m <= hi;
    });
  }, [form.startTime]);

  // DnD sensors — require 5px movement before drag starts (prevents accidental drags)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragStart = useCallback((event: any) => {
    const entry = event.active.data.current?.entry;
    if (entry) setDraggingEntry(entry);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setDraggingEntry(null);
    const { active, delta } = event;
    const entry = active.data.current?.entry;
    if (!entry || !gridRef.current) return;

    // Calculate how many slots (30min each) were moved vertically
    const deltaSlots = Math.round(delta.y / SLOT_H);
    const deltaDays = Math.round(delta.x / (gridRef.current.clientWidth / 7));

    if (deltaSlots === 0 && deltaDays === 0) return;

    const startStr = extractUTCTime(entry.startTime);
    const endStr = extractUTCTime(entry.endTime);
    if (!startStr || !endStr) return;

    const startMin = timeToMinutes(startStr) + deltaSlots * 30;
    const endMin = timeToMinutes(endStr) + deltaSlots * 30;

    if (startMin < 0 || endMin > 24 * 60) return;

    const newStart = `${String(Math.floor(startMin / 60)).padStart(2, "0")}:${String(startMin % 60).padStart(2, "0")}`;
    const newEnd = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;

    const ds = typeof entry.date === "string" ? (entry.date as string).slice(0, 10) : format(new Date(entry.date as any), "yyyy-MM-dd");
    const newDate = deltaDays !== 0
      ? format(addDays(parseISO(ds), deltaDays), "yyyy-MM-dd")
      : ds;

    updateEntry.mutate({
      id: entry.id,
      date: newDate,
      startTime: newStart,
      endTime: newEnd,
      activityType: entry.activityType,
      taskName: entry.taskName ?? undefined,
      description: entry.description ?? undefined,
      projectId: entry.projectId ?? undefined,
      isBillable: entry.isBillable ?? true,
    });
  }, [updateEntry]);

  // Admin event form
  const [adminForm, setAdminForm] = useState({
    title: "", description: "", link: "", startDate: todayISO(), startTime: "10:00",
    endTime: "10:15", isRecurring: false, recurringRule: "weekly", color: "#FFCB09",
    targetType: "all" as "all" | "department" | "users",
  });

  // Scroll to 8am on mount
  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.scrollTop = ((8 - START_HOUR) * 2) * SLOT_H;
    }
  }, []);

  const DAY_LABELS = ["Lun", "Mar", "Mie", "Joi", "Vin", "Sâm", "Dum"];
  const GRID_TOTAL_H = TOTAL_SLOTS * SLOT_H;

  return (
    // Use fixed height = 100vh minus the sidebar top bar (48px = h-12)
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex overflow-hidden bg-background" style={{ height: "calc(100vh - 48px)" }}>

        {/* ── Left Sidebar ── */}
        <div className="w-44 shrink-0 border-r border-border flex flex-col gap-2 p-2 overflow-y-auto">
          <Button size="sm" className="w-full bg-[#FFCB09] text-[#221F1F] hover:bg-[#FFCB09]/90 font-bold text-xs h-7"
            onClick={() => { setForm(defaultForm(format(selectedDate, "yyyy-MM-dd"))); setIsEditing(false); setDialogOpen(true); }}>
            <Plus className="h-3 w-3 mr-1" /> Adaugă activitate
          </Button>

          <MiniCalendar
            selectedDate={selectedDate}
            onSelectDate={(d) => { setSelectedDate(d); setWeekStart(startOfWeek(d, { weekStartsOn: 1 })); }}
            weekStart={weekStart}
          />

          <div className="border-t border-border pt-2">
            <TimeInsights entries={entries} weekStart={weekStart} />
          </div>

          {Object.keys(birthdaysThisWeek).length > 0 && (
            <div className="border-t border-border pt-2">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                <Cake className="h-3 w-3" /> Zile de naștere
              </div>
              {Object.entries(birthdaysThisWeek).map(([date, names]) => (
                <div key={date} className="text-[9px] mb-0.5">
                  <span className="text-muted-foreground">{format(parseISO(date), "d MMM", { locale: ro })}: </span>
                  <span className="text-foreground font-medium">{names.join(", ")}</span>
                </div>
              ))}
            </div>
          )}

          {isAdmin && (
            <div className="border-t border-border pt-2">
              <Button size="sm" variant="outline" className="w-full text-xs h-7 border-[#FFCB09]/50 text-[#FFCB09] hover:bg-[#FFCB09]/10"
                onClick={() => setAdminDialogOpen(true)}>
                <Flag className="h-3 w-3 mr-1" /> Eveniment firmă
              </Button>
            </div>
          )}
        </div>

        {/* ── Main Calendar Area ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Top nav bar */}
          <div className="flex items-center justify-between px-2 py-1.5 border-b border-border bg-background shrink-0">
            <div className="flex items-center gap-1.5">
              <Button size="sm" variant="outline" onClick={goToday}
                className={cn("h-6 text-xs font-semibold px-2.5", !isCurrentWeek ? "border-[#FFCB09] text-[#FFCB09] bg-[#FFCB09]/10" : "text-muted-foreground")}>
                Azi
              </Button>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={prevWeek}><ChevronLeft className="h-3.5 w-3.5" /></Button>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={nextWeek}><ChevronRight className="h-3.5 w-3.5" /></Button>
              <span className="text-xs font-semibold text-foreground">
                {format(weekStart, "d MMM", { locale: ro })} – {format(weekEnd, "d MMM yyyy", { locale: ro })}
              </span>
              <Badge variant="outline" className="text-[9px] h-4 px-1 text-muted-foreground">Săpt. {weekNumber}</Badge>
            </div>
            <div className="text-[10px] text-muted-foreground">
              {entries.length > 0 && `${formatDuration(entries.reduce((s, e) => s + (e.durationMinutes ?? 0), 0))} total`}
            </div>
          </div>

          {/* Day headers — gutter must match grid gutter exactly */}
          <div className="flex shrink-0 border-b border-border bg-background">
            {/* Gutter placeholder — exact same width as grid gutter */}
            <div style={{ width: GUTTER_W, minWidth: GUTTER_W }} className="shrink-0" />
            {weekDays.map((day, i) => {
              const dayStr = format(day, "yyyy-MM-dd");
              const holiday = holidays[dayStr];
              const bdays = birthdaysThisWeek[dayStr];
              const isTodayDay = isToday(day);
              const isWeekend = i >= 5;
              return (
                <div key={i} className={cn(
                  "flex-1 min-w-0 text-center py-1 border-l border-border",
                  isWeekend && "bg-muted/20",
                )}>
                  <div className={cn("text-[9px] font-bold uppercase tracking-wider",
                    isTodayDay ? "text-[#221F1F]" : "text-muted-foreground"
                  )}>{DAY_LABELS[i]}</div>
                  <div className={cn(
                    "mx-auto w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold",
                    isTodayDay ? "bg-[#FFCB09] text-[#221F1F]" : "text-foreground"
                  )}>{format(day, "d")}</div>
                  {holiday && <div className="text-[8px] text-red-400 truncate px-0.5 leading-none">{holiday}</div>}
                  {bdays && (
                    <div className="text-[8px] text-pink-400 truncate px-0.5 leading-none flex items-center justify-center gap-0.5">
                      <Cake className="h-2 w-2" />{bdays[0]}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Scrollable grid — ONLY this div scrolls */}
          <div ref={gridRef} className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="flex" style={{ height: GRID_TOTAL_H }}>

              {/* Time gutter — exact GUTTER_W px */}
              <div style={{ width: GUTTER_W, minWidth: GUTTER_W }} className="shrink-0 relative border-r border-border/30">
                {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                  <div key={i} className="absolute text-[9px] text-muted-foreground leading-none"
                    style={{ top: i * 2 * SLOT_H - 5, right: 4 }}>
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
                    {/* Slot click zones + grid lines */}
                    {Array.from({ length: TOTAL_SLOTS }, (_, si) => (
                      <div key={si}
                        className={cn(
                          "absolute left-0 right-0 border-t cursor-pointer hover:bg-[#FFCB09]/5 transition-colors",
                          si % 2 === 0 ? "border-border/60" : "border-border/20"
                        )}
                        style={{ top: si * SLOT_H, height: SLOT_H }}
                        onClick={() => handleSlotClick(day, si)}
                      />
                    ))}

                    {/* Company events */}
                    {dayEvents.map(ev => {
                      const evStyle = getEventStyle(ev);
                      if (!evStyle) return null;
                      const isShort = evStyle.height <= SLOT_H;
                      return (
                        <div key={`ev-${ev.id}`}
                          className="absolute left-0.5 right-0.5 rounded overflow-hidden z-20 group"
                          style={{ top: evStyle.top, height: evStyle.height, backgroundColor: ev.color ?? "#FFCB09", border: `1px solid ${ev.color ?? "#FFCB09"}` }}
                          onClick={e => e.stopPropagation()}>
                          <div className="px-1 py-0.5 h-full flex flex-col overflow-hidden">
                            <div className="flex items-center gap-0.5">
                              <Lock className="h-2 w-2 text-[#221F1F] shrink-0" />
                              <span className="text-[9px] font-bold truncate text-[#221F1F]">{ev.title}</span>
                            </div>
                            {!isShort && ev.link && (
                              <a href={ev.link} target="_blank" rel="noreferrer"
                                className="text-[8px] text-[#221F1F]/80 underline truncate flex items-center gap-0.5 mt-0.5"
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

                    {/* User time entries — draggable */}
                    {dayEntries.map(entry => {
                      const entryStyle = getEntryStyle(entry);
                      if (!entryStyle) return null;
                      const proj = entry.projectId ? projectMap[entry.projectId] : null;
                      return (
                        <div key={entry.id} id={`resize-preview-${entry.id}`} style={{ position: "absolute", top: entryStyle.top, height: entryStyle.height, left: 2, right: 2, pointerEvents: "none" }}>
                          <DraggableEntry
                            entry={entry}
                            style={{ top: 0, height: entryStyle.height }}
                            onClick={(e) => handleEntryClick(e, entry)}
                            projectName={proj?.name}
                            onResizeStart={(e) => handleResizeStart(e, entry)}
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* DragOverlay — ghost block while dragging */}
      <DragOverlay>
        {draggingEntry && (() => {
          const actIndex = ACTIVITY_TYPES.findIndex(a => a.value === draggingEntry.activityType);
          const useYellow = actIndex % 2 === 0;
          const bgColor = useYellow ? "#FFCB09" : "#221F1F";
          const textColor = useYellow ? "#221F1F" : "#FFCB09";
          const act = ACTIVITY_TYPES.find(a => a.value === draggingEntry.activityType);
          const entryStyle = getEntryStyle(draggingEntry);
          return (
            <div className="rounded overflow-hidden opacity-80 shadow-xl"
              style={{ width: 120, height: entryStyle?.height ?? SLOT_H * 2, backgroundColor: bgColor, border: `2px solid ${useYellow ? "#e6b800" : "#FFCB09"}` }}>
              <div className="px-1.5 py-0.5">
                <span className="text-[11px] font-bold truncate" style={{ color: textColor }}>
                  {draggingEntry.taskName || act?.label}
                </span>
              </div>
            </div>
          );
        })()}
      </DragOverlay>

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
                <Select value={form.startTime} onValueChange={v => {
                  // When start changes, auto-adjust end to start+1h if end would be invalid
                  const newEnd = addMinutes(v, 60);
                  setForm(f => ({ ...f, startTime: v, endTime: newEnd }));
                }}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {startSlots.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-semibold mb-1.5 block">Ora final</Label>
                <Select value={form.endTime} onValueChange={v => setForm(f => ({ ...f, endTime: v }))}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {endSlots.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
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
                    <SelectContent>{ALL_TIME_SLOTS.filter(t => t >= "06:00" && t <= "22:00").map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block">Ora final</Label>
                  <Select value={adminForm.endTime} onValueChange={v => setAdminForm(f => ({ ...f, endTime: v }))}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{ALL_TIME_SLOTS.filter(t => t >= "06:15" && t <= "23:00").map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
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
    </DndContext>
  );
}
