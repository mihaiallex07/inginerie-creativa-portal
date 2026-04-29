import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  Users,
  Search,
  Shield,
  UserCheck,
  UserX,
  Pencil,
  Trash2,
  Eye,
} from "lucide-react";
import { useLocation } from "wouter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const DEPARTMENTS = [
  "Proiectare Arhitectură",
  "Proiectare Structură",
  "Proiectare Instalații",
  "Vânzări",
  "Execuție",
];

const ROLES: Record<string, { label: string; color: string }> = {
  admin: { label: "Admin", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  coordonator: { label: "Coordonator", color: "bg-blue-100 text-blue-800 border-blue-200" },
  angajat: { label: "Angajat", color: "bg-green-100 text-green-800 border-green-200" },
  colaborator: { label: "Colaborator", color: "bg-gray-100 text-gray-700 border-gray-200" },
};

type UserRow = {
  id: number;
  name: string | null;
  email: string | null;
  role: "admin" | "coordonator" | "angajat" | "colaborator";
  department: string | null;
  jobTitle: string | null;
  isActive: boolean;
  lastSignedIn: Date | string | null;
  createdAt: Date | string;
};

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("ro-RO", { day: "2-digit", month: "short", year: "numeric" });
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

export default function AdminUtilizatori() {
  const utils = trpc.useUtils();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("toate");
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState({ name: "", department: "", jobTitle: "", phone: "" });
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);

  const { data: users, isLoading } = trpc.adminUsers.list.useQuery();

  const updateRoleMutation = trpc.adminUsers.updateRole.useMutation({
    onSuccess: () => { toast.success("Rol actualizat"); utils.adminUsers.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const toggleActiveMutation = trpc.adminUsers.toggleActive.useMutation({
    onSuccess: (_, vars) => {
      toast.success(vars.isActive ? "Cont activat" : "Cont dezactivat");
      utils.adminUsers.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateProfileMutation = trpc.adminUsers.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profil actualizat");
      utils.adminUsers.list.invalidate();
      setEditUser(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteUserMutation = trpc.adminUsers.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("Utilizator șters complet");
      utils.adminUsers.list.invalidate();
      setDeleteTarget(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const filtered = (users ?? []).filter(u => {
    const matchSearch = !search ||
      (u.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (u.department ?? "").toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "toate" || u.role === roleFilter;
    return matchSearch && matchRole;
  }).sort((a, b) => {
    // Activi întâi, apoi inactivi; în cadrul fiecărei grupe, ordine alfabetică
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    return (a.name ?? "").localeCompare(b.name ?? "", "ro");
  });

  const stats = {
    total: users?.length ?? 0,
    activi: users?.filter(u => u.isActive).length ?? 0,
    admins: users?.filter(u => u.role === "admin").length ?? 0,
  };

  const openEdit = (u: UserRow) => {
    setEditUser(u);
    setEditForm({
      name: u.name ?? "",
      department: u.department ?? "",
      jobTitle: u.jobTitle ?? "",
      phone: "",
    });
  };

  return (
    
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-[#FFCB09]" />
            Administrare Utilizatori
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Gestionează rolurile, permisiunile și conturile angajaților</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="h-8 w-8 text-[#FFCB09]" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total utilizatori</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="p-4 flex items-center gap-3">
              <UserCheck className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-700">{stats.activi}</p>
                <p className="text-xs text-green-600">Conturi active</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-purple-200 bg-purple-50/50">
            <CardContent className="p-4 flex items-center gap-3">
              <Shield className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold text-purple-700">{stats.admins}</p>
                <p className="text-xs text-purple-600">Administratori</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Caută după nume, email, departament..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="toate">Toate rolurile</SelectItem>
                  {Object.entries(ROLES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <CardTitle className="text-sm text-muted-foreground ml-auto">
                {filtered.length} utilizatori
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-muted/40 rounded-lg animate-pulse" />)}
              </div>
            ) : !filtered.length ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nu există utilizatori pentru criteriile selectate.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map(u => {
                  const rc = ROLES[u.role] ?? ROLES.angajat;
                  return (
                    <div
                      key={u.id}
                      className={`flex items-center gap-4 p-3 rounded-xl border transition-colors ${u.isActive ? "bg-card hover:bg-accent/30" : "bg-muted/30 opacity-60"}`}
                    >
                      {/* Avatar */}
                      <Avatar className="h-10 w-10 shrink-0 border border-border">
                        <AvatarFallback className="text-xs font-semibold bg-[#FFCB09]/20 text-[#221F1F]">
                          {getInitials(u.name)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold truncate">{u.name ?? "—"}</span>
                          {!u.isActive && <Badge variant="outline" className="text-xs text-gray-500">Inactiv</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {u.email ?? "—"}
                          {u.department && ` · ${u.department}`}
                          {u.jobTitle && ` · ${u.jobTitle}`}
                        </p>
                      </div>

                      {/* Role selector */}
                      <div className="shrink-0 w-40">
                        <Select
                          value={u.role}
                          onValueChange={v => updateRoleMutation.mutate({ id: u.id, role: v as typeof u.role })}
                          disabled={updateRoleMutation.isPending}
                        >
                          <SelectTrigger className={`h-8 text-xs border font-medium ${rc.color}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(ROLES).map(([k, v]) => (
                              <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Actions */}
                      <div className="shrink-0 flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-[#FFCB09]"
                          onClick={() => setLocation(`/coleg/${u.id}`)}
                          title="Vezi profil complet"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${u.isActive ? "text-orange-400 hover:text-orange-600 hover:bg-orange-50" : "text-green-500 hover:text-green-700 hover:bg-green-50"}`}
                          onClick={() => toggleActiveMutation.mutate({ id: u.id, isActive: !u.isActive })}
                          disabled={toggleActiveMutation.isPending}
                          title={u.isActive ? "Dezactivează cont (păstrează istoricul)" : "Activează cont"}
                        >
                          {u.isActive ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-400 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeleteTarget(u)}
                          title="Șterge utilizator complet (ireversibil)"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {/* Last seen */}
                      <div className="shrink-0 text-right hidden lg:block">
                        <p className="text-xs text-muted-foreground">Ultima autentificare</p>
                        <p className="text-xs font-medium">{fmtDate(u.lastSignedIn)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Profile Dialog */}
        <Dialog open={!!editUser} onOpenChange={open => !open && setEditUser(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editează profil — {editUser?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Nume complet</Label>
                <Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Departament</Label>
                <Select value={editForm.department} onValueChange={v => setEditForm(f => ({ ...f, department: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selectează departamentul" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Funcție</Label>
                <Input value={editForm.jobTitle} onChange={e => setEditForm(f => ({ ...f, jobTitle: e.target.value }))} placeholder="ex: Inginer Proiectant, Manager Proiect" />
              </div>
              <div className="space-y-1.5">
                <Label>Telefon</Label>
                <Input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} placeholder="+40 7xx xxx xxx" />
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setEditUser(null)}>Anulează</Button>
                <Button
                  className="flex-1 bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] font-semibold"
                  onClick={() => editUser && updateProfileMutation.mutate({ id: editUser.id, ...editForm })}
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? "Se salvează..." : "Salvează"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      {/* Dialog confirmare ștergere completă */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Șterge utilizator complet
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Ești sigur că vrei să ștergi definitiv contul lui <strong>{deleteTarget?.name ?? deleteTarget?.email}</strong>?</p>
              <p className="text-red-600 font-medium">Această acțiune este ireversibilă — se vor șterge și toate înregistrările de pontaj, cererile de concediu și orice altă dată asociată acestui cont.</p>
              <p className="text-muted-foreground text-xs">Dacă vrei să păstrezi istoricul, folosește butonul de dezactivare (portocaliu) în loc de ștergere.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => deleteTarget && deleteUserMutation.mutate({ id: deleteTarget.id })}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? "Se șterge..." : "Șterge definitiv"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    
  );
}
