import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { ArrowLeft, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type NewsCategory = "companie" | "proiecte" | "hr" | "it" | "evenimente" | "realizari";

const CATEGORIES: { value: NewsCategory; label: string }[] = [
  { value: "companie", label: "Companie" },
  { value: "proiecte", label: "Proiecte" },
  { value: "hr", label: "HR" },
  { value: "it", label: "IT" },
  { value: "evenimente", label: "Evenimente" },
  { value: "realizari", label: "Realizări" },
];

interface FormState {
  title: string;
  excerpt: string;
  content: string;
  category: NewsCategory;
  isPinned: boolean;
  isImportant: boolean;
  tags: string;
}

export default function StireNou() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const canCreate = user?.role === "super_admin" || user?.role === "admin_hr" || user?.role === "manager";

  const [form, setForm] = useState<FormState>({
    title: "",
    excerpt: "",
    content: "",
    category: "companie",
    isPinned: false,
    isImportant: false,
    tags: "",
  });

  const create = trpc.news.create.useMutation({
    onSuccess: (data) => {
      toast.success("Știrea a fost publicată cu succes!");
      utils.news.list.invalidate();
      setLocation(`/stiri/${data.id}`);
    },
    onError: (err) => {
      toast.error("Eroare la publicarea știrii: " + err.message);
    },
  });

  if (!canCreate) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-muted-foreground">Nu ai permisiunea de a crea știri.</p>
        <Button variant="ghost" onClick={() => setLocation("/stiri")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Înapoi la știri
        </Button>
      </div>
    );
  }

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast.error("Titlul este obligatoriu");
      return;
    }
    if (!form.content.trim()) {
      toast.error("Conținutul este obligatoriu");
      return;
    }
    const tagsArray = form.tags.split(",").map(t => t.trim()).filter(Boolean);
    create.mutate({
      title: form.title.trim(),
      excerpt: form.excerpt.trim() || undefined,
      content: form.content.trim(),
      category: form.category,
      isPinned: form.isPinned,
      isImportant: form.isImportant,
      tags: tagsArray,
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/stiri")} className="gap-2 -ml-2">
          <ArrowLeft className="h-4 w-4" /> Înapoi
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Știre nouă</h1>
          <p className="text-xs text-muted-foreground">Publică un anunț sau articol intern</p>
        </div>
      </div>

      <Card className="border-border">
        <CardContent className="p-6 space-y-5">
          {/* Titlu */}
          <div>
            <Label className="text-sm font-semibold">Titlu *</Label>
            <Input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="ex: Actualizare regulament intern – secțiunea privind telemunca"
              className="mt-1.5"
            />
          </div>

          {/* Rezumat */}
          <div>
            <Label className="text-sm font-semibold">
              Rezumat scurt{" "}
              <span className="font-normal text-muted-foreground">(opțional)</span>
            </Label>
            <Input
              value={form.excerpt}
              onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
              placeholder="Scurtă descriere afișată în lista de știri..."
              className="mt-1.5"
            />
          </div>

          {/* Conținut */}
          <div>
            <Label className="text-sm font-semibold">Conținut *</Label>
            <Textarea
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="Scrie conținutul complet al știrii sau anunțului..."
              rows={8}
              className="mt-1.5 resize-none"
            />
          </div>

          {/* Categorie */}
          <div>
            <Label className="text-sm font-semibold">Categorie</Label>
            <Select
              value={form.category}
              onValueChange={(v) => setForm(f => ({ ...f, category: v as NewsCategory }))}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div>
            <Label className="text-sm font-semibold">
              Tag-uri{" "}
              <span className="font-normal text-muted-foreground">(separate prin virgulă)</span>
            </Label>
            <Input
              value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              placeholder="ex: regulament, telemuncă, HR"
              className="mt-1.5"
            />
          </div>

          {/* Opțiuni */}
          <div className="flex flex-col gap-3 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Fixat în top</p>
                <p className="text-xs text-muted-foreground">Apare mereu primul în lista de știri</p>
              </div>
              <Switch
                checked={form.isPinned}
                onCheckedChange={v => setForm(f => ({ ...f, isPinned: v }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Marcat ca Important</p>
                <p className="text-xs text-muted-foreground">Afișează indicator roșu de urgență</p>
              </div>
              <Switch
                checked={form.isImportant}
                onCheckedChange={v => setForm(f => ({ ...f, isImportant: v }))}
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setLocation("/stiri")}
              className="flex-1"
            >
              Anulează
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={create.isPending || !form.title.trim() || !form.content.trim()}
              className="flex-1 bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] font-semibold gap-2"
            >
              {create.isPending ? (
                <span className="animate-spin inline-block h-4 w-4 border-2 border-[#221F1F] border-t-transparent rounded-full" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Publică știrea
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
