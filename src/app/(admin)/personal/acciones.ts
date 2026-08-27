"use server";

import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { contarAdminsActivos } from "@/lib/personal";
import { prisma } from "@/lib/prisma";
import { exigirPanel } from "@/lib/sede";

export type EstadoFormulario = { error?: string; ok?: string };

/** Rondas de bcrypt. Mismo valor que el seed. */
const RONDAS = 12;

const LARGO_MINIMO = 8;

const esquemaAlta = z.object({
  dni: z
    .string()
    .trim()
    .regex(/^\d{6,12}$/, "El DNI debe tener entre 6 y 12 dígitos."),
  nombre: z.string().trim().min(1, "Falta el nombre."),
  apellido: z.string().trim().min(1, "Falta el apellido."),
  email: z.union([z.literal(""), z.email("El email no es válido.")]).optional(),
  telefono: z.string().trim().max(30).optional(),
  /**
   * Solo el dueño lo manda: es el único que puede dar de alta personal en una
   * sucursal que no sea la propia. Para un admin se ignora y se usa el de su
   * sesión, así no puede meter un profe en el gimnasio de al lado.
   */
  sede_id: z.string().trim().optional(),
  password: z
    .string()
    .min(LARGO_MINIMO, `La contraseña necesita al menos ${LARGO_MINIMO} caracteres.`),
});

/**
 * Da de alta a un profe o empleado.
 *
 * Queda con rol ADMIN, o sea que puede cobrar y todo pago que registre va a
 * quedar a su nombre (Regla de Oro 4). La contraseña es obligatoria: un ADMIN
 * sin contraseña no podría entrar, y el modelo la permite nula solo por los
 * socios.
 */
export async function crearMiembroDelPersonal(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const ctx = await exigirPanel();

  const parseado = esquemaAlta.safeParse({
    dni: formData.get("dni"),
    nombre: formData.get("nombre"),
    apellido: formData.get("apellido"),
    email: formData.get("email") ?? undefined,
    telefono: formData.get("telefono") ?? undefined,
    sede_id: formData.get("sede_id"),
    password: formData.get("password"),
  });

  if (!parseado.success) {
    return { error: parseado.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const datos = parseado.data;

  // Un admin queda clavado a su sede; el dueño puede elegir a cuál da de alta.
  const sedeDestino =
    ctx.esDuenio && datos.sede_id ? datos.sede_id : ctx.sedeId;

  // Regla de Oro 1: el DNI es único para todo el sistema, no por rol. Si el
  // profe ya está cargado como socio hay que resolverlo a mano, no duplicarlo.
  const yaExiste = await prisma.usuario.findUnique({
    where: { dni: datos.dni },
    select: {
      rol: true,
      nombre: true,
      apellido: true,
      sede: { select: { nombre: true } },
    },
  });

  if (yaExiste) {
    return {
      error:
        yaExiste.rol === "CLIENTE"
          ? `El DNI ${datos.dni} ya existe como socio de la sede ${yaExiste.sede.nombre} (${yaExiste.apellido}, ${yaExiste.nombre}). Una persona no puede tener dos fichas.`
          : `${yaExiste.apellido}, ${yaExiste.nombre} ya está cargado como personal de la sede ${yaExiste.sede.nombre}.`,
    };
  }

  await prisma.usuario.create({
    data: {
      dni: datos.dni,
      nombre: datos.nombre,
      apellido: datos.apellido,
      email: datos.email || null,
      telefono: datos.telefono || null,
      sede_id: sedeDestino,
      password: await hash(datos.password, RONDAS),
      rol: "ADMIN",
      estado: "ACTIVO",
    },
  });

  revalidatePath("/personal");

  return {
    ok: `${datos.nombre} ya puede entrar con su DNI y la contraseña que le pusiste.`,
  };
}

const esquemaPassword = z.object({
  usuario_id: z.string().trim().min(1),
  password: z
    .string()
    .min(LARGO_MINIMO, `La contraseña necesita al menos ${LARGO_MINIMO} caracteres.`),
});

/** Para cuando un profe se olvida la contraseña. */
export async function cambiarPassword(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const ctx = await exigirPanel();

  const parseado = esquemaPassword.safeParse({
    usuario_id: formData.get("usuario_id"),
    password: formData.get("password"),
  });

  if (!parseado.success) {
    return { error: parseado.error.issues[0]?.message ?? "Datos inválidos." };
  }

  // Acotado a la sede: un admin de Godoy Cruz no le cambia la contraseña a uno
  // de San Martín.
  const miembro = await prisma.usuario.findFirst({
    where: {
      id: parseado.data.usuario_id,
      rol: "ADMIN",
      sede_id: ctx.sedeId,
    },
    select: { id: true, nombre: true },
  });

  if (!miembro) {
    return { error: "Esa persona no está en el personal de esta sede." };
  }

  await prisma.usuario.update({
    where: { id: miembro.id },
    data: { password: await hash(parseado.data.password, RONDAS) },
  });

  revalidatePath("/personal");

  return { ok: `Contraseña de ${miembro.nombre} actualizada.` };
}

/**
 * Da de baja o reactiva a un miembro del personal.
 *
 * Con dos candados contra quedarse afuera del sistema: nadie se da de baja a sí
 * mismo, y no se puede desactivar al último admin que queda.
 */
export async function cambiarEstadoDelPersonal(
  usuarioId: string,
  nuevoEstado: "ACTIVO" | "INACTIVO",
): Promise<EstadoFormulario> {
  const ctx = await exigirPanel();

  const miembro = await prisma.usuario.findFirst({
    where: { id: usuarioId, rol: "ADMIN", sede_id: ctx.sedeId },
    select: { id: true },
  });

  if (!miembro) {
    return { error: "Esa persona no está en el personal de esta sede." };
  }

  if (nuevoEstado === "INACTIVO") {
    if (usuarioId === ctx.usuarioId) {
      return {
        error:
          "No podés darte de baja a vos mismo. Pedile a otro admin que lo haga.",
      };
    }

    // Se cuenta por sede: si fuera global, se podría dejar a esta sucursal sin
    // nadie que pueda entrar al panel porque quedan admins en las otras.
    if ((await contarAdminsActivos(ctx.sedeId)) <= 1) {
      return {
        error: `Es el único admin activo de la sede ${ctx.sedeNombre}. Si lo das de baja, nadie puede entrar a administrarla.`,
      };
    }
  }

  await prisma.usuario.update({
    where: { id: usuarioId },
    data: { estado: nuevoEstado },
  });

  revalidatePath("/personal");

  return {
    ok:
      nuevoEstado === "INACTIVO"
        ? "Ya no puede entrar al sistema. Los pagos que cobró quedan registrados."
        : "Puede volver a entrar.",
  };
}
