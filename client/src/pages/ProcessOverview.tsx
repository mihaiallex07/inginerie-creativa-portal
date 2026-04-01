import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight, Download, CalendarDays } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

  // Build lookup maps
  const { userDayMap, leaveMap } = useMemo(() => {
    if (!data) return { userDayMap: new Map(), leaveMap: new Map() };

    // Time entries: userId -> dateKey -> projectCodes[]
    const udm = new Map<number, Map<string, { codes: string[]; details: string[] }>>();
    for (const te of data.timeEntries) {
      const dateKey = typeof te.date === "string"
        ? te.date.substring(0, 10)
        : formatDateKey(new Date(te.date));
      if (!udm.has(te.userId)) udm.set(te.userId, new Map());
      const userMap = udm.get(te.userId)!;
      if (!userMap.has(dateKey)) userMap.set(dateKey, { codes: [], details: [] });
      const entry = userMap.get(dateKey)!;
      const code = te.projectCode || te.projectName || te.taskName || "—";
      if (!entry.codes.includes(code)) entry.codes.push(code);
      const h1 = String(te.startHour ?? 0).padStart(2, "0");
      const m1 = String(te.startMin ?? 0).padStart(2, "0");
      const h2 = String(te.endHour ?? 0).padStart(2, "0");
      const m2 = String(te.endMin ?? 0).padStart(2, "0");
      entry.details.push(`${h1}:${m1}-${h2}:${m2} ${te.taskName || code}`);
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

    return { userDayMap: udm, leaveMap: lm };
  }, [data]);

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
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-200 border border-red-300" /> CM</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-200 border border-blue-300" /> LL</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-100 border border-amber-300" /> Weekend</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-rose-100 border border-rose-300" /> Liber stat</span>
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
                        const work = userDayMap.get(u.id)?.get(dateKey);

                        if (isWeekend && !work && !leave) {
                          return <td key={u.id} className="px-0.5 py-0.5 text-center bg-amber-50/60 border-r border-border/20" />;
                        }
                        if (isHoliday && !work && !leave) {
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
                        if (leave) {
                          const leaveLabel = LEAVE_LABELS[leave] || leave;
                          const leaveColor = LEAVE_COLORS[leave] || "bg-gray-100 text-gray-700";
                          return (
                            <td key={u.id} className={`px-0.5 py-0.5 text-center border-r border-border/20 ${leaveColor}`}>
                              <span className="font-bold text-[10px]">{leaveLabel}</span>
                            </td>
                          );
                        }
                        if (work) {
                          const label = work.codes.join(" / ");
                          // Color based on first project
                          const colors = work.codes.length > 0 ? projectColor(work.codes[0]) : { bg: "#f3f4f6", text: "#374151" };
                          const isFinal = work.details.some((d: string) => d.toLowerCase().includes("final"));
                          return (
                            <Tooltip key={u.id}>
                              <TooltipTrigger asChild>
                                <td
                                  className={`px-0.5 py-0.5 text-center border-r border-border/20 cursor-default ${isFinal ? "ring-2 ring-red-500 ring-inset" : ""}`}
                                  style={{ backgroundColor: colors.bg, color: colors.text }}
                                >
                                  <span className={`font-semibold text-[9px] leading-tight block truncate ${isFinal ? "text-red-700 font-bold" : ""}`}>
                                    {label}
                                  </span>
                                </td>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs max-w-[300px]">
                                <div className="space-y-0.5">
                                  <p className="font-semibold">{u.name} — {dateKey}</p>
                                  {work.details.map((d: string, i: number) => <p key={i}>{d}</p>)}
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
    </div>
  );
}
