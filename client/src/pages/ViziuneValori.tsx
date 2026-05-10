import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DriveDocViewer from "@/components/DriveDocViewer";
import { Building2 } from "lucide-react";

export default function ViziuneValori() {
  const input = useMemo(() => ({ subfolderName: "Viziune & Valori" }), []);
  const { data, isLoading } = trpc.documents.listSubfolderFiles.useQuery(input);

  return (
    <DriveDocViewer
      files={data?.files}
      isLoading={isLoading}
      title="Viziune & Valori"
      subtitle="Misiunea, viziunea si valorile companiei Inginerie Creativa"
      icon={Building2}
      proxyPrefix="/api/drive/public/"
      emptyHint="Adauga fisiere in folderul HUB IC / Viziune & Valori din Google Drive."
    />
  );
}
