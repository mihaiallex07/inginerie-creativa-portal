import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ColorPalette, PALETTE_COLORS } from "@/components/ColorPalette";
import { toast } from "sonner";
import { useState, useMemo, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import {
  ChevronDown, ChevronRight, Plus, Trash2, Edit2, MoreVertical,
  TrendingUp, Settings, Check, X,
  Play, Pause, Square, UserPlus, Timer
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

const STATUS_COLORS: Record<string, string> = {
  activ: "bg-green-100 text-green-800",
  suspendat: "bg-amber-100 text-amber-800",
  finalizat: "bg-gray-100 text-gray-700",
  intern: "bg-blue-100 text-blue-800",
};
const STATUS_LABELS: Record<string, string> = {
  activ: "Activ", suspendat: "Suspendat", finalizat: "Finalizat", intern: "Intern",
};

function fmtHours(minutes: number) {
  if (!minutes) return "0h";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
function fmtBudget(budgetHours: string | number | null) {
  if (!budgetHours) return "0h";
  const h = parseFloat(String(budgetHours));
  return isNaN(h) ? "0h" : `${h}h`;
}
function progressColor(pct: number) {
  if (pct >= 90) return "bg-red-500";
  if (pct >= 75) return "bg-amber-500";
  if (pct >= 50) return "bg-yellow-400";
  return "bg-green-500";
}
function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function AvatarStack({ users, max = 3 }: { users: { name: string; avatarUrl?: string | null }[]; max?: number }) {
  const visible = users.slice(0, max);
  const extra = users.length - max;
  return (
    <div className="flex items-center -space-x-2">
      {visible.map((u, i) => (
        <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-[#FFCB09] flex items-center justify-center text-[10px] font-bold text-[#221F1F] overflow-hidden" title={u.name}>
          {u.avatarUrl ? <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" /> : getInitials(u.name)}
        </div>
      ))}
      {extra > 0 && (
        <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">+{extra}</div>
      )}
    </div>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${progressColor(clamped)}`} style={{ width: `${clamped}%` }} />
      </div>
      <span className="text-xs font-medium w-10 text-right">{Math.round(clamped)}%</span>
    </div>
  );
}

function TaskRow({
  task, idx, canManage, allUsers, projectId, onRefresh, activeSessionTaskId
}: {
  task: any; idx: number; canManage: boolean; allUsers: any[];
  projectId: number; onRefresh: () => void; activeSessionTaskId?: number;
}) {
  const utils = trpc.useUtils();
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(task.name);
  const [showAssign, setShowAssign] = useState(false);
  const budgetMin = parseFloat(task.budgetHours || "0") * 60;
  const workedMin = task.minutesWorked || 0;
  const remainMin = Math.max(0, budgetMin - workedMin);
  const pct = budgetMin > 0 ? (workedMin / budgetMin) * 100 : 0;
  const isActive = activeSessionTaskId === task.id;

  const updateTask = trpc.projects.updateTask.useMutation({
    onSuccess: () => { utils.projects.get.invalidate({ id: projectId }); onRefresh(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteTask = trpc.projects.deleteTask.useMutation({
    onSuccess: () => { utils.projects.get.invalidate({ id: projectId }); onRefresh(); toast.success("Sarcină ștearsă"); },
    onError: (e) => toast.error(e.message),
  });
  const startSession = trpc.projects.startSession.useMutation({
    onSuccess: () => { utils.projects.activeSession.invalidate(); utils.projects.get.invalidate({ id: projectId }); toast.success("Sesiune pornită"); },
    onError: (e) => toast.error(e.message),
  });
  const pauseSession = trpc.projects.pauseSession.useMutation({
    onSuccess: () => { utils.projects.activeSession.invalidate(); toast.success("Sesiune pauzată"); },
    onError: (e) => toast.error(e.message),
  });
  const stopSession = trpc.projects.stopSession.useMutation({
    onSuccess: () => { utils.projects.activeSession.invalidate(); utils.projects.get.invalidate({ id: projectId }); toast.success("Sesiune oprită"); },
    onError: (e) => toast.error(e.message),
  });

  const assignedUser = (allUsers as any[]).find((u: any) => u.id === task.assignedUserId);

  return (
    <tr className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${isActive ? "bg-yellow-50" : ""}`}>
      <td className="py-2 pl-10 pr-2 text-sm text-gray-400 w-8">{idx + 1}</td>
      <td className="py-2 pr-4 text-sm">
        {editingName && canManage ? (
          <div className="flex items-center gap-1">
            <Input value={nameVal} onChange={e => setNameVal(e.target.value)} className="h-7 text-sm py-0" autoFocus
              onKeyDown={e => {
                if (e.key === "Enter") { updateTask.mutate({ id: task.id, name: nameVal }); setEditingName(false); }
                if (e.key === "Escape") { setNameVal(task.name); setEditingName(false); }
              }} />
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { updateTask.mutate({ id: task.id, name: nameVal }); setEditingName(false); }}><Check className="h-3 w-3" /></Button>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setNameVal(task.name); setEditingName(false); }}><X className="h-3 w-3" /></Button>
          </div>
        ) : (
          <span className="cursor-pointer hover:text-[#FFCB09] transition-colors" onDoubleClick={() => canManage && setEditingName(true)}>
            {task.name}
            {isActive && <span className="ml-2 text-xs text-green-600 font-medium animate-pulse">● activ</span>}
          </span>
        )}
      </td>
      <td className="py-2 pr-4 text-sm text-center">
        {canManage ? (
          <Input type="number" min="0" step="0.5"
            defaultValue={parseFloat(task.budgetHours || "0")}
            onBlur={e => updateTask.mutate({ id: task.id, budgetHours: e.target.value })}
            className="h-7 w-16 text-center text-sm py-0 mx-auto" />
        ) : <span>{fmtBudget(task.budgetHours)}</span>}
      </td>
      <td className="py-2 pr-4 text-sm text-center text-blue-600 font-medium">{fmtHours(workedMin)}</td>
      <td className="py-2 pr-4 text-sm text-center text-gray-500">{fmtHours(remainMin)}</td>
      <td className="py-2 pr-4 min-w-[120px]"><ProgressBar pct={pct} /></td>
      <td className="py-2 pr-4">
        <div className="flex items-center gap-1">
          {assignedUser ? (
            <div className="flex items-center gap-1 cursor-pointer" onClick={() => canManage && setShowAssign(true)}>
              <div className="w-6 h-6 rounded-full bg-[#FFCB09] flex items-center justify-center text-[9px] font-bold text-[#221F1F]" title={assignedUser.name}>
                {getInitials(assignedUser.name)}
              </div>
              {canManage && <span className="text-xs text-gray-400">↓</span>}
            </div>
          ) : canManage && (
            <button onClick={() => setShowAssign(true)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#FFCB09] transition-colors">
              <UserPlus className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Dialog open={showAssign} onOpenChange={setShowAssign}>
          <DialogContent className="max-w-xs">
            <DialogHeader><DialogTitle>Alocă responsabil</DialogTitle></DialogHeader>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              <button className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 text-gray-500"
                onClick={() => { updateTask.mutate({ id: task.id, assignedUserId: null }); setShowAssign(false); }}>
                — Fără responsabil
              </button>
              {(allUsers as any[]).map((u: any) => (
                <button key={u.id} className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-yellow-50 flex items-center gap-2 ${task.assignedUserId === u.id ? "bg-yellow-50 font-medium" : ""}`}
                  onClick={() => { updateTask.mutate({ id: task.id, assignedUserId: u.id }); setShowAssign(false); }}>
                  <div className="w-6 h-6 rounded-full bg-[#FFCB09] flex items-center justify-center text-[9px] font-bold text-[#221F1F]">{getInitials(u.name)}</div>
                  <div>
                    <div>{u.name}</div>
                    <div className="text-xs text-gray-400">{u.department}</div>
                  </div>
                  {task.assignedUserId === u.id && <Check className="h-3.5 w-3.5 ml-auto text-green-600" />}
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </td>
      <td className="py-2 pr-2">
        <div className="flex items-center gap-1">
          {!isActive ? (
            <Button size="icon" variant="ghost" className="h-6 w-6 text-green-600 hover:bg-green-50" title="Start"
              onClick={() => startSession.mutate({ taskId: task.id })}>
              <Play className="h-3 w-3" />
            </Button>
          ) : (
            <>
              <Button size="icon" variant="ghost" className="h-6 w-6 text-amber-600 hover:bg-amber-50" title="Pauză"
                onClick={() => pauseSession.mutate({})}>
                <Pause className="h-3 w-3" />
              </Button>
              <Button size="icon" variant="ghost" className="h-6 w-6 text-red-600 hover:bg-red-50" title="Stop"
                onClick={() => stopSession.mutate({})}>
                <Square className="h-3 w-3" />
              </Button>
            </>
          )}
          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-6 w-6"><MoreVertical className="h-3 w-3" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditingName(true)}><Edit2 className="h-3.5 w-3.5 mr-2" />Redenumește</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600" onClick={() => deleteTask.mutate({ id: task.id })}>
                  <Trash2 className="h-3.5 w-3.5 mr-2" />Șterge
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </td>
    </tr>
  );
}

function PhaseRow({
  phase, canManage, allUsers, projectId, onRefresh, activeSessionTaskId
}: {
  phase: any; canManage: boolean; allUsers: any[];
  projectId: number; onRefresh: () => void; activeSessionTaskId?: number;
}) {
  const utils = trpc.useUtils();
  const [expanded, setExpanded] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(phase.name);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");

  const budgetMin = parseFloat(phase.budgetHours || "0") * 60;
  const workedMin = (phase.tasks || []).reduce((s: number, t: any) => s + (t.minutesWorked || 0), 0);
  const remainMin = Math.max(0, budgetMin - workedMin);
  const pct = budgetMin > 0 ? (workedMin / budgetMin) * 100 : 0;
  const assignedUsers = (phase.tasks || [])
    .filter((t: any) => t.assignedUserId)
    .reduce((acc: any[], t: any) => {
      if (!acc.find((u: any) => u.id === t.assignedUserId)) {
        const u = (allUsers as any[]).find((u: any) => u.id === t.assignedUserId);
        if (u) acc.push(u);
      }
      return acc;
    }, []);

  const updatePhase = trpc.projects.updatePhase.useMutation({
    onSuccess: () => { utils.projects.get.invalidate({ id: projectId }); onRefresh(); },
    onError: (e) => toast.error(e.message),
  });
  const deletePhase = trpc.projects.deletePhase.useMutation({
    onSuccess: () => { utils.projects.get.invalidate({ id: projectId }); onRefresh(); toast.success("Fază ștearsă"); },
    onError: (e) => toast.error(e.message),
  });
  const addTask = trpc.projects.addTask.useMutation({
    onSuccess: () => { utils.projects.get.invalidate({ id: projectId }); onRefresh(); setShowAddTask(false); setNewTaskName(""); toast.success("Sarcină adăugată"); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <>
      <tr className="border-b border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors">
        <td className="py-2.5 pl-2 pr-2 w-8">
          <button onClick={() => setExpanded(e => !e)} className="flex items-center justify-center w-5 h-5 rounded hover:bg-gray-200">
            {expanded ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}
          </button>
        </td>
        <td className="py-2.5 pr-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: phase.color || "#FFCB09" }} />
            {editingName && canManage ? (
              <div className="flex items-center gap-1">
                <Input value={nameVal} onChange={e => setNameVal(e.target.value)} className="h-7 text-sm font-semibold py-0" autoFocus
                  onKeyDown={e => {
                    if (e.key === "Enter") { updatePhase.mutate({ id: phase.id, name: nameVal }); setEditingName(false); }
                    if (e.key === "Escape") { setNameVal(phase.name); setEditingName(false); }
                  }} />
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { updatePhase.mutate({ id: phase.id, name: nameVal }); setEditingName(false); }}><Check className="h-3 w-3" /></Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setNameVal(phase.name); setEditingName(false); }}><X className="h-3 w-3" /></Button>
              </div>
            ) : (
              <span className="font-semibold text-sm cursor-pointer" onDoubleClick={() => canManage && setEditingName(true)}>
                {phase.code && <span className="text-gray-400 mr-1">{phase.code}.</span>}
                {phase.name}
              </span>
            )}
            <span className="text-xs text-gray-400">• {(phase.tasks || []).length} sarcini</span>
          </div>
        </td>
        <td className="py-2.5 pr-4 text-sm text-center font-medium">
          {canManage ? (
            <Input type="number" min="0" step="1"
              defaultValue={parseFloat(phase.budgetHours || "0")}
              onBlur={e => updatePhase.mutate({ id: phase.id, budgetHours: e.target.value })}
              className="h-7 w-16 text-center text-sm py-0 mx-auto font-medium" />
          ) : fmtBudget(phase.budgetHours)}
        </td>
        <td className="py-2.5 pr-4 text-sm text-center text-blue-600 font-medium">{fmtHours(workedMin)}</td>
        <td className="py-2.5 pr-4 text-sm text-center text-gray-500">{fmtHours(remainMin)}</td>
        <td className="py-2.5 pr-4 min-w-[120px]"><ProgressBar pct={pct} /></td>
        <td className="py-2.5 pr-4">{assignedUsers.length > 0 && <AvatarStack users={assignedUsers} />}</td>
        <td className="py-2.5 pr-2">
          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-7 w-7"><MoreVertical className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowAddTask(true)}><Plus className="h-3.5 w-3.5 mr-2" />Adaugă sarcină</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditingName(true)}><Edit2 className="h-3.5 w-3.5 mr-2" />Redenumește faza</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600" onClick={() => deletePhase.mutate({ id: phase.id })}>
                  <Trash2 className="h-3.5 w-3.5 mr-2" />Șterge faza
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </td>
      </tr>
      {expanded && (phase.tasks || []).map((task: any, idx: number) => (
        <TaskRow key={task.id} task={task} idx={idx} canManage={canManage}
          allUsers={allUsers} projectId={projectId}
          onRefresh={onRefresh} activeSessionTaskId={activeSessionTaskId} />
      ))}
      {expanded && canManage && (
        <tr className="border-b border-gray-100">
          <td colSpan={8} className="py-1 pl-10">
            {showAddTask ? (
              <div className="flex items-center gap-2 py-1">
                <Input value={newTaskName} onChange={e => setNewTaskName(e.target.value)} placeholder="Nume sarcină..."
                  className="h-7 text-sm max-w-xs" autoFocus
                  onKeyDown={e => {
                    if (e.key === "Enter" && newTaskName.trim()) addTask.mutate({ phaseId: phase.id, projectId, name: newTaskName.trim() });
                    if (e.key === "Escape") { setShowAddTask(false); setNewTaskName(""); }
                  }} />
                <Button size="sm" className="h-7 bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F]"
                  onClick={() => newTaskName.trim() && addTask.mutate({ phaseId: phase.id, projectId, name: newTaskName.trim() })}
                  disabled={addTask.isPending}>Adaugă</Button>
                <Button size="sm" variant="ghost" className="h-7" onClick={() => { setShowAddTask(false); setNewTaskName(""); }}>Anulează</Button>
              </div>
            ) : (
              <button onClick={() => setShowAddTask(true)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#FFCB09] py-1 transition-colors">
                <Plus className="h-3.5 w-3.5" /> Adaugă sarcină
              </button>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

export default function ProiectDetaliu() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id || "0");
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const canManage = user?.role === "admin" || user?.role === "coordonator";

  const { data: project, isLoading, refetch } = trpc.projects.get.useQuery({ id: projectId }, { enabled: !!projectId });
  const { data: allUsers = [] } = trpc.people.list.useQuery();
  const { data: activeSession } = trpc.projects.activeSession.useQuery();

  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!activeSession) { setElapsed(0); return; }
    const startMs = new Date((activeSession as any).startedAt).getTime();
    const update = () => setElapsed(Math.floor((Date.now() - startMs) / 1000));
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [activeSession]);

  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "", code: "", clientName: "", status: "activ" as any,
    color: "#FFCB09", startDate: "", endDate: "", description: ""
  });
  useEffect(() => {
    if (project) setEditForm({
      name: project.name || "",
      code: (project as any).code || "",
      clientName: (project as any).clientName || "",
      status: project.status || "activ",
      color: (project as any).color || "#FFCB09",
      startDate: (project as any).startDate ? String((project as any).startDate).slice(0, 10) : "",
      endDate: (project as any).endDate ? String((project as any).endDate).slice(0, 10) : "",
      description: (project as any).description || "",
    });
  }, [project]);

  const [showAddPhase, setShowAddPhase] = useState(false);
  const [phaseForm, setPhaseForm] = useState({ name: "", code: "", color: PALETTE_COLORS[0], budgetHours: "" });

  const [showAddMember, setShowAddMember] = useState(false);
  const [memberUserId, setMemberUserId] = useState<string>("");
  const [memberRole, setMemberRole] = useState("membru");

  const updateProject = trpc.projects.update.useMutation({
    onSuccess: () => { utils.projects.get.invalidate({ id: projectId }); setShowEdit(false); toast.success("Proiect actualizat"); },
    onError: (e) => toast.error(e.message),
  });
  const addPhase = trpc.projects.addPhase.useMutation({
    onSuccess: () => {
      utils.projects.get.invalidate({ id: projectId });
      setShowAddPhase(false);
      setPhaseForm({ name: "", code: "", color: PALETTE_COLORS[0], budgetHours: "" });
      toast.success("Fază adăugată");
    },
    onError: (e) => toast.error(e.message),
  });
  const addMember = trpc.projects.addMember.useMutation({
    onSuccess: () => { utils.projects.get.invalidate({ id: projectId }); setShowAddMember(false); toast.success("Membru adăugat"); },
    onError: (e) => toast.error(e.message),
  });
  const removeMember = trpc.projects.removeMember.useMutation({
    onSuccess: () => { utils.projects.get.invalidate({ id: projectId }); toast.success("Membru eliminat"); },
    onError: (e) => toast.error(e.message),
  });
  const pauseSession = trpc.projects.pauseSession.useMutation({
    onSuccess: () => utils.projects.activeSession.invalidate(),
  });
  const stopSession = trpc.projects.stopSession.useMutation({
    onSuccess: () => { utils.projects.activeSession.invalidate(); utils.projects.get.invalidate({ id: projectId }); },
  });

  const stats = useMemo(() => {
    if (!project) return { totalBudget: 0, totalWorked: 0, totalRemain: 0, pct: 0, activePhases: 0 };
    const phases = (project as any).phases || [];
    const totalBudget = phases.reduce((s: number, ph: any) => s + parseFloat(ph.budgetHours || "0"), 0);
    const totalWorked = phases.reduce((s: number, ph: any) =>
      s + (ph.tasks || []).reduce((ts: number, t: any) => ts + (t.minutesWorked || 0), 0), 0) / 60;
    const totalRemain = Math.max(0, totalBudget - totalWorked);
    const pct = totalBudget > 0 ? (totalWorked / totalBudget) * 100 : 0;
    const activePhases = phases.filter((ph: any) => ph.status !== "finalizata").length;
    return { totalBudget, totalWorked, totalRemain, pct, activePhases };
  }, [project]);

  const donutData = useMemo(() => {
    if (!project) return [];
    return ((project as any).phases || [])
      .filter((ph: any) => parseFloat(ph.budgetHours || "0") > 0)
      .map((ph: any) => ({ name: ph.name, value: parseFloat(ph.budgetHours || "0"), color: ph.color || "#FFCB09" }));
  }, [project]);

  const activeSessionTaskId = (activeSession as any)?.taskId;
  const members = (project as any)?.members || [];
  const phases = (project as any)?.phases || [];

  if (isLoading) return (
    <div className="p-8 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFCB09]" />
    </div>
  );
  if (!project) return (
    <div className="p-8 text-center">
      <p className="text-gray-500">Proiectul nu a fost găsit sau nu ai acces.</p>
      <Button variant="ghost" className="mt-4" onClick={() => setLocation("/proiecte")}>← Înapoi la proiecte</Button>
    </div>
  );

  const manager = (allUsers as any[]).find((u: any) => u.id === (project as any).managerId);
  const hh = String(Math.floor(elapsed / 3600)).padStart(2, "0");
  const mm2 = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="flex flex-col h-full">
      {/* Active session banner (fixed bottom-right) */}
      {activeSession && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#221F1F] text-white rounded-xl shadow-2xl px-5 py-3 flex items-center gap-4 border border-[#FFCB09]/30">
          <Timer className="h-5 w-5 text-[#FFCB09]" />
          <div>
            <p className="text-xs text-gray-400">Sesiune activă</p>
            <p className="font-mono text-lg font-bold text-[#FFCB09]">{hh}:{mm2}:{ss}</p>
            {(activeSession as any).taskName && (
              <p className="text-xs text-gray-300 truncate max-w-[180px]">{(activeSession as any).taskName}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="border-gray-600 text-white hover:bg-gray-700 h-8 px-3"
              onClick={() => pauseSession.mutate({})}>
              <Pause className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white h-8 px-3"
              onClick={() => stopSession.mutate({})}>
              <Square className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-6 pt-5 pb-3 border-b border-gray-200 bg-white">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg flex items-center justify-center text-2xl font-bold text-[#221F1F]"
              style={{ backgroundColor: (project as any).color || "#FFCB09" }}>
              {((project as any).code?.slice(0, 2) || project.name?.slice(0, 2) || "P").toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-[#221F1F]">{project.name}</h1>
                <Badge className={`text-xs ${STATUS_COLORS[project.status] || "bg-gray-100 text-gray-700"}`}>
                  ● {STATUS_LABELS[project.status] || project.status}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500 mt-1 flex-wrap">
                {manager && <span>Manager: <span className="font-medium text-gray-700">{manager.name}</span></span>}
                {(project as any).code && <span>• Cod: <span className="font-medium text-gray-700">{(project as any).code}</span></span>}
                {(project as any).clientName && <span>• Client: <span className="font-medium text-gray-700">{(project as any).clientName}</span></span>}
                {(project as any).startDate && (
                  <span>• Perioadă: <span className="font-medium text-gray-700">
                    {String((project as any).startDate).slice(0, 10)}
                    {(project as any).endDate ? ` – ${String((project as any).endDate).slice(0, 10)}` : ""}
                  </span></span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {canManage && (
              <>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowEdit(true)}>
                  <Settings className="h-4 w-4" />Setări proiect
                </Button>
                <Button size="sm" className="bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] gap-1.5" onClick={() => setShowAddPhase(true)}>
                  <Plus className="h-4 w-4" />Adaugă fază
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="phases" className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 border-b border-gray-200 bg-white">
          <TabsList className="bg-transparent p-0 h-auto gap-0">
            {[
              { value: "overview", label: "Prezentare generală" },
              { value: "phases", label: "Faze & Task-uri" },
              { value: "team", label: "Echipă" },
              { value: "reports", label: "Rapoarte" },
            ].map(tab => (
              <TabsTrigger key={tab.value} value={tab.value}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFCB09] data-[state=active]:text-[#221F1F] data-[state=active]:bg-transparent px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* ── Overview ─────────────────────────────────────────────────────── */}
        <TabsContent value="overview" className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: "Buget total", value: `${stats.totalBudget.toFixed(0)}h`, color: "text-gray-800" },
                  { label: "Lucrat total", value: `${stats.totalWorked.toFixed(1)}h`, color: "text-blue-600" },
                  { label: "Rămas total", value: `${stats.totalRemain.toFixed(1)}h`, color: "text-amber-600" },
                  { label: "Progres", value: `${stats.pct.toFixed(0)}%`, color: "text-green-600" },
                  { label: "Faze active", value: String(stats.activePhases), color: "text-gray-800" },
                  { label: "Membri", value: String(members.length), color: "text-gray-800" },
                ].map(s => (
                  <div key={s.label} className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                    <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
              {/* Overall progress */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">Progres general</span>
                  <span className="text-gray-500">{stats.totalWorked.toFixed(1)}h / {stats.totalBudget.toFixed(0)}h</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${progressColor(stats.pct)}`} style={{ width: `${Math.min(100, stats.pct)}%` }} />
                </div>
              </div>
              {/* Phases summary */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-sm mb-3">Faze de lucru</h3>
                <div className="space-y-2">
                  {phases.map((ph: any) => {
                    const phBudget = parseFloat(ph.budgetHours || "0");
                    const phWorked = (ph.tasks || []).reduce((s: number, t: any) => s + (t.minutesWorked || 0), 0) / 60;
                    const phPct = phBudget > 0 ? (phWorked / phBudget) * 100 : 0;
                    return (
                      <div key={ph.id} className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: ph.color || "#FFCB09" }} />
                        <span className="text-sm w-40 truncate">{ph.name}</span>
                        <div className="flex-1"><ProgressBar pct={phPct} /></div>
                        <span className="text-xs text-gray-400 w-20 text-right">{phWorked.toFixed(1)}h / {phBudget}h</span>
                      </div>
                    );
                  })}
                  {phases.length === 0 && <p className="text-sm text-gray-400">Nicio fază adăugată.</p>}
                </div>
              </div>
            </div>
            {/* Right column */}
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-sm mb-3">Buget vs. Lucrat</h3>
                {donutData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={donutData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                        {donutData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(v: any) => [`${v}h`, ""]} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="h-40 flex items-center justify-center text-sm text-gray-400">Nicio fază cu buget</div>}
                <div className="space-y-1.5 mt-2">
                  {donutData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: d.color }} />
                        <span className="text-gray-600 truncate max-w-[120px]">{d.name}</span>
                      </div>
                      <span className="font-medium">{d.value}h</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-sm mb-3">Echipă ({members.length})</h3>
                <div className="space-y-2">
                  {(members as any[]).slice(0, 5).map((m: any) => (
                    <div key={m.id} className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#FFCB09] flex items-center justify-center text-[10px] font-bold text-[#221F1F]">{getInitials(m.name)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">{m.name}</div>
                        <div className="text-xs text-gray-400">{m.projectRole}</div>
                      </div>
                    </div>
                  ))}
                  {members.length > 5 && <div className="text-xs text-gray-400">+{members.length - 5} alții</div>}
                  {members.length === 0 && <p className="text-xs text-gray-400">Niciun membru adăugat.</p>}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Phases & Tasks ────────────────────────────────────────────────── */}
        <TabsContent value="phases" className="flex-1 overflow-y-auto p-6">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-sm">Faze de lucru</h3>
              {canManage && (
                <Button size="sm" className="bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] gap-1.5 h-7 text-xs" onClick={() => setShowAddPhase(true)}>
                  <Plus className="h-3.5 w-3.5" />Adaugă fază
                </Button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="py-2 pl-2 pr-2 w-8" />
                    <th className="py-2 pr-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Fază / Sarcină</th>
                    <th className="py-2 pr-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide w-20">Buget (h)</th>
                    <th className="py-2 pr-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide w-20">Lucrat (h)</th>
                    <th className="py-2 pr-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide w-20">Rămas (h)</th>
                    <th className="py-2 pr-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[140px]">Progres</th>
                    <th className="py-2 pr-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Responsabil(i)</th>
                    <th className="py-2 pr-2 w-20" />
                  </tr>
                </thead>
                <tbody>
                  {phases.length === 0 ? (
                    <tr><td colSpan={8} className="py-12 text-center text-gray-400 text-sm">Nicio fază adăugată. Apasă „Adaugă fază" pentru a începe.</td></tr>
                  ) : (
                    phases.map((phase: any) => (
                      <PhaseRow key={phase.id} phase={phase} canManage={canManage}
                        allUsers={allUsers} projectId={projectId}
                        onRefresh={() => refetch()} activeSessionTaskId={activeSessionTaskId} />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ── Team ─────────────────────────────────────────────────────────── */}
        <TabsContent value="team" className="flex-1 overflow-y-auto p-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4 max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Echipă proiect ({members.length} membri)</h3>
              {canManage && (
                <Button size="sm" className="bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] gap-1.5 h-7 text-xs" onClick={() => setShowAddMember(true)}>
                  <UserPlus className="h-3.5 w-3.5" />Adaugă membru
                </Button>
              )}
            </div>
            <div className="divide-y divide-gray-100">
              {(members as any[]).map((m: any) => (
                <div key={m.id} className="flex items-center gap-3 py-3">
                  <div className="w-9 h-9 rounded-full bg-[#FFCB09] flex items-center justify-center text-sm font-bold text-[#221F1F]">{getInitials(m.name)}</div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{m.name}</div>
                    <div className="text-xs text-gray-400">{m.department} • {m.jobTitle}</div>
                  </div>
                  <Badge variant="outline" className="text-xs capitalize">{m.projectRole}</Badge>
                  {canManage && (
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => removeMember.mutate({ projectId, userId: m.userId })}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              {members.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">Niciun membru adăugat.</p>}
            </div>
          </div>
        </TabsContent>

        {/* ── Reports ──────────────────────────────────────────────────────── */}
        <TabsContent value="reports" className="flex-1 overflow-y-auto p-6">
          <div className="text-center py-16 text-gray-400">
            <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Rapoartele detaliate vor fi disponibile în curând.</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Edit project dialog ─────────────────────────────────────────────── */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Setări proiect</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Nume proiect *</Label>
              <Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Cod intern</Label><Input value={editForm.code} onChange={e => setEditForm(f => ({ ...f, code: e.target.value }))} className="mt-1" /></div>
              <div><Label className="text-xs">Client</Label><Input value={editForm.clientName} onChange={e => setEditForm(f => ({ ...f, clientName: e.target.value }))} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Data start</Label><Input type="date" value={editForm.startDate} onChange={e => setEditForm(f => ({ ...f, startDate: e.target.value }))} className="mt-1" /></div>
              <div><Label className="text-xs">Data sfârșit</Label><Input type="date" value={editForm.endDate} onChange={e => setEditForm(f => ({ ...f, endDate: e.target.value }))} className="mt-1" /></div>
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={editForm.status} onValueChange={v => setEditForm(f => ({ ...f, status: v as any }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="activ">Activ</SelectItem>
                  <SelectItem value="suspendat">Suspendat</SelectItem>
                  <SelectItem value="finalizat">Finalizat</SelectItem>
                  <SelectItem value="intern">Intern</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Descriere</Label>
              <Textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows={2} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Culoare</Label>
              <ColorPalette value={editForm.color} onChange={color => setEditForm(f => ({ ...f, color }))} className="mt-2" />
            </div>
            <Button className="w-full bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] font-semibold"
              onClick={() => updateProject.mutate({ id: projectId, ...editForm })}
              disabled={updateProject.isPending || !editForm.name}>
              Salvează modificările
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Add phase dialog ────────────────────────────────────────────────── */}
      <Dialog open={showAddPhase} onOpenChange={setShowAddPhase}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Adaugă fază</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Cod fază (ex: G)</Label>
              <Input value={phaseForm.code} onChange={e => setPhaseForm(f => ({ ...f, code: e.target.value }))} className="mt-1" placeholder="G" />
            </div>
            <div>
              <Label className="text-xs">Nume fază *</Label>
              <Input value={phaseForm.name} onChange={e => setPhaseForm(f => ({ ...f, name: e.target.value }))} className="mt-1" placeholder="ex: Proiectare Structură" />
            </div>
            <div>
              <Label className="text-xs">Buget ore</Label>
              <Input type="number" min="0" value={phaseForm.budgetHours} onChange={e => setPhaseForm(f => ({ ...f, budgetHours: e.target.value }))} className="mt-1" placeholder="0" />
            </div>
            <div>
              <Label className="text-xs">Culoare</Label>
              <ColorPalette value={phaseForm.color} onChange={color => setPhaseForm(f => ({ ...f, color }))} className="mt-2" />
            </div>
            <Button className="w-full bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] font-semibold"
              onClick={() => addPhase.mutate({
                projectId, name: phaseForm.name,
                code: phaseForm.code || undefined,
                color: phaseForm.color,
                budgetHours: phaseForm.budgetHours || "0"
              })}
              disabled={addPhase.isPending || !phaseForm.name}>
              Adaugă faza
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Add member dialog ───────────────────────────────────────────────── */}
      <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Adaugă membru în echipă</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Angajat</Label>
              <Select value={memberUserId} onValueChange={setMemberUserId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selectează angajat..." /></SelectTrigger>
                <SelectContent>
                  {(allUsers as any[])
                    .filter((u: any) => !(members as any[]).find((m: any) => m.userId === u.id))
                    .map((u: any) => (
                      <SelectItem key={u.id} value={String(u.id)}>{u.name} — {u.department}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Rol în proiect</Label>
              <Select value={memberRole} onValueChange={setMemberRole}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="coordonator">Coordonator</SelectItem>
                  <SelectItem value="membru">Membru</SelectItem>
                  <SelectItem value="consultant">Consultant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] font-semibold"
              onClick={() => memberUserId && addMember.mutate({ projectId, userId: parseInt(memberUserId), projectRole: memberRole })}
              disabled={addMember.isPending || !memberUserId}>
              Adaugă în echipă
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
