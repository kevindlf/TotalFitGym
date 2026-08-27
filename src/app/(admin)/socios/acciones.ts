"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { hash } from "bcryptjs";

import { formatearFecha } from "@/lib/formato";
import { calcularFechaVencimiento } from "@/lib/pases";
import { prisma } from "@/lib/prisma";
import { borrarRutina, guardarRutina } from "@/lib/rutinas";
import { exigirPanel } from "@/lib/sede";

/**
 * `traslado` aparece cuando el DNI que se quiso dar de alta ya existe en otra
 * sucursal. No es un error: es la persona que se mudó de barrio, y el
 * formulario le ofrece al profe traerla a su sede.
 */
export type EstadoFormulario = {
  error?: string;
  ok?: string;
  traslado?: {
    usuarioId: string;
    nombre: string;
    apellido: string;
    dni: string;
    sedeNombre: string;
  };
};

const esquemaSocio = z.object({
  dni: z
    .string()
    .trim()
    .regex(/^\d{6,12}$/, "El DNI debe tener entre 6 y 12 dígitos."),
  nombre: z.string().trim().min(1, "Falta el nombre."),
  apellido: z.string().trim().min(1, "Falta el apellido."),
  telefono: z.string().trim().max(30).optional(),
  email: z
    .union([z.literal(""), z.email("El email no es válido.")])
    .optional(),
});

// `sede_id` NO está en el esquema a propósito: no es un dato del formulario.
// Sale de la sesión (Regla de Oro 5). Si viajara en el form, un profe podría
// dar de alta un socio en la sucursal de al lado editando el HTML.

