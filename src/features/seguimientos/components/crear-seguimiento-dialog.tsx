"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CalendarClock } from "lucide-react";

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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { crearSeguimiento } from "@/features/seguimientos/actions";
import {
  crearSeguimientoSchema,
  TIPOS_SEGUIMIENTO,
  type CrearSeguimientoInput,
} from "@/features/seguimientos/schemas";
import { TIPO_SEGUIMIENTO_LABELS } from "@/features/seguimientos/labels";
import type { ResponsableSeguimiento } from "@/features/seguimientos/queries";

const SIN_RESPONSABLE = "sin_responsable";

interface CrearSeguimientoDialogProps {
  pacienteId: string;
  atencionId?: string;
  responsables: ResponsableSeguimiento[];
  etiquetaBoton?: string;
}

export function CrearSeguimientoDialog({
  pacienteId,
  atencionId,
  responsables,
  etiquetaBoton = "Registrar seguimiento",
}: CrearSeguimientoDialogProps) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [pendiente, startTransition] = useTransition();

  const form = useForm<CrearSeguimientoInput>({
    resolver: zodResolver(crearSeguimientoSchema),
    defaultValues: {
      pacienteId,
      atencionId,
      tipo: "control",
      descripcion: "",
      fechaObjetivo: "",
      responsableId: undefined,
    },
  });

  function onSubmit(values: CrearSeguimientoInput) {
    startTransition(async () => {
      const r = await crearSeguimiento(values);
      if (r.ok) {
        toast.success("Seguimiento registrado");
        cerrar(false);
        router.refresh();
      } else {
        toast.error(r.error);
      }
    });
  }

  function cerrar(nuevoEstado: boolean) {
    setAbierto(nuevoEstado);
    if (!nuevoEstado) {
      form.reset();
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={cerrar}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <CalendarClock />
          {etiquetaBoton}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar seguimiento</DialogTitle>
          <DialogDescription>
            La descripción es administrativa (por ejemplo, &quot;Control en 4
            semanas&quot;); el detalle clínico queda en la atención.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="seguimiento-tipo">Tipo</Label>
            <Select
              defaultValue={form.getValues("tipo")}
              onValueChange={(v) =>
                form.setValue("tipo", v as CrearSeguimientoInput["tipo"], {
                  shouldValidate: true,
                })
              }
              disabled={pendiente}
            >
              <SelectTrigger id="seguimiento-tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_SEGUIMIENTO.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {TIPO_SEGUIMIENTO_LABELS[tipo]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="seguimiento-descripcion">Descripción</Label>
            <Textarea
              id="seguimiento-descripcion"
              placeholder='Ej.: "Control en 4 semanas"'
              {...form.register("descripcion")}
              disabled={pendiente}
            />
            <p className="text-xs text-muted-foreground">
              No escribas datos clínicos (diagnósticos, resultados, tratamientos):
              esta descripción también la puede ver el personal de recepción.
            </p>
            {form.formState.errors.descripcion ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.descripcion.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="seguimiento-fecha">Fecha objetivo</Label>
            <Input
              id="seguimiento-fecha"
              type="date"
              {...form.register("fechaObjetivo")}
              disabled={pendiente}
            />
            {form.formState.errors.fechaObjetivo ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.fechaObjetivo.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="seguimiento-responsable">Responsable (opcional)</Label>
            <Select
              defaultValue={SIN_RESPONSABLE}
              onValueChange={(v) =>
                form.setValue("responsableId", v === SIN_RESPONSABLE ? undefined : v, {
                  shouldValidate: true,
                })
              }
              disabled={pendiente}
            >
              <SelectTrigger id="seguimiento-responsable">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SIN_RESPONSABLE}>Sin asignar</SelectItem>
                {responsables.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.nombreCompleto}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pendiente}>
              {pendiente ? "Guardando…" : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
