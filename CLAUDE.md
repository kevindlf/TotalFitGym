# CLAUDE.md — Total Fit · Sistema de Gestión de Gimnasio

> Fuente de verdad para Claude Code. Leelo completo antes de escribir código. Las **Reglas de Oro** (sección 4) son obligatorias.

> ## ▶ Al empezar una sesión nueva
>
> **Leé `PROGRESO.md` antes de hacer nada.** Arriba de todo tiene una sección **"EMPEZÁ ACÁ"** con el estado real, qué falta, qué lo bloquea y por dónde seguir. Este archivo (`CLAUDE.md`) dice cómo está construido el sistema; `PROGRESO.md` dice en qué punto está y qué se decidió.

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
- **Auth:** NextAuth (credenciales) para el personal. Los socios entran con DNI y, si crearon clave, con clave — sesión propia firmada con HMAC, ver §9.
- **UI:** Tailwind CSS + shadcn/ui
- **Deploy:** Vercel + Supabase

> Se eligió Postgres porque el modelo es relacional (DNI único como clave, foráneas, integridad de caja) y porque el resto del ecosistema de Kevin ya usa Supabase. El modelo lógico es agnóstico: si se exigiera MongoDB, se mantienen las mismas entidades y reglas, solo cambia la capa de datos.

## 3. Modelo de datos

### SEDE (sucursal)
- `id_sede` (PK), `nombre`, `direccion`, `estado` (ACTIVA | CERRADA)
- Total Fit es una **cadena**: San Martín, Ciudad y Godoy Cruz. Un usuario pertenece a **una** sede.
- Un solo servidor y una sola base para todas, pero **los datos de cada sucursal no se cruzan** (Regla de Oro 5). No hay una tabla por sede: el aislamiento sale de filtrar por `sede_id`, que ya viaja en la sesión.

### USUARIO (clave de negocio = DNI)
- `id` (PK técnica), `dni` (**único e irrepetible en toda la cadena**, índice unique), `sede_id` (FK), `nombre`, `apellido`, `email`, `telefono`, `password` (obligatorio si DUENIO/ADMIN, nullable si CLIENTE), `rol` (DUENIO | ADMIN | CLIENTE), `estado` (ACTIVO | INACTIVO), `fecha_registro`
- Un solo modelo Usuario con dos roles. No hacer tablas separadas para admin y cliente.
- **ADMIN es el personal de UNA sucursal** — quien la maneja y sus profes. Ve y toca solo lo de su sede. Puede dar de alta a otro ADMIN, siempre en su misma sede.
- **DUENIO es el dueño de la cadena.** Ve el total de las tres sedes en el dashboard y elige con un selector sobre cuál sucursal opera; ahí adentro se comporta como el ADMIN de esa sede.
- El DNI es único para todo el sistema, no por rol ni por sede: una persona no puede tener ficha de socio y de profe a la vez, ni dos fichas de socio en dos sucursales. Si se muda, se **traslada** (ver Regla de Oro 5).
- La obligatoriedad de `password` para ADMIN no la puede expresar Prisma: se valida en la API y en el seed.

### PAGO
- `id_pago` (PK), `usuario_id` (FK → Usuario), `monto` (numérico libre), `fecha_pago`, `fecha_vencimiento` (calculada), `metodo_pago` (EFECTIVO | TRANSFERENCIA | QR | MERCADO_PAGO), `tipo_pase` (MEDIO | LIBRE | ... configurable), `registrado_por` (FK → Usuario admin que cobró), `sede_id` (FK → Sede **donde se cobró**)
- `sede_id` **no se deduce del socio**: se sella al crear el pago y no cambia nunca. Si el socio después se traslada de sucursal, esta plata sigue contando en la caja donde entró. Sin esta columna, un traslado reescribiría la caja pasada de las dos sedes.
- El **monto es libre** (en la planilla el mismo plan aparece con montos distintos).

### ASISTENCIA (bitácora — inmutable)
- `id_asistencia` (PK), `usuario_id` (FK → Usuario), `fecha_hora`, `metodo_registro` (fijo: DNI_MANUAL en el MVP), `sede_id` (FK → Sede, **por qué puerta entró**)
- Solo se crea y se lee. **Nunca** se edita ni se borra.

