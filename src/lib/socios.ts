import { calcularEstadoCuota, type ResultadoCuota } from "./cuota";
import { prisma } from "./prisma";

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
  sede: { select: { id_sede: true, nombre: true } },
  pagos: {
    orderBy: { fecha_vencimiento: "desc" },
    take: 1,
    select: { fecha_vencimiento: true },
  },
} as const;

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
  cuota: ResultadoCuota;
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
  pagos: { fecha_vencimiento: Date }[];
};

function conCuota(socio: SocioCrudo): SocioConCuota {
  const { pagos, ...resto } = socio;

  return {
    ...resto,
    cuota: calcularEstadoCuota(pagos.at(0)?.fecha_vencimiento ?? null),
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

  const socios = await prisma.usuario.findMany({
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
  });

  return socios.map(conCuota);
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

  return {
    ...conCuota(socio),
    pagos: pagos.map((pago) => ({ ...pago, monto: Number(pago.monto) })),
    asistencias,
  };
}

export async function listarSedes() {
  return prisma.sede.findMany({
    where: { estado: "ACTIVA" },
    select: { id_sede: true, nombre: true },
    orderBy: { nombre: "asc" },
  });
}
