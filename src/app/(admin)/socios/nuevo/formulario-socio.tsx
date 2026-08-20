"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { crearSocio, type EstadoFormulario } from "../acciones";

const ESTADO_INICIAL: EstadoFormulario = {};

export function FormularioSocio({
  sedes,
}: {
  sedes: { id_sede: string; nombre: string }[];
}) {
  const [estado, accion, enviando] = useActionState(crearSocio, ESTADO_INICIAL);

  return (
    <form action={accion} className="max-w-lg space-y-4">
      <div className="space-y-2">
        <Label htmlFor="dni">DNI *</Label>
        <Input
          id="dni"
          name="dni"
          inputMode="numeric"
          required
          autoFocus
          placeholder="30123456"
        />
        <p className="text-xs text-muted-foreground">
          Es la clave del socio: no puede repetirse ni cambiarse después.
        </p>
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
        <Label htmlFor="sede_id">Sede *</Label>
        {/* select nativo a propósito: es más rápido de usar con teclado y no
            necesita JavaScript para funcionar. */}
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

      {estado.error ? (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {estado.error}
        </p>
      ) : null}

      <Button type="submit" disabled={enviando}>
        {enviando ? "Guardando…" : "Crear socio"}
      </Button>
    </form>
  );
}
