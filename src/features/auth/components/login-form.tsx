"use client";

import { useActionState } from "react";

import { iniciarSesion } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function LoginForm() {
  const [estado, formAction, pendiente] = useActionState(iniciarSesion, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {estado && !estado.ok ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{estado.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={pendiente}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={pendiente}
        />
      </div>

      <Button type="submit" className="mt-2" disabled={pendiente}>
        {pendiente ? "Ingresando…" : "Iniciar sesión"}
      </Button>
    </form>
  );
}
