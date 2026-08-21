import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { ProveedorTema } from "@/components/ui/proveedor-tema";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Total Fit · Gimnasio",
  description:
    "Gimnasio Total Fit. Consultá el estado de tu cuota y descargá tu rutina.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // `suppressHydrationWarning` es necesario: next-themes escribe la clase del
    // tema en el <html> antes de que React hidrate, así que el HTML del
    // servidor y el del cliente difieren en ese atributo a propósito.
    <html
      lang="es-AR"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <ProveedorTema>{children}</ProveedorTema>
      </body>
    </html>
  );
}
