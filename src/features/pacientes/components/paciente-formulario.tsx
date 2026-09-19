"use client";

import { useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { crearPaciente, editarPaciente } from "@/features/pacientes/actions";
import {
  CANALES_RECORDATORIO,
  pacienteSchema,
  TIPOS_DOCUMENTO,
  type PacienteFormInput,
  type PacienteInput,
} from "@/features/pacientes/schemas";
import { CANAL_LABELS, TIPO_DOCUMENTO_LABELS } from "@/features/pacientes/labels";
import type { PacienteDetalle } from "@/features/pacientes/queries";

interface PacienteFormularioProps {
  paciente?: PacienteDetalle;
}

function valoresIniciales(paciente?: PacienteDetalle): PacienteFormInput {
  return {
    tipoDocumento: paciente?.tipoDocumento ?? "DNI",
    numeroDocumento: paciente?.numeroDocumento ?? "",
    nombres: paciente?.nombres ?? "",
    apellidos: paciente?.apellidos ?? "",
    fechaNacimiento: paciente?.fechaNacimiento ?? "",
    telefono: paciente?.telefono ?? "",
    email: paciente?.email ?? "",
    direccion: paciente?.direccion ?? "",
    distrito: paciente?.distrito ?? "",
    canalPreferido: paciente?.canalPreferido ?? "whatsapp_manual",
    aceptaRecordatorios: paciente?.aceptaRecordatorios ?? false,
    consentimientoDatos: paciente?.consentimientoDatos ?? false,
  };
}

export function PacienteFormulario({ paciente }: PacienteFormularioProps) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const esEdicion = Boolean(paciente);

  const form = useForm<PacienteFormInput, unknown, PacienteInput>({
    resolver: zodResolver(pacienteSchema),
    defaultValues: valoresIniciales(paciente),
  });

  const tipoDocumento = useWatch({ control: form.control, name: "tipoDocumento" });
  const canalPreferido = useWatch({ control: form.control, name: "canalPreferido" });
  const aceptaRecordatorios = useWatch({
    control: form.control,
    name: "aceptaRecordatorios",
  });
  const consentimientoDatos = useWatch({
    control: form.control,
    name: "consentimientoDatos",
  });

  function onSubmit(values: PacienteInput) {
    startTransition(async () => {
      const r = esEdicion
        ? await editarPaciente({ ...values, id: paciente!.id })
        : await crearPaciente(values);

      if (r.ok) {
        toast.success(esEdicion ? "Datos actualizados" : "Paciente registrada");
        router.push(`/pacientes/${r.data.id}`);
        router.refresh();
        return;
      }

      if (r.idExistente) {
        toast.error(r.error, {
          action: {
            label: "Ver ficha",
            onClick: () => router.push(`/pacientes/${r.idExistente}`),
          },
        });
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-6"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="tipoDocumento">Tipo de documento</Label>
          <Select
            value={tipoDocumento}
            onValueChange={(v) =>
              form.setValue("tipoDocumento", v as PacienteInput["tipoDocumento"])
            }
            disabled={pendiente}
          >
            <SelectTrigger id="tipoDocumento" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_DOCUMENTO.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>
                  {TIPO_DOCUMENTO_LABELS[tipo]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="numeroDocumento">Número de documento</Label>
          <Input
            id="numeroDocumento"
            {...form.register("numeroDocumento")}
            disabled={pendiente}
          />
          {form.formState.errors.numeroDocumento ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.numeroDocumento.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="nombres">Nombres</Label>
          <Input id="nombres" {...form.register("nombres")} disabled={pendiente} />
          {form.formState.errors.nombres ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.nombres.message}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="apellidos">Apellidos</Label>
          <Input
            id="apellidos"
            {...form.register("apellidos")}
            disabled={pendiente}
          />
          {form.formState.errors.apellidos ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.apellidos.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="fechaNacimiento">Fecha de nacimiento</Label>
          <Input
            id="fechaNacimiento"
            type="date"
            {...form.register("fechaNacimiento")}
            disabled={pendiente}
          />
          {form.formState.errors.fechaNacimiento ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.fechaNacimiento.message}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="telefono">Teléfono</Label>
          <Input
            id="telefono"
            placeholder="9XXXXXXXX"
            {...form.register("telefono")}
            disabled={pendiente}
          />
          {form.formState.errors.telefono ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.telefono.message}
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
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="direccion">Dirección</Label>
          <Input
            id="direccion"
            {...form.register("direccion")}
            disabled={pendiente}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="distrito">Distrito</Label>
          <Input
            id="distrito"
            {...form.register("distrito")}
            disabled={pendiente}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:max-w-xs">
        <Label htmlFor="canalPreferido">Canal preferido de contacto</Label>
        <Select
          value={canalPreferido}
          onValueChange={(v) =>
            form.setValue("canalPreferido", v as PacienteInput["canalPreferido"])
          }
          disabled={pendiente}
        >
          <SelectTrigger id="canalPreferido" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CANALES_RECORDATORIO.map((canal) => (
              <SelectItem key={canal} value={canal}>
                {CANAL_LABELS[canal]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="aceptaRecordatorios"
          checked={aceptaRecordatorios}
          onCheckedChange={(v) =>
            form.setValue("aceptaRecordatorios", v === true)
          }
          disabled={pendiente}
        />
        <Label htmlFor="aceptaRecordatorios">
          Acepta recibir recordatorios de citas
        </Label>
      </div>

      <div className="flex flex-col gap-2 rounded-md border p-4">
        <div className="flex items-start gap-2">
          <Checkbox
            id="consentimientoDatos"
            checked={consentimientoDatos}
            onCheckedChange={(v) =>
              form.setValue("consentimientoDatos", v === true)
            }
            disabled={pendiente}
          />
          <Label htmlFor="consentimientoDatos" className="font-normal">
            La paciente consiente el tratamiento de sus datos personales de
            salud conforme a la Ley N.º 29733 y su reglamento.
          </Label>
        </div>
        <p className="text-xs text-muted-foreground">
          [VALIDAR CON ASESORÍA LEGAL] Texto de aviso de privacidad pendiente
          de revisión legal antes de operar con datos reales.
        </p>
        {form.formState.errors.consentimientoDatos ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.consentimientoDatos.message}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pendiente}>
          {pendiente ? "Guardando…" : "Guardar"}
        </Button>
        <Button asChild variant="outline" disabled={pendiente}>
          <Link href={esEdicion ? `/pacientes/${paciente!.id}` : "/pacientes"}>
            Cancelar
          </Link>
        </Button>
      </div>
    </form>
  );
}
