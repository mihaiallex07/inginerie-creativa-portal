import { Construction } from "lucide-react";

interface PlaceholderPageProps {
  title?: string;
  description?: string;
}

export default function PlaceholderPage({ title = "Pagină în construcție", description = "Această secțiune va fi disponibilă în curând." }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="h-16 w-16 rounded-2xl bg-[#FFCB09]/20 flex items-center justify-center mb-4">
        <Construction className="h-8 w-8 text-[#FFCB09]" />
      </div>
      <h2 className="text-lg font-bold text-foreground mb-2">{title}</h2>
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
    </div>
  );
}
