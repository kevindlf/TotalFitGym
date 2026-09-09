"use client";

import { useActionState } from "react";
import { 
  IdCard, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  DollarSign, 
  Ticket, 
  Wallet, 
  AlertCircle, 
  Loader2, 
  ArrowRightLeft
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DIAS_POR_PASE, ETIQUETAS_TIPO_PASE } from "@/lib/pases";
import { cn } from "@/lib/utils";

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
  "flex h-11 w-full rounded-xl border border-border/50 bg-background/50 pl-10 pr-8 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-red-500 transition-all";

export function FormularioSocio({ sedeNombre }: { sedeNombre: string }) {
  const [estado, accion, enviando] = useActionState(crearSocio, ESTADO_INICIAL);

  const [estadoTraslado, trasladar, trasladando] = useActionState(
    trasladarSocio,
    ESTADO_INICIAL,
  );

  return (
    <div className="flex flex-col gap-6">
      
      {estado.traslado ? (
        <div
          role="status"
          className="space-y-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-500">
              <ArrowRightLeft className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-900 dark:text-amber-500">
                ¡Este socio ya está registrado!
              </h3>
              <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
                El DNI <strong className="font-bold tabular-nums">{estado.traslado.dni}</strong> ya pertenece a 
                <strong className="font-bold"> {estado.traslado.apellido}, {estado.traslado.nombre}</strong> en la 
                <strong className="font-bold"> sede {estado.traslado.sedeNombre}</strong>.
              </p>
              <p className="mt-2 text-sm text-amber-800/80 dark:text-amber-200/80">
                Si es la misma persona y se quiere cambiar, podés traer su ficha para acá. 
                El historial de pagos viaja con ella.
              </p>
            </div>
          </div>

          <form action={trasladar} className="pt-2">
            <input
              type="hidden"
              name="usuario_id"
              value={estado.traslado.usuarioId}
            />
            <Button 
              type="submit" 
              disabled={trasladando}
              className="w-full sm:w-auto rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-sm"
            >
              {trasladando ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Trayéndolo...
                </>
              ) : (
                `Traerlo a la sede ${sedeNombre}`
              )}
            </Button>
          </form>

          {estadoTraslado.error ? (
            <p role="alert" className="flex items-center gap-2 text-sm font-medium text-red-500 mt-2">
              <AlertCircle className="size-4" />
              {estadoTraslado.error}
            </p>
          ) : null}
        </div>
      ) : null}

      <form action={accion} className="flex flex-col gap-6">
        
        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="dni" className="text-muted-foreground font-medium text-xs uppercase tracking-wider">
              DNI *
            </Label>
            <div className="relative">
              <IdCard className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="dni"
                name="dni"
                inputMode="numeric"
                required
                autoFocus
                defaultValue=""
                placeholder="30123456"
                className="h-11 rounded-xl bg-background/50 pl-10 border-border/50 focus-visible:ring-red-500 font-medium tabular-nums"
              />
            </div>
            <p className="text-xs font-medium text-muted-foreground mt-1">
              Es la clave única del socio. Si ya existe, el sistema te avisará.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="nombre" className="text-muted-foreground font-medium text-xs uppercase tracking-wider">
                Nombre *
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="nombre" name="nombre" defaultValue="" required className="h-11 rounded-xl bg-background/50 pl-10 border-border/50 focus-visible:ring-red-500 font-medium" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="apellido" className="text-muted-foreground font-medium text-xs uppercase tracking-wider">
                Apellido *
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="apellido" name="apellido" defaultValue="" required className="h-11 rounded-xl bg-background/50 pl-10 border-border/50 focus-visible:ring-red-500 font-medium" />
              </div>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="telefono" className="text-muted-foreground font-medium text-xs uppercase tracking-wider">
                Teléfono
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="telefono" name="telefono" defaultValue="" inputMode="tel" className="h-11 rounded-xl bg-background/50 pl-10 border-border/50 focus-visible:ring-red-500 font-medium tabular-nums" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-muted-foreground font-medium text-xs uppercase tracking-wider">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" name="email" type="email" defaultValue="" className="h-11 rounded-xl bg-background/50 pl-10 border-border/50 focus-visible:ring-red-500 font-medium" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/40 p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-500">
            <MapPin className="size-5" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Sede de registro: {sedeNombre}</p>
            <p className="text-xs font-medium text-muted-foreground">
              El socio quedará vinculado a la sucursal en la que estás trabajando.
            </p>
          </div>
        </div>

        <fieldset className="rounded-2xl border border-border/40 bg-card/20 p-5 sm:p-6 shadow-sm">
          <legend className="px-2 text-lg font-bold text-foreground">
            Primer pago <span className="font-medium text-muted-foreground text-sm ml-1">(Opcional)</span>
          </legend>
          
          <div className="mt-4 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="monto" className="text-muted-foreground font-medium text-xs uppercase tracking-wider">
                Monto abonado
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="monto"
                  name="monto"
                  type="number"
                  min="1"
                  step="any"
                  defaultValue=""
                  placeholder="45000"
                  className="h-11 rounded-xl bg-background/50 pl-10 border-border/50 focus-visible:ring-red-500 font-medium tabular-nums"
                />
              </div>
              <p className="text-xs font-medium text-muted-foreground mt-1">
                Dejalo vacío si todavía no pagó. La cuenta quedará en rojo hasta que se registre un cobro.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="tipo_pase" className="text-muted-foreground font-medium text-xs uppercase tracking-wider">
                  Plan asignado
                </Label>
                <div className="relative">
                  <Ticket className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <select
                    id="tipo_pase"
                    name="tipo_pase"
                    defaultValue="LIBRE"
                    className={CLASE_SELECT}
                  >
                    {Object.entries(ETIQUETAS_TIPO_PASE).map(([valor, texto]) => (
                      <option key={valor} value={valor} className="bg-zinc-950 text-white dark:bg-zinc-900">
                        {texto} ({DIAS_POR_PASE[valor as keyof typeof DIAS_POR_PASE]} días)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="metodo_pago" className="text-muted-foreground font-medium text-xs uppercase tracking-wider">
                  Método de cobro
                </Label>
                <div className="relative">
                  <Wallet className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <select
                    id="metodo_pago"
                    name="metodo_pago"
                    defaultValue="EFECTIVO"
                    className={CLASE_SELECT}
                  >
                    {METODOS.map((metodo) => (
                      <option key={metodo.valor} value={metodo.valor} className="bg-zinc-950 text-white dark:bg-zinc-900">
                        {metodo.texto}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </fieldset>

        {estado.error ? (
          <div role="alert" className="flex items-start gap-2 rounded-xl bg-red-500/10 p-4 text-red-500 border border-red-500/20">
            <AlertCircle className="size-5 shrink-0 mt-0.5" />
            <p className="font-medium text-sm">{estado.error}</p>
          </div>
        ) : null}

        <Button 
          type="submit" 
          disabled={enviando}
          className={cn(
            "mt-2 h-12 w-full rounded-xl text-base font-semibold transition-all sm:w-auto",
            enviando 
              ? "bg-muted text-muted-foreground" 
              : "bg-red-600 hover:bg-red-700 text-white shadow-md hover:-translate-y-0.5 hover:shadow-lg"
          )}
        >
          {enviando ? (
            <>
              <Loader2 className="mr-2 size-5 animate-spin" />
              Creando socio...
            </>
          ) : (
            "Guardar y crear socio"
          )}
        </Button>
      </form>
    </div>
  );
}