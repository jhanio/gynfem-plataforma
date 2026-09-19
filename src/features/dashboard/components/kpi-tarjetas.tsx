import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import type { KpiResumen } from "../dominio";

interface KpiTarjetasProps {
  kpi: KpiResumen;
}

function formatearPorcentaje(valor: number | null): string {
  return valor === null ? "—" : `${valor}%`;
}

export function KpiTarjetas({ kpi }: KpiTarjetasProps) {
  const tarjetas = [
    { titulo: "Citas en el rango", valor: kpi.citasTotal },
    { titulo: "Citas atendidas", valor: kpi.citasAtendidas },
    { titulo: "Tasa de inasistencia", valor: formatearPorcentaje(kpi.tasaInasistenciaPct) },
    { titulo: "Cobertura de recordatorios", valor: formatearPorcentaje(kpi.coberturaRecordatoriosPct) },
    { titulo: "Pacientes nuevas", valor: kpi.pacientesNuevos },
    { titulo: "Atenciones firmadas", valor: kpi.atencionesFirmadas },
    { titulo: "Seguimientos vencidos", valor: kpi.seguimientosVencidos },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {tarjetas.map((t) => (
        <Card key={t.titulo}>
          <CardContent className="flex flex-col gap-1 pt-4">
            <CardDescription>{t.titulo}</CardDescription>
            <CardTitle className="text-2xl">{t.valor}</CardTitle>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
