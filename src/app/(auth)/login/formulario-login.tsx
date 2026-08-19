"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { autenticar, type EstadoLogin } from "./acciones";

const ESTADO_INICIAL: EstadoLogin = {};

export function FormularioLogin() {
  const [estado, accion, enviando] = useActionState(autenticar, ESTADO_INICIAL);

  return (
    <form action={accion} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="dni">DNI</Label>
        <Input
          id="dni"
          name="dni"
          inputMode="numeric"
          autoComplete="username"
          autoFocus
          required
          placeholder="30123456"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      {estado.error ? (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {estado.error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={enviando}>
        {enviando ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
