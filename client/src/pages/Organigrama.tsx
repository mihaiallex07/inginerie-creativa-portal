import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronDown, ChevronRight, Users, Building2, Mail, Briefcase } from "lucide-react";

type OrgUser = {
  id: number;
  name: string | null;
  avatarUrl: string | null;
  department: string | null;
  jobTitle: string | null;
  role: string;
  email: string;
  isActive: boolean;
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  angajat: "Angajat",
  colaborator: "Colaborator",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-[#FFCB09] text-[#221F1F]",
  angajat: "bg-blue-100 text-blue-800",
  colaborator: "bg-purple-100 text-purple-800",
};

const DEPT_COLORS = [
  "border-l-[#FFCB09]",
  "border-l-blue-400",
  "border-l-green-400",
  "border-l-purple-400",
  "border-l-rose-400",
  "border-l-orange-400",
  "border-l-teal-400",
  "border-l-indigo-400",
];

function PersonCard({ person, compact = false }: { person: OrgUser; compact?: boolean }) {
  const initials = person.name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() ?? "?";
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:shadow-sm transition-shadow ${compact ? "py-2" : ""}`}>
      <div className="h-10 w-10 rounded-full bg-[#FFCB09] flex items-center justify-center text-sm font-bold text-[#221F1F] shrink-0 overflow-hidden">
        {person.avatarUrl
          ? <img src={person.avatarUrl} alt={person.name ?? ""} className="h-full w-full object-cover" />
          : initials
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{person.name ?? "—"}</p>
        {person.jobTitle && (
          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
            <Briefcase className="h-3 w-3 shrink-0" />
            {person.jobTitle}
          </p>
        )}
        {!compact && (
          <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
            <Mail className="h-3 w-3 shrink-0" />
            {person.email}
          </p>
        )}
      </div>
      <Badge className={`text-[10px] shrink-0 border-0 ${ROLE_COLORS[person.role] ?? "bg-muted text-muted-foreground"}`}>
        {ROLE_LABELS[person.role] ?? person.role}
      </Badge>
    </div>
  );
}

function DepartmentGroup({
  department,
  people,
  colorClass,
  searchQuery,
}: {
  department: string;
  people: OrgUser[];
  colorClass: string;
  searchQuery: string;
}) {
  const [expanded, setExpanded] = useState(true);

  const filtered = searchQuery
    ? people.filter(
        (p) =>
          p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : people;

  if (filtered.length === 0) return null;

  return (
    <Card className={`border-l-4 ${colorClass} border-border overflow-hidden`}>
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">{department}</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {filtered.length} {filtered.length === 1 ? "persoană" : "persoane"}
          </Badge>
        </div>
        {expanded
          ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
          : <ChevronRight className="h-4 w-4 text-muted-foreground" />
        }
      </button>
      {expanded && (
        <CardContent className="px-4 pb-4 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {filtered.map((person) => (
              <PersonCard key={person.id} person={person} />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function Organigrama() {
  const { data: orgData, isLoading } = trpc.people.orgChart.useQuery();
  const [searchQuery, setSearchQuery] = useState("");

  const grouped = useMemo(() => {
    if (!orgData) return {};
    const map: Record<string, OrgUser[]> = {};
    for (const person of orgData) {
      const dept = person.department?.trim() || "Fără departament";
      if (!map[dept]) map[dept] = [];
      map[dept].push(person as OrgUser);
    }
    // Sort each department: admins first, then by name
    for (const dept of Object.keys(map)) {
      map[dept].sort((a, b) => {
        if (a.role === "admin" && b.role !== "admin") return -1;
        if (b.role === "admin" && a.role !== "admin") return 1;
        return (a.name ?? "").localeCompare(b.name ?? "", "ro");
      });
    }
    return map;
  }, [orgData]);

  const departments = useMemo(() => Object.keys(grouped).sort((a, b) => {
    if (a === "Fără departament") return 1;
    if (b === "Fără departament") return -1;
    return a.localeCompare(b, "ro");
  }), [grouped]);

  const totalActive = orgData?.length ?? 0;
  const totalDepts = departments.filter((d) => d !== "Fără departament").length;

  const filteredPeople = useMemo(() => {
    if (!searchQuery || !orgData) return [];
    return orgData.filter(
      (p) =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.email ?? "").toLowerCase().includes(searchQuery.toLowerCase())
    ) as OrgUser[];
  }, [searchQuery, orgData]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Organigramă</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Structura echipei Inginerie Creativă
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{totalActive} angajați activi</span>
          </div>
          <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{totalDepts} departamente</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Caută după nume, funcție, departament sau email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Search results overlay */}
      {searchQuery && filteredPeople.length > 0 && (
        <Card className="border-[#FFCB09] border">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground mb-2 font-medium">
              {filteredPeople.length} rezultat{filteredPeople.length !== 1 ? "e" : ""} găsit{filteredPeople.length !== 1 ? "e" : ""}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {filteredPeople.map((person) => (
                <PersonCard key={person.id} person={person} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {searchQuery && filteredPeople.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Niciun rezultat pentru "{searchQuery}"</p>
        </div>
      )}

      {/* Departments */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : !searchQuery ? (
        <div className="space-y-4">
          {departments.map((dept, idx) => (
            <DepartmentGroup
              key={dept}
              department={dept}
              people={grouped[dept]}
              colorClass={DEPT_COLORS[idx % DEPT_COLORS.length]}
              searchQuery={searchQuery}
            />
          ))}
          {departments.length === 0 && (
            <Card className="border-dashed border-border">
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-base font-medium text-foreground mb-1">Niciun angajat activ</p>
                <p className="text-sm text-muted-foreground">
                  Angajații vor apărea automat după ce completează câmpul Departament din profilul lor.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}
    </div>
  );
}
