-- CreateEnum
CREATE TYPE "ServerLogLevel" AS ENUM ('Error', 'Warn', 'Info', 'Log', 'System');

-- CreateTable
CREATE TABLE "ServerLog" (
    "id" TEXT NOT NULL,
    "level" "ServerLogLevel" NOT NULL,
    "source" TEXT NOT NULL,
    "service" TEXT,
    "message" TEXT NOT NULL,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServerLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServerLog_level_idx" ON "ServerLog"("level");

-- CreateIndex
CREATE INDEX "ServerLog_createdAt_idx" ON "ServerLog"("createdAt");
