import { redirect } from "next/navigation";

import { getPerfil } from "@/lib/auth/guards";
import { rutaInicialParaRol } from "@/lib/auth/roles";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default async function InicioPage() {
  const perfil = await getPerfil();
  const destino = rutaInicialParaRol(perfil.rol);

  if (destino !== "/inicio") {
    redirect(destino);
  }

  return (
    <PlaceholderPage
      titulo={`Bienvenido, ${perfil.nombreCompleto}`}
      descripcion="No tienes módulos operativos asignados. Si crees que es un error, contacta al administrador."
    />
  );
}
