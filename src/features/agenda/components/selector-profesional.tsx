"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProfesionalAgenda } from "@/features/agenda/queries";

const TODOS = "todos";

interface SelectorProfesionalProps {
  profesionales: ProfesionalAgenda[];
  profesionalId?: string;
  permitirTodos: boolean;
}

export function SelectorProfesional({
  profesionales,
  profesionalId,
  permitirTodos,
}: SelectorProfesionalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(valor: string) {
    const params = new URLSearchParams(searchParams);
    if (valor === TODOS) {
      params.delete("profesionalId");
    } else {
      params.set("profesionalId", valor);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Select value={profesionalId ?? TODOS} onValueChange={onChange}>
      <SelectTrigger className="w-full sm:w-64" aria-label="Filtrar por profesional">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {permitirTodos ? <SelectItem value={TODOS}>Todos los profesionales</SelectItem> : null}
        {profesionales.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.nombreCompleto}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
