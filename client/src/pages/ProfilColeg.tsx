import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  User, Mail, Phone, Briefcase, Building2, Pencil, Save, X,
  MapPin, CreditCard, Heart, AlertCircle, Calendar, Lock, Eye, EyeOff,
  ShieldCheck, Home, Banknote, UserCheck, ArrowLeft, Crown, Users, Handshake,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation, useParams } from "wouter";
import { useState, useEffect } from "react";

const ROLE_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  admin: { label: "Administrator", icon: Crown, color: "bg-red-100 text-red-700 border-red-200" },
  coordonator: { label: "Coordonator", icon: Users, color: "bg-blue-100 text-blue-700 border-blue-200" },
  angajat: { label: "Angajat", icon: Briefcase, color: "bg-[#FFCB09]/10 text-[#FFCB09] border-[#FFCB09]/50" },
  colaborator: { label: "Colaborator", icon: Handshake, color: "bg-gray-100 text-gray-600 border-gray-200" },
};

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const DEPARTMENTS = [
  "Proiectare Arhitectură",
  "Proiectare Structură",
  "Proiectare Instalații",
  "Vânzări",
  "Execuție",
];

function SectionHeader({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="h-9 w-9 rounded-lg bg-[#FFCB09]/15 flex items-center justify-center shrink-0">
        <Icon className="h-4.5 w-4.5 text-[#FFCB09]" style={{ height: "18px", width: "18px" }} />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</Label>
      <p className="text-sm text-foreground py-1.5 min-h-[36px]">
        {value || <span className="text-muted-foreground italic">Necompletat</span>}
      </p>
    </div>
  );
}

