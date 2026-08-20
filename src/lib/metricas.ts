import { TZDate } from "@date-fns/tz";
import { endOfMonth, startOfDay, startOfMonth } from "date-fns";

import { ZONA_HORARIA, type EstadoCuota } from "./cuota";
import { prisma } from "./prisma";
import { listarSocios, type SocioConCuota } from "./socios";

/**
 * Métricas del dashboard del dueño.
 *
 * Todos los contadores de cuota son DERIVADOS: se calculan clasificando a los
 * socios con `calcularEstadoCuota`, nunca leyendo un campo guardado. Por eso no
 * pueden quedar desactualizados como pasaba en la planilla.
 */

export interface ResumenDelGimnasio {
  totalSocios: number;
  sociosInactivos: number;
  porEstado: Record<EstadoCuota, number>;
  /** Los que ya deben plata: naranja + rojo, ordenados por antigüedad de deuda. */
  morosos: SocioConCuota[];
  /** Los que entran en período de pago dentro del umbral. */
  porVencer: SocioConCuota[];
  cobrosDelMes: { total: number; cantidad: number };
  asistenciasDeHoy: number;
}

function inicioDelDiaLocal(ahora = new Date()): Date {
  return new Date(startOfDay(new TZDate(ahora, ZONA_HORARIA)).getTime());
}

export async function obtenerResumen(): Promise<ResumenDelGimnasio> {
  const socios = await listarSocios();
  const ahoraLocal = new TZDate(new Date(), ZONA_HORARIA);

  const porEstado: Record<EstadoCuota, number> = {
    ACTIVO: 0,
    PROXIMO_A_VENCER: 0,
    EN_PERIODO_DE_PAGO: 0,
    VENCIDO: 0,
  };

  // Solo se cuentan los socios con la cuenta vigente: alguien dado de baja no
  // es un moroso, es un ex socio.
  const vigentes = socios.filter((socio) => socio.estado === "ACTIVO");

  for (const socio of vigentes) {
    porEstado[socio.cuota.estado] += 1;
  }

  const morosos = vigentes
    .filter((socio) => socio.cuota.debePagar)
    .sort(
      (a, b) => (a.cuota.diasRestantes ?? -Infinity) - (b.cuota.diasRestantes ?? -Infinity),
    );

  const porVencer = vigentes
    .filter((socio) => socio.cuota.estado === "PROXIMO_A_VENCER")
    .sort((a, b) => (a.cuota.diasRestantes ?? 0) - (b.cuota.diasRestantes ?? 0));

  const [cobros, asistenciasDeHoy] = await Promise.all([
    prisma.pago.aggregate({
      where: {
        fecha_pago: {
          gte: new Date(startOfMonth(ahoraLocal).getTime()),
          lte: new Date(endOfMonth(ahoraLocal).getTime()),
        },
      },
      _sum: { monto: true },
      _count: true,
    }),
    prisma.asistencia.count({
      where: { fecha_hora: { gte: inicioDelDiaLocal() } },
    }),
  ]);

  return {
    totalSocios: socios.length,
    sociosInactivos: socios.length - vigentes.length,
    porEstado,
    morosos,
    porVencer,
    cobrosDelMes: {
      total: Number(cobros._sum.monto ?? 0),
      cantidad: cobros._count,
    },
    asistenciasDeHoy,
  };
}
