import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import type { Rol } from "@/generated/prisma/enums";

import { auth } from "./auth";
import { prisma } from "./prisma";

/**
 * Sobre qué sede está operando el que mira la pantalla.
 *
 * Regla de Oro 5 (soberanía de la sede): toda consulta del panel se acota a la
 * sede que sale de acá. Este archivo es el ÚNICO lugar donde se decide cuál es.
 *
 * - Un `ADMIN` opera siempre sobre la sede de su propia ficha, tomada del JWT
 *   firmado. No hay forma de que trabaje sobre otra: ni con una cookie, ni con
 *   un campo escondido del formulario, ni escribiendo la URL a mano.
 * - Un `DUENIO` ve la cadena entera y elige con qué sucursal trabaja.
 */

const COOKIE_SEDE = "totalfit_sede";

export interface ContextoDelPanel {
  usuarioId: string;
  usuarioNombre: string;
  rol: Rol;
  /** Ve la cadena entera y puede cambiar de sede. */
  esDuenio: boolean;
  /** La sede sobre la que se está operando ahora. */
  sedeId: string;
  sedeNombre: string;
}

/** Los roles que entran al panel. El resto va a la puerta de ingreso. */
export function esRolDePanel(rol: Rol | undefined): boolean {
  return rol === "ADMIN" || rol === "DUENIO";
}

/**
 * Sede sobre la que trabaja un dueño.
 *
 * La cookie NO va firmada, y no hace falta: solo se lee cuando el rol ya es
 * `DUENIO`, que tiene permiso sobre todas las sedes igual. Un admin que se la
 * falsifique no gana nada, porque para él esta función ni se llama. La
 * propiedad de seguridad vive en el `if` de `resolver()`, no en una firma.
 */
async function sedeElegidaPorElDuenio(): Promise<{
  id_sede: string;
  nombre: string;
} | null> {
  const elegida = (await cookies()).get(COOKIE_SEDE)?.value;

  if (elegida) {
    const sede = await prisma.sede.findUnique({
      where: { id_sede: elegida },
      select: { id_sede: true, nombre: true },
    });

    // Si la cookie apunta a una sede que ya no existe se ignora en silencio y
    // se cae a la primera activa: que quede vieja no puede dejar al dueño
    // afuera del panel.
    if (sede) {
      return sede;
    }
  }

  return prisma.sede.findFirst({
    where: { estado: "ACTIVA" },
    select: { id_sede: true, nombre: true },
    orderBy: { nombre: "asc" },
  });
}

/**
 * Contexto del que está mirando, o `null` si no tiene por qué estar acá.
 *
 * Va envuelto en `cache()` para que el layout y la page de un mismo render
 * compartan la consulta del nombre de la sede en vez de hacerla dos veces.
 */
export const contextoDelPanel = cache(
  async (): Promise<ContextoDelPanel | null> => {
    const sesion = await auth();
    const usuario = sesion?.user;

    if (!usuario || !esRolDePanel(usuario.rol)) {
      return null;
    }

    const esDuenio = usuario.rol === "DUENIO";

    const sede = esDuenio
      ? await sedeElegidaPorElDuenio()
      : await prisma.sede.findUnique({
          where: { id_sede: usuario.sede_id },
          select: { id_sede: true, nombre: true },
        });

    if (!sede) {
      return null;
    }

    return {
      usuarioId: usuario.id,
      usuarioNombre: usuario.name ?? "",
      rol: usuario.rol,
      esDuenio,
      sedeId: sede.id_sede,
      sedeNombre: sede.nombre,
    };
  },
);

/**
 * Arranque de toda page y toda acción del panel.
 *
 * Reemplaza a los dos `exigirAdmin()` que estaban duplicados en
 * `socios/acciones.ts` y `personal/acciones.ts`.
 */
export async function exigirPanel(): Promise<ContextoDelPanel> {
  const contexto = await contextoDelPanel();

  if (!contexto) {
    redirect("/ingresar");
  }

  return contexto;
}

/** Para lo que solo puede hacer el dueño de la cadena. */
export async function exigirDuenio(): Promise<ContextoDelPanel> {
  const contexto = await exigirPanel();

  if (!contexto.esDuenio) {
    redirect("/dashboard");
  }

  return contexto;
}

/**
 * Cambia la sede sobre la que trabaja el dueño.
 *
 * Se verifica el rol del lado del servidor y no solo escondiendo el selector:
 * la cookie la puede escribir cualquiera, pero solo se lee si el rol es DUENIO.
 */
export async function elegirSedeActiva(sedeId: string): Promise<void> {
  await exigirDuenio();

  const sede = await prisma.sede.findUnique({
    where: { id_sede: sedeId },
    select: { id_sede: true },
  });

  if (!sede) {
    return;
  }

  (await cookies()).set(COOKIE_SEDE, sede.id_sede, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 12 * 60 * 60,
    path: "/",
  });
}
