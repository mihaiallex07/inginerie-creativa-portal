import { useState, useMemo, useRef, useEffect, useCallback } from "react";
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
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, ExternalLink, Cake, Lock, Download, Calendar, RefreshCw, Unlink, Search, Repeat2, Hourglass, X, Check, UserPlus, Users } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

// ─── Constants ─────────────────────────────────────────────────────────────
const HOUR_START = 0;
const HOUR_END = 24;
const TOTAL_HOURS = HOUR_END - HOUR_START; // 24 hours
const SLOT_HEIGHT = 52; // px per hour — fixed, enables vertical scroll
const SCROLL_TO_HOUR = 7; // auto-scroll to 07:00 on load
const DRAG_THRESHOLD = 5;

const ACTIVITY_TYPES = [
  "proiectare", "consultanta", "sedinta", "documentare",
  "deplasare", "administrativ", "verificare", "executie",
] as const;

// All entries: yellow with 75% opacity, dark text
const ENTRY_BG = "rgba(255,203,9,0.75)";
const ENTRY_TEXT = "#221F1F";
const ENTRY_BORDER = "#FFCB09";

// Romanian public holidays
function getRomanianHolidays(year: number) {
  const fixed = [
    { m: 1, d: 1, name: "Anul Nou" }, { m: 1, d: 2, name: "Anul Nou" },
    { m: 1, d: 24, name: "Ziua Unirii" }, { m: 5, d: 1, name: "Ziua Muncii" },
    { m: 6, d: 1, name: "Ziua Copilului" }, { m: 8, d: 15, name: "Adormirea Maicii Domnului" },
    { m: 11, d: 30, name: "Sf. Andrei" }, { m: 12, d: 1, name: "Ziua Națională" },
    { m: 12, d: 25, name: "Crăciun" }, { m: 12, d: 26, name: "Crăciun" },
  ];
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

/** Extract time from entry — prefer integer columns, fallback to timestamp */
function extractEntryTime(entry: any, which: "start" | "end"): { h: number; m: number } {
  if (which === "start" && entry.startHour != null) return { h: entry.startHour, m: entry.startMin ?? 0 };
  if (which === "end" && entry.endHour != null) return { h: entry.endHour, m: entry.endMin ?? 0 };
  // Fallback for old data or company events
  const d = which === "start" ? entry.startTime : entry.endTime;
  if (!d) return { h: 0, m: 0 };
  const dt = typeof d === "string" ? new Date(d) : d;
  return { h: dt.getHours(), m: dt.getMinutes() };
}

/** Extract time from a raw Date/string (for company events) */
function extractTime(d: Date | string | null | undefined): { h: number; m: number } {
  if (!d) return { h: 0, m: 0 };
  const dt = typeof d === "string" ? new Date(d) : d;
  return { h: dt.getHours(), m: dt.getMinutes() };
}

function formatDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m > 0 ? `${pad2(m)}m` : ""}` : `${m}m`;
}

// ─── Mini Calendar ─────────────────────────────────────────────────────────
function MiniCalendar({ selectedDate, onDateSelect }: {
  selectedDate: Date;
  onDateSelect: (d: Date) => void;
}) {
  const [viewMonth, setViewMonth] = useState(startOfMonth(selectedDate));
  useEffect(() => { setViewMonth(startOfMonth(selectedDate)); }, [selectedDate]);

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

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-1">
        <button onClick={() => setViewMonth(v => new Date(v.getFullYear(), v.getMonth() - 1, 1))} className="p-0.5 hover:bg-gray-100 rounded"><ChevronLeft className="h-3 w-3" /></button>
        <span className="text-[10px] font-semibold capitalize">{format(viewMonth, "MMMM yyyy", { locale: ro })}</span>
        <button onClick={() => setViewMonth(v => new Date(v.getFullYear(), v.getMonth() + 1, 1))} className="p-0.5 hover:bg-gray-100 rounded"><ChevronRight className="h-3 w-3" /></button>
      </div>
      <div className="grid grid-cols-7 gap-0 text-center">
        {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
          <div key={i} className="text-[9px] font-medium text-gray-400 py-0.5">{d}</div>
        ))}
        {weeks.flat().map((d, i) => {
          const inMonth = isSameMonth(d, viewMonth);
          const today = isToday(d);
          const selected = isSameDay(d, selectedDate) && !today;
          return (
            <button
              key={i}
              onClick={() => onDateSelect(d)}
              className={cn(
                "text-[9px] w-5 h-5 rounded-full mx-auto flex items-center justify-center transition-colors",
                !inMonth && "text-gray-300",
                inMonth && !today && !selected && "text-gray-700 hover:bg-gray-100",
                today && "bg-[#FFCB09] text-[#221F1F] font-bold",
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
  const allOptions: { h: number; m: number }[] = [];
  for (let h = 0; h < 24; h++) for (let m = 0; m < 60; m += 15) allOptions.push({ h, m });

  const currentMins = value.h * 60 + value.m;
  const windowMins = 3 * 60;
  let filtered = allOptions.filter(o => {
    const oMins = o.h * 60 + o.m;
    return oMins >= currentMins - windowMins && oMins <= currentMins + windowMins;
  });
  if (minTime) {
    const minMins = minTime.h * 60 + minTime.m + 15;
    filtered = filtered.filter(o => o.h * 60 + o.m >= minMins);
  }
  if (!filtered.find(o => o.h === value.h && o.m === value.m)) {
    filtered.push(value);
    filtered.sort((a, b) => (a.h * 60 + a.m) - (b.h * 60 + b.m));
  }
  const valStr = `${pad2(value.h)}:${pad2(value.m)}`;

  return (
    <div>
      <Label className="text-[10px] text-gray-500 mb-0.5">{label}</Label>
      <Select value={valStr} onValueChange={(v) => {
        const [hh, mm] = v.split(":").map(Number);
        onChange({ h: hh, m: mm });
      }}>
        <SelectTrigger className="h-7 text-xs w-20"><SelectValue /></SelectTrigger>
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

// ─── Timer Quick Button (inline, for TIME INSIGHTS sidebar) ─────────────────
function TimerQuickButton() {
  const utils = trpc.useUtils();
  const { data: runningTimer } = trpc.timeTracking.runningTimer.useQuery(undefined, { refetchInterval: 5000 });
  const stopMutation = trpc.timeTracking.stopTimer.useMutation({
    onSuccess: (data) => {
      utils.timeTracking.runningTimer.invalidate();
      utils.timeTracking.myEntries.invalidate();
      const mins = data.durationMinutes ?? 0;
      const h = Math.floor(mins / 60); const m = mins % 60;
      toast.success(`Timer oprit — ${h > 0 ? `${h}h ` : ""}${m}m înregistrate`);
    },
  });

  const isRunning = !!runningTimer?.isRunning;
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!isRunning || !runningTimer?.startTime) { setElapsed(0); return; }
    const update = () => setElapsed(Math.floor((Date.now() - new Date(runningTimer.startTime!).getTime()) / 1000));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [isRunning, runningTimer?.startTime]);

  const fmt = (s: number) => `${String(Math.floor(s/3600)).padStart(2,"0")}:${String(Math.floor((s%3600)/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  if (!isRunning) return null;

  return (
    <div className="flex items-center justify-between gap-1">
      <div className="flex items-center gap-1 min-w-0">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
        <span className="text-[10px] font-mono text-green-400 tabular-nums">{fmt(elapsed)}</span>
      </div>
      <button
        onClick={() => runningTimer?.id && stopMutation.mutate({ id: runningTimer.id })}
        disabled={stopMutation.isPending}
        className="text-[9px] px-1.5 py-0.5 rounded bg-red-600/80 hover:bg-red-600 text-white transition-colors shrink-0"
      >
        Stop
      </button>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function TimeTracking() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const isCurrentWeek = isSameDay(weekStart, startOfWeek(new Date(), { weekStartsOn: 1 }));
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const weekNum = getISOWeek(weekStart);

  // ── Grid: fixed SLOT_HEIGHT per hour, vertical scroll, auto-scroll to 07:00 ──
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const gridHeight = TOTAL_HOURS * SLOT_HEIGHT; // total scrollable height
  const slotH = SLOT_HEIGHT;
  useEffect(() => {
    if (gridContainerRef.current) {
      gridContainerRef.current.scrollTop = SCROLL_TO_HOUR * SLOT_HEIGHT;
    }
  }, []);

  // ── Dialog state (user entries) ──
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
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [adminTitle, setAdminTitle] = useState("");
  const [adminLink, setAdminLink] = useState("");
  const [adminColor, setAdminColor] = useState("#FFCB09");
  const [adminDate, setAdminDate] = useState("");
  const [adminStart, setAdminStart] = useState<{ h: number; m: number }>({ h: 10, m: 0 });
  const [adminEnd, setAdminEnd] = useState<{ h: number; m: number }>({ h: 10, m: 15 });

  // ── Recurring activities state ──
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<any>(null);
  const [recForm, setRecForm] = useState({ taskName: "", activityType: "administrativ", projectId: "", startHour: 13, startMin: 0, durationMinutes: 30, countInTime: false, startDate: format(new Date(), "yyyy-MM-dd"), endDate: "" });

  // ── Invite state ──
  const [savedEntryId, setSavedEntryId] = useState<number | null>(null);
  const [invitePanelOpen, setInvitePanelOpen] = useState(false);
  const [inviteSearch, setInviteSearch] = useState("");
  // pendingInvitees: users selected BEFORE save (new entries)
  const [pendingInvitees, setPendingInvitees] = useState<Array<{id: number; name: string}>>([]);
  // ── Google Calendar state ──
  const [gcalImportOpen, setGcalImportOpen] = useState(false);
  const [gcalImportDate, setGcalImportDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [gcalImportDateTo, setGcalImportDateTo] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [gcalFilter, setGcalFilter] = useState("");
  const [gcalSelectedIds, setGcalSelectedIds] = useState<Set<string>>(new Set());
  const [gcalBulkImporting, setGcalBulkImporting] = useState(false);

  // ── Recurring queries ──
  const { data: recurringList = [], refetch: refetchRecurring } = trpc.recurring.list.useQuery();
  const { data: recurringExceptions = [] } = trpc.recurring.exceptions.useQuery(
    { dateFrom: format(weekStart, "yyyy-MM-dd"), dateTo: format(weekEnd, "yyyy-MM-dd") },
    { enabled: (recurringList as any[]).length > 0 }
  );
  const createRecurring = trpc.recurring.create.useMutation({ onSuccess: () => { refetchRecurring(); toast.success("Activitate recurentă creată"); setRecurringOpen(false); }, onError: (e) => toast.error(e.message) });
  const updateRecurring = trpc.recurring.update.useMutation({ onSuccess: () => { refetchRecurring(); toast.success("Activitate recurentă actualizată"); setRecurringOpen(false); }, onError: (e) => toast.error(e.message) });
  const deleteRecurring = trpc.recurring.delete.useMutation({ onSuccess: () => { refetchRecurring(); toast.success("Activitate recurentă oprită"); }, onError: (e) => toast.error(e.message) });
  const upsertException = trpc.recurring.upsertException.useMutation({ onError: (e) => toast.error(e.message) });

  // ── Compute recurring blocks for the current week ──
  const recurringWeekBlocks = useMemo(() => {
    const blocks: Array<{ recurringId: number; dayIdx: number; startHour: number; startMin: number; durationMinutes: number; taskName: string; activityType: string; projectId: number | null; countInTime: boolean; isException: boolean; isDeleted: boolean }> = [];
    for (const rec of (recurringList as any[])) {
      for (let i = 0; i < 7; i++) {
        const day = weekDays[i];
        const dayStr = format(day, "yyyy-MM-dd");
        // Check period
        if (dayStr < rec.startDate) continue;
        if (rec.endDate && dayStr > rec.endDate) continue;
        // Check for exception
        const exc = (recurringExceptions as any[]).find(e => e.recurringId === rec.id && format(new Date(e.exceptionDate), "yyyy-MM-dd") === dayStr);
        if (exc?.isDeleted) continue;
        blocks.push({
          recurringId: rec.id,
          dayIdx: i,
          startHour: exc?.overrideStartHour ?? rec.startHour,
          startMin: exc?.overrideStartMin ?? rec.startMin,
          durationMinutes: exc?.overrideDuration ?? rec.durationMinutes,
          taskName: rec.taskName,
          activityType: rec.activityType,
          projectId: rec.projectId ?? null,
          countInTime: rec.countInTime,
          isException: !!exc,
          isDeleted: false,
        });
      }
    }
    return blocks;
  }, [recurringList, recurringExceptions, weekDays]);

  // ── Google Calendar queries ──
  const { data: gcalStatus, refetch: refetchGcalStatus } = trpc.googleCalendar.status.useQuery();
  const gcalConnected = gcalStatus?.connected ?? false;
  const { data: gcalAuthData } = trpc.googleCalendar.getAuthUrl.useQuery(
    { origin: typeof window !== "undefined" ? window.location.origin : "" },
    { enabled: !gcalConnected }
  );
  const { data: gcalTodayEvents, refetch: refetchGcalEvents } = trpc.googleCalendar.importTodayEvents.useQuery(
    { date: gcalImportDate, dateTo: gcalImportDateTo },
    { enabled: gcalConnected && gcalImportOpen }
  );
  const gcalDisconnect = trpc.googleCalendar.disconnect.useMutation({
    onSuccess: () => { refetchGcalStatus(); toast.success("Google Calendar deconectat"); },
  });
  const gcalSyncEntry = trpc.googleCalendar.syncTimeEntry.useMutation();

  // ── Export dialog ──
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFrom, setExportFrom] = useState(() => format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"));
  const [exportTo, setExportTo] = useState(() => format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"));
  const [exportProject, setExportProject] = useState("all");
  const [exportType, setExportType] = useState("all");
  const [exportTaskName, setExportTaskName] = useState("");
  const [exportEmployee, setExportEmployee] = useState("self");

  // ── Data queries ──
  const dateFrom = format(weekStart, "yyyy-MM-dd");
  const dateTo = format(weekEnd, "yyyy-MM-dd");
  const { data: entries = [], refetch: refetchEntries } = trpc.timeTracking.myEntries.useQuery({});
  const { data: projects = [] } = trpc.projects.list.useQuery({});
  const { data: companyEvents = [], refetch: refetchEvents } = trpc.companyEvents.list.useQuery({ dateFrom, dateTo });
  const { data: birthdays = [] } = trpc.people.upcomingBirthdays.useQuery({ daysAhead: 14 });
  const isAdmin = user?.role === "admin";
  const { data: allUsers = [] } = trpc.users.list.useQuery(undefined as any, { enabled: !!isAdmin });
  // All users for invitations (available to everyone)
  const { data: allUsersForInvite = [] } = trpc.users.list.useQuery(undefined as any);

  const holidays = useMemo(() => {
    const y1 = weekStart.getFullYear();
    const y2 = weekEnd.getFullYear();
    const h = getRomanianHolidays(y1);
    if (y2 !== y1) h.push(...getRomanianHolidays(y2));
    return h;
  }, [weekStart, weekEnd]);

  const weekEntries = useMemo(() => {
    return (entries as any[]).filter((e: any) => {
      // Accept entries with integer hour columns OR legacy timestamp columns
      const hasTime = (e.startHour != null && e.endHour != null) || (e.startTime && e.endTime);
      if (!hasTime) return false;
      const d = new Date(e.date);
      return d >= weekStart && d <= weekEnd;
    });
  }, [entries, weekStart, weekEnd]);

  // ── Mutations ──
  const addEntry = trpc.timeTracking.addCalendarEntry.useMutation({
    onSuccess: () => { refetchEntries(); toast.success("Activitate adăugată"); },
    onError: (e) => toast.error(e.message),
  });
  const addManualEntry = trpc.timeTracking.addCalendarEntry.useMutation({
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
  const inviteUser = trpc.invitations.invite.useMutation({
    onSuccess: () => { toast.success("Invitație trimisă!"); utils.invitations.forEntry.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const { data: entryInvitations = [] } = trpc.invitations.forEntry.useQuery(
    { timeEntryId: savedEntryId! },
    { enabled: !!savedEntryId && dialogOpen }
  );
  const utils = trpc.useUtils();
  const createEvent = trpc.companyEvents.create.useMutation({
    onSuccess: () => { refetchEvents(); toast.success("Eveniment creat"); },
    onError: (e) => toast.error(e.message),
  });
  const updateEvent = trpc.companyEvents.update.useMutation({
    onSuccess: () => { refetchEvents(); toast.success("Eveniment actualizat"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteEvent = trpc.companyEvents.delete.useMutation({
    onSuccess: () => { refetchEvents(); toast.success("Eveniment șters"); },
    onError: (e) => toast.error(e.message),
  });

  // ── Drag state with threshold + ghost ──
  const [dragGhost, setDragGhost] = useState<{ x: number; y: number; label: string; height: number } | null>(null);
  const dragRef = useRef<{
    entryId: number; startY: number; startX: number;
    origDayIdx: number; origStartMins: number; origDurMins: number; activated: boolean;
  } | null>(null);

  // ── Resize state ──
  const resizeRef = useRef<{
    entryId: number; startY: number; origEndH: number; origEndM: number; activated: boolean;
  } | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizeRef.current && gridContainerRef.current) {
        if (!resizeRef.current.activated) {
          if (Math.abs(e.clientY - resizeRef.current.startY) < DRAG_THRESHOLD) return;
          resizeRef.current.activated = true;
        }
        const gridRect = gridContainerRef.current.getBoundingClientRect();
        const scrollTop = gridContainerRef.current.scrollTop;
        // MUST add scrollTop for resize too
        const relY = e.clientY - gridRect.top + scrollTop;
        const totalMinutes = (relY / gridHeight) * TOTAL_HOURS * 60 + HOUR_START * 60;
        const snapped = Math.round(totalMinutes / 15) * 15;
        const newH = Math.floor(snapped / 60);
        const newM = snapped % 60;
        resizeRef.current.origEndH = Math.max(HOUR_START, Math.min(HOUR_END, newH));
        resizeRef.current.origEndM = newM;
        const el = document.getElementById(`entry-${resizeRef.current.entryId}`);
        if (el) {
          const entry = weekEntries.find((en: any) => en.id === resizeRef.current!.entryId);
          if (entry) {
            const st = extractEntryTime(entry, "start");
            const startMins = (st.h - HOUR_START) * 60 + st.m;
            const endMins = (resizeRef.current.origEndH - HOUR_START) * 60 + resizeRef.current.origEndM;
            const heightPx = Math.max(8, (endMins / (TOTAL_HOURS * 60)) * gridHeight - (startMins / (TOTAL_HOURS * 60)) * gridHeight);
            el.style.height = `${heightPx}px`;
          }
        }
        return;
      }
      if (dragRef.current && gridContainerRef.current) {
        if (!dragRef.current.activated) {
          const dx = Math.abs(e.clientX - dragRef.current.startX);
          const dy = Math.abs(e.clientY - dragRef.current.startY);
          if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) return;
          dragRef.current.activated = true;
        }
        const el = document.getElementById(`entry-${dragRef.current.entryId}`);
        if (el) { el.style.opacity = "0.3"; el.style.zIndex = "50"; }
        // Update ghost position
        if (gridContainerRef.current) {
          const gridRect = gridContainerRef.current.getBoundingClientRect();
          const scrollTop = gridContainerRef.current.scrollTop;
          const gutterW = 40;
          const colAreaWidth = gridRect.width - gutterW;
          const relX = e.clientX - gridRect.left - gutterW;
          let colIdx = Math.floor((relX / colAreaWidth) * 7);
          colIdx = Math.max(0, Math.min(6, colIdx));
          const relY = e.clientY - gridRect.top + scrollTop;
          const totalMins = (relY / gridHeight) * TOTAL_HOURS * 60;
          const snapped = Math.round(totalMins / 15) * 15;
          const newH = Math.floor(snapped / 60);
          const newM = snapped % 60;
          const { origDurMins } = dragRef.current;
          const endMins = snapped + origDurMins;
          const endH = Math.floor(endMins / 60);
          const endM = endMins % 60;
          const dayName = weekDays[colIdx] ? format(weekDays[colIdx], "EEE d", { locale: ro }) : "";
          setDragGhost({
            x: e.clientX,
            y: e.clientY,
            label: `${dayName}  ${pad2(newH)}:${pad2(newM)} – ${pad2(endH)}:${pad2(endM)}`,
            height: Math.max(16, (origDurMins / (TOTAL_HOURS * 60)) * gridHeight),
          });
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (resizeRef.current) {
        if (resizeRef.current.activated) {
          const { entryId, origEndH, origEndM } = resizeRef.current;
          const entry = weekEntries.find((en: any) => en.id === entryId);
          if (entry) {
            const st = extractEntryTime(entry, "start");
            const d = new Date(entry.date);
            updateEntry.mutate({
              id: entryId, date: format(d, "yyyy-MM-dd"),
              startHour: st.h, startMin: st.m, endHour: origEndH, endMin: origEndM,
            });
          }
        }
        resizeRef.current = null;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        return;
      }
      if (dragRef.current) {
        if (dragRef.current.activated && gridContainerRef.current) {
          const { entryId, origDurMins, origDayIdx } = dragRef.current;
          const gridRect = gridContainerRef.current.getBoundingClientRect();
          const scrollTop = gridContainerRef.current.scrollTop;
          // Subtract the gutter width (w-10 = 40px)
          const gutterW = 40;
          const colAreaLeft = gridRect.left + gutterW;
          const colAreaWidth = gridRect.width - gutterW;
          const relX = e.clientX - colAreaLeft;
          let newDayIdx = Math.floor((relX / colAreaWidth) * 7);
          newDayIdx = Math.max(0, Math.min(6, newDayIdx));
          // MUST add scrollTop — without it, dragging after scrolling gives wrong hour
          const relY = e.clientY - gridRect.top + scrollTop;
          const totalMinutes = (relY / gridHeight) * TOTAL_HOURS * 60 + HOUR_START * 60;
          const snappedStart = Math.round(totalMinutes / 15) * 15;
          const newStartH = Math.floor(snappedStart / 60);
          const newStartM = snappedStart % 60;
          const newEndMins = snappedStart + origDurMins;
          const newEndH = Math.floor(newEndMins / 60);
          const newEndM = newEndMins % 60;
          if (newStartH >= HOUR_START && newEndH <= HOUR_END) {
            if (entryId < 0) {
              // Recurring block drag — create exception with new time
              const recurringId = Math.floor((-entryId) / 1000);
              const exceptionDate = format(weekDays[origDayIdx], "yyyy-MM-dd");
              upsertException.mutate({
                recurringId, exceptionDate,
                overrideStartHour: newStartH, overrideStartMin: newStartM,
                overrideDuration: origDurMins,
              });
            } else {
              updateEntry.mutate({
                id: entryId, date: format(weekDays[newDayIdx], "yyyy-MM-dd"),
                startHour: newStartH, startMin: newStartM, endHour: newEndH, endMin: newEndM,
              });
            }
          }
        }
        const el = document.getElementById(`entry-${dragRef.current.entryId}`);
        if (el) { el.style.opacity = "1"; el.style.zIndex = ""; }
        dragRef.current = null;
        setDragGhost(null);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [weekEntries, weekDays, updateEntry, gridHeight, slotH]);

  // ── Handlers ──
  const goToday = () => { const t = new Date(); setSelectedDate(t); setWeekStart(startOfWeek(t, { weekStartsOn: 1 })); };
  const goPrev = () => setWeekStart(w => subWeeks(w, 1));
  const goNext = () => setWeekStart(w => addWeeks(w, 1));
  const handleDateSelect = (d: Date) => { setSelectedDate(d); setWeekStart(startOfWeek(d, { weekStartsOn: 1 })); };

  const openNewEntry = (dayIdx: number, h: number, m: number) => {
    setEditingEntry(null);
    setSavedEntryId(null);
    setPendingInvitees([]);
    setInviteSearch("");
    setFormDate(format(weekDays[dayIdx], "yyyy-MM-dd"));
    setFormStart({ h, m }); setFormEnd({ h: Math.min(h + 1, HOUR_END), m });
    setFormTask(""); setFormType("proiectare"); setFormProject(""); setFormDesc("");
    setDialogOpen(true);
  };

  const openEditEntry = (entry: any) => {
    setEditingEntry(entry);
    const st = extractEntryTime(entry, "start");
    const en = extractEntryTime(entry, "end");
    setFormDate(format(new Date(entry.date), "yyyy-MM-dd"));
    setFormStart(st); setFormEnd(en);
    setFormTask(entry.taskName || ""); setFormType(entry.activityType || "proiectare");
    setFormProject(entry.projectId ? String(entry.projectId) : ""); setFormDesc(entry.description || "");
    setDialogOpen(true);
  };

  const handleSave = () => {
    const payload = {
      date: formDate, startHour: formStart.h, startMin: formStart.m,
      endHour: formEnd.h, endMin: formEnd.m, activityType: formType as any,
      taskName: formTask || undefined, description: formDesc || undefined,
      projectId: formProject && formProject !== "none" ? Number(formProject) : undefined,
    };
    if (editingEntry) {
      updateEntry.mutate({ id: editingEntry.id, ...payload }, {
        onSuccess: () => {
          setSavedEntryId(editingEntry.id);
          // Send invitations for any newly added pending invitees
          for (const u of pendingInvitees) {
            if (!(entryInvitations as any[]).some((inv: any) => inv.inviteeUserId === u.id)) {
              inviteUser.mutate({ timeEntryId: editingEntry.id, inviteeUserId: u.id });
            }
          }
          setPendingInvitees([]);
          setDialogOpen(false);
        },
      });
    } else {
      addEntry.mutate(payload, {
        onSuccess: (result: any) => {
          if (result?.id) {
            setSavedEntryId(result.id);
            // Send invitations atomically with save
            for (const u of pendingInvitees) {
              inviteUser.mutate({ timeEntryId: result.id, inviteeUserId: u.id });
            }
            setPendingInvitees([]);
          }
          setDialogOpen(false);
        },
      });
    }
  };

  const handleDelete = () => { if (editingEntry) { deleteEntry.mutate({ id: editingEntry.id }); setDialogOpen(false); } };

  // ── Admin event handlers ──
  const openAdminEventNew = () => {
    setEditingEvent(null); setAdminDate(format(new Date(), "yyyy-MM-dd"));
    setAdminTitle(""); setAdminLink(""); setAdminColor("#FFCB09");
    setAdminStart({ h: 10, m: 0 }); setAdminEnd({ h: 10, m: 15 });
    setAdminDialogOpen(true);
  };
  const openAdminEventEdit = (ev: any) => {
    setEditingEvent(ev);
    const st = extractTime(ev.startTime); const en = extractTime(ev.endTime);
    setAdminDate(format(new Date(ev.startTime), "yyyy-MM-dd"));
    setAdminTitle(ev.title || ""); setAdminLink(ev.link || ""); setAdminColor(ev.color || "#FFCB09");
    setAdminStart(st); setAdminEnd(en); setAdminDialogOpen(true);
  };
  const handleAdminSave = () => {
    if (!adminTitle.trim()) { toast.error("Titlul este obligatoriu"); return; }
    const startISO = `${adminDate}T${pad2(adminStart.h)}:${pad2(adminStart.m)}:00`;
    const endISO = `${adminDate}T${pad2(adminEnd.h)}:${pad2(adminEnd.m)}:00`;
    if (editingEvent) {
      updateEvent.mutate({ id: editingEvent.id, title: adminTitle, link: adminLink || undefined, color: adminColor, startTime: startISO, endTime: endISO });
    } else {
      createEvent.mutate({ title: adminTitle, link: adminLink || undefined, color: adminColor, startTime: startISO, endTime: endISO, targetType: "all" });
    }
    setAdminDialogOpen(false);
  };
  const handleAdminDelete = () => { if (editingEvent) { deleteEvent.mutate({ id: editingEvent.id }); setAdminDialogOpen(false); } };

  // ── Export logic ──
  const exportEntries = useMemo(() => {
    return (entries as any[]).filter((e: any) => {
      const hasTime = (e.startHour != null) || e.startTime;
      if (!hasTime || !e.date) return false;
      const d = format(new Date(e.date), "yyyy-MM-dd");
      if (d < exportFrom || d > exportTo) return false;
      if (exportProject !== "all" && String(e.projectId || "") !== exportProject) return false;
      if (exportType !== "all" && e.activityType !== exportType) return false;
      if (exportTaskName && !(e.taskName || "").toLowerCase().includes(exportTaskName.toLowerCase())) return false;
      return true;
    });
  }, [entries, exportFrom, exportTo, exportProject, exportType, exportTaskName]);

  const buildExportUrl = (fmt: "excel" | "pdf") => {
    const params = new URLSearchParams();
    if (exportFrom) params.set("dateFrom", exportFrom);
    if (exportTo) params.set("dateTo", exportTo);
    if (exportProject !== "all") params.set("projectId", exportProject);
    if (exportType !== "all") params.set("activityType", exportType);
    if (exportTaskName) params.set("taskName", exportTaskName);
    if (isAdmin && exportEmployee !== "self") params.set("employeeId", exportEmployee);
    return `/api/reports/time-tracking/${fmt}?${params.toString()}`;
  };

  const handleExportExcel = () => {
    window.open(buildExportUrl("excel"), "_blank");
    toast.success("Export Excel \u00eenceput...");
  };

  const handleExportPDF = () => {
    window.open(buildExportUrl("pdf"), "_blank");
    toast.success("Export PDF \u00eenceput...");
  };

  // ── Time insights ──
  const todayEntries = weekEntries.filter((e: any) => isToday(new Date(e.date)));
  const todayRecurring = recurringWeekBlocks.filter(b => isToday(weekDays[b.dayIdx]) && b.countInTime);
  const todayMins = todayEntries.reduce((s: number, e: any) => s + (e.durationMinutes || 0), 0)
    + todayRecurring.reduce((s, b) => s + b.durationMinutes, 0);
  const weekMins = weekEntries.reduce((s: number, e: any) => s + (e.durationMinutes || 0), 0)
    + recurringWeekBlocks.filter(b => b.countInTime).reduce((s, b) => s + b.durationMinutes, 0);

  const headerLabel = useMemo(() => {
    const m1 = format(weekStart, "MMM", { locale: ro });
    const m2 = format(weekEnd, "MMM", { locale: ro });
    const y1 = weekStart.getFullYear(); const y2 = weekEnd.getFullYear();
    if (y1 !== y2) return `${m1} ${y1} – ${m2} ${y2}`;
    if (m1 !== m2) return `${m1} – ${m2} ${y1}`;
    return `${m1} ${y1}`;
  }, [weekStart, weekEnd]);

  // ── Compute px helpers using dynamic slotH ──
  const minsToY = useCallback((h: number, m: number) => {
    return ((h - HOUR_START) * 60 + m) / (TOTAL_HOURS * 60) * gridHeight;
  }, [gridHeight]);

  return (
    <div className="flex h-[calc(100vh-72px)] overflow-hidden bg-white">
      {/* ═══ LEFT SIDEBAR ═══ */}
      <div className="w-48 shrink-0 border-r border-gray-200 flex flex-col p-2 gap-2 overflow-hidden">
        <Button
          onClick={() => {
            const now = new Date();
            const dayIdx = weekDays.findIndex(d => isSameDay(d, now));
            openNewEntry(dayIdx >= 0 ? dayIdx : 0, now.getHours(), Math.floor(now.getMinutes() / 15) * 15);
          }}
          size="sm"
          className="w-full bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] font-semibold shadow-sm text-xs h-8"
        >
          <Plus className="h-3 w-3 mr-1" /> Adaugă activitate
        </Button>

        {(user?.role === "admin" || user?.role === "coordonator") && (
          <Button variant="outline" size="sm" onClick={() => setLocation("/evenimente")} className="w-full text-[10px] border-[#221F1F] h-7">
            <Lock className="h-3 w-3 mr-1" /> Eveniment firmă
          </Button>
        )}

        <MiniCalendar selectedDate={selectedDate} onDateSelect={handleDateSelect} />

        {/* Time Insights */}
        <div className="bg-[#221F1F] rounded-lg p-2 text-white">
          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Time Insights</p>
          <div className="flex justify-between text-[10px] mb-0.5">
            <span className="text-white">Azi</span>
            <span className="font-bold text-[#FFCB09]">{formatDuration(todayMins)}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1 mb-1.5">
            <div className="bg-[#FFCB09] h-1 rounded-full transition-all" style={{ width: `${Math.min(100, (todayMins / 480) * 100)}%` }} />
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-white">Săptămână</span>
            <span className="font-bold text-[#FFCB09]">{formatDuration(weekMins)}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1">
            <div className="bg-[#FFCB09] h-1 rounded-full transition-all" style={{ width: `${Math.min(100, (weekMins / 2400) * 100)}%` }} />
          </div>
          {/* Timer rapid — buton sub TIME INSIGHTS */}
          <div className="mt-2 pt-2 border-t border-white/10">
            <TimerQuickButton />
          </div>
        </div>

        {/* Recurring Activities Card */}
        <div className="bg-[#1a1717] rounded-lg p-2 text-white">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Repeat2 className="h-2.5 w-2.5" /> Activități recurente
            </p>
            <button
              onClick={() => { setEditingRecurring(null); setRecForm({ taskName: "", activityType: "administrativ", projectId: "", startHour: 13, startMin: 0, durationMinutes: 30, countInTime: false, startDate: format(new Date(), "yyyy-MM-dd"), endDate: "" }); setRecurringOpen(true); }}
              className="text-[#FFCB09] hover:text-yellow-300 transition-colors"
            ><Plus className="h-3 w-3" /></button>
          </div>
          {(recurringList as any[]).length === 0 ? (
            <p className="text-[9px] text-gray-500 italic">Nicio activitate recurentă</p>
          ) : (
            <div className="space-y-1">
              {(recurringList as any[]).map((rec: any) => (
                <div key={rec.id} className="flex items-center justify-between gap-1">
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] font-medium text-white truncate">{rec.taskName}</div>
                    <div className="text-[8px] text-gray-400">{pad2(rec.startHour)}:{pad2(rec.startMin)} · {rec.durationMinutes}min
                      {!rec.countInTime && <span className="ml-1 text-gray-500"><Hourglass className="inline h-2 w-2" /></span>}
                    </div>
                  </div>
                  <button
                    onClick={() => { setEditingRecurring(rec); setRecForm({ taskName: rec.taskName, activityType: rec.activityType, projectId: rec.projectId ? String(rec.projectId) : "", startHour: rec.startHour, startMin: rec.startMin, durationMinutes: rec.durationMinutes, countInTime: rec.countInTime, startDate: typeof rec.startDate === 'string' ? rec.startDate : format(new Date(rec.startDate), "yyyy-MM-dd"), endDate: rec.endDate ? (typeof rec.endDate === 'string' ? rec.endDate : format(new Date(rec.endDate), "yyyy-MM-dd")) : "" }); setRecurringOpen(true); }}
                    className="text-gray-500 hover:text-[#FFCB09] transition-colors shrink-0"
                  ><Pencil className="h-2.5 w-2.5" /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {(birthdays as any[]).length > 0 && (
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Cake className="h-2.5 w-2.5" /> Zile de naștere
            </p>
            {(birthdays as any[]).slice(0, 3).map((b: any, i: number) => (
              <div key={i} className="text-[10px] text-gray-600 py-0.5 truncate">{b.name} · {b.date}</div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ MAIN CALENDAR ═══ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className="h-10 shrink-0 border-b border-gray-200 flex items-center px-3 gap-2">
          <Button
            variant={isCurrentWeek ? "ghost" : "default"} size="sm" onClick={goToday} disabled={isCurrentWeek}
            className={cn("text-[10px] font-semibold h-6 px-2", !isCurrentWeek && "bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F]")}
          >Azi</Button>
          <button onClick={goPrev} className="p-0.5 hover:bg-gray-100 rounded"><ChevronLeft className="h-3.5 w-3.5" /></button>
          <button onClick={goNext} className="p-0.5 hover:bg-gray-100 rounded"><ChevronRight className="h-3.5 w-3.5" /></button>
          <span className="text-xs font-semibold capitalize">{headerLabel}</span>
          <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Săpt. {weekNum}</span>
          <div className="ml-auto">
            <Button variant="outline" size="sm" onClick={() => setExportOpen(true)} className="text-[10px] h-6 px-2 gap-1">
              <Download className="h-3 w-3" /> Export
            </Button>
            {gcalConnected ? (
              <Button variant="outline" size="sm" onClick={() => { setGcalImportDate(format(selectedDate, "yyyy-MM-dd")); setGcalImportOpen(true); }} className="text-[10px] h-6 px-2 gap-1 border-blue-300 text-blue-600 hover:bg-blue-50">
                <Calendar className="h-3 w-3" /> Import G Calendar
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => gcalAuthData?.url && window.open(gcalAuthData.url, "_self")} className="text-[10px] h-6 px-2 gap-1 border-blue-300 text-blue-600 hover:bg-blue-50">
                <Calendar className="h-3 w-3" /> Conectează G Calendar
              </Button>
            )}
          </div>
        </div>

        {/* Day headers */}
        <div className="shrink-0 border-b border-gray-200 flex">
          <div className="w-10 shrink-0" />
          {weekDays.map((d, i) => {
            const today = isToday(d);
            const holiday = holidays.find(h => h.date === format(d, "yyyy-MM-dd"));
            const bday = (birthdays as any[]).find((b: any) => {
              if (!b.birthDate) return false;
              const bd = new Date(b.birthDate);
              return bd.getDate() === d.getDate() && bd.getMonth() === d.getMonth();
            });
            return (
              <div key={i} className="flex-1 text-center py-1 min-w-0">
                <div className="text-[9px] font-medium text-gray-400 uppercase">{format(d, "EEE", { locale: ro })}</div>
                <div className={cn(
                  "text-sm font-bold mx-auto w-7 h-7 flex items-center justify-center rounded-full",
                  today ? "bg-[#FFCB09] text-[#221F1F]" : "text-gray-800"
                )}>{d.getDate()}</div>
                {holiday && <div className="text-[7px] text-red-500 font-medium truncate px-0.5">{holiday.name}</div>}
                {bday && <div className="text-[7px] text-pink-500 flex items-center justify-center gap-0.5"><Cake className="h-2 w-2" />{(bday as any).name?.split(" ")[0]}</div>}
              </div>
            );
          })}
        </div>

        {/* Grid — vertical scroll, fixed SLOT_HEIGHT per hour */}
        <div ref={gridContainerRef} className="flex-1 flex overflow-y-auto overflow-x-hidden">
          <div className="flex relative w-full" style={{ height: `${gridHeight}px` }}>
            {/* Hour labels */}
            <div className="w-10 shrink-0 relative">
              {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                <div
                  key={i}
                  className="absolute right-1 text-[9px] text-gray-400 leading-none"
                  style={{ top: `${i * slotH - 4}px` }}
                >
                  {pad2(HOUR_START + i)}:00
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map((day, dayIdx) => {
              const dayStr = format(day, "yyyy-MM-dd");
              const dayEntries = weekEntries.filter((e: any) => format(new Date(e.date), "yyyy-MM-dd") === dayStr);
              const dayEvents = (companyEvents as any[]).flatMap((ev: any) => {
                if (ev.isRecurring && ev.recurringRule === "daily") {
                  // Expand recurring event — check if this day falls within the event's range
                  const evStart = new Date(ev.startTime);
                  const evStartDate = format(evStart, "yyyy-MM-dd");
                  const evEnd = ev.recurringUntil
                    ? format(new Date(ev.recurringUntil instanceof Date ? ev.recurringUntil : new Date(ev.recurringUntil as string)), "yyyy-MM-dd")
                    : "9999-12-31";
                  const dow = getDay(day);
                  if (dayStr >= evStartDate && dayStr <= evEnd && dow !== 0 && dow !== 6) {
                    return [{ ...ev, startTime: new Date(dayStr + "T" + format(evStart, "HH:mm:ss")), endTime: new Date(dayStr + "T" + format(new Date(ev.endTime), "HH:mm:ss")) }];
                  }
                  return [];
                }
                const evDate = format(new Date(ev.startTime), "yyyy-MM-dd");
                return evDate === dayStr ? [ev] : [];
              });

              return (
                <div key={dayIdx} className="flex-1 relative border-l border-gray-100 min-w-0">
                  {/* Hour lines */}
                  {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                    <div key={i} className="absolute w-full border-t border-gray-100" style={{ top: `${i * slotH}px` }} />
                  ))}
                  {/* Half-hour lines */}
                  {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                    <div key={`half-${i}`} className="absolute w-full border-t border-gray-50" style={{ top: `${i * slotH + slotH / 2}px` }} />
                  ))}

                  {/* Click to add — SINGLE CLICK */}
                  <div
                    className="absolute inset-0 cursor-pointer"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const relY = e.clientY - rect.top;
                      const totalMins = (relY / gridHeight) * TOTAL_HOURS * 60;
                      const snapped = Math.round(totalMins / 15) * 15;
                      const h = Math.floor(snapped / 60) + HOUR_START;
                      const m = snapped % 60;
                      openNewEntry(dayIdx, h, m);
                    }}
                  />

                  {/* Company events */}
                  {dayEvents.map((ev: any) => {
                    const st = extractTime(ev.startTime);
                    const en = extractTime(ev.endTime);
                    const topPx = minsToY(st.h, st.m);
                    const heightPx = Math.max(8, minsToY(en.h, en.m) - topPx);
                    return (
                      <div
                        key={`ev-${ev.id}`}
                        className={cn(
                          "absolute left-0.5 right-0.5 rounded px-1 py-0 overflow-hidden border-l-2",
                          user?.role === "admin" ? "cursor-pointer hover:opacity-90" : "cursor-default"
                        )}
                        style={{ top: `${topPx}px`, height: `${heightPx}px`, backgroundColor: (ev.color || "#FFCB09") + "44", borderLeftColor: ev.color || "#FFCB09", zIndex: 5 }}
                        onClick={(e) => { e.stopPropagation(); if (user?.role === "admin") openAdminEventEdit(ev); }}
                      >
                        <div className="flex items-center gap-0.5 text-[8px] font-medium text-gray-700 truncate">
                          <Lock className="h-2 w-2 shrink-0" />{ev.title}
                          {ev.link && <a href={ev.link} target="_blank" rel="noopener" className="ml-auto shrink-0" onClick={e => e.stopPropagation()}><ExternalLink className="h-2 w-2 text-blue-500" /></a>}
                        </div>
                      </div>
                    );
                  })}

                  {/* Recurring blocks */}
                  {recurringWeekBlocks.filter(b => b.dayIdx === dayIdx).map((block, bi) => {
                    const endMins = block.startHour * 60 + block.startMin + block.durationMinutes;
                    const endH = Math.floor(endMins / 60);
                    const endM = endMins % 60;
                    const topPx = minsToY(block.startHour, block.startMin);
                    const heightPx = Math.max(16, minsToY(endH, endM) - topPx);
                    return (
                      <div
                        key={`rec-${block.recurringId}-${bi}`}
                        className="absolute left-0.5 right-0.5 rounded-md px-1.5 py-0.5 overflow-hidden border border-dashed border-[#FFCB09]/50 cursor-pointer select-none"
                        style={{ top: `${topPx}px`, height: `${heightPx}px`, backgroundColor: "rgba(255,203,9,0.12)", zIndex: 8 }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          const stMins = block.startHour * 60 + block.startMin;
                          dragRef.current = {
                            entryId: -(block.recurringId * 1000 + block.dayIdx),
                            startY: e.clientY, startX: e.clientX,
                            origDayIdx: block.dayIdx, origStartMins: stMins - HOUR_START * 60,
                            origDurMins: block.durationMinutes, activated: false,
                          };
                          document.body.style.userSelect = "none";
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Clicking a recurring block just shows info — drag to move it
                          toast.info(`Trage blocul pentru a muta activitatea recurentă în această zi.`);
                        }}
                      >
                        <div className="text-[10px] font-bold truncate leading-tight text-[#221F1F]">{block.taskName}</div>
                        {heightPx > 22 && <div className="text-[9px] font-medium opacity-60 truncate text-[#221F1F]">{pad2(block.startHour)}:{pad2(block.startMin)} – {pad2(endH)}:{pad2(endM)}</div>}
                        {!block.countInTime && <Hourglass className="absolute top-0.5 right-0.5 h-2.5 w-2.5 text-gray-500 opacity-60" />}
                      </div>
                    );
                  })}

                  {/* Current time indicator */}
                  {(() => {
                    const now = new Date();
                    const todayStr = format(now, "yyyy-MM-dd");
                    if (dayStr !== todayStr) return null;
                    const nowH = now.getHours();
                    const nowM = now.getMinutes();
                    if (nowH < HOUR_START || nowH >= HOUR_END) return null;
                    const nowY = minsToY(nowH, nowM);
                    return (
                      <div key="now-line" className="absolute left-0 right-0 pointer-events-none" style={{ top: `${nowY}px`, zIndex: 20 }}>
                        <div className="absolute left-0 right-0 h-[2px] bg-black" />
                        <div className="absolute left-0 h-2.5 w-2.5 rounded-full bg-black" style={{ top: "-5px", left: "-5px" }} />
                      </div>
                    );
                  })()}

                  {/* User entries */}
                  {dayEntries.map((entry: any) => {
                    const st = extractEntryTime(entry, "start");
                    const en = extractEntryTime(entry, "end");
                    const topPx = minsToY(st.h, st.m);
                    // Add 2px gap at top and bottom so consecutive entries don't touch
                    const rawH = Math.max(16, minsToY(en.h, en.m) - topPx);
                    const heightPx = rawH - 2;

                    return (
                      <div
                        key={entry.id}
                        id={`entry-${entry.id}`}
                        className="absolute left-0.5 right-0.5 rounded-md px-1.5 py-0.5 cursor-pointer select-none group overflow-hidden border border-[#FFCB09]/60 shadow-sm"
                        style={{ top: `${topPx + 1}px`, height: `${heightPx}px`, backgroundColor: ENTRY_BG, color: ENTRY_TEXT, zIndex: 10 }}
                        onClick={(e) => { e.stopPropagation(); if (!dragRef.current || !dragRef.current.activated) openEditEntry(entry); }}
                        onMouseDown={(e) => {
                          if ((e.target as HTMLElement).dataset.resize) return;
                          e.preventDefault();
                          const stMins = st.h * 60 + st.m;
                          const enMins = en.h * 60 + en.m;
                          dragRef.current = {
                            entryId: entry.id, startY: e.clientY, startX: e.clientX,
                            origDayIdx: dayIdx, origStartMins: stMins - HOUR_START * 60,
                            origDurMins: enMins - stMins,
                            activated: false,
                          };
                          document.body.style.userSelect = "none";
                        }}
                      >
                        <div className="text-[11px] font-bold truncate leading-tight">{entry.taskName || entry.activityType}</div>
                        {heightPx > 22 && <div className="text-[10px] font-medium opacity-75 truncate">{pad2(st.h)}:{pad2(st.m)} – {pad2(en.h)}:{pad2(en.m)}</div>}
                        {heightPx > 36 && (
                          <div className="text-[9px] opacity-60 italic truncate">{entry.projectId ? (projects as any[]).find((p:any)=>p.id===entry.projectId)?.name || "" : "Diverse"}</div>
                        )}
                        <div
                          data-resize="true"
                          className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize opacity-0 group-hover:opacity-100 transition-opacity rounded-b-md"
                          style={{ backgroundColor: "rgba(34,31,31,0.25)" }}
                          onMouseDown={(e) => {
                            e.preventDefault(); e.stopPropagation();
                            resizeRef.current = { entryId: entry.id, startY: e.clientY, origEndH: en.h, origEndM: en.m, activated: false };
                            document.body.style.cursor = "s-resize"; document.body.style.userSelect = "none";
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

      {/* ═══ DRAG GHOST ═══ */}
      {dragGhost && (
        <div
          className="fixed pointer-events-none z-[200] bg-[#FFCB09] text-[#221F1F] text-[11px] font-bold px-2 py-1 rounded-md shadow-lg border border-[#221F1F]/20 whitespace-nowrap"
          style={{ left: dragGhost.x + 12, top: dragGhost.y - 12 }}
        >
          {dragGhost.label}
        </div>
      )}

      {/* ═══ ADD/EDIT ENTRY DIALOG ═══ */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setSavedEntryId(null); setInviteSearch(""); } }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
                const startMins = v.h * 60 + v.m;
                const endMins = formEnd.h * 60 + formEnd.m;
                if (endMins <= startMins) setFormEnd({ h: Math.floor((startMins + 60) / 60), m: (startMins + 60) % 60 });
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

            {/* Invite colleagues section — always visible, scroll down */}
            <div className="border-t border-gray-100 pt-3">
              <div className="flex items-center gap-1.5 mb-2">
                <UserPlus className="h-3.5 w-3.5 text-[#FFCB09]" />
                <span className="text-xs font-semibold text-[#221F1F]">Invită colegi (opțional)</span>
              </div>
              <Input
                placeholder="Caută coleg..."
                value={inviteSearch}
                onChange={e => setInviteSearch(e.target.value)}
                className="h-7 text-xs mb-2"
              />
              {/* Already invited (saved entries) or pending (new entries) */}
              {(savedEntryId ? (entryInvitations as any[]) : pendingInvitees).length > 0 && (
                <div className="space-y-1 mb-2">
                  {savedEntryId
                    ? (entryInvitations as any[]).map((inv: any) => (
                        <div key={inv.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-2 py-1">
                          <div className="h-5 w-5 rounded-full bg-[#FFCB09]/30 flex items-center justify-center text-[9px] font-bold text-[#221F1F]">
                            {(inv.inviteeName || "?").slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-[11px] flex-1 truncate">{inv.inviteeName}</span>
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                            inv.status === "accepted" ? "bg-green-100 text-green-700" :
                            inv.status === "declined" ? "bg-red-100 text-red-600" :
                            "bg-yellow-100 text-yellow-700"
                          }`}>
                            {inv.status === "accepted" ? "✓ Acceptat" : inv.status === "declined" ? "✕ Refuzat" : "Aşteptă"}
                          </span>
                        </div>
                      ))
                    : pendingInvitees.map((u) => (
                        <div key={u.id} className="flex items-center gap-2 bg-yellow-50 rounded-lg px-2 py-1">
                          <div className="h-5 w-5 rounded-full bg-[#FFCB09]/40 flex items-center justify-center text-[9px] font-bold text-[#221F1F]">
                            {(u.name || "?").slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-[11px] flex-1 truncate">{u.name}</span>
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">Va fi invitat</span>
                          <button className="text-gray-400 hover:text-red-500 ml-1" onClick={() => setPendingInvitees(prev => prev.filter(p => p.id !== u.id))}>✕</button>
                        </div>
                      ))
                  }
                </div>
              )}
              {/* Users to invite */}
              <div className="max-h-32 overflow-y-auto space-y-1">
                {(allUsersForInvite as any[])
                  .filter((u: any) => u.id !== user?.id && (inviteSearch === "" || (u.name || "").toLowerCase().includes(inviteSearch.toLowerCase())))
                  .filter((u: any) => {
                    if (savedEntryId) return !(entryInvitations as any[]).some((inv: any) => inv.inviteeUserId === u.id);
                    return !pendingInvitees.some(p => p.id === u.id);
                  })
                  .map((u: any) => (
                    <div
                      key={u.id}
                      className="flex items-center gap-2 border border-gray-200 rounded-lg px-2 py-1 cursor-pointer hover:bg-yellow-50 transition-colors"
                      onClick={() => {
                        if (savedEntryId) {
                          inviteUser.mutate({ timeEntryId: savedEntryId, inviteeUserId: u.id });
                        } else {
                          // Queue for sending after save
                          setPendingInvitees(prev => [...prev, { id: u.id, name: u.name || "" }]);
                        }
                      }}
                    >
                      <div className="h-5 w-5 rounded-full bg-[#FFCB09]/20 flex items-center justify-center text-[9px] font-bold text-[#221F1F]">
                        {(u.name || "?").slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-[11px] flex-1 truncate">{u.name}</span>
                      <UserPlus className="h-3 w-3 text-gray-400" />
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex justify-between pt-2">
              {editingEntry && !savedEntryId && (
                <Button variant="destructive" size="sm" onClick={handleDelete} className="text-xs">
                  <Trash2 className="h-3 w-3 mr-1" /> Șterge
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                {savedEntryId ? (
                  <Button size="sm" onClick={() => { setDialogOpen(false); setSavedEntryId(null); setInviteSearch(""); }} className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold gap-1">
                    ✓ Închide
                  </Button>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => setDialogOpen(false)} className="text-xs">Anulează</Button>
                    <Button size="sm" onClick={handleSave} className="bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] text-xs font-semibold">
                      {editingEntry ? "Salvează" : "Adaugă"}
                    </Button>
                  </>
                )}
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
              <Lock className="h-4 w-4" /> {editingEvent ? "Editează eveniment firmă" : "Eveniment firmă"}
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
            <div>
              <Label className="text-xs">Culoare</Label>
              <div className="flex gap-2 mt-1">
                {["#FFCB09", "#221F1F", "#4285F4", "#34A853", "#EA4335", "#9333EA"].map(c => (
                  <button key={c} className={cn("w-5 h-5 rounded-full border-2 transition-all", adminColor === c ? "border-gray-800 scale-110" : "border-transparent")} style={{ backgroundColor: c }} onClick={() => setAdminColor(c)} />
                ))}
              </div>
            </div>
            <div className="flex justify-between pt-2">
              {editingEvent && (
                <Button variant="destructive" size="sm" onClick={handleAdminDelete} className="text-xs">
                  <Trash2 className="h-3 w-3 mr-1" /> Șterge
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button variant="ghost" size="sm" onClick={() => setAdminDialogOpen(false)} className="text-xs">Anulează</Button>
                <Button size="sm" onClick={handleAdminSave} className="bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] text-xs font-semibold">
                  {editingEvent ? "Salvează" : "Creează"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ EXPORT DIALOG ═══ */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#221F1F]">
              <Download className="h-4 w-4" /> Export raport ore
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <Label className="text-xs">De la</Label>
                <Input type="date" value={exportFrom} onChange={e => setExportFrom(e.target.value)} className="h-8" />
              </div>
              <div className="flex-1">
                <Label className="text-xs">Până la</Label>
                <Input type="date" value={exportTo} onChange={e => setExportTo(e.target.value)} className="h-8" />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <Label className="text-xs">Proiect</Label>
                <Select value={exportProject} onValueChange={setExportProject}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">Toate proiectele</SelectItem>
                    {(projects as any[]).map((p: any) => (
                      <SelectItem key={p.id} value={String(p.id)} className="text-xs">{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label className="text-xs">Tip activitate</Label>
                <Select value={exportType} onValueChange={setExportType}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">Toate tipurile</SelectItem>
                    {ACTIVITY_TYPES.map(t => <SelectItem key={t} value={t} className="text-xs capitalize">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <Label className="text-xs">Titlu activitate</Label>
                <Input value={exportTaskName} onChange={e => setExportTaskName(e.target.value)} placeholder="Caută după titlu..." className="h-8 text-xs" />
              </div>
              {isAdmin && (
                <div className="flex-1">
                  <Label className="text-xs">Angajat</Label>
                  <Select value={exportEmployee} onValueChange={setExportEmployee}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="self" className="text-xs">Eu ({user?.name?.split(" ")[0]})</SelectItem>
                      {(allUsers as any[]).filter((u: any) => u.isActive !== false).map((u: any) => (
                        <SelectItem key={u.id} value={String(u.id)} className="text-xs">{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Preview table */}
            <div className="border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
              <table className="w-full text-[10px]">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-2 py-1 text-left font-medium text-gray-500">Data</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500">Activitate</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500">Tip</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500">Proiect</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500">Ore</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-500">Durată</th>
                  </tr>
                </thead>
                <tbody>
                  {exportEntries.length === 0 ? (
                    <tr><td colSpan={6} className="px-2 py-4 text-center text-gray-400">Nicio intrare în perioada selectată</td></tr>
                  ) : exportEntries.map((e: any, i: number) => {
                    const stE = extractEntryTime(e, "start");
                    const enE = extractEntryTime(e, "end");
                    const proj = (projects as any[]).find((p: any) => p.id === e.projectId);
                    return (
                      <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                        <td className="px-2 py-1">{format(new Date(e.date), "dd.MM")}</td>
                        <td className="px-2 py-1 truncate max-w-[120px]">{e.taskName || "-"}</td>
                        <td className="px-2 py-1 capitalize">{e.activityType}</td>
                        <td className="px-2 py-1 truncate max-w-[80px]">{proj?.name || "-"}</td>
                        <td className="px-2 py-1">{pad2(stE.h)}:{pad2(stE.m)}–{pad2(enE.h)}:{pad2(enE.m)}</td>
                        <td className="px-2 py-1 font-medium">{formatDuration(e.durationMinutes || 0)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="text-xs text-gray-500">
                {exportEntries.length} intrări · Total: <span className="font-semibold text-[#221F1F]">{formatDuration(exportEntries.reduce((s: number, e: any) => s + (e.durationMinutes || 0), 0))}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setExportOpen(false)} className="text-xs">Anulează</Button>
                <Button size="sm" onClick={handleExportPDF} variant="outline" className="text-xs font-semibold gap-1 border-[#221F1F]">
                  <Download className="h-3 w-3" /> PDF
                </Button>
                <Button size="sm" onClick={handleExportExcel} className="bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] text-xs font-semibold gap-1">
                  <Download className="h-3 w-3" /> Excel
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ GOOGLE CALENDAR IMPORT DIALOG ═══ */}
      <Dialog open={gcalImportOpen} onOpenChange={setGcalImportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-[#221F1F]">
              <Calendar className="h-4 w-4 text-blue-500" /> Import din Google Calendar
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {/* Date range */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">De la</Label>
                <Input type="date" value={gcalImportDate} onChange={e => setGcalImportDate(e.target.value)} className="h-8" />
              </div>
              <div>
                <Label className="text-xs">Până la</Label>
                <Input type="date" value={gcalImportDateTo} onChange={e => setGcalImportDateTo(e.target.value)} className="h-8" />
              </div>
            </div>
            {/* Keyword filter + reload */}
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                <Input
                  value={gcalFilter}
                  onChange={e => setGcalFilter(e.target.value)}
                  placeholder="Filtrează după titlu..."
                  className="h-8 pl-7 text-xs"
                />
              </div>
              <Button variant="outline" size="sm" onClick={() => refetchGcalEvents()} className="h-8 text-xs gap-1 shrink-0">
                <RefreshCw className="h-3 w-3" /> Reîncarcă
              </Button>
            </div>

            {!gcalTodayEvents ? (
              <div className="text-center py-4 text-sm text-gray-400">Se încarcă evenimentele...</div>
            ) : (
              (() => {
                const filtered = (gcalTodayEvents?.events ?? []).filter((ev: any) =>
                  !gcalFilter.trim() || ev.title.toLowerCase().includes(gcalFilter.toLowerCase())
                );
                const allIds = filtered.map((ev: any) => ev.id as string);
                const allSelected = allIds.length > 0 && allIds.every(id => gcalSelectedIds.has(id));
                const someSelected = allIds.some(id => gcalSelectedIds.has(id));

                const toggleAll = () => {
                  if (allSelected) {
                    setGcalSelectedIds(prev => { const n = new Set(prev); allIds.forEach(id => n.delete(id)); return n; });
                  } else {
                    setGcalSelectedIds(prev => { const n = new Set(prev); allIds.forEach(id => n.add(id)); return n; });
                  }
                };

                const handleBulkImport = async () => {
                  const toImport = filtered.filter((ev: any) => gcalSelectedIds.has(ev.id as string));
                  if (toImport.length === 0) return;
                  setGcalBulkImporting(true);
                  let ok = 0;
                  let skipped = 0;
                  for (const ev of toImport) {
                    const start = new Date(ev.startTime);
                    const end = new Date(ev.endTime);
                    try {
                      const result = await addManualEntry.mutateAsync({
                        // projectId omis intentionat — apare ca "Diverse" pana la alocare manuala
                        date: format(start, "yyyy-MM-dd"),
                        startHour: start.getHours(),
                        startMin: start.getMinutes(),
                        endHour: end.getHours(),
                        endMin: end.getMinutes(),
                        activityType: "sedinta",
                        taskName: ev.title,
                        isBillable: true,
                      });
                      if (result.skipped) {
                        skipped++;
                      } else {
                        ok++;
                      }
                    } catch { /* individual errors already toasted */ }
                  }
                  setGcalBulkImporting(false);
                  setGcalSelectedIds(new Set());
                  refetchEntries();
                  const plural = (n: number) => n === 1 ? 'activitate' : 'activități';
                  if (ok > 0 && skipped === 0) {
                    toast.success(`${ok} ${plural(ok)} importate cu succes!`, { duration: 6000 });
                    toast.info("⚠️ Activitățile importate nu au proiect alocat. Editează-le în calendar pentru a le atribui un proiect.", { duration: 8000 });
                  } else if (ok > 0 && skipped > 0) {
                    toast.success(`${ok} ${plural(ok)} importate, ${skipped} deja existau în Time-Tracking.`, { duration: 7000 });
                    toast.info("⚠️ Activitățile noi nu au proiect alocat. Editează-le în calendar pentru a le atribui un proiect.", { duration: 8000 });
                  } else if (ok === 0 && skipped > 0) {
                    toast.info(`Toate cele ${skipped} ${plural(skipped)} selectate există deja în Time-Tracking. Nimic nou de importat.`, { duration: 7000 });
                  }
                  if (skipped < toImport.length) setGcalImportOpen(false);
                };

                return filtered.length === 0 ? (
                  <div className="text-center py-4 text-sm text-gray-400">
                    {gcalTodayEvents?.events.length === 0
                      ? "Nu sunt evenimente în Google Calendar pentru perioada selectată."
                      : `Niciun eveniment nu corespunde filtrului "${gcalFilter}".`}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Select-all header */}
                    <div className="flex items-center justify-between px-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                          onChange={toggleAll}
                          className="h-3.5 w-3.5 accent-blue-600"
                        />
                        <span className="text-[10px] text-gray-500">
                          {someSelected ? `${allIds.filter(id => gcalSelectedIds.has(id)).length} selectate din ${filtered.length}` : `${filtered.length} eveniment(e) găsite`}
                        </span>
                      </label>
                      {someSelected && (
                        <Button
                          size="sm"
                          className="h-6 text-[10px] bg-blue-600 hover:bg-blue-700 text-white gap-1 px-2"
                          onClick={handleBulkImport}
                          disabled={gcalBulkImporting}
                        >
                          <Download className="h-3 w-3" />
                          {gcalBulkImporting ? "Se importă..." : `Import (${allIds.filter(id => gcalSelectedIds.has(id)).length})`}
                        </Button>
                      )}
                    </div>
                    {/* Events list with checkboxes */}
                    <div className="space-y-1.5 max-h-56 overflow-y-auto">
                      {filtered.map((ev: any) => {
                        const start = new Date(ev.startTime);
                        const end = new Date(ev.endTime);
                        const evDate = format(start, "yyyy-MM-dd");
                        const isChecked = gcalSelectedIds.has(ev.id as string);
                        return (
                          <div
                            key={ev.id}
                            className={`flex items-start gap-2.5 border rounded-lg p-2.5 cursor-pointer transition-colors ${
                              isChecked ? "border-blue-400 bg-blue-50" : "border-blue-100 hover:bg-blue-50"
                            }`}
                            onClick={() => {
                              setGcalSelectedIds(prev => {
                                const n = new Set(prev);
                                if (n.has(ev.id)) n.delete(ev.id); else n.add(ev.id);
                                return n;
                              });
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              onClick={e => e.stopPropagation()}
                              className="h-3.5 w-3.5 mt-0.5 accent-blue-600 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-medium text-gray-800 flex-1 truncate">{ev.title}</span>
                                <div className="flex items-center gap-1 shrink-0">
                                  {ev.htmlLink && (
                                    <a href={ev.htmlLink} target="_blank" rel="noopener" onClick={e => e.stopPropagation()}>
                                      <ExternalLink className="h-3 w-3 text-blue-400" />
                                    </a>
                                  )}
                                  <button
                                    className="text-[9px] text-blue-600 hover:underline"
                                    onClick={e => {
                                      e.stopPropagation();
                                      setFormDate(evDate);
                                      setFormStart({ h: start.getHours(), m: start.getMinutes() });
                                      setFormEnd({ h: end.getHours(), m: end.getMinutes() });
                                      setFormTask(ev.title);
                                      setFormType("sedinta");
                                      setFormProject("");
                                      setFormDesc("");
                                      setEditingEntry(null);
                                      setGcalImportOpen(false);
                                      setDialogOpen(true);
                                      toast.info("Eveniment importat. Verifică detaliile şi salvează.");
                                    }}
                                  >
                                    Editare
                                  </button>
                                </div>
                              </div>
                              <div className="text-[10px] text-gray-500 mt-0.5">
                                {format(start, "d MMM", { locale: ro })} · {pad2(start.getHours())}:{pad2(start.getMinutes())} – {pad2(end.getHours())}:{pad2(end.getMinutes())}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()
            )}

            <div className="flex justify-between pt-1 border-t">
              <Button variant="ghost" size="sm" onClick={() => gcalDisconnect.mutate()} className="text-[10px] text-red-500 hover:text-red-600 gap-1">
                <Unlink className="h-3 w-3" /> Deconectează
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setGcalImportOpen(false)} className="text-xs">Închide</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ INVITE COLLEAGUES DIALOG ═══ */}
      <Dialog open={invitePanelOpen} onOpenChange={(o) => { setInvitePanelOpen(o); if (!o) { setSavedEntryId(null); setInviteSearch(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#221F1F]">
              <UserPlus className="h-4 w-4 text-[#FFCB09]" />
              Invită colegi la activitate
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-gray-500">Activitatea a fost salvată. Doreşti să inviți colegi? Ei vor primi o notificare şi pot accepta sau refuza.</p>
            <Input
              placeholder="Caută coleg..."
              value={inviteSearch}
              onChange={e => setInviteSearch(e.target.value)}
              className="h-8"
            />
            {/* Already invited */}
            {(entryInvitations as any[]).length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-gray-400 uppercase">Invitații trimise</p>
                {(entryInvitations as any[]).map((inv: any) => (
                  <div key={inv.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-2.5 py-1.5">
                    <div className="h-6 w-6 rounded-full bg-[#FFCB09]/30 flex items-center justify-center text-[10px] font-bold text-[#221F1F]">
                      {(inv.inviteeName || "?").slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-xs flex-1 truncate">{inv.inviteeName}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      inv.status === "accepted" ? "bg-green-100 text-green-700" :
                      inv.status === "declined" ? "bg-red-100 text-red-600" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {inv.status === "accepted" ? "✓ Acceptat" : inv.status === "declined" ? "✕ Refuzat" : "Aşteptă"}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {/* Users to invite */}
            <div className="max-h-48 overflow-y-auto space-y-1">
              {(allUsersForInvite as any[])
                .filter((u: any) => u.id !== user?.id && (inviteSearch === "" || (u.name || "").toLowerCase().includes(inviteSearch.toLowerCase())))
                .filter((u: any) => !(entryInvitations as any[]).some((inv: any) => inv.inviteeUserId === u.id))
                .map((u: any) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-2 border border-gray-200 rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-yellow-50 transition-colors"
                    onClick={() => savedEntryId && inviteUser.mutate({ timeEntryId: savedEntryId, inviteeUserId: u.id })}
                  >
                    <div className="h-6 w-6 rounded-full bg-[#FFCB09]/20 flex items-center justify-center text-[10px] font-bold text-[#221F1F]">
                      {(u.name || "?").slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-xs flex-1 truncate">{u.name}</span>
                    <UserPlus className="h-3.5 w-3.5 text-gray-400" />
                  </div>
                ))}
            </div>
            <div className="flex justify-end pt-1">
              <Button size="sm" variant="ghost" onClick={() => { setInvitePanelOpen(false); setSavedEntryId(null); setInviteSearch(""); }} className="text-xs">Gata</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ RECURRING ACTIVITIES DIALOG ═══ */}
      <Dialog open={recurringOpen} onOpenChange={setRecurringOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#221F1F]">
              <Repeat2 className="h-4 w-4 text-[#FFCB09]" />
              {editingRecurring ? "Editează activitate recurentă" : "Activitate recurentă nouă"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Titlu activitate</Label>
              <Input value={recForm.taskName} onChange={e => setRecForm(f => ({ ...f, taskName: e.target.value }))} placeholder="ex: #Pauză de masă" className="h-8" />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <Label className="text-xs">Ora start</Label>
                <div className="flex gap-1">
                  <Select value={String(recForm.startHour)} onValueChange={v => setRecForm(f => ({ ...f, startHour: Number(v) }))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-48">
                      {Array.from({ length: 24 }, (_, i) => <SelectItem key={i} value={String(i)} className="text-xs">{pad2(i)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={String(recForm.startMin)} onValueChange={v => setRecForm(f => ({ ...f, startMin: Number(v) }))}>
                    <SelectTrigger className="h-8 text-xs w-16"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[0, 15, 30, 45].map(m => <SelectItem key={m} value={String(m)} className="text-xs">{pad2(m)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex-1">
                <Label className="text-xs">Durată (minute)</Label>
                <Select value={String(recForm.durationMinutes)} onValueChange={v => setRecForm(f => ({ ...f, durationMinutes: Number(v) }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[15, 30, 45, 60, 90, 120].map(d => <SelectItem key={d} value={String(d)} className="text-xs">{d} min</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <Label className="text-xs">Tip activitate</Label>
                <Select value={recForm.activityType} onValueChange={v => setRecForm(f => ({ ...f, activityType: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_TYPES.map(t => <SelectItem key={t} value={t} className="text-xs capitalize">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label className="text-xs">Proiect (opțional)</Label>
                <Select value={recForm.projectId || "none"} onValueChange={v => setRecForm(f => ({ ...f, projectId: v === "none" ? "" : v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Fără proiect" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs">Fără proiect</SelectItem>
                    {(projects as any[]).map((p: any) => <SelectItem key={p.id} value={String(p.id)} className="text-xs">{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <Label className="text-xs">Data început</Label>
                <Input type="date" value={recForm.startDate} onChange={e => setRecForm(f => ({ ...f, startDate: e.target.value }))} className="h-8" />
              </div>
              <div className="flex-1">
                <Label className="text-xs">Data sfârşit (opțional)</Label>
                <Input type="date" value={recForm.endDate} onChange={e => setRecForm(f => ({ ...f, endDate: e.target.value }))} className="h-8" />
              </div>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
              <input
                type="checkbox"
                id="countInTime"
                checked={recForm.countInTime}
                onChange={e => setRecForm(f => ({ ...f, countInTime: e.target.checked }))}
                className="h-3.5 w-3.5 accent-[#FFCB09]"
              />
              <label htmlFor="countInTime" className="text-xs text-gray-700 cursor-pointer flex-1">
                Calculează în <strong>Timp lucrat</strong>
              </label>
              {!recForm.countInTime && <Hourglass className="h-3.5 w-3.5 text-gray-400" />}
            </div>
            <div className="flex justify-between pt-2">
              {editingRecurring && (
                <Button variant="destructive" size="sm" onClick={() => { deleteRecurring.mutate({ id: editingRecurring.id }); setRecurringOpen(false); }} className="text-xs">
                  <Trash2 className="h-3 w-3 mr-1" /> Opreşte
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button variant="ghost" size="sm" onClick={() => setRecurringOpen(false)} className="text-xs">Anulează</Button>
                <Button
                  size="sm"
                  onClick={() => {
                    if (!recForm.taskName.trim()) { toast.error("Titlul este obligatoriu"); return; }
                    const payload = {
                      taskName: recForm.taskName.trim(),
                      activityType: recForm.activityType as any,
                      projectId: recForm.projectId ? Number(recForm.projectId) : undefined,
                      startHour: recForm.startHour,
                      startMin: recForm.startMin,
                      durationMinutes: recForm.durationMinutes,
                      countInTime: recForm.countInTime,
                      startDate: recForm.startDate,
                      endDate: recForm.endDate || undefined,
                    };
                    if (editingRecurring) { updateRecurring.mutate({ id: editingRecurring.id, ...payload }); }
                    else { createRecurring.mutate(payload); }
                  }}
                  className="bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] text-xs font-semibold"
                >
                  {editingRecurring ? "Salvează" : "Creează"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