export async function crearSocio(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const ctx = await exigirPanel();

  const parseado = esquemaSocio.safeParse({
    dni: formData.get("dni"),
    nombre: formData.get("nombre"),
    apellido: formData.get("apellido"),
    telefono: formData.get("telefono") ?? undefined,
    email: formData.get("email") ?? undefined,
  });

  if (!parseado.success) {
    return { error: parseado.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const datos = parseado.data;

  // Regla de Oro 1: el DNI es único en TODA la cadena, no por sede. La base
  // tiene el índice unique igual, pero acá se distinguen tres situaciones que
  // para el profe son muy distintas entre sí.
  const yaExiste = await prisma.usuario.findUnique({
    where: { dni: datos.dni },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      rol: true,
      sede_id: true,
      sede: { select: { nombre: true } },
    },
  });

  if (yaExiste && yaExiste.rol !== "CLIENTE") {
    return {
      error: `El DNI ${datos.dni} pertenece a una cuenta del personal.`,
    };
  }

  if (yaExiste && yaExiste.sede_id === ctx.sedeId) {
    return {
      error: `Ya hay una ficha con el DNI ${datos.dni}: ${yaExiste.apellido}, ${yaExiste.nombre}.`,
    };
  }

  if (yaExiste) {
    // Está en otra sucursal. Se devuelve el nombre a propósito: el profe tiene
    // a la persona parada enfrente y necesita confirmar que es la misma antes
    // de traerla. Sí, eso significa que un empleado que tipea un DNI al azar
    // aprende un nombre y una sede — es información que el personal ya maneja
    // en el mostrador, y sin ella el traslado no se puede confirmar.
    return {
      traslado: {
        usuarioId: yaExiste.id,
        nombre: yaExiste.nombre,
        apellido: yaExiste.apellido,
        dni: datos.dni,
        sedeNombre: yaExiste.sede.nombre,
      },
    };
  }

  const socio = await prisma.usuario.create({
    data: {
      dni: datos.dni,
      nombre: datos.nombre,
      apellido: datos.apellido,
      telefono: datos.telefono || null,
      email: datos.email || null,
      sede_id: ctx.sedeId,
      rol: "CLIENTE",
      estado: "ACTIVO",
    },
    select: { id: true },
  });

  // Lo normal es que el socio pague el mismo día que se da de alta, así que el
  // formulario deja cargar el primer pago acá y evitar la segunda pantalla. Si
  // se deja el monto vacío, el socio queda creado sin pagos y en rojo hasta que
  // se le cobre.
  const monto = formData.get("monto");

  if (monto) {
    const pago = esquemaPago.safeParse({
      usuario_id: socio.id,
      monto,
      fecha_pago: undefined,
      tipo_pase: formData.get("tipo_pase"),
      metodo_pago: formData.get("metodo_pago"),
    });

    if (pago.success) {
      const fechaPago = new Date();

      await prisma.pago.create({
        data: {
          usuario_id: socio.id,
          monto: pago.data.monto.toFixed(2),
          fecha_pago: fechaPago,
          fecha_vencimiento: calcularFechaVencimiento(
            fechaPago,
            pago.data.tipo_pase,
          ),
          tipo_pase: pago.data.tipo_pase,
          metodo_pago: pago.data.metodo_pago,
          registrado_por: ctx.usuarioId,
          sede_id: ctx.sedeId,
        },
      });
    }
  }

  revalidatePath("/socios");
  revalidatePath("/dashboard");
  redirect(`/socios/${socio.id}`);
}

const esquemaPago = z.object({
  usuario_id: z.string().trim().min(1),
  monto: z.coerce
    .number()
    .positive("El monto tiene que ser mayor a cero.")
    .max(99_999_999, "Ese monto es demasiado grande."),
  // Opcional: cuando se cobra desde la planilla el pago es de hoy y no tiene
  // sentido hacer elegir la fecha. En la ficha sí se puede cargar una vieja.
  fecha_pago: z.coerce.date("La fecha de pago no es válida.").optional(),
  tipo_pase: z.enum(["MEDIO", "LIBRE"]),
  metodo_pago: z.enum(["EFECTIVO", "TRANSFERENCIA", "QR", "MERCADO_PAGO"]),
});

export async function registrarPago(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const ctx = await exigirPanel();

  const fechaEnviada = formData.get("fecha_pago");

  const parseado = esquemaPago.safeParse({
    usuario_id: formData.get("usuario_id"),
    monto: formData.get("monto"),
    fecha_pago: fechaEnviada || undefined,
    tipo_pase: formData.get("tipo_pase"),
    metodo_pago: formData.get("metodo_pago"),
  });

  if (!parseado.success) {
    return { error: parseado.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const datos = parseado.data;

  // El mismo mensaje que si no existiera: a un admin de otra sucursal no se le
  // confirma que la ficha existe.
  const socio = await prisma.usuario.findFirst({
    where: { id: datos.usuario_id, rol: "CLIENTE", sede_id: ctx.sedeId },
    select: { id: true },
  });

  if (!socio) {
    return { error: "Ese socio no existe." };
  }

  const fechaPago = datos.fecha_pago ?? new Date();

  // El vencimiento se calcula del lado del servidor a partir del tipo de pase.
  // No se acepta como campo del formulario: si no, cualquiera podría enviar un
  // vencimiento arbitrario.
  const fechaVencimiento = calcularFechaVencimiento(fechaPago, datos.tipo_pase);

  await prisma.pago.create({
    data: {
      usuario_id: socio.id,
      monto: datos.monto.toFixed(2),
      fecha_pago: fechaPago,
      fecha_vencimiento: fechaVencimiento,
      tipo_pase: datos.tipo_pase,
      metodo_pago: datos.metodo_pago,
      // Regla de Oro 4: el admin logueado, del servidor.
      registrado_por: ctx.usuarioId,
      // Regla de Oro 5: dónde se cobró queda sellado. Si mañana el socio se
      // traslada, esta plata sigue contando en la caja de esta sucursal.
      sede_id: ctx.sedeId,
    },
  });

  revalidatePath(`/socios/${socio.id}`);
  revalidatePath("/socios");
  revalidatePath("/dashboard");

  return {
    ok: `Pago registrado. La cuota vence el ${formatearFecha(fechaVencimiento)}.`,
  };
}

/**
 * Registra que el socio volvió a pagar, repitiendo su último pago.
 *
 * Es el atajo de la planilla: el dueño ve el rojo, hace un click y la fila se
 * pone en verde, sin volver a tipear monto, pase ni método. Solo sirve si ya
 * hay un pago anterior del que copiar los datos; para el primer pago hay que
 * cargarlo a mano una vez.
 *
 * El vencimiento y el admin los sigue poniendo el servidor (Reglas 2 y 4).
 */
export async function repetirUltimoPago(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const ctx = await exigirPanel();

  const parseado = z
    .object({ usuario_id: z.string().trim().min(1) })
    .safeParse({ usuario_id: formData.get("usuario_id") });

  if (!parseado.success) {
    return { error: "Falta el socio." };
  }

  const usuarioId = parseado.data.usuario_id;

  const ultimo = await prisma.pago.findFirst({
    where: {
      usuario_id: usuarioId,
      usuario: { rol: "CLIENTE", sede_id: ctx.sedeId },
    },
    orderBy: { fecha_vencimiento: "desc" },
    select: { monto: true, tipo_pase: true, metodo_pago: true },
  });

  if (!ultimo) {
    return {
      error:
        "Este socio no tiene ningún pago anterior. Cargá el primero desde su ficha.",
    };
  }

  const fechaPago = new Date();
  const fechaVencimiento = calcularFechaVencimiento(fechaPago, ultimo.tipo_pase);

  await prisma.pago.create({
    data: {
      usuario_id: usuarioId,
      monto: ultimo.monto,
      fecha_pago: fechaPago,
      fecha_vencimiento: fechaVencimiento,
      tipo_pase: ultimo.tipo_pase,
      metodo_pago: ultimo.metodo_pago,
      registrado_por: ctx.usuarioId,
      sede_id: ctx.sedeId,
    },
  });

  revalidatePath("/socios");
  revalidatePath("/dashboard");
  revalidatePath(`/socios/${usuarioId}`);

  return { ok: `Pagado. Vence el ${formatearFecha(fechaVencimiento)}.` };
}

export interface PagoDelHistorial {
  id_pago: string;
  monto: number;
  fecha_pago: string;
  fecha_vencimiento: string;
  tipo_pase: string;
  metodo_pago: string;
  cobro: string;
}

/**
 * Historial de pagos de un socio, para desplegar dentro de la planilla.
 *
 * Se carga a pedido y no junto con el listado: con 349 socios y un pago por
 * mes cada uno, traer todo de una serían miles de filas viajando al navegador
 * para mostrar, casi siempre, ninguna.
 */
export async function obtenerHistorialDePagos(
  usuarioId: string,
): Promise<PagoDelHistorial[]> {
  const ctx = await exigirPanel();

  // Se filtra por la sede del SOCIO, no por la del pago: es su historial
  // completo. Lo que la sede controla es si este admin puede verlo.
  const pagos = await prisma.pago.findMany({
    where: {
      usuario_id: usuarioId,
      usuario: { rol: "CLIENTE", sede_id: ctx.sedeId },
    },
    orderBy: { fecha_pago: "desc" },
    select: {
      id_pago: true,
      monto: true,
      fecha_pago: true,
      fecha_vencimiento: true,
      tipo_pase: true,
      metodo_pago: true,
      admin: { select: { nombre: true, apellido: true } },
    },
  });

  return pagos.map((pago) => ({
    id_pago: pago.id_pago,
    monto: Number(pago.monto),
    fecha_pago: pago.fecha_pago.toISOString(),
    fecha_vencimiento: pago.fecha_vencimiento.toISOString(),
    tipo_pase: pago.tipo_pase,
    metodo_pago: pago.metodo_pago,
    cobro: `${pago.admin.nombre} ${pago.admin.apellido}`,
  }));
}

const esquemaEdicion = esquemaSocio.extend({
  usuario_id: z.string().trim().min(1),
});

/**
 * Corrige los datos de un socio ya cargado.
 *
 * El DNI se puede cambiar a propósito: los socios que vienen de la planilla
 * entran con un DNI provisorio, y el momento de corregirlo es cuando la
 * persona aparece por la puerta. Sigue siendo único (Regla de Oro 1), así que
 * se chequea contra el resto antes de guardar.
 *
 * No se toca la clave ni el estado: cada uno tiene su propia acción, para que
 * un error tipeando el teléfono no pueda dejar a alguien afuera del sistema.
 */
export async function editarSocio(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const ctx = await exigirPanel();

  const parseado = esquemaEdicion.safeParse({
    usuario_id: formData.get("usuario_id"),
    dni: formData.get("dni"),
    nombre: formData.get("nombre"),
    apellido: formData.get("apellido"),
    telefono: formData.get("telefono") ?? undefined,
    email: formData.get("email") ?? undefined,
  });

  if (!parseado.success) {
    return { error: parseado.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const datos = parseado.data;

  const socio = await prisma.usuario.findFirst({
    where: { id: datos.usuario_id, rol: "CLIENTE", sede_id: ctx.sedeId },
    select: { id: true, dni: true },
  });

  if (!socio) {
    return { error: "Ese socio no existe." };
  }

  // Regla de Oro 1: si cambió el DNI, no puede chocar con el de otra persona.
  if (datos.dni !== socio.dni) {
    const ocupado = await prisma.usuario.findUnique({
      where: { dni: datos.dni },
      select: { nombre: true, apellido: true },
    });

    if (ocupado) {
      return {
        error: `El DNI ${datos.dni} ya lo tiene ${ocupado.apellido}, ${ocupado.nombre}.`,
      };
    }
  }

  await prisma.usuario.update({
    where: { id: socio.id },
    data: {
      dni: datos.dni,
      nombre: datos.nombre,
      apellido: datos.apellido,
      telefono: datos.telefono || null,
      email: datos.email || null,
      // La sede NO se edita acá. Cambiarla es mudar a una persona de sucursal,
      // y eso tiene su propia acción (`trasladarSocio`) con su confirmación.
    },
  });

  revalidatePath(`/socios/${socio.id}`);
  revalidatePath("/socios");
  redirect(`/socios/${socio.id}`);
}

const esquemaClaveSocio = z.object({
  usuario_id: z.string().trim().min(1),
  clave: z
    .string()
    .min(8, "La clave necesita al menos 8 caracteres."),
});

/**
 * Reinicia la clave de un socio que se la olvidó.
 *
 * El socio se la crea solo desde su pantalla verificando el teléfono, así que
 * esto es solo la salida de emergencia: alguien que cambió de número o que se
 * la olvidó y viene al mostrador.
 */
export async function reiniciarClaveDelSocio(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const ctx = await exigirPanel();

  const parseado = esquemaClaveSocio.safeParse({
    usuario_id: formData.get("usuario_id"),
    clave: formData.get("clave"),
  });

  if (!parseado.success) {
    return { error: parseado.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const socio = await prisma.usuario.findFirst({
    where: {
      id: parseado.data.usuario_id,
      rol: "CLIENTE",
      sede_id: ctx.sedeId,
    },
    select: { id: true, nombre: true },
  });

  if (!socio) {
    return { error: "Ese socio no existe." };
  }

  await prisma.usuario.update({
    where: { id: socio.id },
    data: { password: await hash(parseado.data.clave, 12) },
  });

  revalidatePath(`/socios/${socio.id}`);

  return { ok: `Clave de ${socio.nombre} actualizada. Decísela en persona.` };
}

export async function cambiarEstadoSocio(
  usuarioId: string,
  nuevoEstado: "ACTIVO" | "INACTIVO",
) {
  const ctx = await exigirPanel();

  // `updateMany` y no `update`: permite meter la sede en el `where`. Con
  // `update` habría que buscar primero y el chequeo quedaría en dos pasos.
  await prisma.usuario.updateMany({
    where: { id: usuarioId, rol: "CLIENTE", sede_id: ctx.sedeId },
    data: { estado: nuevoEstado },
  });

  revalidatePath(`/socios/${usuarioId}`);
  revalidatePath("/socios");
  revalidatePath("/dashboard");
}

// =============================================================================
// Rutinas
// =============================================================================

/**
 * Sube la rutina de un socio.
 *
 * El archivo se valida por su contenido en `validarArchivoDeRutina` y el profe
 * que la sube sale de la sesión, nunca del formulario: es la Regla de Oro 4
 * aplicada a rutinas.
 *
 * Cada subida deja una fila nueva; la anterior queda como histórico.
 */
export async function subirRutina(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const ctx = await exigirPanel();

  const usuarioId = formData.get("usuario_id");
  const archivo = formData.get("archivo");

  if (typeof usuarioId !== "string" || !usuarioId) {
    return { error: "Falta el socio." };
  }

  if (!(archivo instanceof File) || archivo.size === 0) {
    return { error: "Elegí un archivo." };
  }

  const socio = await prisma.usuario.findFirst({
    where: { id: usuarioId, rol: "CLIENTE", sede_id: ctx.sedeId },
    select: { id: true, nombre: true },
  });

  if (!socio) {
    return { error: "Ese socio no existe." };
  }

  const resultado = await guardarRutina({
    usuarioId: socio.id,
    adminId: ctx.usuarioId,
    nombre: archivo.name,
    bytes: new Uint8Array(await archivo.arrayBuffer()),
  });

  if (!resultado.ok) {
    return { error: resultado.error };
  }

  revalidatePath(`/socios/${socio.id}`);
  revalidatePath("/mi-cuenta");

  return { ok: `Rutina de ${socio.nombre} actualizada.` };
}

/** Borra la rutina actual de un socio. El histórico anterior no se toca. */
export async function eliminarRutina(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const ctx = await exigirPanel();

  const idRutina = formData.get("id_rutina");
  const usuarioId = formData.get("usuario_id");

  if (typeof idRutina !== "string" || typeof usuarioId !== "string") {
    return { error: "Datos inválidos." };
  }

  const suya = await prisma.usuario.findFirst({
    where: { id: usuarioId, rol: "CLIENTE", sede_id: ctx.sedeId },
    select: { id: true },
  });

  if (!suya) {
    return { error: "Ese socio no existe." };
  }

  const borrada = await borrarRutina(idRutina);

  if (!borrada) {
    return { error: "Esa rutina ya no existe." };
  }

  revalidatePath(`/socios/${usuarioId}`);
  revalidatePath("/mi-cuenta");

  return { ok: "Rutina eliminada." };
}

// =============================================================================
// Traslado entre sedes
// =============================================================================

/**
 * Trae a un socio de otra sucursal a la sede en la que se está trabajando.
 *
 * Es el caso del que se mudó de barrio. Se dispara desde el alta, cuando el DNI
 * tipeado ya existe en otra sede: el sistema muestra de quién es y el profe
 * confirma que es la misma persona que tiene enfrente.
 *
 * Solo se puede traer HACIA la propia sede, nunca mandar a alguien a otra. Un
 * profe no puede sacar un socio del padrón ajeno sin que esa sucursal se entere;
 * para traerlo, en cambio, la persona está ahí. El dueño hace cualquier traslado
 * porque puede cambiar de sede activa y quedar parado en la que recibe.
 *
 * Los pagos y las asistencias viejos NO se tocan: conservan su `sede_id`, así
 * que la caja pasada de la sucursal anterior queda como estaba. Lo único que se
 * muda es la persona.
 */
export async function trasladarSocio(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const ctx = await exigirPanel();

  const usuarioId = formData.get("usuario_id");

  if (typeof usuarioId !== "string" || !usuarioId) {
    return { error: "Falta el socio." };
  }

  const socio = await prisma.usuario.findFirst({
    where: { id: usuarioId, rol: "CLIENTE" },
    select: { id: true, nombre: true, apellido: true, sede_id: true },
  });

  if (!socio) {
    return { error: "Ese socio no existe." };
  }

  if (socio.sede_id === ctx.sedeId) {
    return { error: `${socio.nombre} ya es socio de esta sede.` };
  }

  await prisma.usuario.update({
    where: { id: socio.id },
    data: { sede_id: ctx.sedeId },
  });

  revalidatePath("/socios");
  revalidatePath("/dashboard");
  redirect(`/socios/${socio.id}`);
}
