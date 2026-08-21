import { existsSync } from "node:fs";
import { join } from "node:path";

import { Dumbbell } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * Hueco de foto de la página pública.
 *
 * Si el archivo existe lo muestra optimizado; si no, muestra un bloque
 * diseñado en vez de una imagen rota. La idea es que la página se vea entera
 * desde el día uno y que poner las fotos reales sea copiar archivos a
 * `public/fotos/`, sin tocar código ni pedirle nada a nadie.
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

  if (existe) {
    return (
      <div className={cn("relative overflow-hidden rounded-xl", className)}>
        <Image
          src={src}
          alt={alt}
          fill
          priority={prioridad}
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-xl",
        "bg-linear-to-br from-muted via-muted/60 to-background",
        "ring-1 ring-border ring-inset",
        className,
      )}
    >
      <Dumbbell className="size-10 text-emerald-600/50 dark:text-emerald-400/50" aria-hidden />

      <p className="px-6 text-center text-sm text-muted-foreground">{alt}</p>

      {/* Solo en desarrollo: en producción el hueco queda limpio. */}
      {process.env.NODE_ENV === "development" ? (
        <code className="absolute bottom-3 text-[10px] text-muted-foreground">
          public{src}
        </code>
      ) : null}
    </div>
  );
}
