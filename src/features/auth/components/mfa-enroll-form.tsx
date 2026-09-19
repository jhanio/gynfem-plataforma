"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";
import {
  dataUriQrTotp,
  idsFactoresTotpSinVerificar,
  mensajeErrorMfa,
  nombreFactorMfa,
} from "@/lib/auth/mfa";

const LARGO_CODIGO = 6;

export function MfaEnrollForm() {
  const router = useRouter();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [secreto, setSecreto] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [generando, setGenerando] = useState(false);
  const [verificando, setVerificando] = useState(false);

  /**
   * Botón, no useEffect: un enroll() automático al montar se dispara dos
   * veces en desarrollo (modo estricto de React) y deja un factor sin
   * verificar cada vez que alguien recarga la página a mitad del flujo.
   * Antes de pedir uno nuevo, limpiamos los que hayan quedado de
   * intentos anteriores para no chocar con mfa_factor_name_conflict.
   */
  async function generarCodigo() {
    setGenerando(true);
    setError(null);

    const supabase = createClient();

    const { data: factores, error: errorListar } = await supabase.auth.mfa.listFactors();
    if (errorListar) {
      setGenerando(false);
      setError(mensajeErrorMfa(errorListar.code));
      return;
    }

    for (const id of idsFactoresTotpSinVerificar(factores?.all ?? [])) {
      await supabase.auth.mfa.unenroll({ factorId: id });
    }

    const { data, error: errorEnroll } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      issuer: "GynFem",
      friendlyName: nombreFactorMfa(),
    });

    setGenerando(false);

    if (errorEnroll || !data) {
      setError(mensajeErrorMfa(errorEnroll?.code));
      return;
    }

    setFactorId(data.id);
    setSecreto(data.totp.secret);
    setQrCode(data.totp.qr_code);
  }

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

  if (!factorId || !secreto) {
    return (
      <div className="flex flex-col gap-4">
        {error ? (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <Button onClick={generarCodigo} disabled={generando}>
          {generando ? "Generando…" : "Generar código QR"}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {qrCode ? (
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- data URL: next/image no la optimiza y no aplica aquí. */}
          <img
            src={dataUriQrTotp(qrCode)}
            alt="Código QR para inscribir el segundo factor"
            width={200}
            height={200}
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="secreto-totp">Clave secreta (si no puedes escanear el QR, ingrésala manualmente)</Label>
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
