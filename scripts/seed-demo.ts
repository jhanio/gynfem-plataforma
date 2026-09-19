/**
 * Genera datos de demostración FICTICIOS en gynfem-dev: usuarios base,
 * servicios base, 30 pacientes, ~2 semanas de citas (pasadas y futuras),
 * atenciones firmadas y seguimientos.
 *
 * - Solo corre contra el proyecto gynfem-dev (se niega con cualquier otra
 *   URL): usa la clave secreta y no debe tocar nunca un proyecto real.
 * - Idempotente: los pacientes de demo tienen DNI determinístico
 *   (90000001..90000030); si ya existen, no se recrean ni se duplican sus
 *   citas/atenciones/seguimientos.
 * - Todas las pacientes quedan con acepta_recordatorios = false: sus
 *   teléfonos ficticios podrían coincidir con números de personas reales,
 *   y no queremos que el botón "Generar ahora" les prepare mensajes.
 *
 * Ejecutar:  npx tsx scripts/seed-demo.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const PROYECTO_DEV_REF = "unlzfefbsltkkndfkeja";

/** Carga variables de .env.local sin dependencias externas. */
function cargarEnvLocal(): void {
  try {
    const contenido = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const linea of contenido.split("\n")) {
      const limpia = linea.trim();
      if (!limpia || limpia.startsWith("#")) continue;
      const idx = limpia.indexOf("=");
      if (idx === -1) continue;
      const clave = limpia.slice(0, idx).trim();
      let valor = limpia.slice(idx + 1).trim();
      if (
        (valor.startsWith('"') && valor.endsWith('"')) ||
        (valor.startsWith("'") && valor.endsWith("'"))
      ) {
        valor = valor.slice(1, -1);
      }
      if (!(clave in process.env)) process.env[clave] = valor;
    }
  } catch {
    // Si no existe .env.local, se usará el entorno del proceso.
  }
}

function passwordTemporal(): string {
  return `Gy${Buffer.from(String(Math.random())).toString("base64url")}!9`;
}

const USUARIOS_DEMO = [
  { nombre: "Admin Ficticia", email: "admin@gynfem.test", rol: "admin" },
  { nombre: "Dra. Médica Ficticia", email: "medico@gynfem.test", rol: "medico" },
  { nombre: "Obstetra Ficticia", email: "obstetra@gynfem.test", rol: "obstetra" },
  { nombre: "Asistente Ficticia", email: "asistente@gynfem.test", rol: "asistente" },
  { nombre: "Soporte Ficticio", email: "soporte@gynfem.test", rol: "soporte" },
] as const;

interface ServicioDemo {
  nombre: string;
  categoria: string;
  duracion_min: number;
}

const SERVICIOS_DEMO: ServicioDemo[] = [
  { nombre: "Consulta ginecológica", categoria: "Consulta", duracion_min: 30 },
  { nombre: "Control prenatal", categoria: "Control", duracion_min: 30 },
  { nombre: "Ecografía ginecológica", categoria: "Procedimiento", duracion_min: 45 },
];

const NOMBRES_FICTICIOS = [
  "María", "Rosa", "Carmen", "Luz", "Ana", "Flor", "Julia", "Elena", "Teresa", "Silvia",
  "Patricia", "Gladys", "Yolanda", "Norma", "Cecilia", "Doris", "Marisol", "Katia", "Vilma", "Rocío",
  "Milagros", "Fiorella", "Karina", "Diana", "Beatriz", "Consuelo", "Nancy", "Sonia", "Verónica", "Ximena",
];
const APELLIDOS_FICTICIOS = [
  "Quispe", "Mamani", "Flores", "Huamán", "Rojas", "Vargas", "Torres", "Chávez", "Ramos", "Ruiz",
  "Cruz", "Reyes", "Salazar", "Medina", "Castillo", "Aguilar", "Vega", "Paredes", "Cárdenas", "Ochoa",
  "Núñez", "Fernández", "Guerra", "Palomino", "Cusi", "Yupanqui", "Sánchez", "Loayza", "Villanueva", "Espinoza",
];

