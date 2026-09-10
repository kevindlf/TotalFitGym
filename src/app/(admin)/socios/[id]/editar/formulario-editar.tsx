"use client";

import { useActionState } from "react";
import Link from "next/link";
// Importamos los íconos para cada campo
import { 
  IdCard, 
  User, 
  Phone, 
  Mail, 
  AlertCircle, 
  Loader2 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { editarSocio, type EstadoFormulario } from "../../acciones";

const ESTADO_INICIAL: EstadoFormulario = {};

export function FormularioEditar({
  socio,
}: {
  socio: {
    id: string;
    dni: string;
    nombre: string;
    apellido: string;
    telefono: string | null;
    email: string | null;
  };
}) {
  const [estado, accion, guardando] = useActionState(
    editarSocio,
    ESTADO_INICIAL,
  );

  return (
    <form action={accion} className="flex flex-col gap-5">
      <input type="hidden" name="usuario_id" value={socio.id} />

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
            defaultValue={socio.dni}
            className="h-11 rounded-xl bg-background/50 pl-10 border-border/50 focus-visible:ring-red-500 font-medium tabular-nums"
          />
        </div>
        <p className="text-xs font-medium text-muted-foreground mt-1">
          Se puede corregir, pero sigue siendo único: si otra persona ya lo tiene, no se guarda.
        </p>
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
              defaultValue={socio.nombre}
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
              defaultValue={socio.apellido}
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
              defaultValue={socio.telefono ?? ""}
              className="h-11 rounded-xl bg-background/50 pl-10 border-border/50 focus-visible:ring-red-500 font-medium tabular-nums"
            />
          </div>
          <p className="text-xs font-medium text-muted-foreground mt-1">
            Con esto el socio verifica que es él para crear su clave.
          </p>
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
              defaultValue={socio.email ?? ""}
              className="h-11 rounded-xl bg-background/50 pl-10 border-border/50 focus-visible:ring-red-500 font-medium"
            />
          </div>
        </div>
      </div>

      {/* MENSAJE DE ERROR */}
      {estado.error ? (
        <div 
          role="alert" 
          className="flex items-start gap-3 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500 border border-red-500/20 mt-2"
        >
          <AlertCircle className="size-5 shrink-0 mt-0.5" />
          <p className="font-medium">{estado.error}</p>
        </div>
      ) : null}

      {/* BOTONES DE ACCIÓN */}
      <div className="flex flex-col gap-3 sm:flex-row pt-4">
        <Button 
          type="submit" 
          disabled={guardando}
          className={cn(
            "h-12 w-full sm:w-auto sm:flex-1 rounded-xl text-base font-semibold transition-all",
            guardando 
              ? "bg-muted text-muted-foreground" 
              : "bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5"
          )}
        >
          {guardando ? (
            <>
              <Loader2 className="mr-2 size-5 animate-spin" />
              Guardando cambios...
            </>
          ) : (
            "Guardar cambios"
          )}
        </Button>
        
        <Button
          render={<Link href={`/socios/${socio.id}`} />}
          nativeButton={false} // ¡Solución al warning de accesibilidad!
          variant="outline"
          type="button"
          className="h-12 w-full sm:w-auto sm:px-8 rounded-xl text-base font-semibold border-border/50 hover:bg-muted/50"
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}