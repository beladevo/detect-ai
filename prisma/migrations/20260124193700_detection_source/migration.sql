-- Add detection source tracking for API telemetry
ALTER TABLE "Detection"
ADD COLUMN "detectionSource" TEXT NOT NULL DEFAULT 'website';

CREATE INDEX "Detection_detectionSource_createdAt_idx"
  ON "Detection" ("detectionSource", "createdAt");
