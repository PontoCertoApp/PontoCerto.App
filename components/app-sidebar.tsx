"use client";

import {
  LayoutDashboard,
  Users,
  FileText,
  Briefcase,
  Clock,
  AlertTriangle,
  Gift,
  Shirt,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
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
import { useSession, signOut } from "next-auth/react";
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
  const pathname = usePathname();
  const user = session?.user as any;

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="font-bold">PC</span>
          </div>
          <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
            <span className="font-bold text-lg">PontoCerto</span>
            <span className="text-xs text-muted-foreground">RH Integrado</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarMenu>
            {items.map((item) => {
              if (item.role && !item.role.includes(user?.role)) return null;

              const isActive = pathname.startsWith(item.url);

              return (
                <SidebarMenuItem key={item.title}>
                  {item.items ? (
                    <>
                      <SidebarMenuButton tooltip={item.title} isActive={isActive}>
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                      <SidebarMenuSub>
                        {item.items.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
                              <Link href={subItem.url}>{subItem.title}</Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </>
                  ) : (
                    <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user?.image} alt={user?.name} />
                    <AvatarFallback className="rounded-lg">
                      {user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-semibold">{user?.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.role}
                    </span>
                  </div>
                  <MoreHorizontal className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem asChild>
                  <Link href="/perfil" className="flex items-center gap-2">
                    <Settings className="size-4" />
                    <span>Configurações</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive flex items-center gap-2"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  <LogOut className="size-4" />
                  <span>Sair do Sistema</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
