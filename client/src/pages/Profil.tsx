import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User, Mail, Phone, Briefcase, Building2, LogOut, Pencil, Save, X,
  MapPin, CreditCard, Heart, AlertCircle, Calendar, Lock, Eye, EyeOff,
  ShieldCheck, Home, Banknote, UserCheck,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
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
  birthDate: string;
  hireDate: string;
  addressBuletin: string;
  addressSecondary: string;
  city: string;
  cnp: string;
  ciSeries: string;
  ciNumber: string;
  ciExpiry: string;
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

function FieldRow({ label, value, editValue, onChange, type = "text", placeholder, readOnly, sensitive, showSensitive, onToggleSensitive }: {
  label: string;
  value?: string | null;
  editValue: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  readOnly?: boolean;
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
          value={editValue}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? label}
          readOnly={readOnly}
          className={`h-9 text-sm ${readOnly ? "bg-muted/40 cursor-default" : ""} ${sensitive ? "pr-9" : ""}`}
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

export default function Profil() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [editing, setEditing] = useState(false);
  const [showSensitive, setShowSensitive] = useState(false);
  const [form, setForm] = useState<ProfileData>({
    name: "", phone: "", phoneMobile: "", department: "", jobTitle: "", birthDate: "", hireDate: "", addressBuletin: "", addressSecondary: "",
    city: "", cnp: "", ciSeries: "", ciNumber: "", ciExpiry: "", ciIssuedBy: "",
    iban: "", bankName: "", emergencyContact: "", emergencyPhone: "",
    emergencyRelation: "", bloodType: "", allergies: "", profileNotes: "",
  });

  const { data: profile, refetch } = trpc.profile.getMyProfile.useQuery(undefined, {
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      const fmt = (d: any) => d ? String(d).slice(0, 10) : "";
      setForm({
        name: profile.name ?? "",
        phone: profile.phone ?? "",
        phoneMobile: (profile as any).phoneMobile ?? "",
        department: profile.department ?? "",
        jobTitle: profile.jobTitle ?? "",
        birthDate: fmt(profile.birthDate),
        hireDate: fmt(profile.hireDate),
        addressBuletin: (profile as any).addressBuletin ?? "",
        addressSecondary: (profile as any).addressSecondary ?? "",
        city: (profile as any).city ?? "",
        cnp: (profile as any).cnp ?? "",
        ciSeries: (profile as any).ciSeries ?? "",
        ciNumber: (profile as any).ciNumber ?? "",
        ciExpiry: fmt((profile as any).ciExpiry),
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
    updateMutation.mutate({
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
    });
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const f = (key: keyof ProfileData) => ({
    editValue: form[key],
    onChange: (v: string) => setForm(p => ({ ...p, [key]: v })),
  });

  if (!user) return null;

  const initials = user.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) ?? "?";

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
                {(profile as any)?.hireDate && (
                  <span className="flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5" />
                    Angajat din {String((profile as any).hireDate).slice(0, 10)}
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
                <p className="text-sm text-foreground py-1.5">{form.department || <span className="text-muted-foreground italic">Necòmpletat</span>}</p>
              )}
            </div>
            <FieldRow label="Telefon mobil (personal)" {...f("phoneMobile")} type="tel" placeholder="+40 7xx xxx xxx" />
            <FieldRow label="Telefon de serviciu" {...f("phone")} type="tel" placeholder="+40 7xx xxx xxx" />
            <FieldRow label="Data angajării" {...f("hireDate")} type="date" />
          </div>
        </CardContent>
      </Card>

      {/* Date personale */}
      <Card className="border-border">
        <CardContent className="p-6">
          <SectionHeader icon={User} title="Date personale" subtitle="Dată naștere și adrese" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <FieldRow label="Data nașterii" {...f("birthDate")} type="date" />
            <FieldRow label="Oraș de reședință" {...f("city")} placeholder="ex: Cluj-Napoca" />
          </div>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Home className="h-3 w-3" /> Adresă din buletin
              </Label>
              <Textarea
                value={form.addressBuletin}
                onChange={e => setForm(p => ({ ...p, addressBuletin: e.target.value }))}
                placeholder="Strada, număr, bloc, apartament, localitate, județ"
                className="text-sm resize-none"
                rows={2}
                readOnly={!editing}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <MapPin className="h-3 w-3" /> Adresă secundară (reședință actuală)
              </Label>
              <Textarea
                value={form.addressSecondary}
                onChange={e => setForm(p => ({ ...p, addressSecondary: e.target.value }))}
                placeholder="Completează dacă locuiești în altă localitate decât cea din buletin"
                className="text-sm resize-none"
                rows={2}
                readOnly={!editing}
              />
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
            <FieldRow label="CNP" {...f("cnp")} sensitive showSensitive={showSensitive} onToggleSensitive={() => setShowSensitive(p => !p)} placeholder="13 cifre" />
            <div className="grid grid-cols-2 gap-2">
              <FieldRow label="Serie CI" {...f("ciSeries")} sensitive showSensitive={showSensitive} placeholder="ex: CJ" />
              <FieldRow label="Număr CI" {...f("ciNumber")} sensitive showSensitive={showSensitive} placeholder="6 cifre" />
            </div>
            <FieldRow label="Data expirării CI" {...f("ciExpiry")} type="date" />
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
            <FieldRow label="IBAN" {...f("iban")} sensitive showSensitive={showSensitive} onToggleSensitive={() => setShowSensitive(p => !p)} placeholder="RO49AAAA1B31007593840000" />
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
            <FieldRow label="Telefon" {...f("emergencyPhone")} type="tel" placeholder="+40 7xx xxx xxx" />
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
              <Select
                value={form.bloodType || "none"}
                onValueChange={v => setForm(p => ({ ...p, bloodType: v === "none" ? "" : v }))}
                disabled={!editing}
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
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Alergii cunoscute</Label>
              <Input
                value={form.allergies}
                onChange={e => setForm(p => ({ ...p, allergies: e.target.value }))}
                placeholder="ex: Penicilină, Polen, Latex"
                className="h-9 text-sm"
                readOnly={!editing}
              />
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
