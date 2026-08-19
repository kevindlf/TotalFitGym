"use server";

import { AuthError } from "next-auth";

import { signIn } from "@/lib/auth";

export type EstadoLogin = { error?: string };

export async function autenticar(
  _estadoPrevio: EstadoLogin,
  formData: FormData,
): Promise<EstadoLogin> {
  try {
    await signIn("credentials", {
      dni: formData.get("dni"),
      password: formData.get("password"),
      redirectTo: "/recepcion",
    });

    return {};
  } catch (error) {
    // Un único mensaje para todos los motivos de rechazo: DNI inexistente,
    // usuario inactivo, cliente en vez de admin o password errónea. No le
    // confirmamos a nadie qué DNIs están registrados.
    if (error instanceof AuthError) {
      return { error: "DNI o contraseña incorrectos." };
    }

    // `signIn` señaliza el redirect con una excepción: tiene que propagarse.
    throw error;
  }
}
