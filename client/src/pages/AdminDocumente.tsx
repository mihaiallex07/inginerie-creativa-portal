import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  FolderOpen,
  UserCheck,
  Trash2,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Shield,
  Settings,
  ExternalLink,
  FileText,
  ChevronDown,
  ChevronUp,
  Save,
  Loader2,
  Bell,
} from "lucide-react";
import { toast } from "sonner";

function driveLink(folderId: string) {
  return `https://drive.google.com/drive/folders/${folderId}`;
}

function EmployeeFileCount({ userId, folderId }: { userId: number; folderId: string }) {
  const { data, isLoading } = trpc.documents.getEmployeeFileCount.useQuery({ userId });
  if (isLoading) return <Skeleton className="h-4 w-12 inline-block" />;
  return (
    <span className="text-xs text-gray-500 flex items-center gap-1">
      <FileText className="w-3 h-3" />
      {data?.count ?? 0} {data?.count === 1 ? "fisier" : "fisiere"}
    </span>
  );
}

export default function AdminDocumente() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [selectedFolderName, setSelectedFolderName] = useState<string>("");

  // Settings panel state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newRootFolderId, setNewRootFolderId] = useState("");

  // Queries
  const { data: mappings, isLoading: loadingMappings } = trpc.documents.listMappings.useQuery();
  const { data: subfoldersData, isLoading: loadingFolders } = trpc.documents.listAngajatiSubfolders.useQuery();
  const { data: connectionData, isLoading: loadingConnection } = trpc.documents.testConnection.useQuery(
    undefined,
    { enabled: user?.role === "admin" }
  );
  const { data: driveSettings, isLoading: loadingSettings } = trpc.documents.getDriveSettings.useQuery(
    undefined,
    { enabled: user?.role === "admin" }
  );
  const { data: angajatiFolder } = trpc.documents.getAngajatiFolder.useQuery(
    undefined,
    { enabled: user?.role === "admin" || user?.role === "coordonator" }
  );

  // Get all users for the dropdown
  const { data: allUsers } = trpc.people.list.useQuery();

  // Mutations
  const setMapping = trpc.documents.setMapping.useMutation({
    onSuccess: () => {
      utils.documents.listMappings.invalidate();
      toast.success("Mapare salvata cu succes");
      setDialogOpen(false);
      setSelectedUserId("");
      setSelectedFolderId("");
      setSelectedFolderName("");
    },
    onError: (err) => toast.error(err.message),
  });

  const removeMapping = trpc.documents.removeMapping.useMutation({
    onSuccess: () => {
      utils.documents.listMappings.invalidate();
      toast.success("Mapare stearsa");
    },
    onError: (err) => toast.error(err.message),
  });

  const checkDriveChanges = trpc.documents.checkDriveChanges.useMutation({
    onSuccess: (data) => {
      const parts = [];
      if (data.totalNew > 0) parts.push(`${data.totalNew} noi`);
      if (data.totalModified > 0) parts.push(`${data.totalModified} modificate`);
      if (data.totalDeleted > 0) parts.push(`${data.totalDeleted} sterse`);
      if (parts.length === 0) {
        toast.success("Nicio modificare detectata in Drive.");
      } else {
        toast.success(`Modificari detectate: ${parts.join(", ")}. Notificari trimise.`);
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const updateDriveSettings = trpc.documents.updateDriveSettings.useMutation({
    onSuccess: () => {
      utils.documents.getDriveSettings.invalidate();
      utils.documents.testConnection.invalidate();
      utils.documents.listMappings.invalidate();
      utils.documents.listAngajatiSubfolders.invalidate();
      utils.documents.getAngajatiFolder.invalidate();
      toast.success("Setari Drive actualizate. Reconectare...");
      setSettingsOpen(false);
      setNewRootFolderId("");
    },
    onError: (err) => toast.error(err.message),
  });

  if (user?.role !== "admin") {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Acces restrictionat - doar administratori</p>
        </div>
      </div>
    );
  }

  const handleSaveMapping = () => {
    if (!selectedUserId || !selectedFolderId) {
      toast.error("Selecteaza un angajat si un folder");
      return;
    }
    setMapping.mutate({
      userId: parseInt(selectedUserId, 10),
      folderId: selectedFolderId,
      folderName: selectedFolderName,
    });
  };

  const handleSaveSettings = () => {
    if (!newRootFolderId.trim() || newRootFolderId.trim().length < 10) {
      toast.error("ID folder invalid (minim 10 caractere)");
      return;
    }
    updateDriveSettings.mutate({ rootFolderId: newRootFolderId.trim() });
  };

  const mappedUserIds = new Set(mappings?.map((m) => m.userId) ?? []);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#FFCB09]/10">
            <FolderOpen className="w-6 h-6 text-[#FFCB09]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Documente Drive - Admin</h1>
            <p className="text-sm text-gray-400" style={{color: "#270027"}}>
              Mapeaza folder-ul destinat fiecarui angajat.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Open HUB IC root in Drive */}
          {driveSettings?.rootFolderId && (
            <a
              href={driveLink(driveSettings.rootFolderId)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm" className="border-white/20 hover:text-white gap-2" style={{color: "#000000"}}>
                <ExternalLink className="w-4 h-4" />
                HUB IC
              </Button>
            </a>
          )}
          {/* Open Angajati folder in Drive */}
          {angajatiFolder?.folderId && (
            <a
              href={driveLink(angajatiFolder.folderId)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm" className="border-white/20 hover:text-white gap-2" style={{color: "#000000"}}>
                <ExternalLink className="w-4 h-4" />
                Angajati
              </Button>
            </a>
          )}
          {/* Settings toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSettingsOpen((v) => !v)}
            className="border-white/20 hover:text-white gap-2"
            style={{color: "#000000"}}
          >
            <Settings className="w-4 h-4" />
            Setari
            {settingsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => checkDriveChanges.mutate()}
            disabled={checkDriveChanges.isPending}
            className="border-white/20 hover:text-white gap-2"
            style={{ color: "#000000" }}
          >
            {checkDriveChanges.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Verificare...</>
            ) : (
              <><Bell className="w-4 h-4" />Verifica modificari</>
            )}
          </Button>
          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-[#FFCB09] text-black hover:bg-[#FFCB09]/90 gap-2"
          >
            <Plus className="w-4 h-4" />
            Adauga mapare
          </Button>
        </div>
      </div>

      {/* Settings panel (collapsible) */}
      {settingsOpen && (
        <Card className="bg-[#1E1B1B] border-[#FFCB09]/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#FFCB09]" />
              Setari Google Drive
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm text-gray-400">
                ID folder radacina HUB IC (Google Drive)
              </label>
              {loadingSettings ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <div className="flex items-center gap-2 p-2 rounded bg-white/5 border border-white/10">
                  <FolderOpen className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <code className="text-xs text-gray-300 flex-1 break-all">
                    {driveSettings?.rootFolderId}
                  </code>
                  {driveSettings?.isCustom && (
                    <Badge variant="outline" className="text-xs border-[#FFCB09]/30 text-[#FFCB09] flex-shrink-0">
                      Personalizat
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-gray-400">
                Schimba folder radacina HUB IC
              </label>
              <p className="text-xs text-gray-600">
                Gasesti ID-ul in URL-ul folderului din Google Drive:
                drive.google.com/drive/folders/<span className="text-[#FFCB09]">ID_FOLDER</span>
              </p>
              <div className="flex gap-2">
                <Input
                  value={newRootFolderId}
                  onChange={(e) => setNewRootFolderId(e.target.value)}
                  placeholder="Ex: 1OL49nEvwiwRwPmrTWJUqJpAoUhB3dwRZ"
                  className="bg-[#221F1F] border-white/20 text-white placeholder:text-gray-600 flex-1"
                />
                <Button
                  onClick={handleSaveSettings}
                  disabled={updateDriveSettings.isPending || !newRootFolderId.trim()}
                  className="bg-[#FFCB09] text-black hover:bg-[#FFCB09]/90 gap-2 flex-shrink-0"
                >
                  {updateDriveSettings.isPending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Salveaza
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Drive connection status */}
      <Card className="bg-[#2A2727] border-white/10">
        <CardContent className="p-4 flex items-center gap-3">
          {loadingConnection ? (
            <Skeleton className="h-5 w-48" />
          ) : connectionData?.connected ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Google Drive conectat</p>
                <p className="text-xs text-gray-500">
                  Service Account activ - acces la folderul HUB IC confirmat
                </p>
              </div>
              <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">
                Online
              </Badge>
            </>
          ) : (
            <>
              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-400">Google Drive - eroare conexiune</p>
                <p className="text-xs text-gray-500">
                  Verifica ca Service Account-ul are acces la folderul HUB IC.
                </p>
              </div>
              <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-xs">
                Offline
              </Badge>
            </>
          )}
        </CardContent>
      </Card>

      {/* Available folders in Drive */}
      <Card className="bg-[#2A2727] border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-[#FFCB09]" />
            Foldere disponibile in Drive (Angajati)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingFolders ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-3/4" />
            </div>
          ) : !subfoldersData?.subfolders.length ? (
            <p className="text-sm text-gray-500">
              Nu s-au gasit subfoldere in folderul Angajati din Drive.
              Asigura-te ca exista folderul Angajati in HUB IC si ca Service Account-ul are acces.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {subfoldersData.subfolders.map((folder) => (
                <a
                  key={folder.id}
                  href={driveLink(folder.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Deschide in Google Drive"
                >
                  <Badge
                    variant="outline"
                    className="border-white/20 text-gray-300 gap-1 hover:border-[#FFCB09]/50 hover:text-[#FFCB09] cursor-pointer transition-colors"
                  >
                    <FolderOpen className="w-3 h-3" />
                    {folder.name}
                    <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                  </Badge>
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current mappings */}
      <Card className="bg-[#2A2727] border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#FFCB09]" />
            Mapari active ({mappings?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingMappings ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : !mappings?.length ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              Nu exista mapari configurate. Adauga prima mapare folosind butonul de mai sus.
            </p>
          ) : (
            <div className="space-y-2">
              {mappings.map((m) => (
                <div
                  key={m.userId}
                  className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{m.userName}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {/* Clickable folder link */}
                      <a
                        href={driveLink(m.folderId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-500 flex items-center gap-1 hover:text-[#FFCB09] transition-colors group"
                        title="Deschide folderul in Google Drive"
                      >
                        <FolderOpen className="w-3 h-3" />
                        {m.folderName}
                        <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                      {/* File count */}
                      <EmployeeFileCount userId={m.userId} folderId={m.folderId} />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-600 hover:text-red-400 hover:bg-red-400/10"
                    onClick={() => removeMapping.mutate({ userId: m.userId })}
                    disabled={removeMapping.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add mapping dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#2A2727] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Adauga mapare folder Drive</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Select employee */}
            <div className="space-y-1.5">
              <label className="text-sm text-gray-400">Angajat</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="bg-[#221F1F] border-white/20 text-white">
                  <SelectValue placeholder="Selecteaza angajat..." />
                </SelectTrigger>
                <SelectContent className="bg-[#2A2727] border-white/20">
                  {allUsers
                    ?.filter((u) => !mappedUserIds.has(u.id))
                    .map((u) => (
                      <SelectItem key={u.id} value={String(u.id)} className="text-white hover:bg-white/10">
                        {u.name ?? u.email}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Select Drive folder */}
            <div className="space-y-1.5">
              <label className="text-sm text-gray-400">Folder Google Drive</label>
              {loadingFolders ? (
                <Skeleton className="h-10 w-full" />
              ) : !subfoldersData?.subfolders.length ? (
                <p className="text-xs text-red-400">
                  Nu s-au gasit subfoldere in Drive. Creeaza folderele in Google Drive mai intai.
                </p>
              ) : (
                <Select
                  value={selectedFolderId}
                  onValueChange={(val) => {
                    setSelectedFolderId(val);
                    const folder = subfoldersData.subfolders.find((f) => f.id === val);
                    setSelectedFolderName(folder?.name ?? "");
                  }}
                >
                  <SelectTrigger className="bg-[#221F1F] border-white/20 text-white">
                    <SelectValue placeholder="Selecteaza folder..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2A2727] border-white/20">
                    {subfoldersData.subfolders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id} className="text-white hover:bg-white/10">
                        <span className="flex items-center gap-2">
                          <FolderOpen className="w-3 h-3" />
                          {folder.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Anuleaza
            </Button>
            <Button
              onClick={handleSaveMapping}
              disabled={setMapping.isPending || !selectedUserId || !selectedFolderId}
              className="bg-[#FFCB09] text-black hover:bg-[#FFCB09]/90"
            >
              {setMapping.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                "Salveaza"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
