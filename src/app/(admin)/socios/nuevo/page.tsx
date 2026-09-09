import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";

import { exigirPanel } from "@/lib/sede";

import { FormularioSocio } from "./formulario-socio";

export const metadata: Metadata = { title: "Nuevo socio · Total Fit" };

export const dynamic = "force-dynamic";

export default async function PaginaNuevoSocio() {
  // La sede sale de la sesión y ya no se elige: si `exigirPanel` devolvió un
  // contexto, hay una sede válida. Por eso desaparece el caso "no hay sedes".
  const ctx = await exigirPanel();

  return (
    <div className="space-y-8 pb-10 max-w-3xl mx-auto">
      
      <header className="space-y-4 border-b border-border/40 pb-6">
        <Link
          href="/socios"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Volver a socios
        </Link>
        
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 shadow-sm">
            <UserPlus className="size-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Nuevo socio
          </h1>
        </div>

        <p className="text-sm font-medium text-muted-foreground pl-[52px]">
          El socio quedará registrado en la <span className="font-semibold text-foreground">Sede {ctx.sedeNombre}</span>, 
          la misma sucursal en la que estás trabajando actualmente.
        </p>
      </header>

      <div className="rounded-2xl border border-border/40 bg-card/40 p-6 shadow-sm sm:p-8">
        <FormularioSocio sedeNombre={ctx.sedeNombre} />
      </div>
      
    </div>
  );
}