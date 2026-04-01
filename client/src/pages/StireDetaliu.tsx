import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, AlertCircle, Pin, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";

const CATEGORIES: Record<string, { label: string; color: string }> = {
  companie: { label: "Companie", color: "bg-blue-100 text-blue-800" },
  proiecte: { label: "Proiecte", color: "bg-green-100 text-green-800" },
  hr: { label: "HR", color: "bg-purple-100 text-purple-800" },
  it: { label: "IT", color: "bg-gray-100 text-gray-800" },
  evenimente: { label: "Evenimente", color: "bg-amber-100 text-amber-800" },
  realizari: { label: "Realizări", color: "bg-yellow-100 text-yellow-800" },
};

const CATEGORIES_LIST = [
  { value: "companie", label: "Companie" },
  { value: "proiecte", label: "Proiecte" },
  { value: "hr", label: "HR" },
  { value: "it", label: "IT" },
  { value: "evenimente", label: "Evenimente" },
  { value: "realizari", label: "Realizări" },
] as const;

type NewsCategory = "companie" | "proiecte" | "hr" | "it" | "evenimente" | "realizari";

const REACTIONS = [
  { emoji: "👍", value: "like" },
  { emoji: "❤️", value: "heart" },
  { emoji: "🎉", value: "celebrate" },
  { emoji: "👏", value: "clap" },
];

