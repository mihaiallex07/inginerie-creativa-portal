import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  FolderOpen,
  Lightbulb,
  Newspaper,
  Timer,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  Cake,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { useState } from "react";

const GREETINGS = ["Bună dimineața", "Bună ziua", "Bună seara"];
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return GREETINGS[0];
  if (h < 18) return GREETINGS[1];
  return GREETINGS[2];
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: todayPontaj, isLoading: pontajLoading } = trpc.pontaj.today.useQuery();
  const { data: runningTimer } = trpc.timeTracking.runningTimer.useQuery();
  const { data: newsData } = trpc.news.list.useQuery({ limit: 3 });
  const { data: projectsData } = trpc.projects.list.useQuery({ status: "activ" });
  const { data: proposalsData } = trpc.proposals.list.useQuery({ status: "deschisa" });
  const { data: birthdaysData } = trpc.people.upcomingBirthdays.useQuery({ daysAhead: 30 });


  const firstName = user?.name?.split(" ")[0] ?? "Coleg";
  const today = format(new Date(), "EEEE, d MMMM yyyy", { locale: ro });

  const isCheckedIn = !!todayPontaj?.checkIn;
  const isCheckedOut = !!todayPontaj?.checkOut;

  // Calculate worked time
  const [now, setNow] = useState(new Date());
  // Update every minute
  useState(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  });

  let workedMinutes = todayPontaj?.totalMinutes ?? 0;
  if (isCheckedIn && !isCheckedOut && todayPontaj?.checkIn) {
    const elapsed = Math.floor((now.getTime() - new Date(todayPontaj.checkIn).getTime()) / 60000);
    workedMinutes = Math.max(0, elapsed - (todayPontaj.breakMinutes ?? 0));
  }

  const workNorm = 8 * 60;
  const workedPercent = Math.min(100, Math.round((workedMinutes / workNorm) * 100));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {getGreeting()}, {firstName} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1 capitalize">{today}</p>
        </div>
        <div className="flex items-center gap-2 bg-muted rounded-full px-3 py-1.5">
          <div className="h-6 w-6 rounded-full bg-[#FFCB09] flex items-center justify-center text-xs font-bold text-[#221F1F]">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
        </div>
      </div>

      {/* Pontaj Shortcut */}
      <Card
        className="border-2 border-border overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setLocation("/pontaj")}
      >
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row">
            {/* Status */}
            <div className="flex-1 p-4 border-b sm:border-b-0 sm:border-r border-border">
              <div className="flex items-center gap-2 mb-1">
                <div className={`h-2 w-2 rounded-full ${isCheckedIn && !isCheckedOut ? "bg-green-500 animate-pulse" : isCheckedOut ? "bg-blue-400" : "bg-gray-300"}`} />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {isCheckedOut ? "Zi încheiata" : isCheckedIn ? "Prezent — în curs" : "Neînregistrat azi"}
                </span>
              </div>
              {isCheckedIn && todayPontaj?.checkIn && (
                <p className="text-sm text-muted-foreground">
                  Intrare: <span className="font-semibold text-foreground">
                    {format(new Date(todayPontaj.checkIn), "HH:mm")}
                  </span>
                  {isCheckedOut && todayPontaj?.checkOut && (
                    <> &rarr; Ieșire: <span className="font-semibold text-foreground">{format(new Date(todayPontaj.checkOut), "HH:mm")}</span></>
                  )}
                </p>
              )}
            </div>

            {/* Time worked */}
            <div className="flex-1 p-4 border-b sm:border-b-0 sm:border-r border-border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Timp lucrat azi</p>
              <p className="text-2xl font-bold text-foreground tabular-nums">{formatDuration(workedMinutes)}</p>
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#FFCB09] rounded-full transition-all"
                  style={{ width: `${workedPercent}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Normă: 8h 00min</p>
            </div>

            {/* Navigate CTA */}
            <div className="p-4 flex items-center justify-center">
              <div className="flex flex-col items-center gap-1.5 text-center">
                <div className="h-10 w-10 rounded-full bg-[#FFCB09]/15 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-[#FFCB09]" />
                </div>
                <span className="text-xs text-muted-foreground">Pontaj zilnic</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Running Timer */}
      {runningTimer && (
        <Card className="border-[#FFCB09] border-2 bg-yellow-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-[#FFCB09] flex items-center justify-center">
                <Timer className="h-4 w-4 text-[#221F1F]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#221F1F]">
                  {runningTimer.taskName ?? "Activitate în desfășurare"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {runningTimer.activityType} · {runningTimer.isBillable ? "Facturabil" : "Non-facturabil"}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setLocation("/time-tracking")}
              className="border-[#221F1F] text-[#221F1F] text-xs"
            >
              Gestionează
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow border-border"
          onClick={() => setLocation("/documente")}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Documentele mele</p>
                <p className="text-xs text-muted-foreground mt-0.5">Contract, fișe evaluare, adeverințe</p>
              </div>
              <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <Badge variant="outline" className="mt-3 text-xs">Confidențial</Badge>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow border-border"
          onClick={() => setLocation("/proiecte")}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Proiecte active</p>
                <p className="text-xs text-muted-foreground mt-0.5">Acces direct Google Drive</p>
              </div>
              <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center">
                <FolderOpen className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <Badge className="mt-3 text-xs bg-green-100 text-green-800 hover:bg-green-100 border-0">
              {projectsData?.length ?? 0} proiecte
            </Badge>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow border-border"
          onClick={() => setLocation("/propuneri")}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Propuneri deschise</p>
                <p className="text-xs text-muted-foreground mt-0.5">Idei de îmbunătățire în analiză</p>
              </div>
              <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <Lightbulb className="h-4 w-4 text-amber-600" />
              </div>
            </div>
            <Badge className="mt-3 text-xs bg-amber-100 text-amber-800 hover:bg-amber-100 border-0">
              {proposalsData?.length ?? 0} în așteptare
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Zile de naștere */}
      <Card className="border-border overflow-hidden">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Cake className="h-4 w-4 text-[#FFCB09]" />
            Zile de naștere în următoarele 30 de zile
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {!birthdaysData || birthdaysData.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-2">
              Niciun coleg nu are data nașterii înregistrată în profil.
            </p>
          ) : (
            <div className="space-y-2">
              {birthdaysData.slice(0, 5).map((person) => {
                const bd = new Date(person.birthDate);
                const dayLabel = person.isToday
                  ? "🎉 Azi!"
                  : person.daysUntil === 1
                  ? "Mâine"
                  : `în ${person.daysUntil} zile`;
                const initials = person.name?.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase() ?? "?";
                return (
                  <div key={person.id} className={`flex items-center gap-3 p-2.5 rounded-lg ${
                    person.isToday ? "bg-[#FFCB09]/10 border border-[#FFCB09]/30" : "bg-muted/40"
                  }`}>
                    <div className="h-9 w-9 rounded-full bg-[#FFCB09] flex items-center justify-center text-xs font-bold text-[#221F1F] shrink-0 overflow-hidden">
                      {person.avatarUrl
                        ? <img src={person.avatarUrl} alt={person.name ?? ""} className="h-full w-full object-cover" />
                        : initials
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{person.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {person.jobTitle ?? person.department ?? "Angajat"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xs font-semibold ${
                        person.isToday ? "text-[#FFCB09]" : "text-muted-foreground"
                      }`}>{dayLabel}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {bd.getDate()} {["ian","feb","mar","apr","mai","iun","iul","aug","sep","oct","nov","dec"][bd.getMonth()]}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* News */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-foreground">Știri recente</h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground gap-1"
            onClick={() => setLocation("/stiri")}
          >
            Vezi toate <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
        <div className="space-y-2">
          {newsData && newsData.length > 0 ? (
            newsData.map(({ news: item }) => (
              <Card
                key={item.id}
                className="cursor-pointer hover:shadow-sm transition-shadow border-border"
                onClick={() => setLocation(`/stiri/${item.id}`)}
              >
                <CardContent className="p-4 flex gap-4">
                  <div className="shrink-0 text-xs text-muted-foreground w-12 text-right">
                    {format(new Date(item.publishedAt ?? item.createdAt), "d MMM", { locale: ro })}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {item.isImportant && <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
                      {item.isPinned && <span className="text-[10px] bg-[#FFCB09] text-[#221F1F] px-1.5 py-0.5 rounded font-semibold">FIXAT</span>}
                      <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                    </div>
                    {item.excerpt && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{item.excerpt}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-dashed border-border">
              <CardContent className="p-6 text-center">
                <Newspaper className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nu există știri recente</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Quick Access */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">Acces rapid</h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Normativ C107 – Termotehnica", color: "bg-blue-500", path: "/biblioteca" },
            { label: "Procedura cerere concediu", color: "bg-green-500", path: "/cereri" },
            { label: "Fișa postului meu", color: "bg-amber-500", path: "/documente" },
            { label: "Raportare incident", color: "bg-red-500", path: "/formulare" },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => setLocation(item.path)}
              className="flex items-center gap-2.5 p-3 rounded-lg border border-border hover:bg-muted transition-colors text-left"
            >
              <div className={`h-2 w-2 rounded-full ${item.color} shrink-0`} />
              <span className="text-xs font-medium text-foreground">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
