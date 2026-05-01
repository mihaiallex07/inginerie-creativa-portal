import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import {
  ArrowLeft, FolderOpen, ExternalLink, Users, UserPlus, Crown,
  UserMinus, Clock, Plus, Pencil, Trash2, CalendarDays, Settings2,
  ChevronDown, ChevronRight, Play, Pause, Square, CheckCircle2,
  Circle, AlertCircle, Layers, Timer, Coins, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  activ: "bg-green-100 text-green-800 border-green-300",
  suspendat: "bg-amber-100 text-amber-800 border-amber-300",
  finalizat: "bg-gray-100 text-gray-700 border-gray-200",
  intern: "bg-blue-100 text-blue-800 border-blue-200",
};
const STATUS_LABELS: Record<string, string> = {
  activ: "Activ", suspendat: "Suspendat", finalizat: "Finalizat", intern: "Intern",
};
const PHASE_STATUS_COLORS: Record<string, string> = {
  activa: "bg-green-100 text-green-700",
  suspendata: "bg-amber-100 text-amber-700",
  finalizata: "bg-gray-100 text-gray-600",
};
const TASK_STATUS_COLORS: Record<string, string> = {
  neinceputa: "text-gray-400",
  "in_progres": "text-blue-500",
  in_verificare: "text-amber-500",
  finalizata: "text-green-500",
  blocata: "text-red-500",
};
const TASK_STATUS_LABELS: Record<string, string> = {
  neinceputa: "Neîncepută",
  "in_progres": "În progres",
  in_verificare: "În verificare",
  finalizata: "Finalizată",
  blocata: "Blocată",
};
const PROJECT_ROLE_LABELS: Record<string, string> = {
  coordonator: "Coordonator", membru: "Membru", consultant: "Consultant",
};
const PROJECT_ROLE_COLORS: Record<string, string> = {
  coordonator: "bg-yellow-100 text-yellow-800 border-yellow-300",
  membru: "bg-green-100 text-green-800 border-green-200",
  consultant: "bg-purple-100 text-purple-800 border-purple-200",
};

function getInitials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

