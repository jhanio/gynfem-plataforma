import { requireRol } from "@/lib/auth/guards";
import { obtenerFechaISOLima } from "@/lib/fechas";
import { calcularRangoFechas } from "@/features/dashboard/dominio";
import { rangoDashboardSchema } from "@/features/dashboard/schemas";
import { obtenerKpiResumen, obtenerResumenDuplicados } from "@/features/dashboard/queries";
import { SelectorRango } from "@/features/dashboard/components/selector-rango";
import { KpiTarjetas } from "@/features/dashboard/components/kpi-tarjetas";
import { GraficoCitasDia } from "@/features/dashboard/components/grafico-citas-dia";
import { GraficoAtencionesServicio } from "@/features/dashboard/components/grafico-atenciones-servicio";
import { DuplicadosCard } from "@/features/dashboard/components/duplicados-card";

interface DashboardPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

// Los KPI deben reflejar la actividad reciente: sin cache estática.
export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const actor = await requireRol("admin", "medico", "obstetra");

  const params = await searchParams;
  const rango = rangoDashboardSchema.parse(params);
  const hoyISO = obtenerFechaISOLima(new Date());
  const { desde, hasta } = calcularRangoFechas(rango.preset, hoyISO, rango);

  const esAdmin = actor.rol === "admin";
  const [kpi, duplicados] = await Promise.all([
    obtenerKpiResumen(desde, hasta),
    esAdmin ? obtenerResumenDuplicados() : null,
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Indicadores agregados del {formatearRangoTitulo(desde, hasta)}. Ningún dato identifica
          pacientes.
        </p>
      </div>

      <SelectorRango preset={rango.preset} desde={rango.desde} hasta={rango.hasta} />
      <KpiTarjetas kpi={kpi} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GraficoCitasDia datos={kpi.citasPorDia} />
        <GraficoAtencionesServicio datos={kpi.atencionesPorServicio} />
      </div>

      {duplicados ? (
        <DuplicadosCard
          grupos={duplicados.grupos}
          totalDuplicados={duplicados.totalDuplicados}
          totalActivas={duplicados.totalActivas}
          porcentaje={duplicados.porcentaje}
        />
      ) : null}
    </div>
  );
}

function formatearRangoTitulo(desde: string, hasta: string): string {
  return desde === hasta ? desde : `${desde} al ${hasta}`;
}
