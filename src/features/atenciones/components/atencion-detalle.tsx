import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatearFechaHora } from "@/lib/fechas";
import { ESTADO_ATENCION_LABELS, ESTADO_ATENCION_VARIANTE } from "../labels";
import type { AtencionDetalle as Atencion } from "../queries";
import { AgregarAdendaDialog } from "./agregar-adenda-dialog";

interface AtencionDetalleProps {
  atencion: Atencion;
}

function Campo({ etiqueta, valor }: { etiqueta: string; valor: string | null }) {
  if (!valor) return null;
  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm font-medium text-muted-foreground">{etiqueta}</p>
      <p className="whitespace-pre-wrap text-sm">{valor}</p>
    </div>
  );
}

export function AtencionDetalle({ atencion }: AtencionDetalleProps) {
  const esFirmada = atencion.estado === "firmada";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={ESTADO_ATENCION_VARIANTE[atencion.estado]}>
          {ESTADO_ATENCION_LABELS[atencion.estado]}
        </Badge>
        {esFirmada && atencion.firmadaAt ? (
          <span className="text-sm text-muted-foreground">
            Firmada el {formatearFechaHora(atencion.firmadaAt)}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">
            Borrador de otro profesional (solo lectura)
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <Campo etiqueta="Motivo de consulta" valor={atencion.motivoConsulta} />
        <Campo etiqueta="Anamnesis" valor={atencion.anamnesis} />
        <Campo etiqueta="Examen físico" valor={atencion.examenFisico} />
        <Campo etiqueta="Diagnóstico" valor={atencion.diagnostico} />
        <Campo
          etiqueta="Códigos CIE-10"
          valor={atencion.cie10.length > 0 ? atencion.cie10.join(", ") : null}
        />
        <Campo etiqueta="Plan de tratamiento" valor={atencion.planTratamiento} />
        <Campo etiqueta="Indicaciones" valor={atencion.indicaciones} />
      </div>

      <Separator />

      <section aria-labelledby="adendas-heading">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="adendas-heading" className="text-lg font-semibold">
            Adendas
          </h2>
          {esFirmada ? <AgregarAdendaDialog atencionId={atencion.id} /> : null}
        </div>

        {atencion.adendas.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            No hay adendas registradas.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {atencion.adendas.map((adenda) => (
              <li key={adenda.id} className="rounded-md border p-3">
                <p className="whitespace-pre-wrap text-sm">{adenda.contenido}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatearFechaHora(adenda.createdAt)}
                  {adenda.autor ? ` · ${adenda.autor}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
