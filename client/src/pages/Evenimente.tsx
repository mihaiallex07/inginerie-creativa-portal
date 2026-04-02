import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { CalendarPlus, Pencil, Trash2, Video, Repeat, Clock, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

type EventForm = {
  title: string;
  description: string;
  link: string;
  startDate: string;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  recurringRule: string;
  recurringUntil: string;
  color: string;
};

const EMPTY_FORM: EventForm = {
  title: "",
  description: "",
  link: "",
  startDate: new Date().toISOString().slice(0, 10),
  startTime: "10:00",
  endTime: "10:15",
  isRecurring: false,
  recurringRule: "daily",
  recurringUntil: "",
  color: "#3b82f6",
};

const COLORS = [
  { value: "#3b82f6", label: "Albastru" },
  { value: "#FFCB09", label: "Galben IC" },
  { value: "#10b981", label: "Verde" },
  { value: "#ef4444", label: "Roșu" },
  { value: "#8b5cf6", label: "Violet" },
  { value: "#f97316", label: "Portocaliu" },
  { value: "#ec4899", label: "Roz" },
];

export default function Evenimente() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const isAdmin = user?.role === "admin";

  const { data: events, isLoading } = trpc.companyEvents.listAll.useQuery(undefined, {
    enabled: isAdmin,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<EventForm>(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const createMutation = trpc.companyEvents.create.useMutation({
    onSuccess: () => {
      toast.success("Eveniment creat cu succes!");
      setFormOpen(false);
      resetForm();
      utils.companyEvents.listAll.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.companyEvents.update.useMutation({
    onSuccess: () => {
      toast.success("Eveniment actualizat!");
      setFormOpen(false);
      resetForm();
      utils.companyEvents.listAll.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.companyEvents.delete.useMutation({
    onSuccess: () => {
      toast.success("Eveniment șters!");
      setDeleteConfirm(null);
      utils.companyEvents.listAll.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  function openCreate() {
    resetForm();
    setFormOpen(true);
  }

  function openEdit(ev: any) {
    const start = new Date(ev.startTime);
    const end = new Date(ev.endTime);
    setForm({
      title: ev.title,
      description: ev.description ?? "",
      link: ev.link ?? "",
      startDate: format(start, "yyyy-MM-dd"),
      startTime: `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`,
      endTime: `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`,
      isRecurring: ev.isRecurring ?? false,
      recurringRule: ev.recurringRule ?? "daily",
      recurringUntil: ev.recurringUntil ?? "",
      color: ev.color ?? "#3b82f6",
    });
    setEditingId(ev.id);
    setFormOpen(true);
  }

  function handleSave() {
    const startTime = new Date(`${form.startDate}T${form.startTime}:00`).toISOString();
    const endTime = new Date(`${form.startDate}T${form.endTime}:00`).toISOString();

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        title: form.title,
        description: form.description || undefined,
        link: form.link || undefined,
        startTime,
        endTime,
        isRecurring: form.isRecurring,
        recurringRule: form.isRecurring ? form.recurringRule : undefined,
        recurringUntil: form.isRecurring && form.recurringUntil ? form.recurringUntil : null,
        color: form.color,
      });
    } else {
      createMutation.mutate({
        title: form.title,
        description: form.description || undefined,
        link: form.link || undefined,
        startTime,
        endTime,
        isRecurring: form.isRecurring,
        recurringRule: form.isRecurring ? form.recurringRule : undefined,
        recurringUntil: form.isRecurring && form.recurringUntil ? form.recurringUntil : null,
        color: form.color,
        targetType: "all",
      });
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Acces interzis — doar administratorii pot gestiona evenimentele.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CalendarPlus className="h-6 w-6 text-[#FFCB09]" />
          <div>
            <h1 className="text-xl font-bold text-foreground">Evenimente Firmă</h1>
            <p className="text-sm text-muted-foreground">Gestionează evenimentele companiei (ședințe, team building, etc.)</p>
          </div>
        </div>
        <Button className="bg-[#FFCB09] text-black hover:bg-[#e6b800] gap-1.5" onClick={openCreate}>
          <CalendarPlus className="h-4 w-4" /> Eveniment nou
        </Button>
      </div>

      {/* Events list */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Se încarcă...</div>
      ) : !events?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarPlus className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Nu există evenimente. Creează primul eveniment!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => {
            const start = new Date(ev.startTime);
            const end = new Date(ev.endTime);
            const timeStr = `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")} - ${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;

            return (
              <Card key={ev.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4 px-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full mt-1.5 shrink-0"
                        style={{ backgroundColor: ev.color ?? "#3b82f6" }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground">{ev.title}</h3>
                          {ev.isRecurring && (
                            <Badge variant="secondary" className="text-[10px] gap-1">
                              <Repeat className="h-3 w-3" />
                              {ev.recurringRule === "daily" ? "Zilnic" : ev.recurringRule === "weekly" ? "Săptămânal" : ev.recurringRule}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {timeStr}
                          </span>
                          {!ev.isRecurring && (
                            <span>
                              {format(start, "d MMM yyyy", { locale: ro })}
                            </span>
                          )}
                          {ev.isRecurring && ev.recurringUntil && (
                            <span>
                              până la {format(new Date(ev.recurringUntil), "d MMM yyyy", { locale: ro })}
                            </span>
                          )}
                          {ev.isRecurring && !ev.recurringUntil && (
                            <span>fără dată de sfârșit</span>
                          )}
                        </div>
                        {ev.description && (
                          <p className="text-sm text-muted-foreground mt-1 truncate">{ev.description}</p>
                        )}
                        {ev.link && (
                          <a
                            href={ev.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1"
                          >
                            <Video className="h-3 w-3" /> Link întâlnire
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(ev)}
                        title="Editează"
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:text-red-600"
                        onClick={() => setDeleteConfirm(ev.id)}
                        title="Șterge"
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={(o) => { if (!o) { setFormOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarPlus className="h-5 w-5 text-[#FFCB09]" />
              {editingId ? "Editează eveniment" : "Eveniment nou"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-xs font-semibold">Titlu *</Label>
              <Input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="ex: Ședință Daily"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Descriere</Label>
              <Input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Detalii opționale"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Link întâlnire (Meet/Zoom/Teams)</Label>
              <Input
                value={form.link}
                onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
                placeholder="https://meet.google.com/..."
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-semibold">Data</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Ora start</Label>
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Ora sfârșit</Label>
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Recurring toggle */}
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
              <input
                type="checkbox"
                id="recurring"
                checked={form.isRecurring}
                onChange={e => setForm(f => ({ ...f, isRecurring: e.target.checked }))}
                className="h-4 w-4 rounded accent-[#FFCB09]"
              />
              <label htmlFor="recurring" className="text-sm font-medium cursor-pointer flex items-center gap-1.5">
                <Repeat className="h-4 w-4 text-muted-foreground" />
                Eveniment recurent
              </label>
            </div>

            {form.isRecurring && (
              <div className="grid grid-cols-2 gap-3 pl-2 border-l-2 border-[#FFCB09]">
                <div>
                  <Label className="text-xs font-semibold">Frecvență</Label>
                  <select
                    value={form.recurringRule}
                    onChange={e => setForm(f => ({ ...f, recurringRule: e.target.value }))}
                    className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="daily">Zilnic (L-V)</option>
                    <option value="weekly">Săptămânal</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Până la (opțional)</Label>
                  <Input
                    type="date"
                    value={form.recurringUntil}
                    onChange={e => setForm(f => ({ ...f, recurringUntil: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            {/* Color picker */}
            <div>
              <Label className="text-xs font-semibold mb-2 block">Culoare</Label>
              <div className="flex gap-2">
                {COLORS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => setForm(f => ({ ...f, color: c.value }))}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${form.color === c.value ? "border-foreground scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button variant="outline" onClick={() => { setFormOpen(false); resetForm(); }}>
                Anulează
              </Button>
              <Button
                className="bg-[#FFCB09] text-black hover:bg-[#e6b800]"
                onClick={handleSave}
                disabled={!form.title.trim() || isSaving}
              >
                {isSaving ? "Se salvează..." : editingId ? "Salvează" : "Creează"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm !== null} onOpenChange={(o) => { if (!o) setDeleteConfirm(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-600">Șterge eveniment</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Ești sigur că vrei să ștergi acest eveniment? Acțiunea este ireversibilă.
          </p>
          <div className="flex justify-end gap-2 pt-3">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Anulează</Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && deleteMutation.mutate({ id: deleteConfirm })}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Se șterge..." : "Șterge"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
