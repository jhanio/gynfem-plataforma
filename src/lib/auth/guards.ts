import "server-only";

import { redirect } from "next/navigation";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Rol } from "./roles";

export interface PerfilSesion {
  id: string;
  email: string | null;
  nombreCompleto: string;
  rol: Rol;
}

/**
 * Devuelve el perfil del usuario autenticado y activo.
 * Redirige a /login si no hay sesión y a /cuenta-inactiva si está desactivado.
 *
 * Autoriza con getUser() (valida el JWT en el servidor), nunca getSession().
 */
export async function getPerfil(): Promise<PerfilSesion> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: perfil } = await supabase
    .from("profiles")
    .select("nombre_completo, rol, activo")
    .eq("id", user.id)
    .single();

  if (!perfil || !perfil.activo) {
    redirect("/cuenta-inactiva");
  }

  return {
    id: user.id,
    email: user.email ?? null,
    nombreCompleto: perfil.nombre_completo,
    rol: perfil.rol,
  };
}

/**
 * Comodidad de UX: exige que el usuario tenga uno de los roles permitidos.
 * Devuelve 404 si no lo tiene. La seguridad real la impone RLS igualmente.
 */
export async function requireRol(...permitidos: Rol[]): Promise<PerfilSesion> {
  const perfil = await getPerfil();
  if (!permitidos.includes(perfil.rol)) {
    notFound();
  }
  return perfil;
}
