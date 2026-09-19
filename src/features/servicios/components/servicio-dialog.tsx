"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
import { Checkbox } from "@/components/ui/checkbox";
import { crearServicio, editarServicio } from "@/features/servicios/actions";
import {
  servicioSchema,
  type ServicioFormInput,
  type ServicioInput,
} from "@/features/servicios/schemas";
import type { Servicio } from "@/features/servicios/queries";

interface ServicioDialogProps {
  trigger: ReactNode;
  servicio?: Servicio;
}

export function ServicioDialog({ trigger, servicio }: ServicioDialogProps) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [pendiente, startTransition] = useTransition();
  const esEdicion = Boolean(servicio);

  const form = useForm<ServicioFormInput, unknown, ServicioInput>({
    resolver: zodResolver(servicioSchema),
    defaultValues: {
      nombre: servicio?.nombre ?? "",
      categoria: servicio?.categoria ?? "",
      duracionMin: servicio?.duracionMin ?? 30,
      precioReferencial: servicio?.precioReferencial ?? null,
      activo: servicio?.activo ?? true,
    },
  });

  const activo = useWatch({ control: form.control, name: "activo" });

  function onSubmit(values: ServicioInput) {
    startTransition(async () => {
      const r = esEdicion
        ? await editarServicio({ ...values, id: servicio!.id })
        : await crearServicio(values);

      if (r.ok) {
        toast.success(esEdicion ? "Servicio actualizado" : "Servicio creado");
        setAbierto(false);
        if (!esEdicion) form.reset();
        router.refresh();
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {esEdicion ? "Editar servicio" : "Nuevo servicio"}
          </DialogTitle>
          <DialogDescription>
            Define nombre, categoría, duración y precio referencial.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" {...form.register("nombre")} disabled={pendiente} />
            {form.formState.errors.nombre ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.nombre.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="categoria">Categoría</Label>
            <Input
              id="categoria"
              {...form.register("categoria")}
              disabled={pendiente}
            />
            {form.formState.errors.categoria ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.categoria.message}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="duracionMin">Duración (min)</Label>
              <Input
                id="duracionMin"
                type="number"
                min={5}
                max={480}
                {...form.register("duracionMin", { valueAsNumber: true })}
                disabled={pendiente}
              />
              {form.formState.errors.duracionMin ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.duracionMin.message}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="precioReferencial">Precio (S/)</Label>
              <Input
                id="precioReferencial"
                type="number"
                min={0}
                step="0.01"
                placeholder="Opcional"
                {...form.register("precioReferencial")}
                disabled={pendiente}
              />
              {form.formState.errors.precioReferencial ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.precioReferencial.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="activo"
              checked={activo}
              onCheckedChange={(v) => form.setValue("activo", v === true)}
              disabled={pendiente}
            />
            <Label htmlFor="activo">Activo</Label>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pendiente}>
              {pendiente ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
