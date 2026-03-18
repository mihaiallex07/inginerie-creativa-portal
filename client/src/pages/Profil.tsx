import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Mail, Phone, Briefcase, Building2, LogOut } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Administrator",
  admin_hr: "Administrator HR",
  manager: "Manager Departament",
  angajat: "Angajat",
  colaborator: "Colaborator Extern",
};

export default function Profil() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  if (!user) return null;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Profilul meu</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Informații personale și setări cont</p>
      </div>

      <Card className="border-border">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-full bg-[#FFCB09] flex items-center justify-center text-2xl font-bold text-[#221F1F] shrink-0">
              {user.name?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{user.name}</h2>
              <p className="text-sm text-muted-foreground">{ROLE_LABELS[user.role] ?? user.role}</p>
            </div>
          </div>

          <div className="space-y-3">
            {user.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-foreground">{user.email}</span>
              </div>
            )}
            {(user as any).phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-foreground">{(user as any).phone}</span>
              </div>
            )}
            {(user as any).jobTitle && (
              <div className="flex items-center gap-3 text-sm">
                <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-foreground">{(user as any).jobTitle}</span>
              </div>
            )}
            {(user as any).department && (
              <div className="flex items-center gap-3 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-foreground">{(user as any).department}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardContent className="p-4">
          <Button
            variant="outline"
            className="w-full gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Deconectare
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
