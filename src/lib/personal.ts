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

export async function listarPersonal(
  sedeId: string | null,
): Promise<MiembroDelPersonal[]> {
  const personal = await prisma.usuario.findMany({
    where: {
      rol: { in: ["ADMIN", "DUENIO"] },
      ...(sedeId ? { sede_id: sedeId } : {}),
    },
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

/**
 * Cuántos admins de UNA sede pueden loguearse hoy.
 *
 * Se cuenta por sede y no en toda la cadena: si fuera global, se podría dar de
 * baja al último admin de San Martín porque quedan tres en Godoy Cruz, y esa
 * sucursal se quedaría sin nadie que pueda entrar al panel.
 *
 * El dueño no cuenta: puede operar cualquier sede, así que su existencia no
 * garantiza que esta sucursal tenga quien la atienda día a día.
 */
export function contarAdminsActivos(sedeId: string) {
  return prisma.usuario.count({
    where: {
      rol: "ADMIN",
      sede_id: sedeId,
      estado: "ACTIVO",
      password: { not: null },
    },
  });
}
