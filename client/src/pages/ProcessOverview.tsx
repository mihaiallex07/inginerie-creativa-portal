import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight, Download, CalendarDays, ArrowUp, ArrowDown, GripVertical, Settings2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

// Romanian public holidays 2026
const PUBLIC_HOLIDAYS_2026: Record<string, string> = {
  "2026-01-01": "Anul Nou",
  "2026-01-02": "Anul Nou",
  "2026-01-24": "Ziua Unirii",
  "2026-04-13": "Paștele Ortodox",
  "2026-04-14": "Paștele Ortodox",
  "2026-05-01": "Ziua Muncii",
  "2026-06-01": "Ziua Copilului",
  "2026-06-02": "Rusalii",
  "2026-08-15": "Adormirea Maicii Domnului",
  "2026-11-30": "Sfântul Andrei",
  "2026-12-01": "Ziua Națională",
  "2026-12-25": "Crăciunul",
  "2026-12-26": "Crăciunul",
};

const LEAVE_LABELS: Record<string, string> = {
  concediu_odihna: "CO",
  concediu_medical: "CM",
  concediu_fara_plata: "CFP",
  liber_legal: "LL",
  recuperare: "REC",
  alt: "ALT",
};

const LEAVE_COLORS: Record<string, string> = {
  concediu_odihna: "bg-green-200 text-green-900",
  concediu_medical: "bg-red-200 text-red-900",
  concediu_fara_plata: "bg-orange-200 text-orange-900",
  liber_legal: "bg-blue-200 text-blue-900",
  recuperare: "bg-teal-200 text-teal-900",
  alt: "bg-gray-200 text-gray-900",
};

const MONTH_NAMES = [
  "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
  "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie",
];

const DAY_NAMES_SHORT = ["Du", "Lu", "Ma", "Mi", "Jo", "Vi", "Sa"];

function formatDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getFirstName(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return parts[0];
}

// Generate a stable color for a project code
function projectColor(code: string): { bg: string; text: string } {
  let hash = 0;
  for (let i = 0; i < code.length; i++) hash = code.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return { bg: `hsl(${hue}, 55%, 88%)`, text: `hsl(${hue}, 60%, 25%)` };
}

