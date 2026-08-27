import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/prisma";

import {
  TAMANO_MAXIMO,
  mimeDeRutina,
  obtenerRutinaActual,
  rutaEnBucket,
  validarArchivoDeRutina,
} from "./rutinas";

vi.mock("@/lib/prisma", () => ({
  prisma: { rutina: { findFirst: vi.fn() } },
}));

const buscarRutina = vi.mocked(prisma.rutina.findFirst);

/** Arma un archivo con la firma pedida y relleno hasta el tamaño indicado. */
function archivo(firma: number[], bytesTotales = 64): Uint8Array {
  const datos = new Uint8Array(bytesTotales);
  datos.set(firma, 0);

  return datos;
}

const PDF = [0x25, 0x50, 0x44, 0x46];
const JPEG = [0xff, 0xd8, 0xff];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function webp(): Uint8Array {
  const datos = archivo([0x52, 0x49, 0x46, 0x46]);
  datos.set([0x57, 0x45, 0x42, 0x50], 8);

  return datos;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("validarArchivoDeRutina", () => {
  it("acepta los cuatro formatos por su firma real", () => {
    expect(validarArchivoDeRutina("rutina.pdf", archivo(PDF))).toMatchObject({
      ok: true,
      extension: "pdf",
      mime: "application/pdf",
    });
    expect(validarArchivoDeRutina("foto.jpg", archivo(JPEG))).toMatchObject({
      ok: true,
      extension: "jpg",
    });
    expect(validarArchivoDeRutina("foto.png", archivo(PNG))).toMatchObject({
      ok: true,
      extension: "png",
    });
    expect(validarArchivoDeRutina("foto.webp", webp())).toMatchObject({
      ok: true,
      extension: "webp",
    });
  });

  it("rechaza un ejecutable renombrado a .pdf", () => {
    // Un .exe empieza con "MZ". El nombre dice .pdf y el navegador mandaría
    // `Content-Type: application/pdf` sin chistar: por eso no se mira ninguna
    // de las dos cosas, solo el contenido.
    const exe = archivo([0x4d, 0x5a, 0x90, 0x00]);

    expect(validarArchivoDeRutina("rutina.pdf", exe)).toEqual({
      ok: false,
      error: "Solo se aceptan PDF, JPG, PNG o WEBP.",
    });
  });

  it("rechaza un RIFF que no sea WEBP", () => {
    // Un .wav también empieza con RIFF. Sin la firma secundaria pasaría.
    const wav = archivo([0x52, 0x49, 0x46, 0x46]);
    wav.set([0x57, 0x41, 0x56, 0x45], 8); // "WAVE"

    expect(validarArchivoDeRutina("audio.webp", wav).ok).toBe(false);
  });

  it("rechaza un archivo vacío", () => {
    expect(validarArchivoDeRutina("rutina.pdf", new Uint8Array(0))).toEqual({
      ok: false,
      error: "El archivo está vacío.",
    });
  });

  it("rechaza lo que pase de 8 MB", () => {
    const gordo = archivo(PDF, TAMANO_MAXIMO + 1);
    const resultado = validarArchivoDeRutina("rutina.pdf", gordo);

    expect(resultado.ok).toBe(false);
    expect(resultado.ok === false && resultado.error).toContain("8 MB");
  });

  it("acepta justo el límite de 8 MB", () => {
    expect(validarArchivoDeRutina("rutina.pdf", archivo(PDF, TAMANO_MAXIMO)).ok).toBe(
      true,
    );
  });

  describe("nombre para la descarga", () => {
    it("se queda solo con el nombre, sin la ruta", () => {
      const resultado = validarArchivoDeRutina(
        "../../otro-socio/secreto.pdf",
        archivo(PDF),
      );

      expect(resultado).toMatchObject({ ok: true, nombre: "secreto.pdf" });
    });

    it("saca comillas y otros caracteres que romperían el header", () => {
      const resultado = validarArchivoDeRutina(
        'rutina"; filename="otra.pdf',
        archivo(PDF),
      );

      // Se van la comilla, el punto y coma y el igual: lo que queda no puede
      // cerrar el header y abrir un segundo `filename`.
      expect(resultado.ok && resultado.nombre).toBe("rutina filenameotra.pdf");
    });

    it("le pone la extensión si el nombre no la trae", () => {
      expect(validarArchivoDeRutina("rutina de ana", archivo(PDF))).toMatchObject({
        nombre: "rutina de ana.pdf",
      });
    });

    it("cae a un nombre por defecto si no queda nada usable", () => {
      expect(validarArchivoDeRutina("///", archivo(PDF))).toMatchObject({
        nombre: "rutina.pdf",
      });
      expect(validarArchivoDeRutina("..", archivo(PDF))).toMatchObject({
        nombre: "rutina.pdf",
      });
    });

    it("conserva tildes y ñ", () => {
      expect(validarArchivoDeRutina("rutina-año.pdf", archivo(PDF))).toMatchObject({
        nombre: "rutina-año.pdf",
      });
    });
  });
});

describe("rutaEnBucket", () => {
  it("cuelga el archivo del prefijo del socio y descarta el nombre original", () => {
    const ruta = rutaEnBucket("socio_1", "pdf");

    expect(ruta.startsWith("socio_1/")).toBe(true);
    expect(ruta.endsWith(".pdf")).toBe(true);
    // Nada de lo que mandó el cliente participa de la ruta.
    expect(ruta).not.toContain("..");
  });

  it("no repite la ruta entre dos subidas del mismo socio", () => {
    expect(rutaEnBucket("socio_1", "pdf")).not.toBe(rutaEnBucket("socio_1", "pdf"));
  });
});

describe("obtenerRutinaActual", () => {
  it("pide la más reciente del socio, no la última cargada", async () => {
    buscarRutina.mockResolvedValue(null as never);

    await obtenerRutinaActual("socio_1");

    const argumentos = buscarRutina.mock.calls[0]![0]!;

    expect(argumentos.where).toEqual({ usuario_id: "socio_1" });
    expect(argumentos.orderBy).toEqual({ actualizada_en: "desc" });
  });
});

describe("mimeDeRutina", () => {
  it("saca el tipo de la extensión guardada", () => {
    expect(mimeDeRutina("rutina.pdf")).toBe("application/pdf");
    expect(mimeDeRutina("foto.JPG")).toBe("image/jpeg");
    expect(mimeDeRutina("foto.jpeg")).toBe("image/jpeg");
    expect(mimeDeRutina("foto.webp")).toBe("image/webp");
  });

  it("cae a un tipo genérico si la extensión no le suena", () => {
    expect(mimeDeRutina("rutina.docx")).toBe("application/octet-stream");
  });
});
