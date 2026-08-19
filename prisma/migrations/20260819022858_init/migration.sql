-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "EstadoSede" AS ENUM ('ACTIVA', 'CERRADA');

-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'CLIENTE');

-- CreateEnum
CREATE TYPE "EstadoUsuario" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'QR', 'MERCADO_PAGO');

-- CreateEnum
CREATE TYPE "TipoPase" AS ENUM ('MEDIO', 'LIBRE');

-- CreateEnum
CREATE TYPE "MetodoRegistro" AS ENUM ('DNI_MANUAL');

-- CreateTable
CREATE TABLE "Sede" (
    "id_sede" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT,
    "estado" "EstadoSede" NOT NULL DEFAULT 'ACTIVA',

    CONSTRAINT "Sede_pkey" PRIMARY KEY ("id_sede")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "sede_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT,
    "telefono" TEXT,
    "password" TEXT,
    "rol" "Rol" NOT NULL DEFAULT 'CLIENTE',
    "estado" "EstadoUsuario" NOT NULL DEFAULT 'ACTIVO',
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id_pago" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "fecha_pago" TIMESTAMP(3) NOT NULL,
    "fecha_vencimiento" TIMESTAMP(3) NOT NULL,
    "metodo_pago" "MetodoPago" NOT NULL,
    "tipo_pase" "TipoPase" NOT NULL,
    "registrado_por" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id_pago")
);

-- CreateTable
CREATE TABLE "Asistencia" (
    "id_asistencia" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "fecha_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metodo_registro" "MetodoRegistro" NOT NULL DEFAULT 'DNI_MANUAL',

    CONSTRAINT "Asistencia_pkey" PRIMARY KEY ("id_asistencia")
);

-- CreateTable
CREATE TABLE "Rutina" (
    "id_rutina" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "archivo_url" TEXT NOT NULL,
    "actualizada_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rutina_pkey" PRIMARY KEY ("id_rutina")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_dni_key" ON "Usuario"("dni");

-- CreateIndex
CREATE INDEX "Usuario_sede_id_idx" ON "Usuario"("sede_id");

-- CreateIndex
CREATE INDEX "Usuario_apellido_nombre_idx" ON "Usuario"("apellido", "nombre");

-- CreateIndex
CREATE INDEX "Pago_usuario_id_fecha_vencimiento_idx" ON "Pago"("usuario_id", "fecha_vencimiento");

-- CreateIndex
CREATE INDEX "Pago_fecha_vencimiento_idx" ON "Pago"("fecha_vencimiento");

-- CreateIndex
CREATE INDEX "Pago_registrado_por_idx" ON "Pago"("registrado_por");

-- CreateIndex
CREATE INDEX "Pago_fecha_pago_idx" ON "Pago"("fecha_pago");

-- CreateIndex
CREATE INDEX "Asistencia_usuario_id_fecha_hora_idx" ON "Asistencia"("usuario_id", "fecha_hora");

-- CreateIndex
CREATE INDEX "Asistencia_fecha_hora_idx" ON "Asistencia"("fecha_hora");

-- CreateIndex
CREATE INDEX "Rutina_usuario_id_actualizada_en_idx" ON "Rutina"("usuario_id", "actualizada_en");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_sede_id_fkey" FOREIGN KEY ("sede_id") REFERENCES "Sede"("id_sede") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_registrado_por_fkey" FOREIGN KEY ("registrado_por") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asistencia" ADD CONSTRAINT "Asistencia_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rutina" ADD CONSTRAINT "Rutina_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
