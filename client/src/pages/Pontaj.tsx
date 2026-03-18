import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format, getDaysInMonth } from "date-fns";
import { ro } from "date-fns/locale";
import { useState } from "react";
import { CheckCircle2, Clock, LogIn, LogOut, Coffee, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

const PONTAJ_TYPES = [
  { value: "birou", label: "Prezent la birou" },
  { value: "remote", label: "Lucru de acasă" },
  { value: "deplasare", label: "Deplasare" },
  { value: "concediu", label: "Concediu" },
  { value: "medical", label: "Medical" },
  { value: "liber_legal", label: "Liber legal" },
  { value: "absent", label: "Absent" },
  { value: "recuperare", label: "Recuperare" },
];

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

function getTypeColor(type: string) {
  const colors: Record<string, string> = {
    birou: "bg-green-100 text-green-800",
    remote: "bg-blue-100 text-blue-800",
    deplasare: "bg-purple-100 text-purple-800",
    concediu: "bg-amber-100 text-amber-800",
    medical: "bg-red-100 text-red-800",
    liber_legal: "bg-gray-100 text-gray-700",
    absent: "bg-red-100 text-red-700",
    recuperare: "bg-teal-100 text-teal-800",
  };
  return colors[type] ?? "bg-gray-100 text-gray-700";
}

export default function Pontaj() {
  const utils = trpc.useUtils();
  const [selectedType, setSelectedType] = useState<string>("birou");
  const [breakMinutes, setBreakMinutes] = useState<number>(30);

  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [viewYear, setViewYear] = useState(now.getFullYear());

  const { data: todayPontaj, isLoading } = trpc.pontaj.today.useQuery();
  const { data: monthData } = trpc.pontaj.monthReport.useQuery({ year: viewYear, month: viewMonth });

  const checkIn = trpc.pontaj.checkIn.useMutation({
    onSuccess: (d) => {
      if (d.success) { toast.success("Check-in realizat!"); utils.pontaj.today.invalidate(); }
      else toast.error(d.message ?? "Eroare");
    },
  });
  const checkOut = trpc.pontaj.checkOut.useMutation({
    onSuccess: (d) => {
      if (d.success) { toast.success("Check-out realizat!"); utils.pontaj.today.invalidate(); utils.pontaj.monthReport.invalidate(); }
      else toast.error(d.message ?? "Eroare");
    },
  });
  const addBreak = trpc.pontaj.addBreak.useMutation({
    onSuccess: () => { toast.success("Pauza înregistrată!"); utils.pontaj.today.invalidate(); },
  });

  const isCheckedIn = !!todayPontaj?.checkIn;
  const isCheckedOut = !!todayPontaj?.checkOut;

  // Month navigation
  const prevMonth = () => {
    if (viewMonth === 1) { setViewMonth(12); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 12) { setViewMonth(1); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // Monthly stats
  const totalDays = monthData?.length ?? 0;
  const totalMinutes = monthData?.reduce((acc, p) => acc + (p.totalMinutes ?? 0), 0) ?? 0;
  const presentDays = monthData?.filter(p => p.type === "birou" || p.type === "remote" || p.type === "deplasare").length ?? 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Pontaj zilnic</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {format(new Date(), "EEEE, d MMMM yyyy", { locale: ro })}
        </p>
      </div>

      {/* Today's Card */}
      <Card className="border-2 border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#FFCB09]" />
            Situația de astăzi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-muted rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <div className="flex items-center gap-1.5">
                <div className={`h-2 w-2 rounded-full ${isCheckedIn && !isCheckedOut ? "bg-green-500 animate-pulse" : isCheckedOut ? "bg-gray-400" : "bg-red-400"}`} />
                <span className="text-xs font-semibold">
                  {isCheckedOut ? "Zi încheiată" : isCheckedIn ? "Prezent" : "Neînregistrat"}
                </span>
              </div>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Check-in</p>
              <p className="text-sm font-semibold">
                {todayPontaj?.checkIn ? format(new Date(todayPontaj.checkIn), "HH:mm") : "—"}
              </p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Check-out</p>
              <p className="text-sm font-semibold">
                {todayPontaj?.checkOut ? format(new Date(todayPontaj.checkOut), "HH:mm") : "—"}
              </p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Total lucrat</p>
              <p className="text-sm font-semibold">
                {formatDuration(todayPontaj?.totalMinutes ?? 0)}
              </p>
            </div>
          </div>

          {/* Actions */}
          {!isCheckedIn && (
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Tip prezență" />
                </SelectTrigger>
                <SelectContent>
                  {PONTAJ_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => checkIn.mutate({ type: selectedType as any })}
                disabled={checkIn.isPending || isLoading}
                className="bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] font-semibold gap-2"
              >
                <LogIn className="h-4 w-4" />
                Check-in
              </Button>
            </div>
          )}

          {isCheckedIn && !isCheckedOut && (
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => checkOut.mutate()}
                disabled={checkOut.isPending}
                variant="outline"
                className="flex-1 border-[#221F1F] text-[#221F1F] font-semibold gap-2 hover:bg-[#221F1F] hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Check-out
              </Button>
              <Select value={String(breakMinutes)} onValueChange={v => setBreakMinutes(Number(v))}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[15, 30, 45, 60].map(m => (
                    <SelectItem key={m} value={String(m)}>{m} min pauză</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => addBreak.mutate({ minutes: breakMinutes })}
                disabled={addBreak.isPending}
                variant="outline"
                className="gap-2"
              >
                <Coffee className="h-4 w-4" />
                Adaugă pauza
              </Button>
            </div>
          )}

          {isCheckedOut && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 rounded-lg p-3">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">Zi de lucru completă — {formatDuration(todayPontaj?.totalMinutes ?? 0)} înregistrate</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Report */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[#FFCB09]" />
              Raport lunar
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center capitalize">
                {format(new Date(viewYear, viewMonth - 1), "MMMM yyyy", { locale: ro })}
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-muted rounded-lg p-3 text-center">
              <p className="text-lg font-bold">{presentDays}</p>
              <p className="text-xs text-muted-foreground">Zile prezent</p>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <p className="text-lg font-bold">{formatDuration(totalMinutes)}</p>
              <p className="text-xs text-muted-foreground">Total ore</p>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <p className="text-lg font-bold">{totalDays}</p>
              <p className="text-xs text-muted-foreground">Înregistrări</p>
            </div>
          </div>

          {/* Table */}
          {monthData && monthData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground">Data</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground">Tip</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground">Check-in</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground">Check-out</th>
                    <th className="text-right py-2 px-2 text-xs font-semibold text-muted-foreground">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {monthData.map((p) => (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-2 px-2 text-xs">
                        {format(new Date(p.date), "EEE, d MMM", { locale: ro })}
                      </td>
                      <td className="py-2 px-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${getTypeColor(p.type)}`}>
                          {PONTAJ_TYPES.find(t => t.value === p.type)?.label ?? p.type}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-xs tabular-nums">
                        {p.checkIn ? format(new Date(p.checkIn), "HH:mm") : "—"}
                      </td>
                      <td className="py-2 px-2 text-xs tabular-nums">
                        {p.checkOut ? format(new Date(p.checkOut), "HH:mm") : "—"}
                      </td>
                      <td className="py-2 px-2 text-xs text-right font-medium tabular-nums">
                        {formatDuration(p.totalMinutes ?? 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nu există înregistrări pentru această lună</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
