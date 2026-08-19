# CLAUDE.md — Total Fit · Sistema de Gestión de Gimnasio

> Fuente de verdad para Claude Code. Leelo completo antes de escribir código. Las **Reglas de Oro** (sección 4) son obligatorias.

## 1. Qué estamos construyendo

Sistema web de gestión para el gimnasio **Total Fit**. Reemplaza la planilla de Google Sheets que hoy usan para socios, pagos y vencimientos. Tres superficies:

- **Recepción (puerta):** se ingresa el DNI del socio → el sistema responde VERDE (puede pasar), AMARILLO (próximo a vencer) o ROJO (vencido). Registra la asistencia.
- **Panel Admin (dueño/empleado):** alta de socios, registro de pagos, control de vencimientos, métricas de caja, carga de rutinas.
- **Portal Cliente:** el socio ve el estado de su cuota y descarga su rutina.

Escala real actual (planilla): ~349 socios (216 activos, 117 vencidos, 16 próximos a vencer).

## 2. Stack técnico

- **Framework:** Next.js (App Router) + TypeScript
- **Base de datos:** **PostgreSQL + Prisma** (alojado en **Supabase**)
- **Almacenamiento de archivos (rutinas):** Supabase Storage
- **Auth:** NextAuth (credenciales). Admins con password obligatorio; clientes con password opcional en v1.
- **UI:** Tailwind CSS + shadcn/ui
- **Deploy:** Vercel + Supabase

> Se eligió Postgres porque el modelo es relacional (DNI único como clave, foráneas, integridad de caja) y porque el resto del ecosistema de Kevin ya usa Supabase. El modelo lógico es agnóstico: si se exigiera MongoDB, se mantienen las mismas entidades y reglas, solo cambia la capa de datos.

## 3. Modelo de datos

### SEDE (sucursal)
- `id_sede` (PK), `nombre`, `direccion`, `estado` (ACTIVA | CERRADA)
- Total Fit puede tener varias sedes. Un usuario pertenece a **una** sede.

### USUARIO (clave de negocio = DNI)
- `id` (PK técnica), `dni` (**único e irrepetible**, índice unique), `sede_id` (FK), `nombre`, `apellido`, `email`, `telefono`, `password` (obligatorio si ADMIN, nullable si CLIENTE), `rol` (ADMIN | CLIENTE), `estado` (ACTIVO | INACTIVO), `fecha_registro`
- Un solo modelo Usuario con dos roles. No hacer tablas separadas para admin y cliente.

### PAGO
- `id_pago` (PK), `usuario_id` (FK → Usuario), `monto` (numérico libre), `fecha_pago`, `fecha_vencimiento` (calculada), `metodo_pago` (EFECTIVO | TRANSFERENCIA | QR | MERCADO_PAGO), `tipo_pase` (MEDIO | LIBRE | ... configurable), `registrado_por` (FK → Usuario admin que cobró)
- El **monto es libre** (en la planilla el mismo plan aparece con montos distintos).

### ASISTENCIA (bitácora — inmutable)
- `id_asistencia` (PK), `usuario_id` (FK → Usuario), `fecha_hora`, `metodo_registro` (fijo: DNI_MANUAL en el MVP)
- Solo se crea y se lee. **Nunca** se edita ni se borra.

### RUTINA (archivo del socio)
- `id_rutina` (PK), `usuario_id` (FK → Usuario), `archivo_url` (PDF o imagen en Supabase Storage), `actualizada_en`
- El admin/profe sube el archivo; el socio lo ve en su portal. Una rutina "actual" por socio (se puede versionar guardando históricos). **No** hay editor de ejercicios estructurado en v1.

### Relaciones (1:N)
Sede → Usuarios · Usuario(cliente) → Pagos · Usuario(cliente) → Asistencias · Usuario(cliente) → Rutina · Usuario(admin) → Pagos (como `registrado_por`)

## 4. Reglas de Oro (OBLIGATORIAS)

1. **Soberanía del DNI.** DNI único e irrepetible. Índice `unique`. Nunca dos fichas con el mismo DNI.
2. **Lógica de puerta (recepción).** Al ingresar un DNI, el sistema evalúa **cobertura temporal**, no identidad:
   - ¿Existe un Pago con `fecha_vencimiento >= hoy`? → **ACTIVO** → verde (acceso permitido).
   - Si no existe o el DNI no está registrado → **VENCIDO/INACTIVO** → rojo (acceso denegado).
   - Si `fecha_vencimiento` está entre hoy y hoy+N días (N configurable, default **7**) → **PRÓXIMO A VENCER** → amarillo.
