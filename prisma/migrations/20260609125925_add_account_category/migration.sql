-- CreateEnum
CREATE TYPE "AccountCategory" AS ENUM ('Pensions', 'StockISA', 'Shares', 'Savings');

-- AlterTable
ALTER TABLE "InvestmentAccount" ADD COLUMN     "category" "AccountCategory" NOT NULL DEFAULT 'Savings';
