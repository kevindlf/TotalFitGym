"use server";

import { AuthError } from "next-auth";
import { z } from "zod";

import { signIn } from "@/lib/auth";
import { consultarCuotaPorDni, type ConsultaDeCuota } from "@/lib/portal";

export type EstadoIngreso = {
  error?: string;
  cuota?: ConsultaDeCuota;
};

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
 * Un solo formulario para todos: se entra con el DNI. Si además se completa la
 * contraseña, se intenta el ingreso como personal y se abre el panel; si se
 * deja vacía, se muestra el estado de cuota del socio.
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

  try {
    const cuota = await consultarCuotaPorDni(dni);

    if (!cuota) {
      return {
        error:
          "No encontramos ese DNI. Si sos socio, acercate a recepción para que lo carguen.",
      };
    }

    return { cuota };
  } catch (error) {
    console.error("Falló la consulta de cuota:", error);

    return {
      error: "No pudimos consultar tu cuota ahora. Probá de nuevo en un rato.",
    };
  }
}
