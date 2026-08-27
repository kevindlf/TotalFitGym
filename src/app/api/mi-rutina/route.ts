import { NextResponse } from "next/server";

import {
  descargarRutina,
  obtenerRutinaActual,
  respuestaConArchivo,
  rutinasHabilitadas,
} from "@/lib/rutinas";
import { leerSesionDelSocio } from "@/lib/sesion-socio";

/**
 * Descarga de la rutina por el propio socio.
 *
 * El servidor hace de proxy contra el bucket privado en vez de entregar una
 * signed URL: esa URL *es* la credencial, y una URL se reenvía por WhatsApp,
 * queda en el historial y se filtra por el `Referer`. Así el archivo nunca sale
 * de acá con una llave pegada.
 *
 * De qué socio es la rutina lo dice la cookie firmada, no un parámetro: no hay
 * forma de pedir la de otro.
 *
 * Esta ruta está EXCLUIDA del matcher de `src/proxy.ts` a propósito: el proxy
 * exige sesión de ADMIN para todo `/api/*`, y acá el que entra es el socio.
 * Toda la autorización de esta ruta es la de abajo.
 */
export async function GET() {
  // Con la función apagada esta ruta directamente no existe: 404, no 403. Un
  // 403 diría "existe pero no podés", y no es el caso.
  if (!rutinasHabilitadas()) {
    return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  }

  const sesion = await leerSesionDelSocio();

  if (!sesion) {
    return NextResponse.json(
      { error: "Entrá con tu DNI para ver tu rutina." },
      { status: 401 },
    );
  }

  // El chequeo que justifica que la sesión tenga dos niveles (CLAUDE.md §9).
  // Va acá y no solo en la UI: esconder el botón no es una protección, el
  // pedido se puede hacer igual escribiendo la URL.
  if (sesion.nivel !== "COMPLETO") {
    return NextResponse.json(
      { error: "Para descargar tu rutina tenés que entrar con tu clave." },
      { status: 403 },
    );
  }

  const rutina = await obtenerRutinaActual(sesion.usuarioId);

  if (!rutina) {
    return NextResponse.json(
      { error: "Todavía no tenés una rutina cargada." },
      { status: 404 },
    );
  }

  const archivo = await descargarRutina(rutina.archivo_url);

  if (!archivo) {
    return NextResponse.json(
      { error: "No pudimos encontrar el archivo. Avisale a tu profe." },
      { status: 404 },
    );
  }

  return respuestaConArchivo(archivo, rutina.nombre_archivo);
}
