-- CreateEnum
CREATE TYPE "PricingSurveyResponse" AS ENUM ('YEAH_SURE', 'NOT_REALLY', 'MAYBE');

-- CreateTable
CREATE TABLE "PricingSurvey" (
    "id" TEXT NOT NULL,
    "response" "PricingSurveyResponse" NOT NULL,
    "userId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PricingSurvey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PricingSurvey_response_idx" ON "PricingSurvey"("response");

-- CreateIndex
CREATE INDEX "PricingSurvey_createdAt_idx" ON "PricingSurvey"("createdAt");

-- CreateIndex
CREATE INDEX "PricingSurvey_ipAddress_createdAt_idx" ON "PricingSurvey"("ipAddress", "createdAt");
