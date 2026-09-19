"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { fallo, type Resultado } from "@/lib/resultado";
import { loginSchema } from "./schemas";

/**
 * Inicia sesión con correo y contraseña.
 * No revela si el fallo es por usuario inexistente o contraseña incorrecta.
 */
export async function iniciarSesion(
  _prevState: Resultado | null,
  formData: FormData,
): Promise<Resultado> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return fallo("Revisa los campos: correo y contraseña son obligatorios.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return fallo("Correo o contraseña incorrectos.");
  }

  redirect("/inicio");
}

/** Cierra la sesión y vuelve a /login. */
export async function cerrarSesion(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
