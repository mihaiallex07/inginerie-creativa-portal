import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  ArrowLeft,
  FolderOpen,
  ExternalLink,
  Users,
  UserPlus,
  Crown,
  UserMinus,
  Clock,
  Briefcase,
  Calculator,
  Plus,
  Pencil,
  Trash2,
  BarChart3,
  CalendarDays,
  Settings2,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  activ: "bg-green-100 text-green-800 border-green-300",
  suspendat: "bg-amber-100 text-amber-800 border-amber-300",
  finalizat: "bg-gray-100 text-gray-700 border-gray-200",
  intern: "bg-blue-100 text-blue-800 border-blue-200",
};

const STATUS_LABELS: Record<string, string> = {
  activ: "Activ",
  suspendat: "Suspendat",
  finalizat: "Finalizat",
  intern: "Intern",
};

const PROJECT_ROLE_LABELS: Record<string, string> = {
  coordonator: "Coordonator",
  membru: "Membru",
  consultant: "Consultant",
};

const PROJECT_ROLE_COLORS: Record<string, string> = {
  coordonator: "bg-yellow-100 text-yellow-800 border-yellow-300",
  membru: "bg-green-100 text-green-800 border-green-200",
  consultant: "bg-purple-100 text-purple-800 border-purple-200",
};

const CATEGORY_LABELS: Record<string, string> = {
  proiectare: "Proiectare",
  consultanta: "Consultanță",
  sedinta: "Ședință",
  documentare: "Documentare",
  deplasare: "Deplasare",
  administrativ: "Administrativ",
  verificare: "Verificare",
  executie: "Execuție",
};

function getInitials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

