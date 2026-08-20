"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { formatearFecha } from "@/lib/formato";
import { calcularFechaVencimiento } from "@/lib/pases";
import { prisma } from "@/lib/prisma";

export type EstadoFormulario = { error?: string; ok?: string };

/**
 * Toda acción del panel arranca por acá.
 *
 * Regla de Oro 4: el admin sale de la sesión del servidor, nunca de un campo
 * del formulario. Devuelve el id del admin logueado o corta.
 */
async function exigirAdmin(): Promise<string> {
  const sesion = await auth();

  if (sesion?.user?.rol !== "ADMIN") {
    redirect("/login");
  }

  return sesion.user.id;
}

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
  sede_id: z.string().trim().min(1, "Elegí una sede."),
});

export async function crearSocio(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await exigirAdmin();

  const parseado = esquemaSocio.safeParse({
    dni: formData.get("dni"),
    nombre: formData.get("nombre"),
    apellido: formData.get("apellido"),
    telefono: formData.get("telefono") ?? undefined,
    email: formData.get("email") ?? undefined,
    sede_id: formData.get("sede_id"),
  });

  if (!parseado.success) {
    return { error: parseado.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const datos = parseado.data;

  // Regla de Oro 1. La base tiene el índice unique igual, pero avisamos con un
  // mensaje entendible en vez de dejar explotar el error de Postgres.
  const yaExiste = await prisma.usuario.findUnique({
    where: { dni: datos.dni },
    select: { id: true, nombre: true, apellido: true },
  });

  if (yaExiste) {
    return {
      error: `Ya hay una ficha con el DNI ${datos.dni}: ${yaExiste.apellido}, ${yaExiste.nombre}.`,
    };
  }

  const socio = await prisma.usuario.create({
    data: {
      dni: datos.dni,
      nombre: datos.nombre,
      apellido: datos.apellido,
      telefono: datos.telefono || null,
      email: datos.email || null,
      sede_id: datos.sede_id,
      rol: "CLIENTE",
      estado: "ACTIVO",
    },
    select: { id: true },
  });

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
  fecha_pago: z.coerce.date("La fecha de pago no es válida."),
  tipo_pase: z.enum(["MEDIO", "LIBRE"]),
  metodo_pago: z.enum(["EFECTIVO", "TRANSFERENCIA", "QR", "MERCADO_PAGO"]),
});

export async function registrarPago(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const adminId = await exigirAdmin();

  const parseado = esquemaPago.safeParse({
    usuario_id: formData.get("usuario_id"),
    monto: formData.get("monto"),
    fecha_pago: formData.get("fecha_pago"),
    tipo_pase: formData.get("tipo_pase"),
    metodo_pago: formData.get("metodo_pago"),
  });

  if (!parseado.success) {
    return { error: parseado.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const datos = parseado.data;

  const socio = await prisma.usuario.findFirst({
    where: { id: datos.usuario_id, rol: "CLIENTE" },
    select: { id: true },
  });

  if (!socio) {
    return { error: "Ese socio no existe." };
  }

  // El vencimiento se calcula del lado del servidor a partir del tipo de pase.
  // No se acepta como campo del formulario: si no, cualquiera podría enviar un
  // vencimiento arbitrario.
  const fechaVencimiento = calcularFechaVencimiento(
    datos.fecha_pago,
    datos.tipo_pase,
  );

  await prisma.pago.create({
    data: {
      usuario_id: socio.id,
      monto: datos.monto.toFixed(2),
      fecha_pago: datos.fecha_pago,
      fecha_vencimiento: fechaVencimiento,
      tipo_pase: datos.tipo_pase,
      metodo_pago: datos.metodo_pago,
      // Regla de Oro 4: el admin logueado, del servidor.
      registrado_por: adminId,
    },
  });

  revalidatePath(`/socios/${socio.id}`);
  revalidatePath("/socios");
  revalidatePath("/dashboard");

  return {
    ok: `Pago registrado. La cuota vence el ${formatearFecha(fechaVencimiento)}.`,
  };
}

export async function cambiarEstadoSocio(
  usuarioId: string,
  nuevoEstado: "ACTIVO" | "INACTIVO",
) {
  await exigirAdmin();

  await prisma.usuario.update({
    where: { id: usuarioId },
    data: { estado: nuevoEstado },
  });

  revalidatePath(`/socios/${usuarioId}`);
  revalidatePath("/socios");
  revalidatePath("/dashboard");
}
