import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { useState } from "react";
import { Lightbulb, Plus, ThumbsUp, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  deschisa: { label: "Deschisă", color: "bg-blue-100 text-blue-800", icon: Clock },
  in_evaluare: { label: "În evaluare", color: "bg-amber-100 text-amber-800", icon: AlertCircle },
  acceptata: { label: "Acceptată", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  amanata: { label: "Amânată", color: "bg-gray-100 text-gray-700", icon: Clock },
  respinsa: { label: "Respinsă", color: "bg-red-100 text-red-800", icon: XCircle },
};

export default function Propuneri() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    benefits: "",
    isAnonymous: false,
  });

  const { data: proposals, isLoading } = trpc.proposals.list.useQuery({ status: statusFilter || undefined });

  const create = trpc.proposals.create.useMutation({
    onSuccess: (d) => {
      toast.success(`Propunere creată! Număr referință: ${d.referenceNumber}`);
      setOpen(false);
      setForm({ title: "", description: "", benefits: "", isAnonymous: false });
      utils.proposals.list.invalidate();
    },
    onError: () => toast.error("Eroare la trimiterea propunerii"),
  });

  const vote = trpc.proposals.vote.useMutation({
    onSuccess: (d) => {
      toast.success(d.voted ? "Vot adăugat!" : "Vot retras");
      utils.proposals.list.invalidate();
    },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Propuneri de îmbunătățire</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Idei pentru o companie mai bună</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] font-semibold gap-2">
              <Plus className="h-4 w-4" />
              Propune o idee
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Propunere nouă</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs">Titlu *</Label>
                <Input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Titlul propunerii tale..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Descriere *</Label>
                <Textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Descrie propunerea în detaliu..."
                  rows={4}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Beneficii așteptate</Label>
                <Textarea
                  value={form.benefits}
                  onChange={e => setForm(f => ({ ...f, benefits: e.target.value }))}
                  placeholder="Ce beneficii ar aduce această propunere?"
                  rows={2}
                  className="mt-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.isAnonymous}
                  onCheckedChange={v => setForm(f => ({ ...f, isAnonymous: v }))}
                />
                <Label className="text-xs">Propunere anonimă</Label>
              </div>
              <Button
                className="w-full bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] font-semibold"
                onClick={() => create.mutate(form)}
                disabled={create.isPending || !form.title || !form.description}
              >
                Trimite propunerea
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Toate statusurile" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Toate statusurile</SelectItem>
          {Object.entries(STATUS_CONFIG).map(([value, cfg]) => (
            <SelectItem key={value} value={value}>{cfg.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : proposals && proposals.length > 0 ? (
        <div className="space-y-3">
          {proposals.map(({ proposal: p, author }: any) => {
            const statusCfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.deschisa;
            const StatusIcon = statusCfg.icon;
            return (
              <Card key={p.id} className="border-border hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-mono text-muted-foreground">{p.referenceNumber}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5 ${statusCfg.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusCfg.label}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-foreground">{p.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{p.description}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        {!p.isAnonymous && author && <span>{author.name}</span>}
                        {!p.isAnonymous && author && <span>·</span>}
                        <span>{format(new Date(p.createdAt), "d MMM yyyy", { locale: ro })}</span>
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-center gap-1">
                      <button
                        onClick={() => vote.mutate({ proposalId: p.id })}
                        disabled={vote.isPending}
                        className="flex flex-col items-center gap-0.5 p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-semibold">{p.votesCount ?? 0}</span>
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Lightbulb className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nu există propuneri{statusFilter ? " cu acest status" : ""}</p>
          <p className="text-xs mt-1">Fii primul care propune o idee!</p>
        </div>
      )}
    </div>
  );
}
