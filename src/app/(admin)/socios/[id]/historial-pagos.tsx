"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatearFecha, formatearPesos } from "@/lib/formato";
import { ETIQUETAS_TIPO_PASE } from "@/lib/pases";

const ETIQUETAS_METODO: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  QR: "QR",
  MERCADO_PAGO: "Mercado Pago",
};

const ITEMS_INICIALES = 2;

// Definimos el tipo de dato para que no tire error
type PagoAdmin = {
  id_pago: string;
  monto: number;
  fecha_pago: string | Date;
  fecha_vencimiento: string | Date;
  tipo_pase: string;
  metodo_pago: string;
  admin: {
    nombre: string;
    apellido: string;
  };
};

export function HistorialPagos({ pagos }: { pagos: PagoAdmin[] }) {
  const [itemsVisibles, setItemsVisibles] = useState<number>(ITEMS_INICIALES);

  if (pagos.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border/50 bg-card/20 p-8 text-center text-sm font-medium text-muted-foreground">
        No hay pagos registrados para este socio.
      </p>
    );
  }

  const pagosAMostrar = pagos.slice(0, itemsVisibles);

  return (
    <div className="space-y-4">
      {/* Celular: una tarjeta por pago. */}
      <ul className="space-y-3 md:hidden">
        {pagosAMostrar.map((pago) => (
          <li key={pago.id_pago} className="space-y-3 rounded-2xl border border-border/40 bg-card/40 p-5 shadow-sm transition-all">
            <div className="flex items-baseline justify-between border-b border-border/40 pb-3">
              <p className="text-xl font-bold tabular-nums text-emerald-500">
                {formatearPesos(pago.monto)}
              </p>
              <p className="text-sm font-medium text-muted-foreground tabular-nums">
                {formatearFecha(pago.fecha_pago)}
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pase</dt>
                <dd className="mt-0.5 font-medium text-foreground">
                  {ETIQUETAS_TIPO_PASE[pago.tipo_pase as keyof typeof ETIQUETAS_TIPO_PASE]}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Método</dt>
                <dd className="mt-0.5 font-medium text-foreground">
                  {ETIQUETAS_METODO[pago.metodo_pago] ?? pago.metodo_pago}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Vence</dt>
                <dd className="mt-0.5 font-medium tabular-nums text-foreground">
                  {formatearFecha(pago.fecha_vencimiento)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Cobró</dt>
                <dd className="mt-0.5 font-medium text-foreground truncate">
                  {pago.admin.nombre} {pago.admin.apellido}
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>

      {/* Desktop: Tabla moderna */}
      <div className="hidden overflow-hidden rounded-2xl border border-border/40 bg-card/40 shadow-sm md:block">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead className="font-medium text-muted-foreground">Fecha de Pago</TableHead>
              <TableHead className="font-medium text-muted-foreground">Monto</TableHead>
              <TableHead className="font-medium text-muted-foreground">Pase</TableHead>
              <TableHead className="font-medium text-muted-foreground">Método</TableHead>
              <TableHead className="font-medium text-muted-foreground">Vencimiento</TableHead>
              <TableHead className="font-medium text-muted-foreground text-right">Cobró</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-border/40">
            {pagosAMostrar.map((pago) => (
              <TableRow key={pago.id_pago} className="border-border/40 hover:bg-muted/20 transition-colors">
                <TableCell className="tabular-nums font-medium">
                  {formatearFecha(pago.fecha_pago)}
                </TableCell>
                <TableCell className="tabular-nums font-bold text-emerald-500">
                  {formatearPesos(pago.monto)}
                </TableCell>
                <TableCell className="font-medium">
                  {ETIQUETAS_TIPO_PASE[pago.tipo_pase as keyof typeof ETIQUETAS_TIPO_PASE]}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {ETIQUETAS_METODO[pago.metodo_pago] ?? pago.metodo_pago}
                </TableCell>
                <TableCell className="tabular-nums font-medium">
                  {formatearFecha(pago.fecha_vencimiento)}
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">
                  {pago.admin.nombre} {pago.admin.apellido}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Botón Ver Más / Ver Menos */}
      {pagos.length > ITEMS_INICIALES && (
        <div className="flex justify-center pt-2">
          {itemsVisibles < pagos.length ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setItemsVisibles(pagos.length)}
              className="text-red-500 hover:text-red-600 hover:bg-red-500/10 font-semibold"
            >
              Ver {pagos.length - ITEMS_INICIALES} pagos más &darr;
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setItemsVisibles(ITEMS_INICIALES)}
              className="text-muted-foreground hover:text-foreground"
            >
              Ver menos &uarr;
            </Button>
          )}
        </div>
      )}
    </div>
  );
}