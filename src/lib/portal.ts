import { calcularEstadoCuota, mensajeParaSocio } from "./cuota";
import { prisma } from "./prisma";

/**
 * Datos del portal del socio.
 *
 * Todo lo que sale de acá lo va a ver alguien que se identificó solo con su
 * DNI, así que se expone lo justo: su propia situación de cuota y su propio
 * historial. Nada de otros socios, nada de datos internos del gimnasio.
 *
 * Nunca registra asistencia: consultar la cuota desde el celular no es entrar
 * al gimnasio. La bitácora la escribe únicamente la puerta.
 */

export interface ConsultaDeCuota {
  nombre: string;
  estado: ReturnType<typeof calcularEstadoCuota>["estado"];
  mensaje: string;
  fechaVencimiento: string | null;
  debePagar: boolean;
  cuentaDadaDeBaja: boolean;
}

/** Busca al socio por DNI y devuelve su id, para abrirle la sesión. */
export async function buscarSocioPorDni(
  dni: string,
): Promise<{ id: string } | null> {
  const socio = await prisma.usuario.findUnique({
    where: { dni },
    select: { id: true, rol: true },
  });

  return socio && socio.rol === "CLIENTE" ? { id: socio.id } : null;
}

export interface DetalleDelSocio {
  nombre: string;
  apellido: string;
  dni: string;
  sede: string;
  socioDesde: string;
  cuota: ConsultaDeCuota;
  diasRestantes: number | null;
  planActual: string | null;
  pagos: {
    id_pago: string;
    monto: number;
    fecha_pago: string;
    fecha_vencimiento: string;
    tipo_pase: string;
  }[];
  ultimosIngresos: string[];
  totalIngresos: number;
}

export async function obtenerDetalleDelSocio(
  usuarioId: string,
): Promise<DetalleDelSocio | null> {
  const socio = await prisma.usuario.findFirst({
    where: { id: usuarioId, rol: "CLIENTE" },
    select: {
      nombre: true,
      apellido: true,
      dni: true,
      estado: true,
      fecha_registro: true,
      sede: { select: { nombre: true } },
    },
  });

  if (!socio) {
    return null;
  }

  const [pagos, ingresos, totalIngresos] = await Promise.all([
    prisma.pago.findMany({
      where: { usuario_id: usuarioId },
      orderBy: { fecha_pago: "desc" },
      take: 12,
      select: {
        id_pago: true,
        monto: true,
        fecha_pago: true,
        fecha_vencimiento: true,
        tipo_pase: true,
      },
    }),
    prisma.asistencia.findMany({
      where: { usuario_id: usuarioId },
      orderBy: { fecha_hora: "desc" },
      take: 8,
      select: { fecha_hora: true },
    }),
    prisma.asistencia.count({ where: { usuario_id: usuarioId } }),
  ]);

  // El vencimiento que vale es el más lejano, no el del último pago cargado.
  const vencimientoMasLejano = await prisma.pago.findFirst({
    where: { usuario_id: usuarioId },
    orderBy: { fecha_vencimiento: "desc" },
    select: { fecha_vencimiento: true },
  });

  const estadoCuota = calcularEstadoCuota(
    vencimientoMasLejano?.fecha_vencimiento ?? null,
  );

  return {
    nombre: socio.nombre,
    apellido: socio.apellido,
    dni: socio.dni,
    sede: socio.sede.nombre,
    socioDesde: socio.fecha_registro.toISOString(),
    cuota: {
      nombre: socio.nombre,
      estado: estadoCuota.estado,
      mensaje: mensajeParaSocio(estadoCuota),
      fechaVencimiento:
        estadoCuota.fechaVencimiento?.toISOString() ?? null,
      debePagar: estadoCuota.debePagar,
      cuentaDadaDeBaja: socio.estado !== "ACTIVO",
    },
    diasRestantes: estadoCuota.diasRestantes,
    planActual: pagos.at(0)?.tipo_pase ?? null,
    pagos: pagos.map((pago) => ({
      id_pago: pago.id_pago,
      monto: Number(pago.monto),
      fecha_pago: pago.fecha_pago.toISOString(),
      fecha_vencimiento: pago.fecha_vencimiento.toISOString(),
      tipo_pase: pago.tipo_pase,
    })),
    ultimosIngresos: ingresos.map((ingreso) =>
      ingreso.fecha_hora.toISOString(),
    ),
    totalIngresos,
  };
}
