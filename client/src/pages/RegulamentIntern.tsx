import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DriveDocViewer from "@/components/DriveDocViewer";
import { BookOpen } from "lucide-react";

export default function RegulamentIntern() {
  const input = useMemo(() => ({ subfolderName: "Regulament intern" }), []);
  const { data, isLoading } = trpc.documents.listSubfolderFiles.useQuery(input);

  return (
    <DriveDocViewer
      files={data?.files}
      isLoading={isLoading}
      title="Regulament intern"
      subtitle="Regulamentul de ordine interioara si politicile companiei"
      icon={BookOpen}
      proxyPrefix="/api/drive/public/"
      emptyHint="Adauga fisiere in folderul HUB IC / Regulament intern din Google Drive."
    />
  );
}
