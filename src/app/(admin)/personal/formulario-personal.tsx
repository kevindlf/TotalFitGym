"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  crearMiembroDelPersonal,
  type EstadoFormulario,
} from "./acciones";

const ESTADO_INICIAL: EstadoFormulario = {};

export function FormularioPersonal({
  sedes,
}: {
  sedes: { id_sede: string; nombre: string }[];
}) {
  const [estado, accion, enviando] = useActionState(
    crearMiembroDelPersonal,
    ESTADO_INICIAL,
  );

  return (
    <form action={accion} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dni">DNI *</Label>
          <Input id="dni" name="dni" inputMode="numeric" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sede_id">Sede *</Label>
          <select
            id="sede_id"
            name="sede_id"
            required
            defaultValue={sedes.at(0)?.id_sede ?? ""}
            className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
          >
            {sedes.map((sede) => (
              <option key={sede.id_sede} value={sede.id_sede}>
                {sede.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre *</Label>
          <Input id="nombre" name="nombre" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="apellido">Apellido *</Label>
          <Input id="apellido" name="apellido" required />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="telefono">Teléfono</Label>
          <Input id="telefono" name="telefono" inputMode="tel" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña *</Label>
        <Input
          id="password"
          name="password"
          type="password"
          minLength={8}
          required
          autoComplete="new-password"
        />
        <p className="text-xs text-muted-foreground">
          Mínimo 8 caracteres. Se la pasás a mano y después la puede cambiar
          cualquier admin desde acá.
        </p>
      </div>

      {estado.error ? (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {estado.error}
        </p>
      ) : null}

      {estado.ok ? (
        <p
          role="status"
          className="rounded-md bg-emerald-100 px-3 py-2 text-sm text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
        >
          {estado.ok}
        </p>
      ) : null}

      <Button type="submit" disabled={enviando}>
        {enviando ? "Guardando…" : "Dar de alta"}
      </Button>
    </form>
  );
}
