import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { 
  ArrowLeft, 
  User, 
  Phone, 
  MapPin, 
  CalendarDays, 
  CreditCard, 
  History, 
  Settings, 
  Edit2,
  ShieldAlert,
  Dumbbell,
  Key
} from "lucide-react";

import { EstadoCuotaBadge } from "@/components/admin/estado-cuota-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mensajeParaAdmin } from "@/lib/cuota";
import { formatearFecha, hoyParaInput } from "@/lib/formato";
import { rutinasHabilitadas } from "@/lib/rutinas";
import { obtenerSocio } from "@/lib/socios";
import { exigirPanel } from "@/lib/sede";
import { cn } from "@/lib/utils";

import { cambiarEstadoSocio } from "../acciones";
import { ClaveSocio } from "./clave-socio";
import { FormularioPago } from "./formulario-pago";
import { RutinaSocio } from "./rutina-socio";
import { HistorialPagos } from "./historial-pagos";
import { HistorialIngresos } from "./historial-ingresos"; 

export const dynamic = "force-dynamic";

export default async function PaginaSocio({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await exigirPanel();
  const socio = await obtenerSocio(id, ctx.sedeId);

  if (!socio) {
    notFound();
  }

  const estaDadoDeBaja = socio.estado === "INACTIVO";

  return (
    <div className="space-y-8 pb-12">
      
      <header className="space-y-4 border-b border-border/40 pb-6">
        <Link
          href="/socios"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Volver a socios
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {socio.nombre} {socio.apellido}
              </h1>
              <EstadoCuotaBadge estado={socio.cuota.estado} />
              {estaDadoDeBaja ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-500 ring-1 ring-inset ring-red-500/20">
                  <ShieldAlert className="size-3.5" />
                  Cuenta dada de baja
                </span>
              ) : null}
            </div>

            <p className="text-sm font-medium text-muted-foreground">
              {mensajeParaAdmin(socio.cuota, socio.nombre)}
            </p>
          </div>

          <Button
            render={<Link href={`/socios/${socio.id}/editar`} />}
            nativeButton={false}
            variant="outline"
            size="sm"
            className="shrink-0 rounded-xl border-border/50 hover:bg-muted/50 gap-2"
          >
            <Edit2 className="size-4 text-muted-foreground" />
            Editar datos
          </Button>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Dato titulo="DNI" valor={socio.dni} icon={User} />
        <Dato titulo="Teléfono" valor={socio.telefono ?? "—"} icon={Phone} />
        <Dato titulo="Sede" valor={socio.sede.nombre} icon={MapPin} />
        <Dato
          titulo="Vencimiento"
          valor={
            socio.cuota.fechaVencimiento
              ? formatearFecha(socio.cuota.fechaVencimiento)
              : "Sin pagos"
          }
          icon={CalendarDays}
          destacado={!socio.cuota.fechaVencimiento || socio.cuota.estado === "VENCIDO"}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/40 bg-card/40 shadow-sm">
          <CardHeader className="border-b border-border/20 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="size-5 text-emerald-500" />
              Registrar pago
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <FormularioPago usuarioId={socio.id} hoy={hoyParaInput()} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/40 bg-card/40 shadow-sm flex flex-col">
          <CardHeader className="border-b border-border/20 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="size-5 text-red-500" />
              Últimos ingresos
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex-1">
            <HistorialIngresos asistencias={socio.asistencias} />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
          Historial de pagos
          <span className="rounded-full bg-muted/60 px-2.5 py-0.5 text-xs font-semibold text-muted-foreground tabular-nums">
            {socio.pagos.length}
          </span>
        </h2>

        <HistorialPagos pagos={socio.pagos} />
      </section>

      <section className="mt-8 rounded-2xl border border-border/40 bg-card/20 p-6 shadow-sm">
        <h2 className="mb-6 flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
          <Settings className="size-5 text-muted-foreground" />
          Ajustes de la cuenta
        </h2>

        <div className="grid gap-8 md:grid-cols-2">
          {rutinasHabilitadas() ? (
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground">
                <Dumbbell className="size-4 text-red-500" />
                Rutina asignada
              </h3>
              <div className="rounded-xl border border-border/50 bg-background/50 p-4">
                <RutinaSocio
                  usuarioId={socio.id}
                  nombre={socio.nombre}
                  rutina={socio.rutina}
                />
              </div>
            </div>
          ) : null}

          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground">
              <Key className="size-4 text-amber-500" />
              Clave de acceso
            </h3>
            <div className="rounded-xl border border-border/50 bg-background/50 p-4">
              <ClaveSocio
                usuarioId={socio.id}
                nombre={socio.nombre}
                tieneClave={socio.tieneClave}
              />
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-border/40 pt-6">
          <form
            action={async () => {
              "use server";
              await cambiarEstadoSocio(
                socio.id,
                estaDadoDeBaja ? "ACTIVO" : "INACTIVO",
              );
            }}
            className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-destructive/5 border border-destructive/20 p-4"
          >
            <div>
              <p className="font-semibold text-foreground">
                {estaDadoDeBaja ? "Reactivar cuenta" : "Dar de baja al socio"}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                La baja no borra el historial de pagos ni las asistencias, pero el socio pierde el acceso por puerta.
              </p>
            </div>
            <Button 
              type="submit" 
              variant={estaDadoDeBaja ? "outline" : "destructive"}
              className="shrink-0"
            >
              {estaDadoDeBaja ? "Reactivar socio" : "Dar de baja"}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}

function Dato({ 
  titulo, 
  valor, 
  icon: Icon,
  destacado = false
}: { 
  titulo: string; 
  valor: string; 
  icon: React.ElementType;
  destacado?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border/40 bg-card/40 p-4 shadow-sm transition-colors hover:bg-card/60">
      <div className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
        destacado ? "bg-red-500/10 text-red-500" : "bg-muted/50 text-muted-foreground"
      )}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground truncate">{titulo}</p>
        <p className={cn(
          "truncate font-semibold tabular-nums mt-0.5",
          destacado ? "text-red-500" : "text-foreground"
        )}>
          {valor}
        </p>
      </div>
    </div>
  );
}