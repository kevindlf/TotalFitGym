import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { contextoDelPanel } from "@/lib/sede";
import {
  descargarRutina,
  obtenerRutinaActual,
  respuestaConArchivo,
  rutinasHabilitadas,
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
  if (!rutinasHabilitadas()) {
    return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  }

  const contexto = await contextoDelPanel();

  if (!contexto) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { usuarioId } = await params;

  // Regla de Oro 5: el id viene de la URL, así que hay que confirmar que ese
  // socio sea de la sede en la que está trabajando quien pide el archivo.
  const socio = await prisma.usuario.findFirst({
    where: { id: usuarioId, rol: "CLIENTE", sede_id: contexto.sedeId },
    select: { id: true },
  });

  if (!socio) {
    return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  }

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
