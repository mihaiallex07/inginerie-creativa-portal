import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { FolderOpen, Plus, ExternalLink, Search } from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  activ: "bg-green-100 text-green-800",
  suspendat: "bg-amber-100 text-amber-800",
  finalizat: "bg-gray-100 text-gray-700",
  intern: "bg-blue-100 text-blue-800",
};

const STATUS_LABELS: Record<string, string> = {
  activ: "Activ",
  suspendat: "Suspendat",
  finalizat: "Finalizat",
  intern: "Intern",
};

export default function Proiecte() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("toate");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "",
    clientName: "",
    driveId: "",
    description: "",
    status: "activ" as "activ" | "suspendat" | "finalizat" | "intern",
    color: "#FFCB09",
  });

  const { data: projects, isLoading } = trpc.projects.list.useQuery({ status: statusFilter === "toate" ? undefined : statusFilter });
  const canManage = user?.role === "super_admin" || user?.role === "admin_hr" || user?.role === "manager";

  const upsert = trpc.projects.upsert.useMutation({
    onSuccess: () => {
      toast.success("Proiect salvat!");
      setOpen(false);
      setForm({ name: "", code: "", clientName: "", driveId: "", description: "", status: "activ", color: "#FFCB09" });
      utils.projects.list.invalidate();
    },
    onError: () => toast.error("Eroare la salvare"),
  });

  const filtered = projects?.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.clientName ?? "").toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Proiecte</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Proiecte active și arhivate</p>
        </div>
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] font-semibold gap-2">
                <Plus className="h-4 w-4" />
                Proiect nou
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Proiect nou</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Nume proiect *</Label>
                    <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Cod intern</Label>
                    <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="ex: 125" className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Client</Label>
                  <Input value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">ID Folder Google Drive</Label>
                  <Input value={form.driveId} onChange={e => setForm(f => ({ ...f, driveId: e.target.value }))} placeholder="ID-ul folderului din Drive" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as any }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
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
                  <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="mt-1" />
                </div>
                <div className="flex items-center gap-3">
                  <div>
                    <Label className="text-xs">Culoare</Label>
                    <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="mt-1 h-8 w-16 rounded cursor-pointer" />
                  </div>
                </div>
                <Button
                  className="w-full bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] font-semibold"
                  onClick={() => upsert.mutate({ ...form, estimatedHours: undefined })}
                  disabled={upsert.isPending || !form.name}
                >
                  Salvează proiectul
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Caută proiecte..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="toate">Toate</SelectItem>
            <SelectItem value="activ">Active</SelectItem>
            <SelectItem value="suspendat">Suspendate</SelectItem>
            <SelectItem value="finalizat">Finalizate</SelectItem>
            <SelectItem value="intern">Interne</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map(p => (
            <Card key={p.id} className="border-border hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: p.color ?? "#FFCB09" }}
                  >
                    <FolderOpen className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {p.code && <span className="text-[10px] font-mono text-muted-foreground">{p.code}</span>}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${STATUS_COLORS[p.status]}`}>
                        {STATUS_LABELS[p.status]}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                    {p.clientName && <p className="text-xs text-muted-foreground truncate">{p.clientName}</p>}
                  </div>
                  {p.driveId && (
                    <a
                      href={`https://drive.google.com/drive/folders/${p.driveId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="shrink-0 p-1.5 rounded hover:bg-muted transition-colors"
                      title="Deschide în Google Drive"
                    >
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <FolderOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nu există proiecte{search ? " pentru căutarea ta" : ""}</p>
        </div>
      )}
    </div>
  );
}
