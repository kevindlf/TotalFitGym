"use client";

import { useActionState } from "react";
import { 
  IdCard, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  Lock, 
  AlertCircle, 
  CheckCircle2, 
  Loader2 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import {
  crearMiembroDelPersonal,
  type EstadoFormulario,
} from "./acciones";

const ESTADO_INICIAL: EstadoFormulario = {};

const CLASE_SELECT =
  "flex h-11 w-full rounded-xl border border-border/50 bg-background/50 pl-10 pr-8 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-red-500 transition-all";

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
    <form action={accion} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        {/* CAMPO: DNI */}
        <div className="space-y-1.5">
          <Label htmlFor="dni" className="text-muted-foreground font-medium text-xs uppercase tracking-wider">
            DNI *
          </Label>
          <div className="relative">
            <IdCard className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="dni"
              name="dni"
              inputMode="numeric"
              required
              defaultValue=""
              className="h-11 rounded-xl bg-background/50 pl-10 border-border/50 focus-visible:ring-red-500 font-medium tabular-nums"
            />
          </div>
        </div>

        {/* CAMPO: SEDE */}
        <div className="space-y-1.5">
          <Label htmlFor="sede_id" className="text-muted-foreground font-medium text-xs uppercase tracking-wider">
            Sede *
          </Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <select
              id="sede_id"
              name="sede_id"
              required
              defaultValue={sedes.at(0)?.id_sede ?? ""}
              className={CLASE_SELECT}
            >
              {sedes.map((sede) => (
                <option key={sede.id_sede} value={sede.id_sede} className="bg-zinc-950 text-white dark:bg-zinc-900">
                  {sede.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {/* CAMPO: NOMBRE */}
        <div className="space-y-1.5">
          <Label htmlFor="nombre" className="text-muted-foreground font-medium text-xs uppercase tracking-wider">
            Nombre *
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              id="nombre" 
              name="nombre" 
              required 
              defaultValue=""
              className="h-11 rounded-xl bg-background/50 pl-10 border-border/50 focus-visible:ring-red-500 font-medium" 
            />
          </div>
        </div>

        {/* CAMPO: APELLIDO */}
        <div className="space-y-1.5">
          <Label htmlFor="apellido" className="text-muted-foreground font-medium text-xs uppercase tracking-wider">
            Apellido *
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              id="apellido" 
              name="apellido" 
              required 
              defaultValue=""
              className="h-11 rounded-xl bg-background/50 pl-10 border-border/50 focus-visible:ring-red-500 font-medium" 
            />
          </div>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {/* CAMPO: TELÉFONO */}
        <div className="space-y-1.5">
          <Label htmlFor="telefono" className="text-muted-foreground font-medium text-xs uppercase tracking-wider">
            Teléfono
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              id="telefono" 
              name="telefono" 
              inputMode="tel" 
              defaultValue=""
              className="h-11 rounded-xl bg-background/50 pl-10 border-border/50 focus-visible:ring-red-500 font-medium tabular-nums" 
            />
          </div>
        </div>

        {/* CAMPO: EMAIL */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-muted-foreground font-medium text-xs uppercase tracking-wider">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              id="email" 
              name="email" 
              type="email" 
              defaultValue=""
              className="h-11 rounded-xl bg-background/50 pl-10 border-border/50 focus-visible:ring-red-500 font-medium" 
            />
          </div>
        </div>
      </div>

      {/* CAMPO: CONTRASEÑA */}
      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-muted-foreground font-medium text-xs uppercase tracking-wider">
          Contraseña inicial *
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            name="password"
            type="password"
            minLength={8}
            required
            defaultValue=""
            autoComplete="new-password"
            className="h-11 rounded-xl bg-background/50 pl-10 border-border/50 focus-visible:ring-red-500 font-medium"
          />
        </div>
        <p className="text-xs font-medium text-muted-foreground mt-1">
          Mínimo 8 caracteres. Se la pasás a mano y después la puede cambiar cualquier admin desde la tabla.
        </p>
      </div>

      {/* MENSAJES DE ESTADO */}
      {estado.error ? (
        <div role="alert" className="flex items-start gap-3 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500 border border-red-500/20">
          <AlertCircle className="size-5 shrink-0 mt-0.5" />
          <p className="font-medium">{estado.error}</p>
        </div>
      ) : null}

      {estado.ok ? (
        <div role="status" className="flex items-start gap-3 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-500 border border-emerald-500/20">
          <CheckCircle2 className="size-5 shrink-0 mt-0.5" />
          <p className="font-medium">{estado.ok}</p>
        </div>
      ) : null}

      {/* BOTÓN DE ENVIAR */}
      <div className="pt-2">
        <Button 
          type="submit" 
          disabled={enviando}
          className={cn(
            "h-12 w-full sm:w-auto sm:px-8 rounded-xl text-base font-semibold transition-all",
            enviando 
              ? "bg-muted text-muted-foreground" 
              : "bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5"
          )}
        >
          {enviando ? (
            <>
              <Loader2 className="mr-2 size-5 animate-spin" />
              Guardando personal...
            </>
          ) : (
            "Dar de alta al personal"
          )}
        </Button>
      </div>
    </form>
  );
}