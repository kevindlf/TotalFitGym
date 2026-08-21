"use client";

import { useActionState, useState } from "react";

import { crearMiClave, type EstadoIngreso } from "@/app/(auth)/ingresar/acciones";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ESTADO_INICIAL: EstadoIngreso = {};

/**
 * El socio se crea su clave desde su propia pantalla.
 *
 * Verifica con los últimos cuatro dígitos del teléfono que ya tenemos cargado:
 * es el dato que un desconocido con solo el DNI no tiene. El DNI viaja en un
 * campo oculto porque el socio ya está identificado por su sesión, pero el
 * servidor lo vuelve a validar contra el teléfono igual.
 */
export function CrearClave({ dni }: { dni: string }) {
  const [abierto, setAbierto] = useState(false);
  const [estado, accion, guardando] = useActionState(
    crearMiClave,
    ESTADO_INICIAL,
  );

  if (!abierto) {
    return (
      <Button type="button" onClick={() => setAbierto(true)} className="mt-4">
        Crear mi clave
      </Button>
    );
  }

  return (
    <form action={accion} className="mt-4 max-w-sm space-y-3">
      <input type="hidden" name="dni" value={dni} />

      <div className="space-y-1.5">
        <Label htmlFor="ultimosCuatro">
          Últimos 4 números de tu teléfono
        </Label>
        <Input
          id="ultimosCuatro"
          name="ultimosCuatro"
          inputMode="numeric"
          maxLength={4}
          required
          autoFocus
          placeholder="1234"
        />
        <p className="text-xs text-muted-foreground">
          Es para confirmar que sos vos. Si no tenemos tu teléfono cargado,
          pedile a un profe que lo agregue.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="clave">Tu clave nueva</Label>
        <Input
          id="clave"
          name="clave"
          type="password"
          minLength={8}
          required
          autoComplete="new-password"
        />
        <p className="text-xs text-muted-foreground">Mínimo 8 caracteres.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="repetir">Repetila</Label>
        <Input
          id="repetir"
          name="repetir"
          type="password"
          minLength={8}
          required
          autoComplete="new-password"
        />
      </div>

      {estado.error ? (
        <p role="alert" className="text-sm text-destructive">
          {estado.error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button type="submit" disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar clave"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setAbierto(false)}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
