"use client";

import { useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ResultadoIngreso } from "@/lib/recepcion";

import { ResultadoAcceso } from "./resultado-acceso";

export function ConsultaDni() {
  const [dni, setDni] = useState("");
  const [consultando, setConsultando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ultimaConsulta, setUltimaConsulta] = useState<{
    dni: string;
    resultado: ResultadoIngreso;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  async function consultar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const dniNormalizado = dni.trim();

    if (!/^\d{6,12}$/.test(dniNormalizado)) {
      setError("Ingresá un DNI de 6 a 12 dígitos.");

      return;
    }

    setConsultando(true);
    setError(null);

    try {
      const respuesta = await fetch("/api/recepcion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dni: dniNormalizado }),
      });

      if (!respuesta.ok) {
        const cuerpo = await respuesta.json().catch(() => null);

        setError(cuerpo?.error ?? "No se pudo consultar. Probá de nuevo.");
        setUltimaConsulta(null);

        return;
      }

      setUltimaConsulta({
        dni: dniNormalizado,
        resultado: (await respuesta.json()) as ResultadoIngreso,
      });

      // La pantalla vive en la puerta: se limpia sola y recupera el foco para
      // que el siguiente socio no tenga que tocar nada.
      setDni("");
    } catch {
      setError("No se pudo conectar con el servidor.");
      setUltimaConsulta(null);
    } finally {
      setConsultando(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={consultar} className="space-y-3">
        <Label htmlFor="dni" className="text-lg">
          DNI del socio
        </Label>

        <div className="flex gap-3">
          <Input
            id="dni"
            ref={inputRef}
            value={dni}
            onChange={(evento) => setDni(evento.target.value)}
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            placeholder="30123456"
            className="h-16 text-2xl md:text-3xl"
          />
          <Button
            type="submit"
            disabled={consultando}
            className="h-16 px-8 text-lg"
          >
            {consultando ? "Buscando…" : "Consultar"}
          </Button>
        </div>
      </form>

      {error ? (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-destructive"
        >
          {error}
        </p>
      ) : null}

      {ultimaConsulta ? (
        <ResultadoAcceso
          resultado={ultimaConsulta.resultado}
          dniConsultado={ultimaConsulta.dni}
        />
      ) : null}
    </div>
  );
}
