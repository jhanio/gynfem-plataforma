export const RANGOS_PRESET = ["hoy", "7dias", "mes", "personalizado"] as const;
export type RangoPreset = (typeof RANGOS_PRESET)[number];

export interface RangoFechas {
  desde: string;
  hasta: string;
}

function sumarDiasISO(fechaISO: string, dias: number): string {
  const [anio, mes, dia] = fechaISO.split("-").map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia + dias)).toISOString().slice(0, 10);
}

function primerDiaDelMesISO(fechaISO: string): string {
  const [anio, mes] = fechaISO.split("-");
  return `${anio}-${mes}-01`;
}

/**
 * Calcula el rango de fechas (calendario, "AAAA-MM-DD") para kpi_resumen
 * según el preset elegido en /dashboard. "hoyISO" es la fecha actual en
 * Lima (obtenerFechaISOLima), para que el rango no dependa de la zona
 * horaria del servidor.
 */
export function calcularRangoFechas(
  preset: RangoPreset,
  hoyISO: string,
  personalizado?: { desde?: string; hasta?: string },
): RangoFechas {
  switch (preset) {
    case "hoy":
      return { desde: hoyISO, hasta: hoyISO };
    case "7dias":
      return { desde: sumarDiasISO(hoyISO, -6), hasta: hoyISO };
    case "mes":
      return { desde: primerDiaDelMesISO(hoyISO), hasta: hoyISO };
    case "personalizado": {
      const desde = personalizado?.desde ?? hoyISO;
      const hasta = personalizado?.hasta ?? hoyISO;
      return desde <= hasta ? { desde, hasta } : { desde: hasta, hasta: desde };
    }
  }
}

/** Porcentaje KPI-07: pacientes en grupos de posibles duplicados / activas totales. */
export function calcularPorcentajeDuplicados(totalDuplicados: number, totalActivas: number): number {
  if (totalActivas <= 0) return 0;
  return Math.round((totalDuplicados / totalActivas) * 1000) / 10;
}

export interface PuntoCitasPorDia {
  dia: string;
  total: number;
}

export interface PuntoAtencionesPorServicio {
  servicio: string;
  total: number;
}

export interface KpiResumen {
  citasTotal: number;
  citasAtendidas: number;
  citasNoAsistio: number;
  tasaInasistenciaPct: number | null;
  coberturaRecordatoriosPct: number | null;
  pacientesNuevos: number;
  atencionesFirmadas: number;
  seguimientosVencidos: number;
  citasPorDia: PuntoCitasPorDia[];
  atencionesPorServicio: PuntoAtencionesPorServicio[];
}

const KPI_VACIO: KpiResumen = {
  citasTotal: 0,
  citasAtendidas: 0,
  citasNoAsistio: 0,
  tasaInasistenciaPct: null,
  coberturaRecordatoriosPct: null,
  pacientesNuevos: 0,
  atencionesFirmadas: 0,
  seguimientosVencidos: 0,
  citasPorDia: [],
  atencionesPorServicio: [],
};

function comoNumero(valor: unknown): number {
  return typeof valor === "number" ? valor : 0;
}

function comoNumeroONull(valor: unknown): number | null {
  return typeof valor === "number" ? valor : null;
}

/** Convierte el jsonb devuelto por rpc('kpi_resumen', ...) a un objeto camelCase tipado. */
export function mapearKpiResumen(json: unknown): KpiResumen {
  if (!json || typeof json !== "object") return KPI_VACIO;
  const j = json as Record<string, unknown>;

  const citasPorDia = Array.isArray(j.citas_por_dia)
    ? j.citas_por_dia.map((p) => {
        const fila = p as Record<string, unknown>;
        return { dia: String(fila.dia ?? ""), total: comoNumero(fila.total) };
      })
    : [];

  const atencionesPorServicio = Array.isArray(j.atenciones_por_servicio)
    ? j.atenciones_por_servicio.map((p) => {
        const fila = p as Record<string, unknown>;
        return { servicio: String(fila.servicio ?? ""), total: comoNumero(fila.total) };
      })
    : [];

  return {
    citasTotal: comoNumero(j.citas_total),
    citasAtendidas: comoNumero(j.citas_atendidas),
    citasNoAsistio: comoNumero(j.citas_no_asistio),
    tasaInasistenciaPct: comoNumeroONull(j.tasa_inasistencia_pct),
    coberturaRecordatoriosPct: comoNumeroONull(j.cobertura_recordatorios_pct),
    pacientesNuevos: comoNumero(j.pacientes_nuevos),
    atencionesFirmadas: comoNumero(j.atenciones_firmadas),
    seguimientosVencidos: comoNumero(j.seguimientos_vencidos),
    citasPorDia,
    atencionesPorServicio,
  };
}

export interface GrupoDuplicado {
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  cantidad: number;
  pacienteIds: string[];
}

interface FilaPosibleDuplicado {
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  cantidad: number;
  paciente_ids: string[];
}

/** Convierte las filas de rpc('pacientes_posibles_duplicados') a camelCase (KPI-07). */
export function mapearGruposDuplicados(filas: readonly FilaPosibleDuplicado[]): GrupoDuplicado[] {
  return filas.map((f) => ({
    nombres: f.nombres,
    apellidos: f.apellidos,
    fechaNacimiento: f.fecha_nacimiento,
    cantidad: f.cantidad,
    pacienteIds: f.paciente_ids,
  }));
}
