import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { FileText, Download, Eye, Lock, Shield, Upload } from "lucide-react";
import { toast } from "sonner";

const DOC_TYPES: Record<string, { label: string; color: string }> = {
  contract: { label: "Contract", color: "bg-blue-100 text-blue-800" },
  fisa_post: { label: "Fișa postului", color: "bg-purple-100 text-purple-800" },
  evaluare: { label: "Evaluare", color: "bg-green-100 text-green-800" },
  certificat: { label: "Certificat", color: "bg-amber-100 text-amber-800" },
  salariu: { label: "Salariu", color: "bg-red-100 text-red-800" },
  concediu: { label: "Concediu", color: "bg-teal-100 text-teal-800" },
  medical: { label: "Medical", color: "bg-pink-100 text-pink-800" },
  alt: { label: "Alt document", color: "bg-gray-100 text-gray-700" },
};

export default function Documente() {
  const utils = trpc.useUtils();
  const { data: documents, isLoading } = trpc.documents.myDocuments.useQuery();
  const logAccess = trpc.documents.logAccess.useMutation();

  const handleView = (doc: any) => {
    logAccess.mutate({ documentId: doc.id, action: "view" });
    if (doc.fileUrl) window.open(doc.fileUrl, "_blank");
    else toast.info("Documentul nu are un fișier atașat");
  };

  const handleDownload = (doc: any) => {
    logAccess.mutate({ documentId: doc.id, action: "download" });
    if (doc.fileUrl) {
      const a = document.createElement("a");
      a.href = doc.fileUrl;
      a.download = doc.title;
      a.click();
    }
  };

  // Group by type
  const grouped = documents?.reduce((acc, doc) => {
    const key = doc.type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(doc);
    return acc;
  }, {} as Record<string, typeof documents>) ?? {};

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Documentele mele</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Documente personale și confidențiale</p>
      </div>

      {/* Security notice */}
      <Card className="border-[#FFCB09] bg-yellow-50">
        <CardContent className="p-4 flex items-center gap-3">
          <Shield className="h-5 w-5 text-[#FFCB09] shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[#221F1F]">Spațiu confidențial</p>
            <p className="text-xs text-muted-foreground">
              Documentele sunt vizibile doar pentru tine și HR autorizat. Fiecare acces este înregistrat în jurnalul de audit.
            </p>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : documents && documents.length > 0 ? (
        Object.entries(grouped).map(([type, docs]) => {
          const typeInfo = DOC_TYPES[type] ?? { label: type, color: "bg-gray-100 text-gray-700" };
          return (
            <div key={type}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs px-2 py-0.5 rounded font-semibold ${typeInfo.color}`}>{typeInfo.label}</span>
                <span className="text-xs text-muted-foreground">({docs.length})</span>
              </div>
              <div className="space-y-2">
                {docs.map((doc) => (
                  <Card key={doc.id} className="border-border hover:shadow-sm transition-shadow">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{doc.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {doc.description && (
                            <p className="text-xs text-muted-foreground truncate">{doc.description}</p>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(doc.createdAt), "d MMM yyyy", { locale: ro })}
                          </span>
                          {doc.year && (
                            <span className="text-xs text-muted-foreground">{doc.year}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleView(doc)} title="Vizualizează">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(doc)} title="Descarcă">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Lock className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">Nu ai documente încărcate</p>
          <p className="text-xs mt-1">Contactează HR pentru a solicita documente</p>
        </div>
      )}
    </div>
  );
}
