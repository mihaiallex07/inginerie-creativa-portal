import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
  startOfWeek, endOfWeek, addDays, addWeeks, subWeeks, format, isSameDay,
  startOfMonth, endOfMonth, getISOWeek, isSameMonth, isToday, getDay,
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
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, ExternalLink, Cake, Lock } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";

// ─── Constants ─────────────────────────────────────────────────────────────
const HOUR_START = 6;
const HOUR_END = 23;
const TOTAL_HOURS = HOUR_END - HOUR_START;
const SLOT_H = 48; // px per hour — compact but readable
const GRID_H = TOTAL_HOURS * SLOT_H;

const ACTIVITY_TYPES = [
  "proiectare", "consultanta", "sedinta", "documentare",
  "deplasare", "administrativ", "verificare", "executie",
] as const;

// Brand colors for entries — alternating yellow/black
const ENTRY_COLORS = [
  { bg: "#FFCB09", text: "#221F1F" }, // yellow
  { bg: "#221F1F", text: "#FFCB09" }, // black
];

// Romanian public holidays (fixed + Easter-based)
function getRomanianHolidays(year: number) {
  const fixed = [
    { m: 1, d: 1, name: "Anul Nou" }, { m: 1, d: 2, name: "Anul Nou" },
    { m: 1, d: 24, name: "Ziua Unirii" }, { m: 5, d: 1, name: "Ziua Muncii" },
    { m: 6, d: 1, name: "Ziua Copilului" }, { m: 8, d: 15, name: "Adormirea Maicii Domnului" },
    { m: 11, d: 30, name: "Sf. Andrei" }, { m: 12, d: 1, name: "Ziua Națională" },
    { m: 12, d: 25, name: "Crăciun" }, { m: 12, d: 26, name: "Crăciun" },
  ];
  // Orthodox Easter dates
  const easterMap: Record<number, [number, number]> = {
    2024: [5, 5], 2025: [4, 20], 2026: [4, 12], 2027: [5, 2],
  };
  const holidays = fixed.map(h => ({ date: `${year}-${String(h.m).padStart(2, "0")}-${String(h.d).padStart(2, "0")}`, name: h.name }));
  const easter = easterMap[year];
  if (easter) {
    const easterDate = new Date(year, easter[0] - 1, easter[1]);
    const goodFriday = addDays(easterDate, -2);
    const easterMon = addDays(easterDate, 1);
    const rusalii = addDays(easterDate, 49);
    const rusaliiMon = addDays(easterDate, 50);
    [goodFriday, easterDate, easterMon, rusalii, rusaliiMon].forEach((d, i) => {
      holidays.push({ date: format(d, "yyyy-MM-dd"), name: ["Vinerea Mare", "Paște", "Paște", "Rusalii", "Rusalii"][i] });
    });
  }
  return holidays;
}

const pad2 = (n: number) => n.toString().padStart(2, "0");

// Extract hour/minute from a Date or string — always treat as wall-clock (no UTC conversion)
function extractTime(d: Date | string | null | undefined): { h: number; m: number } {
  if (!d) return { h: 0, m: 0 };
  const dt = typeof d === "string" ? new Date(d) : d;
  // Use getHours/getMinutes which return local time
  return { h: dt.getHours(), m: dt.getMinutes() };
}

function formatDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m > 0 ? `${pad2(m)}m` : ""}` : `${m}m`;
}

// ─── Mini Calendar ─────────────────────────────────────────────────────────
function MiniCalendar({ currentDate, onDateSelect, onMonthChange }: {
  currentDate: Date;
  onDateSelect: (d: Date) => void;
  onMonthChange?: (d: Date) => void;
}) {
  const [viewMonth, setViewMonth] = useState(startOfMonth(currentDate));

  useEffect(() => { setViewMonth(startOfMonth(currentDate)); }, [currentDate]);

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const weeks: Date[][] = [];
  let day = calStart;
  while (day <= monthEnd || weeks.length < 6) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) { week.push(day); day = addDays(day, 1); }
    weeks.push(week);
    if (day > monthEnd && weeks.length >= 5) break;
  }

  const goMonth = (dir: number) => {
    const next = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + dir, 1);
    setViewMonth(next);
    onMonthChange?.(next);
  };

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => goMonth(-1)} className="p-1 hover:bg-gray-100 rounded"><ChevronLeft className="h-3.5 w-3.5" /></button>
        <span className="text-xs font-semibold capitalize">{format(viewMonth, "MMMM yyyy", { locale: ro })}</span>
        <button onClick={() => goMonth(1)} className="p-1 hover:bg-gray-100 rounded"><ChevronRight className="h-3.5 w-3.5" /></button>
      </div>
      <div className="grid grid-cols-7 gap-0 text-center">
        {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
          <div key={i} className="text-[10px] font-medium text-gray-400 py-0.5">{d}</div>
        ))}
        {weeks.flat().map((d, i) => {
          const inMonth = isSameMonth(d, viewMonth);
          const today = isToday(d);
          const selected = isSameDay(d, currentDate);
          return (
            <button
              key={i}
              onClick={() => onDateSelect(d)}
              className={cn(
                "text-[10px] w-6 h-6 rounded-full mx-auto flex items-center justify-center transition-colors",
                !inMonth && "text-gray-300",
                inMonth && !today && !selected && "text-gray-700 hover:bg-gray-100",
                today && !selected && "bg-[#FFCB09] text-[#221F1F] font-bold",
                selected && "bg-[#221F1F] text-white font-bold",
              )}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Time Picker (dropdown ±3h window, 15min increments) ──────────────────
function TimePicker({ value, onChange, label, minTime }: {
  value: { h: number; m: number };
  onChange: (v: { h: number; m: number }) => void;
  label: string;
  minTime?: { h: number; m: number };
}) {
  // Generate options: 15min increments, 0:00 to 23:45
  const allOptions: { h: number; m: number }[] = [];
  for (let h = 0; h < 24; h++) for (let m = 0; m < 60; m += 15) allOptions.push({ h, m });

  // Filter: show ±3h window around current value
  const currentMins = value.h * 60 + value.m;
  const windowMins = 3 * 60;
  let filtered = allOptions.filter(o => {
    const oMins = o.h * 60 + o.m;
    return oMins >= currentMins - windowMins && oMins <= currentMins + windowMins;
  });

  // If minTime is set (for end time), filter out anything <= minTime + 15min
  if (minTime) {
    const minMins = minTime.h * 60 + minTime.m + 15;
    filtered = filtered.filter(o => o.h * 60 + o.m >= minMins);
  }

  // Ensure current value is in the list
  if (!filtered.find(o => o.h === value.h && o.m === value.m)) {
    filtered.push(value);
    filtered.sort((a, b) => (a.h * 60 + a.m) - (b.h * 60 + b.m));
  }

  const valStr = `${pad2(value.h)}:${pad2(value.m)}`;

  return (
    <div>
      <Label className="text-xs text-gray-500 mb-1">{label}</Label>
      <Select value={valStr} onValueChange={(v) => {
        const [hh, mm] = v.split(":").map(Number);
        onChange({ h: hh, m: mm });
      }}>
        <SelectTrigger className="h-8 text-sm w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-48">
          {filtered.map(o => {
            const s = `${pad2(o.h)}:${pad2(o.m)}`;
            return <SelectItem key={s} value={s}>{s}</SelectItem>;
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function TimeTracking() {
  const { user } = useAuth();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const isCurrentWeek = isSameDay(weekStart, startOfWeek(new Date(), { weekStartsOn: 1 }));
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const weekNum = getISOWeek(weekStart);
  const gridRef = useRef<HTMLDivElement>(null);

  // ── Dialog state ──
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [formDate, setFormDate] = useState("");
  const [formStart, setFormStart] = useState<{ h: number; m: number }>({ h: 8, m: 0 });
  const [formEnd, setFormEnd] = useState<{ h: number; m: number }>({ h: 9, m: 0 });
  const [formTask, setFormTask] = useState("");
  const [formType, setFormType] = useState<string>("proiectare");
  const [formProject, setFormProject] = useState<string>("");
  const [formDesc, setFormDesc] = useState("");

  // ── Admin event dialog ──
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [adminTitle, setAdminTitle] = useState("");
  const [adminLink, setAdminLink] = useState("");
  const [adminColor, setAdminColor] = useState("#FFCB09");
  const [adminDate, setAdminDate] = useState("");
  const [adminStart, setAdminStart] = useState<{ h: number; m: number }>({ h: 10, m: 0 });
  const [adminEnd, setAdminEnd] = useState<{ h: number; m: number }>({ h: 10, m: 15 });

  // ── Resize state ──
  const resizeRef = useRef<{ entryId: number; startY: number; origEndH: number; origEndM: number } | null>(null);

  // ── Data queries ──
  const dateFrom = format(weekStart, "yyyy-MM-dd");
  const dateTo = format(weekEnd, "yyyy-MM-dd");
  const { data: entries = [], refetch: refetchEntries } = trpc.timeTracking.myEntries.useQuery({});
  const { data: projects = [] } = trpc.projects.list.useQuery({});
  const { data: companyEvents = [] } = trpc.companyEvents.list.useQuery({ dateFrom, dateTo });
  const { data: birthdays = [] } = trpc.people.upcomingBirthdays.useQuery({ daysAhead: 14 });

  const holidays = useMemo(() => {
    const y1 = weekStart.getFullYear();
    const y2 = weekEnd.getFullYear();
    const h = getRomanianHolidays(y1);
    if (y2 !== y1) h.push(...getRomanianHolidays(y2));
    return h;
  }, [weekStart, weekEnd]);

  // Filter entries for current week
  const weekEntries = useMemo(() => {
    return (entries as any[]).filter((e: any) => {
      if (!e.startTime || !e.endTime) return false;
      const d = new Date(e.date);
      return d >= weekStart && d <= weekEnd;
    });
  }, [entries, weekStart, weekEnd]);

  // ── Mutations ──
  const addEntry = trpc.timeTracking.addCalendarEntry.useMutation({
    onSuccess: () => { refetchEntries(); toast.success("Activitate adăugată"); },
    onError: (e) => toast.error(e.message),
  });
  const updateEntry = trpc.timeTracking.updateCalendarEntry.useMutation({
    onSuccess: () => { refetchEntries(); toast.success("Activitate actualizată"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteEntry = trpc.timeTracking.deleteEntry.useMutation({
    onSuccess: () => { refetchEntries(); toast.success("Activitate ștearsă"); },
    onError: (e) => toast.error(e.message),
  });
  const createEvent = trpc.companyEvents.create.useMutation({
    onSuccess: () => { toast.success("Eveniment creat"); },
    onError: (e) => toast.error(e.message),
  });

  // ── Scroll to 8:00 on mount ──
  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.scrollTop = (8 - HOUR_START) * SLOT_H;
    }
  }, []);

  // ── Resize handler ──
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeRef.current || !gridRef.current) return;
      const gridRect = gridRef.current.getBoundingClientRect();
      const relY = e.clientY - gridRect.top + gridRef.current.scrollTop;
      const totalMinutes = (relY / GRID_H) * TOTAL_HOURS * 60 + HOUR_START * 60;
      // Snap to 15min
      const snapped = Math.round(totalMinutes / 15) * 15;
      const newH = Math.floor(snapped / 60);
      const newM = snapped % 60;
      resizeRef.current.origEndH = Math.max(HOUR_START, Math.min(HOUR_END, newH));
      resizeRef.current.origEndM = newM;
      // Visual feedback via data attribute
      const el = document.getElementById(`entry-${resizeRef.current.entryId}`);
      if (el) {
        const entry = weekEntries.find((e: any) => e.id === resizeRef.current!.entryId);
        if (entry) {
          const st = extractTime(entry.startTime);
          const startMins = (st.h - HOUR_START) * 60 + st.m;
          const endMins = (resizeRef.current.origEndH - HOUR_START) * 60 + resizeRef.current.origEndM;
          const topPx = (startMins / (TOTAL_HOURS * 60)) * GRID_H;
          const heightPx = Math.max(12, ((endMins - startMins) / (TOTAL_HOURS * 60)) * GRID_H);
          el.style.top = `${topPx}px`;
          el.style.height = `${heightPx}px`;
        }
      }
    };
    const handleMouseUp = () => {
      if (!resizeRef.current) return;
      const { entryId, origEndH, origEndM } = resizeRef.current;
      const entry = weekEntries.find((e: any) => e.id === entryId);
      if (entry) {
        const st = extractTime(entry.startTime);
        const d = new Date(entry.date);
        updateEntry.mutate({
          id: entryId,
          date: format(d, "yyyy-MM-dd"),
          startHour: st.h, startMin: st.m,
          endHour: origEndH, endMin: origEndM,
        });
      }
      resizeRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [weekEntries, updateEntry]);

  // ── Handlers ──
  const goToday = () => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const goPrev = () => setWeekStart(w => subWeeks(w, 1));
  const goNext = () => setWeekStart(w => addWeeks(w, 1));

  const openNewEntry = (dayIdx: number, hour: number, min: number) => {
    setEditingEntry(null);
    setFormDate(format(weekDays[dayIdx], "yyyy-MM-dd"));
    setFormStart({ h: hour, m: min });
    setFormEnd({ h: Math.min(hour + 1, HOUR_END), m: min });
    setFormTask("");
    setFormType("proiectare");
    setFormProject("");
    setFormDesc("");
    setDialogOpen(true);
  };

  const openEditEntry = (entry: any) => {
    setEditingEntry(entry);
    const st = extractTime(entry.startTime);
    const en = extractTime(entry.endTime);
    setFormDate(format(new Date(entry.date), "yyyy-MM-dd"));
    setFormStart(st);
    setFormEnd(en);
    setFormTask(entry.taskName || "");
    setFormType(entry.activityType || "proiectare");
    setFormProject(entry.projectId ? String(entry.projectId) : "");
    setFormDesc(entry.description || "");
    setDialogOpen(true);
  };

  const handleSave = () => {
    const payload = {
      date: formDate,
      startHour: formStart.h,
      startMin: formStart.m,
      endHour: formEnd.h,
      endMin: formEnd.m,
      activityType: formType as any,
      taskName: formTask || undefined,
      description: formDesc || undefined,
      projectId: formProject ? Number(formProject) : undefined,
    };
    if (editingEntry) {
      updateEntry.mutate({ id: editingEntry.id, ...payload });
    } else {
      addEntry.mutate(payload);
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (editingEntry) {
      deleteEntry.mutate({ id: editingEntry.id });
      setDialogOpen(false);
    }
  };

  // ── Drag & drop (simple: mousedown on entry body → move to new slot) ──
  const dragRef = useRef<{ entryId: number; startY: number; startX: number; origDayIdx: number; origStartMins: number; origDurMins: number } | null>(null);

  useEffect(() => {
    const handleDragMove = (e: MouseEvent) => {
      if (!dragRef.current || !gridRef.current) return;
      const el = document.getElementById(`entry-${dragRef.current.entryId}`);
      if (!el) return;
      el.style.opacity = "0.7";
      el.style.zIndex = "50";
    };
    const handleDragEnd = (e: MouseEvent) => {
      if (!dragRef.current || !gridRef.current) return;
      const { entryId, origDayIdx, origStartMins, origDurMins } = dragRef.current;
      const gridRect = gridRef.current.getBoundingClientRect();

      // Calculate new day from X position
      const colWidth = gridRect.width / 7;
      const relX = e.clientX - gridRect.left;
      let newDayIdx = Math.floor(relX / colWidth);
      newDayIdx = Math.max(0, Math.min(6, newDayIdx));

      // Calculate new start time from Y position
      const relY = e.clientY - gridRect.top + gridRef.current.scrollTop;
      const totalMinutes = (relY / GRID_H) * TOTAL_HOURS * 60 + HOUR_START * 60;
      const snappedStart = Math.round(totalMinutes / 15) * 15;
      const newStartH = Math.floor(snappedStart / 60);
      const newStartM = snappedStart % 60;
      const newEndMins = snappedStart + origDurMins;
      const newEndH = Math.floor(newEndMins / 60);
      const newEndM = newEndMins % 60;

      if (newStartH >= HOUR_START && newEndH <= HOUR_END) {
        const entry = weekEntries.find((e: any) => e.id === entryId);
        if (entry) {
          updateEntry.mutate({
            id: entryId,
            date: format(weekDays[newDayIdx], "yyyy-MM-dd"),
            startHour: newStartH, startMin: newStartM,
            endHour: newEndH, endMin: newEndM,
          });
        }
      }

      const el = document.getElementById(`entry-${entryId}`);
      if (el) { el.style.opacity = "1"; el.style.zIndex = ""; }
      dragRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.addEventListener("mousemove", handleDragMove);
    document.addEventListener("mouseup", handleDragEnd);
    return () => {
      document.removeEventListener("mousemove", handleDragMove);
      document.removeEventListener("mouseup", handleDragEnd);
    };
  }, [weekEntries, weekDays, updateEntry]);

  // ── Time insights ──
  const todayEntries = weekEntries.filter((e: any) => isToday(new Date(e.date)));
  const todayMins = todayEntries.reduce((s: number, e: any) => s + (e.durationMinutes || 0), 0);
  const weekMins = weekEntries.reduce((s: number, e: any) => s + (e.durationMinutes || 0), 0);

  // ── Admin event save ──
  const handleAdminSave = () => {
    if (!adminTitle.trim()) { toast.error("Titlul este obligatoriu"); return; }
    createEvent.mutate({
      title: adminTitle,
      link: adminLink || undefined,
      color: adminColor,
      startTime: `${adminDate}T${pad2(adminStart.h)}:${pad2(adminStart.m)}:00`,
      endTime: `${adminDate}T${pad2(adminEnd.h)}:${pad2(adminEnd.m)}:00`,
      targetType: "all",
    });
    setAdminDialogOpen(false);
  };

  // ── Header month label ──
  const headerLabel = useMemo(() => {
    const m1 = format(weekStart, "MMM", { locale: ro });
    const m2 = format(weekEnd, "MMM", { locale: ro });
    const y1 = weekStart.getFullYear();
    const y2 = weekEnd.getFullYear();
    if (y1 !== y2) return `${m1} ${y1} – ${m2} ${y2}`;
    if (m1 !== m2) return `${m1} – ${m2} ${y1}`;
    return `${m1} ${y1}`;
  }, [weekStart, weekEnd]);

  return (
    <div className="flex h-[calc(100vh-48px)] overflow-hidden bg-white">
      {/* ═══ LEFT SIDEBAR ═══ */}
      <div className="w-56 shrink-0 border-r border-gray-200 flex flex-col p-3 gap-3 overflow-y-auto">
        {/* Add activity button */}
        <Button
          onClick={() => {
            const now = new Date();
            openNewEntry(
              Math.max(0, weekDays.findIndex(d => isSameDay(d, now))),
              now.getHours(),
              Math.floor(now.getMinutes() / 15) * 15
            );
          }}
          className="w-full bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] font-semibold shadow-md"
        >
          <Plus className="h-4 w-4 mr-1" /> Adaugă activitate
        </Button>

        {/* Admin: add company event */}
        {user?.role === "admin" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAdminDate(format(new Date(), "yyyy-MM-dd"));
              setAdminTitle("");
              setAdminLink("");
              setAdminColor("#FFCB09");
              setAdminStart({ h: 10, m: 0 });
              setAdminEnd({ h: 10, m: 15 });
              setAdminDialogOpen(true);
            }}
            className="w-full text-xs border-[#221F1F]"
          >
            <Lock className="h-3 w-3 mr-1" /> Eveniment firmă
          </Button>
        )}

        {/* Mini calendar */}
        <MiniCalendar
          currentDate={weekStart}
          onDateSelect={(d) => setWeekStart(startOfWeek(d, { weekStartsOn: 1 }))}
        />

        {/* Time Insights */}
        <div className="bg-[#221F1F] rounded-lg p-3 text-white">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Time Insights</p>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-white">Azi</span>
            <span className="font-bold text-[#FFCB09]">{formatDuration(todayMins)}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5 mb-2">
            <div className="bg-[#FFCB09] h-1.5 rounded-full transition-all" style={{ width: `${Math.min(100, (todayMins / 480) * 100)}%` }} />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-white">Săptămână</span>
            <span className="font-bold text-[#FFCB09]">{formatDuration(weekMins)}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div className="bg-[#FFCB09] h-1.5 rounded-full transition-all" style={{ width: `${Math.min(100, (weekMins / 2400) * 100)}%` }} />
          </div>
        </div>

        {/* Birthdays */}
        {(birthdays as any[]).length > 0 && (
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Cake className="h-3 w-3" /> Zile de naștere
            </p>
            {(birthdays as any[]).slice(0, 4).map((b: any, i: number) => (
              <div key={i} className="text-xs text-gray-600 py-0.5">{b.name} · {b.date}</div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ MAIN CALENDAR ═══ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="h-12 shrink-0 border-b border-gray-200 flex items-center px-4 gap-3">
          <Button
            variant={isCurrentWeek ? "ghost" : "default"}
            size="sm"
            onClick={goToday}
            disabled={isCurrentWeek}
            className={cn(
              "text-xs font-semibold",
              !isCurrentWeek && "bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F]"
            )}
          >
            Azi
          </Button>
          <button onClick={goPrev} className="p-1 hover:bg-gray-100 rounded"><ChevronLeft className="h-4 w-4" /></button>
          <button onClick={goNext} className="p-1 hover:bg-gray-100 rounded"><ChevronRight className="h-4 w-4" /></button>
          <span className="text-sm font-semibold capitalize">{headerLabel}</span>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Săpt. {weekNum}</span>
        </div>

        {/* Day headers */}
        <div className="shrink-0 border-b border-gray-200 flex">
          <div className="w-12 shrink-0" /> {/* gutter for hour labels */}
          {weekDays.map((d, i) => {
            const today = isToday(d);
            const holiday = holidays.find(h => h.date === format(d, "yyyy-MM-dd"));
            const bday = (birthdays as any[]).find((b: any) => {
              if (!b.birthDate) return false;
              const bd = new Date(b.birthDate);
              return bd.getDate() === d.getDate() && bd.getMonth() === d.getMonth();
            });
            return (
              <div key={i} className="flex-1 text-center py-1.5 min-w-0">
                <div className="text-[10px] font-medium text-gray-400 uppercase">
                  {format(d, "EEE", { locale: ro })}
                </div>
                <div className={cn(
                  "text-lg font-bold mx-auto w-8 h-8 flex items-center justify-center rounded-full",
                  today ? "bg-[#FFCB09] text-[#221F1F]" : "text-gray-800"
                )}>
                  {d.getDate()}
                </div>
                {holiday && <div className="text-[8px] text-red-500 font-medium truncate px-1">{holiday.name}</div>}
                {bday && <div className="text-[8px] text-pink-500 flex items-center justify-center gap-0.5"><Cake className="h-2.5 w-2.5" />{(bday as any).name?.split(" ")[0]}</div>}
              </div>
            );
          })}
        </div>

        {/* Grid */}
        <div ref={gridRef} className="flex-1 overflow-y-auto overflow-x-hidden relative" style={{ scrollbarGutter: "stable" }}>
          <div className="flex relative" style={{ height: `${GRID_H}px` }}>
            {/* Hour labels */}
            <div className="w-12 shrink-0 relative">
              {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                <div
                  key={i}
                  className="absolute right-2 text-[10px] text-gray-400 leading-none"
                  style={{ top: `${i * SLOT_H - 5}px` }}
                >
                  {pad2(HOUR_START + i)}:00
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map((day, dayIdx) => {
              const dayStr = format(day, "yyyy-MM-dd");
              const dayEntries = weekEntries.filter((e: any) => format(new Date(e.date), "yyyy-MM-dd") === dayStr);
              const dayEvents = (companyEvents as any[]).filter((ev: any) => {
                const evDate = format(new Date(ev.startTime), "yyyy-MM-dd");
                return evDate === dayStr;
              });

              return (
                <div key={dayIdx} className="flex-1 relative border-l border-gray-100 min-w-0">
                  {/* Hour lines */}
                  {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                    <div
                      key={i}
                      className="absolute w-full border-t border-gray-100"
                      style={{ top: `${i * SLOT_H}px` }}
                    />
                  ))}
                  {/* Half-hour lines */}
                  {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                    <div
                      key={`half-${i}`}
                      className="absolute w-full border-t border-gray-50"
                      style={{ top: `${i * SLOT_H + SLOT_H / 2}px` }}
                    />
                  ))}

                  {/* Click to add */}
                  <div
                    className="absolute inset-0 cursor-pointer"
                    onDoubleClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const relY = e.clientY - rect.top;
                      const totalMins = (relY / GRID_H) * TOTAL_HOURS * 60;
                      const snapped = Math.round(totalMins / 15) * 15;
                      const h = Math.floor(snapped / 60) + HOUR_START;
                      const m = snapped % 60;
                      openNewEntry(dayIdx, h, m);
                    }}
                  />

                  {/* Company events (admin, non-editable) */}
                  {dayEvents.map((ev: any) => {
                    const st = extractTime(ev.startTime);
                    const en = extractTime(ev.endTime);
                    const startMins = (st.h - HOUR_START) * 60 + st.m;
                    const endMins = (en.h - HOUR_START) * 60 + en.m;
                    const topPx = (startMins / (TOTAL_HOURS * 60)) * GRID_H;
                    const heightPx = Math.max(16, ((endMins - startMins) / (TOTAL_HOURS * 60)) * GRID_H);
                    return (
                      <div
                        key={`ev-${ev.id}`}
                        className="absolute left-0.5 right-0.5 rounded px-1 py-0.5 overflow-hidden border-l-2 opacity-80"
                        style={{
                          top: `${topPx}px`,
                          height: `${heightPx}px`,
                          backgroundColor: (ev.color || "#FFCB09") + "33",
                          borderLeftColor: ev.color || "#FFCB09",
                        }}
                      >
                        <div className="flex items-center gap-0.5 text-[9px] font-medium text-gray-700 truncate">
                          <Lock className="h-2.5 w-2.5 shrink-0" />
                          {ev.title}
                          {ev.link && (
                            <a href={ev.link} target="_blank" rel="noopener" className="ml-auto shrink-0" onClick={e => e.stopPropagation()}>
                              <ExternalLink className="h-2.5 w-2.5 text-blue-500" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* User entries */}
                  {dayEntries.map((entry: any, eIdx: number) => {
                    const st = extractTime(entry.startTime);
                    const en = extractTime(entry.endTime);
                    const startMins = (st.h - HOUR_START) * 60 + st.m;
                    const endMins = (en.h - HOUR_START) * 60 + en.m;
                    const topPx = (startMins / (TOTAL_HOURS * 60)) * GRID_H;
                    const heightPx = Math.max(16, ((endMins - startMins) / (TOTAL_HOURS * 60)) * GRID_H);
                    const colorIdx = eIdx % 2;
                    const colors = ENTRY_COLORS[colorIdx];

                    return (
                      <div
                        key={entry.id}
                        id={`entry-${entry.id}`}
                        className="absolute left-0.5 right-0.5 rounded px-1.5 py-0.5 cursor-pointer select-none group overflow-hidden"
                        style={{
                          top: `${topPx}px`,
                          height: `${heightPx}px`,
                          backgroundColor: colors.bg,
                          color: colors.text,
                          zIndex: 10,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditEntry(entry);
                        }}
                        onMouseDown={(e) => {
                          // Start drag (not on resize handle)
                          if ((e.target as HTMLElement).dataset.resize) return;
                          e.preventDefault();
                          dragRef.current = {
                            entryId: entry.id,
                            startY: e.clientY,
                            startX: e.clientX,
                            origDayIdx: dayIdx,
                            origStartMins: startMins,
                            origDurMins: endMins - startMins,
                          };
                          document.body.style.cursor = "grabbing";
                          document.body.style.userSelect = "none";
                        }}
                      >
                        <div className="text-[10px] font-semibold truncate leading-tight">
                          {entry.taskName || entry.activityType}
                        </div>
                        {heightPx > 24 && (
                          <div className="text-[9px] opacity-80 truncate">
                            {pad2(st.h)}:{pad2(st.m)} – {pad2(en.h)}:{pad2(en.m)}
                          </div>
                        )}
                        {/* Resize handle */}
                        <div
                          data-resize="true"
                          className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ backgroundColor: colors.text + "33" }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            resizeRef.current = {
                              entryId: entry.id,
                              startY: e.clientY,
                              origEndH: en.h,
                              origEndM: en.m,
                            };
                            document.body.style.cursor = "s-resize";
                            document.body.style.userSelect = "none";
                          }}
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

      {/* ═══ ADD/EDIT DIALOG ═══ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#221F1F]">
              {editingEntry ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4 text-[#FFCB09]" />}
              {editingEntry ? "Editează activitate" : "Adaugă activitate"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Titlu activitate</Label>
              <Input value={formTask} onChange={e => setFormTask(e.target.value)} placeholder="ex: Redactare plan arhitectural..." className="h-8" />
            </div>
            <div>
              <Label className="text-xs">Data</Label>
              <Input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="h-8" />
            </div>
            <div className="flex gap-4">
              <TimePicker label="Ora start" value={formStart} onChange={(v) => {
                setFormStart(v);
                // Auto-adjust end if needed
                const startMins = v.h * 60 + v.m;
                const endMins = formEnd.h * 60 + formEnd.m;
                if (endMins <= startMins) {
                  const newEnd = startMins + 60;
                  setFormEnd({ h: Math.floor(newEnd / 60), m: newEnd % 60 });
                }
              }} />
              <TimePicker label="Ora final" value={formEnd} onChange={setFormEnd} minTime={formStart} />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label className="text-xs">Tip activitate</Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_TYPES.map(t => <SelectItem key={t} value={t} className="text-xs capitalize">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label className="text-xs">Proiect (opțional)</Label>
                <Select value={formProject} onValueChange={setFormProject}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Fără proiect" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs">Fără proiect</SelectItem>
                    {(projects as any[]).map((p: any) => (
                      <SelectItem key={p.id} value={String(p.id)} className="text-xs">{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Descriere (opțional)</Label>
              <Textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Detalii..." rows={2} className="text-xs" />
            </div>
            <div className="flex justify-between pt-2">
              {editingEntry && (
                <Button variant="destructive" size="sm" onClick={handleDelete} className="text-xs">
                  <Trash2 className="h-3 w-3 mr-1" /> Șterge
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button variant="ghost" size="sm" onClick={() => setDialogOpen(false)} className="text-xs">Anulează</Button>
                <Button size="sm" onClick={handleSave} className="bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] text-xs font-semibold">
                  {editingEntry ? "Salvează" : "Adaugă"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ ADMIN EVENT DIALOG ═══ */}
      <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#221F1F]">
              <Lock className="h-4 w-4" /> Eveniment firmă
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Titlu</Label>
              <Input value={adminTitle} onChange={e => setAdminTitle(e.target.value)} placeholder="ex: Daily standup" className="h-8" />
            </div>
            <div>
              <Label className="text-xs">Link (Zoom, adresă etc.)</Label>
              <Input value={adminLink} onChange={e => setAdminLink(e.target.value)} placeholder="https://zoom.us/..." className="h-8" />
            </div>
            <div>
              <Label className="text-xs">Data</Label>
              <Input type="date" value={adminDate} onChange={e => setAdminDate(e.target.value)} className="h-8" />
            </div>
            <div className="flex gap-4">
              <TimePicker label="Start" value={adminStart} onChange={setAdminStart} />
              <TimePicker label="Final" value={adminEnd} onChange={setAdminEnd} minTime={adminStart} />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="ghost" size="sm" onClick={() => setAdminDialogOpen(false)} className="text-xs">Anulează</Button>
              <Button size="sm" onClick={handleAdminSave} className="bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] text-xs font-semibold">Creează</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
