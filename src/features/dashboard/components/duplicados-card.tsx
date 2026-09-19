import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatearFechaISO } from "@/lib/fechas";
import type { GrupoDuplicado } from "../dominio";

interface DuplicadosCardProps {
  grupos: GrupoDuplicado[];
  totalDuplicados: number;
  totalActivas: number;
  porcentaje: number;
}

/** KPI-07, solo admin: nombres administrativos (no clínicos) que admin ya puede ver en /pacientes. */
export function DuplicadosCard({ grupos, totalDuplicados, totalActivas, porcentaje }: DuplicadosCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Posibles duplicados
          <Badge variant="secondary">KPI-07</Badge>
        </CardTitle>
        <CardDescription>
          {totalDuplicados} de {totalActivas} pacientes activas ({porcentaje}%) comparten
          nombres, apellidos y fecha de nacimiento con otra ficha.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {grupos.length === 0 ? (
          <p className="text-sm text-muted-foreground">No se detectaron posibles duplicados.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {grupos.map((g) => (
              <li
                key={`${g.nombres}-${g.apellidos}-${g.fechaNacimiento}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"
              >
                <div>
                  <p className="font-medium">
                    {g.apellidos}, {g.nombres}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Nacimiento: {formatearFechaISO(g.fechaNacimiento)} · {g.cantidad} fichas
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {g.pacienteIds.map((id, i) => (
                    <Link
                      key={id}
                      href={`/pacientes/${id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Ficha {i + 1}
                    </Link>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
