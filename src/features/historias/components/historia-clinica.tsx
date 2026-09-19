import { Separator } from "@/components/ui/separator";
import { LineaTiempoAtenciones } from "@/features/atenciones/components/linea-tiempo-atenciones";
import type { CargaHistoria } from "@/features/historias/queries";
import { AntecedentesFormulario } from "./antecedentes-formulario";

interface HistoriaClinicaProps {
  pacienteId: string;
  carga: CargaHistoria;
}

export function HistoriaClinica({ pacienteId, carga }: HistoriaClinicaProps) {
  if (!carga.ok) {
    return (
      <p className="py-8 text-center text-destructive">
        No se pudo registrar el acceso a la historia clínica; por seguridad no se
        muestran los datos. Intenta nuevamente.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8 py-2">
      <section aria-labelledby="antecedentes-heading">
        <h2 id="antecedentes-heading" className="mb-4 text-lg font-semibold">
          Antecedentes gineco-obstétricos
        </h2>
        <AntecedentesFormulario
          pacienteId={pacienteId}
          antecedentes={carga.antecedentes}
        />
      </section>

      <Separator />

      <section aria-labelledby="atenciones-heading">
        <h2 id="atenciones-heading" className="mb-4 text-lg font-semibold">
          Línea de tiempo de atenciones
        </h2>
        <LineaTiempoAtenciones atenciones={carga.atenciones} />
      </section>
    </div>
  );
}
