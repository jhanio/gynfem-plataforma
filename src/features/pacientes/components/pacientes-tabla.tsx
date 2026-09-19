import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { TIPO_DOCUMENTO_LABELS } from "@/features/pacientes/labels";
import type { ListarPacientesResultado } from "@/features/pacientes/queries";

interface PacientesTablaProps {
  resultado: ListarPacientesResultado;
  q: string;
}

function urlPagina(q: string, pagina: number): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  params.set("page", String(pagina));
  return `/pacientes?${params.toString()}`;
}

export function PacientesTabla({ resultado, q }: PacientesTablaProps) {
  const { pacientes, total, pagina, totalPaginas } = resultado;

  if (pacientes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1 py-12 text-center text-muted-foreground">
        <p className="font-medium">No se encontraron pacientes</p>
        <p className="text-sm">
          {q
            ? "Ajusta el término de búsqueda o registra una nueva paciente."
            : "Aún no hay pacientes registradas."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Documento</TableHead>
            <TableHead>Nombres y apellidos</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Distrito</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pacientes.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                <Link
                  href={`/pacientes/${p.id}`}
                  className="font-medium hover:underline"
                >
                  {TIPO_DOCUMENTO_LABELS[p.tipoDocumento]} {p.numeroDocumento}
                </Link>
              </TableCell>
              <TableCell>
                {p.apellidos}, {p.nombres}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {p.telefono ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {p.distrito ?? "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total} paciente{total === 1 ? "" : "s"} · página {pagina} de{" "}
          {totalPaginas}
        </p>
        <div className="flex gap-2">
          {pagina <= 1 ? (
            <Button variant="outline" size="sm" disabled>
              Anterior
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link href={urlPagina(q, pagina - 1)}>Anterior</Link>
            </Button>
          )}
          {pagina >= totalPaginas ? (
            <Button variant="outline" size="sm" disabled>
              Siguiente
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link href={urlPagina(q, pagina + 1)}>Siguiente</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