interface PacienteDemo {
  numero_documento: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  consentimiento_datos: true;
  consentimiento_fecha: string;
  acepta_recordatorios: false;
}

function generarPacientes(): PacienteDemo[] {
  const ahoraIso = new Date().toISOString();
  return NOMBRES_FICTICIOS.map((nombre, i) => ({
    numero_documento: String(90000001 + i),
    nombres: nombre,
    apellidos: APELLIDOS_FICTICIOS[i],
    telefono: `9${String(10000000 + i).padStart(8, "0")}`,
    consentimiento_datos: true as const,
    consentimiento_fecha: ahoraIso,
    acepta_recordatorios: false as const,
  }));
}

/** Fecha/hora en zona America/Lima (UTC-5 fijo, sin horario de verano). */
function fechaLima(diasDesdeHoy: number, hora: string): string {
  const hoy = new Date();
  const base = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()));
  base.setUTCDate(base.getUTCDate() + diasDesdeHoy);
  const yyyy = base.getUTCFullYear();
  const mm = String(base.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(base.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hora}:00-05:00`;
}

async function asegurarUsuarios(admin: SupabaseClient): Promise<Record<string, string>> {
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const porEmail = new Map((data?.users ?? []).map((u) => [u.email, u.id]));
  const ids: Record<string, string> = {};

  for (const u of USUARIOS_DEMO) {
    const existente = porEmail.get(u.email);
    if (existente) {
      ids[u.rol] = existente;
      continue;
    }

    const { data: creado, error } = await admin.auth.admin.createUser({
      email: u.email,
      password: passwordTemporal(),
      email_confirm: true,
      user_metadata: { nombre_completo: u.nombre },
      app_metadata: { rol: u.rol },
    });

    if (error || !creado.user) {
      throw new Error(`No se pudo crear el usuario demo ${u.email}: ${error?.message}`);
    }

    await admin.from("profiles").update({ rol: u.rol, activo: true }).eq("id", creado.user.id);
    ids[u.rol] = creado.user.id;
  }

  return ids;
}

async function asegurarServicios(admin: SupabaseClient): Promise<Record<string, string>> {
  const ids: Record<string, string> = {};

  for (const s of SERVICIOS_DEMO) {
    const { data: existente } = await admin
      .from("servicios")
      .select("id")
      .eq("nombre", s.nombre)
      .maybeSingle();

    if (existente) {
      ids[s.nombre] = existente.id;
      continue;
    }

    const { data: creado, error } = await admin
      .from("servicios")
      .insert(s)
      .select("id")
      .single();

    if (error || !creado) {
      throw new Error(`No se pudo crear el servicio demo ${s.nombre}: ${error?.message}`);
    }
    ids[s.nombre] = creado.id;
  }

  return ids;
}

async function main() {
  cargarEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en .env.local");
    process.exit(1);
  }

  if (!url.includes(PROYECTO_DEV_REF)) {
    console.error(
      `Este script solo puede ejecutarse contra gynfem-dev (proyecto ${PROYECTO_DEV_REF}).\n` +
        `URL configurada: ${url}\n` +
        `Si esto es intencional, verifica que sea el proyecto correcto antes de continuar.`,
    );
    process.exit(1);
  }

  const admin = createClient(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("Verificando usuarios de demo…");
  const usuarioIdPorRol = await asegurarUsuarios(admin);

  console.log("Verificando servicios de demo…");
  const servicioIdPorNombre = await asegurarServicios(admin);
  const servicioConsultaId = servicioIdPorNombre["Consulta ginecológica"];

  console.log("Verificando pacientes de demo…");
  const pacientes = generarPacientes();
  const pacienteIds: string[] = [];
  let pacientesCreados = 0;

  for (const p of pacientes) {
    const { data: existente } = await admin
      .from("pacientes")
      .select("id")
      .eq("numero_documento", p.numero_documento)
      .is("deleted_at", null)
      .maybeSingle();

    if (existente) {
      pacienteIds.push(existente.id);
      continue;
    }

    const { data: creado, error } = await admin
      .from("pacientes")
      .insert(p)
      .select("id")
      .single();

    if (error || !creado) {
      throw new Error(`No se pudo crear la paciente demo ${p.numero_documento}: ${error?.message}`);
    }
    pacienteIds.push(creado.id);
    pacientesCreados += 1;
  }
  console.log(`Pacientes: ${pacientesCreados} nuevas, ${pacientes.length - pacientesCreados} ya existían.`);

  console.log("Verificando citas/atenciones/seguimientos de demo…");
  const profesionales = [usuarioIdPorRol["medico"], usuarioIdPorRol["obstetra"]];
  let citasCreadas = 0;
  let pacientesOmitidos = 0;

  for (let i = 0; i < pacienteIds.length; i++) {
    const pacienteId = pacienteIds[i];

    const { data: citaExistente } = await admin
      .from("citas")
      .select("id")
      .eq("paciente_id", pacienteId)
      .limit(1)
      .maybeSingle();

    if (citaExistente) {
      pacientesOmitidos += 1;
      continue;
    }

    // Distribuye 30 pacientes en 14 días (-7 a +6) entre 2 profesionales,
    // con hasta 2 horarios por profesional por día. Cada combinación
    // (profesional, día, hora) es única, así que nunca choca con el
    // EXCLUDE de citas aunque el script se corra sobre datos parciales.
    const profesionalIdx = i % 2;
    const turnoGlobal = Math.floor(i / 2);
    const diaIdx = turnoGlobal % 14;
    const slotEnDia = Math.floor(turnoGlobal / 14);
    const diaOffset = -7 + diaIdx;
    const profesionalId = profesionales[profesionalIdx];
    const hora = slotEnDia === 0 ? "09:00" : "10:00";
    const inicio = fechaLima(diaOffset, hora);
    const finDate = new Date(new Date(inicio).getTime() + 30 * 60 * 1000);
    const esPasada = diaOffset < 0;

    const { data: cita, error: errorCita } = await admin
      .from("citas")
      .insert({
        paciente_id: pacienteId,
        profesional_id: profesionalId,
        servicio_id: servicioConsultaId,
        inicio,
        fin: finDate.toISOString(),
        estado: esPasada ? "atendida" : "programada",
      })
      .select("id")
      .single();

    if (errorCita || !cita) {
      throw new Error(`No se pudo crear la cita demo #${i}: ${errorCita?.message}`);
    }
    citasCreadas += 1;

    if (esPasada) {
      const { data: atencion, error: errorAtencion } = await admin
        .from("atenciones")
        .insert({
          paciente_id: pacienteId,
          cita_id: cita.id,
          profesional_id: profesionalId,
          servicio_id: servicioConsultaId,
          fecha: inicio,
          motivo_consulta: "Control de rutina (demo ficticia)",
          diagnostico: "Sin hallazgos relevantes (demo ficticia)",
          plan_tratamiento: "Continuar controles periódicos (demo ficticia)",
          estado: "firmada",
        })
        .select("id")
        .single();

      if (errorAtencion || !atencion) {
        throw new Error(`No se pudo crear la atención demo #${i}: ${errorAtencion?.message}`);
      }

      if (i % 3 === 0) {
        await admin.from("seguimientos").insert({
          paciente_id: pacienteId,
          atencion_id: atencion.id,
          tipo: "control",
          descripcion: "Control en 4 semanas (demo ficticia)",
          fecha_objetivo: fechaLima(diaOffset + 28, "00:00").slice(0, 10),
          responsable_id: profesionalId,
        });
      }
    }
  }

  console.log(
    `Citas: ${citasCreadas} nuevas, ${pacientesOmitidos} pacientes ya tenían datos (omitidos).`,
  );
  console.log("\nListo. Datos de demo verificados/creados en gynfem-dev.");
}

main().catch((e) => {
  console.error("Error inesperado:", e);
  process.exit(1);
});
