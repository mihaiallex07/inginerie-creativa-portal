import { trpc } from "../lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { useState } from "react";
import { useLocation } from "wouter";
import { BookOpen, Search, CheckCircle2, Clock } from "lucide-react";

const DEPARTMENTS = [
  { value: "all", label: "Toate departamentele" },
  { value: "arhitectura", label: "Arhitectură" },
  { value: "structura", label: "Structură" },
  { value: "instalatii", label: "Instalații" },
  { value: "executie", label: "Execuție" },
  { value: "hr", label: "HR" },
  { value: "administrativ", label: "Administrativ" },
  { value: "it", label: "IT" },
];

export default function Procese() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");

  const { data: processes, isLoading } = trpc.processes.list.useQuery({
    department: department === "all" ? undefined : department,
  });

  const filtered = processes?.filter(({ process: p }) =>
    !search || p.title.toLowerCase().includes(search.toLowerCase()) || (p.content ?? "").toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Procese & Proceduri</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Biblioteca de procese interne</p>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Caută procese..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={department} onValueChange={setDepartment}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Departament" />
          </SelectTrigger>
          <SelectContent>
            {DEPARTMENTS.map(d => <SelectItem key={d.value || "all"} value={d.value}>{d.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-2">
              {filtered.map(({ process: p, owner, userConfirmed }: any) => (
            <Card
              key={p.id}
              className="cursor-pointer hover:shadow-sm transition-shadow border-border"
              onClick={() => setLocation(`/procese/${p.id}`)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-foreground truncate">{p.title}</p>
                    {p.isMandatoryRead && (
                      <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-semibold shrink-0">Obligatoriu</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {p.department && <span>{DEPARTMENTS.find(d => d.value === p.department)?.label ?? p.department}</span>}
                    {p.department && <span>·</span>}
                    <span>v{p.version}</span>
                    <span>·</span>
                    <span>Actualizat {format(new Date(p.updatedAt), "d MMM yyyy", { locale: ro })}</span>
                    {owner && <><span>·</span><span>{owner.name}</span></>}
                  </div>
                </div>
                {userConfirmed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                ) : p.isMandatoryRead ? (
                  <Clock className="h-5 w-5 text-amber-500 shrink-0" />
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nu există procese{search ? " pentru căutarea ta" : ""}</p>
        </div>
      )}
    </div>
  );
}
