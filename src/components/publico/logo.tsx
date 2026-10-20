/**
 * La marca de AppGym: la pesa y, si se pide, el nombre al lado.
 *
 * Va dibujada acá y no es un archivo de imagen a propósito. Tres razones:
 * se ve nítida en cualquier tamaño —aparece a 28 px en el panel y a 96 px en
 * la portada—, pesa unos cientos de bytes en vez de medio mega, y no hay
 * manera de que el día de mañana alguien suba un `LOGO.jpg` en mayúsculas y
 * se rompa en Linux, que es exactamente lo que ya pasó una vez.
 */

export function MarcaAppGym({ className = "size-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="AppGym"
    >
      <circle cx="32" cy="32" r="32" className="fill-red-600" />
      {/* La pesa: barra al medio, dos discos por lado. Los extremos redondeados
          evitan que a 28 px se vea como un amasijo de rectángulos. */}
      <g
        stroke="white"
        strokeLinecap="round"
        fill="none"
      >
        <line x1="26" y1="32" x2="38" y2="32" strokeWidth="5" />
        <line x1="24" y1="23" x2="24" y2="41" strokeWidth="6" />
        <line x1="40" y1="23" x2="40" y2="41" strokeWidth="6" />
        <line x1="16" y1="27" x2="16" y2="37" strokeWidth="5" />
        <line x1="48" y1="27" x2="48" y2="37" strokeWidth="5" />
      </g>
    </svg>
  );
}

/**
 * El nombre escrito, con la segunda mitad en el rojo de la marca.
 *
 * `className` controla el tamaño y la tipografía desde afuera porque cada
 * superficie la trae distinta: la pública usa Montserrat y el panel otra.
 */
export function NombreAppGym({ className = "" }: { className?: string }) {
  return (
    <span className={className}>
      APP <span className="text-red-600 dark:text-red-500">GYM</span>
    </span>
  );
}
