import Link from "next/link";

import { SelectorDeSede } from "@/components/admin/selector-de-sede";
import { CerrarSesion } from "@/components/admin/cerrar-sesion";
import { BotonTema } from "@/components/ui/boton-tema";
import { exigirPanel } from "@/lib/sede";
import { listarSedes } from "@/lib/socios";

/**
 * Recepción NO va acá.
 *
 * Es la pantalla de la PC de la puerta, no una tarea de administración: desde
 * el panel el mismo dato se consulta mejor en /socios. Se llega desde el
 * dashboard, con un botón que deja claro para qué es.
 */
const SECCIONES = [
  { href: "/dashboard", texto: "Panel" },
  { href: "/socios", texto: "Socios" },
  { href: "/asistencias", texto: "Ingresos" },
  { href: "/personal", texto: "Personal" },
];

export default async function LayoutAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  // El proxy ya redirige, pero se revalida acá: la doc de Next dice que el
  // proxy no es la capa de autorización (Regla de Oro 4).
  const ctx = await exigirPanel();

  // Solo el dueño puede cambiar de sucursal, así que solo él necesita la lista.
  const sedes = ctx.esDuenio ? await listarSedes() : [];

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 p-4">
          <Link href="/dashboard" className="font-bold tracking-tight">
            TOTAL <span className="text-emerald-600">FIT</span>
          </Link>

          <nav className="flex gap-4 text-sm">
            {SECCIONES.map((seccion) => (
              <Link
                key={seccion.href}
                href={seccion.href}
                className="text-muted-foreground hover:text-foreground"
              >
                {seccion.texto}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 text-sm sm:gap-3">
            {/*
              La sede se muestra siempre y bien visible: si un profe entra y ve
              una sucursal que no es la suya, quiere decir que lo cargaron mal.
              Ese error aparece el primer día en vez de a los tres meses.
            */}
            {ctx.esDuenio ? (
              <SelectorDeSede sedes={sedes} sedeActual={ctx.sedeId} />
            ) : (
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                Sede {ctx.sedeNombre}
              </span>
            )}

            <span className="hidden text-muted-foreground sm:inline">
              {ctx.usuarioNombre}
            </span>
            <BotonTema />
            <CerrarSesion />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6">
        {children}
      </main>
    </div>
  );
}
