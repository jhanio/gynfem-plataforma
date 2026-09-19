import type { Database } from "@/types/database.types";

export type EstadoAtencion = Database["public"]["Enums"]["estado_atencion"];

/** Un borrador es editable; una atención firmada es inmutable (adenda para corregir). */
export function puedeEditarAtencion(estado: EstadoAtencion): boolean {
  return estado === "borrador";
}

/** Solo un borrador puede firmarse. */
export function puedeFirmarAtencion(estado: EstadoAtencion): boolean {
  return estado === "borrador";
}

/** Las adendas solo se registran sobre atenciones ya firmadas. */
export function puedeAgregarAdenda(estado: EstadoAtencion): boolean {
  return estado === "firmada";
}
