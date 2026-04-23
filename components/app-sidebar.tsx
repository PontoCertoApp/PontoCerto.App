"use client";

import {
  LayoutDashboard,
  Users,
  FileText,
  Clock,
  AlertTriangle,
  Gift,
  Shirt,
  BarChart3,
  Settings,
  LogOut,
  MoreHorizontal,
  Building2,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "next-auth/react";
import { logout } from "@/actions/logout";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Colaboradores",
    url: "/colaboradores",
    icon: Users,
    role: ["RH", "GERENTE"],
  },
  {
    title: "Documentação",
    url: "/documentos",
    icon: FileText,
  },
  {
    title: "Tratamento de Ponto",
    url: "/ponto",
    icon: Clock,
    role: ["RH", "GERENTE"],
  },
  {
    title: "Penalidades (RAP)",
    url: "/penalidades",
    icon: AlertTriangle,
  },
  {
    title: "Prêmios & Benefícios",
    url: "/premios",
    icon: Gift,
  },
  {
    title: "Controle de Uniformes",
    url: "/uniformes",
    icon: Shirt,
  },
  {
    title: "Funções & Lojas",
    url: "/config",
    icon: Building2,
    role: ["RH"],
    items: [
      { title: "Funções", url: "/config/funcoes" },
      { title: "Lojas", url: "/config/lojas" },
      { title: "Setores", url: "/config/setores" },
    ],
  },
  {
    title: "Relatórios",
    url: "/relatorios",
    icon: BarChart3,
    role: ["RH", "GERENTE"],
  },
];

export function AppSidebar() {
  const { data: session } = useSession();
  const { theme } = useTheme();
  const pathname = usePathname();
  const user = session?.user;

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-r-0 shadow-xl bg-background/95 backdrop-blur-md">
      <SidebarHeader className="h-20 flex justify-center px-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/10 to-transparent opacity-50" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <span className="font-black text-lg italic">PC</span>
          </div>
          <div className="flex flex-col gap-0 leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-black text-xl tracking-tighter text-foreground">PontoCerto</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70">RH Integrado</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            {items.map((item) => {
              if (item.role && !item.role.includes(user?.role ?? "")) return null;

              const isActive = pathname.startsWith(item.url);

              return (
                <SidebarMenuItem key={item.title}>
                  {item.items ? (
                    <>
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={isActive}
                        className={`font-semibold h-10 transition-all rounded-lg ${isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
                      >
                        <item.icon className={`size-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                      <SidebarMenuSub className="border-l-2 ml-6 border-primary/10">
                        {item.items.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              render={<Link href={subItem.url} />}
                              isActive={pathname === subItem.url}
                              className={`h-8 text-xs font-medium ${pathname === subItem.url ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"}`}
                            >
                              {subItem.title}
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </>
                  ) : (
                    <SidebarMenuButton
                      render={<Link href={item.url} />}
                      tooltip={item.title}
                      isActive={isActive}
                      className={`font-semibold h-10 transition-all rounded-lg ${isActive ? "bg-primary/10 text-primary shadow-sm" : "hover:bg-muted"}`}
                    >
                      <item.icon className={`size-5 ${isActive ? "text-primary animate-in zoom-in-50 duration-300" : "text-muted-foreground"}`} />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50 p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger render={<SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground rounded-xl transition-all hover:bg-muted active:scale-95" />}>
                <Avatar className="h-9 w-9 border-2 border-primary/10 shadow-sm">
                  <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? undefined} />
                  <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                    {user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden ml-2">
                  <span className="truncate font-bold text-foreground">{user?.name}</span>
                  <span className="truncate text-[10px] font-black uppercase text-primary/60">
                    {user?.role}
                  </span>
                </div>
                <MoreHorizontal className="ml-auto size-4 group-data-[collapsible=icon]:hidden opacity-40 hover:opacity-100 transition-opacity" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-64 rounded-xl border-border/50 shadow-2xl p-2"
                side="top"
                align="end"
                sideOffset={10}
              >
                <div className="flex items-center gap-3 p-3 border-b mb-1 border-border/50">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">{user?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">{user?.name}</span>
                    <span className="text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                </div>
                <DropdownMenuItem
                  render={<Link href="/dashboard" />}
                  className="rounded-lg h-10 cursor-pointer flex items-center gap-2"
                >
                  <Settings className="size-4 opacity-70" />
                  <span>Configurações da Conta</span>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      await logout();
                      window.location.replace("/login");
                    }}
                    className="text-destructive w-full focus:bg-destructive/10 focus:text-destructive rounded-lg h-10 cursor-pointer flex items-center gap-2 px-2"
                  >
                    <LogOut className="size-4" />
                    <span>Sair do PontoCerto</span>
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
