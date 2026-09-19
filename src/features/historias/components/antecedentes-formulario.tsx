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
import { guardarHistoria } from "@/features/historias/actions";
import {
  historiaSchema,
  type HistoriaFormInput,
  type HistoriaInput,
} from "@/features/historias/schemas";
import type { Antecedentes } from "@/features/historias/queries";

interface AntecedentesFormularioProps {
  pacienteId: string;
  antecedentes: Antecedentes | null;
}

function valoresIniciales(a: Antecedentes | null): HistoriaFormInput {
  return {
    grupoSanguineo: a?.grupoSanguineo ?? "",
    alergias: a?.alergias ?? "",
    menarquiaEdad: a?.menarquiaEdad ?? "",
    gestas: a?.gestas ?? "",
    partos: a?.partos ?? "",
    abortos: a?.abortos ?? "",
    cesareas: a?.cesareas ?? "",
    fechaUltimaRegla: a?.fechaUltimaRegla ?? "",
    metodoAnticonceptivo: a?.metodoAnticonceptivo ?? "",
    antecedentesPersonales: a?.antecedentesPersonales ?? "",
    antecedentesQuirurgicos: a?.antecedentesQuirurgicos ?? "",
    antecedentesFamiliares: a?.antecedentesFamiliares ?? "",
  };
}

export function AntecedentesFormulario({
  pacienteId,
  antecedentes,
}: AntecedentesFormularioProps) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();

  const form = useForm<HistoriaFormInput, unknown, HistoriaInput>({
    resolver: zodResolver(historiaSchema),
    defaultValues: valoresIniciales(antecedentes),
  });

  const { errors } = form.formState;

  function onSubmit(values: HistoriaInput) {
    startTransition(async () => {
      const r = await guardarHistoria(pacienteId, values);
      if (r.ok) {
        toast.success("Antecedentes guardados");
        router.refresh();
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="grupoSanguineo">Grupo sanguíneo</Label>
          <Input
            id="grupoSanguineo"
            placeholder="p. ej. O+"
            {...form.register("grupoSanguineo")}
            disabled={pendiente}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="menarquiaEdad">Edad de menarquia</Label>
          <Input
            id="menarquiaEdad"
            type="number"
            min={5}
            max={25}
            {...form.register("menarquiaEdad")}
            disabled={pendiente}
          />
          {errors.menarquiaEdad ? (
            <p className="text-sm text-destructive">{errors.menarquiaEdad.message}</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="fechaUltimaRegla">Fecha de última regla</Label>
          <Input
            id="fechaUltimaRegla"
            type="date"
            {...form.register("fechaUltimaRegla")}
            disabled={pendiente}
          />
          {errors.fechaUltimaRegla ? (
            <p className="text-sm text-destructive">
              {errors.fechaUltimaRegla.message}
            </p>
          ) : null}
        </div>
      </div>

      <fieldset className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <legend className="mb-2 text-sm font-medium">Fórmula obstétrica</legend>
        {(["gestas", "partos", "abortos", "cesareas"] as const).map((campo) => (
          <div key={campo} className="flex flex-col gap-2">
            <Label htmlFor={campo} className="capitalize">
              {campo}
            </Label>
            <Input
              id={campo}
              type="number"
              min={0}
              max={30}
              {...form.register(campo)}
              disabled={pendiente}
            />
            {errors[campo] ? (
              <p className="text-sm text-destructive">{errors[campo]?.message}</p>
            ) : null}
          </div>
        ))}
      </fieldset>

      <div className="flex flex-col gap-2 sm:max-w-md">
        <Label htmlFor="metodoAnticonceptivo">Método anticonceptivo</Label>
        <Input
          id="metodoAnticonceptivo"
          {...form.register("metodoAnticonceptivo")}
          disabled={pendiente}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="alergias">Alergias</Label>
        <Textarea id="alergias" rows={2} {...form.register("alergias")} disabled={pendiente} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="antecedentesPersonales">Antecedentes personales</Label>
        <Textarea
          id="antecedentesPersonales"
          rows={3}
          {...form.register("antecedentesPersonales")}
          disabled={pendiente}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="antecedentesQuirurgicos">Antecedentes quirúrgicos</Label>
        <Textarea
          id="antecedentesQuirurgicos"
          rows={3}
          {...form.register("antecedentesQuirurgicos")}
          disabled={pendiente}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="antecedentesFamiliares">Antecedentes familiares</Label>
        <Textarea
          id="antecedentesFamiliares"
          rows={3}
          {...form.register("antecedentesFamiliares")}
          disabled={pendiente}
        />
      </div>

      <div>
        <Button type="submit" disabled={pendiente}>
          {pendiente ? "Guardando…" : "Guardar antecedentes"}
        </Button>
      </div>
    </form>
  );
}
