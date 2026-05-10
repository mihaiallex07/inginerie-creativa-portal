import { useMemo } from "react";
import { trpc } from "../lib/trpc";
import DriveDocViewer from "@/components/DriveDocViewer";
import { BookOpen } from "lucide-react";

export default function BibliotecaTehnica() {
  const input = useMemo(() => ({ subfolderName: "Biblioteca tehnica" }), []);
  const { data, isLoading } = trpc.documents.listSubfolderFiles.useQuery(input);

  return (
    <DriveDocViewer
      files={data?.files}
      isLoading={isLoading}
      title="Biblioteca tehnica"
      subtitle="Normative, standarde, detalii tipice, specifice si integrate interne"
      icon={BookOpen}
      proxyPrefix="/api/drive/public/"
      emptyHint="Adauga fisiere in folderul HUB IC / Biblioteca tehnica din Google Drive."
    />
  );
}