function EditField({ label, value, onChange, type = "text", placeholder, sensitive, showSensitive, onToggleSensitive }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  sensitive?: boolean;
  showSensitive?: boolean;
  onToggleSensitive?: () => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</Label>
      <div className="relative">
        <Input
          type={sensitive && !showSensitive ? "password" : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? label}
          className={`h-9 text-sm ${sensitive ? "pr-9" : ""}`}
        />
        {sensitive && onToggleSensitive && (
          <button
            type="button"
            onClick={onToggleSensitive}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showSensitive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

export default function ProfilColeg() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const userId = parseInt(params.id ?? "0", 10);
  const isAdmin = user?.role === "admin";

  const [editing, setEditing] = useState(false);
  const [showSensitive, setShowSensitive] = useState(false);

  const { data: colleague, isLoading, refetch } = trpc.profile.viewColleague.useQuery(
    { userId },
    { enabled: !!user && userId > 0 }
  );

  // Admin edit form state
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (colleague && (colleague as any).isFullAccess) {
      const fmt = (d: any) => d ? String(d).slice(0, 10) : "";
      const c = colleague as any;
      setForm({
        name: c.name ?? "",
        phone: c.phone ?? "",
        phoneMobile: c.phoneMobile ?? "",
        department: c.department ?? "",
        jobTitle: c.jobTitle ?? "",
        birthDate: fmt(c.birthDate),
        hireDate: fmt(c.hireDate),
        addressBuletin: c.addressBuletin ?? "",
        addressSecondary: c.addressSecondary ?? "",
        city: c.city ?? "",
        cnp: c.cnp ?? "",
        ciSeries: c.ciSeries ?? "",
        ciNumber: c.ciNumber ?? "",
        ciExpiry: fmt(c.ciExpiry),
        ciIssuedBy: c.ciIssuedBy ?? "",
        iban: c.iban ?? "",
        bankName: c.bankName ?? "",
        emergencyContact: c.emergencyContact ?? "",
        emergencyPhone: c.emergencyPhone ?? "",
        emergencyRelation: c.emergencyRelation ?? "",
        bloodType: c.bloodType ?? "",
        allergies: c.allergies ?? "",
        profileNotes: c.profileNotes ?? "",
        workHoursPerDay: c.workHoursPerDay ?? "8.00",
      });
    }
  }, [colleague]);

  const updateMutation = trpc.profile.adminUpdateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profil actualizat cu succes");
      setEditing(false);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = () => {
    updateMutation.mutate({
      userId,
      name: form.name || undefined,
      phone: form.phone || null,
      phoneMobile: form.phoneMobile || null,
      department: form.department || null,
      jobTitle: form.jobTitle || null,
      birthDate: form.birthDate || null,
      hireDate: form.hireDate || null,
      addressBuletin: form.addressBuletin || null,
      addressSecondary: form.addressSecondary || null,
      city: form.city || null,
      cnp: form.cnp || null,
      ciSeries: form.ciSeries || null,
      ciNumber: form.ciNumber || null,
      ciExpiry: form.ciExpiry || null,
      ciIssuedBy: form.ciIssuedBy || null,
      iban: form.iban || null,
      bankName: form.bankName || null,
      emergencyContact: form.emergencyContact || null,
      emergencyPhone: form.emergencyPhone || null,
      emergencyRelation: form.emergencyRelation || null,
      bloodType: (form.bloodType as any) || null,
      allergies: form.allergies || null,
      profileNotes: form.profileNotes || null,
      workHoursPerDay: form.workHoursPerDay || null,
    });
  };

  const f = (key: string) => ({
    value: form[key] ?? "",
    onChange: (v: string) => setForm(p => ({ ...p, [key]: v })),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFCB09]" />
      </div>
    );
  }

  if (!colleague) {
    return (
      <div className="max-w-3xl mx-auto py-10 text-center">
        <p className="text-muted-foreground">Utilizatorul nu a fost găsit.</p>
        <Button variant="outline" className="mt-4" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Înapoi
        </Button>
      </div>
    );
  }

  const c = colleague as any;
  const isFullAccess = c.isFullAccess === true;
  const initials = c.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) ?? "?";
  const roleInfo = ROLE_LABELS[c.role] ?? ROLE_LABELS.angajat;
  const RoleIcon = roleInfo.icon;
  const fmt = (d: any) => d ? new Date(d).toLocaleDateString("ro-RO", { day: "2-digit", month: "long", year: "numeric" }) : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Profil angajat</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isFullAccess ? "Acces complet — Administrator" : "Informații de bază"}
            </p>
          </div>
        </div>
        {isFullAccess && (
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setEditing(false)} className="gap-1.5">
                  <X className="h-3.5 w-3.5" /> Anulează
                </Button>
                <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}
                  className="gap-1.5 bg-[#FFCB09] hover:bg-[#f0bc00] text-[#221F1F]">
                  <Save className="h-3.5 w-3.5" />
                  {updateMutation.isPending ? "Se salvează..." : "Salvează"}
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-1.5">
                <Pencil className="h-3.5 w-3.5" /> Editează profil
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Avatar + info de bază */}
      <Card className="border-border">
        <CardContent className="p-6">
          <div className="flex items-start gap-5">
            <div className="h-16 w-16 rounded-full bg-[#FFCB09] flex items-center justify-center text-2xl font-bold text-[#221F1F] shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              {editing ? (
                <Input
                  value={form.name ?? ""}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="text-lg font-bold h-9 mb-2"
                  placeholder="Nume complet"
                />
              ) : (
                <h2 className="text-lg font-bold text-foreground truncate">{c.name}</h2>
              )}
              <div className="flex flex-wrap gap-2 mt-1">
                <Badge variant="outline" className={`text-xs ${roleInfo.color} gap-1`}>
                  <RoleIcon className="h-3 w-3" />
                  {roleInfo.label}
                </Badge>
                {c.department && (
                  <Badge variant="outline" className="text-xs">{c.department}</Badge>
                )}
                {c.jobTitle && (
                  <Badge variant="outline" className="text-xs">{c.jobTitle}</Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                {c.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> {c.email}
                  </span>
                )}
                {c.hireDate && (
                  <span className="flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5" />
                    Angajat din {fmt(c.hireDate)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informații de contact — vizibile pentru toți */}
      <Card className="border-border">
        <CardContent className="p-6">
          <SectionHeader icon={Phone} title="Contact" subtitle="Informații de contact vizibile colegilor" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {editing ? (
              <>
                <EditField label="Telefon mobil" {...f("phoneMobile")} type="tel" placeholder="+40 7xx xxx xxx" />
                <EditField label="Telefon de serviciu" {...f("phone")} type="tel" placeholder="+40 7xx xxx xxx" />
              </>
            ) : (
              <>
                <InfoField label="Telefon mobil" value={c.phoneMobile ?? c.phone} />
                <InfoField label="Telefon de serviciu" value={c.phone} />
              </>
            )}
            {editing ? (
              <EditField label="Oraș" {...f("city")} placeholder="ex: Cluj-Napoca" />
            ) : (
              <InfoField label="Oraș" value={c.city} />
            )}
            {editing ? (
              <EditField label="Data nașterii" {...f("birthDate")} type="date" />
            ) : (
              <InfoField label="Data nașterii" value={fmt(c.birthDate)} />
            )}
          </div>
        </CardContent>
      </Card>

      {/* ─── Secțiuni doar pentru admin ─── */}
      {isFullAccess && (
        <>
          {/* Informații profesionale */}
          <Card className="border-border">
            <CardContent className="p-6">
              <SectionHeader icon={Briefcase} title="Informații profesionale" subtitle="Funcție, departament, program" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {editing ? (
                  <>
                    <EditField label="Funcție / Post" {...f("jobTitle")} placeholder="ex: Inginer Proiectant" />
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Departament</Label>
                      <Select value={form.department ?? ""} onValueChange={v => setForm(p => ({ ...p, department: v }))}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Selectează departamentul" />
                        </SelectTrigger>
                        <SelectContent>
                          {DEPARTMENTS.map(d => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <EditField label="Data angajării" {...f("hireDate")} type="date" />
                    <EditField label="Ore lucru/zi" {...f("workHoursPerDay")} type="number" placeholder="8.00" />
                  </>
                ) : (
                  <>
                    <InfoField label="Funcție / Post" value={c.jobTitle} />
                    <InfoField label="Departament" value={c.department} />
                    <InfoField label="Data angajării" value={fmt(c.hireDate)} />
                    <InfoField label="Ore lucru/zi" value={c.workHoursPerDay ?? "8.00"} />
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Adrese */}
          <Card className="border-border">
            <CardContent className="p-6">
              <SectionHeader icon={Home} title="Adrese" subtitle="Adresa din buletin și reședință actuală" />
              {editing ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Adresă din buletin</Label>
                    <Textarea
                      value={form.addressBuletin ?? ""}
                      onChange={e => setForm(p => ({ ...p, addressBuletin: e.target.value }))}
                      placeholder="Strada, număr, bloc, apartament, localitate, județ"
                      className="text-sm resize-none" rows={2}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Adresă secundară</Label>
                    <Textarea
                      value={form.addressSecondary ?? ""}
                      onChange={e => setForm(p => ({ ...p, addressSecondary: e.target.value }))}
                      placeholder="Reședință actuală (dacă diferă)"
                      className="text-sm resize-none" rows={2}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  <InfoField label="Adresă din buletin" value={c.addressBuletin} />
                  <InfoField label="Adresă secundară" value={c.addressSecondary} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Date CI */}
          <Card className="border-border border-amber-200/40">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <SectionHeader icon={CreditCard} title="Date act de identitate" subtitle="Date confidențiale" />
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  <span>Confidențial</span>
                  <button type="button" onClick={() => setShowSensitive(p => !p)}
                    className="ml-1 text-[#FFCB09] hover:text-[#f0bc00] transition-colors">
                    {showSensitive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {editing ? (
                  <>
                    <EditField label="CNP" {...f("cnp")} sensitive showSensitive={showSensitive} onToggleSensitive={() => setShowSensitive(p => !p)} placeholder="13 cifre" />
                    <div className="grid grid-cols-2 gap-2">
                      <EditField label="Serie CI" {...f("ciSeries")} sensitive showSensitive={showSensitive} placeholder="ex: CJ" />
                      <EditField label="Număr CI" {...f("ciNumber")} sensitive showSensitive={showSensitive} placeholder="6 cifre" />
                    </div>
                    <EditField label="Data expirării CI" {...f("ciExpiry")} type="date" />
                    <EditField label="Eliberat de" {...f("ciIssuedBy")} placeholder="ex: SPCLEP Cluj-Napoca" />
                  </>
                ) : (
                  <>
                    <InfoField label="CNP" value={showSensitive ? c.cnp : c.cnp ? "••••••••••••" : null} />
                    <InfoField label="CI" value={showSensitive ? `${c.ciSeries ?? ""} ${c.ciNumber ?? ""}`.trim() || null : c.ciSeries ? "•••• ••••••" : null} />
                    <InfoField label="Data expirării CI" value={fmt(c.ciExpiry)} />
                    <InfoField label="Eliberat de" value={c.ciIssuedBy} />
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Date financiare */}
          <Card className="border-border border-amber-200/40">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <SectionHeader icon={Banknote} title="Date financiare" subtitle="IBAN și bancă" />
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3 w-3" />
                  <span>Confidențial</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {editing ? (
                  <>
                    <EditField label="IBAN" {...f("iban")} sensitive showSensitive={showSensitive} onToggleSensitive={() => setShowSensitive(p => !p)} placeholder="RO49AAAA1B31007593840000" />
                    <EditField label="Bancă" {...f("bankName")} placeholder="ex: Banca Transilvania" />
                  </>
                ) : (
                  <>
                    <InfoField label="IBAN" value={showSensitive ? c.iban : c.iban ? "•••• •••• •••• ••••" : null} />
                    <InfoField label="Bancă" value={c.bankName} />
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact urgență */}
          <Card className="border-border">
            <CardContent className="p-6">
              <SectionHeader icon={AlertCircle} title="Contact de urgență" subtitle="Persoana de contactat în caz de urgență" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {editing ? (
                  <>
                    <EditField label="Nume complet" {...f("emergencyContact")} placeholder="ex: Maria Ionescu" />
                    <EditField label="Telefon" {...f("emergencyPhone")} type="tel" placeholder="+40 7xx xxx xxx" />
                    <EditField label="Relație" {...f("emergencyRelation")} placeholder="ex: Soție, Mamă" />
                  </>
                ) : (
                  <>
                    <InfoField label="Nume complet" value={c.emergencyContact} />
                    <InfoField label="Telefon" value={c.emergencyPhone} />
                    <InfoField label="Relație" value={c.emergencyRelation} />
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Date medicale */}
          <Card className="border-border">
            <CardContent className="p-6">
              <SectionHeader icon={Heart} title="Date medicale" subtitle="Utile în situații de urgență" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {editing ? (
                  <>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Grupă sanguină</Label>
                      <Select value={form.bloodType || "none"} onValueChange={v => setForm(p => ({ ...p, bloodType: v === "none" ? "" : v }))}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Selectează grupa" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">— Nespecificat —</SelectItem>
                          {BLOOD_TYPES.map(bt => (
                            <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <EditField label="Alergii cunoscute" {...f("allergies")} placeholder="ex: Penicilină, Polen, Latex" />
                  </>
                ) : (
                  <>
                    <InfoField label="Grupă sanguină" value={c.bloodType} />
                    <InfoField label="Alergii cunoscute" value={c.allergies} />
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Note interne */}
          <Card className="border-border">
            <CardContent className="p-6">
              <SectionHeader icon={Lock} title="Note interne" subtitle="Vizibile doar administratorilor" />
              {editing ? (
                <Textarea
                  value={form.profileNotes ?? ""}
                  onChange={e => setForm(p => ({ ...p, profileNotes: e.target.value }))}
                  placeholder="Note interne despre angajat..."
                  className="text-sm resize-none" rows={3}
                />
              ) : (
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {c.profileNotes || <span className="text-muted-foreground italic">Nicio notă</span>}
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
