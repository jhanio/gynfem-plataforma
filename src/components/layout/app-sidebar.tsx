"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CircleUser,
  ClipboardList,
  Home,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  ScrollText,
  Settings,
  Stethoscope,
  UserCog,
  Users,
  type LucideIcon,
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
import { menuParaRol, type Rol } from "@/lib/auth/roles";
import { cerrarSesion } from "@/features/auth/actions";

const ICONOS: Record<string, LucideIcon> = {
  "/inicio": Home,
  "/agenda": CalendarDays,
  "/pacientes": Users,
  "/seguimientos": ClipboardList,
  "/recordatorios": MessageCircle,
  "/dashboard": LayoutDashboard,
  "/admin/usuarios": UserCog,
  "/admin/servicios": Stethoscope,
  "/admin/auditoria": ScrollText,
};

interface AppSidebarProps {
  rol: Rol;
  nombreCompleto: string;
  email: string | null;
}

export function AppSidebar({ rol, nombreCompleto, email }: AppSidebarProps) {
  const pathname = usePathname();
  const items = menuParaRol(rol);
  const principales = items.filter((i) => i.grupo === "principal");
  const administracion = items.filter((i) => i.grupo === "administracion");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-3">
        <span className="text-lg font-semibold text-primary">GynFem</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {principales.map((item) => {
                const Icono = ICONOS[item.url] ?? Home;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(item.url)}
                      tooltip={item.titulo}
                    >
                      <Link href={item.url}>
                        <Icono />
                        <span>{item.titulo}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {administracion.length > 0 ? (
          <SidebarGroup>
            <SidebarGroupLabel>
              <Settings className="mr-1 size-3.5" />
              Administración
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {administracion.map((item) => {
                  const Icono = ICONOS[item.url] ?? Settings;
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname.startsWith(item.url)}
                        tooltip={item.titulo}
                      >
                        <Link href={item.url}>
                          <Icono />
                          <span>{item.titulo}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>
      <SidebarFooter className="gap-2 px-3 py-3">
        <div className="min-w-0 group-data-[collapsible=icon]:hidden">
          <p className="truncate text-sm font-medium">{nombreCompleto}</p>
          <p className="truncate text-xs text-sidebar-foreground/70">
            {email ?? rol}
          </p>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/cuenta")}
              tooltip="Mi cuenta"
            >
              <Link href="/cuenta">
                <CircleUser />
                <span>Mi cuenta</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <form action={cerrarSesion}>
              <SidebarMenuButton
                type="submit"
                tooltip="Cerrar sesión"
                className="w-full"
              >
                <LogOut />
                <span>Cerrar sesión</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
