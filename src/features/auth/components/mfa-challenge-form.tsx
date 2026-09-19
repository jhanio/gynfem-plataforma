"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { mensajeErrorMfa } from "@/lib/auth/mfa";

const LARGO_CODIGO = 6;

export function MfaChallengeForm() {
  const router = useRouter();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verificando, setVerificando] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;

    async function buscarFactor() {
      const supabase = createClient();
      const { data, error } = await supabase.auth.mfa.listFactors();

      if (cancelado) return;

      const factorVerificado = data?.totp.find((f) => f.status === "verified");
      if (error || !factorVerificado) {
        setError(error ? mensajeErrorMfa(error.code) : "No se encontró un factor de verificación inscrito.");
        setCargando(false);
        return;
      }

      setFactorId(factorVerificado.id);
      setCargando(false);
    }

    buscarFactor();

    return () => {
      cancelado = true;
    };
  }, []);

  async function onSubmit(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!factorId) return;

    setVerificando(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: codigo,
    });

    if (error) {
      setVerificando(false);
      setError(mensajeErrorMfa(error.code));
      return;
    }

    router.replace("/inicio");
    router.refresh();
  }

  if (cargando) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!factorId) {
    return (
      <Alert variant="destructive" role="alert">
        <AlertDescription>
          {error ?? "No se encontró un factor de verificación inscrito."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="codigo">Código de 6 dígitos</Label>
        <Input
          id="codigo"
          name="codigo"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={LARGO_CODIGO}
          required
          autoFocus
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
          disabled={verificando}
        />
      </div>

      <Button
        type="submit"
        disabled={verificando || codigo.length !== LARGO_CODIGO}
      >
        {verificando ? "Verificando…" : "Confirmar"}
      </Button>
    </form>
  );
}
