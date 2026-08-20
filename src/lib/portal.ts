import { calcularEstadoCuota, mensajeParaSocio } from "./cuota";
import { prisma } from "./prisma";

/**
 * Consulta del portal del socio.
 *
 * Devuelve deliberadamente poco: nombre de pila, estado de cuota y
 * vencimiento. Nada de apellido, teléfono, email, montos ni historial de
 * pagos. Esta consulta es pública (solo pide DNI), así que expone lo mínimo
 * para que el socio sepa si tiene que pagar.
 *
 * Tampoco registra asistencia: consultar la cuota desde casa no es entrar al
 * gimnasio. La bitácora la escribe únicamente la puerta.
 */

export interface ConsultaDeCuota {
  nombre: string;
  estado: ReturnType<typeof calcularEstadoCuota>["estado"];
  mensaje: string;
  fechaVencimiento: string | null;
  debePagar: boolean;
  cuentaDadaDeBaja: boolean;
}

export async function consultarCuotaPorDni(
  dni: string,
): Promise<ConsultaDeCuota | null> {
  const socio = await prisma.usuario.findUnique({
    where: { dni },
    select: {
      nombre: true,
      rol: true,
      estado: true,
      pagos: {
        orderBy: { fecha_vencimiento: "desc" },
        take: 1,
        select: { fecha_vencimiento: true },
      },
    },
  });

  if (!socio || socio.rol !== "CLIENTE") {
    return null;
  }

  const vencimiento = socio.pagos.at(0)?.fecha_vencimiento ?? null;
  const cuota = calcularEstadoCuota(vencimiento);

  return {
    nombre: socio.nombre,
    estado: cuota.estado,
    mensaje: mensajeParaSocio(cuota),
    fechaVencimiento: vencimiento?.toISOString() ?? null,
    debePagar: cuota.debePagar,
    cuentaDadaDeBaja: socio.estado !== "ACTIVO",
  };
}
