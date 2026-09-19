import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRol } from "@/lib/auth/guards";
import { obtenerFechaISOLima } from "@/lib/fechas";
import { obtenerBandejaSeguimientos } from "@/features/seguimientos/queries";
import { SeguimientosBandeja } from "@/features/seguimientos/components/seguimientos-bandeja";

// Bandeja operativa: siempre dinámica para reflejar cambios de estado recientes.
export const dynamic = "force-dynamic";

export default async function SeguimientosPage() {
  await requireRol("admin", "medico", "obstetra", "asistente");

  const seguimientos = await obtenerBandejaSeguimientos();
  const hoyISO = obtenerFechaISOLima(new Date());

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1 className="text-xl font-semibold">Seguimientos</h1>
        </CardTitle>
        <CardDescription>
          Seguimientos pendientes y contactados, agrupados por vencidos, de
          hoy y de los próximos 7 días.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SeguimientosBandeja seguimientos={seguimientos} hoyISO={hoyISO} />
      </CardContent>
    </Card>
  );
}
