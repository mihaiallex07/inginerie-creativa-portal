import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Clock,
  CalendarDays,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  MapPin,
  ChevronLeft,
  ChevronRight,
  BarChart3,
} from "lucide-react";

const LOCATION_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  bucuresti: { label: "București", emoji: "🏢", color: "bg-blue-100 text-blue-800" },
  cluj: { label: "Cluj", emoji: "🏢", color: "bg-indigo-100 text-indigo-800" },
  miercurea_ciuc: { label: "Miercurea-Ciuc", emoji: "🏢", color: "bg-violet-100 text-violet-800" },
  brasov: { label: "Brașov", emoji: "🏢", color: "bg-purple-100 text-purple-800" },
  eveniment: { label: "Eveniment", emoji: "📅", color: "bg-pink-100 text-pink-800" },
  deplasare: { label: "Deplasare", emoji: "🚗", color: "bg-orange-100 text-orange-800" },
  vizita_santier: { label: "Vizită Șantier", emoji: "🏗️", color: "bg-amber-100 text-amber-800" },
  telemunca: { label: "Telemuncă", emoji: "🏠", color: "bg-green-100 text-green-800" },
  concediu: { label: "Concediu", emoji: "🌴", color: "bg-teal-100 text-teal-800" },
  medical: { label: "Medical", emoji: "🏥", color: "bg-red-100 text-red-800" },
  liber_legal: { label: "Liber legal", emoji: "📋", color: "bg-gray-100 text-gray-700" },
  absent: { label: "Absent", emoji: "❌", color: "bg-red-50 text-red-600" },
  recuperare: { label: "Recuperare", emoji: "🔄", color: "bg-cyan-100 text-cyan-800" },
};

const MONTHS = [
  "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
  "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"
];

function fmtHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function DashboardHR() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data: stats, isLoading } = trpc.hrDashboard.stats.useQuery({ year, month });

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  const locationEntries = stats
    ? Object.entries(stats.pontaj.locationCounts).sort((a, b) => b[1] - a[1])
    : [];
  const totalLocationEntries = locationEntries.reduce((a, [, v]) => a + v, 0);

  return (
    
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-[#FFCB09]" />
              Dashboard HR
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Sumar pontaje și cereri de concediu pentru echipă</p>
          </div>
          {/* Month navigator */}
          <div className="flex items-center gap-2 bg-card border rounded-xl px-3 py-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold min-w-32 text-center">
              {MONTHS[month - 1]} {year}
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth} disabled={isCurrentMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-muted/40 rounded-xl animate-pulse" />)}
          </div>
        ) : !stats ? (
          <div className="text-center py-16 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Nu există date pentru perioada selectată.</p>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-[#FFCB09]/30 bg-[#FFCB09]/5">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Angajați activi</p>
                      <p className="text-3xl font-bold mt-1 text-foreground">{stats.totalUsers}</p>
                    </div>
                    <Users className="h-8 w-8 text-[#FFCB09] opacity-80" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-blue-50/50">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Total ore echipă</p>
                      <p className="text-3xl font-bold mt-1 text-blue-700">{fmtHours(stats.pontaj.totalMinutes)}</p>
                    </div>
                    <Clock className="h-8 w-8 text-blue-400 opacity-80" />
                  </div>
                  <p className="text-xs text-blue-600 mt-2">{stats.pontaj.uniqueUserDays} zile-prezență înregistrate</p>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50/50">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Cereri concediu</p>
                      <p className="text-3xl font-bold mt-1 text-green-700">{stats.leaveStats.total}</p>
                    </div>
                    <CalendarDays className="h-8 w-8 text-green-400 opacity-80" />
                  </div>
                  <p className="text-xs text-green-600 mt-2">{stats.leaveStats.totalZile} zile aprobate</p>
                </CardContent>
              </Card>

              <Card className={`border-yellow-200 ${stats.leaveStats.inAsteptare > 0 ? "bg-yellow-50/80" : "bg-yellow-50/30"}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Cereri în așteptare</p>
                      <p className="text-3xl font-bold mt-1 text-yellow-700">{stats.leaveStats.inAsteptare}</p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-400 opacity-80" />
                  </div>
                  {stats.leaveStats.inAsteptare > 0 && (
                    <p className="text-xs text-yellow-700 mt-2 font-medium">Necesită acțiune</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Row 2: Leave stats + Location distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Leave breakdown */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-[#FFCB09]" />
                    Cereri concediu — {MONTHS[month - 1]} {year}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: "În așteptare", value: stats.leaveStats.inAsteptare, icon: <Clock className="h-4 w-4 text-yellow-500" />, color: "text-yellow-700 bg-yellow-50 border-yellow-200" },
                    { label: "Aprobate", value: stats.leaveStats.aprobate, icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, color: "text-green-700 bg-green-50 border-green-200" },
                    { label: "Respinse", value: stats.leaveStats.respinse, icon: <XCircle className="h-4 w-4 text-red-500" />, color: "text-red-700 bg-red-50 border-red-200" },
                    { label: "Zile aprobate total", value: stats.leaveStats.totalZile, icon: <TrendingUp className="h-4 w-4 text-blue-500" />, color: "text-blue-700 bg-blue-50 border-blue-200" },
                  ].map(item => (
                    <div key={item.label} className={`flex items-center justify-between p-3 rounded-lg border ${item.color}`}>
                      <div className="flex items-center gap-2">
                        {item.icon}
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      <span className="text-lg font-bold">{item.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Location distribution */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#FFCB09]" />
                    Distribuție locații — {MONTHS[month - 1]} {year}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {locationEntries.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MapPin className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Nu există pontaje înregistrate.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {locationEntries.map(([loc, count]) => {
                        const cfg = LOCATION_LABELS[loc] ?? { label: loc, emoji: "📍", color: "bg-gray-100 text-gray-700" };
                        const pct = totalLocationEntries > 0 ? Math.round((count / totalLocationEntries) * 100) : 0;
                        return (
                          <div key={loc} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm flex items-center gap-1.5">
                                <span>{cfg.emoji}</span>
                                <span className="font-medium">{cfg.label}</span>
                              </span>
                              <span className="text-sm text-muted-foreground">{count} zile · {pct}%</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#FFCB09] rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Alerts: employees without today's timesheet */}
            {isCurrentMonth && stats.farapontajAzi.length > 0 && (
              <Card className="border-orange-200 bg-orange-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2 text-orange-700">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    Angajați fără pontaj azi ({stats.farapontajAzi.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {stats.farapontajAzi.map(u => (
                      <Badge key={u.id} variant="outline" className="text-xs border-orange-300 text-orange-700 bg-orange-50">
                        {u.name ?? `User #${u.id}`}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-orange-600 mt-3">
                    Acești angajați nu au înregistrat nicio intrare de pontaj pentru ziua de astăzi.
                  </p>
                </CardContent>
              </Card>
            )}

            {isCurrentMonth && stats.farapontajAzi.length === 0 && (
              <Card className="border-green-200 bg-green-50/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  <p className="text-sm text-green-700 font-medium">
                    Toți angajații activi au pontaj înregistrat pentru astăzi.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    
  );
}
