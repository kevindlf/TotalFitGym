# PROGRESO.md — Total Fit

> Bitácora viva del proyecto. Claude Code: actualizá este archivo al final de cada sesión (qué se hizo, qué sigue, qué se decidió). El detalle técnico completo está en `CLAUDE.md`.

## Estado actual — 19/08/2026

**Fase 1 casi cerrada.** El código de los 6 pasos está escrito, compila y pasa los tests (16/16). Lo único que falta para darla por terminada es **probarla contra una base de datos**, que sigue bloqueado.

| Superficie | Estado |
|---|---|
| Página pública (landing) | ✅ Hecha. Falta poner fotos reales. |
| Login de admin | ✅ Hecho. Sin probar contra la base. |
| Recepción (puerta) | ✅ Hecha. Sin probar contra la base. |
| Dashboard del dueño | ✅ Hecho. Sin probar contra la base. |
| Socios (listado, alta, ficha, baja) | ✅ Hecho. Sin probar contra la base. |
| Registro de pagos | ✅ Hecho. Sin probar contra la base. |
| Portal del cliente (consulta por DNI) | ✅ Hecho. Sin probar contra la base. |
| Rutinas (subir/descargar) | ❌ No empezado. Necesita Supabase + claves de socio. |
| Import de la planilla | ❌ No empezado. |

**Nada de esto se ejecutó nunca contra datos reales.** Compila, pasa lint y los 26 tests, pero todo lo que lee o escribe en la base está sin verificar hasta que exista `totalfit_dev`.

### ⛔ Bloqueante: la base de datos local

No se pudo crear la base. Resumen de lo que pasó:

1. Docker no está instalado → se descartó.
2. La máquina ya tiene **PostgreSQL 18** corriendo como servicio (`postgresql-x64-18`, arranque automático, escuchando en 5432). Se decidió usar ese.
3. `pg_hba.conf` exige `scram-sha-256`, o sea password. Se probaron las dos candidatas que pasó Kevin (`6032` y `root`): las dos dan `la autentificación password falló para el usuario postgres`.
4. No hay credencial guardada en ningún lado: no existe `pgpass.conf`, no está `PGPASSWORD`, y ninguno de los 8 `.env` del directorio `c:\Programación` apunta a un Postgres local.
5. Recargar la config de Postgres necesita permisos de Administrador, que Claude Code no tiene.

**Solución elegida:** en vez de cambiar la password del superusuario `postgres` (que rompería cualquier otra cosa que la use), se crea un **rol dedicado `totalfit`** dueño de la base `totalfit_dev`. El superusuario queda intacto y la app corre con permisos mínimos.

**Lo que tiene que hacer Kevin:** abrir PowerShell **como Administrador** y correr el script que quedó en el scratchpad de la sesión (`crear-db-totalfit.ps1`). Hace backup de `pg_hba.conf`, lo pone en `trust` unos segundos, crea rol y base, y lo restaura en un bloque `finally` (o sea, la autenticación vuelve aunque algo falle). Termina imprimiendo `LISTO: totalfit@totalfit_dev`.

Ya está creado `.env.local` (gitignoreado) con todo lo demás resuelto: `AUTH_SECRET` generado, credenciales del admin del seed y `SEED_DATOS_DEMO=true`.

## Cómo levantar el proyecto

```powershell
cd "c:\Programación\TotalFit_Gimnasio"
npm run dev          # http://localhost:3000
```

Rutas que ya existen:

| Ruta | Qué es | Necesita base |
|---|---|---|
| `/` | Página pública del gimnasio | No |
| `/mi-cuenta` | Portal del socio: consulta su cuota por DNI | Sí |
| `/login` | Ingreso del personal (DNI + password) | Sí, para entrar |
| `/dashboard` | Panel del dueño: contadores, caja del mes, morosos | Sí |
| `/socios` | Listado con búsqueda por DNI, nombre o apellido | Sí |
| `/socios/nuevo` | Alta de socio | Sí |
| `/socios/[id]` | Ficha: pagos, ingresos, registrar pago, dar de baja | Sí |
| `/recepcion` | Pantalla de puerta | Sí |

