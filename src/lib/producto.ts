/**
 * Todo lo que la página pública dice sobre el producto, en un solo lugar.
 *
 * Antes este archivo describía al gimnasio (horarios, actividades, planes),
 * porque el sistema era de un cliente. Ahora el sistema es el producto: la
 * página pública le habla al dueño de un gimnasio que todavía usa una planilla,
 * no a un socio.
 *
 * Está acá y no en la base a propósito: cambia una o dos veces por año y no
 * justifica una tabla ni una pantalla de administración.
 */

export const PRODUCTO = {
  nombre: "AppGym",
  lema: "El sistema que reemplaza la planilla del gimnasio.",

  whatsapp: "2634563831",
  instagram: "_punto.dev",
  email: "puntodev@gmail.com",
} as const;

/**
 * Los cuatro carteles de la pantalla de la puerta.
 *
 * `clase` es el color y `glifo` el símbolo: el color nunca comunica solo
 * (CLAUDE.md §9). La pantalla real se lee de lejos, de reojo y con gente
 * esperando, y un recepcionista daltónico tiene que poder usarla.
 */
export const ESTADOS_PUERTA = [
  {
    cartel: "Puede pasar",
    glifo: "✓",
    detalle: "Cuota al día. Queda registrado el ingreso.",
    clase: "text-emerald-700 dark:text-emerald-400",
    fondo: "bg-emerald-500/10",
  },
  {
    cartel: "Puede pasar",
    glifo: "!",
    detalle:
      "Le quedan pocos días. El profe ya puede ofrecerle la renovación en el mostrador.",
    clase: "text-amber-700 dark:text-amber-400",
    fondo: "bg-amber-500/10",
  },
  {
    cartel: "Puede pasar · debe pagar",
    glifo: "!",
    detalle:
      "Se le venció, pero está dentro de los días de tolerancia que el gimnasio decida dar. Es opcional y viene apagado.",
    clase: "text-orange-700 dark:text-orange-400",
    fondo: "bg-orange-500/10",
  },
  {
    cartel: "No puede pasar",
    glifo: "✕",
    detalle:
      "Cuota vencida, cuenta dada de baja, DNI que no está cargado, o socio de otra sucursal.",
    clase: "text-red-700 dark:text-red-400",
    fondo: "bg-red-500/10",
  },
] as const;

/** Las cuatro reglas que el sistema no deja romper, en castellano de mostrador. */
export const REGLAS = [
  {
    rotulo: "Identidad",
    titulo: "Un DNI, una ficha",
    detalle:
      "No existen dos fichas con el mismo documento. Ni entre sucursales, ni entre socio y profe.",
  },
  {
    rotulo: "Bitácora",
    titulo: "El ingreso queda sellado",
    detalle:
      "Una asistencia se crea y se lee. No hay pantalla, botón ni permiso que la edite o la borre.",
  },
  {
    rotulo: "Caja",
    titulo: "Todo pago tiene autor",
    detalle:
      "Quién cobró y dónde lo pone el sistema desde la sesión, no un campo que alguien pueda cambiar.",
  },
  {
    rotulo: "Sucursal",
    titulo: "Cada local ve lo suyo",
    detalle:
      "La sucursal sobre la que se trabaja sale de quién está usando el sistema, no de la pantalla.",
  },
] as const;

/** Qué hace el sistema del lado del mostrador. */
export const CAPACIDADES = [
  {
    titulo: "La planilla, pero viva",
    detalle:
      "El listado de socios conserva el vocabulario que el gimnasio ya usa —Pagado, Por vencer, Falta pagar, Sin pagos— y la fila entera se pinta según el estado. Se filtra por esos mismos estados y se busca por DNI, nombre o apellido.",
  },
  {
    titulo: "Cobrar en un click",
    detalle:
      "El botón «Pagó» repite el monto, el plan y el método del último pago de esa persona, con la fecha de hoy y el vencimiento recalculado. Si esta vez pagó otra cosa, se cambia el monto ahí mismo.",
  },
  {
    titulo: "Quién cobró, siempre",
    detalle:
      "Cada pago guarda automáticamente el nombre del profe que lo registró y en qué local entró la plata. No lo elige nadie en un formulario: lo pone el sistema.",
  },
  {
    titulo: "El panel del dueño",
    detalle:
      "Cuántos hay al día, por vencer y vencidos; cuánto entró este mes y en cuántos pagos; quiénes deben, ordenados por antigüedad de la deuda. Todo calculado en el momento.",
  },
  {
    titulo: "Altas y correcciones",
    detalle:
      "Se da de alta un socio con el primer pago incluido, porque lo normal es que pague el día que se anota. Dar de baja no borra nada: el historial queda y la persona deja de poder entrar.",
  },
  {
    titulo: "Cuatro métodos de pago",
    detalle:
      "Efectivo, transferencia, Mercado Pago y QR. Es cómo se cobró en el mostrador, para que el cierre de caja cuadre con lo que hay en el cajón y con lo que llegó a la cuenta.",
  },
] as const;

/** Lo que el sistema todavía no hace. Va en la página a propósito. */
export const TODAVIA_NO = [
  "No cobra online",
  "No manda WhatsApp automático",
  "No exporta a Excel todavía",
  "No lee huella digital",
  "No borra socios, pagos ni ingresos",
  "No arma rutinas ejercicio por ejercicio",
] as const;