3. **Inmutabilidad de asistencias.** Una vez registrada, queda sellada. La API de asistencias expone solo `create` y `read`. Sin update ni delete.
4. **Trazabilidad de caja.** Todo Pago guarda automáticamente `registrado_por` = admin logueado, tomado del **lado del servidor** (sesión), nunca de un campo del cliente. No entra dinero anónimo.

> El **estado de cuota** (ACTIVO / PRÓXIMO A VENCER / VENCIDO) es **derivado** de `fecha_vencimiento`, se calcula al vuelo — no se guarda. El `estado` de Usuario (ACTIVO/INACTIVO) es la vigencia de la cuenta, cosa distinta.

## 5. Alcance del MVP (v1)

- [ ] Auth de admins (NextAuth credenciales).
- [ ] CRUD de socios (Usuario rol CLIENTE): DNI, nombre, apellido, email, teléfono, sede, estado.
- [ ] Registro de pagos: monto, fecha_pago, `fecha_vencimiento` autocalculada (fecha_pago + período según tipo_pase, default +30 días), método, tipo_pase, `registrado_por` automático.
- [ ] Pantalla de **recepción**: input DNI → verde/amarillo/rojo + nombre y vencimiento; registra asistencia inmutable.
- [ ] **Dashboard admin**: contadores activos/próximos/vencidos (derivados), cobros del mes, morosos, próximos a vencer de la semana.
- [ ] **Portal cliente (mínimo)**: ver estado de su cuota + **descargar su rutina** (archivo).
- [ ] Carga de **rutina** por el admin (subir PDF/imagen a Supabase Storage).
- [ ] Script de **importación** de la planilla actual (ver sección 7).

### Fuera del MVP (fases siguientes)
Lector de huella (hardware), notificaciones automáticas WhatsApp/mail, **editor estructurado de rutinas** (ejercicios/series/reps), cobro online con Mercado Pago API, multi-gimnasio SaaS.

## 6. Estructura de carpetas

```
/src
  /app
    /(auth)/login
    /(admin)
      /dashboard
      /socios
      /pagos
      /asistencias
      /rutinas
    /recepcion            # pantalla de puerta (DNI → verde/amarillo/rojo)
    /(cliente)/mi-cuenta  # portal del socio (cuota + rutina)
    /api
      /socios  /pagos  /asistencias  /rutinas  /auth
  /prisma                 # schema.prisma + migraciones
  /lib                    # cliente Prisma, helpers de auth, cálculo de estado de cuota
  /components
```

## 7. Importación de la planilla actual (trampas)

Planilla "Asistencia socios junin": Nombre, Plan, Monto, Medio de pago, Fecha de pago, Vencimiento, Estado, Teléfono. Al migrar:

- **NO tiene DNI** (que es la clave). Decisión pendiente: cargar DNI real de cada socio, o migrar con DNI provisorio y completarlo después. _(No bloquea empezar a construir la app; se resuelve al escribir el script de import.)_
- **Datos sucios:** filas con "no abona", "???", montos vacíos, fechas inválidas (ej. 1/10/2027). Nombres duplicados (deduplicar recién con DNI).
- La columna "Estado" es texto manual → **no se importa**, se recalcula desde `fecha_vencimiento`.
- El enum de método incluye **MERCADO_PAGO** (la planilla lo usa mucho).

## 8. Git y colaboración (con socio)

- `main` protegida (merge solo por Pull Request). Ramas por feature: `feat/recepcion`, `feat/pagos`, etc.
- Agregar al socio como colaborador. Definir quién toca qué.

## 9. Convenciones

- Código y nombres de negocio en español (socio, pago, cuota, sede, rutina).
- Validaciones de las Reglas de Oro en el backend/API, no solo en el front.
- Una única función de cálculo de estado de cuota en `/lib`, reutilizada por recepción, dashboard y portal cliente.
- `registrado_por` siempre del lado del servidor.

## 10. Notas de versiones (Fase 1)

Este proyecto usa versiones nuevas cuyas convenciones cambiaron respecto de lo habitual:

- **Next.js 16:** `middleware.ts` ahora se llama **`proxy.ts`** (misma funcionalidad, va en `/src`). La doc oficial local está en `node_modules/next/dist/docs/`. Ver también `@AGENTS.md`.
- **Prisma 7:** generator `prisma-client` (no `prisma-client-js`), `output` obligatorio → el cliente se genera en `src/generated/prisma` y se importa desde ahí, **no** desde `@prisma/client`. Requiere **driver adapter** (`@prisma/adapter-pg` + `pg`). La config del CLI vive en `prisma.config.ts` y las variables se cargan a mano con `dotenv` desde `.env.local`.
- **Tailwind v4** (config en CSS, sin `tailwind.config.js`).
- **shadcn/ui sobre Base UI, no Radix.** No existe la prop `asChild`: para renderizar un `Button` como `Link` va `render={<Link href="…" />}`.

@AGENTS.md
