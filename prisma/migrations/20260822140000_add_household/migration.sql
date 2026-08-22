-- Introduce Household as the owner of all financial data, in
-- preparation for real multi-tenant accounts later. A single default
-- household is seeded and every existing row is backfilled onto it, so
-- this migration is a no-op from the app's point of view today.

-- CreateTable
CREATE TABLE "Household" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Household_pkey" PRIMARY KEY ("id")
);

INSERT INTO "Household" ("id", "name", "updatedAt")
VALUES ('default-household', 'My Household', CURRENT_TIMESTAMP);

-- Month
ALTER TABLE "Month" ADD COLUMN "householdId" TEXT;
UPDATE "Month" SET "householdId" = 'default-household';
ALTER TABLE "Month" ALTER COLUMN "householdId" SET NOT NULL;
ALTER TABLE "Month" DROP CONSTRAINT IF EXISTS "Month_identifier_key";
ALTER TABLE "Month" ADD CONSTRAINT "Month_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "Month_householdId_identifier_key" ON "Month"("householdId", "identifier");

-- Income
ALTER TABLE "Income" ADD COLUMN "householdId" TEXT;
UPDATE "Income" SET "householdId" = 'default-household';
ALTER TABLE "Income" ALTER COLUMN "householdId" SET NOT NULL;
ALTER TABLE "Income" ADD CONSTRAINT "Income_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RecurringIncome
ALTER TABLE "RecurringIncome" ADD COLUMN "householdId" TEXT;
UPDATE "RecurringIncome" SET "householdId" = 'default-household';
ALTER TABLE "RecurringIncome" ALTER COLUMN "householdId" SET NOT NULL;
ALTER TABLE "RecurringIncome" ADD CONSTRAINT "RecurringIncome_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RecurringBill
ALTER TABLE "RecurringBill" ADD COLUMN "householdId" TEXT;
UPDATE "RecurringBill" SET "householdId" = 'default-household';
ALTER TABLE "RecurringBill" ALTER COLUMN "householdId" SET NOT NULL;
ALTER TABLE "RecurringBill" ADD CONSTRAINT "RecurringBill_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- MonthlyBill
ALTER TABLE "MonthlyBill" ADD COLUMN "householdId" TEXT;
UPDATE "MonthlyBill" SET "householdId" = 'default-household';
ALTER TABLE "MonthlyBill" ALTER COLUMN "householdId" SET NOT NULL;
ALTER TABLE "MonthlyBill" ADD CONSTRAINT "MonthlyBill_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreditCard
ALTER TABLE "CreditCard" ADD COLUMN "householdId" TEXT;
UPDATE "CreditCard" SET "householdId" = 'default-household';
ALTER TABLE "CreditCard" ALTER COLUMN "householdId" SET NOT NULL;
ALTER TABLE "CreditCard" DROP CONSTRAINT IF EXISTS "CreditCard_name_key";
ALTER TABLE "CreditCard" ADD CONSTRAINT "CreditCard_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "CreditCard_householdId_name_key" ON "CreditCard"("householdId", "name");

-- CreditCardStatement
ALTER TABLE "CreditCardStatement" ADD COLUMN "householdId" TEXT;
UPDATE "CreditCardStatement" SET "householdId" = 'default-household';
ALTER TABLE "CreditCardStatement" ALTER COLUMN "householdId" SET NOT NULL;
ALTER TABLE "CreditCardStatement" ADD CONSTRAINT "CreditCardStatement_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- InvestmentAccount
ALTER TABLE "InvestmentAccount" ADD COLUMN "householdId" TEXT;
UPDATE "InvestmentAccount" SET "householdId" = 'default-household';
ALTER TABLE "InvestmentAccount" ALTER COLUMN "householdId" SET NOT NULL;
ALTER TABLE "InvestmentAccount" DROP CONSTRAINT IF EXISTS "InvestmentAccount_name_key";
ALTER TABLE "InvestmentAccount" ADD CONSTRAINT "InvestmentAccount_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "InvestmentAccount_householdId_name_key" ON "InvestmentAccount"("householdId", "name");

-- InvestmentSnapshot
ALTER TABLE "InvestmentSnapshot" ADD COLUMN "householdId" TEXT;
UPDATE "InvestmentSnapshot" SET "householdId" = 'default-household';
ALTER TABLE "InvestmentSnapshot" ALTER COLUMN "householdId" SET NOT NULL;
ALTER TABLE "InvestmentSnapshot" ADD CONSTRAINT "InvestmentSnapshot_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Settings: was a single hardcoded id="global" row; becomes one row per
-- household, keyed by householdId instead.
ALTER TABLE "Settings" ADD COLUMN "householdId" TEXT;
UPDATE "Settings" SET "householdId" = 'default-household';
ALTER TABLE "Settings" ALTER COLUMN "householdId" SET NOT NULL;
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "Settings_householdId_key" ON "Settings"("householdId");
