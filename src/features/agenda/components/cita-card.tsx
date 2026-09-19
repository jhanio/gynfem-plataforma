"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreVertical } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatearHora, obtenerFechaISOLima } from "@/lib/fechas";
import { confirmarCita } from "@/features/agenda/actions";
import { puedeAplicarAccion } from "@/features/agenda/dominio";
import { ESTADO_CITA_LABELS, ESTADO_CITA_VARIANTE } from "@/features/agenda/labels";
import type { CitaAgenda } from "@/features/agenda/queries";
import { CancelarCitaDialog } from "./cancelar-cita-dialog";
import { NoAsistioDialog } from "./no-asistio-dialog";
import { ReprogramarCitaDialog } from "./reprogramar-cita-dialog";

interface CitaCardProps {
  cita: CitaAgenda;
  mostrarProfesional?: boolean;
}

type DialogoAbierto = "cancelar" | "no_asistio" | "reprogramar" | null;

export function CitaCard({ cita, mostrarProfesional = false }: CitaCardProps) {
  const router = useRouter();
  const [dialogo, setDialogo] = useState<DialogoAbierto>(null);
  const [pendiente, startTransition] = useTransition();

  function onConfirmar() {
    startTransition(async () => {
      const r = await confirmarCita({ id: cita.id });
      if (r.ok) {
        toast.success("Cita confirmada");
        router.refresh();
      } else {
        toast.error(r.error);
      }
    });
  }

  const puedeConfirmar = puedeAplicarAccion(cita.estado, "confirmar");
  const puedeCancelar = puedeAplicarAccion(cita.estado, "cancelar");
  const puedeReprogramar = puedeAplicarAccion(cita.estado, "reprogramar");
  const puedeMarcarNoAsistio = puedeAplicarAccion(cita.estado, "no_asistio");
  const hayAcciones = puedeConfirmar || puedeCancelar || puedeReprogramar || puedeMarcarNoAsistio;

  return (
    <li className="flex items-start justify-between gap-3 rounded-md border p-3">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="font-medium tabular-nums">
            {formatearHora(cita.inicio)}–{formatearHora(cita.fin)}
          </span>
          <Badge variant={ESTADO_CITA_VARIANTE[cita.estado]}>
            {ESTADO_CITA_LABELS[cita.estado]}
          </Badge>
        </div>
        <p className="text-sm">
          {cita.paciente.apellidos}, {cita.paciente.nombres}
        </p>
        <p className="text-sm text-muted-foreground">
          {cita.servicio.nombre}
          {mostrarProfesional ? ` · ${cita.profesional.nombreCompleto}` : ""}
        </p>
        {cita.motivoCambio ? (
          <p className="text-xs text-muted-foreground">Motivo: {cita.motivoCambio}</p>
        ) : null}
      </div>

      {hayAcciones ? (
        <div className="flex items-center gap-1">
          {puedeConfirmar ? (
            <Button size="sm" variant="secondary" onClick={onConfirmar} disabled={pendiente}>
              Confirmar
            </Button>
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" aria-label="Más acciones" disabled={pendiente}>
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {puedeReprogramar ? (
                <DropdownMenuItem onSelect={() => setDialogo("reprogramar")}>
                  Reprogramar
                </DropdownMenuItem>
              ) : null}
              {puedeMarcarNoAsistio ? (
                <DropdownMenuItem onSelect={() => setDialogo("no_asistio")}>
                  Marcar inasistencia
                </DropdownMenuItem>
              ) : null}
              {puedeCancelar ? (
                <DropdownMenuItem variant="destructive" onSelect={() => setDialogo("cancelar")}>
                  Cancelar
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : null}

      <CancelarCitaDialog
        citaId={cita.id}
        abierto={dialogo === "cancelar"}
        onOpenChange={(v) => setDialogo(v ? "cancelar" : null)}
      />
      <NoAsistioDialog
        citaId={cita.id}
        abierto={dialogo === "no_asistio"}
        onOpenChange={(v) => setDialogo(v ? "no_asistio" : null)}
      />
      <ReprogramarCitaDialog
        citaId={cita.id}
        fechaActual={obtenerFechaISOLima(cita.inicio)}
        horaActual={formatearHora(cita.inicio)}
        abierto={dialogo === "reprogramar"}
        onOpenChange={(v) => setDialogo(v ? "reprogramar" : null)}
      />
    </li>
  );
}
