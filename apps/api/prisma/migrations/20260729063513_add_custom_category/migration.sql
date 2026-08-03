-- AlterEnum
ALTER TYPE "Category" ADD VALUE 'OTH';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "categoryLabel" TEXT;
