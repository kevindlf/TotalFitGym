"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EstadoCuota } from "@/lib/cuota";

import { consultarMiCuota, type EstadoConsulta } from "./acciones";

const ESTADO_INICIAL: EstadoConsulta = {};

const COLORES: Record<EstadoCuota, string> = {
  ACTIVO: "border-emerald-500/40 bg-emerald-500/10",
  PROXIMO_A_VENCER: "border-amber-500/40 bg-amber-500/10",
  EN_PERIODO_DE_PAGO: "border-orange-500/40 bg-orange-500/10",
  VENCIDO: "border-red-500/40 bg-red-500/10",
};

export function ConsultaCuota() {
  const [estado, accion, consultando] = useActionState(
    consultarMiCuota,
    ESTADO_INICIAL,
  );

  return (
    <div className="space-y-6">
      <form action={accion} className="space-y-3">
        <Label htmlFor="dni" className="text-base">
          Tu DNI
        </Label>

        <div className="flex gap-2">
          <Input
            id="dni"
            name="dni"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            required
            placeholder="30123456"
            className="h-12 border-neutral-700 bg-neutral-900 text-lg text-neutral-100 placeholder:text-neutral-600"
          />
          <Button type="submit" disabled={consultando} className="h-12 px-6">
            {consultando ? "Buscando…" : "Consultar"}
          </Button>
        </div>

        <p className="text-xs text-neutral-500">Sin puntos ni espacios.</p>
      </form>

      {estado.error ? (
        <p
          role="alert"
          className="rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-neutral-300"
        >
          {estado.error}
        </p>
      ) : null}

      {estado.resultado ? (
        <div
          role="status"
          className={`space-y-2 rounded-xl border p-6 ${COLORES[estado.resultado.estado]}`}
        >
          <p className="text-2xl font-semibold">
            Hola, {estado.resultado.nombre}
          </p>

          <p className="text-lg">{estado.resultado.mensaje}</p>

          {estado.resultado.cuentaDadaDeBaja ? (
            <p className="text-sm text-neutral-400">
              Tu cuenta figura dada de baja. Acercate a recepción para
              reactivarla.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
