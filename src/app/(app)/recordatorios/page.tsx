import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRol } from "@/lib/auth/guards";
import { obtenerRecordatoriosHoy } from "@/features/recordatorios/queries";
import { RecordatoriosHoy } from "@/features/recordatorios/components/recordatorios-hoy";

// Cola operativa: siempre dinámica para reflejar envíos recientes.
export const dynamic = "force-dynamic";

export default async function RecordatoriosPage() {
  await requireRol("admin", "asistente");

  const recordatorios = await obtenerRecordatoriosHoy();

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1 className="text-xl font-semibold">Recordatorios de hoy</h1>
        </CardTitle>
        <CardDescription>
          Abre WhatsApp con el mensaje prellenado y marca cada envío como
          enviado o fallido. El mensaje nunca incluye datos clínicos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RecordatoriosHoy recordatorios={recordatorios} />
      </CardContent>
    </Card>
  );
}
