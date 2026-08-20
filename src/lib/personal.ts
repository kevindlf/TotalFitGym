import { prisma } from "./prisma";

/**
 * El "personal" son los Usuario con rol ADMIN: el dueño y los profes/empleados
 * que cobran. Mismo modelo que los socios, distinto rol (CLAUDE.md §3).
 */

export interface MiembroDelPersonal {
  id: string;
  dni: string;
  nombre: string;
  apellido: string;
  email: string | null;
  telefono: string | null;
  estado: "ACTIVO" | "INACTIVO";
  fecha_registro: Date;
  sede: { nombre: string };
  /** Cuántos pagos cobró. Sirve para saber si está trabajando de verdad. */
  pagosCobrados: number;
}

export async function listarPersonal(): Promise<MiembroDelPersonal[]> {
  const personal = await prisma.usuario.findMany({
    where: { rol: "ADMIN" },
    select: {
      id: true,
      dni: true,
      nombre: true,
      apellido: true,
      email: true,
      telefono: true,
      estado: true,
      fecha_registro: true,
      sede: { select: { nombre: true } },
      _count: { select: { pagos_registrados: true } },
    },
    orderBy: [{ estado: "asc" }, { apellido: "asc" }, { nombre: "asc" }],
  });

  return personal.map(({ _count, ...miembro }) => ({
    ...miembro,
    pagosCobrados: _count.pagos_registrados,
  }));
}

/** Cuántos admins pueden loguearse hoy. Se usa para no dejar al gimnasio afuera. */
export function contarAdminsActivos() {
  return prisma.usuario.count({
    where: { rol: "ADMIN", estado: "ACTIVO", password: { not: null } },
  });
}
