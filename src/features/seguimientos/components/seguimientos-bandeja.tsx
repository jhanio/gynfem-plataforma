"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatearFechaISO } from "@/lib/fechas";
import { clasificarSeguimiento, type CategoriaBandeja } from "@/features/seguimientos/dominio";
import {
  CATEGORIA_BANDEJA_LABELS,
  ESTADO_SEGUIMIENTO_LABELS,
  ESTADO_SEGUIMIENTO_VARIANTE,
  TIPO_SEGUIMIENTO_LABELS,
} from "@/features/seguimientos/labels";
import type { SeguimientoLista } from "@/features/seguimientos/queries";
import { CambiarEstadoSeguimientoDialog } from "./cambiar-estado-seguimiento-dialog";

const CATEGORIAS_BANDEJA: readonly CategoriaBandeja[] = ["vencido", "hoy", "proximo"];

interface SeguimientosBandejaProps {
  seguimientos: SeguimientoLista[];
  hoyISO: string;
}

export function SeguimientosBandeja({ seguimientos, hoyISO }: SeguimientosBandejaProps) {
  const grupos: Record<CategoriaBandeja, SeguimientoLista[]> = {
    vencido: [],
    hoy: [],
    proximo: [],
    mas_adelante: [],
  };
  for (const s of seguimientos) {
    grupos[clasificarSeguimiento(s.fechaObjetivo, hoyISO)].push(s);
  }

  return (
    <Tabs defaultValue="vencido">
      <TabsList>
        {CATEGORIAS_BANDEJA.map((categoria) => (
          <TabsTrigger key={categoria} value={categoria}>
            <span className={categoria === "vencido" && grupos[categoria].length > 0 ? "text-destructive font-semibold" : undefined}>
              {CATEGORIA_BANDEJA_LABELS[categoria]} ({grupos[categoria].length})
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
      {CATEGORIAS_BANDEJA.map((categoria) => (
        <TabsContent key={categoria} value={categoria}>
          <ListaSeguimientos seguimientos={grupos[categoria]} destacarVencido={categoria === "vencido"} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function ListaSeguimientos({
  seguimientos,
  destacarVencido = false,
}: {
  seguimientos: SeguimientoLista[];
  destacarVencido?: boolean;
}) {
  if (seguimientos.length === 0) {
    return <p className="py-8 text-center text-muted-foreground">No hay seguimientos en este grupo.</p>;
  }

  return (
    <ul className="flex flex-col gap-2 py-2">
      {seguimientos.map((s) => (
        <li
          key={s.id}
          className={`flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between ${
            destacarVencido ? "border-destructive/50 bg-destructive/5" : ""
          }`}
        >
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/pacientes/${s.paciente.id}`}
                className="font-medium underline-offset-4 hover:underline"
              >
                {s.paciente.apellidos}, {s.paciente.nombres}
              </Link>
              {destacarVencido ? <Badge variant="destructive">Vencido</Badge> : null}
              <Badge variant="outline">{TIPO_SEGUIMIENTO_LABELS[s.tipo]}</Badge>
              <Badge variant={ESTADO_SEGUIMIENTO_VARIANTE[s.estado]}>
                {ESTADO_SEGUIMIENTO_LABELS[s.estado]}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{s.descripcion}</p>
            <p className="text-xs text-muted-foreground">
              Fecha objetivo: {formatearFechaISO(s.fechaObjetivo)}
              {s.responsable ? ` · Responsable: ${s.responsable.nombreCompleto}` : ""}
            </p>
          </div>
          <CambiarEstadoSeguimientoDialog seguimientoId={s.id} estadoActual={s.estado} />
        </li>
      ))}
    </ul>
  );
}
