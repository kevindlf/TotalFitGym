"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

/**
 * Cambia entre modo claro y oscuro.
 *
 * Los dos íconos se dibujan siempre y CSS muestra el que corresponde según la
 * clase `dark` del `<html>`. Así el botón sale igual del servidor y del
 * cliente: no hay desajuste de hidratación ni parpadeo, y no hace falta estado
 * de "ya monté".
 *
 * El tema solo se lee dentro del click, que ya corre en el navegador.
 */
export function BotonTema({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={className}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Cambiar entre modo claro y oscuro"
      title="Cambiar tema"
    >
      <Moon className="dark:hidden" aria-hidden />
      <Sun className="hidden dark:block" aria-hidden />
    </Button>
  );
}
