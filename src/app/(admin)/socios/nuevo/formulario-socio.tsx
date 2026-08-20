"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DIAS_POR_PASE, ETIQUETAS_TIPO_PASE } from "@/lib/pases";

import { crearSocio, type EstadoFormulario } from "../acciones";

const ESTADO_INICIAL: EstadoFormulario = {};

const METODOS = [
  { valor: "EFECTIVO", texto: "Efectivo" },
  { valor: "TRANSFERENCIA", texto: "Transferencia" },
  { valor: "MERCADO_PAGO", texto: "Mercado Pago" },
  { valor: "QR", texto: "QR" },
];

const CLASE_SELECT =
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm";

export function FormularioSocio({
  sedes,
}: {
  sedes: { id_sede: string; nombre: string }[];
}) {
  const [estado, accion, enviando] = useActionState(crearSocio, ESTADO_INICIAL);

  return (
    <form action={accion} className="max-w-lg space-y-4">
      <div className="space-y-2">
        <Label htmlFor="dni">DNI *</Label>
        <Input
          id="dni"
          name="dni"
          inputMode="numeric"
          required
          autoFocus
          placeholder="30123456"
        />
        <p className="text-xs text-muted-foreground">
          Es la clave del socio: no puede repetirse ni cambiarse después.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre *</Label>
          <Input id="nombre" name="nombre" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="apellido">Apellido *</Label>
          <Input id="apellido" name="apellido" required />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="telefono">Teléfono</Label>
          <Input id="telefono" name="telefono" inputMode="tel" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sede_id">Sede *</Label>
        {/* select nativo a propósito: es más rápido de usar con teclado y no
            necesita JavaScript para funcionar. */}
        <select
          id="sede_id"
          name="sede_id"
          required
          defaultValue={sedes.at(0)?.id_sede ?? ""}
          className={CLASE_SELECT}
        >
          {sedes.map((sede) => (
            <option key={sede.id_sede} value={sede.id_sede}>
              {sede.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Lo normal es que el socio pague el mismo día que se anota, así que el
          primer pago se carga acá y se evita la segunda pantalla. Si se deja
          vacío, el socio queda creado sin pagos y en rojo hasta que se le
          cobre. */}
      <fieldset className="space-y-4 rounded-lg border p-4">
        <legend className="px-1 text-sm font-medium">
          Primer pago{" "}
          <span className="font-normal text-muted-foreground">(opcional)</span>
        </legend>

        <div className="space-y-2">
          <Label htmlFor="monto">Monto</Label>
          <Input
            id="monto"
            name="monto"
            type="number"
            min="1"
            step="any"
            placeholder="45000"
          />
          <p className="text-xs text-muted-foreground">
            Dejalo vacío si todavía no pagó. Queda en rojo hasta que le cobres.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="tipo_pase">Plan</Label>
            <select
              id="tipo_pase"
              name="tipo_pase"
              defaultValue="LIBRE"
              className={CLASE_SELECT}
            >
              {Object.entries(ETIQUETAS_TIPO_PASE).map(([valor, texto]) => (
                <option key={valor} value={valor}>
                  {texto} (
                  {DIAS_POR_PASE[valor as keyof typeof DIAS_POR_PASE]} días)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metodo_pago">Método</Label>
            <select
              id="metodo_pago"
              name="metodo_pago"
              defaultValue="EFECTIVO"
              className={CLASE_SELECT}
            >
              {METODOS.map((metodo) => (
                <option key={metodo.valor} value={metodo.valor}>
                  {metodo.texto}
                </option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      {estado.error ? (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {estado.error}
        </p>
      ) : null}

      <Button type="submit" disabled={enviando}>
        {enviando ? "Guardando…" : "Crear socio"}
      </Button>
    </form>
  );
}
