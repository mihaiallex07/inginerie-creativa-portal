import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  User, Mail, Phone, Briefcase, Building2, LogOut, Pencil, Save, X,
  MapPin, CreditCard, Heart, AlertCircle, Calendar, Lock, Eye, EyeOff,
  ShieldCheck, Home, Banknote, UserCheck,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  coordonator: "Coordonator",
  angajat: "Angajat",
  colaborator: "Colaborator",
};

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const DEPARTMENTS = [
  "Proiectare Arhitectură",
  "Proiectare Structură",
  "Proiectare Instalații",
  "Vânzări",
  "Execuție",
];

type ProfileData = {
  name: string;
  phone: string;
  phoneMobile: string;
  department: string;
  jobTitle: string;
  birthDate: string;   // stored as DD/MM/YYYY for display, converted to YYYY-MM-DD on save
  hireDate: string;    // stored as DD/MM/YYYY for display
  addressBuletin: string;
  addressSecondary: string;
  city: string;
  cnp: string;
  ciSeries: string;
  ciNumber: string;
  ciExpiry: string;    // stored as DD/MM/YYYY for display
  ciIssuedBy: string;
  iban: string;
  bankName: string;
  emergencyContact: string;
  emergencyPhone: string;
  emergencyRelation: string;
  bloodType: string;
  allergies: string;
  profileNotes: string;
};

/** Convert a DB date value (Date object or ISO string) to DD/MM/YYYY display format */
function dbToDisplay(d: any): string {
  if (!d) return "";
  let iso: string;
  if (d instanceof Date) {
    iso = d.toISOString().slice(0, 10);
  } else {
    iso = String(d).slice(0, 10);
  }
  // iso is YYYY-MM-DD
  const parts = iso.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return "";
}

/** Convert DD/MM/YYYY display format to YYYY-MM-DD for the backend */
function displayToIso(display: string): string | null {
  if (!display) return null;
  const parts = display.split("/");
  if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return null;
}

/** Validate DD/MM/YYYY format and that date is in the past */
function isValidPastDate(display: string): boolean {
  const iso = displayToIso(display);
  if (!iso) return false;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return false;
  return d < new Date();
}

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

