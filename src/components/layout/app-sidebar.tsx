"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  MessageCircle,
  ScrollText,
  Settings,
  Stethoscope,
  UserCog,
  Users,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navegacionPrincipal = [
  { titulo: "Inicio", url: "/inicio", icono: LayoutDashboard },
  { titulo: "Agenda", url: "/agenda", icono: CalendarDays },
  { titulo: "Pacientes", url: "/pacientes", icono: Users },
  { titulo: "Seguimientos", url: "/seguimientos", icono: ClipboardList },
  { titulo: "Recordatorios", url: "/recordatorios", icono: MessageCircle },
  { titulo: "Dashboard", url: "/dashboard", icono: LayoutDashboard },
];

const navegacionAdministracion = [
  { titulo: "Usuarios", url: "/admin/usuarios", icono: UserCog },
  { titulo: "Servicios", url: "/admin/servicios", icono: Stethoscope },
  { titulo: "Auditoría", url: "/admin/auditoria", icono: ScrollText },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-3">
        <span className="text-lg font-semibold text-primary">GynFem</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navegacionPrincipal.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.url)}
                    tooltip={item.titulo}
                  >
                    <Link href={item.url}>
                      <item.icono />
                      <span>{item.titulo}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>
            <Settings className="mr-1 size-3.5" />
            Administración
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navegacionAdministracion.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.url)}
                    tooltip={item.titulo}
                  >
                    <Link href={item.url}>
                      <item.icono />
                      <span>{item.titulo}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-3 py-3 text-xs text-sidebar-foreground/70">
        BIOSALUD SS PERU S.A.C.
      </SidebarFooter>
    </Sidebar>
  );
}
