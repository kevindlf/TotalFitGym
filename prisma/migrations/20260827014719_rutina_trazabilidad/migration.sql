-- AlterTable
ALTER TABLE "Rutina" ADD COLUMN     "nombre_archivo" TEXT NOT NULL,
ADD COLUMN     "subida_por" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Rutina_subida_por_idx" ON "Rutina"("subida_por");

-- AddForeignKey
ALTER TABLE "Rutina" ADD CONSTRAINT "Rutina_subida_por_fkey" FOREIGN KEY ("subida_por") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

