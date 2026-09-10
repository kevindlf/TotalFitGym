import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, UserCog } from "lucide-react";

import { obtenerSocio } from "@/lib/socios";
import { exigirPanel } from "@/lib/sede";

import { FormularioEditar } from "./formulario-editar";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  // Opcional: Generar título dinámico para la pestaña, aunque no es estrictamente necesario.
  return { title: "Editar socio · Total Fit" };
}

export default async function PaginaEditarSocio({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await exigirPanel();
  const socio = await obtenerSocio(id, ctx.sedeId);

  if (!socio) {
    notFound();
  }

  return (
    <div className="space-y-8 pb-10 max-w-3xl mx-auto">
      <header className="space-y-4 border-b border-border/40 pb-6">
        <Link
          href={`/socios/${socio.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Volver a la ficha
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 shadow-sm">
            <UserCog className="size-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Editar a {socio.nombre}
          </h1>
        </div>
        
        <p className="text-sm font-medium text-muted-foreground pl-[52px]">
          Acá podés modificar los datos personales básicos. La clave, el estado de la cuenta 
          y la sede se gestionan directamente desde su ficha principal.
        </p>
      </header>

      {/* El formulario se va a encargar de renderizar los inputs */}
      <div className="rounded-2xl border border-border/40 bg-card/40 p-6 shadow-sm sm:p-8">
        <FormularioEditar socio={socio} />
      </div>
    </div>
  );
}