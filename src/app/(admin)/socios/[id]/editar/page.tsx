import Link from "next/link";
import { notFound } from "next/navigation";

import { listarSedes, obtenerSocio } from "@/lib/socios";

import { FormularioEditar } from "./formulario-editar";

export const dynamic = "force-dynamic";

export default async function PaginaEditarSocio({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [socio, sedes] = await Promise.all([obtenerSocio(id), listarSedes()]);

  if (!socio) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <Link
          href={`/socios/${socio.id}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Volver a la ficha
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">
          Editar a {socio.nombre} {socio.apellido}
        </h1>
        <p className="text-muted-foreground">
          Acá no se toca la clave ni el estado de la cuenta: cada uno tiene su
          propio botón en la ficha.
        </p>
      </header>

      <FormularioEditar socio={socio} sedes={sedes} />
    </div>
  );
}
