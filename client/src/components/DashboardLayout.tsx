import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  ChevronRight,
  Clock,
  FileText,
  FolderOpen,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Newspaper,
  PanelLeft,
  Settings,
  Timer,
  User,
  Users,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";

const LOGO_YELLOW = "https://d2xsxph8kpxj0f.cloudfront.net/310519663448137464/2gvgk32MDhEEiC7DrEzbf4/LOGOtipgalben_c557a302.png";
const LOGO_ICON = "https://d2xsxph8kpxj0f.cloudfront.net/310519663448137464/2gvgk32MDhEEiC7DrEzbf4/logogalben_d1fef82c.png";

const navSections = [
  {
    label: "PRINCIPAL",
    items: [
      { icon: LayoutDashboard, label: "Tablou de bord", path: "/" },
      { icon: Newspaper, label: "Știri & Anunțuri", path: "/stiri" },
    ],
  },
  {
    label: "TIMP & PREZENȚĂ",
    items: [
      { icon: Clock, label: "Pontaj zilnic", path: "/pontaj", badge: "NOU" },
      { icon: Timer, label: "Time-Tracking", path: "/time-tracking", badge: "NOU" },
      { icon: FileText, label: "Cereri concediu", path: "/cereri" },
    ],
  },
  {
    label: "COMPANIE",
    items: [
      { icon: Building2, label: "Viziune & Valori", path: "/viziune" },
      { icon: BookOpen, label: "Regulament intern", path: "/regulament" },
      { icon: Users, label: "Organigramă", path: "/organigrama" },
    ],
  },
  {
    label: "LUCRU",
    items: [
      { icon: FolderOpen, label: "Procese & Proceduri", path: "/procese" },
      { icon: BookOpen, label: "Bibliotecă tehnică", path: "/biblioteca" },
      { icon: FolderOpen, label: "Proiecte (Drive)", path: "/proiecte" },
      { icon: FileText, label: "Formulare & Cereri", path: "/formulare" },
    ],
  },
  {
    label: "PERSONAL",
    items: [
      { icon: FileText, label: "Documentele mele", path: "/documente" },
      { icon: Lightbulb, label: "Propunerile mele", path: "/propuneri" },
      { icon: User, label: "Profilul meu", path: "/profil" },
    ],
  },
  {
    label: "ADMINISTRARE",
    items: [
      { icon: BarChart3, label: "Rapoarte HR", path: "/rapoarte-hr" },
    ],
  },
];

