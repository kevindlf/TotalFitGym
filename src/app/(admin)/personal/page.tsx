import type { Metadata } from "next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { auth } from "@/lib/auth";
import { formatearFecha } from "@/lib/formato";
import { listarPersonal } from "@/lib/personal";
import { listarSedes } from "@/lib/socios";

import { BotonEstado, CambiarPassword } from "./acciones-miembro";
import { FormularioPersonal } from "./formulario-personal";
import { TarjetaMiembro } from "./tarjeta-miembro";
import { exigirPanel } from "@/lib/sede";

export const metadata: Metadata = { title: "Personal · Total Fit" };

export const dynamic = "force-dynamic";

export default async function PaginaPersonal() {
  const ctx = await exigirPanel();

  const [sesion, personal, sedes] = await Promise.all([
    auth(),
    listarPersonal(ctx.sedeId),
    listarSedes(),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Personal</h1>
        <p className="text-muted-foreground">
          Los profes y empleados que pueden cobrar y usar el sistema. Todo pago
          queda a nombre de quien lo registró.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">
          Equipo{" "}
          <span className="text-muted-foreground tabular-nums">
            ({personal.length})
          </span>
        </h2>

        {/* Celular: una tarjeta por persona. */}
        <ul className="space-y-3 md:hidden">
          {personal.map((miembro) => (
            <TarjetaMiembro
              key={miembro.id}
              miembro={miembro}
              esUnoMismo={miembro.id === sesion?.user?.id}
            />
          ))}
        </ul>

        <div className="hidden overflow-x-auto rounded-lg border md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>DNI</TableHead>
                <TableHead>Sede</TableHead>
                <TableHead>Desde</TableHead>
                <TableHead>Cobros</TableHead>
                <TableHead>Contraseña</TableHead>
                <TableHead>Acceso</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {personal.map((miembro) => {
                const estaActivo = miembro.estado === "ACTIVO";

                return (
                  <TableRow
                    key={miembro.id}
                    className={estaActivo ? undefined : "opacity-60"}
                  >
                    <TableCell className="font-medium">
                      {miembro.apellido}, {miembro.nombre}
                      {!estaActivo ? (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (dado de baja)
                        </span>
                      ) : null}
                    </TableCell>

                    <TableCell className="tabular-nums">
                      {miembro.dni}
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      {miembro.sede.nombre}
                    </TableCell>

                    <TableCell className="tabular-nums text-muted-foreground">
                      {formatearFecha(miembro.fecha_registro)}
                    </TableCell>

                    <TableCell className="tabular-nums">
                      {miembro.pagosCobrados}
                    </TableCell>

                    <TableCell>
                      <CambiarPassword
                        usuarioId={miembro.id}
                        nombre={miembro.nombre}
                      />
                    </TableCell>

                    <TableCell>
                      <BotonEstado
                        usuarioId={miembro.id}
                        estaActivo={estaActivo}
                        esUnoMismo={miembro.id === sesion?.user?.id}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </section>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Dar de alta a un profe o empleado</CardTitle>
        </CardHeader>
        <CardContent>
          {sedes.length === 0 ? (
            <p className="text-muted-foreground">
              No hay ninguna sede activa cargada.
            </p>
          ) : (
            <FormularioPersonal sedes={sedes} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
