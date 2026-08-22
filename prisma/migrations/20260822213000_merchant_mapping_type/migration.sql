-- Add an Income/Bill distinction to MerchantMapping. Existing rows
-- were all bill mappings (Income didn't exist as a concept yet), so
-- they default to 'Bill' and keep their data via a column rename
-- rather than a drop+recreate.

-- CreateEnum
CREATE TYPE "MerchantMappingType" AS ENUM ('Bill', 'Income');

ALTER TABLE "MerchantMapping" ADD COLUMN "type" "MerchantMappingType" NOT NULL DEFAULT 'Bill';
ALTER TABLE "MerchantMapping" RENAME COLUMN "billName" TO "targetName";
ALTER TABLE "MerchantMapping" RENAME COLUMN "billCompany" TO "targetCompany";
