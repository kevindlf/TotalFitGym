"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";

import { signIn } from "@/lib/auth";
import { buscarSocioPorDni } from "@/lib/portal";
import { crearSesionDelSocio } from "@/lib/sesion-socio";

export type EstadoIngreso = { error?: string };

const esquema = z.object({
  dni: z
    .string()
    .trim()
    .regex(/^\d{6,12}$/, "Ingresá un DNI de 6 a 12 dígitos, sin puntos."),
  password: z.string(),
});

/**
 * Puerta única del sistema.
 *
 * Con DNI solo, el socio entra a su propia pantalla. Con DNI y contraseña, el
 * personal entra al panel.
 *
 * Se decide por lo que la persona escribió y no por lo que el DNI "es": así la
 * pantalla nunca revela si un DNI pertenece al personal o a un socio.
 */
export async function ingresar(
  _estadoPrevio: EstadoIngreso,
  formData: FormData,
): Promise<EstadoIngreso> {
  const parseado = esquema.safeParse({
    dni: formData.get("dni"),
    password: formData.get("password") ?? "",
  });

  if (!parseado.success) {
    return { error: parseado.error.issues[0]?.message };
  }

  const { dni, password } = parseado.data;

  if (password.length > 0) {
    try {
      await signIn("credentials", { dni, password, redirectTo: "/dashboard" });

      return {};
    } catch (error) {
      if (error instanceof AuthError) {
        return { error: "DNI o contraseña incorrectos." };
      }

      // `signIn` señaliza el redirect con una excepción: tiene que propagarse.
      throw error;
    }
  }

  let socio: { id: string } | null;

  try {
    socio = await buscarSocioPorDni(dni);
  } catch (error) {
    console.error("Falló la búsqueda del socio:", error);

    return {
      error: "No pudimos consultar tu cuota ahora. Probá de nuevo en un rato.",
    };
  }

  if (!socio) {
    return {
      error:
        "No encontramos ese DNI. Si sos socio, acercate a recepción para que lo carguen.",
    };
  }

  // La sesión se guarda en una cookie firmada en vez de mandar el DNI en la
  // URL: una URL se comparte, queda en el historial y viaja en el `Referer`.
  await crearSesionDelSocio(socio.id);

  redirect("/mi-cuenta");
}
