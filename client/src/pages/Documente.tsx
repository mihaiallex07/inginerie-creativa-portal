import { trpc } from "../lib/trpc";
import DriveDocViewer from "@/components/DriveDocViewer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, FolderOpen, FileIcon, Lock, AlertCircle } from "lucide-react";

function FileSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-white/10">
      <Skeleton className="w-8 h-8 rounded" />
      <div className="flex-1">
        <Skeleton className="h-4 w-3/4 mb-1" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

export default function Documente() {
  const { data: myFilesData, isLoading: loadingMy } = trpc.documents.listMyFiles.useQuery();

  // If user has a mapped folder, use the shared DriveDocViewer
  if (!loadingMy && myFilesData?.hasDriveFolder && myFilesData.files.length >= 0) {
    return (
      <DriveDocViewer
        files={myFilesData.files}
        isLoading={false}
        title="Documentele mele"
        subtitle={`Contract, fisa post, evaluari si alte documente personale${myFilesData.folderName ? ` — ${myFilesData.folderName}` : ""}`}
        icon={FileText}
        proxyPrefix="/api/drive/file/"
        emptyHint="Contacteaza administratorul pentru a adauga documente in folderul tau."
      />
    );
  }

  // Loading or no folder mapped — show custom state
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[#FFCB09]/10">
          <FileText className="w-6 h-6 text-[#FFCB09]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Documentele mele</h1>
          <p className="text-sm text-gray-400">
            Contract, fisa post, evaluari si alte documente personale
          </p>
        </div>
      </div>

      <Card className="bg-[#2A2727] border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-white">
            <Lock className="w-4 h-4 text-[#FFCB09]" />
            Documente personale
            <Badge variant="outline" className="ml-auto text-xs border-[#FFCB09]/30 text-[#FFCB09]">
              Confidential
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingMy ? (
            <div className="space-y-2">
              <FileSkeleton />
              <FileSkeleton />
              <FileSkeleton />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="p-3 rounded-full bg-white/5">
                <FolderOpen className="w-8 h-8 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-400 font-medium">
                  Nu exista un folder Drive asociat contului tau
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Contacteaza administratorul pentru a configura accesul la documente.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
        <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-400">
          Documentele se deschid direct in browser, securizat prin portalul HUB.
          Nu este necesar accesul la Google Drive. Fiecare angajat vede doar propriile documente.
        </p>
      </div>
    </div>
  );
}