### RUTINA (archivo del socio)
- `id_rutina` (PK), `usuario_id` (FK → Usuario), `archivo_url` (**ruta dentro del bucket privado**, no una URL pública), `nombre_archivo`, `subida_por` (FK → Usuario admin), `actualizada_en`
- El admin/profe sube el archivo; el socio lo ve en su portal. Cada subida crea una fila: la rutina "actual" es la de `actualizada_en` más reciente y las anteriores quedan como histórico. **No** hay editor de ejercicios estructurado en v1.
- `subida_por` sigue el mismo criterio que `Pago.registrado_por`: sale de la sesión del servidor. Se puede responder qué profe le cargó la rutina a quién.
- El archivo **nunca se linkea directo ni con signed URL**: se sirve por route handler, que primero verifica la sesión. Una signed URL es la credencial en sí, y una URL se reenvía por WhatsApp.

### Relaciones (1:N)
Sede → Usuarios · Usuario(cliente) → Pagos · Usuario(cliente) → Asistencias · Usuario(cliente) → Rutina · Usuario(admin) → Pagos (como `registrado_por`)

## 4. Reglas de Oro (OBLIGATORIAS)

1. **Soberanía del DNI.** DNI único e irrepetible. Índice `unique`. Nunca dos fichas con el mismo DNI.
2. **Lógica de puerta (recepción).** Al ingresar un DNI, el sistema evalúa **cobertura temporal**, no identidad:
   - ¿Existe un Pago con `fecha_vencimiento >= hoy`? → **ACTIVO** → verde (acceso permitido).
   - Si no existe o el DNI no está registrado → **VENCIDO/INACTIVO** → rojo (acceso denegado).
   - Si `fecha_vencimiento` está entre hoy y hoy+N días (N configurable, default **7**) → **PRÓXIMO A VENCER** → amarillo (acceso permitido).
   - **Ventana de pago (opcional).** Si `DIAS_DE_GRACIA > 0` y el vencimiento cayó dentro de esos días → **EN PERÍODO DE PAGO** → naranja: **entra igual**, pero ya le corresponde pagar. Sirve para el esquema "pagás el 1° y tenés hasta el 5 para renovar". Default **0**, o sea apagado: con la config por defecto vencido es rojo y punto. Prenderlo es una decisión de negocio explícita — el gimnasio regala esos días de acceso.
   - El vencimiento que se evalúa es el **más lejano** del socio, no el del último pago cargado.
   - Un socio con `estado = INACTIVO` (cuenta dada de baja) es rojo aunque le quede cuota paga.
3. **Inmutabilidad de asistencias.** Una vez registrada, queda sellada. La API de asistencias expone solo `create` y `read`. Sin update ni delete.
4. **Trazabilidad de caja.** Todo Pago guarda automáticamente `registrado_por` = admin logueado, tomado del **lado del servidor** (sesión), nunca de un campo del cliente. No entra dinero anónimo.

5. **Soberanía de la sede.** Cada sucursal ve únicamente lo suyo.
   - La sede sobre la que se opera sale **siempre de la sesión del servidor** (`src/lib/sede.ts`), nunca de un formulario, una cookie ni la URL. Para un ADMIN es la de su propia ficha, tomada del JWT firmado; para un DUENIO es la que eligió en el selector.
   - **Toda** consulta del panel se acota a esa sede. Las funciones de `/lib` reciben `sedeId` como **primer parámetro obligatorio**: si se olvida, no compila. `null` significa "toda la cadena" y es una decisión explícita que solo toma el dueño.
   - Pedir un socio de otra sucursal por su id devuelve **404**, no un error de permisos: no se confirma que la ficha exista.
   - En la puerta, un socio de otra sede es **rojo** aunque tenga la cuota al día, y **no se registra asistencia** — ese ingreso no ocurrió. La pantalla dice de qué sucursal es, para que el profe sepa adónde mandarlo.
   - Un socio que se muda se **traslada**: el admin puede traerlo **hacia** su sede (nunca empujarlo a otra), confirmando nombre y sucursal de origen. Sus pagos y asistencias viejos conservan su `sede_id`.
   - El candado del "último admin activo" se cuenta **por sede**: si fuera global, se podría dejar una sucursal sin nadie que pueda entrar al panel.

