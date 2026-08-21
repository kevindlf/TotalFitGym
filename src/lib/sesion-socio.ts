import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

/**
 * Sesión del socio, con dos niveles de confianza.
 *
 * - `BASICO`: entró solo con su DNI. Ve su cuota, su plan, sus pagos y sus
 *   ingresos. Es información que ya le dirían por teléfono en recepción.
 * - `COMPLETO`: además puso su contraseña. Solo este nivel descarga la rutina,
 *   porque un archivo personal no puede quedar detrás de un dato tan fácil de
 *   adivinar como el DNI.
 *
 * La cookie va firmada con HMAC y `httpOnly`: el navegador no la puede leer y
 * el socio no puede editarla para subirse de nivel ni para ver la ficha de
 * otro. El nivel viaja *dentro* de lo firmado, así que cambiarlo invalida la
 * firma.
 *
 * No se usa el DNI en la URL a propósito: una URL se comparte, queda en el
 * historial y se filtra por el `Referer`.
 */

const NOMBRE_COOKIE = "totalfit_socio";

export type NivelDeSesion = "BASICO" | "COMPLETO";

/** Con clave dura más: es una sesión de verdad, no una consulta de paso. */
const DURACION: Record<NivelDeSesion, number> = {
  BASICO: 30 * 60,
  COMPLETO: 12 * 60 * 60,
};

export interface SesionDelSocio {
  usuarioId: string;
  nivel: NivelDeSesion;
}

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

export async function crearSesionDelSocio(
  usuarioId: string,
  nivel: NivelDeSesion,
): Promise<void> {
  const segundos = DURACION[nivel];
  const expira = Date.now() + segundos * 1000;
  const payload = `${usuarioId}.${nivel}.${expira}`;

  (await cookies()).set(NOMBRE_COOKIE, `${payload}.${firmar(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: segundos,
    path: "/",
  });
}

/** Devuelve la sesión del socio, o `null` si no hay o no es válida. */
export async function leerSesionDelSocio(): Promise<SesionDelSocio | null> {
  const cookie = (await cookies()).get(NOMBRE_COOKIE)?.value;

  if (!cookie) {
    return null;
  }

  const [usuarioId, nivel, expira, firma] = cookie.split(".");

  if (!usuarioId || !nivel || !expira || !firma) {
    return null;
  }

  if (nivel !== "BASICO" && nivel !== "COMPLETO") {
    return null;
  }

  if (!firmaValida(`${usuarioId}.${nivel}.${expira}`, firma)) {
    return null;
  }

  if (Number(expira) < Date.now()) {
    return null;
  }

  return { usuarioId, nivel };
}

export async function cerrarSesionDelSocio(): Promise<void> {
  (await cookies()).delete(NOMBRE_COOKIE);
}
