import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

type DetectionLogPayload = {
  fileName?: string;
  fileSize?: number;
  fileHash?: string;
  score?: number;
  verdict?: string;
  confidence?: number;
  modelUsed?: string;
  processingTime?: number;
  pipeline?: {
    verdict?: unknown;
    hashes?: unknown;
    fusion?: unknown;
    modules?: unknown;
  };
};

const normalizeString = (value: unknown, fallback = "") =>
  typeof value === "string" ? value.trim() : fallback;

const clampNumber = (value: unknown, min: number, max: number, fallback: number) => {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.min(max, Math.max(min, value));
};

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = (await request.json().catch(() => ({}))) as DetectionLogPayload;
    const fileName = normalizeString(payload.fileName, "local-detection");
    const fileSize =
      typeof payload.fileSize === "number" && payload.fileSize > 0 ? payload.fileSize : 0;
    const fileHash = normalizeString(payload.fileHash) || `local_${user.id}_${Date.now()}`;
    const score = clampNumber(payload.score, 0, 100, 0);
    const verdict = normalizeString(payload.verdict, "UNKNOWN");
    const confidence = clampNumber(payload.confidence, 0, 1, 0);
    const modelUsed = normalizeString(payload.modelUsed, "local-model");
    const processingTime =
      typeof payload.processingTime === "number" && payload.processingTime > 0
        ? Math.round(payload.processingTime)
        : null;

const sanitizeJsonValue = (value: unknown): Prisma.InputJsonValue | null => {
  if (value === undefined) {
    return null;
  }

  return value as Prisma.InputJsonValue;
};

const pipelineSummary: Prisma.InputJsonObject | null = payload.pipeline
  ? {
      verdict: sanitizeJsonValue(payload.pipeline.verdict),
      hashes: sanitizeJsonValue(payload.pipeline.hashes),
      fusion: sanitizeJsonValue(payload.pipeline.fusion),
      modules: sanitizeJsonValue(payload.pipeline.modules),
    }
  : null;

    await prisma.$transaction([
      prisma.detection.create({
        data: {
          userId: user.id,
          fileName,
          fileSize,
          fileHash,
          score,
          verdict,
          confidence,
          status: "COMPLETED",
          processingTime,
          modelUsed,
          pipelineData: pipelineSummary ?? undefined,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          totalDetections: { increment: 1 },
          monthlyDetections: { increment: 1 },
          lastDetectionAt: new Date(),
        },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Local detection log failed:", error);
    return NextResponse.json(
      { error: "Failed to log detection" },
      { status: 500 }
    );
  }
}
