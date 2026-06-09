-- CreateEnum
CREATE TYPE "EntryType" AS ENUM ('Income', 'Bill', 'CreditCardPayment');

-- CreateTable
CREATE TABLE "Month" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Month_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "monthId" TEXT NOT NULL,
    "type" "EntryType" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestmentAccount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestmentAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestmentSnapshot" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "monthId" TEXT NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestmentSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Month_identifier_key" ON "Month"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "InvestmentAccount_name_key" ON "InvestmentAccount"("name");

-- CreateIndex
CREATE UNIQUE INDEX "InvestmentSnapshot_accountId_monthId_key" ON "InvestmentSnapshot"("accountId", "monthId");

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_monthId_fkey" FOREIGN KEY ("monthId") REFERENCES "Month"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentSnapshot" ADD CONSTRAINT "InvestmentSnapshot_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "InvestmentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentSnapshot" ADD CONSTRAINT "InvestmentSnapshot_monthId_fkey" FOREIGN KEY ("monthId") REFERENCES "Month"("id") ON DELETE CASCADE ON UPDATE CASCADE;