export default function ProcessOverview() {
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Current month navigation
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth()); // 0-indexed

  // Generate date range for the month
  const { dateFrom, dateTo, days } = useMemo(() => {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const daysArr: Date[] = [];
    for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
      daysArr.push(new Date(d));
    }
    return {
      dateFrom: formatDateKey(first),
      dateTo: formatDateKey(last),
      days: daysArr,
    };
  }, [year, month]);

  const { data, isLoading } = trpc.processOverview.getData.useQuery({ dateFrom, dateTo });

  // Build lookup maps from project assignments (not time entries)
  const { userProjectMap, leaveMap } = useMemo(() => {
    if (!data) return { userProjectMap: new Map(), leaveMap: new Map() };

    // Project assignments: userId -> array of { label, projectName, projectStart, projectEnd }
    const upm = new Map<number, Array<{ label: string; projectName: string; projectStart: string | null; projectEnd: string | null }>>(); 
    for (const pa of data.projectAssignments) {
      if (!upm.has(pa.userId)) upm.set(pa.userId, []);
      const code = pa.projectCode || "";
      const abbr = pa.projectAbbreviation || "";
      const label = code && abbr ? `${code} ${abbr}` : code || abbr || pa.projectName || "—";
      upm.get(pa.userId)!.push({
        label,
        projectName: pa.projectName || "—",
        projectStart: pa.projectStart ? String(pa.projectStart).substring(0, 10) : null,
        projectEnd: pa.projectEnd ? String(pa.projectEnd).substring(0, 10) : null,
      });
    }

    // Leave requests: userId -> dateKey -> leaveType
    const lm = new Map<number, Map<string, string>>();
    for (const lr of data.leaveRequests) {
      const start = new Date(lr.startDate);
      const end = new Date(lr.endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dk = formatDateKey(d);
        if (!lm.has(lr.userId)) lm.set(lr.userId, new Map());
        lm.get(lr.userId)!.set(dk, lr.type);
      }
    }

    return { userProjectMap: upm, leaveMap: lm };
  }, [data]);

  // Helper: get active projects for a user on a specific date
  function getUserProjectsForDate(userId: number, dateKey: string): { labels: string[]; names: string[] } {
    const projects = userProjectMap.get(userId);
    if (!projects || projects.length === 0) return { labels: [], names: [] };
    const labels: string[] = [];
    const names: string[] = [];
    for (const p of projects) {
      // Check if the date falls within the project's date range
      const inRange = (!p.projectStart || dateKey >= p.projectStart) && (!p.projectEnd || dateKey <= p.projectEnd);
      if (inRange) {
        labels.push(p.label);
        names.push(p.projectName);
      }
    }
    return { labels, names };
  }

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const today = formatDateKey(new Date());
  const users = data?.users ?? [];
  const isAdmin = user?.role === "admin";

  // Reorder state
  const [reorderOpen, setReorderOpen] = useState(false);
  const [reorderList, setReorderList] = useState<Array<{ id: number; name: string; department: string | null }>>([]);
  const utils = trpc.useUtils();
  const reorderMutation = trpc.adminUsers.reorderUsers.useMutation({
    onSuccess: () => {
      toast.success("Ordine salvată!");
      setReorderOpen(false);
      utils.processOverview.getData.invalidate();
    },
    onError: () => toast.error("Eroare la salvare"),
  });

  function openReorder() {
    setReorderList(users.map(u => ({ id: u.id, name: u.name || "?", department: u.department })));
    setReorderOpen(true);
  }

  function moveUser(index: number, direction: -1 | 1) {
    const newList = [...reorderList];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newList.length) return;
    [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
    setReorderList(newList);
  }

  function saveReorder() {
    const orderList = reorderList.map((u, i) => ({ userId: u.id, displayOrder: (i + 1) * 10 }));
    reorderMutation.mutate({ orderList });
  }

  return (
    <div className="h-[calc(100vh-72px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-[#FFCB09]" />
          <h1 className="text-lg font-bold text-foreground">Process Overview</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold min-w-[140px] text-center">
            {MONTH_NAMES[month]} {year}
          </span>
          <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-200 border border-green-300" /> CO</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-100 border border-amber-300" /> Weekend</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-rose-100 border border-rose-300" /> Liber stat</span>
          {isAdmin && (
            <Button variant="outline" size="sm" className="h-6 text-[10px] ml-2" onClick={openReorder}>
              <Settings2 className="h-3 w-3 mr-1" /> Reordonează
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground text-sm">Se încarcă...</div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto" ref={scrollRef}>
          <TooltipProvider delayDuration={200}>
            <table className="border-collapse text-[10px] leading-tight w-full" style={{ minWidth: `${120 + users.length * 90}px` }}>
              <thead className="sticky top-0 z-10 bg-background">
                <tr className="border-b border-border">
                  <th className="sticky left-0 z-20 bg-[#221F1F] text-white px-1 py-1.5 text-left font-semibold w-[40px]">Luna</th>
                  <th className="sticky left-[40px] z-20 bg-[#221F1F] text-white px-1 py-1.5 text-left font-semibold w-[28px]">Zi</th>
                  <th className="sticky left-[68px] z-20 bg-[#221F1F] text-white px-1 py-1.5 text-left font-semibold w-[24px]">D</th>
                  {users.map(u => (
                    <th key={u.id} className="bg-[#221F1F] text-white px-1 py-1.5 text-center font-semibold min-w-[80px] max-w-[100px] truncate">
                      {getFirstName(u.name)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {days.map((day, idx) => {
                  const dateKey = formatDateKey(day);
                  const dow = day.getDay();
                  const isWeekend = dow === 0 || dow === 6;
                  const isHoliday = PUBLIC_HOLIDAYS_2026[dateKey];
                  const isToday = dateKey === today;
                  const showMonth = idx === 0 || day.getDate() === 1;

                  return (
                    <tr
                      key={dateKey}
                      className={`border-b border-border/50 ${isToday ? "ring-2 ring-[#FFCB09] ring-inset" : ""} ${isWeekend ? "bg-amber-50/60" : isHoliday ? "bg-rose-50/60" : ""}`}
                    >
                      {/* Month */}
                      <td className={`sticky left-0 z-10 px-1 py-0.5 font-semibold text-[10px] ${isWeekend ? "bg-amber-50" : isHoliday ? "bg-rose-50" : "bg-background"} border-r border-border/30`}>
                        {showMonth ? MONTH_NAMES[day.getMonth()].substring(0, 3).toUpperCase() : ""}
                      </td>
                      {/* Day number */}
                      <td className={`sticky left-[40px] z-10 px-1 py-0.5 font-bold text-center ${isWeekend ? "bg-amber-50 text-amber-600" : isHoliday ? "bg-rose-50 text-rose-600" : "bg-background"} border-r border-border/30`}>
                        {day.getDate()}
                      </td>
                      {/* Day name */}
                      <td className={`sticky left-[68px] z-10 px-1 py-0.5 text-center ${isWeekend ? "bg-amber-50 text-amber-600" : isHoliday ? "bg-rose-50 text-rose-600" : "bg-background"} border-r border-border/30`}>
                        {DAY_NAMES_SHORT[dow]}
                      </td>
                      {/* User cells */}
                      {users.map(u => {
                        const leave = leaveMap.get(u.id)?.get(dateKey);

                        // Weekend - empty cell
                        if (isWeekend && !leave) {
                          return <td key={u.id} className="px-0.5 py-0.5 text-center bg-amber-50/60 border-r border-border/20" />;
                        }
                        // Public holiday
                        if (isHoliday && !leave) {
                          return (
                            <Tooltip key={u.id}>
                              <TooltipTrigger asChild>
                                <td className="px-0.5 py-0.5 text-center bg-rose-50/60 border-r border-border/20 cursor-default">
                                  <span className="text-[9px] text-rose-400">LL</span>
                                </td>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs max-w-[200px]">
                                {isHoliday}
                              </TooltipContent>
                            </Tooltip>
                          );
                        }
                        // Leave (CO, CM, etc.)
                        if (leave) {
                          const leaveLabel = LEAVE_LABELS[leave] || leave;
                          const leaveColor = LEAVE_COLORS[leave] || "bg-gray-100 text-gray-700";
                          return (
                            <td key={u.id} className={`px-0.5 py-0.5 text-center border-r border-border/20 ${leaveColor}`}>
                              <span className="font-bold text-[10px]">{leaveLabel}</span>
                            </td>
                          );
                        }
                        // Working day - show enrolled projects
                        const { labels, names } = getUserProjectsForDate(u.id, dateKey);
                        if (labels.length > 0) {
                          const displayLabel = labels.join(" / ");
                          const colors = projectColor(labels[0]);
                          return (
                            <Tooltip key={u.id}>
                              <TooltipTrigger asChild>
                                <td
                                  className="px-0.5 py-0.5 text-center border-r border-border/20 cursor-default"
                                  style={{ backgroundColor: colors.bg, color: colors.text }}
                                >
                                  <span className="font-semibold text-[8px] leading-tight block truncate">
                                    {displayLabel}
                                  </span>
                                </td>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs max-w-[300px]">
                                <div className="space-y-0.5">
                                  <p className="font-semibold">{u.name} — {dateKey}</p>
                                  {names.map((n, i) => <p key={i}>{labels[i]} — {n}</p>)}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          );
                        }
                        return <td key={u.id} className="px-0.5 py-0.5 text-center border-r border-border/20" />;
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TooltipProvider>
        </div>
      )}

      {/* Reorder Dialog */}
      <Dialog open={reorderOpen} onOpenChange={setReorderOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GripVertical className="h-5 w-5 text-[#FFCB09]" /> Reordonare angajați
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-1 mt-2">
            {reorderList.map((u, idx) => (
              <div key={u.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors">
                <span className="text-xs text-muted-foreground font-mono w-5 text-right">{idx + 1}.</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{u.name}</p>
                  {u.department && <p className="text-[10px] text-muted-foreground truncate">{u.department}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => moveUser(idx, -1)}
                    disabled={idx === 0}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => moveUser(idx, 1)}
                    disabled={idx === reorderList.length - 1}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button variant="outline" onClick={() => setReorderOpen(false)}>Anulează</Button>
            <Button className="bg-[#FFCB09] text-black hover:bg-[#e6b800]" onClick={saveReorder} disabled={reorderMutation.isPending}>
              {reorderMutation.isPending ? "Se salvează..." : "Salvează ordinea"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