const SIDEBAR_WIDTH_KEY = "ic-sidebar-width";
const DEFAULT_WIDTH = 220;
const MIN_WIDTH = 180;
const MAX_WIDTH = 320;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#221F1F]">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <img src={LOGO_YELLOW} alt="Inginerie Creativă" className="h-12 object-contain" />
          <div className="flex flex-col items-center gap-3 text-center">
            <h1 className="text-2xl font-bold text-white tracking-tight">Portal Intern</h1>
            <p className="text-sm text-gray-400 max-w-xs">
              Accesul este restricționat exclusiv angajaților cu adresă{" "}
              <span className="text-[#FFCB09] font-medium">@ingineriecreativa.ro</span>
            </p>
          </div>
          <Button
            onClick={() => { window.location.href = getLoginUrl(); }}
            size="lg"
            className="w-full bg-[#FFCB09] hover:bg-yellow-400 text-[#221F1F] font-semibold shadow-lg"
          >
            Autentificare cu Google
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: {
  children: React.ReactNode;
  setSidebarWidth: (w: number) => void;
}) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Notifications count — will be wired after router is added
  const unreadCount = 0;

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "?";

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r-0" disableTransition={isResizing}>
          {/* Header */}
          <SidebarHeader className="h-16 border-b border-sidebar-border">
            <div className="flex items-center gap-3 px-3 h-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-sidebar-accent transition-colors shrink-0 focus:outline-none"
                aria-label="Toggle navigation"
              >
                {isCollapsed ? (
                  <img src={LOGO_ICON} alt="IC" className="h-6 w-6 object-contain" />
                ) : (
                  <PanelLeft className="h-4 w-4 text-sidebar-foreground/60" />
                )}
              </button>
              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <img src={LOGO_YELLOW} alt="Inginerie Creativă" className="h-6 object-contain object-left" />
                  <span className="text-[10px] text-sidebar-foreground/50 mt-0.5 tracking-wider uppercase">Portal intern</span>
                </div>
              )}
            </div>
          </SidebarHeader>

          {/* Navigation */}
          <SidebarContent className="gap-0 py-2 overflow-y-auto">
            {navSections.map((section) => (
              <div key={section.label} className="mb-1">
                {!isCollapsed && (
                  <p className="px-4 py-1.5 text-[10px] font-semibold tracking-widest text-sidebar-foreground/40 uppercase">
                    {section.label}
                  </p>
                )}
                <SidebarMenu className="px-2">
                  {section.items.map((item) => {
                    const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => setLocation(item.path)}
                          tooltip={item.label}
                          className={`h-9 text-sm transition-all font-normal rounded-md
                            ${isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-[#FFCB09] pl-[calc(0.5rem-2px)]"
                              : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                            }`}
                        >
                          <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-[#FFCB09]" : ""}`} />
                          <span className="truncate">{item.label}</span>
                          {item.badge && !isCollapsed && (
                            <span className="ml-auto text-[9px] font-bold bg-[#FFCB09] text-[#221F1F] px-1.5 py-0.5 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </div>
            ))}
          </SidebarContent>

          {/* Footer */}
          <SidebarFooter className="border-t border-sidebar-border p-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-sidebar-accent/50 transition-colors w-full text-left focus:outline-none group-data-[collapsible=icon]:justify-center">
                  <Avatar className="h-8 w-8 shrink-0 border border-sidebar-border">
                    <AvatarImage src={user?.avatarUrl ?? undefined} />
                    <AvatarFallback className="text-xs font-semibold bg-[#FFCB09] text-[#221F1F]">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-sidebar-foreground truncate leading-none">
                        {user?.name || "—"}
                      </p>
                      <p className="text-[10px] text-sidebar-foreground/50 truncate mt-1">
                        {user?.email || "—"}
                      </p>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="w-52 mb-1">
                <div className="px-3 py-2 border-b">
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <DropdownMenuItem onClick={() => setLocation("/profil")} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profilul meu</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/setari")} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Setări</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Deconectare</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Resize handle */}
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-[#FFCB09]/30 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {/* Mobile header */}
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-3 backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg" />
              <img src={LOGO_ICON} alt="IC" className="h-7 w-7 object-contain" />
            </div>
            <button
              onClick={() => setLocation("/notificari")}
              className="relative h-9 w-9 flex items-center justify-center rounded-lg hover:bg-accent transition-colors"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 flex items-center justify-center bg-[#FFCB09] text-[#221F1F] text-[9px] font-bold rounded-full">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Desktop topbar */}
        {!isMobile && (
          <div className="flex border-b h-12 items-center justify-end bg-background/95 px-4 backdrop-blur sticky top-0 z-40 gap-2">
            <button
              onClick={() => setLocation("/notificari")}
              className="relative h-8 w-8 flex items-center justify-center rounded-lg hover:bg-accent transition-colors"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 h-4 w-4 flex items-center justify-center bg-[#FFCB09] text-[#221F1F] text-[9px] font-bold rounded-full">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            <Avatar className="h-7 w-7 border border-border cursor-pointer" onClick={() => setLocation("/profil")}>
              <AvatarImage src={user?.avatarUrl ?? undefined} />
              <AvatarFallback className="text-[10px] font-semibold bg-[#FFCB09] text-[#221F1F]">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-foreground/80 max-w-[160px] truncate">
              {user?.name}
            </span>
          </div>
        )}

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
