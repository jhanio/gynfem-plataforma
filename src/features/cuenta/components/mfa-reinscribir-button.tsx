"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface MfaReinscribirButtonProps {
  factorId: string;
}

export function MfaReinscribirButton({ factorId }: MfaReinscribirButtonProps) {
  const router = useRouter();
  const [pendiente, setPendiente] = useState(false);

  async function onClick() {
    setPendiente(true);
    const supabase = createClient();
    const { error } = await supabase.auth.mfa.unenroll({ factorId });

    if (error) {
      setPendiente(false);
      toast.error("No se pudo desinscribir el factor actual.");
      return;
    }

    router.push("/mfa/activar");
  }

  return (
    <Button variant="outline" onClick={onClick} disabled={pendiente}>
      {pendiente ? "Preparando…" : "Reinscribir MFA"}
    </Button>
  );
}
