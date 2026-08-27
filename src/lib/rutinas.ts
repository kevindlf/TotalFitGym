import { randomUUID } from "node:crypto";

import { prisma } from "./prisma";
import { nombreDelBucket, supabase } from "./supabase";

/**
 * Rutinas: el archivo que el profe le arma al socio.
 *
 * El archivo vive en un bucket PRIVADO de Supabase Storage y nunca se linkea
 * directo: se sirve por route handler, que antes chequea la sesión. Por eso en
 * la base se guarda la ruta dentro del bucket, no una URL.
 *
 * Cada subida crea una fila nueva. La rutina "actual" es la de `actualizada_en`
 * más reciente y las anteriores quedan como histórico, que es para lo que está
 * el índice `[usuario_id, actualizada_en]` del schema.
 */

/**
 * Si el bloque de rutinas está prendido.
 *
 * Apagado por defecto: el gimnasio ya reparte las rutinas con un QR propio y no
 * las necesita en el sistema. El código queda entero y probado, así que el día
 * que lo quieran se prende una variable y funciona — mucho mejor que decirles
 * que "se podría agregar".
 */
export function rutinasHabilitadas(): boolean {
  return process.env.RUTINAS_HABILITADAS === "true";
}

/** 8 MB. Una rutina es un PDF de dos carillas o una foto; de más, es un error. */
export const TAMANO_MAXIMO = 8 * 1024 * 1024;

interface TipoDeArchivo {
  extension: string;
  mime: string;
  /** Prefijo real del archivo, byte a byte. */
  firma: number[];
  /** Bytes adicionales más adelante en el archivo (los usa WEBP). */
  firmaSecundaria?: { desde: number; bytes: number[] };
}

// "Magic bytes": los primeros bytes que identifican el formato de verdad.
//
// No se confía en el `Content-Type` que manda el navegador ni en la extensión
// del nombre: los dos los elige quien sube el archivo. Un .exe renombrado a
// .pdf viaja con `application/pdf` sin ningún problema. El prefijo del archivo,
// en cambio, lo escribió el programa que lo generó.
const TIPOS_PERMITIDOS: TipoDeArchivo[] = [
  {
    extension: "pdf",
    mime: "application/pdf",
    firma: [0x25, 0x50, 0x44, 0x46], // %PDF
  },
  {
    extension: "jpg",
    mime: "image/jpeg",
    firma: [0xff, 0xd8, 0xff],
  },
  {
    extension: "png",
    mime: "image/png",
    firma: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  },
  {
    extension: "webp",
    mime: "image/webp",
    firma: [0x52, 0x49, 0x46, 0x46], // RIFF
    firmaSecundaria: { desde: 8, bytes: [0x57, 0x45, 0x42, 0x50] }, // WEBP
  },
];

export type ResultadoDeValidacion =
  | { ok: true; extension: string; mime: string; nombre: string }
  | { ok: false; error: string };

function coincide(bytes: Uint8Array, tipo: TipoDeArchivo): boolean {
  const prefijoOk = tipo.firma.every(
    (esperado, indice) => bytes[indice] === esperado,
  );

  if (!prefijoOk) {
    return false;
  }

  if (!tipo.firmaSecundaria) {
    return true;
  }

  const { desde, bytes: esperados } = tipo.firmaSecundaria;

  return esperados.every((byte, indice) => bytes[desde + indice] === byte);
}

/**
 * Deja el nombre presentable para el `Content-Disposition` de la descarga.
 *
 * Va por lista blanca en vez de por lista negra: se conserva lo que es
 * claramente inofensivo (letras, números, espacio, guiones y punto) y se
 * descarta todo lo demás. Una lista negra siempre se olvida de algo — un
 * separador de ruta, un carácter de control, una comilla que rompe el header.
 *
 * La ruta dentro del bucket NUNCA usa este nombre: la arma `rutaEnBucket()`.
 */
function nombreParaMostrar(nombre: string, extension: string): string {
  const soloBase = nombre.split(/[/\\]/).pop() ?? "";
  const limpio = soloBase
    .normalize("NFC")
    .replace(/[^\p{L}\p{N} ._-]/gu, "")
    .replace(/\.{2,}/g, ".")
    .trim()
    .slice(0, 80);

  if (!limpio || limpio.startsWith(".")) {
    return `rutina.${extension}`;
  }

  return limpio.toLowerCase().endsWith(`.${extension}`)
    ? limpio
    : `${limpio}.${extension}`;
}

/**
 * Valida un archivo de rutina mirando su contenido, no lo que dice ser.
 *
 * Función pura: no toca la base ni la red, así que se testea sola.
 */
export function validarArchivoDeRutina(
  nombre: string,
  bytes: Uint8Array,
): ResultadoDeValidacion {
  if (bytes.byteLength === 0) {
    return { ok: false, error: "El archivo está vacío." };
  }

  if (bytes.byteLength > TAMANO_MAXIMO) {
    const mb = (bytes.byteLength / 1024 / 1024).toFixed(1);

    return {
      ok: false,
      error: `El archivo pesa ${mb} MB y el máximo son 8 MB.`,
    };
  }

  const tipo = TIPOS_PERMITIDOS.find((candidato) => coincide(bytes, candidato));

  if (!tipo) {
    return { ok: false, error: "Solo se aceptan PDF, JPG, PNG o WEBP." };
  }

  return {
    ok: true,
    extension: tipo.extension,
    mime: tipo.mime,
    nombre: nombreParaMostrar(nombre, tipo.extension),
  };
}