> El **estado de cuota** (ACTIVO / PRÓXIMO A VENCER / EN PERÍODO DE PAGO / VENCIDO) es **derivado** de `fecha_vencimiento`, se calcula al vuelo — no se guarda. El `estado` de Usuario (ACTIVO/INACTIVO) es la vigencia de la cuenta, cosa distinta.

## 5. Alcance del MVP (v1)

- [x] Auth del personal (NextAuth credenciales, DNI + password).
- [x] CRUD de socios (Usuario rol CLIENTE): DNI, nombre, apellido, email, teléfono, sede, estado.
- [x] Registro de pagos: monto, fecha_pago, `fecha_vencimiento` autocalculada (fecha_pago + período según tipo_pase, default +30 días), método, tipo_pase, `registrado_por` automático.
- [x] Pantalla de **recepción**: input DNI → verde/amarillo/rojo + nombre y vencimiento; registra asistencia inmutable.
- [x] **Dashboard admin**: contadores derivados, cobros del mes, morosos, próximos a vencer.
- [x] **Vista planilla** de socios con filtros y cobro en un click.
- [x] **Gestión del personal**: el admin da de alta a los profes/empleados que cobran.
- [x] **Página pública** del gimnasio + puerta única de ingreso.
- [x] **Portal cliente**: pantalla propia con su cuota, su plan, sus pagos y sus ingresos.
- [x] **Claves de socio**: se las crea el propio socio verificando los últimos 4 dígitos de su teléfono.
- [x] **Descarga de rutina** por el socio, solo con sesión `COMPLETO`. **Apagada** — ver abajo.
- [x] Carga de **rutina** por el admin (PDF/imagen a Supabase Storage, bucket privado). **Apagada** — ver abajo.
- [x] **Aislamiento por sede** (Regla de Oro 5) y rol `DUENIO`.

> **Rutinas está construido y apagado.** El gimnasio ya reparte las rutinas con un QR propio, así que `RUTINAS_HABILITADAS=false` las saca de la ficha del socio, de `/mi-cuenta` y hace que sus rutas devuelvan 404. El código y sus 21 tests quedan enteros: el día que lo quieran se prende la variable. No borrarlo.
- [ ] Script de **importación** de la planilla actual (ver sección 7).

### Fuera del MVP (fases siguientes)
Lector de huella (hardware), notificaciones automáticas WhatsApp/mail, **editor estructurado de rutinas** (ejercicios/series/reps), cobro online con Mercado Pago API, multi-gimnasio SaaS.

## 6. Estructura de carpetas

Estado real del proyecto (difiere del plan original: `/prisma` va en la raíz porque es el default de su tooling, y las dos pantallas de ingreso se unificaron en `/ingresar`).

```
/prisma                    # schema.prisma, migraciones, seed.ts
/public/fotos              # fotos del gimnasio (portada, sala, frente)
/src
  /app
    page.tsx               # landing pública del gimnasio
    /(auth)/ingresar       # PUERTA ÚNICA: socio con DNI, personal con DNI + password
    /(cliente)/mi-cuenta   # portal del socio (cuota, pagos, ingresos, rutina)
    /(admin)               # layout con verificación de sesión ADMIN
      /dashboard           # contadores, caja del mes, morosos
      /socios              # vista planilla + alta + ficha + edición
      /asistencias         # bitácora de ingresos (solo lectura)
      /personal            # alta de profes/empleados
    /recepcion             # pantalla de puerta (DNI → verde/amarillo/rojo)
    /api
      /auth  /recepcion
  /components
    /admin  /publico  /recepcion  /ui
  /lib                     # prisma, auth, sede, cuota, pases, socios, personal,
                           # metricas, portal, recepcion, asistencias, formato,
                           # gimnasio, sesion-socio, rutinas, supabase
  /proxy.ts                # el "middleware" de Next 16
  /generated/prisma        # cliente generado (gitignoreado)
```

## 6bis. Superficies del sistema

