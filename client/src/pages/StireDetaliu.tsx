import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, AlertCircle, Pin, ThumbsUp, Heart, Smile } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES: Record<string, { label: string; color: string }> = {
  companie: { label: "Companie", color: "bg-blue-100 text-blue-800" },
  proiecte: { label: "Proiecte", color: "bg-green-100 text-green-800" },
  hr: { label: "HR", color: "bg-purple-100 text-purple-800" },
  it: { label: "IT", color: "bg-gray-100 text-gray-800" },
  evenimente: { label: "Evenimente", color: "bg-amber-100 text-amber-800" },
  realizari: { label: "Realizări", color: "bg-yellow-100 text-yellow-800" },
};

const REACTIONS = [
  { emoji: "👍", value: "like" },
  { emoji: "❤️", value: "heart" },
  { emoji: "🎉", value: "celebrate" },
  { emoji: "👏", value: "clap" },
];

export default function StireDetaliu() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.news.byId.useQuery({ id: Number(id) });
  const { data: comments } = trpc.news.comments.useQuery({ newsId: Number(id) });

  const react = trpc.news.react.useMutation({
    onSuccess: () => { utils.news.byId.invalidate(); toast.success("Reacție adăugată!"); },
  });

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
      <Button variant="ghost" size="sm" onClick={() => setLocation("/stiri")} className="gap-2 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Înapoi
      </Button>

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
    </div>
  );
}
