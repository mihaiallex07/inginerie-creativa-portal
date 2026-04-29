import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  FileText,
  FolderOpen,
  Lightbulb,
  Newspaper,
  Timer,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Cake,
  CalendarDays,
  BarChart3,
} from "lucide-react";
import { useLocation } from "wouter";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, isSameMonth } from "date-fns";
import { ro } from "date-fns/locale";
import { useState, useMemo } from "react";

const GREETINGS = ["Bună dimineața", "Bună ziua", "Bună seara"];
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return GREETINGS[0];
  if (h < 18) return GREETINGS[1];
  return GREETINGS[2];
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

type CalendarEntry = {
  type: "birthday" | "anniversary" | "event";
  date: Date;
  title: string;
  subtitle?: string;
  initials?: string;
  color?: string;
  description?: string;
  link?: string;
  avatarUrl?: string | null;
  personId?: number;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: runningTimer } = trpc.timeTracking.runningTimer.useQuery();
  // Today's time-tracking hours (from time entries)
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const { data: todayEntries } = trpc.timeTracking.myEntries.useQuery({ dateFrom: todayStr, dateTo: todayStr });
  const { data: newsData } = trpc.news.list.useQuery({ limit: 3 });
  const { data: projectsData } = trpc.projects.list.useQuery({ status: "activ" });
  const { data: proposalsData } = trpc.proposals.list.useQuery({ status: "deschisa" });
  const { data: birthdaysData } = trpc.people.upcomingBirthdays.useQuery({ daysAhead: 365 });
  const { data: anniversariesData } = trpc.people.upcomingAnniversaries.useQuery({ daysAhead: 365 });

  // Calendar state
  const [calMonth, setCalMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Fetch events for current calendar month range (with buffer)
  const calRange = useMemo(() => {
    const start = startOfMonth(calMonth);
    const end = endOfMonth(calMonth);
    return {
      dateFrom: format(start, "yyyy-MM-dd"),
      dateTo: format(end, "yyyy-MM-dd"),
    };
  }, [calMonth.getFullYear(), calMonth.getMonth()]);

  const { data: eventsData } = trpc.companyEvents.list.useQuery(calRange);

  // Build calendar entries (birthdays + events)
  const calendarEntries = useMemo(() => {
    const entries: CalendarEntry[] = [];

    // Add work anniversaries
    if (anniversariesData) {
      for (const person of anniversariesData) {
        if (!person.hireDate) continue;
        const hd = new Date(person.hireDate);
        const hireYear = hd.getFullYear();
        // Place anniversary on the correct day within the viewed calendar month/year
        const anniversaryThisYear = new Date(calMonth.getFullYear(), hd.getMonth(), hd.getDate());
        if (isSameMonth(anniversaryThisYear, calMonth)) {
          // yearsCompleted = how many full years on this anniversary date in the viewed year
          const yearsCompleted = calMonth.getFullYear() - hireYear;
          if (yearsCompleted <= 0) continue; // skip if hired this year
          entries.push({
            type: "anniversary",
            date: anniversaryThisYear,
            title: person.name ?? "Coleg",
            subtitle: `${yearsCompleted} ${yearsCompleted === 1 ? "an" : "ani"} la IC${person.jobTitle ? " \u00b7 " + person.jobTitle : ""}`,
            initials: getInitials(person.name),
            color: "#10b981",
            avatarUrl: person.avatarUrl,
            personId: person.id,
          });
        }
      }
    }

    // Add birthdays
    if (birthdaysData) {
      for (const person of birthdaysData) {
        if (!person.birthDate) continue;
        const bd = new Date(person.birthDate);
        // Create birthday entry for current calendar month's year
        const birthdayThisYear = new Date(calMonth.getFullYear(), bd.getMonth(), bd.getDate());
        if (isSameMonth(birthdayThisYear, calMonth)) {
          entries.push({
            type: "birthday",
            date: birthdayThisYear,
            title: person.name ?? "Coleg",
            subtitle: person.jobTitle ?? person.department ?? "",
            initials: getInitials(person.name),
            color: "#FFCB09",
            avatarUrl: person.avatarUrl,
            personId: person.id,
          });
        }
      }
    }

    // Add company events (expand daily recurring ones)
    if (eventsData) {
      const mStart = startOfMonth(calMonth);
      const mEnd = endOfMonth(calMonth);
      for (const ev of eventsData) {
        if (ev.isRecurring && ev.recurringRule === "daily") {
          // Expand daily recurring event across the month
          const evStart = new Date(ev.startTime);
          const evEnd = ev.recurringUntil ? (() => { const d = ev.recurringUntil instanceof Date ? ev.recurringUntil : new Date(ev.recurringUntil as string); return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59); })() : mEnd;
          const rangeStart = mStart > evStart ? mStart : evStart;
          const rangeEnd = mEnd < evEnd ? mEnd : evEnd;
          const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
          const startHour = evStart.getHours();
          const startMin = evStart.getMinutes();
          const endTime = new Date(ev.endTime);
          const endHour = endTime.getHours();
          const endMin = endTime.getMinutes();
          for (const day of days) {
            // Skip weekends for daily work events
            const dow = getDay(day);
            if (dow === 0 || dow === 6) continue;
            entries.push({
              type: "event",
              date: new Date(day.getFullYear(), day.getMonth(), day.getDate(), startHour, startMin),
              title: ev.title,
              subtitle: `${String(startHour).padStart(2,"0")}:${String(startMin).padStart(2,"0")} - ${String(endHour).padStart(2,"0")}:${String(endMin).padStart(2,"0")}${ev.description ? " \u2022 " + ev.description : ""}`,
              color: ev.color ?? "#3b82f6",
              description: ev.description ?? undefined,
              link: ev.link ?? undefined,
            });
          }
        } else {
          entries.push({
            type: "event",
            date: new Date(ev.startTime),
            title: ev.title,
            subtitle: ev.description ?? undefined,
            color: ev.color ?? "#3b82f6",
            description: ev.description ?? undefined,
            link: ev.link ?? undefined,
          });
        }
      }
    }

    return entries;
  }, [birthdaysData, anniversariesData, eventsData, calMonth.getFullYear(), calMonth.getMonth()]);

  // Get entries for a specific day
  function getEntriesForDay(day: Date) {
    return calendarEntries.filter(e => isSameDay(e.date, day));
  }

  // Selected day entries
  const selectedEntries = selectedDay ? getEntriesForDay(selectedDay) : [];

  const firstName = user?.name?.split(" ")[0] ?? "Coleg";
  const today = format(new Date(), "EEEE, d MMMM yyyy", { locale: ro });

  // Calculate today's total from time entries — only count entries with startHour/endHour set
  // (matching what Time-Tracking weekly grid shows; excludes bulk-imported entries without hours)
  const todayVisibleEntries = useMemo(() => {
    if (!todayEntries) return [];
    return todayEntries.filter((e: { startHour?: number | null; endHour?: number | null }) =>
      e.startHour != null && e.endHour != null
    );
  }, [todayEntries]);

  const todayWorkedMinutes = useMemo(() => {
    return todayVisibleEntries.reduce((sum: number, e: { durationMinutes?: number | null; startHour?: number | null; endHour?: number | null }) => {
      if (e.durationMinutes) return sum + e.durationMinutes;
      if (e.startHour != null && e.endHour != null) return sum + (e.endHour - e.startHour) * 60;
      return sum;
    }, 0);
  }, [todayVisibleEntries]);

  const workNorm = 8 * 60;
  const workedPercent = Math.min(100, Math.round((todayWorkedMinutes / workNorm) * 100));

  // Calendar grid
  const monthStart = startOfMonth(calMonth);
  const monthEnd = endOfMonth(calMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart); // 0=Sun
  const mondayOffset = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // shift to Monday start

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {getGreeting()}, {firstName} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5 capitalize">{today}</p>
        </div>
        <div className="flex items-center gap-2 bg-muted rounded-full px-3 py-1.5">
          <div className="h-6 w-6 rounded-full bg-[#FFCB09] flex items-center justify-center text-xs font-bold text-[#221F1F]">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
        </div>
      </div>

      {/* Row 1: Timp lucrat + iFlow + News */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3 mb-3">
        {/* Timp lucrat + iFlow Card */}
        <Card className="border-2 border-border overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col sm:flex-row">
              {/* Timp lucrat azi — din Time-Tracking */}
              <div className="flex-1 p-3 border-b sm:border-b-0 sm:border-r border-border">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Timp lucrat azi</p>
                <p className="text-xl font-bold text-foreground tabular-nums">{formatDuration(todayWorkedMinutes)}</p>
                <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-[#FFCB09] rounded-full transition-all" style={{ width: `${workedPercent}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {todayVisibleEntries.length > 0
                    ? `${todayVisibleEntries.length} ${todayVisibleEntries.length === 1 ? "activitate" : "activități"} în Time-Tracking azi`
                    : "Nicio activitate înregistrată azi"}
                </p>
              </div>
              {/* iFlow Pontaj */}
              <div className="flex-1 p-3 border-b sm:border-b-0 sm:border-r border-border flex flex-col justify-between">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Pontaj zilnic</p>
                  <p className="text-xs text-muted-foreground">Înregistrează prezența în iFlow — platforma oficială de pontaj a companiei.</p>
                </div>
                <a
                  href="https://app.hriflow.ro"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 bg-[#221F1F] text-[#FFCB09] text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-[#333] transition-colors w-fit"
                  onClick={e => e.stopPropagation()}
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  Deschide iFlow
                </a>
              </div>
              <div className="p-3 flex items-center justify-center">
                <div className="flex flex-col items-center gap-1 text-center cursor-pointer" onClick={() => setLocation("/time-tracking")}>
                  <div className="h-8 w-8 rounded-full bg-[#FFCB09]/15 flex items-center justify-center">
                    <Timer className="h-4 w-4 text-[#FFCB09]" />
                  </div>
                  <span className="text-[10px] text-muted-foreground">Time-Tracking</span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* News sidebar */}
        <Card className="border-border overflow-hidden">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Newspaper className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">Știri recente</span>
              </div>
              <button onClick={() => setLocation("/stiri")} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5">
                Toate <ChevronRight className="h-2.5 w-2.5" />
              </button>
            </div>
            <div className="space-y-1.5">
              {newsData && newsData.length > 0 ? (
                newsData.map(({ news: item }) => (
                  <button
                    key={item.id}
                    onClick={() => setLocation(`/stiri/${item.id}`)}
                    className="w-full text-left p-2 rounded-md hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {item.isImportant && <AlertCircle className="h-3 w-3 text-red-500 shrink-0" />}
                      {item.isPinned && <span className="text-[8px] bg-[#FFCB09] text-[#221F1F] px-1 py-0.5 rounded font-semibold">FIX</span>}
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(item.publishedAt ?? item.createdAt), "d MMM", { locale: ro })}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-foreground line-clamp-1">{item.title}</p>
                  </button>
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center py-3">Nu există știri</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Running Timer */}
      {runningTimer && (
        <Card className="border-[#FFCB09] border-2 bg-yellow-50 mb-3">
          <CardContent className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-[#FFCB09] flex items-center justify-center">
                <Timer className="h-3.5 w-3.5 text-[#221F1F]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#221F1F]">
                  {runningTimer.taskName ?? "Activitate în desfășurare"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {runningTimer.activityType} · {runningTimer.isBillable ? "Facturabil" : "Non-facturabil"}
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => setLocation("/time-tracking")} className="border-[#221F1F] text-[#221F1F] text-[10px] h-7">
              Gestionează
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Row 2: 4 Quick Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow border-border" onClick={() => setLocation("/documente")}>
          <CardContent className="p-3">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground">Documentele mele</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">Contract, fișe, adeverințe</p>
              </div>
              <div className="h-7 w-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <FileText className="h-3.5 w-3.5 text-blue-600" />
              </div>
            </div>
            <Badge variant="outline" className="mt-2 text-[10px] h-5">Confidențial</Badge>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow border-border" onClick={() => setLocation("/proiecte")}>
          <CardContent className="p-3">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground">Proiecte active</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">Acces direct Google Drive</p>
              </div>
              <div className="h-7 w-7 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                <FolderOpen className="h-3.5 w-3.5 text-green-600" />
              </div>
            </div>
            <Badge className="mt-2 text-[10px] h-5 bg-green-100 text-green-800 hover:bg-green-100 border-0">
              {projectsData?.length ?? 0} proiecte
            </Badge>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow border-border" onClick={() => setLocation("/propuneri")}>
          <CardContent className="p-3">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground">Propuneri deschise</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">Idei de îmbunătățire</p>
              </div>
              <div className="h-7 w-7 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                <Lightbulb className="h-3.5 w-3.5 text-amber-600" />
              </div>
            </div>
            <Badge className="mt-2 text-[10px] h-5 bg-amber-100 text-amber-800 hover:bg-amber-100 border-0">
              {proposalsData?.length ?? 0} în așteptare
            </Badge>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow border-border" onClick={() => setLocation("/process-overview")}>
          <CardContent className="p-3">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground">Process Overview</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">Vizualizare activitate echipă</p>
              </div>
              <div className="h-7 w-7 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                <BarChart3 className="h-3.5 w-3.5 text-purple-600" />
              </div>
            </div>
            <Badge className="mt-2 text-[10px] h-5 bg-purple-100 text-purple-800 hover:bg-purple-100 border-0">
              Luna curentă
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Calendarul IC */}
      <Card className="border-border overflow-hidden">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[#FFCB09]" />
              <span className="text-sm font-semibold text-foreground">Calendarul IC</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setCalMonth(m => subMonths(m, 1))} className="h-6 w-6 rounded hover:bg-muted flex items-center justify-center">
                <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              <span className="text-xs font-medium text-foreground min-w-[100px] text-center capitalize">
                {format(calMonth, "MMMM yyyy", { locale: ro })}
              </span>
              <button onClick={() => setCalMonth(m => addMonths(m, 1))} className="h-6 w-6 rounded hover:bg-muted flex items-center justify-center">
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-border/30 rounded-lg overflow-hidden">
            {/* Day headers */}
            {["Lu", "Ma", "Mi", "Jo", "Vi", "S\u00e2", "Du"].map(d => (
              <div key={d} className="text-center text-[9px] font-semibold text-muted-foreground py-0.5 bg-muted/30">
                {d}
              </div>
            ))}

            {/* Empty cells before first day */}
            {Array.from({ length: mondayOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-background h-[28px]" />
            ))}

            {/* Day cells */}
            {daysInMonth.map(day => {
              const dayEntries = getEntriesForDay(day);
              const hasBirthday = dayEntries.some(e => e.type === "birthday");
              const hasAnniversary = dayEntries.some(e => e.type === "anniversary");
              const hasEvent = dayEntries.some(e => e.type === "event");
              const isToday = isSameDay(day, new Date());
              const isWeekend = getDay(day) === 0 || getDay(day) === 6;

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => {
                    if (dayEntries.length > 0) {
                      setSelectedDay(day);
                      setDetailOpen(true);
                    }
                  }}
                  className={`
                    relative h-[28px] text-center transition-colors flex flex-col items-center justify-center
                    ${isToday ? "bg-[#FFCB09]/10 ring-1 ring-[#FFCB09] ring-inset" : isWeekend ? "bg-muted/20" : "bg-background"}
                    ${dayEntries.length > 0 ? "cursor-pointer hover:bg-muted/60" : "cursor-default"}
                  `}
                >
                  <span className={`text-[10px] leading-none ${isToday ? "font-bold text-[#FFCB09]" : isWeekend ? "text-muted-foreground/60" : "text-foreground"}`}>
                    {format(day, "d")}
                  </span>
                  {/* Indicators */}
                  {(hasBirthday || hasAnniversary || hasEvent) && (
                    <div className="flex items-center justify-center gap-0.5 leading-none">
                      {hasBirthday && (
                        <span className="text-[8px] leading-none" title="Zi de naștere">🎂</span>
                      )}
                      {hasAnniversary && (
                        <span className="text-[8px] leading-none" title="Aniversare angajare">🏆</span>
                      )}
                      {hasEvent && (
                        <span className="h-1 w-1 rounded-full bg-blue-500 inline-block" title="Eveniment" />
                      )}
                    </div>
                  )}
                  {/* Multiple birthdays indicator */}
                  {dayEntries.filter(e => e.type === "birthday").length > 1 && (
                    <span className="absolute top-0 right-0.5 text-[7px] font-bold text-[#FFCB09]">
                      {dayEntries.filter(e => e.type === "birthday").length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">🎂 Zi de naștere</span>
            <span className="flex items-center gap-1">🏆 Aniversare IC</span>
            <span className="flex items-center gap-1">📎 Eveniment firmă</span>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4 text-[#FFCB09]" />
              {selectedDay && format(selectedDay, "d MMMM yyyy", { locale: ro })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {selectedEntries.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Niciun eveniment în această zi.</p>
            )}
            {selectedEntries.map((entry, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  entry.type === "birthday" ? "bg-[#FFCB09]/10 border border-[#FFCB09]/20" :
                  entry.type === "anniversary" ? "bg-emerald-50 border border-emerald-100" :
                  "bg-blue-50 border border-blue-100"
                }`}
              >
                {entry.type === "birthday" || entry.type === "anniversary" ? (
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden ${entry.type === "anniversary" ? "bg-emerald-500 text-white" : "bg-[#FFCB09] text-[#221F1F]"}`}>
                    {entry.avatarUrl ? (
                      <img src={entry.avatarUrl} alt={entry.title} className="h-full w-full object-cover" />
                    ) : (
                      entry.initials
                    )}
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: entry.color ?? "#3b82f6" }}>
                    <CalendarDays className="h-5 w-5 text-white" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {entry.type === "birthday" && <span className="text-base">🎂</span>}
                    {entry.type === "anniversary" && <span className="text-base">🏆</span>}
                    <p className="text-sm font-semibold text-foreground">{entry.title}</p>
                  </div>
                  {entry.type === "birthday" ? (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Zi de naștere · {entry.subtitle}
                    </p>
                  ) : entry.type === "anniversary" ? (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Aniversare IC · {entry.subtitle}
                    </p>
                  ) : (
                    <>
                      {entry.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{entry.description}</p>
                      )}
                      {entry.link && (
                        <a
                          href={entry.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                        >
                          Deschide link →
                        </a>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
