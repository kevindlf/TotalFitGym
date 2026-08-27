"use client";

import { Download, FileText, Upload } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  eliminarRutina,
  subirRutina,
  type EstadoFormulario,
} from "../acciones";

const ESTADO_INICIAL: EstadoFormulario = {};

/**
 * Carga de la rutina desde la ficha del socio.
 *
 * Subir de nuevo no pisa la anterior: queda como histórico y el socio ve la
 * última. "Borrar" saca solo la vigente.
 */
export function RutinaSocio({
  usuarioId,
  nombre,
  rutina,
}: {
  usuarioId: string;
  nombre: string;
  rutina: { id_rutina: string; nombre_archivo: string; actualizada_en: Date } | null;
}) {
  const [estadoSubida, subir, subiendo] = useActionState(
    subirRutina,
    ESTADO_INICIAL,
  );
  const [estadoBorrado, borrar, borrando] = useActionState(
    eliminarRutina,
    ESTADO_INICIAL,
  );

  const estado = estadoSubida.error || estadoSubida.ok ? estadoSubida : estadoBorrado;

  return (
    <div className="space-y-3">
      {rutina ? (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/50 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2.5">
            <FileText className="size-5 shrink-0 text-muted-foreground" aria-hidden />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{rutina.nombre_archivo}</p>
              <p className="text-xs text-muted-foreground">
                Cargada el{" "}
                {rutina.actualizada_en.toLocaleDateString("es-AR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              render={<a href={`/api/rutina/${usuarioId}`} />}
              size="sm"
              variant="outline"
            >
              <Download className="size-4" aria-hidden />
              Ver
            </Button>

            <form action={borrar}>
              <input type="hidden" name="usuario_id" value={usuarioId} />
              <input type="hidden" name="id_rutina" value={rutina.id_rutina} />
              <Button
                type="submit"
                size="sm"
                variant="ghost"
                disabled={borrando}
                className="text-destructive"
              >
                {borrando ? "Borrando…" : "Borrar"}
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {nombre} todavía no tiene rutina cargada.
        </p>
      )}

      <form action={subir} className="space-y-2">
        <input type="hidden" name="usuario_id" value={usuarioId} />

        <Label htmlFor={`archivo-${usuarioId}`} className="text-sm">
          {rutina ? "Subir una rutina nueva" : "Subir la rutina"}
        </Label>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            id={`archivo-${usuarioId}`}
            name="archivo"
            type="file"
            required
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="h-9 max-w-sm"
          />
          <Button type="submit" size="sm" disabled={subiendo}>
            <Upload className="size-4" aria-hidden />
            {subiendo ? "Subiendo…" : "Subir"}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          PDF, JPG, PNG o WEBP, hasta 8 MB. La rutina anterior queda guardada
          como histórico.
        </p>
      </form>

      {estado.error ? (
        <p role="alert" className="text-xs text-destructive">
          {estado.error}
        </p>
      ) : null}

      {estado.ok ? (
        <p role="status" className="text-xs text-emerald-700 dark:text-emerald-400">
          {estado.ok}
        </p>
      ) : null}
    </div>
  );
}