/**
 * Ruta del objeto dentro del bucket. Se arma entera del lado del servidor.
 *
 * El nombre que mandó el cliente no participa a propósito: un `../` ahí sería
 * un escape del directorio del socio hacia el archivo de otro.
 */
export function rutaEnBucket(usuarioId: string, extension: string): string {
  return `${usuarioId}/${randomUUID()}.${extension}`;
}

export interface RutinaActual {
  id_rutina: string;
  nombre_archivo: string;
  archivo_url: string;
  actualizada_en: Date;
  subida_por: string;
}

export async function obtenerRutinaActual(
  usuarioId: string,
): Promise<RutinaActual | null> {
  return prisma.rutina.findFirst({
    where: { usuario_id: usuarioId },
    orderBy: { actualizada_en: "desc" },
    select: {
      id_rutina: true,
      nombre_archivo: true,
      archivo_url: true,
      actualizada_en: true,
      subida_por: true,
    },
  });
}

export type ResultadoDeGuardado =
  | { ok: true; nombre: string }
  | { ok: false; error: string };

/**
 * Sube el archivo y registra la fila.
 *
 * `adminId` sale siempre de la sesión del servidor — la Regla de Oro 4 aplicada
 * a rutinas: queda registrado qué profe le cargó la rutina a quién.
 */
export async function guardarRutina({
  usuarioId,
  adminId,
  nombre,
  bytes,
}: {
  usuarioId: string;
  adminId: string;
  nombre: string;
  bytes: Uint8Array;
}): Promise<ResultadoDeGuardado> {
  const validacion = validarArchivoDeRutina(nombre, bytes);

  if (!validacion.ok) {
    return validacion;
  }

  const bucket = nombreDelBucket();
  const ruta = rutaEnBucket(usuarioId, validacion.extension);

  const subida = await supabase()
    .storage.from(bucket)
    .upload(ruta, bytes, { contentType: validacion.mime, upsert: false });

  if (subida.error) {
    return {
      ok: false,
      error: `No se pudo subir el archivo: ${subida.error.message}`,
    };
  }

  try {
    await prisma.rutina.create({
      data: {
        usuario_id: usuarioId,
        archivo_url: ruta,
        nombre_archivo: validacion.nombre,
        subida_por: adminId,
      },
    });
  } catch (error) {
    // Si la fila no entró, al objeto recién subido no lo va a referenciar
    // nadie nunca. Se borra para no dejar basura en el bucket.
    await supabase().storage.from(bucket).remove([ruta]);

    throw error;
  }

  return { ok: true, nombre: validacion.nombre };
}

/** Baja el archivo del bucket privado. `null` si ya no está. */
export async function descargarRutina(ruta: string): Promise<Blob | null> {
  const { data, error } = await supabase()
    .storage.from(nombreDelBucket())
    .download(ruta);

  return error ? null : data;
}

/**
 * Borra la fila primero y el objeto después.
 *
 * En ese orden a propósito: si falla el borrado del objeto queda un archivo
 * huérfano en un bucket privado, que no molesta a nadie. Al revés quedaría una
 * fila apuntando a un archivo que ya no existe, y el socio vería un botón de
 * descarga que falla.
 */
export async function borrarRutina(idRutina: string): Promise<boolean> {
  const rutina = await prisma.rutina.findUnique({
    where: { id_rutina: idRutina },
    select: { archivo_url: true },
  });

  if (!rutina) {
    return false;
  }

  await prisma.rutina.delete({ where: { id_rutina: idRutina } });
  await supabase().storage.from(nombreDelBucket()).remove([rutina.archivo_url]);

  return true;
}

/**
 * Arma la respuesta de descarga, igual para el socio y para el admin.
 *
 * El nombre va en `filename*` codificado como URL: ya viene saneado de
 * `validarArchivoDeRutina`, pero un nombre con tilde o con espacio rompe el
 * header si se pega tal cual.
 */
export function respuestaConArchivo(archivo: Blob, nombre: string): Response {
  return new Response(archivo, {
    headers: {
      "Content-Type": mimeDeRutina(nombre),
      "Content-Length": String(archivo.size),
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(nombre)}`,
      // Es un archivo personal: que no quede en ninguna caché compartida.
      "Cache-Control": "private, no-store",
    },
  });
}

/** Tipo MIME a partir de la extensión, que se fijó al subir tras validar. */
export function mimeDeRutina(nombreArchivo: string): string {
  const extension = nombreArchivo.split(".").pop()?.toLowerCase() ?? "";
  const tipo = TIPOS_PERMITIDOS.find(
    (candidato) =>
      candidato.extension === extension ||
      (extension === "jpeg" && candidato.extension === "jpg"),
  );

  return tipo?.mime ?? "application/octet-stream";
}
