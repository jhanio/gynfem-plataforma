import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { formatearFechaHora } from "@/lib/fechas";
import { ESTADO_ATENCION_LABELS, ESTADO_ATENCION_VARIANTE } from "../labels";
import type { AtencionResumen } from "../queries";

interface LineaTiempoAtencionesProps {
  atenciones: AtencionResumen[];
}

export function LineaTiempoAtenciones({ atenciones }: LineaTiempoAtencionesProps) {
  if (atenciones.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        Esta paciente no tiene atenciones registradas.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-3">
      {atenciones.map((atencion) => (
        <li key={atencion.id} className="rounded-md border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-medium tabular-nums">
                {formatearFechaHora(atencion.fecha)}
              </span>
              <Badge variant={ESTADO_ATENCION_VARIANTE[atencion.estado]}>
                {ESTADO_ATENCION_LABELS[atencion.estado]}
              </Badge>
            </div>
            <Link
              href={`/atenciones/${atencion.id}`}
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {atencion.estado === "borrador" ? "Continuar" : "Ver atención"}
            </Link>
          </div>

          <p className="mt-2 text-sm">
            <span className="text-muted-foreground">Motivo: </span>
            {atencion.motivoConsulta}
          </p>
          {atencion.diagnostico ? (
            <p className="text-sm">
              <span className="text-muted-foreground">Diagnóstico: </span>
              {atencion.diagnostico}
            </p>
          ) : null}
          {atencion.cie10.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              CIE-10: {atencion.cie10.join(", ")}
            </p>
          ) : null}
          {atencion.servicioNombre || atencion.profesionalNombre ? (
            <p className="text-xs text-muted-foreground">
              {[atencion.servicioNombre, atencion.profesionalNombre]
                .filter(Boolean)
                .join(" · ")}
            </p>
          ) : null}

          {atencion.adendas.length > 0 ? (
            <div className="mt-3 border-l-2 pl-3">
              <p className="text-xs font-medium text-muted-foreground">
                Adendas ({atencion.adendas.length})
              </p>
              <ul className="mt-1 flex flex-col gap-2">
                {atencion.adendas.map((adenda) => (
                  <li key={adenda.id} className="text-sm">
                    <p className="whitespace-pre-wrap">{adenda.contenido}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatearFechaHora(adenda.createdAt)}
                      {adenda.autor ? ` · ${adenda.autor}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
