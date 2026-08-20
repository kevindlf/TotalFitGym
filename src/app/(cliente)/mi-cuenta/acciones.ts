"use server";

import { z } from "zod";

import { consultarCuotaPorDni, type ConsultaDeCuota } from "@/lib/portal";

export type EstadoConsulta = {
  error?: string;
  resultado?: ConsultaDeCuota;
};

const esquema = z.object({
  dni: z
    .string()
    .trim()
    .regex(/^\d{6,12}$/, "Ingresá un DNI de 6 a 12 dígitos, sin puntos."),
});

export async function consultarMiCuota(
  _estadoPrevio: EstadoConsulta,
  formData: FormData,
): Promise<EstadoConsulta> {
  const parseado = esquema.safeParse({ dni: formData.get("dni") });

  if (!parseado.success) {
    return { error: parseado.error.issues[0]?.message };
  }

  const resultado = await consultarCuotaPorDni(parseado.data.dni);

  if (!resultado) {
    return {
      error:
        "No encontramos ese DNI. Si sos socio, acercate a recepción para que lo carguen.",
    };
  }

  return { resultado };
}
