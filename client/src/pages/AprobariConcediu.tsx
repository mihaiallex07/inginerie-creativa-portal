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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Clock, Ban, Users, CalendarCheck } from "lucide-react";

const LEAVE_TYPES: Record<string, { label: string; color: string }> = {
  concediu_odihna: { label: "Concediu odihnă", color: "bg-blue-100 text-blue-800" },
  concediu_medical: { label: "Medical", color: "bg-red-100 text-red-800" },
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

function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("ro-RO", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AprobariConcediu() {
  const utils = trpc.useUtils();
  const [statusFilter, setStatusFilter] = useState("in_asteptare");
  const [reviewDialog, setReviewDialog] = useState<{ id: number; name: string } | null>(null);
  const [reviewForm, setReviewForm] = useState({ status: "aprobata" as "aprobata" | "respinsa", note: "" });

  const { data: requests, isLoading } = trpc.leave.allRequests.useQuery({ status: statusFilter });

  const reviewMutation = trpc.leave.review.useMutation({
    onSuccess: () => {
      toast.success(`Cerere ${reviewForm.status === "aprobata" ? "aprobată" : "respinsă"} cu succes`);
      utils.leave.allRequests.invalidate();
      setReviewDialog(null);
      setReviewForm({ status: "aprobata", note: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const counts = {
    inAsteptare: requests?.filter(r => r.status === "in_asteptare").length ?? 0,
    aprobate: requests?.filter(r => r.status === "aprobata").length ?? 0,
    respinse: requests?.filter(r => r.status === "respinsa").length ?? 0,
  };

  return (
    
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <CalendarCheck className="h-6 w-6 text-[#FFCB09]" />
              Aprobări Concediu
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Gestionează cererile de concediu ale echipei</p>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="toate">Toate cererile</SelectItem>
              <SelectItem value="in_asteptare">În așteptare</SelectItem>
              <SelectItem value="aprobata">Aprobate</SelectItem>
              <SelectItem value="respinsa">Respinse</SelectItem>
              <SelectItem value="anulata">Anulate</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-yellow-700">{counts.inAsteptare}</p>
                <p className="text-xs text-yellow-600">În așteptare</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-700">{counts.aprobate}</p>
                <p className="text-xs text-green-600">Aprobate</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="p-4 flex items-center gap-3">
              <XCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-700">{counts.respinse}</p>
                <p className="text-xs text-red-600">Respinse</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Requests table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-[#FFCB09]" />
              Cereri echipă
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted/40 rounded-lg animate-pulse" />)}
              </div>
            ) : !requests?.length ? (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nu există cereri pentru filtrul selectat.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map(req => {
                  const sc = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.in_asteptare;
                  const lt = LEAVE_TYPES[req.type] ?? LEAVE_TYPES.alt;
                  return (
                    <div key={req.id} className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-accent/30 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-semibold text-foreground">{req.employeeName ?? "—"}</span>
                          {req.employeeDepartment && (
                            <span className="text-xs text-muted-foreground">· {req.employeeDepartment}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${lt.color}`}>{lt.label}</span>
                          <Badge variant="outline" className={`text-xs gap-1 ${sc.color}`}>
                            {sc.icon}{sc.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {fmtDate(req.startDate)} → {fmtDate(req.endDate)} · <strong>{req.totalDays} zile</strong>
                          </span>
                        </div>
                        {req.reason && <p className="text-xs text-muted-foreground mt-1 truncate">{req.reason}</p>}
                        {req.reviewNote && (
                          <p className="text-xs text-muted-foreground mt-0.5 italic">Notă: {req.reviewNote}</p>
                        )}
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1.5">
                        <p className="text-xs text-muted-foreground">{fmtDate(req.createdAt)}</p>
                        {req.status === "in_asteptare" && (
                          <Button
                            size="sm"
                            className="bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] font-semibold h-7 text-xs"
                            onClick={() => setReviewDialog({ id: req.id, name: req.employeeName ?? "angajat" })}
                          >
                            Procesează
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

        {/* Review Dialog */}
        <Dialog open={!!reviewDialog} onOpenChange={open => !open && setReviewDialog(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Procesează cererea — {reviewDialog?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Decizie</Label>
                <Select
                  value={reviewForm.status}
                  onValueChange={v => setReviewForm(f => ({ ...f, status: v as "aprobata" | "respinsa" }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aprobata">✅ Aprobă cererea</SelectItem>
                    <SelectItem value="respinsa">❌ Respinge cererea</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Notă pentru angajat <span className="text-muted-foreground text-xs">(opțional)</span></Label>
                <Textarea
                  placeholder="Adaugă o notă explicativă..."
                  value={reviewForm.note}
                  onChange={e => setReviewForm(f => ({ ...f, note: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setReviewDialog(null)}>Anulează</Button>
                <Button
                  className={`flex-1 font-semibold ${reviewForm.status === "aprobata" ? "bg-green-600 hover:bg-green-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}`}
                  onClick={() => reviewDialog && reviewMutation.mutate({
                    id: reviewDialog.id,
                    status: reviewForm.status,
                    reviewNote: reviewForm.note || undefined,
                  })}
                  disabled={reviewMutation.isPending}
                >
                  {reviewMutation.isPending ? "Se procesează..." : reviewForm.status === "aprobata" ? "Aprobă" : "Respinge"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    
  );
}
