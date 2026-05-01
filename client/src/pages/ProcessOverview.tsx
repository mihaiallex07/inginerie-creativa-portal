import { trpc } from "@/lib/trpc";
import { useState, useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const MONTH_NAMES = ["Ian","Feb","Mar","Apr","Mai","Iun","Iul","Aug","Sep","Oct","Nov","Dec"];

function toUtcMs(d: string | Date | null | undefined): number {
  if (!d) return 0;
  const s = String(d);
  const normalized = /[Zz]|[+-]\d{2}:?\d{2}$/.test(s) ? s : s + "Z";
  return new Date(normalized).getTime();
}
function dayOffsetMs(ms: number, viewStartMs: number): number {
  return Math.round((ms - viewStartMs) / 86400000);
}
function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }
function initials(name: string) {
  return name.split(" ").filter(Boolean).map((p: string) => p[0]).join("").slice(0, 2).toUpperCase();
}

const ZOOM_PX = [8, 12, 16, 24, 32, 48];
const DEFAULT_ZOOM = 2;
const VIEW_DAYS = 90;
const BAR_H = 28;       // height of each project bar
const BAR_GAP = 6;      // gap between bars
const ROW_PAD = 8;      // top+bottom padding per employee row
const DEPT_H = 30;
const HEADER_H = 56;
const LABEL_W = 220;

const DEPT_COLORS: Record<string, string> = {
  "Proiectare Arhitectura": "#7c3aed",
  "Proiectare Structura": "#2563eb",
  "Proiectare Instalatii": "#0891b2",
  "Vanzari": "#16a34a",
  "Executie": "#d97706",
  "Fara departament": "#6b7280",
};
function deptColor(dept: string) { return DEPT_COLORS[dept] ?? "#6b7280"; }

const TASK_STATUS_LABEL: Record<string, string> = {
  de_facut: "De facut", in_lucru: "In lucru", in_pauza: "In pauza", finalizata: "Finalizat",
};
const TASK_STATUS_COLOR: Record<string, string> = {
  de_facut: "bg-gray-200 text-gray-700",
  in_lucru: "bg-blue-100 text-blue-800",
  in_pauza: "bg-amber-100 text-amber-800",
  finalizata: "bg-green-100 text-green-800",
};

function empRowHeight(projects: any[]): number {
  const n = Math.max(1, projects.length);
  return ROW_PAD * 2 + n * BAR_H + (n - 1) * BAR_GAP;
}

