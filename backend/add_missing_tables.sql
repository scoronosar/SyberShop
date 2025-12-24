-- Run this on production database to add missing tables
-- Usage: psql -U postgres -d sybershop -f add_missing_tables.sql

-- CreateTable (if not exists)
CREATE TABLE IF NOT EXISTS "TaoworldToken" (
    "id" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "refreshExpiresAt" TIMESTAMP(3),
    "accountId" TEXT,
    "sellerId" TEXT,
    "userId" TEXT,
    "accountPlatform" TEXT,
    "shortCode" TEXT,
    "account" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaoworldToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable (if not exists)
CREATE TABLE IF NOT EXISTS "CurrencyRate" (
    "id" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "rateFromCNY" DECIMAL(14,4) NOT NULL,
    "markup" DECIMAL(5,2) NOT NULL DEFAULT 1.05,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CurrencyRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable (if not exists)
CREATE TABLE IF NOT EXISTS "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable (if not exists)
CREATE TABLE IF NOT EXISTS "ProductCategory" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "icon" TEXT,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS "TaoworldToken_accessToken_key" ON "TaoworldToken"("accessToken");

-- CreateIndex (if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS "CurrencyRate_currency_key" ON "CurrencyRate"("currency");

-- CreateIndex (if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS "Favorite_userId_productId_key" ON "Favorite"("userId", "productId");

-- CreateIndex (if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS "ProductCategory_code_key" ON "ProductCategory"("code");

-- AddForeignKey (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Favorite_userId_fkey'
    ) THEN
        ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ProductCategory_parentId_fkey'
    ) THEN
        ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_parentId_fkey" 
        FOREIGN KEY ("parentId") REFERENCES "ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

