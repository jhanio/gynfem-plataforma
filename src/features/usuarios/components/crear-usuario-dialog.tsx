"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Copy, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { crearUsuario } from "@/features/usuarios/actions";
import { crearUsuarioSchema, ROLES, type CrearUsuarioInput } from "@/features/usuarios/schemas";
import { ROL_LABELS } from "@/features/usuarios/labels";

export function CrearUsuarioDialog() {
  const [abierto, setAbierto] = useState(false);
  const [pendiente, startTransition] = useTransition();
  const [passwordTemporal, setPasswordTemporal] = useState<string | null>(null);

  const form = useForm<CrearUsuarioInput>({
    resolver: zodResolver(crearUsuarioSchema),
    defaultValues: { nombreCompleto: "", email: "", rol: "asistente" },
  });

  function onSubmit(values: CrearUsuarioInput) {
    startTransition(async () => {
      const r = await crearUsuario(values);
      if (r.ok) {
        setPasswordTemporal(r.data.passwordTemporal);
        form.reset();
        toast.success("Usuario creado");
      } else {
        toast.error(r.error);
      }
    });
  }

  function copiarPassword() {
    if (passwordTemporal) {
      void navigator.clipboard.writeText(passwordTemporal);
      toast.success("Contraseña copiada");
    }
  }

  function cerrar(nuevoEstado: boolean) {
    setAbierto(nuevoEstado);
    if (!nuevoEstado) {
      setPasswordTemporal(null);
      form.reset();
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={cerrar}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus />
          Nuevo usuario
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo usuario</DialogTitle>
          <DialogDescription>
            Se creará con una contraseña temporal que deberás compartir de forma
            segura.
          </DialogDescription>
        </DialogHeader>

        {passwordTemporal ? (
          <div className="flex flex-col gap-4">
            <Alert>
              <AlertTitle>Contraseña temporal</AlertTitle>
              <AlertDescription className="flex flex-col gap-2">
                <span className="break-all font-mono text-sm">
                  {passwordTemporal}
                </span>
                <span className="text-xs text-muted-foreground">
                  Cópiala ahora: no se volverá a mostrar.
                </span>
              </AlertDescription>
            </Alert>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={copiarPassword}>
                <Copy />
                Copiar
              </Button>
              <Button type="button" onClick={() => cerrar(false)}>
                Listo
              </Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="nombreCompleto">Nombre completo</Label>
              <Input
                id="nombreCompleto"
                {...form.register("nombreCompleto")}
                disabled={pendiente}
              />
              {form.formState.errors.nombreCompleto ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.nombreCompleto.message}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                disabled={pendiente}
              />
              {form.formState.errors.email ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="rol">Rol</Label>
              <Select
                defaultValue={form.getValues("rol")}
                onValueChange={(v) =>
                  form.setValue("rol", v as CrearUsuarioInput["rol"])
                }
                disabled={pendiente}
              >
                <SelectTrigger id="rol">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((rol) => (
                    <SelectItem key={rol} value={rol}>
                      {ROL_LABELS[rol]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={pendiente}>
                {pendiente ? "Creando…" : "Crear usuario"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
