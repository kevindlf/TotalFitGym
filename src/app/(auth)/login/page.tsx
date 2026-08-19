import type { Metadata } from "next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { FormularioLogin } from "./formulario-login";

export const metadata: Metadata = {
  title: "Ingresar · Total Fit",
};

export default function PaginaLogin() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Total Fit</CardTitle>
          <CardDescription>
            Panel de gestión. Ingresá con tu DNI y contraseña de administrador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormularioLogin />
        </CardContent>
      </Card>
    </main>
  );
}