Otros comandos: `npm test` (16 tests), `npm run build`, `npm run lint`, `npm run db:studio` (ver la base), `npm run db:seed`.

## Decisiones ya tomadas
- **Stack:** Next.js 16 (App Router) + **PostgreSQL + Prisma 7** + NextAuth v5 + Tailwind v4/shadcn. Archivos de rutina en Supabase Storage. Deploy en Vercel + Supabase.
- **Rutina del cliente:** el admin/profe **sube un archivo (PDF/imagen)** y el socio lo ve/descarga. Editor estructurado de ejercicios = fase posterior.
- **Portal cliente en v1:** SÍ, versión mínima (ver estado de cuota + descargar rutina).
- **Umbral "próximo a vencer":** 7 días (configurable vía `DIAS_PROXIMO_A_VENCER`).
- **Alcance de sedes:** un gimnasio con varias **sedes**. Vender a otros gimnasios = fase posterior.
- **Estado de cuota derivado:** se calcula desde `fecha_vencimiento`, no se guarda.
- **Método de pago:** incluye `MERCADO_PAGO`.
- **Asistencias inmutables** y **trazabilidad de caja** (`registrado_por` server-side): reglas duras.

### Decisiones de la sesión del 19/08/2026
- **DB de desarrollo:** PostgreSQL 18 local, rol `totalfit`, base `totalfit_dev`. Supabase queda para el deploy.
- **`tipo_pase`:** enum `MEDIO | LIBRE` + mapa `tipo_pase → días` en `src/lib/pases.ts` (30 días ambos, provisorio).
- **`/recepcion` requiere sesión ADMIN.** La PC de la puerta queda logueada.
- **Amarillo = puede pasar.** Solo el rojo deniega el acceso.
- **La asistencia se registra solo si el acceso está permitido** — la bitácora es de ingresos, no de consultas.
- **Zona horaria fija** `America/Argentina/Buenos_Aires`: un pase que vence hoy es ACTIVO todo el día.
- **Socio con cuenta INACTIVA → rojo**, aunque le quede cuota paga. ⚠️ No está en `CLAUDE.md`: confirmar.
- **El vencimiento que manda es el más lejano**, no el del último pago cargado.
- **Página pública:** horarios, planes y contacto hardcodeados en `src/app/page.tsx`. Las fotos se ponen copiando archivos a `public/fotos/` (`portada.jpg` y `sala.jpg`), sin tocar código.
- **Cloudinary: NO.** Para las fotos de la landing alcanza con `public/`, y para las rutinas ya está Supabase Storage. Sumar un tercer servicio no aporta nada.

## Decisiones ABIERTAS
- [ ] **¿Se prende la ventana de pago?** Ya está implementada pero **apagada** (`DIAS_DE_GRACIA=0`). Confirmar con el gimnasio cuántos días de tolerancia quieren y poner ese número. Ver sección propia más abajo.
- [ ] **Repo en GitHub.** Hoy el repo es solo local. Falta `gh auth login` (es interactivo, lo tiene que correr Kevin) o crear el repo a mano y pasar la URL. Después: `main` protegida + el socio como colaborador.
- [ ] **DNI en la migración.** La planilla no tiene DNI. Se resuelve al escribir el script de import.
- [ ] **Días de vencimiento por tipo de pase.** Hoy ambos en 30. Confirmar con el gimnasio.
- [ ] **Precios de los planes** para mostrar en la landing (hoy dice "consultanos en recepción").
- [ ] **Datos reales del gimnasio:** dirección exacta, teléfono, horarios, redes.
- [ ] **Si el socio exige MongoDB.** _Nota: Prisma 7 ya no tiene conector MongoDB._

## Ventana de pago mensual — ✅ implementada, apagada por defecto

Idea de Kevin: el socio paga el 1° y tiene **del 1 al 5 del mes siguiente** para pagar la cuota siguiente. El dueño ve con anticipación quién entra en período de pago, y después quién ya se pasó.

Está implementada en `src/lib/cuota.ts` como un **cuarto estado** entre amarillo y rojo:

