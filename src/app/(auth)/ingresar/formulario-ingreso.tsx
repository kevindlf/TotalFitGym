"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { ingresar, type EstadoIngreso } from "./acciones";

const ESTADO_INICIAL: EstadoIngreso = {};

// Inputs altos: se usan sobre todo desde el celular, con el pulgar.
const CLASE_INPUT = "h-12 text-lg";

type Perfil = "socio" | "equipo";

export function FormularioIngreso() {
  const [estado, accion, enviando] = useActionState(ingresar, ESTADO_INICIAL);
  const [perfil, setPerfil] = useState<Perfil>("socio");

  const esEquipo = perfil === "equipo";

  return (
    <div className="space-y-6">
      {/* Elegir quién sos primero deja el formulario en una sola pregunta, que
          es lo que se puede leer de un vistazo en un teléfono. */}
      <div
        role="tablist"
        aria-label="Cómo querés ingresar"
        className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1"
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
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opcion.texto}
          </button>
        ))}
      </div>

      <form action={accion} className="space-y-4">
        {/* El servidor decide por lo que la persona eligió, no por lo que el
            DNI "es": así la pantalla nunca revela quién es del personal. */}
        <input type="hidden" name="perfil" value={perfil} />

        <div className="space-y-2">
          <Label htmlFor="dni" className="text-base">
            {esEquipo ? "DNI" : "Tu DNI"}
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
          <p className="text-xs text-muted-foreground">
            Sin puntos ni espacios.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-base">
            {esEquipo ? "Contraseña" : "Tu clave"}
            {!esEquipo ? (
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                (si tenés)
              </span>
            ) : null}
          </Label>

          {/* El `key` fuerza a React a rehacer el input al cambiar de perfil,
              para que no quede escrita la contraseña del otro camino. */}
          <Input
            key={perfil}
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required={esEquipo}
            className={CLASE_INPUT}
          />

          {!esEquipo ? (
            <p className="text-xs text-muted-foreground">
              Sin clave ves tu cuota igual. Solo hace falta para descargar tu
              rutina.
            </p>
          ) : null}
        </div>

        <Button
          type="submit"
          disabled={enviando}
          className="h-12 w-full text-base"
        >
          {enviando ? "Entrando…" : esEquipo ? "Entrar al panel" : "Entrar"}
        </Button>
      </form>

      {estado.error ? (
        <p
          role="alert"
          className="rounded-lg border border-input bg-card px-4 py-3 text-foreground/85"
        >
          {estado.error}
        </p>
      ) : null}
    </div>
  );
}
