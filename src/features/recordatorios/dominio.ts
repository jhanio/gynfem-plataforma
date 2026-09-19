/**
 * Normaliza un teléfono peruano a formato internacional para wa.me: "51" +
 * 9 dígitos que empiezan en 9 (celular). Ignora espacios, guiones y un
 * prefijo "+51"/"51" ya incluido. Devuelve null si no es un celular válido.
 */
export function normalizarTelefonoPeru(telefono: string | null | undefined): string | null {
  if (!telefono) return null;

  const soloDigitos = telefono.replace(/[\s-]/g, "").replace(/^\+/, "");
  const local = soloDigitos.startsWith("51") && soloDigitos.length === 11
    ? soloDigitos.slice(2)
    : soloDigitos;

  if (!/^9[0-9]{8}$/.test(local)) {
    return null;
  }
  return `51${local}`;
}

/** URL de wa.me con el mensaje prellenado (HU-15). Null si el teléfono no es válido. */
export function construirUrlWhatsapp(telefono: string | null | undefined, mensaje: string): string | null {
  const normalizado = normalizarTelefonoPeru(telefono);
  if (!normalizado) return null;
  return `https://wa.me/${normalizado}?text=${encodeURIComponent(mensaje)}`;
}