export default function ProcessOverview() {
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const [zoomIdx, setZoomIdx] = useState(DEFAULT_ZOOM);
  const pxPerDay = ZOOM_PX[zoomIdx];
  const [viewStart, setViewStart] = useState<Date>(() => {
    const d = new Date(today); d.setDate(d.getDate() - 14); return d;
  });
  const viewStartMs = useMemo(() => viewStart.getTime(), [viewStart]);
  const viewEnd = useMemo(() => {
    const d = new Date(viewStart); d.setDate(d.getDate() + VIEW_DAYS - 1); return d;
  }, [viewStart]);
  const [popup, setPopup] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: ganttRows = [], isLoading } = trpc.projects.ganttData.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const departments = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const row of ganttRows as any[]) {
      const dept = row.department || "Fara departament";
      if (!map.has(dept)) map.set(dept, []);
      map.get(dept)!.push(row);
    }
    return map;
  }, [ganttRows]);

  const monthTicks = useMemo(() => {
    const ticks: { label: string; offset: number; days: number }[] = [];
    const cur = new Date(viewStart);
    while (cur <= viewEnd) {
      const y = cur.getFullYear(); const m = cur.getMonth();
      const monthEnd = new Date(y, m + 1, 0);
      const visStart = new Date(Math.max(cur.getTime(), viewStart.getTime()));
      const visEnd = new Date(Math.min(monthEnd.getTime(), viewEnd.getTime()));
      const offset = dayOffsetMs(visStart.getTime(), viewStartMs);
      const days = Math.round((visEnd.getTime() - visStart.getTime()) / 86400000) + 1;
      ticks.push({ label: `${MONTH_NAMES[m]} ${y}`, offset, days });
      cur.setMonth(m + 1); cur.setDate(1);
    }
    return ticks;
  }, [viewStart, viewEnd, viewStartMs]);

  const dayTicks = useMemo(() => {
    return Array.from({ length: VIEW_DAYS }, (_, i) => {
      const d = new Date(viewStart); d.setDate(d.getDate() + i);
      const dow = d.getDay();
      return {
        day: d.getDate(), offset: i,
        isToday: d.getTime() === today.getTime(),
        isWeekend: dow === 0 || dow === 6,
      };
    });
  }, [viewStart, today]);

  const todayOffset = dayOffsetMs(today.getTime(), viewStartMs);
  const totalW = VIEW_DAYS * pxPerDay;

  function navigate(delta: number) {
    setViewStart(prev => { const d = new Date(prev); d.setDate(d.getDate() + delta); return d; });
    setPopup(null);
  }
  function goToday() {
    const d = new Date(today); d.setDate(d.getDate() - 14); setViewStart(d); setPopup(null);
  }
  function handleBarClick(e: React.MouseEvent, emp: any, proj: any) {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPopup({ emp, proj, x: rect.left, y: rect.bottom + 8 });
  }

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFCB09]" />
    </div>
  );

  if ((ganttRows as any[]).length === 0) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <p className="text-sm">Niciun angajat sau proiect activ gasit.</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white" onClick={() => setPopup(null)}>
      {/* toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 shrink-0 flex-wrap">
        <h1 className="text-lg font-bold text-[#221F1F] mr-1">Process Overview</h1>
        <Button variant="outline" size="sm" onClick={() => navigate(-14)} className="h-7 w-7 p-0">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate(14)} className="h-7 w-7 p-0">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={goToday} className="h-7 px-3 text-xs font-semibold">Azi</Button>
        <span className="text-xs text-gray-400">
          {viewStart.toLocaleDateString("ro-RO", { day: "2-digit", month: "short", year: "numeric" })}
          {" — "}
          {viewEnd.toLocaleDateString("ro-RO", { day: "2-digit", month: "short", year: "numeric" })}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="outline" size="sm"
            onClick={() => setZoomIdx(i => clamp(i - 1, 0, ZOOM_PX.length - 1))}
            disabled={zoomIdx === 0} className="h-7 w-7 p-0">
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span className="text-xs text-gray-400 w-12 text-center">{pxPerDay}px/zi</span>
          <Button variant="outline" size="sm"
            onClick={() => setZoomIdx(i => clamp(i + 1, 0, ZOOM_PX.length - 1))}
            disabled={zoomIdx === ZOOM_PX.length - 1} className="h-7 w-7 p-0">
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* main grid */}
      <div className="flex flex-1 overflow-hidden">
        {/* label column — synced scroll with gantt */}
        <div className="shrink-0 flex flex-col border-r border-gray-200" style={{ width: LABEL_W }}>
          <div style={{ height: HEADER_H }}
            className="border-b border-gray-200 bg-gray-50 flex items-end px-3 pb-2 shrink-0">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Angajat / Proiecte</span>
          </div>
          <div className="overflow-y-auto flex-1" id="gantt-label-scroll">
            {Array.from(departments.entries()).map(([dept, emps]) => (
              <div key={dept}>
                {/* dept header */}
                <div className="flex items-center gap-2 px-3 text-white text-xs font-semibold uppercase tracking-wide"
                  style={{ height: DEPT_H, background: deptColor(dept) }}>
                  <span className="truncate">{dept}</span>
                  <span className="ml-auto opacity-60 text-[10px] font-normal">{emps.length}</span>
                </div>
                {emps.map((emp: any) => {
                  const rowH = empRowHeight(emp.projects);
                  return (
                    <div key={emp.userId}
                      className="flex items-start gap-2 px-3 border-b border-gray-100 bg-white"
                      style={{ height: rowH, paddingTop: ROW_PAD }}>
                      <div className="h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 mt-0.5"
                        style={{ background: deptColor(dept) }}>
                        {initials(emp.userName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-[#221F1F] truncate leading-tight">{emp.userName}</div>
                        {emp.jobTitle && <div className="text-[10px] text-gray-400 truncate">{emp.jobTitle}</div>}
                        {/* project name labels stacked */}
                        <div className="mt-1 space-y-[6px]">
                          {(emp.projects as any[]).map((proj: any) => (
                            <div key={proj.projectId}
                              className="text-[10px] font-medium truncate leading-none"
                              style={{ height: BAR_H, lineHeight: BAR_H + "px", color: "#555" }}>
                              {[proj.projectCode, proj.projectAbbreviation].filter(Boolean).join(" · ") || proj.projectName}
                            </div>
                          ))}
                          {emp.projects.length === 0 && (
                            <div className="text-[10px] text-gray-300 italic" style={{ height: BAR_H, lineHeight: BAR_H + "px" }}>
                              Fara proiecte
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* scrollable gantt */}
        <div className="flex-1 overflow-auto" ref={scrollRef}
          onScroll={e => {
            const labelScroll = document.getElementById("gantt-label-scroll");
            if (labelScroll) labelScroll.scrollTop = (e.target as HTMLElement).scrollTop;
          }}>
          <div style={{ width: totalW, minWidth: totalW }}>
            {/* header */}
            <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200" style={{ height: HEADER_H }}>
              <div className="flex" style={{ height: 24 }}>
                {monthTicks.map((tick, i) => (
                  <div key={i}
                    className="text-[11px] font-semibold text-gray-600 border-r border-gray-200 flex items-center px-2 shrink-0 overflow-hidden"
                    style={{ width: tick.days * pxPerDay }}>
                    {tick.label}
                  </div>
                ))}
              </div>
              <div className="flex" style={{ height: 32 }}>
                {dayTicks.map((tick, i) => (
                  <div key={i}
                    className={`text-[10px] border-r border-gray-100 flex items-center justify-center shrink-0 font-medium select-none ${
                      tick.isToday ? "bg-[#FFCB09] text-[#221F1F] font-bold"
                      : tick.isWeekend ? "bg-gray-100 text-gray-400"
                      : "text-gray-500"
                    }`}
                    style={{ width: pxPerDay }}>
                    {pxPerDay >= 12 ? tick.day : (tick.day % 7 === 1 ? tick.day : "")}
                  </div>
                ))}
              </div>
            </div>

            {/* rows */}
            <div className="relative">
              {/* today line */}
              {todayOffset >= 0 && todayOffset < VIEW_DAYS && (
                <div className="absolute top-0 bottom-0 z-20 pointer-events-none"
                  style={{
                    left: todayOffset * pxPerDay + pxPerDay / 2 - 1,
                    width: 2, background: "#FFCB09", opacity: 0.8,
                  }} />
              )}
              {Array.from(departments.entries()).map(([dept, emps]) => (
                <div key={dept}>
                  {/* dept separator */}
                  <div style={{
                    height: DEPT_H, width: totalW,
                    background: deptColor(dept) + "18",
                    borderBottom: `1px solid ${deptColor(dept)}33`,
                  }} />
                  {emps.map((emp: any) => {
                    const rowH = empRowHeight(emp.projects);
                    return (
                      <div key={emp.userId}
                        className="relative border-b border-gray-100"
                        style={{ height: rowH, width: totalW }}>
                        {/* weekend shading */}
                        {dayTicks.filter(d => d.isWeekend).map(d => (
                          <div key={d.offset}
                            className="absolute top-0 bottom-0 pointer-events-none"
                            style={{ left: d.offset * pxPerDay, width: pxPerDay, background: "rgba(0,0,0,0.02)" }} />
                        ))}
                        {/* one bar per project, stacked vertically */}
                        {(emp.projects as any[]).map((proj: any, projIdx: number) => {
                          const startMs = toUtcMs(proj.startDate);
                          const endMs = toUtcMs(proj.endDate);
                          const startOff = startMs ? dayOffsetMs(startMs, viewStartMs) : -1;
                          const endOff = endMs ? dayOffsetMs(endMs, viewStartMs) : -1;
                          if (startOff < 0 && endOff < 0) return null;
                          const visStart = clamp(startOff >= 0 ? startOff : 0, 0, VIEW_DAYS - 1);
                          const visEnd = clamp(endOff >= 0 ? endOff : VIEW_DAYS - 1, 0, VIEW_DAYS - 1);
                          if (visEnd < visStart) return null;
                          const barLeft = visStart * pxPerDay;
                          const barW = (visEnd - visStart + 1) * pxPerDay;
                          const barTop = ROW_PAD + projIdx * (BAR_H + BAR_GAP);
                          const label = [proj.projectCode, proj.projectAbbreviation].filter(Boolean).join(" · ");
                          const hasActive = (proj.tasks as any[]).some((t: any) => t.taskStatus === "in_lucru");
                          return (
                            <div key={proj.projectId} title={proj.projectName}
                              className="absolute rounded-md cursor-pointer flex items-center gap-1 px-2 overflow-hidden select-none hover:brightness-95 transition-all"
                              style={{
                                left: barLeft, width: barW, height: BAR_H, top: barTop,
                                background: proj.projectColor || "#FFCB09",
                                border: hasActive ? "2px solid #1d4ed8" : "1px solid rgba(0,0,0,0.12)",
                                boxShadow: hasActive ? "0 0 0 2px rgba(29,78,216,0.2)" : "none",
                              }}
                              onClick={e => handleBarClick(e, emp, proj)}>
                              {proj.projectEmoji && barW >= 32 && (
                                <span className="text-sm leading-none shrink-0">{proj.projectEmoji}</span>
                              )}
                              {barW >= 40 && (
                                <span className="text-[11px] font-bold truncate leading-none" style={{ color: "#221F1F" }}>
                                  {label || proj.projectName}
                                </span>
                              )}
                            </div>
                          );
                        })}
                        {emp.projects.length === 0 && (
                          <div className="absolute inset-0 flex items-center px-3">
                            <span className="text-[10px] text-gray-300 italic">Fara proiecte active</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* popup */}
      {popup && (
        <div className="fixed z-50 bg-white rounded-xl shadow-2xl border border-gray-100 p-4 min-w-[280px] max-w-[360px]"
          style={{
            top: Math.min(popup.y, window.innerHeight - 320),
            left: Math.min(popup.x, window.innerWidth - 380),
          }}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-[11px] text-gray-400 font-medium mb-0.5">{popup.emp.userName}</div>
              <div className="text-sm font-bold text-[#221F1F]">
                {[popup.proj.projectCode, popup.proj.projectAbbreviation].filter(Boolean).join(" · ") || popup.proj.projectName}
              </div>
              <div className="text-xs text-gray-500">{popup.proj.projectName}</div>
            </div>
            <button onClick={() => setPopup(null)} className="text-gray-400 hover:text-gray-700 ml-3 shrink-0 mt-0.5">
              <X className="h-4 w-4" />
            </button>
          </div>
          {popup.proj.tasks.length === 0 ? (
            <p className="text-xs text-gray-400 italic">Niciun task activ in acest proiect.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {popup.proj.tasks.map((t: any) => (
                <div key={t.taskId} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-[#221F1F] truncate">{t.taskName}</div>
                    <div className="text-[10px] text-gray-400">{t.phaseCode} · {t.phaseName}</div>
                    {t.budgetHours > 0 && (
                      <div className="mt-1">
                        <div className="h-1 rounded-full bg-gray-200 overflow-hidden">
                          <div className="h-full rounded-full bg-[#FFCB09]"
                            style={{ width: `${Math.min(100, Math.round((t.minutesWorked || 0) / (t.budgetHours * 60) * 100))}%` }} />
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {Math.round((t.minutesWorked || 0) / 60 * 10) / 10}h / {t.budgetHours}h
                        </div>
                      </div>
                    )}
                  </div>
                  <Badge className={`text-[9px] px-1.5 py-0.5 shrink-0 ${TASK_STATUS_COLOR[t.taskStatus] || "bg-gray-100 text-gray-600"}`}>
                    {TASK_STATUS_LABEL[t.taskStatus] || t.taskStatus}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
