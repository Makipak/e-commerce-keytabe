-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "designNo" INTEGER;

-- Backfill: nomor urut desain per kategori, berdasarkan urutan dibuat
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY category ORDER BY "createdAt") AS rn
  FROM "Product"
)
UPDATE "Product" p
SET "designNo" = numbered.rn
FROM numbered
WHERE p.id = numbered.id;

ALTER TABLE "Product" ALTER COLUMN "designNo" SET NOT NULL;
