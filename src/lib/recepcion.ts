import { calcularEstadoCuota, type EstadoCuota } from "./cuota";
import { prisma } from "./prisma";

/**
 * Lógica de la puerta (CLAUDE.md §4, Regla de Oro 2).
 *
 * Vive en /lib y no en el route handler para que el dashboard y el portal del
 * cliente puedan reusarla sin duplicar la regla.
 */

export type MotivoRechazo =
  | "DNI_NO_REGISTRADO"
  | "CUENTA_INACTIVA"
  | "CUOTA_VENCIDA";

export interface ResultadoIngreso {
  estado: EstadoCuota;
  accesoPermitido: boolean;
  /** Entra, pero ya le corresponde pagar (naranja). */
  debePagar: boolean;
  motivo: MotivoRechazo | null;
  socio: { nombre: string; apellido: string; dni: string } | null;
  /** ISO 8601, o `null` si el socio no tiene ningún pago. */
  fechaVencimiento: string | null;
  diasRestantes: number | null;
  diasDeGraciaRestantes: number | null;
  /** Si se escribió una fila en la bitácora por esta consulta. */
  asistenciaRegistrada: boolean;
}

const RECHAZO_BASE = {
  estado: "VENCIDO",
  accesoPermitido: false,
  debePagar: true,
  fechaVencimiento: null,
  diasRestantes: null,
  diasDeGraciaRestantes: null,
  asistenciaRegistrada: false,
} satisfies Omit<ResultadoIngreso, "motivo" | "socio">;

/**
 * Evalúa si un DNI puede entrar y, si puede, deja la asistencia registrada.
 *
 * La asistencia se escribe SOLO cuando el acceso está permitido: la bitácora es
 * de ingresos, no de consultas. Una vez escrita queda sellada (Regla de Oro 3):
 * en todo el proyecto no hay un solo `asistencia.update` ni `asistencia.delete`.
 */
export async function evaluarIngresoPorDni(
  dni: string,
): Promise<ResultadoIngreso> {
  const usuario = await prisma.usuario.findUnique({
    where: { dni },
    select: {
      id: true,
      dni: true,
      nombre: true,
      apellido: true,
      rol: true,
      estado: true,
      // El vencimiento que vale es el más lejano, no el del último pago
      // cargado: si el admin registra un pago viejo después de uno nuevo, el
      // socio no tiene por qué perder la cobertura que ya pagó.
      pagos: {
        orderBy: { fecha_vencimiento: "desc" },
        take: 1,
        select: { fecha_vencimiento: true },
      },
    },
  });

  // Un DNI que no está en el sistema, o que es de un admin y no de un socio,
  // no habilita el ingreso por la puerta.
  if (!usuario || usuario.rol !== "CLIENTE") {
    return { ...RECHAZO_BASE, motivo: "DNI_NO_REGISTRADO", socio: null };
  }

  const socio = {
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    dni: usuario.dni,
  };

  // Cuenta dada de baja: no entra aunque le quede cobertura paga.
  if (usuario.estado !== "ACTIVO") {
    return { ...RECHAZO_BASE, motivo: "CUENTA_INACTIVA", socio };
  }

  const vencimiento = usuario.pagos.at(0)?.fecha_vencimiento ?? null;
  const cuota = calcularEstadoCuota(vencimiento);

  if (!cuota.accesoPermitido) {
    return {
      ...RECHAZO_BASE,
      estado: cuota.estado,
      motivo: "CUOTA_VENCIDA",
      socio,
      fechaVencimiento: vencimiento?.toISOString() ?? null,
      diasRestantes: cuota.diasRestantes,
    };
  }

  await prisma.asistencia.create({
    data: { usuario_id: usuario.id, metodo_registro: "DNI_MANUAL" },
  });

  return {
    estado: cuota.estado,
    accesoPermitido: true,
    debePagar: cuota.debePagar,
    motivo: null,
    socio,
    fechaVencimiento: vencimiento?.toISOString() ?? null,
    diasRestantes: cuota.diasRestantes,
    diasDeGraciaRestantes: cuota.diasDeGraciaRestantes,
    asistenciaRegistrada: true,
  };
}
