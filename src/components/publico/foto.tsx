import { existsSync } from "node:fs";
import { join } from "node:path";

import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * Hueco de foto de la página pública.
 *
 * Mientras no haya fotos reales del gimnasio muestra un marcador con el nombre
 * de archivo que falta. Para poner una foto de verdad no hay que tocar código:
 * se copia el archivo a `public/fotos/` con ese nombre y listo.
 */
export function Foto({
  src,
  alt,
  className,
  prioridad = false,
}: {
  src: string;
  alt: string;
  className?: string;
  prioridad?: boolean;
}) {
  const existe = existsSync(join(process.cwd(), "public", src));

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-neutral-800",
        className,
      )}
    >
      {existe ? (
        <Image
          src={src}
          alt={alt}
          fill
          priority={prioridad}
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center p-4 text-center text-xs leading-relaxed text-neutral-500">
          <span>
            Falta la foto
            <br />
            <code className="text-neutral-400">public{src}</code>
          </span>
        </div>
      )}
    </div>
  );
}
