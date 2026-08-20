"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EstadoCuota } from "@/lib/cuota";

import { ingresar, type EstadoIngreso } from "./acciones";

const ESTADO_INICIAL: EstadoIngreso = {};

const COLORES: Record<EstadoCuota, string> = {
  ACTIVO: "border-emerald-500/40 bg-emerald-500/10",
  PROXIMO_A_VENCER: "border-amber-500/40 bg-amber-500/10",
  EN_PERIODO_DE_PAGO: "border-orange-500/40 bg-orange-500/10",
  VENCIDO: "border-red-500/40 bg-red-500/10",
};

const CLASE_INPUT =
  "h-12 border-neutral-700 bg-neutral-900 text-lg text-neutral-100 placeholder:text-neutral-600";

export function FormularioIngreso() {
  const [estado, accion, enviando] = useActionState(ingresar, ESTADO_INICIAL);
  const [esDelEquipo, setEsDelEquipo] = useState(false);

  return (
    <div className="space-y-6">
      <form action={accion} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="dni" className="text-base">
            Tu DNI
          </Label>
          <Input
            id="dni"
            name="dni"
            inputMode="numeric"
            autoComplete="username"
            autoFocus
            required
            placeholder="30123456"
            className={CLASE_INPUT}
          />
          <p className="text-xs text-neutral-500">Sin puntos ni espacios.</p>
        </div>

        {/* El campo existe siempre, pero se muestra solo si la persona dice que
            es del equipo: al socio no le sirve y lo confundiría. */}
        <div className={esDelEquipo ? "space-y-2" : "hidden"}>
          <Label htmlFor="password" className="text-base">
            Contraseña
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            className={CLASE_INPUT}
          />
        </div>

        <Button type="submit" disabled={enviando} className="h-12 w-full text-base">
          {enviando
            ? "Entrando…"
            : esDelEquipo
              ? "Entrar al panel"
              : "Ver mi cuota"}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => setEsDelEquipo((valor) => !valor)}
        className="text-sm text-neutral-400 underline underline-offset-4 hover:text-neutral-200"
      >
        {esDelEquipo
          ? "Soy socio, solo quiero ver mi cuota"
          : "Soy del equipo del gimnasio"}
      </button>

      {estado.error ? (
        <p
          role="alert"
          className="rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-neutral-300"
        >
          {estado.error}
        </p>
      ) : null}

      {estado.cuota ? (
        <div
          role="status"
          className={`space-y-2 rounded-xl border p-6 ${COLORES[estado.cuota.estado]}`}
        >
          <p className="text-2xl font-semibold">Hola, {estado.cuota.nombre}</p>
          <p className="text-lg">{estado.cuota.mensaje}</p>

          {estado.cuota.cuentaDadaDeBaja ? (
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