| Estado | Cuándo | ¿Entra? | Qué ve el dueño | Qué ve el socio |
|---|---|---|---|---|
| ACTIVO (verde) | Falta más que el umbral | Sí | — | "Cuota al día" |
| PRÓXIMO A VENCER (amarillo) | Faltan ≤ 5 días | Sí | "Fernando entra en período de pago en 5 días" | "En 5 días te toca renovar" |
| **EN PERÍODO DE PAGO (naranja)** | Venció, pero dentro de los días de gracia | Sí | "Fernando tiene que pagar" | "Se te venció la cuota, tenés hasta el 5" |
| VENCIDO (rojo) | Se pasó la gracia | No | "Fernando está moroso" | "Cuota vencida" |

**Cómo se prende:** poner `DIAS_DE_GRACIA=5` (o los días que decida el gimnasio) en `.env.local`. Con `0` — que es el default — el sistema se comporta exactamente como la Regla de Oro 2 original: vencido es rojo y punto. Hay un test que fija ese comportamiento para que nadie lo cambie sin darse cuenta.

Quedó documentado en la **Regla de Oro 2 de `CLAUDE.md`**, no solo en el código: prender la ventana significa que el gimnasio regala esos días de acceso, y eso es una decisión de negocio, no un detalle técnico.

También se agregaron `mensajeParaAdmin()` y `mensajeParaSocio()` en `src/lib/cuota.ts`: la misma información con dos tonos. Al dueño "Fernando tiene que pagar: le quedan 4 días", al socio "se te venció la cuota, pero tenés 4 días para renovarla y seguir entrenando". Las va a reusar el dashboard y el portal.

**Falta todavía:** lo de "pagás siempre del 1 al 5" en sentido estricto — anclar el vencimiento a un día fijo del mes por socio (`dia_de_cobro`) en vez de `fecha_pago + 30 días`. La gracia sola ya cubre casi todo el caso; esto se puede hacer después.

**Avisos automáticos por WhatsApp o mail siguen fuera del MVP.** Lo que sí entra es que el dueño vea la lista en el dashboard y el socio vea el mensaje al entrar a su portal.

---

## Fase 1 — pasos

- [x] **1.** Confirmar entendimiento del modelo, reglas de oro y stack.
- [x] **2. Scaffolding.** Next.js 16, shadcn/ui, Prisma 7 + `@prisma/adapter-pg`, NextAuth v5, zod, bcryptjs, date-fns, vitest. `git init`, `.env.example`, `prisma.config.ts`.
- [x] **3a. Schema de Prisma** + SQL de la migración inicial + singleton `src/lib/prisma.ts`.
- [ ] **3b. Aplicar la migración** contra `totalfit_dev`. ⛔ Bloqueado por la base.
- [x] **4. `src/lib/cuota.ts`** — cálculo único de estado de cuota + `src/lib/pases.ts` + 8 tests.
- [x] **5. Auth de admin** con NextAuth credenciales, `proxy.ts` y seed del primer admin.
- [x] **6. Pantalla de recepción** — DNI → verde/amarillo/rojo + asistencia inmutable + 8 tests con Prisma mockeado.
- [x] **6b. Página pública** del gimnasio (extra, pedida por Kevin).
- [ ] **7. Verificación end-to-end.** ⛔ Bloqueado por la base.

## Fase 2 — el resto del MVP
1. [x] **Dashboard del dueño:** contadores derivados, cobros del mes, morosos, quién entra en período de pago.
2. [x] **CRUD de socios:** listado con búsqueda, alta, ficha y baja lógica.
3. [x] **Registro de pagos** con `fecha_vencimiento` autocalculada y `registrado_por` automático.
4. [x] **Portal del cliente** (`/mi-cuenta`): consulta de cuota por DNI.
5. [ ] **Claves para socios**, requisito para poder darles acceso a la rutina.
6. [ ] **Carga y descarga de rutinas** a Supabase Storage.
7. [ ] **Listado de asistencias** (solo lectura).
8. [ ] **Script de importación** de la planilla, con limpieza de datos.
9. [ ] **Editar datos** de un socio ya cargado (hoy solo se puede crear y dar de baja).
10. [ ] **Repo en GitHub** con `main` protegida + el socio como colaborador.
11. [ ] **Deploy** en Vercel + Supabase.

