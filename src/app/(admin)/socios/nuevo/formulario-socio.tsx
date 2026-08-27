"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DIAS_POR_PASE, ETIQUETAS_TIPO_PASE } from "@/lib/pases";

import {
  crearSocio,
  trasladarSocio,
  type EstadoFormulario,
} from "../acciones";

const ESTADO_INICIAL: EstadoFormulario = {};

const METODOS = [
  { valor: "EFECTIVO", texto: "Efectivo" },
  { valor: "TRANSFERENCIA", texto: "Transferencia" },
  { valor: "MERCADO_PAGO", texto: "Mercado Pago" },
  { valor: "QR", texto: "QR" },
];

const CLASE_SELECT =
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm";

export function FormularioSocio({ sedeNombre }: { sedeNombre: string }) {
  const [estado, accion, enviando] = useActionState(crearSocio, ESTADO_INICIAL);

  // El traslado va en su propio formulario y no como un segundo botón del
  // alta: son dos acciones distintas y anidar <form> no es HTML válido.
  const [estadoTraslado, trasladar, trasladando] = useActionState(
    trasladarSocio,
    ESTADO_INICIAL,
  );

  return (
    <>
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

      {/* La sede NO es un campo del formulario: sale de la sesión (Regla de Oro
          5). Si fuera un <select>, cualquiera podría dar de alta un socio en la
          sucursal de al lado editando el HTML. Se muestra para que el profe vea
          dónde va a quedar la ficha. */}
      <p className="rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground">
        Se va a registrar en la <strong>sede {sedeNombre}</strong>.
      </p>

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

      {/* El DNI ya existe en otra sucursal. No es un error: es la persona que
          se mudó de barrio y hoy quiere entrenar acá. */}
      {estado.traslado ? (
        <div
          role="status"
          className="space-y-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4"
        >
          <p className="text-sm">
            El DNI <strong>{estado.traslado.dni}</strong> ya está registrado en
            la <strong>sede {estado.traslado.sedeNombre}</strong>, a nombre de{" "}
            <strong>
              {estado.traslado.apellido}, {estado.traslado.nombre}
            </strong>
            .
          </p>
          <p className="text-sm text-muted-foreground">
            Si es la misma persona y se cambia a {sedeNombre}, traela. Su
            historial de pagos viaja con ella; lo que ya cobró la otra sede sigue
            contando allá.
          </p>

          <form action={trasladar}>
            <input
              type="hidden"
              name="usuario_id"
              value={estado.traslado.usuarioId}
            />
            <Button type="submit" variant="outline" disabled={trasladando}>
              {trasladando
                ? "Trayéndolo…"
                : `Traerlo a la sede ${sedeNombre}`}
            </Button>
          </form>

          {estadoTraslado.error ? (
            <p role="alert" className="text-sm text-destructive">
              {estadoTraslado.error}
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
