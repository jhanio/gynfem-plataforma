import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatearFechaHora } from "@/lib/fechas";
import { ACCION_LABELS, TABLA_LABELS } from "../labels";
import type { FiltrosAuditoria } from "../schemas";
import type { ListarAuditoriaResultado } from "../queries";
import { AuditoriaDetalleSheet } from "./auditoria-detalle-sheet";

interface AuditoriaTablaProps {
  resultado: ListarAuditoriaResultado;
  filtros: FiltrosAuditoria;
}

function urlPagina(filtros: FiltrosAuditoria, pagina: number): string {
  const params = new URLSearchParams();
  if (filtros.usuarioId) params.set("usuarioId", filtros.usuarioId);
  if (filtros.tabla) params.set("tabla", filtros.tabla);
  if (filtros.accion) params.set("accion", filtros.accion);
  if (filtros.desde) params.set("desde", filtros.desde);
  if (filtros.hasta) params.set("hasta", filtros.hasta);
  params.set("page", String(pagina));
  return `/admin/auditoria?${params.toString()}`;
}

export function AuditoriaTabla({ resultado, filtros }: AuditoriaTablaProps) {
  const { filas, total, pagina, totalPaginas } = resultado;

  if (filas.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1 py-12 text-center text-muted-foreground">
        <p className="font-medium">No hay registros de auditoría</p>
        <p className="text-sm">Ajusta los filtros para ampliar la búsqueda.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Usuario</TableHead>
            <TableHead>Tabla</TableHead>
            <TableHead>Acción</TableHead>
            <TableHead>Id del registro</TableHead>
            <TableHead className="text-right">Detalle</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filas.map((fila) => (
            <TableRow key={fila.id}>
              <TableCell className="text-muted-foreground">
                {formatearFechaHora(fila.createdAt)}
              </TableCell>
              <TableCell>{fila.usuarioNombre ?? "Sistema"}</TableCell>
              <TableCell>
                {TABLA_LABELS[fila.tabla as keyof typeof TABLA_LABELS] ?? fila.tabla}
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {ACCION_LABELS[fila.accion as keyof typeof ACCION_LABELS] ?? fila.accion}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{fila.registroId ?? "—"}</TableCell>
              <TableCell className="text-right">
                <AuditoriaDetalleSheet
                  fila={fila}
                  tablaLabel={TABLA_LABELS[fila.tabla as keyof typeof TABLA_LABELS] ?? fila.tabla}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total} registro{total === 1 ? "" : "s"} · página {pagina} de {totalPaginas}
        </p>
        <div className="flex gap-2">
          {pagina <= 1 ? (
            <Button variant="outline" size="sm" disabled>
              Anterior
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link href={urlPagina(filtros, pagina - 1)}>Anterior</Link>
            </Button>
          )}
          {pagina >= totalPaginas ? (
            <Button variant="outline" size="sm" disabled>
              Siguiente
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link href={urlPagina(filtros, pagina + 1)}>Siguiente</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
