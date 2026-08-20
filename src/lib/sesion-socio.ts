import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

/**
 * Sesión liviana del socio.
 *
 * El socio entra solo con su DNI, sin contraseña (CLAUDE.md §2: password
 * opcional para CLIENTE en v1). Necesitamos igual recordar a quién consultó
 * para poder mostrarle su propia pantalla sin poner el DNI en la URL: una URL
 * se comparte, queda en el historial y se filtra por el `Referer`.
 *
 * La cookie va firmada con HMAC y `httpOnly`, así el navegador no la puede
 * leer ni el socio puede editarla para ver la ficha de otro. Dura poco: es
 * para una consulta, no para dejar la sesión abierta.
 *
 * Cuando existan contraseñas de socio, esto se reemplaza por NextAuth y se
 * borra el archivo.
 */

const NOMBRE_COOKIE = "totalfit_socio";
const DURACION_SEGUNDOS = 30 * 60;

function clave(): string {
  const secreto = process.env.AUTH_SECRET;

  if (!secreto) {
    throw new Error("Falta AUTH_SECRET para firmar la sesión del socio.");
  }

  return secreto;
}

function firmar(payload: string): string {
  return createHmac("sha256", clave()).update(payload).digest("base64url");
}

function firmaValida(payload: string, firma: string): boolean {
  const esperada = Buffer.from(firmar(payload));
  const recibida = Buffer.from(firma);

  // Comparación de tiempo constante: comparar con === filtra, byte a byte,
  // cuánto de la firma se acertó.
  return (
    esperada.length === recibida.length && timingSafeEqual(esperada, recibida)
  );
}

export async function crearSesionDelSocio(usuarioId: string): Promise<void> {
  const expira = Date.now() + DURACION_SEGUNDOS * 1000;
  const payload = `${usuarioId}.${expira}`;

  (await cookies()).set(NOMBRE_COOKIE, `${payload}.${firmar(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: DURACION_SEGUNDOS,
    path: "/",
  });
}

/** Devuelve el id del socio de la sesión, o `null` si no hay o no es válida. */
export async function leerSesionDelSocio(): Promise<string | null> {
  const cookie = (await cookies()).get(NOMBRE_COOKIE)?.value;

  if (!cookie) {
    return null;
  }

  const [usuarioId, expira, firma] = cookie.split(".");

  if (!usuarioId || !expira || !firma) {
    return null;
  }

  if (!firmaValida(`${usuarioId}.${expira}`, firma)) {
    return null;
  }

  if (Number(expira) < Date.now()) {
    return null;
  }

  return usuarioId;
}

export async function cerrarSesionDelSocio(): Promise<void> {
  (await cookies()).delete(NOMBRE_COOKIE);
}
