/**
 * Todos los datos del gimnasio que aparecen en la página pública, en un solo
 * lugar.
 *
 * Están acá y no en la base a propósito: cambian una o dos veces por año y no
 * justifican una tabla ni una pantalla de administración. Para cambiar el
 * teléfono o un horario se edita este archivo y listo.
 *
 * ⚠️ PENDIENTE: los valores marcados con REVISAR son provisorios. Kevin tiene
 * que pasar los reales antes de publicar.
 */

export const GIMNASIO = {
  nombre: "Total Fit",
  lema: "Entrenás vos. Del resto nos ocupamos.",

  descripcion:
    "Somos un gimnasio de barrio en Junín. Musculación, funcional y clases, " +
    "con profesores que te arman la rutina y te siguen de cerca. Sin filas " +
    "para usar las máquinas y sin contratos que te aten.",

  // REVISAR: dirección real
  direccion: "Av. Rivadavia 1234, Junín, Buenos Aires",
  ciudad: "Junín, Buenos Aires",

  // REVISAR: teléfono y redes reales
  telefono: "+54 9 236 400-0000",
  whatsapp: "5492364000000",
  instagram: "totalfit.junin",
  email: "hola@totalfit.com.ar",
} as const;

export const HORARIOS = [
  { dias: "Lunes a viernes", horas: "7:00 a 23:00" },
  { dias: "Sábados", horas: "9:00 a 14:00" },
  { dias: "Domingos y feriados", horas: "Cerrado" },
] as const;

export const ACTIVIDADES = [
  {
    titulo: "Musculación",
    descripcion:
      "Sala completa con peso libre y máquinas. Rutina armada por un profe según tu objetivo.",
  },
  {
    titulo: "Entrenamiento funcional",
    descripcion:
      "Circuitos en grupos chicos, con corrección de técnica. Ideal si arrancás de cero.",
  },
  {
    titulo: "Acompañamiento",
    descripcion:
      "Un profe te sigue la evolución y te ajusta la rutina cuando hace falta.",
  },
  {
    titulo: "Rutina siempre a mano",
    descripcion:
      "Consultá tu rutina y el estado de tu cuota desde el celular, cuando quieras.",
  },
] as const;

/** Qué incluye cada plan. Los precios se consultan en recepción por ahora. */
export const DETALLE_PLANES = {
  MEDIO: {
    subtitulo: "Tres días por semana",
    incluye: [
      "Acceso 3 días por semana",
      "Rutina personalizada",
      "Seguimiento de un profe",
    ],
  },
  LIBRE: {
    subtitulo: "Todos los días",
    incluye: [
      "Acceso sin límite de días",
      "Rutina personalizada",
      "Seguimiento de un profe",
      "Clases de funcional incluidas",
    ],
  },
} as const;
