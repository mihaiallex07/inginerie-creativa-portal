import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  FileIcon,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Search,
  LucideIcon,
} from "lucide-react";

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string | null;
  size: string | null;
  previewUrl: string;
}

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

interface PdfViewerProps {
  file: DriveFile;
  files: DriveFile[];
  proxyPrefix: string;
  onClose: () => void;
  onNavigate: (file: DriveFile) => void;
}

function PdfViewer({ file, files, proxyPrefix, onClose, onNavigate }: PdfViewerProps) {
  const proxyUrl = `${proxyPrefix}${file.id}`;
  const currentIndex = files.findIndex((f) => f.id === file.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < files.length - 1;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#1E1B1B] flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-lg flex-shrink-0">{getMimeEmoji(file.mimeType)}</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{file.name}</p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {file.modifiedTime && <span>{formatDate(file.modifiedTime)}</span>}
              {file.size && <span>{formatFileSize(file.size)}</span>}
              {files.length > 1 && (
                <span className="text-[#FFCB09]">
                  {currentIndex + 1} / {files.length}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {files.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-white disabled:opacity-30"
                disabled={!hasPrev}
                onClick={() => onNavigate(files[currentIndex - 1])}
                title="Document anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-white disabled:opacity-30"
                disabled={!hasNext}
                onClick={() => onNavigate(files[currentIndex + 1])}
                title="Document urmator"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}
          <a href={proxyUrl} target="_blank" rel="noopener noreferrer">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-white"
              title="Deschide in tab nou"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </a>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-white"
            onClick={onClose}
            title="Inchide"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      {/* Iframe */}
      <div className="flex-1 bg-[#1A1717] min-h-0">
        <iframe
          key={file.id}
          src={proxyUrl}
          className="w-full h-full border-0"
          title={file.name}
          style={{ minHeight: "600px" }}
        />
      </div>
    </div>
  );
}

interface DriveDocViewerProps {
  /** tRPC query result */
  files: DriveFile[] | undefined;
  isLoading: boolean;
  /** Page title */
  title: string;
  /** Page subtitle */
  subtitle: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Proxy URL prefix — e.g. "/api/drive/public/" or "/api/drive/file/" */
  proxyPrefix?: string;
  /** Empty state hint */
  emptyHint?: string;
}

export default function DriveDocViewer({
  files: rawFiles,
  isLoading,
  title,
  subtitle,
  icon: Icon,
  proxyPrefix = "/api/drive/public/",
  emptyHint,
}: DriveDocViewerProps) {
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
  const [search, setSearch] = useState("");

  const files = rawFiles ?? [];

  const filteredFiles = useMemo(() => {
    if (!search.trim()) return files;
    const q = search.toLowerCase();
    return files.filter((f) => f.name.toLowerCase().includes(q));
  }, [files, search]);

  // If selected file is filtered out, keep showing it in the viewer
  const viewerFiles = search.trim() ? files : filteredFiles;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[#FFCB09]/10">
          <Icon className="w-6 h-6 text-[#FFCB09]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="text-sm text-gray-400">{subtitle}</p>
        </div>
      </div>

      {/* Two-panel layout when a file is selected */}
      {selectedFile ? (
        <div className="grid grid-cols-[280px_1fr] gap-4 items-start">
          {/* File list panel */}
          <Card className="bg-[#2A2727] border-white/10 sticky top-4">
            <CardHeader className="pb-2 pt-3 px-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <Input
                  placeholder="Cauta document..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-7 text-xs bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-[#FFCB09]/30"
                />
              </div>
              <p className="text-[10px] text-gray-600 mt-1">
                {filteredFiles.length} din {files.length} documente
              </p>
            </CardHeader>
            <CardContent className="px-2 pb-3">
              <div className="space-y-1 max-h-[70vh] overflow-y-auto pr-1">
                {filteredFiles.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left transition-all ${
                      selectedFile.id === file.id
                        ? "bg-[#FFCB09]/15 border border-[#FFCB09]/30"
                        : "hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <span className="text-base flex-shrink-0">{getMimeEmoji(file.mimeType)}</span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-medium truncate ${
                          selectedFile.id === file.id ? "text-[#FFCB09]" : "text-white"
                        }`}
                      >
                        {file.name}
                      </p>
                      {file.modifiedTime && (
                        <p className="text-[10px] text-gray-600 truncate">
                          {formatDate(file.modifiedTime)}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
                {filteredFiles.length === 0 && (
                  <p className="text-xs text-gray-600 text-center py-4">
                    Niciun rezultat pentru &ldquo;{search}&rdquo;
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* PDF viewer panel */}
          <Card className="bg-[#2A2727] border-white/10 overflow-hidden">
            <PdfViewer
              file={selectedFile}
              files={viewerFiles}
              proxyPrefix={proxyPrefix}
              onClose={() => setSelectedFile(null)}
              onNavigate={(f) => setSelectedFile(f)}
            />
          </Card>
        </div>
      ) : (
        /* File list (no selection) */
        <Card className="bg-[#2A2727] border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base text-white">
              <span className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-[#FFCB09]" />
                Documente
              </span>
              {files.length > 0 && (
                <span className="text-xs text-gray-500 font-normal">{files.length} fisiere</span>
              )}
            </CardTitle>
            {/* Search bar */}
            {files.length > 0 && (
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Cauta dupa numele documentului..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-[#FFCB09]/30"
                />
              </div>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <FileSkeleton />
                <FileSkeleton />
                <FileSkeleton />
              </div>
            ) : !files.length ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <div className="p-3 rounded-full bg-white/5">
                  <FileIcon className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-sm text-gray-400">Nu exista documente in acest folder din Drive.</p>
                {emptyHint && <p className="text-xs text-gray-600">{emptyHint}</p>}
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <Search className="w-8 h-8 text-gray-600" />
                <p className="text-sm text-gray-400">
                  Niciun document nu corespunde cautarii &ldquo;{search}&rdquo;
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-gray-500 hover:text-white"
                  onClick={() => setSearch("")}
                >
                  Sterge cautarea
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredFiles.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => setSelectedFile(file)}
                    className="w-full group flex items-center gap-3 p-3 rounded-lg border border-white/10 hover:border-[#FFCB09]/50 hover:bg-[#FFCB09]/5 transition-all text-left"
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
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-xs text-gray-600 group-hover:text-[#FFCB09] transition-colors">
                        Deschide
                      </span>
                      <Maximize2 className="w-3.5 h-3.5 text-gray-600 group-hover:text-[#FFCB09] transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info note */}
      {!selectedFile && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
          <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-400">
            Click pe un document pentru a-l deschide direct in aceasta pagina.
            Fisierele sunt gestionate de administrator din Google Drive.
          </p>
        </div>
      )}
    </div>
  );
}
