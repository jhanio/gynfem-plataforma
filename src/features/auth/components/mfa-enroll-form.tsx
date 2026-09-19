"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";

const LARGO_CODIGO = 6;

export function MfaEnrollForm() {
  const router = useRouter();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [secreto, setSecreto] = useState<string | null>(null);
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verificando, setVerificando] = useState(false);
  const [inscribiendo, setInscribiendo] = useState(true);

  useEffect(() => {
    let cancelado = false;

    async function inscribir() {
      const supabase = createClient();
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        issuer: "GynFem",
      });

      if (cancelado) return;

      if (error || !data) {
        setError("No se pudo iniciar la inscripción. Vuelve a intentarlo.");
        setInscribiendo(false);
        return;
      }

      setFactorId(data.id);
      setSecreto(data.totp.secret);
      setInscribiendo(false);
    }

    inscribir();

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
      setError("Código incorrecto. Revisa la hora de tu dispositivo e intenta de nuevo.");
      return;
    }

    router.replace("/inicio");
    router.refresh();
  }

  if (inscribiendo) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!factorId || !secreto) {
    return (
      <Alert variant="destructive" role="alert">
        <AlertDescription>
          {error ?? "No se pudo iniciar la inscripción. Recarga la página."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="secreto-totp">Clave secreta (ingrésala manualmente en tu app)</Label>
        <Input
          id="secreto-totp"
          readOnly
          value={secreto}
          className="font-mono tracking-wider"
          onFocus={(e) => e.currentTarget.select()}
        />
      </div>

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
