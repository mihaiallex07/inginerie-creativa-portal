import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { FolderOpen, Plus, ExternalLink, Search, ChevronDown, ChevronRight } from "lucide-react";
import { ColorPalette } from "@/components/ColorPalette";
import { useLocation } from "wouter";
import { toast } from "sonner";

// Construction/architecture emojis for project icons
const PROJECT_EMOJIS = [
  "🏠", "🏢", "🏗️", "🏛️", "🏬", "🏭", "🏰", "🏯",
  "🏟️", "🏪", "🏫", "🏨", "🏦", "🏥", "🏤", "🏣",
  "🏡", "🏘️", "🏚️", "🏙️", "🌆", "🌇", "🌃", "🌉",
  "🔨", "🪚", "🔧", "🪛", "⚙️", "🪤", "🧱", "🪵",
  "📐", "📏", "🗺️", "🗜️", "🔩", "🪝", "🪜", "🛠️",
];

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
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("toate");
  const [open, setOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState<Record<number, boolean>>({});
  const [form, setForm] = useState({
    name: "",
    code: "",
    abbreviation: "",
    emoji: "",
    clientName: "",
    driveId: "",
    description: "",
    status: "activ" as "activ" | "suspendat" | "finalizat" | "intern",
    color: "#FFCB09",
    startDate: "",
    endDate: "",
  });
  const [selectedPhaseIds, setSelectedPhaseIds] = useState<number[]>([]);

  const { data: projects, isLoading } = trpc.projects.list.useQuery({ status: statusFilter === "toate" ? undefined : statusFilter });
  const { data: defaultTemplate } = trpc.projects.defaultTemplate.useQuery(undefined, { enabled: open });
  const canManage = user?.role === "admin" || user?.role === "coordonator";

  const templatePhases = (defaultTemplate as any)?.phases || [];

  const createProject = trpc.projects.create.useMutation({
    onSuccess: () => {
      toast.success("Proiect creat cu succes!");
      setOpen(false);
      resetForm();
      utils.projects.list.invalidate();
    },
    onError: (e) => toast.error(e.message || "Eroare la salvare"),
  });

  function resetForm() {
    setForm({ name: "", code: "", abbreviation: "", emoji: "", clientName: "", driveId: "", description: "", status: "activ", color: "#FFCB09", startDate: "", endDate: "" });
    setSelectedPhaseIds([]);
    setExpandedPhases({});
    setShowEmojiPicker(false);
  }

  function togglePhase(id: number) {
    setSelectedPhaseIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function toggleAllPhases() {
    if (selectedPhaseIds.length === templatePhases.length) {
      setSelectedPhaseIds([]);
    } else {
      setSelectedPhaseIds(templatePhases.map((p: any) => p.id));
    }
  }

  const filtered = (projects ?? []).filter((p: any) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.clientName ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Proiecte</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Proiecte active și arhivate</p>
        </div>
        {canManage && (
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] font-semibold gap-2">
                <Plus className="h-4 w-4" />
                Proiect nou
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Proiect nou</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                {/* Name */}
                <div>
                  <Label className="text-xs">Nume proiect *</Label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1" placeholder="ex: Modul Găzduire Via Transilvanica" />
                </div>

                {/* Code + Abbreviation */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Cod intern</Label>
                    <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="ex: 222" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Abreviere</Label>
                    <Input value={form.abbreviation} onChange={e => setForm(f => ({ ...f, abbreviation: e.target.value.toUpperCase() }))} placeholder="ex: MVT" className="mt-1" maxLength={10} />
                  </div>
                </div>

                {/* Client */}
                <div>
                  <Label className="text-xs">Client</Label>
                  <Input value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} className="mt-1" />
                </div>

                {/* Drive ID */}
                <div>
                  <Label className="text-xs">ID Folder Google Drive</Label>
                  <Input value={form.driveId} onChange={e => setForm(f => ({ ...f, driveId: e.target.value }))} placeholder="ID-ul folderului din Drive" className="mt-1" />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Data start</Label>
                    <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Data sfârșit</Label>
                    <Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="mt-1" />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as any }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activ">Activ</SelectItem>
                      <SelectItem value="suspendat">Suspendat</SelectItem>
                      <SelectItem value="finalizat">Finalizat</SelectItem>
                      <SelectItem value="intern">Intern</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div>
                  <Label className="text-xs">Descriere</Label>
                  <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="mt-1" />
                </div>

                {/* Color */}
                <div>
                  <Label className="text-xs">Culoare proiect</Label>
                  <ColorPalette value={form.color} onChange={color => setForm(f => ({ ...f, color }))} className="mt-2" />
                </div>

                {/* Emoji icon */}
                <div>
                  <Label className="text-xs">Icon proiect (opțional)</Label>
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="w-10 h-10 rounded-lg border-2 border-gray-200 flex items-center justify-center text-xl hover:border-[#FFCB09] transition-colors"
                        style={{ backgroundColor: form.color }}
                        onClick={() => setShowEmojiPicker(v => !v)}
                        title="Alege icon"
                      >
                        {form.emoji || <span className="text-xs text-gray-400">?</span>}
                      </button>
                      {form.emoji && (
                        <button type="button" className="text-xs text-gray-400 hover:text-red-500" onClick={() => setForm(f => ({ ...f, emoji: "" }))}>
                          Elimină icon
                        </button>
                      )}
                      {!form.emoji && <span className="text-xs text-gray-400">Apasă pentru a alege un emoji</span>}
                    </div>
                    {showEmojiPicker && (
                      <div className="mt-2 p-3 border border-gray-200 rounded-lg bg-white shadow-sm">
                        <div className="grid grid-cols-8 gap-1">
                          {PROJECT_EMOJIS.map((emoji, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className={`w-8 h-8 text-lg rounded hover:bg-yellow-50 flex items-center justify-center transition-colors ${form.emoji === emoji ? "bg-yellow-100 ring-2 ring-[#FFCB09]" : ""}`}
                              onClick={() => { setForm(f => ({ ...f, emoji })); setShowEmojiPicker(false); }}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Phase selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs">Etape de lucru incluse</Label>
                    <button type="button" className="text-xs text-[#FFCB09] hover:underline font-medium" onClick={toggleAllPhases}>
                      {selectedPhaseIds.length === templatePhases.length ? "Deselectează toate" : "Selectează toate"}
                    </button>
                  </div>
                  {templatePhases.length === 0 ? (
                    <div className="text-xs text-gray-400 py-2">Se încarcă etapele...</div>
                  ) : (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      {templatePhases.map((phase: any) => {
                        const isChecked = selectedPhaseIds.includes(phase.id);
                        const isExpanded = expandedPhases[phase.id];
                        return (
                          <div key={phase.id} className="border-b border-gray-100 last:border-b-0">
                            <div className="flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 transition-colors">
                              <Checkbox
                                id={`phase-${phase.id}`}
                                checked={isChecked}
                                onCheckedChange={() => togglePhase(phase.id)}
                                className="data-[state=checked]:bg-[#FFCB09] data-[state=checked]:border-[#FFCB09]"
                              />
                              <label htmlFor={`phase-${phase.id}`} className="flex-1 text-sm cursor-pointer select-none">
                                <span className="font-medium">{phase.code ? `${phase.code}. ` : ""}{phase.name}</span>
                                <span className="ml-2 text-xs text-gray-400">• {(phase.tasks || []).length} sarcini</span>
                              </label>
                              {(phase.tasks || []).length > 0 && (
                                <button type="button" className="text-gray-400 hover:text-gray-600 p-0.5"
                                  onClick={() => setExpandedPhases(prev => ({ ...prev, [phase.id]: !prev[phase.id] }))}>
                                  {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                </button>
                              )}
                            </div>
                            {isExpanded && (
                              <div className="pl-9 pr-3 pb-2 bg-gray-50">
                                {(phase.tasks || []).map((task: any, i: number) => (
                                  <div key={task.id} className="text-xs text-gray-500 py-0.5">
                                    {String.fromCharCode(97 + i)}. {task.name}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {selectedPhaseIds.length > 0 && (
                    <p className="text-xs text-green-600 mt-1.5">
                      ✓ {selectedPhaseIds.length} etape selectate cu sarcinile lor vor fi adăugate automat
                    </p>
                  )}
                  {selectedPhaseIds.length === 0 && (
                    <p className="text-xs text-gray-400 mt-1.5">
                      Nicio etapă selectată — proiectul va fi creat fără etape predefinite
                    </p>
                  )}
                </div>

                <Button
                  className="w-full bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] font-semibold"
                  onClick={() => createProject.mutate({
                    ...form,
                    emoji: form.emoji || null,
                    abbreviation: form.abbreviation || null,
                    startDate: form.startDate || null,
                    endDate: form.endDate || null,
                    selectedPhaseIds: selectedPhaseIds.length > 0 ? selectedPhaseIds : undefined,
                  })}
                  disabled={createProject.isPending || !form.name}
                >
                  {createProject.isPending ? "Se creează..." : "Salvează proiectul"}
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
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
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
          {filtered.map((p: any) => (
            <Card key={p.id} className="border-border hover:shadow-sm transition-shadow cursor-pointer" onClick={() => setLocation(`/proiecte/${p.id}`)}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Emoji / icon block */}
                  <div
                    className="h-14 w-14 rounded-xl flex flex-col items-center justify-center shrink-0 gap-0.5"
                    style={{ backgroundColor: p.color ?? "#FFCB09" }}
                  >
                    {p.emoji ? (
                      <span className="text-2xl leading-none">{p.emoji}</span>
                    ) : (
                      <span className="text-lg font-bold text-[#221F1F] leading-none">
                        {(p.abbreviation || p.code?.slice(0, 3) || p.name?.slice(0, 2) || "P").toUpperCase().slice(0, 3)}
                      </span>
                    )}
                    {(p.code || p.abbreviation) && (
                      <span className="text-[9px] font-mono text-[#221F1F]/70 leading-none">
                        {[p.code, p.abbreviation].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${STATUS_COLORS[p.status]}`}>
                        {STATUS_LABELS[p.status]}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                    {p.clientName && <p className="text-xs text-muted-foreground truncate">{p.clientName}</p>}
                    {(p.startDate || p.endDate) && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {p.startDate ? new Date(p.startDate).toLocaleDateString("ro-RO", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—"}
                        {" – "}
                        {p.endDate ? new Date(p.endDate).toLocaleDateString("ro-RO", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—"}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {p.phaseCount > 0 && <span>{p.phaseCount} etape</span>}
                      {p.memberCount > 0 && <span>{p.memberCount} membri</span>}
                    </div>
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
