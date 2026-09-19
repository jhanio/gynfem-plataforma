"use client";

import { Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { formatearFechaHora } from "@/lib/fechas";
import { ACCION_LABELS } from "../labels";
import type { AuditoriaFila } from "../queries";

interface AuditoriaDetalleSheetProps {
  fila: AuditoriaFila;
  tablaLabel: string;
}

export function AuditoriaDetalleSheet({ fila, tablaLabel }: AuditoriaDetalleSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye />
          Ver detalle
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Detalle de auditoría</SheetTitle>
          <SheetDescription>
            {tablaLabel} · {ACCION_LABELS[fila.accion as keyof typeof ACCION_LABELS] ?? fila.accion}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 pb-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="Fecha" valor={formatearFechaHora(fila.createdAt)} />
            <Campo etiqueta="Usuario" valor={fila.usuarioNombre ?? "Sistema"} />
            <Campo etiqueta="Tabla" valor={tablaLabel} />
            <Campo etiqueta="Id del registro" valor={fila.registroId ?? "—"} />
          </div>

          {fila.esClinica ? (
            <div className="flex flex-col gap-2 rounded-md border border-dashed p-3 text-muted-foreground">
              <Badge variant="secondary" className="w-fit">
                Contenido clínico
              </Badge>
              <p>
                Esta tabla contiene datos clínicos. Por diseño, la auditoría no
                muestra qué campos cambiaron ni sus valores.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <BloqueJson titulo="Datos anteriores" valor={fila.datosAntes} />
              <BloqueJson titulo="Datos nuevos" valor={fila.datosDespues} />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Campo({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs font-medium text-muted-foreground">{etiqueta}</p>
      <p className="break-words">{valor}</p>
    </div>
  );
}

function BloqueJson({ titulo, valor }: { titulo: string; valor: unknown }) {
  if (valor === null || valor === undefined) {
    return (
      <div>
        <p className="text-xs font-medium text-muted-foreground">{titulo}</p>
        <p className="text-muted-foreground">—</p>
      </div>
    );
  }
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{titulo}</p>
      <pre className="mt-1 max-h-64 overflow-auto rounded-md bg-muted p-2 text-xs">
        {JSON.stringify(valor, null, 2)}
      </pre>
    </div>
  );
}