## Deuda técnica anotada
- `npm audit`: 3 vulnerabilidades **high** en `deepmerge-ts`, que entra por `@prisma/config` → `prisma` (CLI). Es cadena de **devDependency**, no llega al runtime. El fix automático baja a Prisma 6 (breaking). Se revisa cuando Prisma publique el bump.
- La landing tiene los datos del gimnasio hardcodeados. Si el dueño los quiere editar solo, hay que sacarlos a la base.

## Bitácora
- **19/08/2026** — **Panel del dueño y portal del cliente.** `/dashboard` con contadores derivados (se clasifica cada socio con `calcularEstadoCuota`, no se lee ningún campo guardado), cobrado del mes, ingresos del día y dos listas accionables: quién entra en período de pago y quién tiene que pagar. `/socios` con búsqueda por GET, alta con validación de DNI duplicado antes de que explote el índice unique, ficha con historial de pagos (incluye quién cobró cada uno), últimos ingresos, registro de pago y baja lógica. Todas las acciones pasan por `exigirAdmin()`, que saca el admin de la sesión del servidor; el formulario de pago no manda ni el admin ni el vencimiento — el vencimiento lo calcula el servidor con `calcularFechaVencimiento`. `/mi-cuenta` deja de ser 404: el socio consulta por DNI y ve el mensaje en tono amable, sin registrar asistencia y exponiendo solo nombre de pila, estado y vencimiento.
- **19/08/2026** — **Ventana de pago.** Cuarto estado `EN_PERIODO_DE_PAGO` (naranja) en `src/lib/cuota.ts`, controlado por `DIAS_DE_GRACIA` y apagado por defecto. Mensajes separados para dueño y socio. Recepción muestra el panel naranja con los días que le quedan para renovar. Regla de Oro 2 de `CLAUDE.md` actualizada. 26 tests.
- **19/08/2026** — **Página pública.** Landing del gimnasio en `/`, reemplazando la default de Next: hero, planes (lee las etiquetas de `src/lib/pases.ts`, no las duplica), horarios y footer con acceso del personal. Componente `Foto` que detecta si el archivo existe y muestra un marcador con el nombre que falta, así poner fotos no requiere tocar código. Descubierto que este shadcn está sobre **Base UI y no Radix**: no hay `asChild`, va `render={<Link/>}` (anotado en `CLAUDE.md` §10).
- **19/08/2026** — **Pasos 5 y 6.** Auth de admin con NextAuth v5 (DNI + password, solo rol ADMIN activo), config partida en `auth.config.ts` (edge-safe, la usa `proxy.ts`) y `auth.ts` (Prisma + bcrypt). Mensaje de error único y comparación contra un hash descartable cuando el DNI no existe, para no filtrar por tiempo de respuesta qué socios están registrados. Seed idempotente del primer admin desde variables de entorno. Pantalla de recepción con `src/lib/recepcion.ts` como lógica de puerta (reusa `calcularEstadoCuota`, no la duplica), API `POST /api/recepcion` que verifica sesión ADMIN server-side, y panel verde/amarillo/rojo con ícono y texto además del color. 8 tests con Prisma mockeado verifican que ningún rechazo escriba en la bitácora.
- **19/08/2026** — **Pasos 3 y 4.** Schema de Prisma con las 5 entidades, `dni` unique, enums (incluye `MERCADO_PAGO`) e índices sobre las dos consultas calientes. Las FK de `Asistencia` en RESTRICT (no CASCADE) para que borrar un socio no arrastre su bitácora. SQL de la migración generado sin conexión. `src/lib/cuota.ts` con la única implementación del estado de cuota, comparando por día calendario en zona argentina.
- **19/08/2026** — **Paso 2 (scaffolding).** Proyecto Next.js 16 creado con TypeScript, Tailwind v4, App Router y `src/`. Instaladas todas las dependencias. `git init` + `.env.example`. Corregidos los pasos que todavía decían MongoDB/Mongoose.
- **18/08/2026** — Creados `CLAUDE.md` y `PROGRESO.md` a partir del modelo de datos conceptual/lógico de Total Fit y de la planilla real de socios.