/** A field row that shows read-only text when not editing, and an input when editing */
function FieldRow({
  label, value, editValue, onChange, placeholder, readOnly,
  sensitive, showSensitive, onToggleSensitive,
  maxLength, autoComplete, hint,
}: {
  label: string;
  value?: string | null;
  editValue: string;
  onChange: (v: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  sensitive?: boolean;
  showSensitive?: boolean;
  onToggleSensitive?: () => void;
  maxLength?: number;
  autoComplete?: string;
  hint?: string;
}) {
  if (readOnly) {
    return (
      <div className="space-y-1">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</Label>
        <p className="text-sm text-foreground py-1.5 min-h-[2rem]">
          {sensitive && !showSensitive
            ? (editValue ? "••••••••••••••" : <span className="text-muted-foreground italic">Necompletat</span>)
            : (editValue || <span className="text-muted-foreground italic">Necompletat</span>)
          }
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <div className="relative">
        <Input
          type={sensitive && !showSensitive ? "password" : "text"}
          value={editValue}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? label}
          maxLength={maxLength}
          autoComplete={autoComplete ?? "off"}
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

/** A date field that uses DD/MM/YYYY text format instead of browser's native date picker */
function DateFieldRow({
  label, editValue, onChange, readOnly, placeholder,
}: {
  label: string;
  editValue: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
  placeholder?: string;
}) {
  if (readOnly) {
    return (
      <div className="space-y-1">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</Label>
        <p className="text-sm text-foreground py-1.5 min-h-[2rem]">
          {editValue || <span className="text-muted-foreground italic">Necompletat</span>}
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</Label>
      <Input
        type="text"
        value={editValue}
        onChange={e => {
          // Auto-insert slashes for DD/MM/YYYY
          let v = e.target.value.replace(/[^\d/]/g, "");
          // Remove existing slashes to re-insert them
          const digits = v.replace(/\//g, "");
          if (digits.length <= 2) v = digits;
          else if (digits.length <= 4) v = `${digits.slice(0,2)}/${digits.slice(2)}`;
          else v = `${digits.slice(0,2)}/${digits.slice(2,4)}/${digits.slice(4,8)}`;
          onChange(v);
        }}
        placeholder={placeholder ?? "ZZ/LL/AAAA"}
        maxLength={10}
        autoComplete="off"
        className="h-9 text-sm"
      />
    </div>
  );
}

export default function Profil() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [editing, setEditing] = useState(false);
  const [showSensitive, setShowSensitive] = useState(false);
  const [form, setForm] = useState<ProfileData>({
    name: "", phone: "", phoneMobile: "", department: "", jobTitle: "",
    birthDate: "", hireDate: "", addressBuletin: "", addressSecondary: "",
    city: "", cnp: "", ciSeries: "", ciNumber: "", ciExpiry: "", ciIssuedBy: "",
    iban: "", bankName: "", emergencyContact: "", emergencyPhone: "",
    emergencyRelation: "", bloodType: "", allergies: "", profileNotes: "",
  });

  const { data: profile, refetch } = trpc.profile.getMyProfile.useQuery(undefined, {
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name ?? "",
        phone: profile.phone ?? "",
        phoneMobile: (profile as any).phoneMobile ?? "",
        department: profile.department ?? "",
        jobTitle: profile.jobTitle ?? "",
        birthDate: dbToDisplay((profile as any).birthDate),
        hireDate: dbToDisplay((profile as any).hireDate),
        addressBuletin: (profile as any).addressBuletin ?? "",
        addressSecondary: (profile as any).addressSecondary ?? "",
        city: (profile as any).city ?? "",
        cnp: (profile as any).cnp ?? "",
        ciSeries: (profile as any).ciSeries ?? "",
        ciNumber: (profile as any).ciNumber ?? "",
        ciExpiry: dbToDisplay((profile as any).ciExpiry),
        ciIssuedBy: (profile as any).ciIssuedBy ?? "",
        iban: (profile as any).iban ?? "",
        bankName: (profile as any).bankName ?? "",
        emergencyContact: (profile as any).emergencyContact ?? "",
        emergencyPhone: (profile as any).emergencyPhone ?? "",
        emergencyRelation: (profile as any).emergencyRelation ?? "",
        bloodType: (profile as any).bloodType ?? "",
        allergies: (profile as any).allergies ?? "",
        profileNotes: (profile as any).profileNotes ?? "",
      });
    }
  }, [profile]);

  const updateMutation = trpc.profile.updateMyProfile.useMutation({
    onSuccess: () => {
      toast.success("Profil actualizat cu succes");
      setEditing(false);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = () => {
    // Validate dates before sending
    if (form.birthDate && !isValidPastDate(form.birthDate)) {
      toast.error("Data nașterii trebuie să fie în format ZZ/LL/AAAA și în trecut");
      return;
    }
    if (form.hireDate && !displayToIso(form.hireDate)) {
      toast.error("Data angajării trebuie să fie în format ZZ/LL/AAAA");
      return;
    }
    if (form.ciExpiry && !displayToIso(form.ciExpiry)) {
      toast.error("Data expirării CI trebuie să fie în format ZZ/LL/AAAA");
      return;
    }
    updateMutation.mutate({
      name: form.name || undefined,
      phone: form.phone || null,
      phoneMobile: form.phoneMobile || null,
      department: form.department || null,
      jobTitle: form.jobTitle || null,
      birthDate: displayToIso(form.birthDate),
      hireDate: displayToIso(form.hireDate),
      addressBuletin: form.addressBuletin || null,
      addressSecondary: form.addressSecondary || null,
      city: form.city || null,
      cnp: form.cnp || null,
      ciSeries: form.ciSeries || null,
      ciNumber: form.ciNumber || null,
      ciExpiry: displayToIso(form.ciExpiry),
      ciIssuedBy: form.ciIssuedBy || null,
      iban: form.iban || null,
      bankName: form.bankName || null,
      emergencyContact: form.emergencyContact || null,
      emergencyPhone: form.emergencyPhone || null,
      emergencyRelation: form.emergencyRelation || null,
      bloodType: (form.bloodType as any) || null,
      allergies: form.allergies || null,
      profileNotes: form.profileNotes || null,
    });
  };

  const handleCancelEdit = () => {
    // Reset form to current profile data
    if (profile) {
      setForm({
        name: profile.name ?? "",
        phone: profile.phone ?? "",
        phoneMobile: (profile as any).phoneMobile ?? "",
        department: profile.department ?? "",
        jobTitle: profile.jobTitle ?? "",
        birthDate: dbToDisplay((profile as any).birthDate),
        hireDate: dbToDisplay((profile as any).hireDate),
        addressBuletin: (profile as any).addressBuletin ?? "",
        addressSecondary: (profile as any).addressSecondary ?? "",
        city: (profile as any).city ?? "",
        cnp: (profile as any).cnp ?? "",
        ciSeries: (profile as any).ciSeries ?? "",
        ciNumber: (profile as any).ciNumber ?? "",
        ciExpiry: dbToDisplay((profile as any).ciExpiry),
        ciIssuedBy: (profile as any).ciIssuedBy ?? "",
        iban: (profile as any).iban ?? "",
        bankName: (profile as any).bankName ?? "",
        emergencyContact: (profile as any).emergencyContact ?? "",
        emergencyPhone: (profile as any).emergencyPhone ?? "",
        emergencyRelation: (profile as any).emergencyRelation ?? "",
        bloodType: (profile as any).bloodType ?? "",
        allergies: (profile as any).allergies ?? "",
        profileNotes: (profile as any).profileNotes ?? "",
      });
    }
    setEditing(false);
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const f = (key: keyof ProfileData) => ({
    editValue: form[key],
    onChange: (v: string) => setForm(p => ({ ...p, [key]: v })),
    readOnly: !editing,
  });

  if (!user) return null;

  const initials = user.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) ?? "?";

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Profilul meu</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Informații personale și date de contact</p>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button variant="outline" size="sm" onClick={handleCancelEdit} className="gap-1.5">
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
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="text-lg font-bold h-9 mb-2"
                  placeholder="Nume complet"
                  autoComplete="off"
                />
              ) : (
                <h2 className="text-lg font-bold text-foreground truncate">{profile?.name ?? user.name}</h2>
              )}
              <div className="flex flex-wrap gap-2 mt-1">
                <Badge variant="outline" className="text-xs border-[#FFCB09]/50 text-[#FFCB09] bg-[#FFCB09]/10">
                  {ROLE_LABELS[user.role] ?? user.role}
                </Badge>
                {profile?.department && (
                  <Badge variant="outline" className="text-xs">{profile.department}</Badge>
                )}
                {profile?.jobTitle && (
                  <Badge variant="outline" className="text-xs">{profile.jobTitle}</Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                {user.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> {user.email}
                  </span>
                )}
                {form.hireDate && (
                  <span className="flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5" />
                    Angajat din {form.hireDate}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informații profesionale */}
      <Card className="border-border">
        <CardContent className="p-6">
          <SectionHeader icon={Briefcase} title="Informații profesionale" subtitle="Funcție, departament, contact" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldRow label="Funcție / Post" {...f("jobTitle")} placeholder="ex: Inginer Proiectant" />
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Departament</Label>
              {editing ? (
                <Select value={form.department} onValueChange={v => setForm(p => ({ ...p, department: v }))}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Selectează departamentul" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-foreground py-1.5">{form.department || <span className="text-muted-foreground italic">Necompletat</span>}</p>
              )}
            </div>
            <FieldRow label="Telefon mobil (personal)" {...f("phoneMobile")} placeholder="+40 7xx xxx xxx" />
            <FieldRow label="Telefon de serviciu" {...f("phone")} placeholder="+40 7xx xxx xxx" />
            <DateFieldRow label="Data angajării" editValue={form.hireDate} onChange={v => setForm(p => ({ ...p, hireDate: v }))} readOnly={!editing} />
          </div>
        </CardContent>
      </Card>

      {/* Date personale */}
      <Card className="border-border">
        <CardContent className="p-6">
          <SectionHeader icon={User} title="Date personale" subtitle="Dată naștere și adrese" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <DateFieldRow label="Data nașterii" editValue={form.birthDate} onChange={v => setForm(p => ({ ...p, birthDate: v }))} readOnly={!editing} />
            <FieldRow label="Oraș de reședință" {...f("city")} placeholder="ex: Cluj-Napoca" />
          </div>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Home className="h-3 w-3" /> Adresă din buletin
              </Label>
              {editing ? (
                <Textarea
                  value={form.addressBuletin}
                  onChange={e => setForm(p => ({ ...p, addressBuletin: e.target.value }))}
                  placeholder="Strada, număr, bloc, apartament, localitate, județ"
                  className="text-sm resize-none"
                  rows={2}
                  autoComplete="off"
                />
              ) : (
                <p className="text-sm text-foreground py-1.5 min-h-[2rem]">
                  {form.addressBuletin || <span className="text-muted-foreground italic">Necompletat</span>}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <MapPin className="h-3 w-3" /> Adresă secundară (reședință actuală)
              </Label>
              {editing ? (
                <Textarea
                  value={form.addressSecondary}
                  onChange={e => setForm(p => ({ ...p, addressSecondary: e.target.value }))}
                  placeholder="Completează dacă locuiești în altă localitate decât cea din buletin"
                  className="text-sm resize-none"
                  rows={2}
                  autoComplete="off"
                />
              ) : (
                <p className="text-sm text-foreground py-1.5 min-h-[2rem]">
                  {form.addressSecondary || <span className="text-muted-foreground italic">Necompletat</span>}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Date CI — sensibile */}
      <Card className="border-border border-amber-200/40">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <SectionHeader icon={CreditCard} title="Date act de identitate" subtitle="Vizibile doar ție și administratorilor" />
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" />
              <span>Confidențial</span>
              <button
                type="button"
                onClick={() => setShowSensitive(p => !p)}
                className="ml-1 text-[#FFCB09] hover:text-[#f0bc00] transition-colors"
              >
                {showSensitive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldRow
              label="CNP"
              {...f("cnp")}
              sensitive
              showSensitive={showSensitive}
              onToggleSensitive={() => setShowSensitive(p => !p)}
              placeholder="13 cifre"
              maxLength={13}
              autoComplete="off"
              hint={editing ? "Exact 13 cifre" : undefined}
            />
            <div className="grid grid-cols-2 gap-2">
              <FieldRow
                label="Serie CI"
                {...f("ciSeries")}
                sensitive
                showSensitive={showSensitive}
                placeholder="ex: CJ"
                maxLength={2}
                hint={editing ? "2 litere" : undefined}
              />
              <FieldRow
                label="Număr CI"
                {...f("ciNumber")}
                sensitive
                showSensitive={showSensitive}
                placeholder="6-7 cifre"
                maxLength={7}
                hint={editing ? "6 sau 7 cifre" : undefined}
              />
            </div>
            <DateFieldRow label="Data expirării CI" editValue={form.ciExpiry} onChange={v => setForm(p => ({ ...p, ciExpiry: v }))} readOnly={!editing} />
            <FieldRow label="Eliberat de" {...f("ciIssuedBy")} placeholder="ex: SPCLEP Cluj-Napoca" />
          </div>
        </CardContent>
      </Card>

      {/* Date financiare — sensibile */}
      <Card className="border-border border-amber-200/40">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <SectionHeader icon={Banknote} title="Date financiare" subtitle="IBAN pentru virament salariu" />
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3 w-3" />
              <span>Confidențial</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldRow label="IBAN" {...f("iban")} sensitive showSensitive={showSensitive} onToggleSensitive={() => setShowSensitive(p => !p)} placeholder="RO49AAAA1B31007593840000" maxLength={24} hint={editing ? "Format: RO + 22 caractere (24 total)" : undefined} />
            <FieldRow label="Bancă" {...f("bankName")} placeholder="ex: Banca Transilvania" />
          </div>
        </CardContent>
      </Card>

      {/* Contact urgență */}
      <Card className="border-border">
        <CardContent className="p-6">
          <SectionHeader icon={AlertCircle} title="Contact de urgență" subtitle="Persoana de contactat în caz de urgență" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FieldRow label="Nume complet" {...f("emergencyContact")} placeholder="ex: Maria Ionescu" />
            <FieldRow label="Telefon" {...f("emergencyPhone")} placeholder="+40 7xx xxx xxx" />
            <FieldRow label="Relație" {...f("emergencyRelation")} placeholder="ex: Soție, Mamă, Frate" />
          </div>
        </CardContent>
      </Card>

      {/* Date medicale */}
      <Card className="border-border">
        <CardContent className="p-6">
          <SectionHeader icon={Heart} title="Date medicale" subtitle="Utile în situații de urgență" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Grupă sanguină</Label>
              {editing ? (
                <Select
                  value={form.bloodType || "none"}
                  onValueChange={v => setForm(p => ({ ...p, bloodType: v === "none" ? "" : v }))}
                >
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
              ) : (
                <p className="text-sm text-foreground py-1.5">
                  {form.bloodType || <span className="text-muted-foreground italic">Necompletat</span>}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Alergii cunoscute</Label>
              {editing ? (
                <Input
                  value={form.allergies}
                  onChange={e => setForm(p => ({ ...p, allergies: e.target.value }))}
                  placeholder="ex: Penicilină, Polen, Latex"
                  className="h-9 text-sm"
                  autoComplete="off"
                />
              ) : (
                <p className="text-sm text-foreground py-1.5">
                  {form.allergies || <span className="text-muted-foreground italic">Necompletat</span>}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deconectare */}
      <Card className="border-border">
        <CardContent className="p-4">
          <Button
            variant="outline"
            className="w-full gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Deconectare
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
