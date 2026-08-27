import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  descargarRutina,
  obtenerRutinaActual,
  respuestaConArchivo,
} from "@/lib/rutinas";

/**
 * Descarga de la rutina por el admin, para revisar lo que subió.
 *
 * A diferencia de `/api/mi-rutina`, acá el socio SÍ viaja en la URL: quien la
 * pide es el profe desde el panel, que ya ve la ficha entera de ese socio.
 *
 * El proxy (`src/proxy.ts`) cubre esta ruta, pero se vuelve a verificar la
 * sesión igual: el propio archivo aclara que ese chequeo es optimista y no es
 * la capa de autorización.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ usuarioId: string }> },
) {
  const sesion = await auth();

  if (sesion?.user?.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { usuarioId } = await params;
  const rutina = await obtenerRutinaActual(usuarioId);

  if (!rutina) {
    return NextResponse.json(
      { error: "Ese socio no tiene rutina cargada." },
      { status: 404 },
    );
  }

  const archivo = await descargarRutina(rutina.archivo_url);

  if (!archivo) {
    return NextResponse.json(
      { error: "El archivo ya no está en el almacenamiento." },
      { status: 404 },
    );
  }

  return respuestaConArchivo(archivo, rutina.nombre_archivo);
}
