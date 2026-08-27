import type { Prisma } from "@/generated/prisma/client";
import type { MetodoPago, TipoPase } from "@/generated/prisma/enums";

import { calcularEstadoCuota, type ResultadoCuota } from "./cuota";
import { prisma } from "./prisma";
import { obtenerRutinaActual } from "./rutinas";

/**
 * Consultas de socios para el panel del dueño.
 *
 * El estado de cuota NO se consulta ni se guarda: se trae el vencimiento más
 * lejano de cada socio y se clasifica con `calcularEstadoCuota`, la misma
 * función que usa la puerta. Un solo lugar donde vive la regla.
 */

/** Campos que necesita cualquier listado de socios con su estado de cuota. */
const SELECCION_SOCIO = {
  id: true,
  dni: true,
  nombre: true,
  apellido: true,
  telefono: true,
  email: true,
  estado: true,
  fecha_registro: true,
  password: true,
  sede: { select: { id_sede: true, nombre: true } },
  pagos: {
    orderBy: { fecha_vencimiento: "desc" },
    take: 1,
    select: {
      fecha_vencimiento: true,
      fecha_pago: true,
      monto: true,
      tipo_pase: true,
      metodo_pago: true,
    },
  },
} as const;

/** Último pago del socio. Es lo que se repite al marcar "pagó de nuevo". */
export interface UltimoPago {
  fecha_pago: Date;
  fecha_vencimiento: Date;
  monto: number;
  tipo_pase: TipoPase;
  metodo_pago: MetodoPago;
}

export interface SocioConCuota {
  id: string;
  dni: string;
  nombre: string;
  apellido: string;
  telefono: string | null;
  email: string | null;
  estado: "ACTIVO" | "INACTIVO";
  fecha_registro: Date;
  sede: { id_sede: string; nombre: string };
  tieneClave: boolean;
  cuota: ResultadoCuota;
  ultimoPago: UltimoPago | null;
  /** Cuánto pagó en total desde que es socio. */
  totalFacturado: number;
  cantidadDePagos: number;
}

type SocioCrudo = {
  id: string;
  dni: string;
  nombre: string;
  apellido: string;
  telefono: string | null;
  email: string | null;
  estado: "ACTIVO" | "INACTIVO";
  fecha_registro: Date;
  sede: { id_sede: string; nombre: string };
  password: string | null;
  pagos: {
    fecha_vencimiento: Date;
    fecha_pago: Date;
    monto: Prisma.Decimal;
    tipo_pase: TipoPase;
    metodo_pago: MetodoPago;
  }[];
};

function conCuota(
  socio: SocioCrudo,
  totales?: { total: number; cantidad: number },
): SocioConCuota {
  const { pagos, password, ...resto } = socio;
  const ultimo = pagos.at(0);

  return {
    ...resto,
    tieneClave: password !== null,
    cuota: calcularEstadoCuota(ultimo?.fecha_vencimiento ?? null),
    ultimoPago: ultimo
      ? {
          fecha_pago: ultimo.fecha_pago,
          fecha_vencimiento: ultimo.fecha_vencimiento,
          monto: Number(ultimo.monto),
          tipo_pase: ultimo.tipo_pase,
          metodo_pago: ultimo.metodo_pago,
        }
      : null,
    totalFacturado: totales?.total ?? 0,
    cantidadDePagos: totales?.cantidad ?? 0,
  };
}

/**
 * Trae todos los socios con su estado de cuota ya calculado.
 *
 * A escala del gimnasio (~350 socios) traer todo y clasificar en memoria es más
 * simple y más barato que intentar expresar la regla en SQL, y evita que la
 * regla quede duplicada en dos lados.
 */
export async function listarSocios(busqueda?: string): Promise<SocioConCuota[]> {
  const termino = busqueda?.trim();

  // Los totales van en una query aparte con groupBy en vez de sumar en memoria:
  // traer todos los pagos de todos los socios solo para sumarlos sería tirar
  // miles de filas al servidor de Node al pedo.
  const [socios, totales] = await Promise.all([
    prisma.usuario.findMany({
      where: {
        rol: "CLIENTE",
        ...(termino
          ? {
              OR: [
                { dni: { contains: termino } },
                { nombre: { contains: termino, mode: "insensitive" } },
                { apellido: { contains: termino, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: SELECCION_SOCIO,
      orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
    }),
    prisma.pago.groupBy({
      by: ["usuario_id"],
      _sum: { monto: true },
      _count: { _all: true },
    }),
  ]);

  const porSocio = new Map(
    totales.map((fila) => [
      fila.usuario_id,
      { total: Number(fila._sum.monto ?? 0), cantidad: fila._count._all },
    ]),
  );

  return socios.map((socio) => conCuota(socio, porSocio.get(socio.id)));
}

export async function obtenerSocio(id: string) {
  const socio = await prisma.usuario.findFirst({
    where: { id, rol: "CLIENTE" },
    select: SELECCION_SOCIO,
  });

  if (!socio) {
    return null;
  }

  const pagos = await prisma.pago.findMany({
    where: { usuario_id: id },
    orderBy: { fecha_pago: "desc" },
    select: {
      id_pago: true,
      monto: true,
      fecha_pago: true,
      fecha_vencimiento: true,
      metodo_pago: true,
      tipo_pase: true,
      admin: { select: { nombre: true, apellido: true } },
    },
  });

  const asistencias = await prisma.asistencia.findMany({
    where: { usuario_id: id },
    orderBy: { fecha_hora: "desc" },
    take: 10,
    select: { id_asistencia: true, fecha_hora: true },
  });

  const rutina = await obtenerRutinaActual(id);

  return {
    ...conCuota(socio),
    pagos: pagos.map((pago) => ({ ...pago, monto: Number(pago.monto) })),
    asistencias,
    rutina,
  };
}

export async function listarSedes() {
  return prisma.sede.findMany({
    where: { estado: "ACTIVA" },
    select: { id_sede: true, nombre: true },
    orderBy: { nombre: "asc" },
  });
}
