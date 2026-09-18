import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface Servicio {
  id: string;
  nombre: string;
  categoria: string;
  duracionMin: number;
  precioReferencial: number | null;
  activo: boolean;
}

/** Lista el catálogo de servicios (activos e inactivos), ordenado por nombre. */
export async function listarServicios(): Promise<Servicio[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("servicios")
    .select("id, nombre, categoria, duracion_min, precio_referencial, activo")
    .order("nombre", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map((s) => ({
    id: s.id,
    nombre: s.nombre,
    categoria: s.categoria,
    duracionMin: s.duracion_min,
    precioReferencial: s.precio_referencial,
    activo: s.activo,
  }));
}
