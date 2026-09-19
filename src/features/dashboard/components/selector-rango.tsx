import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RangoPreset } from "../dominio";

interface SelectorRangoProps {
  preset: RangoPreset;
  desde?: string;
  hasta?: string;
}

const PRESETS_SIMPLES: { valor: RangoPreset; etiqueta: string }[] = [
  { valor: "hoy", etiqueta: "Hoy" },
  { valor: "7dias", etiqueta: "Últimos 7 días" },
  { valor: "mes", etiqueta: "Este mes" },
];

export function SelectorRango({ preset, desde, hasta }: SelectorRangoProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-wrap gap-2">
        {PRESETS_SIMPLES.map((p) => (
          <Button
            key={p.valor}
            asChild
            variant={preset === p.valor ? "default" : "outline"}
            size="sm"
          >
            <Link href={`/dashboard?preset=${p.valor}`}>{p.etiqueta}</Link>
          </Button>
        ))}
      </div>

      <form action="/dashboard" method="get" className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="preset" value="personalizado" />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rango-desde">Desde</Label>
          <Input id="rango-desde" type="date" name="desde" defaultValue={desde ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rango-hasta">Hasta</Label>
          <Input id="rango-hasta" type="date" name="hasta" defaultValue={hasta ?? ""} />
        </div>
        <Button
          type="submit"
          size="sm"
          variant={preset === "personalizado" ? "default" : "outline"}
        >
          Aplicar rango
        </Button>
      </form>
    </div>
  );
}
