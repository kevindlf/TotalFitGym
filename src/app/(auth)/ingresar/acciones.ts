"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";

import { signIn } from "@/lib/auth";
import {
  buscarSocioPorDni,
  crearClaveDelSocio,
  verificarClaveDelSocio,
  LARGO_MINIMO_CLAVE,
} from "@/lib/portal";
import { crearSesionDelSocio } from "@/lib/sesion-socio";

export type EstadoIngreso = {
  error?: string;
  /** Pedirle al socio que cree su clave: no tiene ninguna todavía. */
  ofrecerCrearClave?: { dni: string };
};

const DNI_INVALIDO = "Ingresá un DNI de 6 a 12 dígitos, sin puntos.";

const esquemaDni = z
  .string()
  .trim()
  .regex(/^\d{6,12}$/, DNI_INVALIDO);

const NO_ENCONTRADO =
  "No encontramos ese DNI. Si sos socio, acercate a recepción para que lo carguen.";

/**
 * Puerta única del sistema.
 *
 * Tres caminos, decididos por lo que la persona eligió y escribió — nunca por
 * lo que el DNI "es". Así la pantalla no revela si un DNI pertenece al personal
 * o a un socio:
 *
 * - Personal con DNI + contraseña → panel.
 * - Socio con DNI solo → su pantalla, en nivel BASICO.
 * - Socio con DNI + clave → su pantalla, en nivel COMPLETO (el único que
 *   descarga la rutina).
 */
export async function ingresar(
  _estadoPrevio: EstadoIngreso,
  formData: FormData,
): Promise<EstadoIngreso> {
  const perfil = formData.get("perfil") === "equipo" ? "equipo" : "socio";
  const dniParseado = esquemaDni.safeParse(formData.get("dni"));

  if (!dniParseado.success) {
    return { error: DNI_INVALIDO };
  }

  const dni = dniParseado.data;
  const clave = String(formData.get("password") ?? "");

  if (perfil === "equipo") {
    try {
      await signIn("credentials", {
        dni,
        password: clave,
        redirectTo: "/dashboard",
      });

      return {};
    } catch (error) {
      if (error instanceof AuthError) {
        return { error: "DNI o contraseña incorrectos." };
      }

      // `signIn` señaliza el redirect con una excepción: tiene que propagarse.
      throw error;
    }
  }

  // --- Socio ---------------------------------------------------------------

  if (clave.length > 0) {
    const verificado = await consultar(() =>
      verificarClaveDelSocio(dni, clave),
    );

    if ("error" in verificado) {
      return verificado;
    }

    if (!verificado.dato) {
      return { error: "DNI o clave incorrectos." };
    }

    await crearSesionDelSocio(verificado.dato.id, "COMPLETO");
    redirect("/mi-cuenta");
  }

  const socio = await consultar(() => buscarSocioPorDni(dni));

  if ("error" in socio) {
    return socio;
  }

  if (!socio.dato) {
    return { error: NO_ENCONTRADO };
  }

  await crearSesionDelSocio(socio.dato.id, "BASICO");
  redirect("/mi-cuenta");
}

const esquemaClaveNueva = z.object({
  dni: esquemaDni,
  ultimosCuatro: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Ingresá los últimos 4 números de tu teléfono."),
  clave: z
    .string()
    .min(
      LARGO_MINIMO_CLAVE,
      `La clave necesita al menos ${LARGO_MINIMO_CLAVE} caracteres.`,
    ),
  repetir: z.string(),
});

/** El socio se crea la clave verificando los últimos 4 dígitos del teléfono. */
export async function crearMiClave(
  _estadoPrevio: EstadoIngreso,
  formData: FormData,
): Promise<EstadoIngreso> {
  const parseado = esquemaClaveNueva.safeParse({
    dni: formData.get("dni"),
    ultimosCuatro: formData.get("ultimosCuatro"),
    clave: formData.get("clave"),
    repetir: formData.get("repetir"),
  });

  if (!parseado.success) {
    return { error: parseado.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { dni, ultimosCuatro, clave, repetir } = parseado.data;

  if (clave !== repetir) {
    return { error: "Las dos claves no coinciden." };
  }

  let resultado: Awaited<ReturnType<typeof crearClaveDelSocio>>;

  try {
    resultado = await crearClaveDelSocio(dni, ultimosCuatro, clave);
  } catch (error) {
    console.error("Falló la creación de clave:", error);

    return { error: "No pudimos guardar tu clave ahora. Probá más tarde." };
  }

  if (!resultado.ok) {
    return { error: resultado.error };
  }

  await crearSesionDelSocio(resultado.id, "COMPLETO");
  redirect("/mi-cuenta");
}

/** Envuelve una consulta a la base para que un caída no muestre un error crudo. */
async function consultar<T>(
  fn: () => Promise<T>,
): Promise<{ dato: T } | { error: string }> {
  try {
    return { dato: await fn() };
  } catch (error) {
    console.error("Falló la consulta del portal:", error);

    return {
      error: "No pudimos consultar tu cuota ahora. Probá de nuevo en un rato.",
    };
  }
}
