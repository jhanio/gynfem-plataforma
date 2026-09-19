"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { obtenerFechaISOLima } from "@/lib/fechas";
import { desplazarFechaISO } from "@/features/agenda/dominio";

export type VistaAgenda = "dia" | "semana" | "hoy";

interface NavegacionFechaProps {
  fecha: string;
  vista: VistaAgenda;
}

export function NavegacionFecha({ fecha, vista }: NavegacionFechaProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function irA(nuevaFecha: string, nuevaVista: VistaAgenda = vista) {
    const params = new URLSearchParams(searchParams);
    params.set("fecha", nuevaFecha);
    params.set("vista", nuevaVista);
    router.push(`${pathname}?${params.toString()}`);
  }

  const paso = vista === "semana" ? 7 : 1;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={vista} onValueChange={(v) => irA(fecha, v as VistaAgenda)}>
        <SelectTrigger className="w-36" aria-label="Vista de agenda">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="dia">Día</SelectItem>
          <SelectItem value="semana">Semana</SelectItem>
          <SelectItem value="hoy">Hoy</SelectItem>
        </SelectContent>
      </Select>

      {vista !== "hoy" ? (
        <>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={vista === "semana" ? "Semana anterior" : "Día anterior"}
            onClick={() => irA(desplazarFechaISO(fecha, -paso))}
          >
            <ChevronLeft />
          </Button>
          <Input
            type="date"
            value={fecha}
            onChange={(e) => irA(e.target.value)}
            className="w-40"
            aria-label="Fecha"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={vista === "semana" ? "Semana siguiente" : "Día siguiente"}
            onClick={() => irA(desplazarFechaISO(fecha, paso))}
          >
            <ChevronRight />
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => irA(obtenerFechaISOLima(new Date()))}
          >
            Hoy
          </Button>
        </>
      ) : null}
    </div>
  );
}
