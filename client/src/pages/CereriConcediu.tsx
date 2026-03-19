import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CalendarDays, Plus, Clock, CheckCircle2, XCircle, Ban, FileText } from "lucide-react";

const LEAVE_TYPES: Record<string, { label: string; color: string }> = {
  concediu_odihna: { label: "Concediu odihnă", color: "bg-blue-100 text-blue-800" },
  concediu_medical: { label: "Concediu medical", color: "bg-red-100 text-red-800" },
  concediu_fara_plata: { label: "Fără plată", color: "bg-orange-100 text-orange-800" },
  liber_legal: { label: "Liber legal", color: "bg-purple-100 text-purple-800" },
  recuperare: { label: "Recuperare", color: "bg-teal-100 text-teal-800" },
  alt: { label: "Alt tip", color: "bg-gray-100 text-gray-800" },
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  in_asteptare: { label: "În așteptare", icon: <Clock className="h-3 w-3" />, color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  aprobata: { label: "Aprobată", icon: <CheckCircle2 className="h-3 w-3" />, color: "bg-green-100 text-green-800 border-green-200" },
  respinsa: { label: "Respinsă", icon: <XCircle className="h-3 w-3" />, color: "bg-red-100 text-red-800 border-red-200" },
  anulata: { label: "Anulată", icon: <Ban className="h-3 w-3" />, color: "bg-gray-100 text-gray-600 border-gray-200" },
};

function calcWorkDays(start: string, end: string): number {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  if (e < s) return 0;
  let count = 0;
  const cur = new Date(s);
  while (cur <= e) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("ro-RO", { day: "2-digit", month: "short", year: "numeric" });
}

export default function CereriConcediu() {
  const { user: _user } = useAuth();
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    type: "concediu_odihna" as string,
    startDate: "",
    endDate: "",
    reason: "",
  });

  const { data: requests, isLoading } = trpc.leave.myRequests.useQuery();

  const createMutation = trpc.leave.create.useMutation({
    onSuccess: () => {
       toast.success("Cerere depăsă cu succes", { description: "Vei fi notificat când cererea este procesată." });
      utils.leave.myRequests.invalidate();
      setOpen(false);
      setForm({ type: "concediu_odihna", startDate: "", endDate: "", reason: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const cancelMutation = trpc.leave.cancel.useMutation({
    onSuccess: () => {
      toast.success("Cerere anulată");
      utils.leave.myRequests.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const totalDays = calcWorkDays(form.startDate, form.endDate);

  const handleSubmit = () => {
    if (!form.startDate || !form.endDate) {
       toast.error("Selectează data de început și de sfârșit.");
      return;
    }
    if (totalDays < 1) {
      toast.error("Data de sfârșit trebuie să fie după data de început.");
      return;
    }
    createMutation.mutate({
      type: form.type as "concediu_odihna" | "concediu_medical" | "concediu_fara_plata" | "liber_legal" | "recuperare" | "alt",
      startDate: form.startDate,
      endDate: form.endDate,
      totalDays,
      reason: form.reason || undefined,
    });
  };

  // Summary stats
  const stats = {
    inAsteptare: requests?.filter(r => r.status === "in_asteptare").length ?? 0,
    aprobate: requests?.filter(r => r.status === "aprobata").length ?? 0,
    zileAprobate: requests?.filter(r => r.status === "aprobata").reduce((a, r) => a + r.totalDays, 0) ?? 0,
  };

  return (
    
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-[#FFCB09]" />
              Cereri Concediu
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Depune și urmărește cererile tale de concediu</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] font-semibold gap-2">
                <Plus className="h-4 w-4" />
                Cerere nouă
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#FFCB09]" />
                  Cerere concediu nouă
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label>Tip concediu</Label>
                  <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(LEAVE_TYPES).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Data început</Label>
                    <Input
                      type="date"
                      value={form.startDate}
                      onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Data sfârșit</Label>
                    <Input
                      type="date"
                      value={form.endDate}
                      min={form.startDate}
                      onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    />
                  </div>
                </div>
                {totalDays > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-[#FFCB09]/10 rounded-lg border border-[#FFCB09]/30">
                    <CalendarDays className="h-4 w-4 text-[#FFCB09]" />
                    <span className="text-sm font-medium">
                      <span className="text-[#FFCB09] font-bold text-lg">{totalDays}</span> zile lucrătoare
                    </span>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label>Motiv / observații <span className="text-muted-foreground text-xs">(opțional)</span></Label>
                  <Textarea
                    placeholder="Adaugă un motiv sau observații suplimentare..."
                    value={form.reason}
                    onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Anulează</Button>
                  <Button
                    className="flex-1 bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] font-semibold"
                    onClick={handleSubmit}
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? "Se trimite..." : "Depune cererea"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-700">{stats.inAsteptare}</p>
              <p className="text-xs text-yellow-600 mt-1">În așteptare</p>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-700">{stats.aprobate}</p>
              <p className="text-xs text-green-600 mt-1">Aprobate</p>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-700">{stats.zileAprobate}</p>
              <p className="text-xs text-blue-600 mt-1">Zile aprobate</p>
            </CardContent>
          </Card>
        </div>

        {/* Requests list */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Istoricul cererilor mele</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-muted/40 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : !requests?.length ? (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nu ai nicio cerere de concediu înregistrată.</p>
                <p className="text-xs mt-1">Apasă „Cerere nouă" pentru a depune prima cerere.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map(req => {
                  const sc = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.in_asteptare;
                  const lt = LEAVE_TYPES[req.type] ?? LEAVE_TYPES.alt;
                  return (
                    <div key={req.id} className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-accent/30 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${lt.color}`}>{lt.label}</span>
                          <Badge variant="outline" className={`text-xs gap-1 ${sc.color}`}>
                            {sc.icon}{sc.label}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium mt-1.5">
                          {fmtDate(req.startDate)} → {fmtDate(req.endDate)}
                          <span className="text-muted-foreground font-normal ml-2">({req.totalDays} zile)</span>
                        </p>
                        {req.reason && <p className="text-xs text-muted-foreground mt-0.5 truncate">{req.reason}</p>}
                        {req.reviewNote && (
                          <p className="text-xs mt-1 text-muted-foreground italic">
                            Notă HR: {req.reviewNote}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">{fmtDate(req.createdAt)}</p>
                        {req.status === "in_asteptare" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 mt-1 h-7"
                            onClick={() => cancelMutation.mutate({ id: req.id })}
                            disabled={cancelMutation.isPending}
                          >
                            Anulează
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    
  );
}