| Ruta | Quién entra | Qué hace |
|---|---|---|
| `/` | Cualquiera | Landing: qué es el gimnasio, actividades, planes, horarios, ubicación |
| `/ingresar` | Cualquiera | **Puerta única.** Con DNI solo → portal del socio. Con DNI + password → panel |
| `/mi-cuenta` | Socio (cookie firmada) | Su cuota, su plan, sus pagos, sus ingresos y —con clave— su rutina |
| `/dashboard` | ADMIN | Contadores derivados, cobrado del mes, morosos, próximos a vencer |
| `/socios` | ADMIN | Vista planilla con filtros y cobro en un click |
| `/socios/[id]` | ADMIN | Ficha: pagos con quién cobró, ingresos, registrar pago, baja lógica |
| `/socios/[id]/editar` | ADMIN | Corregir datos, incluido el DNI (sigue siendo único) |
| `/asistencias` | ADMIN | Bitácora de ingresos, solo lectura |
| `/personal` | ADMIN | Alta de profes/empleados **de su sede**, reset de contraseña, baja |
| `/recepcion` | ADMIN | Puerta de **su sede**: DNI → verde/amarillo/naranja/rojo + asistencia |

Todas las pantallas del panel están acotadas a la sede de la sesión. El **DUENIO** entra a las mismas y elige la sucursal con un selector en el encabezado; su dashboard suma además el total de la cadena.

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
- **Mobile primero.** Esto se va a usar más desde el celular que desde una computadora: el socio consulta su cuota desde el teléfono y el profe cobra parado en el mostrador. Toda pantalla arranca en una columna y recién se abre en `sm:`/`md:`. Las tablas de más de 4 columnas se duplican: tarjetas apiladas en el celular (`md:hidden`) y tabla en pantalla grande (`hidden md:block`). Nunca dejar que el `body` scrollee de costado.
- **El color nunca comunica solo.** Cada estado lleva además ícono o texto: la pantalla de la puerta se lee de lejos y de reojo, y un recepcionista daltónico tiene que poder usarla.
- **Acciones de servidor con `(estadoPrevio, formData)`**, no envueltas en closures. Así Next les da progressive enhancement y siguen andando si el JavaScript no cargó — cosa que importa en la PC del mostrador.
- **Los datos del gimnasio** (dirección, teléfono, horarios, actividades, qué incluye cada plan) viven en `src/lib/gimnasio.ts`. Cambian dos veces por año y no justifican una tabla ni una pantalla de administración.
- **El socio nunca viaja en la URL.** Su sesión es una cookie `httpOnly` firmada con HMAC (`src/lib/sesion-socio.ts`), no un DNI en el path: una URL se comparte, queda en el historial y se filtra por el `Referer`.
- **La sesión del socio tiene dos niveles.** `BASICO` (entró con DNI solo) ve cuota, plan, pagos e ingresos — información que en recepción le darían por teléfono. `COMPLETO` (además puso su clave) es el único que descarga la rutina. El nivel viaja **dentro** de lo firmado, así que editarlo invalida la firma. El socio se crea la clave solo, verificando los últimos 4 dígitos del teléfono que ya está en su ficha.

## 10. Notas de versiones (Fase 1)

Este proyecto usa versiones nuevas cuyas convenciones cambiaron respecto de lo habitual:

- **Next.js 16:** `middleware.ts` ahora se llama **`proxy.ts`** (misma funcionalidad, va en `/src`). La doc oficial local está en `node_modules/next/dist/docs/`. Ver también `@AGENTS.md`.
- **Prisma 7:** generator `prisma-client` (no `prisma-client-js`), `output` obligatorio → el cliente se genera en `src/generated/prisma` y se importa desde ahí, **no** desde `@prisma/client`. Requiere **driver adapter** (`@prisma/adapter-pg` + `pg`). La config del CLI vive en `prisma.config.ts` y las variables se cargan a mano con `dotenv` desde `.env.local`.
- **Tailwind v4** (config en CSS, sin `tailwind.config.js`).
- **shadcn/ui sobre Base UI, no Radix.** No existe la prop `asChild`: para renderizar un `Button` como `Link` va `render={<Link href="…" />}`.

@AGENTS.md
