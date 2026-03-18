import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { useState } from "react";
import { useLocation } from "wouter";
import { Newspaper, Pin, AlertCircle, Search, Plus } from "lucide-react";

const CATEGORIES = [
  { value: "", label: "Toate categoriile" },
  { value: "companie", label: "Companie", color: "bg-blue-100 text-blue-800" },
  { value: "proiecte", label: "Proiecte", color: "bg-green-100 text-green-800" },
  { value: "hr", label: "HR", color: "bg-purple-100 text-purple-800" },
  { value: "it", label: "IT", color: "bg-gray-100 text-gray-800" },
  { value: "evenimente", label: "Evenimente", color: "bg-amber-100 text-amber-800" },
  { value: "realizari", label: "Realizări", color: "bg-yellow-100 text-yellow-800" },
];

function getCategoryStyle(cat: string) {
  return CATEGORIES.find(c => c.value === cat)?.color ?? "bg-gray-100 text-gray-700";
}

export default function Stiri() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const { data: newsData, isLoading } = trpc.news.list.useQuery({ category: category || undefined, limit: 50 });

  const canCreate = user?.role === "super_admin" || user?.role === "admin_hr" || user?.role === "manager";

  const filtered = newsData?.filter(({ news: item }) =>
    !search || item.title.toLowerCase().includes(search.toLowerCase()) || (item.excerpt ?? "").toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const pinned = filtered.filter(({ news: item }) => item.isPinned);
  const regular = filtered.filter(({ news: item }) => !item.isPinned);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Știri & Anunțuri</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Noutăți din cadrul companiei</p>
        </div>
        {canCreate && (
          <Button
            onClick={() => setLocation("/stiri/nou")}
            className="bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] font-semibold gap-2"
          >
            <Plus className="h-4 w-4" />
            Adaugă știre
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Caută știri..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Categorie" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(c => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Pinned */}
      {pinned.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Pin className="h-3 w-3" /> Fixate
          </p>
          <div className="space-y-2">
            {pinned.map(({ news: item, author }) => (
              <Card
                key={item.id}
                className="cursor-pointer hover:shadow-md transition-shadow border-[#FFCB09] border-2"
                onClick={() => setLocation(`/stiri/${item.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${getCategoryStyle(item.category)}`}>
                          {CATEGORIES.find(c => c.value === item.category)?.label ?? item.category}
                        </span>
                        {item.isImportant && (
                          <span className="flex items-center gap-0.5 text-[10px] text-red-600 font-semibold">
                            <AlertCircle className="h-3 w-3" /> Important
                          </span>
                        )}
                        <span className="text-[10px] bg-[#FFCB09] text-[#221F1F] px-1.5 py-0.5 rounded font-semibold">FIXAT</span>
                      </div>
                      <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                      {item.excerpt && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.excerpt}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(item.publishedAt ?? item.createdAt), "d MMM", { locale: ro })}
                      </p>
                      <p className="text-xs text-muted-foreground">{author?.name}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Regular news */}
      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
          ))
        ) : regular.length > 0 ? (
          regular.map(({ news: item, author }) => (
            <Card
              key={item.id}
              className="cursor-pointer hover:shadow-sm transition-shadow border-border"
              onClick={() => setLocation(`/stiri/${item.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 text-right w-12">
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(item.publishedAt ?? item.createdAt), "d MMM", { locale: ro })}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${getCategoryStyle(item.category)}`}>
                        {CATEGORIES.find(c => c.value === item.category)?.label ?? item.category}
                      </span>
                      {item.isImportant && <AlertCircle className="h-3 w-3 text-red-500" />}
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                    {item.excerpt && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.excerpt}</p>}
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0">{author?.name}</p>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Newspaper className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Nu există știri{search ? " pentru căutarea ta" : ""}</p>
          </div>
        )}
      </div>
    </div>
  );
}
