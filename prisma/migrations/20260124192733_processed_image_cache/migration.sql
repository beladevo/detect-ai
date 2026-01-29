-- CreateTable
CREATE TABLE "ProcessedImage" (
    "id" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "lastAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProcessedImage_fileHash_key" ON "ProcessedImage"("fileHash");

-- CreateIndex
CREATE INDEX "ProcessedImage_lastAccessedAt_idx" ON "ProcessedImage"("lastAccessedAt");
