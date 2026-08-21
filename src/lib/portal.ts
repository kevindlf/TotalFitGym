import { compare, hash } from "bcryptjs";

import { calcularEstadoCuota, mensajeParaSocio } from "./cuota";
import { prisma } from "./prisma";

/** Mismas rondas que usa el personal. */
const RONDAS_BCRYPT = 12;

/** Hash descartable, para que un DNI inexistente tarde lo mismo que uno real. */
const HASH_INEXISTENTE =
  "$2b$12$eB8Q1Ck2u0Yf7Y6ZK1t1jePeVKf9m0z1sVJqk0aQ6HxJqfQyRfC2i";

export const LARGO_MINIMO_CLAVE = 8;

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
): Promise<{ id: string; tieneClave: boolean } | null> {
  const socio = await prisma.usuario.findUnique({
    where: { dni },
    select: { id: true, rol: true, password: true },
  });

  return socio && socio.rol === "CLIENTE"
    ? { id: socio.id, tieneClave: socio.password !== null }
    : null;
}

/**
 * Verifica la clave de un socio.
 *
 * Siempre compara contra un hash, incluso cuando el socio no existe o no tiene
 * clave: si no, un DNI sin clave respondería mucho más rápido y esa diferencia
 * de tiempo permite averiguar quién está registrado.
 */
export async function verificarClaveDelSocio(
  dni: string,
  clave: string,
): Promise<{ id: string } | null> {
  const socio = await prisma.usuario.findUnique({
    where: { dni },
    select: { id: true, rol: true, password: true },
  });

  const puedeIntentar =
    socio !== null && socio.rol === "CLIENTE" && socio.password !== null;

  const claveOk = await compare(
    clave,
    puedeIntentar ? socio.password! : HASH_INEXISTENTE,
  );

  return puedeIntentar && claveOk ? { id: socio.id } : null;
}

/**
 * Crea la clave de un socio que todavía no tiene, verificando los últimos
 * cuatro dígitos de su teléfono.
 *
 * El teléfono funciona como el segundo dato que un desconocido no tiene: con
 * solo el DNI, cualquiera podría adelantarse y quedarse con la cuenta ajena.
 *
 * Si el socio no tiene teléfono cargado no hay con qué verificarlo, así que se
 * lo manda a recepción en vez de dejar la puerta abierta.
 */
export async function crearClaveDelSocio(
  dni: string,
  ultimosCuatro: string,
  claveNueva: string,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const socio = await prisma.usuario.findUnique({
    where: { dni },
    select: { id: true, rol: true, password: true, telefono: true },
  });

  if (!socio || socio.rol !== "CLIENTE") {
    return { ok: false, error: "No encontramos ese DNI." };
  }

  if (socio.password !== null) {
    return {
      ok: false,
      error:
        "Ya tenés una clave. Si no la recordás, pedile a un profe que te la reinicie.",
    };
  }

  const soloDigitos = (socio.telefono ?? "").replace(/\D/g, "");

  if (soloDigitos.length < 4) {
    return {
      ok: false,
      error:
        "No tenemos tu teléfono cargado, así que no podemos verificar que seas vos. Acercate a recepción.",
    };
  }

  if (soloDigitos.slice(-4) !== ultimosCuatro) {
    return {
      ok: false,
      error: "Esos números no coinciden con el teléfono que tenemos tuyo.",
    };
  }

  await prisma.usuario.update({
    where: { id: socio.id },
    data: { password: await hash(claveNueva, RONDAS_BCRYPT) },
  });

  return { ok: true, id: socio.id };
}

export interface DetalleDelSocio {
  nombre: string;
  apellido: string;
  dni: string;
  sede: string;
  socioDesde: string;
  tieneClave: boolean;
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
      password: true,
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
    tieneClave: socio.password !== null,
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
