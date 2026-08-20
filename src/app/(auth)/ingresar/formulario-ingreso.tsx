"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EstadoCuota } from "@/lib/cuota";
import { cn } from "@/lib/utils";

import { ingresar, type EstadoIngreso } from "./acciones";

const ESTADO_INICIAL: EstadoIngreso = {};

const COLORES: Record<EstadoCuota, string> = {
  ACTIVO: "border-emerald-500/40 bg-emerald-500/10",
  PROXIMO_A_VENCER: "border-amber-500/40 bg-amber-500/10",
  EN_PERIODO_DE_PAGO: "border-orange-500/40 bg-orange-500/10",
  VENCIDO: "border-red-500/40 bg-red-500/10",
};

// Inputs altos: se usan sobre todo desde el celular, con el pulgar.
const CLASE_INPUT =
  "h-12 border-neutral-700 bg-neutral-900 text-lg text-neutral-100 placeholder:text-neutral-600";

type Perfil = "socio" | "equipo";

export function FormularioIngreso() {
  const [estado, accion, enviando] = useActionState(ingresar, ESTADO_INICIAL);
  const [perfil, setPerfil] = useState<Perfil>("socio");

  return (
    <div className="space-y-6">
      {/* Elegir quién sos primero deja el formulario en una sola pregunta, que
          es lo que se puede leer de un vistazo en un teléfono. */}
      <div
        role="tablist"
        aria-label="Cómo querés ingresar"
        className="grid grid-cols-2 gap-1 rounded-xl bg-neutral-900 p-1"
      >
        {(
          [
            { valor: "socio", texto: "Soy socio" },
            { valor: "equipo", texto: "Trabajo acá" },
          ] as const
        ).map((opcion) => (
          <button
            key={opcion.valor}
            type="button"
            role="tab"
            aria-selected={perfil === opcion.valor}
            onClick={() => setPerfil(opcion.valor)}
            className={cn(
              "rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
              perfil === opcion.valor
                ? "bg-neutral-100 text-neutral-900"
                : "text-neutral-400 hover:text-neutral-100",
            )}
          >
            {opcion.texto}
          </button>
        ))}
      </div>

      <form action={accion} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="dni" className="text-base">
            {perfil === "socio" ? "Tu DNI" : "DNI"}
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

        {/* El campo existe siempre pero se oculta para el socio: no lo necesita
            y solo lo confundiría. Al ocultarlo se manda vacío, que es
            exactamente lo que el servidor interpreta como "consulta de cuota". */}
        <div className={perfil === "equipo" ? "space-y-2" : "hidden"}>
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

        <Button
          type="submit"
          disabled={enviando}
          className="h-12 w-full text-base"
        >
          {enviando
            ? "Entrando…"
            : perfil === "equipo"
              ? "Entrar al panel"
              : "Ver mi cuota"}
        </Button>
      </form>

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
          className={cn(
            "space-y-2 rounded-xl border p-5 sm:p-6",
            COLORES[estado.cuota.estado],
          )}
        >
          <p className="text-2xl font-semibold">Hola, {estado.cuota.nombre}</p>
          <p className="text-lg text-pretty">{estado.cuota.mensaje}</p>

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