function TaskStatusIcon({ status }: { status: string }) {
  const cls = TASK_STATUS_COLORS[status] || "text-gray-400";
  if (status === "finalizata") return <CheckCircle2 className={`h-4 w-4 ${cls}`} />;
  if (status === "in_progres") return <RefreshCw className={`h-4 w-4 ${cls}`} />;
  if (status === "blocata") return <AlertCircle className={`h-4 w-4 ${cls}`} />;
  if (status === "in_verificare") return <Clock className={`h-4 w-4 ${cls}`} />;
  return <Circle className={`h-4 w-4 ${cls}`} />;
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

// ─── Active Session Timer ──────────────────────────────────────────────────
function ActiveSessionBanner({ session, onPause, onStop }: {
  session: any;
  onPause: () => void;
  onStop: () => void;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!session || session.status !== "activa") return;
    const startMs = new Date(session.startedAt).getTime();
    const update = () => setElapsed(Math.floor((Date.now() - startMs) / 1000));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [session]);

  if (!session) return null;
  const totalSecs = elapsed + (session.accumulatedMinutes ?? 0) * 60;
  const hh = String(Math.floor(totalSecs / 3600)).padStart(2, "0");
  const mm = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, "0");
  const ss = String(totalSecs % 60).padStart(2, "0");

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-[#221F1F] text-white rounded-xl shadow-2xl px-5 py-3 flex items-center gap-4 border border-[#FFCB09]/30">
      <Timer className="h-5 w-5 text-[#FFCB09]" />
      <div>
        <p className="text-xs text-gray-400">Sesiune activă</p>
        <p className="font-mono text-lg font-bold text-[#FFCB09]">{hh}:{mm}:{ss}</p>
        {session.taskName && <p className="text-xs text-gray-300 truncate max-w-[180px]">{session.taskName}</p>}
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="border-gray-600 text-white hover:bg-gray-700 h-8 px-3" onClick={onPause}>
          <Pause className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white h-8 px-3" onClick={onStop}>
          <Square className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Phase Row ─────────────────────────────────────────────────────────────
function PhaseRow({
  phase, tasks, canManage, projectId, userId, activeSession,
  onAddTask, onEditPhase, onDeletePhase, onStartSession, onPauseSession, onStopSession,
  utils,
}: any) {
  const [expanded, setExpanded] = useState(true);
  const [editTaskOpen, setEditTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [taskForm, setTaskForm] = useState({ name: "", description: "", estimatedHours: "", status: "neinceputa", assignedUserId: "" });

  const updateTaskMutation = trpc.projects.updateTask.useMutation({
    onSuccess: () => {
      toast.success("Sarcină actualizată!");
      setEditTaskOpen(false);
      utils.projects.tasksByPhase.invalidate({ phaseId: phase.id });
    },
    onError: (e: any) => toast.error(e.message || "Eroare"),
  });

  const deleteTaskMutation = trpc.projects.deleteTask.useMutation({
    onSuccess: () => {
      toast.success("Sarcină ștearsă!");
      utils.projects.tasksByPhase.invalidate({ phaseId: phase.id });
    },
    onError: (e: any) => toast.error(e.message || "Eroare"),
  });

  function openEditTask(task: any) {
    setEditingTask(task);
    setTaskForm({
      name: task.name,
      description: task.description || "",
      estimatedHours: task.estimatedHours ? String(task.estimatedHours) : "",
      status: task.status,
      assignedUserId: task.assignedUserId ? String(task.assignedUserId) : "",
    });
    setEditTaskOpen(true);
  }

  const phaseTasks = tasks ?? [];
  const done = phaseTasks.filter((t: any) => t.status === "finalizata").length;
  const total = phaseTasks.length;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Phase header */}
      <div
        className="flex items-center gap-3 px-4 py-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
        {phase.color && <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: phase.color }} />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {phase.code && <span className="text-xs font-mono text-muted-foreground">{phase.code}</span>}
            <span className="text-sm font-semibold text-foreground">{phase.name}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${PHASE_STATUS_COLORS[phase.status] || "bg-gray-100 text-gray-600"}`}>
              {phase.status === "activa" ? "Activă" : phase.status === "suspendata" ? "Suspendată" : "Finalizată"}
            </span>
          </div>
          {total > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 max-w-[120px] bg-gray-200 rounded-full h-1.5">
                <div className="h-1.5 rounded-full bg-[#FFCB09] transition-all" style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }} />
              </div>
              <span className="text-[10px] text-muted-foreground">{done}/{total} sarcini</span>
            </div>
          )}
        </div>
        {phase.budgetHours && (
          <span className="text-xs text-muted-foreground shrink-0">{phase.budgetHours}h buget</span>
        )}
        {canManage && (
          <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAddTask(phase)}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEditPhase(phase)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => {
              if (confirm(`Ștergi faza "${phase.name}"? Toate sarcinile vor fi șterse.`)) onDeletePhase(phase.id);
            }}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Tasks */}
      {expanded && (
        <div className="divide-y divide-border/50">
          {phaseTasks.length === 0 ? (
            <div className="px-4 py-4 text-center text-sm text-muted-foreground">
              Nicio sarcină în această fază
              {canManage && <span className="ml-1">— apasă <strong>+</strong> pentru a adăuga</span>}
            </div>
          ) : (
            phaseTasks.map((task: any) => {
              const isActive = activeSession?.taskId === task.id && activeSession?.status === "activa";
              const isPaused = activeSession?.taskId === task.id && activeSession?.status === "pauza";
              return (
                <div key={task.id} className={`flex items-center gap-3 px-4 py-2.5 hover:bg-muted/20 transition-colors ${isActive ? "bg-yellow-50/50" : ""}`}>
                  <TaskStatusIcon status={task.status} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${task.status === "finalizata" ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {task.estimatedHours && (
                        <span className="text-[10px] text-muted-foreground">{task.estimatedHours}h estimate</span>
                      )}
                      {task.workedMinutes > 0 && (
                        <span className="text-[10px] text-blue-600">{formatDuration(task.workedMinutes)} lucrate</span>
                      )}
                      {task.assignedUserName && (
                        <span className="text-[10px] text-muted-foreground">{task.assignedUserName}</span>
                      )}
                    </div>
                  </div>
                  {/* Session controls */}
                  <div className="flex items-center gap-1 shrink-0">
                    {isActive ? (
                      <>
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs border-amber-300 text-amber-700" onClick={() => onPauseSession()}>
                          <Pause className="h-3 w-3 mr-1" /> Pauză
                        </Button>
                        <Button size="sm" className="h-7 px-2 text-xs bg-red-100 text-red-700 hover:bg-red-200" onClick={() => onStopSession()}>
                          <Square className="h-3 w-3 mr-1" /> Stop
                        </Button>
                      </>
                    ) : isPaused ? (
                      <>
                        <Button size="sm" className="h-7 px-2 text-xs bg-green-100 text-green-700 hover:bg-green-200" onClick={() => onStartSession(task.id)}>
                          <Play className="h-3 w-3 mr-1" /> Continuă
                        </Button>
                        <Button size="sm" className="h-7 px-2 text-xs bg-red-100 text-red-700 hover:bg-red-200" onClick={() => onPauseSession()}>
                          <Square className="h-3 w-3 mr-1" /> Stop
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-green-700 hover:bg-green-50"
                        disabled={!!activeSession && activeSession.status === "activa"}
                        onClick={() => onStartSession(task.id)}
                      >
                        <Play className="h-3 w-3 mr-1" /> Start
                      </Button>
                    )}
                    {canManage && (
                      <>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditTask(task)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => { if (confirm(`Ștergi sarcina "${task.name}"?`)) deleteTaskMutation.mutate({ id: task.id }); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Edit Task Dialog */}
      <Dialog open={editTaskOpen} onOpenChange={setEditTaskOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Editează sarcina</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label className="text-xs">Nume sarcină *</Label>
              <Input value={taskForm.name} onChange={e => setTaskForm(f => ({ ...f, name: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Descriere</Label>
              <Textarea value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} rows={2} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Ore estimate</Label>
                <Input type="number" value={taskForm.estimatedHours} onChange={e => setTaskForm(f => ({ ...f, estimatedHours: e.target.value }))} className="mt-1" min="0.5" step="0.5" />
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={taskForm.status} onValueChange={v => setTaskForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TASK_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setEditTaskOpen(false)}>Anulează</Button>
              <Button
                className="flex-1 bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] font-semibold"
                disabled={updateTaskMutation.isPending || !taskForm.name}
                onClick={() => editingTask && updateTaskMutation.mutate({
                  id: editingTask.id,
                  name: taskForm.name,
                  description: taskForm.description || undefined,
                  budgetHours: taskForm.estimatedHours || undefined,
                  status: taskForm.status as any,
                })}
              >
                {updateTaskMutation.isPending ? "Se salvează..." : "Salvează"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function ProiectDetaliu() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const projectId = Number(params.id);

  const [activeTab, setActiveTab] = useState<"faze" | "echipa" | "banca-ore">("faze");

  // Add Phase dialog
  const [addPhaseOpen, setAddPhaseOpen] = useState(false);
  const [editPhaseOpen, setEditPhaseOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<any>(null);
  const [phaseForm, setPhaseForm] = useState({ name: "", code: "", budgetHours: "", color: "#FFCB09" });

  // Add Task dialog
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [addTaskPhase, setAddTaskPhase] = useState<any>(null);
  const [taskForm, setTaskForm] = useState({ name: "", description: "", estimatedHours: "" });

  // Add Member dialog
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState("membru");

  // Edit project
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "", code: "", clientName: "", status: "activ",
    description: "", driveId: "", color: "#FFCB09", startDate: "", endDate: "",
  });

  // Delete project
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

  // Hour bank request
  const [hourRequestOpen, setHourRequestOpen] = useState(false);
  const [hourRequestForm, setHourRequestForm] = useState({ phaseId: "", requestedHours: "", justification: "" });

  // ─── Queries ──────────────────────────────────────────────────────────────
  const { data: project, isLoading } = trpc.projects.get.useQuery({ id: projectId });
  const { data: phases } = trpc.projects.phases.useQuery({ projectId });
  const { data: members } = trpc.projects.members.useQuery({ projectId });
  const { data: activeSession } = trpc.projects.activeSession.useQuery();
  const { data: hourBank } = trpc.projects.myHourBank.useQuery(undefined);
  const { data: hourRequests } = trpc.projects.hourRequests.useQuery({ projectId }, {
    enabled: user?.role === "admin" || user?.role === "coordonator",
  });
  const { data: allUsers } = trpc.adminUsers.list.useQuery(undefined, {
    enabled: user?.role === "admin" || user?.role === "coordonator",
  });

  const canManage = user?.role === "admin" || user?.role === "coordonator";
  const isAdmin = user?.role === "admin";

  // ─── Mutations ────────────────────────────────────────────────────────────
  const updateProjectMutation = trpc.projects.update.useMutation({
    onSuccess: () => { toast.success("Proiect actualizat!"); setEditDialogOpen(false); utils.projects.get.invalidate({ id: projectId }); },
    onError: (e) => toast.error(e.message || "Eroare"),
  });

  const deleteProjectMutation = trpc.projects.delete.useMutation({
    onSuccess: () => { toast.success("Proiect șters!"); setLocation("/proiecte"); },
    onError: (e) => toast.error(e.message || "Eroare"),
  });

  const addPhaseMutation = trpc.projects.addPhase.useMutation({
    onSuccess: () => {
      toast.success("Fază adăugată!");
      setAddPhaseOpen(false);
      setPhaseForm({ name: "", code: "", budgetHours: "", color: "#FFCB09" });
      utils.projects.phases.invalidate({ projectId });
    },
    onError: (e) => toast.error(e.message || "Eroare"),
  });

  const updatePhaseMutation = trpc.projects.updatePhase.useMutation({
    onSuccess: () => {
      toast.success("Fază actualizată!");
      setEditPhaseOpen(false);
      utils.projects.phases.invalidate({ projectId });
    },
    onError: (e) => toast.error(e.message || "Eroare"),
  });

  const deletePhaseMutation = trpc.projects.deletePhase.useMutation({
    onSuccess: () => { toast.success("Fază ștearsă!"); utils.projects.phases.invalidate({ projectId }); },
    onError: (e) => toast.error(e.message || "Eroare"),
  });

  const addTaskMutation = trpc.projects.addTask.useMutation({
    onSuccess: () => {
      toast.success("Sarcină adăugată!");
      setAddTaskOpen(false);
      setTaskForm({ name: "", description: "", estimatedHours: "" });
      if (addTaskPhase) utils.projects.tasksByPhase.invalidate({ phaseId: addTaskPhase.id });
    },
    onError: (e) => toast.error(e.message || "Eroare"),
  });

  const addMemberMutation = trpc.projects.addMember.useMutation({
    onSuccess: () => {
      toast.success("Membru adăugat!");
      setAddMemberOpen(false);
      setSelectedUserId("");
      setSelectedRole("membru");
      utils.projects.members.invalidate({ projectId });
    },
    onError: (e) => toast.error(e.message || "Eroare"),
  });

  const removeMemberMutation = trpc.projects.removeMember.useMutation({
    onSuccess: () => { toast.success("Membru eliminat!"); utils.projects.members.invalidate({ projectId }); },
    onError: (e) => toast.error(e.message || "Eroare"),
  });

  const updateRoleMutation = trpc.projects.updateMemberRole.useMutation({
    onSuccess: () => { toast.success("Rol actualizat!"); utils.projects.members.invalidate({ projectId }); },
    onError: (e) => toast.error(e.message || "Eroare"),
  });

  const startSessionMutation = trpc.projects.startSession.useMutation({
    onSuccess: () => { toast.success("Sesiune pornită!"); utils.projects.activeSession.invalidate(); },
    onError: (e) => toast.error(e.message || "Eroare"),
  });

  const pauseSessionMutation = trpc.projects.pauseSession.useMutation({
    onSuccess: () => { toast.success("Sesiune pusă pe pauză"); utils.projects.activeSession.invalidate(); },
    onError: (e) => toast.error(e.message || "Eroare"),
  });

  const stopSessionMutation = trpc.projects.stopSession.useMutation({
    onSuccess: () => {
      toast.success("Sesiune finalizată!");
      utils.projects.activeSession.invalidate();
      utils.projects.myHourBank.invalidate();
    },
    onError: (e) => toast.error(e.message || "Eroare"),
  });

  const requestHoursMutation = trpc.projects.requestMoreHours.useMutation({
    onSuccess: () => {
      toast.success("Cerere trimisă!");
      setHourRequestOpen(false);
      setHourRequestForm({ phaseId: "", requestedHours: "", justification: "" });
      utils.projects.myHourBank.invalidate();
    },
    onError: (e) => toast.error(e.message || "Eroare"),
  });

  const reviewHourRequestMutation = trpc.projects.reviewHourRequest.useMutation({
    onSuccess: () => {
      toast.success("Cerere procesată!");
      utils.projects.hourRequests.invalidate({ projectId });
      utils.projects.myHourBank.invalidate();
    },
    onError: (e) => toast.error(e.message || "Eroare"),
  });

  function openEditDialog() {
    if (!project) return;
    setEditForm({
      name: project.name || "",
      code: project.code || "",
      clientName: project.clientName || "",
      status: project.status || "activ",
      description: project.description || "",
      driveId: project.driveId || "",
      color: project.color || "#FFCB09",
      startDate: project.startDate ? new Date(project.startDate).toISOString().split("T")[0] : "",
      endDate: project.endDate ? new Date(project.endDate).toISOString().split("T")[0] : "",
    });
    setEditDialogOpen(true);
  }

  function openEditPhase(phase: any) {
    setEditingPhase(phase);
    setPhaseForm({
      name: phase.name,
      code: phase.code || "",
      budgetHours: phase.budgetHours ? String(phase.budgetHours) : "",
      color: phase.color || "#FFCB09",
    });
    setEditPhaseOpen(true);
  }

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-32 bg-muted rounded-lg animate-pulse" />
        <div className="h-64 bg-muted rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-5xl mx-auto text-center py-20">
        <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
        <p className="text-muted-foreground">Proiectul nu a fost găsit</p>
        <Button variant="outline" className="mt-4" onClick={() => setLocation("/proiecte")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Înapoi la proiecte
        </Button>
      </div>
    );
  }

  const membersList = (members ?? []) as any[];
  const existingUserIds = new Set(membersList.map((m: any) => m.userId));
  const availableUsers = (allUsers ?? []).filter((u: any) => u.isActive && !existingUserIds.has(u.id));
  const phasesList = (phases ?? []) as any[];

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-24">
      {/* Active session banner */}
      {activeSession && (
        <ActiveSessionBanner
          session={activeSession}
          onPause={() => pauseSessionMutation.mutate({ sessionId: activeSession.id })}
          onStop={() => stopSessionMutation.mutate({ sessionId: activeSession.id })}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setLocation("/proiecte")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: project.color ?? "#FFCB09" }}
        >
          <FolderOpen className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {project.code && <span className="text-xs font-mono text-muted-foreground">{project.code}</span>}
            <h1 className="text-lg font-bold text-foreground truncate">{project.name}</h1>
            <span className={`text-xs px-2 py-0.5 rounded border font-medium ${STATUS_COLORS[project.status] || ""}`}>
              {STATUS_LABELS[project.status] || project.status}
            </span>
          </div>
          {project.clientName && <p className="text-sm text-muted-foreground">{project.clientName}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {project.driveId && (
            <a href={`https://drive.google.com/drive/folders/${project.driveId}`} target="_blank" rel="noopener noreferrer"
              className="p-2 rounded hover:bg-muted transition-colors" title="Google Drive">
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
          )}
          {canManage && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={openEditDialog}>
              <Settings2 className="h-3.5 w-3.5" /> Editează
            </Button>
          )}
          {isAdmin && (
            <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Meta info */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
        {project.startDate && (
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>{new Date(project.startDate).toLocaleDateString("ro-RO")}</span>
            {project.endDate && <><span>→</span><span>{new Date(project.endDate).toLocaleDateString("ro-RO")}</span></>}
          </div>
        )}
        {project.description && <p className="text-sm text-muted-foreground">{project.description}</p>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {[
          { id: "faze", label: "Faze & Sarcini", icon: Layers },
          { id: "echipa", label: "Echipă", icon: Users },
          { id: "banca-ore", label: "Bancă de Ore", icon: Coins },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === id
                ? "border-[#FFCB09] text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ─── TAB: FAZE & SARCINI ─────────────────────────────────────────── */}
      {activeTab === "faze" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Faze proiect</h2>
            {canManage && (
              <Button size="sm" className="bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] font-semibold gap-1.5" onClick={() => setAddPhaseOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Adaugă fază
              </Button>
            )}
          </div>

          {phasesList.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
              <Layers className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Nicio fază definită</p>
              {canManage && <p className="text-xs mt-1">Adaugă prima fază pentru a organiza sarcinile</p>}
            </div>
          ) : (
            phasesList.map((phase: any) => (
              <PhaseTasksWrapper
                key={phase.id}
                phase={phase}
                canManage={canManage}
                projectId={projectId}
                userId={user?.id}
                activeSession={activeSession}
                onAddTask={(p: any) => { setAddTaskPhase(p); setAddTaskOpen(true); }}
                onEditPhase={openEditPhase}
                onDeletePhase={(id: number) => deletePhaseMutation.mutate({ id })}
                onStartSession={(taskId: number) => startSessionMutation.mutate({ taskId, projectId })}
                onPauseSession={() => activeSession && pauseSessionMutation.mutate({ sessionId: activeSession.id })}
                onStopSession={() => activeSession && stopSessionMutation.mutate({ sessionId: activeSession.id })}
                utils={utils}
              />
            ))
          )}
        </div>
      )}

      {/* ─── TAB: ECHIPĂ ─────────────────────────────────────────────────── */}
      {activeTab === "echipa" && (
        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-[#FFCB09]" /> Echipa proiectului
              </CardTitle>
              {canManage && (
                <Button size="sm" className="bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] font-semibold gap-1.5" onClick={() => setAddMemberOpen(true)}>
                  <UserPlus className="h-3.5 w-3.5" /> Adaugă
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {membersList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Niciun membru în echipă</p>
              </div>
            ) : (
              <div className="space-y-2">
                {membersList.map((m: any) => (
                  <div key={m.userId} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="text-xs bg-muted">{getInitials(m.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{m.name || m.email}</p>
                      {m.department && <p className="text-xs text-muted-foreground">{m.department}</p>}
                    </div>
                    {canManage ? (
                      <Select value={m.projectRole} onValueChange={v => updateRoleMutation.mutate({ projectId, userId: m.userId, projectRole: v as any })}>
                        <SelectTrigger className={`h-7 text-xs w-32 border ${PROJECT_ROLE_COLORS[m.projectRole] || ""}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="coordonator">Coordonator</SelectItem>
                          <SelectItem value="membru">Membru</SelectItem>
                          <SelectItem value="consultant">Consultant</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className={`text-xs px-2 py-0.5 rounded border ${PROJECT_ROLE_COLORS[m.projectRole] || ""}`}>
                        {PROJECT_ROLE_LABELS[m.projectRole] || m.projectRole}
                      </span>
                    )}
                    {m.projectRole === "coordonator" && <Crown className="h-3.5 w-3.5 text-[#FFCB09] shrink-0" />}
                    {canManage && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                        onClick={() => removeMemberMutation.mutate({ projectId, userId: m.userId })}>
                        <UserMinus className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── TAB: BANCĂ DE ORE ───────────────────────────────────────────── */}
      {activeTab === "banca-ore" && (
        <div className="space-y-4">
          {/* My hour bank */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Coins className="h-4 w-4 text-[#FFCB09]" /> Banca mea de ore
                </CardTitle>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setHourRequestOpen(true)}>
                  <Plus className="h-3.5 w-3.5" /> Solicită ore
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!hourBank || hourBank.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Coins className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Nu ai ore alocate în acest proiect</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(hourBank as any[]).map((entry: any) => {
                    const used = entry.usedMinutes / 60;
                    const total = entry.allocatedHours;
                    const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
                    return (
                      <div key={entry.id} className="p-3 rounded-lg border border-border">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-sm font-medium">{entry.phaseName || "General"}</p>
                            <p className="text-xs text-muted-foreground">{entry.category || "toate categoriile"}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">{used.toFixed(1)}h / {total}h</p>
                            <p className={`text-xs ${pct >= 90 ? "text-red-600" : "text-muted-foreground"}`}>{pct.toFixed(0)}% utilizat</p>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-[#FFCB09]"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hour requests (admin/coordonator) */}
          {canManage && hourRequests && (hourRequests as any[]).length > 0 && (
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#FFCB09]" /> Cereri ore în așteptare
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(hourRequests as any[]).filter((r: any) => r.status === "pending").map((req: any) => (
                    <div key={req.id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{req.requesterName || req.requesterEmail}</p>
                        <p className="text-xs text-muted-foreground">{req.phaseName || "General"} — {req.requestedHours}h solicitate</p>
                        {req.justification && <p className="text-xs text-muted-foreground mt-1 italic">"{req.justification}"</p>}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" className="h-7 bg-green-100 text-green-700 hover:bg-green-200 text-xs"
                          onClick={() => reviewHourRequestMutation.mutate({ id: req.id, status: "aprobata" })}>
                          Aprobă
                        </Button>
                        <Button size="sm" className="h-7 bg-red-100 text-red-700 hover:bg-red-200 text-xs"
                          onClick={() => reviewHourRequestMutation.mutate({ id: req.id, status: "respinsa" })}>
                          Respinge
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ─── DIALOGS ─────────────────────────────────────────────────────── */}

      {/* Add Phase */}
      <Dialog open={addPhaseOpen} onOpenChange={setAddPhaseOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Adaugă fază</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label className="text-xs">Nume fază *</Label>
              <Input value={phaseForm.name} onChange={e => setPhaseForm(f => ({ ...f, name: e.target.value }))} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Cod (opțional)</Label>
                <Input value={phaseForm.code} onChange={e => setPhaseForm(f => ({ ...f, code: e.target.value }))} className="mt-1" placeholder="ex: A" />
              </div>
              <div>
                <Label className="text-xs">Ore buget</Label>
                <Input type="number" value={phaseForm.budgetHours} onChange={e => setPhaseForm(f => ({ ...f, budgetHours: e.target.value }))} className="mt-1" min="0" step="0.5" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Label className="text-xs">Culoare</Label>
              <input type="color" value={phaseForm.color} onChange={e => setPhaseForm(f => ({ ...f, color: e.target.value }))} className="h-8 w-16 rounded cursor-pointer" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setAddPhaseOpen(false)}>Anulează</Button>
              <Button
                className="flex-1 bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] font-semibold"
                disabled={addPhaseMutation.isPending || !phaseForm.name}
                onClick={() => addPhaseMutation.mutate({
                  projectId,
                  name: phaseForm.name,
                  code: phaseForm.code || undefined,
                  budgetHours: phaseForm.budgetHours || undefined,
                  color: phaseForm.color || undefined,
                })}
              >
                {addPhaseMutation.isPending ? "Se adaugă..." : "Adaugă faza"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Phase */}
      <Dialog open={editPhaseOpen} onOpenChange={setEditPhaseOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Editează faza</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label className="text-xs">Nume fază *</Label>
              <Input value={phaseForm.name} onChange={e => setPhaseForm(f => ({ ...f, name: e.target.value }))} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Cod</Label>
                <Input value={phaseForm.code} onChange={e => setPhaseForm(f => ({ ...f, code: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Ore buget</Label>
                <Input type="number" value={phaseForm.budgetHours} onChange={e => setPhaseForm(f => ({ ...f, budgetHours: e.target.value }))} className="mt-1" min="0" step="0.5" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Label className="text-xs">Culoare</Label>
              <input type="color" value={phaseForm.color} onChange={e => setPhaseForm(f => ({ ...f, color: e.target.value }))} className="h-8 w-16 rounded cursor-pointer" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setEditPhaseOpen(false)}>Anulează</Button>
              <Button
                className="flex-1 bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] font-semibold"
                disabled={updatePhaseMutation.isPending || !phaseForm.name}
                onClick={() => editingPhase && updatePhaseMutation.mutate({
                  id: editingPhase.id,
                  name: phaseForm.name,
                  code: phaseForm.code || undefined,
                  budgetHours: phaseForm.budgetHours || undefined,
                  color: phaseForm.color || undefined,
                })}
              >
                {updatePhaseMutation.isPending ? "Se salvează..." : "Salvează"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Task */}
      <Dialog open={addTaskOpen} onOpenChange={setAddTaskOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adaugă sarcină{addTaskPhase ? ` — ${addTaskPhase.name}` : ""}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label className="text-xs">Nume sarcină *</Label>
              <Input value={taskForm.name} onChange={e => setTaskForm(f => ({ ...f, name: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Descriere (opțional)</Label>
              <Textarea value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} rows={2} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Ore estimate</Label>
              <Input type="number" value={taskForm.estimatedHours} onChange={e => setTaskForm(f => ({ ...f, estimatedHours: e.target.value }))} className="mt-1" min="0.5" step="0.5" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setAddTaskOpen(false)}>Anulează</Button>
              <Button
                className="flex-1 bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] font-semibold"
                disabled={addTaskMutation.isPending || !taskForm.name || !addTaskPhase}
                onClick={() => addTaskPhase && addTaskMutation.mutate({
                  phaseId: addTaskPhase.id,
                  projectId,
                  name: taskForm.name,
                  description: taskForm.description || undefined,
                  budgetHours: taskForm.estimatedHours || undefined,
                })}
              >
                {addTaskMutation.isPending ? "Se adaugă..." : "Adaugă sarcina"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Member */}
      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Adaugă membru în echipă</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Angajat</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selectează angajatul" /></SelectTrigger>
                <SelectContent>
                  {availableUsers.map((u: any) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.name || u.email}{u.department ? ` — ${u.department}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Rol în proiect</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="coordonator">Coordonator</SelectItem>
                  <SelectItem value="membru">Membru</SelectItem>
                  <SelectItem value="consultant">Consultant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setAddMemberOpen(false)}>Anulează</Button>
              <Button
                className="flex-1 bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] font-semibold"
                disabled={addMemberMutation.isPending || !selectedUserId}
                onClick={() => addMemberMutation.mutate({ projectId, userId: Number(selectedUserId), projectRole: selectedRole as any })}
              >
                {addMemberMutation.isPending ? "Se adaugă..." : "Adaugă"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Project */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-[#FFCB09]" /> Editare proiect
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Nume proiect *</Label>
                <Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Cod</Label>
                <Input value={editForm.code} onChange={e => setEditForm(f => ({ ...f, code: e.target.value }))} placeholder="ex: 222" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Client</Label>
                <Input value={editForm.clientName} onChange={e => setEditForm(f => ({ ...f, clientName: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={editForm.status} onValueChange={v => setEditForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activ">Activ</SelectItem>
                    <SelectItem value="suspendat">Suspendat</SelectItem>
                    <SelectItem value="finalizat">Finalizat</SelectItem>
                    <SelectItem value="intern">Intern</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Data start</Label>
                <Input type="date" value={editForm.startDate} onChange={e => setEditForm(f => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Data sfârșit</Label>
                <Input type="date" value={editForm.endDate} onChange={e => setEditForm(f => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Descriere</Label>
              <Textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Google Drive ID</Label>
                <Input value={editForm.driveId} onChange={e => setEditForm(f => ({ ...f, driveId: e.target.value }))} placeholder="ID folder Drive" />
              </div>
              <div>
                <Label className="text-xs">Culoare</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={editForm.color} onChange={e => setEditForm(f => ({ ...f, color: e.target.value }))} className="h-9 w-12 rounded border cursor-pointer" />
                  <span className="text-xs text-muted-foreground">{editForm.color}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Anulează</Button>
              <Button className="bg-[#FFCB09] text-black hover:bg-[#e6b800]"
                onClick={() => updateProjectMutation.mutate({ id: projectId, ...editForm, status: editForm.status as any, startDate: editForm.startDate || null, endDate: editForm.endDate || null })}
                disabled={updateProjectMutation.isPending || !editForm.name}>
                {updateProjectMutation.isPending ? "Se salvează..." : "Salvează"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Project */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" /> Ștergere proiect
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 font-medium">Această acțiune este ireversibilă!</p>
              <p className="text-xs text-red-600 mt-1">Se vor șterge: fazele, sarcinile, sesiunile, membrii echipei și banca de ore.</p>
            </div>
            <div>
              <Label className="text-xs">Tastați numele proiectului pentru confirmare: <strong>{project.name}</strong></Label>
              <Input value={deleteConfirmName} onChange={e => setDeleteConfirmName(e.target.value)} placeholder={project.name} className="mt-1 border-red-200" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Anulează</Button>
              <Button variant="destructive" onClick={() => deleteProjectMutation.mutate({ id: projectId, confirmName: deleteConfirmName })}
                disabled={deleteProjectMutation.isPending || deleteConfirmName !== project.name}>
                {deleteProjectMutation.isPending ? "Se șterge..." : "Șterge definitiv"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hour Request */}
      <Dialog open={hourRequestOpen} onOpenChange={setHourRequestOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Solicită ore suplimentare</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label className="text-xs">Faza (opțional)</Label>
              <Select value={hourRequestForm.phaseId} onValueChange={v => setHourRequestForm(f => ({ ...f, phaseId: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Toate fazele" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">General (toate fazele)</SelectItem>
                  {phasesList.map((p: any) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Ore solicitate *</Label>
              <Input type="number" value={hourRequestForm.requestedHours} onChange={e => setHourRequestForm(f => ({ ...f, requestedHours: e.target.value }))} className="mt-1" min="0.5" step="0.5" />
            </div>
            <div>
              <Label className="text-xs">Justificare</Label>
              <Textarea value={hourRequestForm.justification} onChange={e => setHourRequestForm(f => ({ ...f, justification: e.target.value }))} rows={2} className="mt-1" placeholder="Motivul solicitării..." />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setHourRequestOpen(false)}>Anulează</Button>
              <Button
                className="flex-1 bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] font-semibold"
                disabled={requestHoursMutation.isPending || !hourRequestForm.requestedHours}
                onClick={() => requestHoursMutation.mutate({
                  taskId: 0,
                  projectId,
                  requestedHours: hourRequestForm.requestedHours,
                  justification: hourRequestForm.justification || "Solicitare ore suplimentare",
                })}
              >
                {requestHoursMutation.isPending ? "Se trimite..." : "Trimite cererea"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Phase Tasks Wrapper (loads tasks per phase) ───────────────────────────
function PhaseTasksWrapper(props: any) {
  const { data: tasks } = trpc.projects.tasksByPhase.useQuery({ phaseId: props.phase.id });
  return <PhaseRow {...props} tasks={tasks} />;
}
