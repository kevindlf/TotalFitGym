import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Inter, Montserrat } from "next/font/google";

import { SelectorDeSede } from "@/components/admin/selector-de-sede";
import { CerrarSesion } from "@/components/admin/cerrar-sesion";
import { BotonTema } from "@/components/ui/boton-tema";
import { exigirPanel } from "@/lib/sede";
import { listarSedes } from "@/lib/socios";

const fuenteNormal = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fuenteLogo = Montserrat({
  subsets: ["latin"],
  weight: ["900"],
});

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
    // Aplicamos la fuente normal a toda la estructura del panel de administración
    <div className={`flex min-h-svh flex-col bg-background text-foreground ${fuenteNormal.className}`}>
      
      {/* Header Sticky con efecto blur (cristal) */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 p-4">
          
          {/* Logo unificado con la marca */}
          <Link href="/dashboard" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
            <Image 
              src="/totalfit.jpg" 
              alt="Logo Total Fit" 
              width={28} 
              height={28} 
              className="rounded-full object-cover"
            />
            <span className={`text-xl uppercase tracking-tighter ${fuenteLogo.className}`}>
              TOTAL <span className="text-red-600 dark:text-red-500">FIT</span>
            </span>
          </Link>

          <nav className="flex items-center gap-5 text-sm font-medium">
            {SECCIONES.map((seccion) => (
              <Link
                key={seccion.href}
                href={seccion.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {seccion.texto}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3 text-sm">
            {/*
              La sede se muestra siempre y bien visible: si un profe entra y ve
              una sucursal que no es la suya, quiere decir que lo cargaron mal.
              Ese error aparece el primer día en vez de a los tres meses.
            */}
            {ctx.esDuenio ? (
              <SelectorDeSede sedes={sedes} sedeActual={ctx.sedeId} />
            ) : (
              // Insignia moderna para el staff
              <span className="inline-flex items-center rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-600 dark:text-red-500 ring-1 ring-inset ring-red-500/20">
                Sede {ctx.sedeNombre}
              </span>
            )}

            <div className="hidden h-5 w-px bg-border/50 sm:block" aria-hidden="true" />

            <span className="hidden font-medium text-muted-foreground sm:inline-block">
              {ctx.usuarioNombre}
            </span>
            
            <div className="flex items-center gap-1">
              <BotonTema />
              <CerrarSesion />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}