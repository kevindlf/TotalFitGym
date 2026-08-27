import { NextResponse } from "next/server";
import { z } from "zod";

import { evaluarIngresoPorDni } from "@/lib/recepcion";
import { contextoDelPanel } from "@/lib/sede";

/**
 * API de la puerta.
 *
 * Regla de Oro 3: este archivo exporta POST y nada más. No hay PUT, PATCH ni
 * DELETE acá ni en ninguna otra ruta que toque asistencias — una vez registrada,
 * la asistencia queda sellada.
 */

const esquemaConsulta = z.object({
  dni: z
    .string()
    .trim()
    .regex(/^\d{6,12}$/, "El DNI debe tener entre 6 y 12 dígitos"),
});

export async function POST(request: Request) {
  // Reglas de Oro 4 y 5: la identidad Y la sede salen de la sesión del
  // servidor. El proxy ya hace un chequeo optimista, pero no alcanza como
  // autorización. Que la sede no venga en el cuerpo del pedido es lo que impide
  // consultar el padrón de otra sucursal desde esta pantalla.
  const contexto = await contextoDelPanel();

  if (!contexto) {
    return NextResponse.json(
      { error: "Necesitás iniciar sesión para usar la recepción." },
      { status: 401 },
    );
  }

  let cuerpo: unknown;

  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const parseado = esquemaConsulta.safeParse(cuerpo);

  if (!parseado.success) {
    return NextResponse.json(
      { error: parseado.error.issues[0]?.message ?? "DNI inválido." },
      { status: 400 },
    );
  }

  const resultado = await evaluarIngresoPorDni(
    parseado.data.dni,
    contexto.sedeId,
  );

  return NextResponse.json(resultado);
}
