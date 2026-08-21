"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { reiniciarClaveDelSocio, type EstadoFormulario } from "../acciones";

const ESTADO_INICIAL: EstadoFormulario = {};

/**
 * Reinicia la clave de un socio desde el mostrador.
 *
 * Es la salida de emergencia: normalmente el socio se la crea solo desde su
 * pantalla verificando su teléfono. Esto es para el que cambió de número o se
 * la olvidó y vino a preguntar.
 */
export function ClaveSocio({
  usuarioId,
  nombre,
  tieneClave,
}: {
  usuarioId: string;
  nombre: string;
  tieneClave: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const [estado, accion, guardando] = useActionState(
    reiniciarClaveDelSocio,
    ESTADO_INICIAL,
  );

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        {tieneClave
          ? `${nombre} ya tiene clave para ver su rutina.`
          : `${nombre} todavía no creó su clave. Puede crearla solo desde "Mi cuenta" con los últimos 4 números de su teléfono.`}
      </p>

      {abierto ? (
        <form action={accion} className="max-w-sm space-y-2">
          <input type="hidden" name="usuario_id" value={usuarioId} />

          <Label htmlFor={`clave-${usuarioId}`} className="text-sm">
            Clave nueva para {nombre}
          </Label>

          <div className="flex flex-wrap gap-2">
            <Input
              id={`clave-${usuarioId}`}
              name="clave"
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
              className="h-9 w-48"
            />
            <Button type="submit" size="sm" disabled={guardando}>
              {guardando ? "Guardando…" : "Guardar"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setAbierto(false)}
            >
              Cancelar
            </Button>
          </div>

          {estado.error ? (
            <p role="alert" className="text-xs text-destructive">
              {estado.error}
            </p>
          ) : null}

          {estado.ok ? (
            <p
              role="status"
              className="text-xs text-emerald-700 dark:text-emerald-400"
            >
              {estado.ok}
            </p>
          ) : null}
        </form>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setAbierto(true)}
        >
          {tieneClave ? "Reiniciar su clave" : "Ponerle una clave"}
        </Button>
      )}
    </div>
  );
}
