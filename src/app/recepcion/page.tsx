import type { Metadata } from "next";

import { ConsultaDni } from "@/components/recepcion/consulta-dni";
import { exigirPanel } from "@/lib/sede";

export const metadata: Metadata = {
  title: "Recepción · Total Fit",
};

export default async function PaginaRecepcion() {
  // El proxy ya redirige a /ingresar, pero se vuelve a verificar acá: la doc de
  // Next dice explícitamente que el proxy no es la capa de autorización.
  const ctx = await exigirPanel();

  return (
    <main className="mx-auto flex min-h-svh max-w-3xl flex-col gap-8 p-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">
          Recepción · Sede {ctx.sedeNombre}
        </h1>
        <p className="text-muted-foreground">
          Ingresá el DNI del socio para verificar el acceso. Esta puerta atiende
          solo a los socios de {ctx.sedeNombre}.
        </p>
      </header>

      <ConsultaDni />

      <footer className="mt-auto text-sm text-muted-foreground">
        Atiende: {ctx.usuarioNombre}
      </footer>
    </main>
  );
}
