import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DriveDocViewer from "@/components/DriveDocViewer";
import { FolderOpen } from "lucide-react";

export default function ProceseProceduri() {
  const input = useMemo(() => ({ subfolderName: "Procese & Proceduri" }), []);
  const { data, isLoading } = trpc.documents.listSubfolderFiles.useQuery(input);

  return (
    <DriveDocViewer
      files={data?.files}
      isLoading={isLoading}
      title="Procese & Proceduri"
      subtitle="Proceduri de lucru si procese interne ale companiei"
      icon={FolderOpen}
      proxyPrefix="/api/drive/public/"
      emptyHint="Adauga fisiere in folderul HUB IC / Procese & Proceduri din Google Drive."
    />
  );
}
