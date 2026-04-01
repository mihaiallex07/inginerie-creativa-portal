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
} from "lucide-react";
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

  const { data: project, isLoading } = trpc.projects.getWithTeam.useQuery({ id: projectId });
  const { data: allUsers } = trpc.adminUsers.list.useQuery(undefined, {
    enabled: user?.role === "admin" || user?.role === "coordonator",
  });

  const canManage = user?.role === "admin" || user?.role === "coordonator";

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
      </div>

      {/* Project Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Client</p>
              <p className="text-sm font-semibold">{project.clientName || "Nespecificat"}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
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
            <div className="h-10 w-10 rounded-lg bg-yellow-50 flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ore estimate</p>
              <p className="text-sm font-semibold">{project.estimatedHours ? `${project.estimatedHours}h` : "Nespecificat"}</p>
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
    </div>
  );
}
