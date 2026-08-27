import { TZDate } from "@date-fns/tz";
import { endOfDay, startOfDay, subDays } from "date-fns";

import { ZONA_HORARIA } from "./cuota";
import { prisma } from "./prisma";

/**
 * Consulta de la bitácora de ingresos.
 *
 * Regla de Oro 3: acá solo se lee. No hay ni va a haber una función que
 * modifique o borre asistencias — una vez registrada, la fila queda sellada.
 */

export type RangoDeAsistencias = "hoy" | "semana" | "mes";

export interface IngresoRegistrado {
  id_asistencia: string;
  fecha_hora: Date;
  socio: { id: string; nombre: string; apellido: string; dni: string };
}

export interface ResumenDeAsistencias {
  ingresos: IngresoRegistrado[];
  total: number;
  /** Cuántas personas distintas entraron: alguien puede entrar dos veces. */
  sociosDistintos: number;
  /** Se muestran los primeros N; `total` dice cuántos hay de verdad. */
  hayMas: boolean;
}

const TOPE = 200;

const DIAS_HACIA_ATRAS: Record<RangoDeAsistencias, number> = {
  hoy: 0,
  semana: 6,
  mes: 29,
};

/** Los rangos se calculan en hora argentina: "hoy" es el día del gimnasio. */
function desde(rango: RangoDeAsistencias): Date {
  const ahora = new TZDate(new Date(), ZONA_HORARIA);

  return new Date(startOfDay(subDays(ahora, DIAS_HACIA_ATRAS[rango])).getTime());
}

export async function listarAsistencias(
  sedeId: string | null,
  rango: RangoDeAsistencias,
  busqueda?: string,
): Promise<ResumenDeAsistencias> {
  const termino = busqueda?.trim();
  const hasta = new Date(
    endOfDay(new TZDate(new Date(), ZONA_HORARIA)).getTime(),
  );

  const filtro = {
    fecha_hora: { gte: desde(rango), lte: hasta },
    // Por qué puerta entró, no de qué sede es el socio: si a alguien se lo
    // trasladó, sus ingresos viejos siguen contando en la sucursal donde pasó.
    ...(sedeId ? { sede_id: sedeId } : {}),
    ...(termino
      ? {
          usuario: {
            OR: [
              { dni: { contains: termino } },
              { nombre: { contains: termino, mode: "insensitive" as const } },
              { apellido: { contains: termino, mode: "insensitive" as const } },
            ],
          },
        }
      : {}),
  };

  const [ingresos, total, distintos] = await Promise.all([
    prisma.asistencia.findMany({
      where: filtro,
      orderBy: { fecha_hora: "desc" },
      take: TOPE,
      select: {
        id_asistencia: true,
        fecha_hora: true,
        usuario: {
          select: { id: true, nombre: true, apellido: true, dni: true },
        },
      },
    }),
    prisma.asistencia.count({ where: filtro }),
    prisma.asistencia.groupBy({ by: ["usuario_id"], where: filtro }),
  ]);

  return {
    ingresos: ingresos.map(({ usuario, ...ingreso }) => ({
      ...ingreso,
      socio: usuario,
    })),
    total,
    sociosDistintos: distintos.length,
    hayMas: total > TOPE,
  };
}
