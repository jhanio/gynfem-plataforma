"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { guardarBorrador } from "@/features/atenciones/actions";
import {
  guardarBorradorSchema,
  type GuardarBorradorFormInput,
  type GuardarBorradorInput,
} from "@/features/atenciones/schemas";
import type { AtencionDetalle } from "@/features/atenciones/queries";
import { FirmarAtencionDialog } from "./firmar-atencion-dialog";

interface AtencionEditorProps {
  atencion: AtencionDetalle;
}

export function AtencionEditor({ atencion }: AtencionEditorProps) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();

  const form = useForm<GuardarBorradorFormInput, unknown, GuardarBorradorInput>({
    resolver: zodResolver(guardarBorradorSchema),
    defaultValues: {
      id: atencion.id,
      motivoConsulta: atencion.motivoConsulta,
      anamnesis: atencion.anamnesis ?? "",
      examenFisico: atencion.examenFisico ?? "",
      diagnostico: atencion.diagnostico ?? "",
      cie10: atencion.cie10.join(", "),
      planTratamiento: atencion.planTratamiento ?? "",
      indicaciones: atencion.indicaciones ?? "",
    },
  });

  const { errors } = form.formState;

  function onSubmit(values: GuardarBorradorInput) {
    startTransition(async () => {
      const r = await guardarBorrador(values);
      if (r.ok) {
        toast.success("Borrador guardado");
        router.refresh();
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="motivoConsulta">Motivo de consulta</Label>
        <Textarea
          id="motivoConsulta"
          rows={2}
          {...form.register("motivoConsulta")}
          disabled={pendiente}
        />
        {errors.motivoConsulta ? (
          <p className="text-sm text-destructive">{errors.motivoConsulta.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="anamnesis">Anamnesis</Label>
        <Textarea
          id="anamnesis"
          rows={4}
          {...form.register("anamnesis")}
          disabled={pendiente}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="examenFisico">Examen físico</Label>
        <Textarea
          id="examenFisico"
          rows={4}
          {...form.register("examenFisico")}
          disabled={pendiente}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="diagnostico">Diagnóstico</Label>
        <Textarea
          id="diagnostico"
          rows={3}
          {...form.register("diagnostico")}
          disabled={pendiente}
        />
      </div>

      <div className="flex flex-col gap-2 sm:max-w-md">
        <Label htmlFor="cie10">Códigos CIE-10</Label>
        <Input
          id="cie10"
          placeholder="p. ej. N80, R10.2"
          {...form.register("cie10")}
          disabled={pendiente}
        />
        <p className="text-xs text-muted-foreground">
          Separa los códigos por comas o espacios (una letra + dos dígitos, decimal
          opcional).
        </p>
        {errors.cie10 ? (
          <p className="text-sm text-destructive">
            {errors.cie10.message as string}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="planTratamiento">Plan de tratamiento</Label>
        <Textarea
          id="planTratamiento"
          rows={3}
          {...form.register("planTratamiento")}
          disabled={pendiente}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="indicaciones">Indicaciones</Label>
        <Textarea
          id="indicaciones"
          rows={3}
          {...form.register("indicaciones")}
          disabled={pendiente}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pendiente}>
          {pendiente ? "Guardando…" : "Guardar borrador"}
        </Button>
        <FirmarAtencionDialog atencionId={atencion.id} />
        <p className="text-xs text-muted-foreground">
          Guarda los cambios antes de firmar.
        </p>
      </div>
    </form>
  );
}
