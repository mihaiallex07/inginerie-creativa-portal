import { trpc } from "../lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, BookOpen, CheckCircle2, Clock, User } from "lucide-react";
import { toast } from "sonner";

export default function ProcesDetaliu() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.processes.byId.useQuery({ id: Number(id) });
  const confirmRead = trpc.processes.confirmRead.useMutation({
    onSuccess: () => {
      toast.success("Confirmare înregistrată!");
      utils.processes.byId.invalidate();
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="h-8 bg-muted rounded animate-pulse w-32" />
        <div className="h-64 bg-muted rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-muted-foreground">Procesul nu a fost găsit.</p>
        <Button variant="ghost" onClick={() => setLocation("/procese")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Înapoi
        </Button>
      </div>
    );
  }

  const { process: p, owner, userConfirmed } = data as any;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" onClick={() => setLocation("/procese")} className="gap-2 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Înapoi la procese
      </Button>

      <Card className="border-border">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {p.code && <span className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{p.code}</span>}
                {p.isMandatoryRead && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-semibold">Citire obligatorie</span>
                )}
              </div>
              <h1 className="text-xl font-bold text-foreground">{p.title}</h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <span>Versiunea {p.version}</span>
                <span>·</span>
                <span>Actualizat {format(new Date(p.updatedAt), "d MMMM yyyy", { locale: ro })}</span>
                {owner && (
                  <>
                    <span>·</span>
                    <User className="h-3 w-3" />
                    <span>{owner.name}</span>
                  </>
                )}
              </div>
            </div>
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          {p.content ? (
            <div className="prose prose-sm max-w-none text-foreground">
              {p.content.split("\n").map((para: string, i: number) => (
                para.trim() ? <p key={i} className="mb-3 text-sm leading-relaxed">{para}</p> : null
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Conținut în curs de redactare...</p>
          )}

          {/* Confirmation */}
          {p.isMandatoryRead && (
            <div className={`mt-6 p-4 rounded-lg border-2 ${userConfirmed ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}`}>
              {userConfirmed ? (
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-semibold">Ai confirmat citirea acestui document</span>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 text-amber-700 mb-3">
                    <Clock className="h-5 w-5" />
                    <span className="text-sm font-semibold">Confirmare de citire necesară</span>
                  </div>
                  <p className="text-xs text-amber-600 mb-3">
                    Prin confirmare, atești că ai citit și înțeles conținutul acestui document.
                  </p>
                  <Button
                    onClick={() => confirmRead.mutate({ processId: p.id })}
                    disabled={confirmRead.isPending}
                    className="bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] font-semibold gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Confirm că am citit
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
