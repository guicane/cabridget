-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "currency" TEXT NOT NULL DEFAULT '$',

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);
