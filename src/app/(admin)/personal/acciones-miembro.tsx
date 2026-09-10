"use client";

import { useActionState, useState } from "react";
// Sumamos los íconos de Lucide
import { Key, Lock, AlertCircle, CheckCircle2, Loader2, UserCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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
    return (
      <div className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/50 bg-muted/20 px-3 text-xs font-medium text-muted-foreground">
        <UserCheck className="size-3.5" />
        Tu cuenta
      </div>
    );
  }

  return (
    <form action={accion} className="flex w-full min-w-0 flex-col gap-1.5">
      <Button
        type="submit"
        size="sm"
        variant={estaActivo ? "outline" : "default"}
        disabled={enviando}
        className={cn(
          "h-9 w-full rounded-lg transition-colors",
          estaActivo 
            ? "border-red-500/20 text-red-500 hover:bg-red-500/10 hover:text-red-600" 
            : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
        )}
      >
        {enviando ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : estaActivo ? (
          "Dar de baja"
        ) : (
          "Reactivar"
        )}
      </Button>

      {estado.error ? (
        <p role="alert" className="text-center text-[10px] font-medium leading-tight text-red-500">
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
      <Button 
        size="sm" 
        variant="ghost" 
        onClick={() => setAbierto(true)}
        className="h-9 w-full gap-1.5 rounded-lg text-xs hover:bg-muted/50 text-muted-foreground hover:text-foreground"
      >
        <Key className="size-3.5" />
        <span className="truncate">Contraseña</span>
      </Button>
    );
  }

  return (
    <form action={accion} className="flex w-full min-w-[180px] flex-col gap-2 rounded-xl border border-border/40 bg-card/60 p-2.5 shadow-sm backdrop-blur-sm">
      <input type="hidden" name="usuario_id" value={usuarioId} />

      <Label htmlFor={`password-${usuarioId}`} className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Clave de {nombre}
      </Label>

      <div className="relative">
        <Lock className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={`password-${usuarioId}`}
          name="password"
          type="password"
          minLength={8}
          required
          defaultValue=""
          autoComplete="new-password"
          className="h-8 rounded-md border-border/50 bg-background/50 pl-8 pr-2 text-xs focus-visible:ring-1 focus-visible:ring-red-500"
        />
      </div>

      {estado.error ? (
        <div role="alert" className="flex items-start gap-1 rounded bg-red-500/10 p-1.5 text-red-500">
          <AlertCircle className="mt-0.5 size-3 shrink-0" />
          <p className="text-[10px] font-medium leading-tight">{estado.error}</p>
        </div>
      ) : null}

      {estado.ok ? (
        <div role="status" className="flex items-start gap-1 rounded bg-emerald-500/10 p-1.5 text-emerald-500">
          <CheckCircle2 className="mt-0.5 size-3 shrink-0" />
          <p className="text-[10px] font-medium leading-tight">{estado.ok}</p>
        </div>
      ) : null}

      <div className="mt-1 flex gap-1.5">
        <Button 
          type="submit" 
          size="sm" 
          disabled={enviando}
          className="h-7 flex-1 rounded bg-red-600 text-[11px] text-white hover:bg-red-700"
        >
          {enviando ? <Loader2 className="size-3 animate-spin" /> : "Guardar"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setAbierto(false)}
          className="h-7 flex-1 rounded text-[11px] hover:bg-muted/50"
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}