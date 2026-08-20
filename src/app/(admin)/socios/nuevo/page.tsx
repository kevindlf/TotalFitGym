import type { Metadata } from "next";
import Link from "next/link";

import { listarSedes } from "@/lib/socios";

import { FormularioSocio } from "./formulario-socio";

export const metadata: Metadata = { title: "Nuevo socio · Total Fit" };

export const dynamic = "force-dynamic";

export default async function PaginaNuevoSocio() {
  const sedes = await listarSedes();

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
      </header>

      {sedes.length === 0 ? (
        <p className="rounded-lg border p-6 text-muted-foreground">
          No hay ninguna sede activa cargada. Creá una antes de dar de alta
          socios (por ahora se crea con el seed: <code>npm run db:seed</code>).
        </p>
      ) : (
        <FormularioSocio sedes={sedes} />
      )}
    </div>
  );
}
