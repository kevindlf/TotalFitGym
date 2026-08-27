-- Aislamiento por sede (Regla de Oro 5).
--
-- `Pago` y `Asistencia` pasan a guardar su propia sede en vez de deducirla del
-- socio. Sin esto, trasladar un socio de sucursal le movería el historial
-- entero y reescribiría la caja pasada de las dos sedes.
--
-- Escrita a mano y no con `prisma migrate dev`: el rol `totalfit` no tiene
-- CREATEDB y no puede crear la shadow database (P3014). Además el SQL que
-- genera `migrate diff` hace `ADD COLUMN ... NOT NULL` de una, que explota
-- sobre tablas con filas. Acá va en tres pasos: agregar nullable, rellenar
-- desde el socio, recién entonces exigir NOT NULL.

-- AlterEnum
ALTER TYPE "Rol" ADD VALUE 'DUENIO';

-- AlterTable: Pago
ALTER TABLE "Pago" ADD COLUMN "sede_id" TEXT;

UPDATE "Pago" p
SET "sede_id" = u."sede_id"
FROM "Usuario" u
WHERE u."id" = p."usuario_id";

ALTER TABLE "Pago" ALTER COLUMN "sede_id" SET NOT NULL;

-- AlterTable: Asistencia
ALTER TABLE "Asistencia" ADD COLUMN "sede_id" TEXT;

UPDATE "Asistencia" a
SET "sede_id" = u."sede_id"
FROM "Usuario" u
WHERE u."id" = a."usuario_id";

ALTER TABLE "Asistencia" ALTER COLUMN "sede_id" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Pago_sede_id_fecha_pago_idx" ON "Pago"("sede_id", "fecha_pago");
CREATE INDEX "Asistencia_sede_id_fecha_hora_idx" ON "Asistencia"("sede_id", "fecha_hora");

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_sede_id_fkey" FOREIGN KEY ("sede_id") REFERENCES "Sede"("id_sede") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Asistencia" ADD CONSTRAINT "Asistencia_sede_id_fkey" FOREIGN KEY ("sede_id") REFERENCES "Sede"("id_sede") ON DELETE RESTRICT ON UPDATE CASCADE;
