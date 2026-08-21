"use client";

import { ThemeProvider } from "next-themes";

/**
 * Envuelve toda la app para que funcione el modo claro/oscuro.
 *
 * Arranca con el tema del dispositivo (`system`) y guarda la elección si la
 * persona la cambia a mano. El tema se aplica como clase en el `<html>`, que es
 * lo que espera el `@custom-variant dark` de `globals.css`.
 */
export function ProveedorTema({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
