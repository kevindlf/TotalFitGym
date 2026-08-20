"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  cambiarEstadoDelPersonal,
  cambiarPassword,
  type EstadoFormulario,
} from "./acciones";

const ESTADO_INICIAL: EstadoFormulario = {};

/** Botón de baja/reactivación que muestra el motivo si el servidor lo rechaza. */
export function BotonEstado({
  usuarioId,
  estaActivo,
  esUnoMismo,
}: {
  usuarioId: string;
  estaActivo: boolean;
  esUnoMismo: boolean;
}) {
  const [estado, accion, enviando] = useActionState(
    async () =>
      cambiarEstadoDelPersonal(usuarioId, estaActivo ? "INACTIVO" : "ACTIVO"),
    ESTADO_INICIAL,
  );

  if (esUnoMismo) {
    return <span className="text-xs text-muted-foreground">Sos vos</span>;
  }

  return (
    <form action={accion} className="space-y-1">
      <Button
        type="submit"
        size="sm"
        variant={estaActivo ? "outline" : "default"}
        disabled={enviando}
      >
        {estaActivo ? "Dar de baja" : "Reactivar"}
      </Button>

      {estado.error ? (
        <p role="alert" className="max-w-48 text-xs text-destructive">
          {estado.error}
        </p>
      ) : null}
    </form>
  );
}

export function CambiarPassword({
  usuarioId,
  nombre,
}: {
  usuarioId: string;
  nombre: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [estado, accion, enviando] = useActionState(
    cambiarPassword,
    ESTADO_INICIAL,
  );

  if (!abierto) {
    return (
      <Button size="sm" variant="ghost" onClick={() => setAbierto(true)}>
        Cambiar contraseña
      </Button>
    );
  }

  return (
    <form action={accion} className="space-y-2">
      <input type="hidden" name="usuario_id" value={usuarioId} />

      <Label htmlFor={`password-${usuarioId}`} className="text-xs">
        Nueva contraseña de {nombre}
      </Label>

      <div className="flex gap-2">
        <Input
          id={`password-${usuarioId}`}
          name="password"
          type="password"
          minLength={8}
          required
          autoComplete="new-password"
          className="h-8 w-48"
        />
        <Button type="submit" size="sm" disabled={enviando}>
          Guardar
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
        <p role="status" className="text-xs text-emerald-700 dark:text-emerald-400">
          {estado.ok}
        </p>
      ) : null}
    </form>
  );
}
