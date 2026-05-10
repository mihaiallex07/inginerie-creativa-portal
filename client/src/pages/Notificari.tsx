import { trpc } from "../lib/trpc";
import { toast } from "sonner";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Bell, Check, X, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

function pad2(n: number) { return String(n).padStart(2, "0"); }

export default function Notificari() {
  const utils = trpc.useUtils();
  const { data: pending = [], isLoading } = trpc.invitations.pending.useQuery();
  const respond = trpc.invitations.respond.useMutation({
    onSuccess: (_, vars) => {
      utils.invitations.pending.invalidate();
      toast.success(vars.accept ? "Invitație acceptată! Activitatea a fost adăugată în calendar." : "Invitație refuzată.");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <div className="flex items-center gap-2 mb-6">
        <Bell className="h-5 w-5 text-[#FFCB09]" />
        <h1 className="text-xl font-bold text-[#221F1F]">Notificări</h1>
        {(pending as any[]).length > 0 && (
          <span className="ml-1 bg-[#FFCB09] text-[#221F1F] text-xs font-bold px-2 py-0.5 rounded-full">
            {(pending as any[]).length}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Se încarcă...</div>
      ) : (pending as any[]).length === 0 ? (
        <div className="text-center py-16 flex flex-col items-center gap-3">
          <Bell className="h-10 w-10 text-gray-200" />
          <p className="text-gray-400 text-sm">Nicio notificare nouă</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(pending as any[]).map((inv: any) => {
            const date = inv.date ? format(new Date(inv.date), "d MMMM yyyy", { locale: ro }) : "";
            const startH = inv.startHour != null ? pad2(inv.startHour) : "?";
            const startM = inv.startMin != null ? pad2(inv.startMin) : "00";
            const endH = inv.endHour != null ? pad2(inv.endHour) : "?";
            const endM = inv.endMin != null ? pad2(inv.endMin) : "00";
            return (
              <div key={inv.id} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-[#FFCB09]/20 flex items-center justify-center shrink-0">
                    <Users className="h-4 w-4 text-[#FFCB09]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#221F1F]">
                      <span className="text-[#FFCB09]">{inv.hostName || "Un coleg"}</span> te-a invitat la o activitate
                    </p>
                    <div className="mt-1.5 bg-gray-50 rounded-lg p-2.5 space-y-0.5">
                      <p className="text-sm font-bold text-[#221F1F]">{inv.taskName || inv.activityType || "Activitate"}</p>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{date} · {startH}:{startM} – {endH}:{endM}</span>
                      </div>
                      {inv.projectName && (
                        <p className="text-xs text-gray-400">Proiect: {inv.projectName}</p>
                      )}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        className="bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] font-semibold text-xs gap-1"
                        onClick={() => respond.mutate({ id: inv.id, accept: true })}
                        disabled={respond.isPending}
                      >
                        <Check className="h-3.5 w-3.5" /> Acceptă
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs gap-1 border-gray-300 text-gray-600"
                        onClick={() => respond.mutate({ id: inv.id, accept: false })}
                        disabled={respond.isPending}
                      >
                        <X className="h-3.5 w-3.5" /> Refuză
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
