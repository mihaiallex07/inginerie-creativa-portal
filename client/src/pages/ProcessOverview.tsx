import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useMemo, useRef, useEffect } from "react";
import {
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  Users, Clock, ChevronDown, ChevronRight as ChevronRightIcon,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

// ─── helpers ──────────────────────────────────────────────────────────────────
const MONTH_NAMES = [
  "Ian", "Feb", "Mar", "Apr", "Mai", "Iun",
  "Iul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const MONTH_FULL = [
  "Ianuarie","Februarie","Martie","Aprilie","Mai","Iunie",
  "Iulie","August","Septembrie","Octombrie","Noiembrie","Decembrie",
];

function isLeapYear(y: number) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}
function daysInYear(y: number) { return isLeapYear(y) ? 366 : 365; }
function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }

/** 1-indexed day-of-year */
function doy(date: Date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86400000);
}

function clampDoy(date: Date | null | undefined, year: number, fallback: "start" | "end"): number {
  if (!date) return fallback === "start" ? 1 : daysInYear(year);
  const d = new Date(date);
  if (d.getFullYear() < year) return 1;
  if (d.getFullYear() > year) return daysInYear(year);
  return doy(d);
}

function fmtDate(date: any) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("ro-RO", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function initials(name: string) {
  return name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
}

// ─── zoom levels: pixels per day ──────────────────────────────────────────────
const ZOOM_PX = [2, 3, 4, 6, 8, 12, 16];
const DEFAULT_ZOOM = 3; // index → 6px/day

// ─── row heights ──────────────────────────────────────────────────────────────
const ROW_PROJECT = 40;
const ROW_TASK = 32;
const HEADER_H = 52;
const LABEL_W = 300;

// ─── status colours ───────────────────────────────────────────────────────────
const PROJECT_STATUS: Record<string, string> = {
  activ: "bg-green-100 text-green-800",
  suspendat: "bg-amber-100 text-amber-800",
  finalizat: "bg-gray-100 text-gray-600",
  intern: "bg-blue-100 text-blue-800",
};
const TASK_STATUS_HEX: Record<string, string> = {
  de_facut: "#94a3b8",
  in_lucru: "#3b82f6",
  in_pauza: "#f59e0b",
  finalizata: "#22c55e",
};

// ─── component ────────────────────────────────────────────────────────────────
export default function ProcessOverview() {
  const { user } = useAuth();
  const today = new Date();

  const [year, setYear] = useState(today.getFullYear());
  const [zoomIdx, setZoomIdx] = useState(DEFAULT_ZOOM);
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());

  const pxPerDay = ZOOM_PX[zoomIdx];
  const totalDays = daysInYear(year);
  const totalWidth = totalDays * pxPerDay;

  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: ganttProjects = [], isLoading } = trpc.projects.ganttData.useQuery({});

  // scroll to today on first load
  useEffect(() => {
    if (!scrollRef.current || isLoading) return;
    const todayDoy = doy(today);
    const x = (todayDoy - 1) * pxPerDay - scrollRef.current.clientWidth / 2;
    scrollRef.current.scrollLeft = Math.max(0, x);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  // month header data
  const monthHeaders = useMemo(() => {
    const out = [];
    let offset = 0;
    for (let m = 0; m < 12; m++) {
      const days = daysInMonth(year, m);
      out.push({ m, days, offset });
      offset += days;
    }
    return out;
  }, [year]);

  const todayDoy = today.getFullYear() === year ? doy(today) : -1;
  const todayX = todayDoy > 0 ? (todayDoy - 1) * pxPerDay : -1;

  // build flat rows
  type Row =
    | { kind: "project"; p: any; rowIdx: number }
    | { kind: "task"; p: any; t: any; rowIdx: number };

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    for (const p of ganttProjects as any[]) {
      out.push({ kind: "project", p, rowIdx: out.length });
      if (!collapsed.has(p.id)) {
        for (const t of p.tasks ?? []) {
          out.push({ kind: "task", p, t, rowIdx: out.length });
        }
      }
    }
    return out;
  }, [ganttProjects, collapsed]);

  const totalHeight = HEADER_H + rows.length * ROW_PROJECT + 40;

  function toggleProject(id: number) {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function scrollToToday() {
    if (!scrollRef.current) return;
    const x = (doy(today) - 1) * pxPerDay - scrollRef.current.clientWidth / 2;
    scrollRef.current.scrollLeft = Math.max(0, x);
  }

  // bar geometry helper
  function bar(startDate: any, endDate: any) {
    const s = clampDoy(startDate ? new Date(startDate) : null, year, "start");
    const e = clampDoy(endDate ? new Date(endDate) : null, year, "end");
    return { x: (s - 1) * pxPerDay, w: Math.max(pxPerDay, (e - s + 1) * pxPerDay) };
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full bg-white select-none">

        {/* ── toolbar ── */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-white z-10 flex-shrink-0 gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold text-[#221F1F]">Process Overview</h1>
            <Badge variant="outline" className="text-xs font-medium">
              {(ganttProjects as any[]).length} proiecte
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {/* year nav */}
            <div className="flex items-center gap-0.5 border border-gray-200 rounded-lg px-1.5 py-1">
              <button onClick={() => setYear(y => y - 1)} className="p-0.5 rounded hover:bg-gray-100 transition-colors">
                <ChevronLeft className="h-3.5 w-3.5 text-gray-600" />
              </button>
              <span className="text-sm font-semibold w-11 text-center">{year}</span>
              <button onClick={() => setYear(y => y + 1)} className="p-0.5 rounded hover:bg-gray-100 transition-colors">
                <ChevronRight className="h-3.5 w-3.5 text-gray-600" />
              </button>
            </div>

            {/* zoom */}
            <div className="flex items-center gap-0.5 border border-gray-200 rounded-lg px-1.5 py-1">
              <button onClick={() => setZoomIdx(z => Math.max(0, z - 1))} disabled={zoomIdx === 0}
                className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors">
                <ZoomOut className="h-3.5 w-3.5 text-gray-600" />
              </button>
              <span className="text-[11px] text-gray-500 w-10 text-center">{pxPerDay}px/zi</span>
              <button onClick={() => setZoomIdx(z => Math.min(ZOOM_PX.length - 1, z + 1))} disabled={zoomIdx === ZOOM_PX.length - 1}
                className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors">
                <ZoomIn className="h-3.5 w-3.5 text-gray-600" />
              </button>
            </div>

            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={scrollToToday}>
              Azi
            </Button>
          </div>

          {/* legend */}
          <div className="hidden lg:flex items-center gap-3 text-[10px] text-gray-500">
            {Object.entries(TASK_STATUS_HEX).map(([s, c]) => (
              <span key={s} className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: c }} />
                {s.replace("_", " ")}
              </span>
            ))}
          </div>
        </div>

        {/* ── loading / empty ── */}
        {isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-7 h-7 border-2 border-[#FFCB09] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-400">Se încarcă Gantt-ul...</p>
            </div>
          </div>
        )}
        {!isLoading && (ganttProjects as any[]).length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-gray-200" />
              <p className="text-sm font-medium">Niciun proiect activ</p>
              <p className="text-xs mt-1">Proiectele active vor apărea automat</p>
            </div>
          </div>
        )}

        {/* ── main gantt ── */}
        {!isLoading && (ganttProjects as any[]).length > 0 && (
          <div className="flex flex-1 overflow-hidden">

            {/* label column (fixed) */}
            <div className="flex-shrink-0 border-r border-gray-200 bg-white z-10 flex flex-col" style={{ width: LABEL_W }}>
              {/* header spacer */}
              <div style={{ height: HEADER_H }} className="border-b border-gray-200 flex items-end px-3 pb-2 flex-shrink-0">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Proiect / Task</span>
              </div>
              {/* rows */}
              <div className="overflow-y-hidden flex-1">
                {rows.map(row => {
                  const key = row.kind === "project" ? `lp-${row.p.id}` : `lt-${row.t.taskId}`;
                  const h = row.kind === "project" ? ROW_PROJECT : ROW_TASK;
                  if (row.kind === "project") {
                    const isOpen = !collapsed.has(row.p.id);
                    const taskCount = (row.p.tasks ?? []).length;
                    return (
                      <div key={key} style={{ height: h }}
                        className="flex items-center gap-2 px-2 border-b border-gray-100 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => toggleProject(row.p.id)}>
                        {/* color square */}
                        <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 text-sm font-bold shadow-sm"
                          style={{ background: row.p.color || "#FFCB09" }}>
                          {row.p.emoji || (row.p.abbreviation || row.p.code || "?").slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#221F1F] truncate leading-tight">{row.p.name}</p>
                          <p className="text-[10px] text-gray-400 truncate">{row.p.clientName} · {taskCount} task-uri</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${PROJECT_STATUS[row.p.status] || "bg-gray-100 text-gray-600"}`}>
                            {row.p.status}
                          </span>
                          {isOpen
                            ? <ChevronDown className="h-3 w-3 text-gray-400" />
                            : <ChevronRightIcon className="h-3 w-3 text-gray-400" />}
                        </div>
                      </div>
                    );
                  } else {
                    const assignees = row.t.assigneeNames
                      ? row.t.assigneeNames.split(", ").filter(Boolean)
                      : [];
                    return (
                      <div key={key} style={{ height: h }}
                        className="flex items-center gap-2 pl-8 pr-2 border-b border-gray-100 bg-white">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: TASK_STATUS_HEX[row.t.taskStatus] || "#94a3b8" }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-gray-700 truncate leading-tight">{row.t.taskName}</p>
                          <p className="text-[9px] text-gray-400 truncate">{row.t.phaseCode} · {row.t.phaseName}</p>
                        </div>
                        {assignees.length > 0 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex -space-x-1 flex-shrink-0">
                                {assignees.slice(0, 3).map((name: string, i: number) => (
                                  <div key={i}
                                    className="w-5 h-5 rounded-full bg-[#FFCB09] flex items-center justify-center text-[8px] font-bold text-[#221F1F] border border-white"
                                    title={name}>
                                    {initials(name)}
                                  </div>
                                ))}
                                {assignees.length > 3 && (
                                  <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-600 border border-white">
                                    +{assignees.length - 3}
                                  </div>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="text-xs">
                              {assignees.join(", ")}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    );
                  }
                })}
              </div>
            </div>

            {/* scrollable gantt canvas */}
            <div ref={scrollRef} className="flex-1 overflow-x-auto overflow-y-hidden relative">
              <div style={{ width: totalWidth, minHeight: totalHeight, position: "relative" }}>

                {/* ── month/day header (sticky) ── */}
                <div style={{ height: HEADER_H, position: "sticky", top: 0, zIndex: 5, background: "white", borderBottom: "1px solid #e5e7eb" }}>
                  {/* month row */}
                  <div style={{ height: 28, display: "flex", borderBottom: "1px solid #e5e7eb" }}>
                    {monthHeaders.map(mh => (
                      <div key={mh.m} style={{ width: mh.days * pxPerDay, flexShrink: 0, borderRight: "1px solid #e5e7eb" }}
                        className="flex items-center justify-center">
                        <span className="text-[11px] font-semibold text-gray-600 truncate px-1">
                          {pxPerDay >= 4 ? MONTH_FULL[mh.m] : MONTH_NAMES[mh.m]}
                        </span>
                      </div>
                    ))}
                  </div>
                  {/* day row */}
                  <div style={{ height: 24, display: "flex", position: "relative" }}>
                    {monthHeaders.map(mh =>
                      Array.from({ length: mh.days }, (_, d) => {
                        const date = new Date(year, mh.m, d + 1);
                        const isWknd = date.getDay() === 0 || date.getDay() === 6;
                        const dayDoy = mh.offset + d + 1;
                        const isToday = dayDoy === todayDoy;
                        return (
                          <div key={`${mh.m}-${d}`} style={{ width: pxPerDay, flexShrink: 0 }}
                            className={`flex items-center justify-center text-[9px] border-r border-gray-100 h-full
                              ${isToday ? "bg-[#FFCB09] font-bold text-[#221F1F]" : isWknd ? "bg-gray-50 text-gray-300" : "text-gray-400"}`}>
                            {pxPerDay >= 8 ? d + 1 : ""}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* ── background grid ── */}
                <div style={{ position: "absolute", top: HEADER_H, left: 0, right: 0, bottom: 0, pointerEvents: "none" }}>
                  {/* weekend shading */}
                  {monthHeaders.map(mh =>
                    Array.from({ length: mh.days }, (_, d) => {
                      const date = new Date(year, mh.m, d + 1);
                      const isWknd = date.getDay() === 0 || date.getDay() === 6;
                      if (!isWknd) return null;
                      const dayDoy = mh.offset + d;
                      return (
                        <div key={`wk-${mh.m}-${d}`}
                          style={{ position: "absolute", left: dayDoy * pxPerDay, top: 0, bottom: 0, width: pxPerDay, background: "rgba(0,0,0,0.025)" }} />
                      );
                    })
                  )}
                  {/* month dividers */}
                  {monthHeaders.map(mh => (
                    <div key={`div-${mh.m}`}
                      style={{ position: "absolute", left: mh.offset * pxPerDay, top: 0, bottom: 0, width: 1, background: "#e5e7eb" }} />
                  ))}
                  {/* today line */}
                  {todayX >= 0 && (
                    <div style={{ position: "absolute", left: todayX + pxPerDay / 2, top: 0, bottom: 0, width: 2, background: "#FFCB09", opacity: 0.9 }} />
                  )}
                </div>

                {/* ── bars ── */}
                <div style={{ position: "absolute", top: HEADER_H, left: 0, right: 0 }}>
                  {rows.map(row => {
                    const rowTop = row.rowIdx * ROW_PROJECT;
                    const h = row.kind === "project" ? ROW_PROJECT : ROW_TASK;

                    if (row.kind === "project") {
                      const b = bar(row.p.startDate, row.p.endDate);
                      return (
                        <div key={`bp-${row.p.id}`}
                          style={{ position: "absolute", top: rowTop, left: 0, right: 0, height: h }}
                          className="border-b border-gray-100 bg-gray-50/40">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div style={{ position: "absolute", left: b.x, width: b.w, top: 8, height: h - 16, background: row.p.color || "#FFCB09", borderRadius: 5, opacity: 0.85, cursor: "default" }}
                                className="flex items-center px-2 overflow-hidden">
                                <span className="text-[10px] font-bold text-white truncate" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}>
                                  {row.p.emoji ? `${row.p.emoji} ` : ""}{row.p.name}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs max-w-[220px]">
                              <p className="font-semibold">{row.p.name}</p>
                              <p className="text-gray-400">{row.p.clientName}</p>
                              <p>Start: {fmtDate(row.p.startDate)} · Final: {fmtDate(row.p.endDate)}</p>
                              <p>Manager: {row.p.managerName || "—"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      );
                    } else {
                      // task bar — spans project dates, fill = progress
                      const b = bar(row.p.startDate, row.p.endDate);
                      const pct = row.t.budgetHours > 0
                        ? Math.min(100, (row.t.minutesWorked / (Number(row.t.budgetHours) * 60)) * 100)
                        : 0;
                      const taskColor = TASK_STATUS_HEX[row.t.taskStatus] || "#94a3b8";
                      const assignees = row.t.assigneeNames
                        ? row.t.assigneeNames.split(", ").filter(Boolean)
                        : [];
                      return (
                        <div key={`bt-${row.t.taskId}`}
                          style={{ position: "absolute", top: rowTop, left: 0, right: 0, height: h }}
                          className="border-b border-gray-100">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div style={{ position: "absolute", left: b.x, width: b.w, top: 10, height: h - 20, background: "#e5e7eb", borderRadius: 3, overflow: "hidden", cursor: "default" }}>
                                {/* progress fill */}
                                <div style={{ width: `${pct}%`, height: "100%", background: taskColor, opacity: 0.85 }} />
                                {/* assignee avatars overlay */}
                                {pxPerDay >= 4 && assignees.length > 0 && b.w > 40 && (
                                  <div style={{ position: "absolute", top: 0, right: 4, height: "100%", display: "flex", alignItems: "center", gap: 1 }}>
                                    {assignees.slice(0, 3).map((name: string, i: number) => (
                                      <div key={i}
                                        className="w-4 h-4 rounded-full bg-white flex items-center justify-center text-[7px] font-bold border"
                                        style={{ borderColor: taskColor, color: taskColor }}>
                                        {initials(name)}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs max-w-[240px]">
                              <p className="font-semibold">{row.t.taskName}</p>
                              <p className="text-gray-400">{row.t.phaseCode} · {row.t.phaseName}</p>
                              {assignees.length > 0 && (
                                <p className="flex items-center gap-1 mt-1">
                                  <Users className="h-3 w-3" />{assignees.join(", ")}
                                </p>
                              )}
                              <p className="flex items-center gap-1 mt-1">
                                <Clock className="h-3 w-3" />
                                {(row.t.minutesWorked / 60).toFixed(1)}h / {row.t.budgetHours}h ({Math.round(pct)}%)
                              </p>
                              <p className="mt-1">Status: <span className="font-medium">{row.t.taskStatus}</span></p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      );
                    }
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
