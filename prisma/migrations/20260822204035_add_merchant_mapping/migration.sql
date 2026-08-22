-- DropIndex
DROP INDEX "CreditCard_name_key";

-- DropIndex
DROP INDEX "InvestmentAccount_name_key";

-- DropIndex
DROP INDEX "Month_identifier_key";

-- AlterTable
ALTER TABLE "Settings" ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "MerchantMapping" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "billName" TEXT NOT NULL,
    "billCompany" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MerchantMapping_householdId_pattern_key" ON "MerchantMapping"("householdId", "pattern");

-- AddForeignKey
ALTER TABLE "MerchantMapping" ADD CONSTRAINT "MerchantMapping_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
