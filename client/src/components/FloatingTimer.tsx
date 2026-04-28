/**
 * FloatingTimer — Fast Time Tracking bubble
 * A draggable rectangular overlay visible on all pages.
 * Keyboard shortcut: Alt+T (configurable via localStorage)
 * State persisted in localStorage so it survives page navigation.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Timer, X, Play, Square, ChevronDown, GripHorizontal, Settings } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const ACTIVITY_TYPES = [
  "proiectare", "consultanta", "sedinta", "documentare",
  "deplasare", "administrativ", "verificare", "executie",
] as const;

type ActivityType = typeof ACTIVITY_TYPES[number];

const SHORTCUT_KEY = "ic-timer-shortcut"; // localStorage key for shortcut
const DEFAULT_SHORTCUT = "Alt+T";

function formatElapsed(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function parseShortcut(shortcut: string): { key: string; alt: boolean; ctrl: boolean; shift: boolean } {
  const parts = shortcut.split("+");
  return {
    alt: parts.includes("Alt"),
    ctrl: parts.includes("Ctrl"),
    shift: parts.includes("Shift"),
    key: parts[parts.length - 1],
  };
}

export default function FloatingTimer() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  // Queries
  const { data: runningTimer, refetch: refetchTimer } = trpc.timeTracking.runningTimer.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 5000,
  });
  const { data: projectsData } = trpc.projects.list.useQuery({ status: "activ" }, { enabled: !!user });

  // Mutations
  const startMutation = trpc.timeTracking.startTimer.useMutation({
    onSuccess: () => {
      refetchTimer();
      utils.timeTracking.runningTimer.invalidate();
      toast.success("Timer pornit!");
    },
    onError: (err) => toast.error(err.message),
  });

  const stopMutation = trpc.timeTracking.stopTimer.useMutation({
    onSuccess: (data) => {
      refetchTimer();
      utils.timeTracking.runningTimer.invalidate();
      utils.timeTracking.myEntries.invalidate();
      const mins = data.durationMinutes ?? 0;
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      toast.success(`Timer oprit — ${h > 0 ? `${h}h ` : ""}${m}m înregistrate`);
    },
    onError: (err) => toast.error(err.message),
  });

  // UI state
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [activityType, setActivityType] = useState<ActivityType>("proiectare");
  const [projectId, setProjectId] = useState<string>("none");
  const [taskName, setTaskName] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [shortcut, setShortcut] = useState(() => localStorage.getItem(SHORTCUT_KEY) ?? DEFAULT_SHORTCUT);
  const [editingShortcut, setEditingShortcut] = useState(false);
  const [newShortcut, setNewShortcut] = useState("");

  // Drag state
  const [pos, setPos] = useState({ x: window.innerWidth - 280, y: window.innerHeight - 120 });
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const bubbleRef = useRef<HTMLDivElement>(null);

  // Compute elapsed from running timer
  useEffect(() => {
    if (!runningTimer?.isRunning || !runningTimer.startTime) {
      setElapsed(0);
      return;
    }
    const update = () => {
      const start = new Date(runningTimer.startTime!).getTime();
      setElapsed(Math.floor((Date.now() - start) / 1000));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [runningTimer?.isRunning, runningTimer?.startTime]);

  // Keyboard shortcut
  useEffect(() => {
    const parsed = parseShortcut(shortcut);
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === parsed.key &&
        e.altKey === parsed.alt &&
        e.ctrlKey === parsed.ctrl &&
        e.shiftKey === parsed.shift
      ) {
        e.preventDefault();
        setVisible(v => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcut]);

  // Drag handlers
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
    dragging.current = true;
    dragOffset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };
    e.preventDefault();
  }, [pos]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const x = Math.max(0, Math.min(window.innerWidth - 260, e.clientX - dragOffset.current.x));
      const y = Math.max(0, Math.min(window.innerHeight - 60, e.clientY - dragOffset.current.y));
      setPos({ x, y });
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  function handleStart() {
    startMutation.mutate({
      activityType,
      projectId: projectId !== "none" ? Number(projectId) : undefined,
      taskName: taskName.trim() || undefined,
    });
    setExpanded(false);
  }

  function handleStop() {
    if (!runningTimer?.id) return;
    stopMutation.mutate({ id: runningTimer.id });
  }

  function saveShortcut() {
    if (!newShortcut) return;
    localStorage.setItem(SHORTCUT_KEY, newShortcut);
    setShortcut(newShortcut);
    setEditingShortcut(false);
    toast.success(`Scurtătură setată: ${newShortcut}`);
  }

  function captureShortcut(e: React.KeyboardEvent) {
    e.preventDefault();
    const parts: string[] = [];
    if (e.ctrlKey) parts.push("Ctrl");
    if (e.altKey) parts.push("Alt");
    if (e.shiftKey) parts.push("Shift");
    if (!["Control", "Alt", "Shift"].includes(e.key)) parts.push(e.key.toUpperCase());
    if (parts.length > 0) setNewShortcut(parts.join("+"));
  }

  const isRunning = !!runningTimer?.isRunning;
  const projects = projectsData ?? [];

  if (!user) return null;

  return (
    <>
      {/* Floating trigger button (always visible, bottom-right) */}
      {!visible && (
        <button
          onClick={() => setVisible(true)}
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg transition-all
            ${isRunning
              ? "bg-green-600 text-white hover:bg-green-700 animate-pulse"
              : "bg-[#221F1F] text-[#FFCB09] hover:bg-[#333] border border-[#FFCB09]/30"
            }`}
          title={`Timer rapid (${shortcut})`}
        >
          <Timer className="h-4 w-4" />
          {isRunning ? (
            <span className="text-sm font-mono font-bold">{formatElapsed(elapsed)}</span>
          ) : (
            <span className="text-sm font-semibold">Timer</span>
          )}
        </button>
      )}

      {/* Floating bubble */}
      {visible && (
        <div
          ref={bubbleRef}
          style={{ left: pos.x, top: pos.y, position: "fixed", zIndex: 9999 }}
          className="w-64 rounded-xl shadow-2xl border border-border bg-[#221F1F] text-white select-none"
          onMouseDown={onMouseDown}
        >
          {/* Header — drag handle */}
          <div className="flex items-center justify-between px-3 py-2 cursor-grab active:cursor-grabbing border-b border-white/10">
            <div className="flex items-center gap-2">
              <GripHorizontal className="h-3.5 w-3.5 text-white/40" />
              <Timer className={`h-3.5 w-3.5 ${isRunning ? "text-green-400" : "text-[#FFCB09]"}`} />
              <span className="text-xs font-semibold text-white/80">Timer Rapid</span>
            </div>
            <div className="flex items-center gap-1" data-no-drag>
              <button
                onClick={() => setEditingShortcut(s => !s)}
                className="p-1 rounded hover:bg-white/10 transition-colors"
                title="Configurează scurtătură"
              >
                <Settings className="h-3 w-3 text-white/40" />
              </button>
              <button
                onClick={() => setVisible(false)}
                className="p-1 rounded hover:bg-white/10 transition-colors"
                title="Ascunde"
              >
                <X className="h-3 w-3 text-white/40" />
              </button>
            </div>
          </div>

          {/* Shortcut editor */}
          {editingShortcut && (
            <div className="px-3 py-2 border-b border-white/10 bg-white/5" data-no-drag>
              <p className="text-[10px] text-white/50 mb-1">Apasă combinația de taste dorită:</p>
              <input
                className="w-full bg-white/10 rounded px-2 py-1 text-xs text-white font-mono outline-none border border-white/20 focus:border-[#FFCB09]"
                value={newShortcut || shortcut}
                onKeyDown={captureShortcut}
                onChange={() => {}}
                placeholder="ex: Alt+T"
                readOnly
              />
              <div className="flex gap-1 mt-1.5">
                <button
                  onClick={saveShortcut}
                  className="flex-1 text-[10px] bg-[#FFCB09] text-black rounded py-1 font-semibold hover:bg-[#e6b800]"
                >
                  Salvează
                </button>
                <button
                  onClick={() => { setEditingShortcut(false); setNewShortcut(""); }}
                  className="flex-1 text-[10px] bg-white/10 text-white rounded py-1 hover:bg-white/20"
                >
                  Anulează
                </button>
              </div>
            </div>
          )}

          {/* Timer display */}
          <div className="px-3 py-3" data-no-drag>
            {isRunning ? (
              <div className="space-y-2">
                <div className="text-center">
                  <div className="text-2xl font-mono font-bold text-green-400 tabular-nums">
                    {formatElapsed(elapsed)}
                  </div>
                  <div className="text-[10px] text-white/50 mt-0.5">
                    {runningTimer?.activityType ?? "activitate"}{" "}
                    {runningTimer?.taskName ? `· ${runningTimer.taskName}` : ""}
                  </div>
                </div>
                <Button
                  className="w-full bg-red-600 hover:bg-red-700 text-white h-8 text-xs gap-1.5"
                  onClick={handleStop}
                  disabled={stopMutation.isPending}
                >
                  <Square className="h-3 w-3 fill-current" />
                  {stopMutation.isPending ? "Se oprește..." : "Oprește timer"}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {!expanded ? (
                  <button
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#FFCB09] text-black hover:bg-[#e6b800] transition-colors text-sm font-semibold"
                    onClick={() => setExpanded(true)}
                  >
                    <div className="flex items-center gap-2">
                      <Play className="h-3.5 w-3.5 fill-current" />
                      Pornește timer
                    </div>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <div className="space-y-2">
                    {/* Activity type */}
                    <select
                      value={activityType}
                      onChange={e => setActivityType(e.target.value as ActivityType)}
                      className="w-full h-8 rounded-md bg-white/10 border border-white/20 px-2 text-xs text-white focus:border-[#FFCB09] outline-none"
                    >
                      {ACTIVITY_TYPES.map(t => (
                        <option key={t} value={t} className="bg-[#221F1F]">{t}</option>
                      ))}
                    </select>

                    {/* Project */}
                    <select
                      value={projectId}
                      onChange={e => setProjectId(e.target.value)}
                      className="w-full h-8 rounded-md bg-white/10 border border-white/20 px-2 text-xs text-white focus:border-[#FFCB09] outline-none"
                    >
                      <option value="none" className="bg-[#221F1F]">Fără proiect</option>
                      {projects.map((p: any) => (
                        <option key={p.id} value={String(p.id)} className="bg-[#221F1F]">
                          {p.abbreviation ? `${p.abbreviation} — ` : ""}{p.name}
                        </option>
                      ))}
                    </select>

                    {/* Task name */}
                    <input
                      value={taskName}
                      onChange={e => setTaskName(e.target.value)}
                      placeholder="Titlu activitate (opțional)"
                      className="w-full h-8 rounded-md bg-white/10 border border-white/20 px-2 text-xs text-white placeholder:text-white/30 focus:border-[#FFCB09] outline-none"
                      onKeyDown={e => e.key === "Enter" && handleStart()}
                    />

                    <div className="flex gap-1.5">
                      <Button
                        className="flex-1 bg-[#FFCB09] text-black hover:bg-[#e6b800] h-8 text-xs gap-1"
                        onClick={handleStart}
                        disabled={startMutation.isPending}
                      >
                        <Play className="h-3 w-3 fill-current" />
                        {startMutation.isPending ? "..." : "Start"}
                      </Button>
                      <Button
                        variant="ghost"
                        className="h-8 px-2 text-white/50 hover:text-white hover:bg-white/10 text-xs"
                        onClick={() => setExpanded(false)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div className="px-3 pb-2 text-[9px] text-white/25 text-center">
            {shortcut} pentru a afișa/ascunde
          </div>
        </div>
      )}
    </>
  );
}
