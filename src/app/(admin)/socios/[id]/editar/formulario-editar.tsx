"use client";

import { useActionState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { editarSocio, type EstadoFormulario } from "../../acciones";

const ESTADO_INICIAL: EstadoFormulario = {};

const CLASE_SELECT =
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm";

export function FormularioEditar({
  socio,
  sedes,
}: {
  socio: {
    id: string;
    dni: string;
    nombre: string;
    apellido: string;
    telefono: string | null;
    email: string | null;
    sede: { id_sede: string };
  };
  sedes: { id_sede: string; nombre: string }[];
}) {
  const [estado, accion, guardando] = useActionState(
    editarSocio,
    ESTADO_INICIAL,
  );

  return (
    <form action={accion} className="max-w-lg space-y-4">
      <input type="hidden" name="usuario_id" value={socio.id} />

      <div className="space-y-2">
        <Label htmlFor="dni">DNI *</Label>
        <Input
          id="dni"
          name="dni"
          inputMode="numeric"
          required
          defaultValue={socio.dni}
        />
        <p className="text-xs text-muted-foreground">
          Se puede corregir, pero sigue siendo único: si otra persona ya lo
          tiene, no se guarda.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre *</Label>
          <Input
            id="nombre"
            name="nombre"
            required
            defaultValue={socio.nombre}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="apellido">Apellido *</Label>
          <Input
            id="apellido"
            name="apellido"
            required
            defaultValue={socio.apellido}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="telefono">Teléfono</Label>
          <Input
            id="telefono"
            name="telefono"
            inputMode="tel"
            defaultValue={socio.telefono ?? ""}
          />
          <p className="text-xs text-muted-foreground">
            Con esto el socio verifica que es él para crear su clave.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={socio.email ?? ""}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sede_id">Sede *</Label>
        <select
          id="sede_id"
          name="sede_id"
          required
          defaultValue={socio.sede.id_sede}
          className={CLASE_SELECT}
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

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar cambios"}
        </Button>
        <Button
          render={<Link href={`/socios/${socio.id}`} />}
          variant="ghost"
          type="button"
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
