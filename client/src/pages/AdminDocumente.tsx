import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
} from "lucide-react";
import { toast } from "sonner";

export default function AdminDocumente() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [selectedFolderName, setSelectedFolderName] = useState<string>("");

  // Queries
  const { data: mappings, isLoading: loadingMappings } = trpc.documents.listMappings.useQuery();
  const { data: subfoldersData, isLoading: loadingFolders } = trpc.documents.listAngajatiSubfolders.useQuery();
  const { data: connectionData, isLoading: loadingConnection } = trpc.documents.testConnection.useQuery(
    undefined,
    { enabled: user?.role === "admin" }
  );

  // Get all users for the dropdown
  const { data: allUsers } = trpc.people.list.useQuery();

  // Mutations
  const setMapping = trpc.documents.setMapping.useMutation({
    onSuccess: () => {
      utils.documents.listMappings.invalidate();
      toast.success("Mapare salvată cu succes");
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
      toast.success("Mapare ștearsă");
    },
    onError: (err) => toast.error(err.message),
  });

  if (user?.role !== "admin") {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Acces restricționat — doar administratori</p>
        </div>
      </div>
    );
  }

  const handleSaveMapping = () => {
    if (!selectedUserId || !selectedFolderId) {
      toast.error("Selectează un angajat și un folder");
      return;
    }
    setMapping.mutate({
      userId: parseInt(selectedUserId, 10),
      folderId: selectedFolderId,
      folderName: selectedFolderName,
    });
  };

  const mappedUserIds = new Set(mappings?.map((m) => m.userId) ?? []);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#FFCB09]/10">
            <FolderOpen className="w-6 h-6 text-[#FFCB09]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Documente Drive — Admin</h1>
            <p className="text-sm text-gray-400">
              Mapează foldere Google Drive la angajați
            </p>
          </div>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-[#FFCB09] text-black hover:bg-[#FFCB09]/90 gap-2"
        >
          <Plus className="w-4 h-4" />
          Adaugă mapare
        </Button>
      </div>

      {/* Drive connection status */}
      <Card className="bg-[#2A2727] border-white/10">
        <CardContent className="p-4 flex items-center gap-3">
          {loadingConnection ? (
            <Skeleton className="h-5 w-48" />
          ) : connectionData?.connected ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">Google Drive conectat</p>
                <p className="text-xs text-gray-500">
                  Service Account: hub-ic-drive@portal-inginerie-creativa.iam.gserviceaccount.com
                </p>
              </div>
            </>
          ) : (
            <>
              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-400">Google Drive — eroare conexiune</p>
                <p className="text-xs text-gray-500">
                  Verifică că Service Account-ul are acces la folderul HUB IC.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Available folders in Drive */}
      <Card className="bg-[#2A2727] border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-[#FFCB09]" />
            Foldere disponibile în Drive (Angajați)
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
              Nu s-au găsit subfoldere în folderul „Angajați" din Drive.
              Asigură-te că există folderul „Angajați" în HUB IC și că Service Account-ul are acces.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {subfoldersData.subfolders.map((folder) => (
                <Badge
                  key={folder.id}
                  variant="outline"
                  className="border-white/20 text-gray-300 gap-1"
                >
                  <FolderOpen className="w-3 h-3" />
                  {folder.name}
                </Badge>
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
            Mapări active ({mappings?.length ?? 0})
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
              Nu există mapări configurate. Adaugă prima mapare folosind butonul de mai sus.
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
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <FolderOpen className="w-3 h-3" />
                      {m.folderName}
                    </p>
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
            <DialogTitle className="text-white">Adaugă mapare folder Drive</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Select employee */}
            <div className="space-y-1.5">
              <label className="text-sm text-gray-400">Angajat</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="bg-[#221F1F] border-white/20 text-white">
                  <SelectValue placeholder="Selectează angajat..." />
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
                  Nu s-au găsit subfoldere în Drive. Creează folderele în Google Drive mai întâi.
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
                    <SelectValue placeholder="Selectează folder..." />
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
              Anulează
            </Button>
            <Button
              onClick={handleSaveMapping}
              disabled={setMapping.isPending || !selectedUserId || !selectedFolderId}
              className="bg-[#FFCB09] text-black hover:bg-[#FFCB09]/90"
            >
              {setMapping.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                "Salvează"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
