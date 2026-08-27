import type { Metadata } from "next";
import Link from "next/link";

import { exigirPanel } from "@/lib/sede";

import { FormularioSocio } from "./formulario-socio";

export const metadata: Metadata = { title: "Nuevo socio · Total Fit" };

export const dynamic = "force-dynamic";

export default async function PaginaNuevoSocio() {
  // La sede sale de la sesión y ya no se elige: si `exigirPanel` devolvió un
  // contexto, hay una sede válida. Por eso desaparece el caso "no hay sedes".
  const ctx = await exigirPanel();

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <Link
          href="/socios"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Volver a socios
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Nuevo socio</h1>
        <p className="text-muted-foreground">
          Va a quedar en la sede {ctx.sedeNombre}, la misma en la que estás
          trabajando.
        </p>
      </header>

      <FormularioSocio sedeNombre={ctx.sedeNombre} />
    </div>
  );
}
