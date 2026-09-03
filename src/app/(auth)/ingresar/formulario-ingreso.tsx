"use client";

import { useActionState, useState } from "react";
import { Inter } from "next/font/google";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { ingresar, type EstadoIngreso } from "./acciones";

const fuenteNormal = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const ESTADO_INICIAL: EstadoIngreso = {};

const CLASE_INPUT = "h-12 rounded-xl bg-muted/40 border-transparent text-base transition-all focus:bg-background focus:border-red-500 focus:ring-1 focus:ring-red-500";

type Perfil = "socio" | "equipo";

export function FormularioIngreso() {
  const [estado, accion, enviando] = useActionState(ingresar, ESTADO_INICIAL);
  const [perfil, setPerfil] = useState<Perfil>("socio");

  const esEquipo = perfil === "equipo";

  return (
    <div className={cn("space-y-6", fuenteNormal.className)}>
      
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-bold tracking-tight">¡Bienvenido!</h1>
        <p className="text-sm text-muted-foreground text-balance min-h-[40px] transition-all">
          {esEquipo 
            ? "Ingresá tus credenciales para acceder al panel de administración del gimnasio." 
            : "Ingresá con tu DNI para ver tu estado, o con tu clave si sos parte del equipo."}
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Cómo querés ingresar"
        className="grid grid-cols-2 gap-1 rounded-2xl bg-muted/50 p-1.5 shadow-inner"
      >
        {(
          [
            { valor: "socio", texto: "Soy socio" },
            { valor: "equipo", texto: "Soy administrador" },
          ] as const
        ).map((opcion) => (
          <button
            key={opcion.valor}
            type="button"
            role="tab"
            aria-selected={perfil === opcion.valor}
            onClick={() => setPerfil(opcion.valor)}
            className={cn(
              "rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300",
              perfil === opcion.valor
                ? "bg-background text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opcion.texto}
          </button>
        ))}
      </div>

      <form action={accion} className="space-y-5">
        <input type="hidden" name="perfil" value={perfil} />

        <div className="space-y-2.5">
          <Label htmlFor="dni" className="ml-1 text-sm font-semibold text-foreground/80">
            {esEquipo ? "Tu DNI" : "Ingresá tu DNI"}
          </Label>
          <Input
            id="dni"
            name="dni"
            inputMode="numeric"
            autoComplete="username"
            autoFocus
            required
            placeholder="Ej: 30123456"
            className={CLASE_INPUT}
          />
        </div>

        <div className="space-y-2.5">
          <div className="flex items-baseline justify-between ml-1">
            <Label htmlFor="password" className="text-sm font-semibold text-foreground/80">
              {esEquipo ? "Contraseña" : "Tu clave"}
            </Label>
            {!esEquipo && (
              <span className="text-xs text-muted-foreground">(opcional)</span>
            )}
          </div>

          <Input
            key={perfil}
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required={esEquipo}
            placeholder="••••••••"
            className={CLASE_INPUT}
          />
          
          {!esEquipo && (
            <p className="ml-1 text-xs text-muted-foreground">
              Solo es necesaria si querés descargar tu rutina.
            </p>
          )}
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={enviando}
            className="h-12 w-full rounded-xl text-base font-semibold bg-red-600 text-white shadow-md transition-all hover:bg-red-700 hover:shadow-lg dark:bg-red-700 dark:hover:bg-red-800"
          >
            {enviando ? "Cargando..." : esEquipo ? "Ingresar al panel" : "Ver mi cuota"}
          </Button>
        </div>
      </form>

      {estado.error ? (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5 shrink-0" aria-hidden>
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          <p>{estado.error}</p>
        </div>
      ) : null}
    </div>
  );
}