export default function ProiectDetaliu() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const projectId = Number(params.id);

  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("membru");
  const [allocatedHours, setAllocatedHours] = useState("");

  // Budget state
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [editingBudgetItem, setEditingBudgetItem] = useState<any>(null);
  const [budgetForm, setBudgetForm] = useState({
    category: "proiectare" as string,
    description: "",
    budgetedHours: "",
    assignedUserId: "" as string,
  });

  const { data: project, isLoading } = trpc.projects.getWithTeam.useQuery({ id: projectId });
  const { data: allUsers } = trpc.adminUsers.list.useQuery(undefined, {
    enabled: user?.role === "admin" || user?.role === "coordonator",
  });
  const { data: budgetData } = trpc.projects.budgetItems.useQuery({ projectId });

  const canManage = user?.role === "admin" || user?.role === "coordonator";
  const isAdmin = user?.role === "admin";

  // Edit project state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "", code: "", clientName: "", status: "activ",
    description: "", driveId: "", color: "#FFCB09",
    startDate: "", endDate: "",
  });

  // Delete project state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

  const editProjectMutation = trpc.projects.upsert.useMutation({
    onSuccess: () => {
      toast.success("Proiect actualizat!");
      setEditDialogOpen(false);
      utils.projects.getWithTeam.invalidate({ id: projectId });
    },
    onError: () => toast.error("Eroare la actualizare"),
  });

  const deleteProjectMutation = trpc.projects.delete.useMutation({
    onSuccess: () => {
      toast.success("Proiect șters!");
      setLocation("/proiecte");
    },
    onError: (err) => toast.error(err.message || "Eroare la ștergere"),
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

  function handleSaveEdit() {
    editProjectMutation.mutate({
      id: projectId,
      name: editForm.name,
      code: editForm.code || undefined,
      clientName: editForm.clientName || undefined,
      status: editForm.status as any,
      description: editForm.description || undefined,
      driveId: editForm.driveId || undefined,
      color: editForm.color || undefined,
      startDate: editForm.startDate || null,
      endDate: editForm.endDate || null,
    });
  }

  function handleDeleteProject() {
    if (!project) return;
    deleteProjectMutation.mutate({ id: projectId, confirmName: deleteConfirmName });
  }

  const addMemberMutation = trpc.projects.addMember.useMutation({
    onSuccess: () => {
      toast.success("Membru adăugat în echipă!");
      setAddMemberOpen(false);
      setSelectedUserId("");
      setSelectedRole("membru");
      setAllocatedHours("");
      utils.projects.getWithTeam.invalidate({ id: projectId });
    },
    onError: () => toast.error("Eroare la adăugare"),
  });

  const removeMemberMutation = trpc.projects.removeMember.useMutation({
    onSuccess: () => {
      toast.success("Membru eliminat din echipă");
      utils.projects.getWithTeam.invalidate({ id: projectId });
    },
    onError: () => toast.error("Eroare la eliminare"),
  });

  const updateRoleMutation = trpc.projects.updateMemberRole.useMutation({
    onSuccess: () => {
      toast.success("Rol actualizat!");
      utils.projects.getWithTeam.invalidate({ id: projectId });
    },
    onError: () => toast.error("Eroare la actualizare"),
  });

  const addBudgetMutation = trpc.projects.addBudgetItem.useMutation({
    onSuccess: () => {
      toast.success("Categorie buget adăugată!");
      setBudgetDialogOpen(false);
      resetBudgetForm();
      utils.projects.budgetItems.invalidate({ projectId });
    },
    onError: () => toast.error("Eroare la adăugare"),
  });

  const updateBudgetMutation = trpc.projects.updateBudgetItem.useMutation({
    onSuccess: () => {
      toast.success("Buget actualizat!");
      setBudgetDialogOpen(false);
      setEditingBudgetItem(null);
      resetBudgetForm();
      utils.projects.budgetItems.invalidate({ projectId });
    },
    onError: () => toast.error("Eroare la actualizare"),
  });

  const deleteBudgetMutation = trpc.projects.deleteBudgetItem.useMutation({
    onSuccess: () => {
      toast.success("Categorie buget ștearsă!");
      utils.projects.budgetItems.invalidate({ projectId });
    },
    onError: () => toast.error("Eroare la ștergere"),
  });

  function resetBudgetForm() {
    setBudgetForm({ category: "proiectare", description: "", budgetedHours: "", assignedUserId: "" });
  }

  function openEditBudget(item: any) {
    setEditingBudgetItem(item);
    setBudgetForm({
      category: item.category,
      description: item.description || "",
      budgetedHours: String(item.budgetedHours),
      assignedUserId: item.assignedUserId ? String(item.assignedUserId) : "",
    });
    setBudgetDialogOpen(true);
  }

  function handleSaveBudget() {
    if (!budgetForm.budgetedHours || Number(budgetForm.budgetedHours) <= 0) {
      return toast.error("Introduceți un număr valid de ore");
    }
    const payload = {
      projectId,
      category: budgetForm.category as any,
      description: budgetForm.description || undefined,
      budgetedHours: budgetForm.budgetedHours,
      assignedUserId: budgetForm.assignedUserId ? Number(budgetForm.assignedUserId) : null,
    };
    if (editingBudgetItem) {
      updateBudgetMutation.mutate({ id: editingBudgetItem.id, ...payload });
    } else {
      addBudgetMutation.mutate(payload);
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-32 bg-muted rounded-lg animate-pulse" />
        <div className="h-64 bg-muted rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
        <p className="text-muted-foreground">Proiectul nu a fost găsit</p>
        <Button variant="outline" className="mt-4" onClick={() => setLocation("/proiecte")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Înapoi la proiecte
        </Button>
      </div>
    );
  }

  const members = (project.members ?? []) as any[];
  const coordinator = members.find((m: any) => m.projectRole === "coordonator");
  const regularMembers = members.filter((m: any) => m.projectRole !== "coordonator");

  // Users not yet in the project
  const existingUserIds = new Set(members.map((m: any) => m.userId));
  const availableUsers = (allUsers ?? []).filter((u: any) => u.isActive && !existingUserIds.has(u.id));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/proiecte")} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: project.color ?? "#FFCB09" }}
            >
              <FolderOpen className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-bold text-foreground">{project.name}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${STATUS_COLORS[project.status]}`}>
              {STATUS_LABELS[project.status]}
            </span>
          </div>
          {project.code && <p className="text-xs text-muted-foreground mt-0.5 ml-10">Cod: {project.code}</p>}
        </div>
        <div className="flex items-center gap-2">
          {project.driveId && (
            <a
              href={`https://drive.google.com/drive/folders/${project.driveId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[#FFCB09] transition-colors"
            >
              <ExternalLink className="h-4 w-4" /> Google Drive
            </a>
          )}
          {canManage && (
            <Button variant="outline" size="sm" onClick={openEditDialog}>
              <Pencil className="h-3.5 w-3.5 mr-1" /> Editare
            </Button>
          )}
          {isAdmin && (
            <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => { setDeleteConfirmName(""); setDeleteDialogOpen(true); }}>
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Șterge
            </Button>
          )}
        </div>
      </div>

      {/* Project Info Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <Briefcase className="h-5 w-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Client</p>
              <p className="text-sm font-semibold truncate">{project.clientName || "Nespecificat"}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Echipă</p>
              <p className="text-sm font-semibold">{members.length} {members.length === 1 ? "membru" : "membri"}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
              <CalendarDays className="h-5 w-5 text-purple-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Perioadă</p>
              <p className="text-sm font-semibold truncate">
                {project.startDate && project.endDate
                  ? `${new Date(project.startDate).toLocaleDateString("ro-RO", { day: "2-digit", month: "short" })} – ${new Date(project.endDate).toLocaleDateString("ro-RO", { day: "2-digit", month: "short", year: "numeric" })}`
                  : project.startDate
                    ? `Din ${new Date(project.startDate).toLocaleDateString("ro-RO", { day: "2-digit", month: "short", year: "numeric" })}`
                    : "Nespecificat"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-yellow-50 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ore bugetate</p>
              <p className="text-sm font-semibold">
                {budgetData && budgetData.totalBudgeted > 0
                  ? <>{budgetData.totalBudgeted}h <span className="text-xs font-normal text-muted-foreground">({budgetData.totalWorked}h lucrate)</span></>
                  : project.estimatedHours ? `${project.estimatedHours}h` : "Nespecificat"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {project.description && (
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Descriere</p>
            <p className="text-sm text-foreground whitespace-pre-wrap">{project.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Team Section */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-[#FFCB09]" />
              Echipa proiectului
            </CardTitle>
            {canManage && (
              <Button
                size="sm"
                className="bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] font-semibold gap-1.5"
                onClick={() => setAddMemberOpen(true)}
              >
                <UserPlus className="h-3.5 w-3.5" />
                Adaugă membru
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Coordinator */}
          {coordinator && (
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                <Crown className="h-3 w-3 text-[#FFCB09]" />
                COORDONATOR PROIECT
              </p>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50/50 border border-yellow-200/50">
                <Avatar className="h-10 w-10 border-2 border-[#FFCB09]">
                  <AvatarFallback className="bg-[#FFCB09] text-[#221F1F] font-bold text-sm">
                    {getInitials(coordinator.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{coordinator.name}</p>
                  <p className="text-xs text-muted-foreground">{coordinator.email}</p>
                  {coordinator.jobTitle && (
                    <p className="text-xs text-muted-foreground">{coordinator.jobTitle} — {coordinator.department}</p>
                  )}
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${PROJECT_ROLE_COLORS.coordonator}`}>
                  Coordonator
                </span>
                {canManage && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                    onClick={() => removeMemberMutation.mutate({ projectId, userId: coordinator.userId })}
                    title="Elimină din echipă"
                  >
                    <UserMinus className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Regular Members */}
          {regularMembers.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">MEMBRI ECHIPĂ ({regularMembers.length})</p>
              <div className="space-y-1.5">
                {regularMembers.map((m: any) => (
                  <div key={m.userId} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-muted text-foreground font-semibold text-xs">
                        {getInitials(m.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.jobTitle || m.department || m.email}</p>
                    </div>
                    {canManage ? (
                      <Select
                        value={m.projectRole}
                        onValueChange={(v) => updateRoleMutation.mutate({ projectId, userId: m.userId, projectRole: v as any })}
                      >
                        <SelectTrigger className="w-32 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="coordonator">Coordonator</SelectItem>
                          <SelectItem value="membru">Membru</SelectItem>
                          <SelectItem value="consultant">Consultant</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${PROJECT_ROLE_COLORS[m.projectRole]}`}>
                        {PROJECT_ROLE_LABELS[m.projectRole]}
                      </span>
                    )}
                    {m.allocatedHours && (
                      <span className="text-xs text-muted-foreground">{m.allocatedHours}h</span>
                    )}
                    {canManage && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => removeMemberMutation.mutate({ projectId, userId: m.userId })}
                        title="Elimină din echipă"
                      >
                        <UserMinus className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {members.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Niciun membru în echipă</p>
              {canManage && <p className="text-xs mt-1">Adaugă membri folosind butonul de mai sus</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Budget Section */}
      {canManage && (
        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="h-4 w-4 text-[#FFCB09]" />
                Bugetare ore pe categorii
              </CardTitle>
              <Button
                size="sm"
                className="bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] font-semibold gap-1.5"
                onClick={() => { setEditingBudgetItem(null); resetBudgetForm(); setBudgetDialogOpen(true); }}
              >
                <Plus className="h-3.5 w-3.5" />
                Adaugă categorie
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Summary bar */}
            {budgetData && budgetData.totalBudgeted > 0 && (
              <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Sumar buget</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span>Bugetat: <strong>{budgetData.totalBudgeted}h</strong></span>
                    <span>Lucrat: <strong className={budgetData.totalWorked > budgetData.totalBudgeted ? "text-red-600" : "text-green-600"}>{budgetData.totalWorked}h</strong></span>
                    <span>Rămas: <strong>{Math.max(0, budgetData.totalBudgeted - budgetData.totalWorked)}h</strong></span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all ${budgetData.totalWorked > budgetData.totalBudgeted ? "bg-red-500" : "bg-[#FFCB09]"}`}
                    style={{ width: `${Math.min(100, (budgetData.totalWorked / budgetData.totalBudgeted) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Budget items table */}
            {budgetData && budgetData.items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Categorie</th>
                      <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Descriere</th>
                      <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium">Ore bugetate</th>
                      <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Alocat</th>
                      <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium w-20">Acțiuni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budgetData.items.map((item: any) => (
                      <tr key={item.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-2 px-2">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-800 border border-yellow-200">
                            {CATEGORY_LABELS[item.category] || item.category}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-xs text-muted-foreground max-w-[200px] truncate">
                          {item.description || "—"}
                        </td>
                        <td className="py-2 px-2 text-right font-semibold">{item.budgetedHours}h</td>
                        <td className="py-2 px-2">
                          {item.assignedUserName ? (
                            <span className="text-xs">{item.assignedUserName}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Nealocat</span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditBudget(item)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => { if (confirm("Ștergi această categorie de buget?")) deleteBudgetMutation.mutate({ id: item.id }); }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calculator className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nicio categorie de buget definită</p>
                <p className="text-xs mt-1">Adaugă categorii de ore folosind butonul de mai sus</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Budget Dialog */}
      <Dialog open={budgetDialogOpen} onOpenChange={(v) => { setBudgetDialogOpen(v); if (!v) { setEditingBudgetItem(null); resetBudgetForm(); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBudgetItem ? "Editează categorie buget" : "Adaugă categorie buget"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Categorie activitate</Label>
              <Select value={budgetForm.category} onValueChange={(v) => setBudgetForm(f => ({ ...f, category: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Descriere (opțional)</Label>
              <Textarea
                value={budgetForm.description}
                onChange={e => setBudgetForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Detalii despre activitatea bugetată..."
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Ore bugetate</Label>
              <Input
                type="number"
                value={budgetForm.budgetedHours}
                onChange={e => setBudgetForm(f => ({ ...f, budgetedHours: e.target.value }))}
                placeholder="ex: 40"
                min="0.5"
                step="0.5"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Alocat angajatului (opțional)</Label>
              <Select value={budgetForm.assignedUserId} onValueChange={(v) => setBudgetForm(f => ({ ...f, assignedUserId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectează angajatul" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nealocat</SelectItem>
                  {members.map((m: any) => (
                    <SelectItem key={m.userId} value={String(m.userId)}>
                      {m.name || m.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => { setBudgetDialogOpen(false); setEditingBudgetItem(null); resetBudgetForm(); }}>
                Anulează
              </Button>
              <Button
                className="flex-1 bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] font-semibold"
                onClick={handleSaveBudget}
                disabled={addBudgetMutation.isPending || updateBudgetMutation.isPending}
              >
                {(addBudgetMutation.isPending || updateBudgetMutation.isPending) ? "Se salvează..." : editingBudgetItem ? "Salvează" : "Adaugă"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adaugă membru în echipă</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Angajat</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectează angajatul" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((u: any) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.name || u.email} {u.department ? `— ${u.department}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Rol pe proiect</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="coordonator">Coordonator</SelectItem>
                  <SelectItem value="membru">Membru</SelectItem>
                  <SelectItem value="consultant">Consultant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Ore alocate (opțional)</Label>
              <Input
                type="number"
                value={allocatedHours}
                onChange={e => setAllocatedHours(e.target.value)}
                placeholder="ex: 120"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setAddMemberOpen(false)}>
                Anulează
              </Button>
              <Button
                className="flex-1 bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] font-semibold"
                onClick={() => {
                  if (!selectedUserId) return toast.error("Selectează un angajat");
                  addMemberMutation.mutate({
                    projectId,
                    userId: Number(selectedUserId),
                    projectRole: selectedRole as any,
                    allocatedHours: allocatedHours || undefined,
                  });
                }}
                disabled={addMemberMutation.isPending || !selectedUserId}
              >
                {addMemberMutation.isPending ? "Se adaugă..." : "Adaugă"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
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
                <Input value={editForm.code} onChange={e => setEditForm(f => ({ ...f, code: e.target.value }))} placeholder="ex: 255" />
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
              <Button className="bg-[#FFCB09] text-black hover:bg-[#e6b800]" onClick={handleSaveEdit} disabled={editProjectMutation.isPending || !editForm.name}>
                {editProjectMutation.isPending ? "Se salvează..." : "Salvează"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Project Dialog - requires typing project name */}
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
              <p className="text-xs text-red-600 mt-1">
                Se vor șterge: membrii echipei, bugetul pe categorii, și legăturile cu intrările de timp.
                Intrările de timp nu vor fi șterse, dar nu vor mai fi asociate cu acest proiect.
              </p>
            </div>
            <div>
              <Label className="text-xs">Pentru confirmare, tastați numele proiectului: <strong>{project.name}</strong></Label>
              <Input
                value={deleteConfirmName}
                onChange={e => setDeleteConfirmName(e.target.value)}
                placeholder={project.name}
                className="mt-1 border-red-200 focus:ring-red-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Anulează</Button>
              <Button
                variant="destructive"
                onClick={handleDeleteProject}
                disabled={deleteProjectMutation.isPending || deleteConfirmName !== project.name}
              >
                {deleteProjectMutation.isPending ? "Se șterge..." : "Șterge definitiv"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
