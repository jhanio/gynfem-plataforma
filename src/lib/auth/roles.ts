import type { Database } from "@/types/database.types";

export type Rol = Database["public"]["Enums"]["app_rol"];

export type GrupoMenu = "principal" | "administracion";

export interface ItemMenu {
  titulo: string;
  url: string;
  roles: readonly Rol[];
  grupo: GrupoMenu;
}

/**
 * Mapa único de navegación y autorización de UI por rol.
 * La autorización real vive en RLS; esto solo decide qué muestra la interfaz.
 */
export const MENU: readonly ItemMenu[] = [
  {
    titulo: "Inicio",
    url: "/inicio",
    grupo: "principal",
    roles: ["admin", "medico", "obstetra", "asistente", "soporte"],
  },
  {
    titulo: "Agenda",
    url: "/agenda",
    grupo: "principal",
    roles: ["admin", "medico", "obstetra", "asistente"],
  },
  {
    titulo: "Pacientes",
    url: "/pacientes",
    grupo: "principal",
    roles: ["admin", "medico", "obstetra", "asistente"],
  },
  {
    titulo: "Seguimientos",
    url: "/seguimientos",
    grupo: "principal",
    roles: ["admin", "medico", "obstetra", "asistente"],
  },
  {
    titulo: "Recordatorios",
    url: "/recordatorios",
    grupo: "principal",
    roles: ["admin", "asistente"],
  },
  {
    titulo: "Dashboard",
    url: "/dashboard",
    grupo: "principal",
    roles: ["admin", "medico", "obstetra"],
  },
  {
    titulo: "Usuarios",
    url: "/admin/usuarios",
    grupo: "administracion",
    roles: ["admin"],
  },
  {
    titulo: "Servicios",
    url: "/admin/servicios",
    grupo: "administracion",
    roles: ["admin"],
  },
  {
    titulo: "Auditoría",
    url: "/admin/auditoria",
    grupo: "administracion",
    roles: ["admin"],
  },
] as const;

/** Ítems de menú visibles para un rol, en orden de declaración. */
export function menuParaRol(rol: Rol): ItemMenu[] {
  return MENU.filter((item) => item.roles.includes(rol));
}

/** ¿El rol puede ver una ruta (coincidencia exacta o por prefijo de segmento)? */
export function puedeVerRuta(rol: Rol, pathname: string): boolean {
  return MENU.some(
    (item) =>
      item.roles.includes(rol) &&
      (pathname === item.url || pathname.startsWith(`${item.url}/`)),
  );
}

/** Primera ruta destino tras iniciar sesión (omite "/inicio" si hay otra). */
export function rutaInicialParaRol(rol: Rol): string {
  const destino = menuParaRol(rol).find((item) => item.url !== "/inicio");
  return destino?.url ?? "/inicio";
}
