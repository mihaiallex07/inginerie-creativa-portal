import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, subWeeks, addWeeks } from "date-fns";
import { ro } from "date-fns/locale";
import { useState, useEffect } from "react";
import { Play, Square, Plus, Timer, ChevronLeft, ChevronRight, TrendingUp, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const ACTIVITY_TYPES = [
  { value: "proiectare", label: "Proiectare", color: "#FFCB09" },
  { value: "consultanta", label: "Consultanță", color: "#3B82F6" },
  { value: "sedinta", label: "Ședință", color: "#8B5CF6" },
  { value: "documentare", label: "Documentare", color: "#6B7280" },
  { value: "deplasare", label: "Deplasare", color: "#F59E0B" },
  { value: "administrativ", label: "Administrativ", color: "#9CA3AF" },
  { value: "verificare", label: "Verificare", color: "#10B981" },
  { value: "executie", label: "Execuție", color: "#EF4444" },
];

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

function ElapsedTimer({ startTime }: { startTime: Date }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const update = () => setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [startTime]);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return (
    <span className="tabular-nums font-mono text-2xl font-bold text-[#221F1F]">
      {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
}

export default function TimeTracking() {
  const utils = trpc.useUtils();
  const [weekOffset, setWeekOffset] = useState(0);
  const [addOpen, setAddOpen] = useState(false);

  // Manual entry form
  const [manualForm, setManualForm] = useState({
    projectId: "",
    date: format(new Date(), "yyyy-MM-dd"),
    hours: "1",
    minutes: "0",
    activityType: "proiectare",
    taskName: "",
    description: "",
    isBillable: true,
  });

  // Timer form
  const [timerForm, setTimerForm] = useState({
    projectId: "",
    taskName: "",
    activityType: "proiectare",
    isBillable: true,
  });

  const weekStart = startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });

  const { data: entries } = trpc.timeTracking.myEntries.useQuery({
    dateFrom: format(weekStart, "yyyy-MM-dd"),
    dateTo: format(weekEnd, "yyyy-MM-dd"),
  });
  const { data: runningTimer } = trpc.timeTracking.runningTimer.useQuery();
  const { data: projects } = trpc.projects.list.useQuery({ status: "activ" });

  const startTimer = trpc.timeTracking.startTimer.useMutation({
    onSuccess: () => { toast.success("Timer pornit!"); utils.timeTracking.runningTimer.invalidate(); utils.timeTracking.myEntries.invalidate(); },
  });
  const stopTimer = trpc.timeTracking.stopTimer.useMutation({
    onSuccess: (d) => { toast.success(`Timer oprit — ${formatDuration(d.durationMinutes)}`); utils.timeTracking.runningTimer.invalidate(); utils.timeTracking.myEntries.invalidate(); },
  });
  const addManual = trpc.timeTracking.addManual.useMutation({
    onSuccess: () => { toast.success("Intrare adăugată!"); setAddOpen(false); utils.timeTracking.myEntries.invalidate(); },
  });

  // Weekly stats by activity
  const weeklyByActivity = ACTIVITY_TYPES.map(type => {
    const mins = entries?.filter(e => e.activityType === type.value).reduce((acc, e) => acc + (e.durationMinutes ?? 0), 0) ?? 0;
    return { ...type, minutes: mins };
  }).filter(t => t.minutes > 0).sort((a, b) => b.minutes - a.minutes);

  const totalWeekMinutes = entries?.reduce((acc, e) => acc + (e.durationMinutes ?? 0), 0) ?? 0;
  const normWeekMinutes = 5 * 8 * 60; // 40h

  // Group entries by project
  const byProject = entries?.reduce((acc, e) => {
    const key = e.projectId ? String(e.projectId) : "intern";
    if (!acc[key]) acc[key] = { projectId: e.projectId, minutes: 0, entries: [] };
    acc[key].minutes += e.durationMinutes ?? 0;
    acc[key].entries.push(e);
    return acc;
  }, {} as Record<string, { projectId: number | null; minutes: number; entries: typeof entries }>) ?? {};

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Time-Tracking</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Înregistrează și monitorizează activitățile</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] font-semibold gap-2">
              <Plus className="h-4 w-4" />
              Adaugă manual
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Adaugă intrare manuală</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Data</Label>
                  <Input type="date" value={manualForm.date} onChange={e => setManualForm(f => ({ ...f, date: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Proiect</Label>
                  <Select value={manualForm.projectId} onValueChange={v => setManualForm(f => ({ ...f, projectId: v }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selectează" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Intern / Fără proiect</SelectItem>
                      {projects?.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Tip activitate</Label>
                <Select value={manualForm.activityType} onValueChange={v => setManualForm(f => ({ ...f, activityType: v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Denumire sarcină</Label>
                <Input value={manualForm.taskName} onChange={e => setManualForm(f => ({ ...f, taskName: e.target.value }))} placeholder="ex: Proiect tehnic PT Faza 2" className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Ore</Label>
                  <Input type="number" min="0" max="24" value={manualForm.hours} onChange={e => setManualForm(f => ({ ...f, hours: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Minute</Label>
                  <Select value={manualForm.minutes} onValueChange={v => setManualForm(f => ({ ...f, minutes: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[0, 15, 30, 45].map(m => <SelectItem key={m} value={String(m)}>{m} min</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Descriere</Label>
                <Textarea value={manualForm.description} onChange={e => setManualForm(f => ({ ...f, description: e.target.value }))} rows={2} className="mt-1" />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={manualForm.isBillable} onCheckedChange={v => setManualForm(f => ({ ...f, isBillable: v }))} />
                <Label className="text-xs">Facturabil</Label>
              </div>
              <Button
                className="w-full bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] font-semibold"
                onClick={() => addManual.mutate({
                  projectId: manualForm.projectId ? Number(manualForm.projectId) : undefined,
                  date: manualForm.date,
                  durationMinutes: Number(manualForm.hours) * 60 + Number(manualForm.minutes),
                  activityType: manualForm.activityType as any,
                  taskName: manualForm.taskName || undefined,
                  description: manualForm.description || undefined,
                  isBillable: manualForm.isBillable,
                })}
                disabled={addManual.isPending}
              >
                Salvează
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Running Timer */}
      {runningTimer ? (
        <Card className="border-2 border-[#FFCB09] bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-[#FFCB09] flex items-center justify-center">
                  <Timer className="h-5 w-5 text-[#221F1F]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#221F1F]">
                    {runningTimer.taskName ?? "Activitate în desfășurare"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {ACTIVITY_TYPES.find(t => t.value === runningTimer.activityType)?.label} ·{" "}
                    {runningTimer.isBillable ? "Facturabil" : "Non-facturabil"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {runningTimer.startTime && <ElapsedTimer startTime={new Date(runningTimer.startTime)} />}
                <Button
                  onClick={() => stopTimer.mutate({ id: runningTimer.id })}
                  disabled={stopTimer.isPending}
                  variant="outline"
                  className="border-[#221F1F] text-[#221F1F] gap-2 hover:bg-[#221F1F] hover:text-white"
                >
                  <Square className="h-4 w-4" />
                  Stop
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Pornește timer</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Denumire sarcină..."
                value={timerForm.taskName}
                onChange={e => setTimerForm(f => ({ ...f, taskName: e.target.value }))}
                className="flex-1"
              />
              <Select value={timerForm.activityType} onValueChange={v => setTimerForm(f => ({ ...f, activityType: v }))}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={timerForm.projectId} onValueChange={v => setTimerForm(f => ({ ...f, projectId: v }))}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Proiect (opțional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Fără proiect</SelectItem>
                  {projects?.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button
                onClick={() => startTimer.mutate({
                  projectId: timerForm.projectId ? Number(timerForm.projectId) : undefined,
                  taskName: timerForm.taskName || undefined,
                  activityType: timerForm.activityType as any,
                  isBillable: timerForm.isBillable,
                })}
                disabled={startTimer.isPending}
                className="bg-[#221F1F] hover:bg-gray-800 text-white gap-2"
              >
                <Play className="h-4 w-4" />
                Start
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Stats */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#FFCB09]" />
                Săptămâna curentă
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setWeekOffset(o => o - 1)}>
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setWeekOffset(o => o + 1)}>
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {format(weekStart, "d MMM", { locale: ro })} – {format(weekEnd, "d MMM yyyy", { locale: ro })}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Ore înregistrate</span>
                <span className="font-semibold">{formatDuration(totalWeekMinutes)}</span>
              </div>
              <Progress value={Math.min(100, (totalWeekMinutes / normWeekMinutes) * 100)} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">din 40h normă</p>
            </div>
            <div className="pt-2 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Pe activități</p>
              {weeklyByActivity.length > 0 ? weeklyByActivity.map(type => (
                <div key={type.value} className="flex items-center gap-2 mb-1.5">
                  <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: type.color }} />
                  <span className="text-xs text-muted-foreground flex-1 truncate">{type.label}</span>
                  <span className="text-xs font-medium tabular-nums">{formatDuration(type.minutes)}</span>
                </div>
              )) : (
                <p className="text-xs text-muted-foreground">Nicio înregistrare</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Entries by project */}
        <Card className="border-border lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#FFCB09]" />
              Distribuție pe proiecte
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.entries(byProject).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(byProject)
                  .sort(([, a], [, b]) => b.minutes - a.minutes)
                  .map(([key, data]) => {
                    const project = projects?.find(p => p.id === data.projectId);
                    const pct = totalWeekMinutes > 0 ? Math.round((data.minutes / totalWeekMinutes) * 100) : 0;
                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium truncate max-w-[200px]">
                            {project?.name ?? "Intern / Fără proiect"}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{pct}%</span>
                            <span className="text-xs font-semibold tabular-nums">{formatDuration(data.minutes)}</span>
                          </div>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: project?.color ?? "#FFCB09" }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Timer className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nicio intrare pentru această săptămână</p>
                <p className="text-xs mt-1">Pornește un timer sau adaugă manual</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Entries list */}
      {entries && entries.length > 0 && (
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Intrări detaliate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {entries.map(entry => {
                const actType = ACTIVITY_TYPES.find(t => t.value === entry.activityType);
                const project = projects?.find(p => p.id === entry.projectId);
                return (
                  <div key={entry.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: actType?.color ?? "#9CA3AF" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{entry.taskName ?? actType?.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(entry.date), "EEE, d MMM", { locale: ro })}
                        {project ? ` · ${project.name}` : ""}
                        {entry.isBillable ? " · Facturabil" : " · Non-facturabil"}
                      </p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums shrink-0">
                      {formatDuration(entry.durationMinutes ?? 0)}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
