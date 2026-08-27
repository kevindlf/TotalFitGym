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

/**
 * @param sedeId  La sucursal a medir. `null` = la cadena entera, y eso solo lo
 *                pide el dueño: un admin siempre pasa su propia sede.
 */
export async function obtenerResumen(
  sedeId: string | null,
): Promise<ResumenDelGimnasio> {
  const socios = await listarSocios(sedeId);
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
    // La caja SÍ se filtra por dónde se cobró (`Pago.sede_id`) y no por la sede
    // actual del socio: la plata quedó donde entró, aunque después la persona
    // se haya trasladado.
    prisma.pago.aggregate({
      where: {
        fecha_pago: {
          gte: new Date(startOfMonth(ahoraLocal).getTime()),
          lte: new Date(endOfMonth(ahoraLocal).getTime()),
        },
        ...(sedeId ? { sede_id: sedeId } : {}),
      },
      _sum: { monto: true },
      _count: true,
    }),
    prisma.asistencia.count({
      where: {
        fecha_hora: { gte: inicioDelDiaLocal() },
        ...(sedeId ? { sede_id: sedeId } : {}),
      },
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

export interface ResumenDeSede {
  id_sede: string;
  nombre: string;
  socios: number;
  morosos: number;
  cobradoEsteMes: number;
}

/**
 * Una línea por sucursal, para el dashboard del dueño.
 *
 * Reusa `obtenerResumen` en vez de escribir otra consulta agregada: así la
 * definición de "moroso" sigue viviendo en un solo lugar y no puede quedar
 * distinta entre la pantalla de una sede y la de la cadena.
 */
export async function obtenerResumenPorSede(): Promise<ResumenDeSede[]> {
  const sedes = await prisma.sede.findMany({
    where: { estado: "ACTIVA" },
    select: { id_sede: true, nombre: true },
    orderBy: { nombre: "asc" },
  });

  return Promise.all(
    sedes.map(async (sede) => {
      const resumen = await obtenerResumen(sede.id_sede);

      return {
        id_sede: sede.id_sede,
        nombre: sede.nombre,
        socios: resumen.totalSocios,
        morosos: resumen.morosos.length,
        cobradoEsteMes: resumen.cobrosDelMes.total,
      };
    }),
  );
}
