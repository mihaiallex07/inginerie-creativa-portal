import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderOpen, ExternalLink, AlertCircle, FileIcon } from "lucide-react";

function formatFileSize(bytes: string | null): string {
  if (!bytes) return "";
  const b = parseInt(bytes, 10);
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getMimeEmoji(mimeType: string): string {
  if (mimeType === "application/pdf") return "\uD83D\uDCC4";
  if (mimeType.startsWith("image/")) return "\uD83D\uDDBC\uFE0F";
  if (mimeType.includes("word") || mimeType.includes("document")) return "\uD83D\uDCDD";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "\uD83D\uDCCA";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "\uD83D\uDCD1";
  return "\uD83D\uDCC1";
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string | null;
  size: string | null;
  previewUrl: string;
}

function FileCard({ file }: { file: DriveFile }) {
  const proxyUrl = `/api/drive/public/${file.id}`;
  return (
    <a
      href={proxyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 p-3 rounded-lg border border-white/10 hover:border-[#FFCB09]/50 hover:bg-[#FFCB09]/5 transition-all cursor-pointer"
    >
      <div className="text-2xl flex-shrink-0">{getMimeEmoji(file.mimeType)}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate group-hover:text-[#FFCB09] transition-colors">
          {file.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {file.modifiedTime && (
            <span className="text-xs text-gray-500">{formatDate(file.modifiedTime)}</span>
          )}
          {file.size && (
            <span className="text-xs text-gray-600">{formatFileSize(file.size)}</span>
          )}
        </div>
      </div>
      <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-[#FFCB09] flex-shrink-0 transition-colors" />
    </a>
  );
}

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

export default function ProceseProceduri() {
  const input = useMemo(() => ({ subfolderName: "Procese & Proceduri" }), []);
  const { data, isLoading } = trpc.documents.listSubfolderFiles.useQuery(input);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[#FFCB09]/10">
          <FolderOpen className="w-6 h-6 text-[#FFCB09]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Procese & Proceduri</h1>
          <p className="text-sm text-gray-400">
            Proceduri de lucru si procese interne ale companiei
          </p>
        </div>
      </div>

      <Card className="bg-[#2A2727] border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-white">
            <FolderOpen className="w-4 h-4 text-[#FFCB09]" />
            Documente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <FileSkeleton />
              <FileSkeleton />
              <FileSkeleton />
            </div>
          ) : !data?.files.length ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="p-3 rounded-full bg-white/5">
                <FileIcon className="w-8 h-8 text-gray-600" />
              </div>
              <p className="text-sm text-gray-400">
                Nu exista documente in folderul Procese & Proceduri din Drive.
              </p>
              <p className="text-xs text-gray-600">
                Adauga fisiere in folderul HUB IC / Procese & Proceduri din Google Drive.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.files.map((file) => (
                <FileCard key={file.id} file={file} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
        <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-400">
          Documentele se deschid direct in browser, securizat prin portalul HUB.
          Fisierele sunt gestionate de administrator din Google Drive.
        </p>
      </div>
    </div>
  );
}