export default function StireDetaliu() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.news.byId.useQuery({ id: Number(id) });
  const { data: comments } = trpc.news.comments.useQuery({ newsId: Number(id) });

  const react = trpc.news.react.useMutation({
    onSuccess: () => { utils.news.byId.invalidate(); toast.success("Reacție adăugată!"); },
  });

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "", excerpt: "", content: "", category: "companie" as NewsCategory,
    isPinned: false, isImportant: false, tags: "",
  });

  const updateMutation = trpc.news.update.useMutation({
    onSuccess: () => {
      toast.success("Știrea a fost actualizată!");
      setEditOpen(false);
      utils.news.byId.invalidate({ id: Number(id) });
      utils.news.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteMutation = trpc.news.delete.useMutation({
    onSuccess: () => {
      toast.success("Știrea a fost ștearsă!");
      utils.news.list.invalidate();
      setLocation("/stiri");
    },
    onError: (err) => toast.error(err.message),
  });

  function openEdit() {
    if (!data) return;
    const { news: item } = data;
    setEditForm({
      title: item.title,
      excerpt: item.excerpt ?? "",
      content: item.content,
      category: item.category as NewsCategory,
      isPinned: item.isPinned ?? false,
      isImportant: item.isImportant ?? false,
      tags: (item.tags ?? []).join(", "),
    });
    setEditOpen(true);
  }

  function handleSaveEdit() {
    if (!editForm.title.trim() || !editForm.content.trim()) {
      toast.error("Titlul și conținutul sunt obligatorii");
      return;
    }
    const tagsArray = editForm.tags.split(",").map(t => t.trim()).filter(Boolean);
    updateMutation.mutate({
      id: Number(id),
      title: editForm.title.trim(),
      content: editForm.content.trim(),
      excerpt: editForm.excerpt.trim() || undefined,
      category: editForm.category,
      isPinned: editForm.isPinned,
      isImportant: editForm.isImportant,
      tags: tagsArray,
    });
  }

  function handleDelete() {
    deleteMutation.mutate({ id: Number(id) });
  }

  // Check if user can edit/delete (admin or author)
  const canEditDelete = data && user && (user.role === "admin" || data.news.authorId === user.id);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="h-8 bg-muted rounded animate-pulse w-32" />
        <div className="h-64 bg-muted rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-muted-foreground">Știrea nu a fost găsită.</p>
        <Button variant="ghost" onClick={() => setLocation("/stiri")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Înapoi la știri
        </Button>
      </div>
    );
  }

  const { news: item, author } = data;
  const cat = CATEGORIES[item.category];

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/stiri")} className="gap-2 -ml-2">
          <ArrowLeft className="h-4 w-4" /> Înapoi
        </Button>
        {canEditDelete && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={openEdit} className="gap-1.5 text-xs">
              <Pencil className="h-3.5 w-3.5" /> Editează
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)} className="gap-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50">
              <Trash2 className="h-3.5 w-3.5" /> Șterge
            </Button>
          </div>
        )}
      </div>

      <Card className="border-border">
        <CardContent className="p-6">
          {/* Meta */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {cat && (
              <span className={`text-xs px-2 py-0.5 rounded font-semibold ${cat.color}`}>{cat.label}</span>
            )}
            {item.isPinned && (
              <span className="flex items-center gap-0.5 text-xs bg-[#FFCB09] text-[#221F1F] px-2 py-0.5 rounded font-semibold">
                <Pin className="h-3 w-3" /> Fixat
              </span>
            )}
            {item.isImportant && (
              <span className="flex items-center gap-0.5 text-xs text-red-600 font-semibold">
                <AlertCircle className="h-3 w-3" /> Important
              </span>
            )}
          </div>

          <h1 className="text-xl font-bold text-foreground mb-2">{item.title}</h1>

          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <span>{author?.name ?? "Redacție"}</span>
            <span>·</span>
            <span>{format(new Date(item.publishedAt ?? item.createdAt), "d MMMM yyyy, HH:mm", { locale: ro })}</span>
          </div>

          {item.imageUrl && (
            <img src={item.imageUrl} alt={item.title} className="w-full rounded-lg mb-4 object-cover max-h-64" />
          )}

          <div className="prose prose-sm max-w-none text-foreground">
            {item.content.split("\n").map((para, i) => (
              para.trim() ? <p key={i} className="mb-3 text-sm leading-relaxed">{para}</p> : null
            ))}
          </div>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-4 pt-4 border-t border-border">
              {item.tags.map((tag: string) => (
                <span key={tag} className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">#{tag}</span>
              ))}
            </div>
          )}

          {/* Reactions */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
            <span className="text-xs text-muted-foreground mr-1">Reacționează:</span>
            {REACTIONS.map(r => (
              <button
                key={r.value}
                onClick={() => react.mutate({ newsId: item.id, reaction: r.value })}
                className="text-lg hover:scale-125 transition-transform"
                title={r.value}
              >
                {r.emoji}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comments */}
      {comments && comments.length > 0 && (
        <Card className="border-border">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3">Comentarii ({comments.length})</h3>
            <div className="space-y-3">
              {comments.map(({ comment, user }) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="h-7 w-7 rounded-full bg-[#FFCB09] flex items-center justify-center text-xs font-bold text-[#221F1F] shrink-0">
                    {user?.name?.charAt(0).toUpperCase() ?? "?"}
                  </div>
                  <div className="flex-1 bg-muted rounded-lg p-2.5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold">{user?.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comment.createdAt), "d MMM, HH:mm", { locale: ro })}
                      </span>
                    </div>
                    <p className="text-xs text-foreground">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-[#FFCB09]" /> Editează știrea
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-xs font-semibold">Titlu *</Label>
              <Input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Rezumat scurt</Label>
              <Input value={editForm.excerpt} onChange={e => setEditForm(f => ({ ...f, excerpt: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Conținut *</Label>
              <Textarea value={editForm.content} onChange={e => setEditForm(f => ({ ...f, content: e.target.value }))} rows={6} className="mt-1 resize-none" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Categorie</Label>
              <Select value={editForm.category} onValueChange={v => setEditForm(f => ({ ...f, category: v as NewsCategory }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES_LIST.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold">Tag-uri <span className="font-normal text-muted-foreground">(separate prin virgulă)</span></Label>
              <Input value={editForm.tags} onChange={e => setEditForm(f => ({ ...f, tags: e.target.value }))} className="mt-1" placeholder="ex: regulament, telemuncă" />
            </div>
            <div className="flex flex-col gap-3 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Fixat în top</p>
                  <p className="text-[10px] text-muted-foreground">Apare mereu primul în lista de știri</p>
                </div>
                <Switch checked={editForm.isPinned} onCheckedChange={v => setEditForm(f => ({ ...f, isPinned: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Marcat ca Important</p>
                  <p className="text-[10px] text-muted-foreground">Afișează indicator roșu de urgență</p>
                </div>
                <Switch checked={editForm.isImportant} onCheckedChange={v => setEditForm(f => ({ ...f, isImportant: v }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>Anulează</Button>
              <Button
                className="bg-[#FFCB09] text-black hover:bg-[#e6b800]"
                onClick={handleSaveEdit}
                disabled={updateMutation.isPending || !editForm.title.trim() || !editForm.content.trim()}
              >
                {updateMutation.isPending ? "Se salvează..." : "Salvează modificările"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-4 w-4" /> Șterge știrea
            </DialogTitle>
            <DialogDescription className="pt-2">
              Ești sigur că vrei să ștergi această știre? Acțiunea este ireversibilă și va elimina și toate comentariile și reacțiile asociate.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Anulează</Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Se șterge..." : "Șterge definitiv"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
