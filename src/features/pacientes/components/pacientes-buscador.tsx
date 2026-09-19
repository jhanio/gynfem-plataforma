import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PacientesBuscadorProps {
  q: string;
}

/**
 * Formulario GET sin JavaScript: el término queda en la URL (?q=...),
 * compatible con paginación en servidor y sin necesidad de debounce.
 */
export function PacientesBuscador({ q }: PacientesBuscadorProps) {
  return (
    <form action="/pacientes" method="get" className="flex gap-2">
      <Input
        type="search"
        name="q"
        defaultValue={q}
        placeholder="Buscar por documento, nombre o teléfono…"
        aria-label="Buscar pacientes"
        className="max-w-sm"
      />
      <Button type="submit" variant="secondary">
        <Search />
        Buscar
      </Button>
    </form>
  );
}
