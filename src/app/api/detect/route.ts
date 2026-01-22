import { NextRequest, NextResponse } from "next/server";
import { analyzeImagePipeline } from "@/src/lib/pipeline/analyzeImagePipeline";
import { scoreFromConfidence } from "@/src/lib/scoreUtils";
import { MODEL_NAME } from "@/src/lib/modelConfigs";
import { logServerEvent } from "@/src/lib/loggerServer";
import { checkRateLimit as checkBurstRateLimit, getClientIP } from "@/src/lib/rateLimit";
import { authenticateRequest, checkRateLimit as checkDailyRateLimit } from "@/src/lib/auth/api";
import { prisma } from "@/src/lib/prisma";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const SUPPORTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

// Rate limit: 10 requests per minute per IP
const RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
};

async function logUsage({
  userId,
  ipAddress,
  userAgent,
  statusCode,
  credited,
}: {
  userId: string | null;
  ipAddress: string;
  userAgent: string;
  statusCode: number;
  credited: boolean;
}) {
  try {
    await prisma.usageLog.create({
      data: {
        userId,
        endpoint: "/api/detect",
        method: "POST",
        statusCode,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        credited,
      },
    });
  } catch (error) {
    console.warn("Usage log write failed:", error);
  }
}

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  const userAgent = request.headers.get("user-agent") || "";
  const user = await authenticateRequest(request);
  const userId = user?.id ?? null;

  const dailyAllowed = await checkDailyRateLimit(user, clientIP);
  if (!dailyAllowed) {
    await logServerEvent({
      level: "Warn",
      source: "Backend",
      service: "Detect",
      message: "Daily rate limit exceeded",
      additional: JSON.stringify({ ip: clientIP, userId }),
      request,
    });
    await logUsage({ userId, ipAddress: clientIP, userAgent, statusCode: 429, credited: false });
    const reset = new Date();
    reset.setHours(24, 0, 0, 0);
    return NextResponse.json({
      error: "Daily rate limit exceeded",
      errorType: "DAILY_RATE_LIMIT_EXCEEDED",
      message: "You have reached your daily usage limit. Try again tomorrow.",
      retryAfter: Math.max(0, Math.ceil((reset.getTime() - Date.now()) / 1000)),
    }, { status: 429 });
  }

  const rateLimit = checkBurstRateLimit(clientIP, RATE_LIMIT);

  if (!rateLimit.allowed) {
    await logServerEvent({
      level: "Warn",
      source: "Backend",
      service: "Detect",
      message: "Rate limit exceeded",
      additional: JSON.stringify({ ip: clientIP }),
      request,
    });
    await logUsage({ userId, ipAddress: clientIP, userAgent, statusCode: 429, credited: false });
    return NextResponse.json({
      error: "Too many requests",
      errorType: "RATE_LIMIT_EXCEEDED",
      message: `You've exceeded the rate limit. Please wait ${Math.ceil((rateLimit.resetTime - Date.now()) / 1000)} seconds before trying again.`,
      retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
    }, {
      status: 429,
      headers: {
        "X-RateLimit-Limit": rateLimit.limit.toString(),
        "X-RateLimit-Remaining": rateLimit.remaining.toString(),
        "X-RateLimit-Reset": new Date(rateLimit.resetTime).toISOString(),
        "Retry-After": Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
      },
    });
  }

  await logServerEvent({
    level: "Info",
    source: "Backend",
    service: "Detect",
    message: "Request received",
    request,
  });
  const formData = await request.formData();
  const file = formData.get("file");
  const modelValue = formData.get("model");
  const requestedModel =
    typeof modelValue === "string" && modelValue.trim().length > 0
      ? modelValue.trim()
      : undefined;
  const safeModel =
    requestedModel && !requestedModel.includes("..") && !requestedModel.includes("/") && !requestedModel.includes("\\")
      ? requestedModel
      : undefined;

  if (!file || !(file instanceof File)) {
    await logServerEvent({
      level: "Warn",
      source: "Backend",
      service: "Detect",
      message: "Missing file",
      request,
    });
    await logUsage({ userId, ipAddress: clientIP, userAgent, statusCode: 400, credited: false });
    return NextResponse.json({
      error: "No file provided",
      errorType: "MISSING_FILE",
      message: "Please select an image file to analyze."
    }, { status: 400 });
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    await logServerEvent({
      level: "Warn",
      source: "Backend",
      service: "Detect",
      message: "File too large",
      additional: JSON.stringify({ size: file.size, maxSize: MAX_FILE_SIZE }),
      request,
    });
    await logUsage({ userId, ipAddress: clientIP, userAgent, statusCode: 413, credited: false });
    return NextResponse.json({
      error: "File too large",
      errorType: "FILE_TOO_LARGE",
      message: `File size is ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum allowed: ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
      maxSize: MAX_FILE_SIZE,
      actualSize: file.size,
    }, { status: 413 });
  }

  // Validate file type
  if (!SUPPORTED_TYPES.includes(file.type)) {
    await logServerEvent({
      level: "Warn",
      source: "Backend",
      service: "Detect",
      message: "Unsupported file type",
      additional: JSON.stringify({ type: file.type }),
      request,
    });
    await logUsage({ userId, ipAddress: clientIP, userAgent, statusCode: 415, credited: false });
    return NextResponse.json({
      error: "Unsupported file type",
      errorType: "UNSUPPORTED_TYPE",
      message: `File type '${file.type}' is not supported. Supported formats: JPEG, PNG, WebP, HEIC, HEIF.`,
      supportedTypes: SUPPORTED_TYPES,
    }, { status: 415 });
  }

  try {
    const startTime = performance.now();
    const buffer = Buffer.from(await file.arrayBuffer());
    await logServerEvent({
      level: "Info",
      source: "Backend",
      service: "Detect",
      message: "Running inference",
      additional: JSON.stringify({
        name: file.name,
        size: file.size,
        type: file.type,
        model: MODEL_NAME,
      }),
      request,
    });
    const result = await analyzeImagePipeline(buffer, file.name, { model: safeModel });
    const score = scoreFromConfidence(result.verdict.confidence);
    const processingTimeMs = Math.round(performance.now() - startTime);
    await logServerEvent({
      level: "Info",
      source: "Backend",
      service: "Detect",
      message: "Inference complete",
      additional: JSON.stringify({ score, verdict: result.verdict.verdict }),
      request,
    });

    if (user) {
      const fileHash = result.hashes?.sha256 || "";
      const pipelineSummary = {
        verdict: result.verdict,
        hashes: result.hashes,
        fusion: result.fusion,
        modules: {
          visual: { score: result.visual.visual_artifacts_score, flags: result.visual.flags },
          metadata: { score: result.metadata.metadata_score, flags: result.metadata.flags },
          physics: { score: result.physics.physics_score, flags: result.physics.flags },
          frequency: { score: result.frequency.frequency_score, flags: result.frequency.flags },
          ml: { score: result.ml.ml_score, flags: result.ml.flags },
          provenance: { score: result.provenance.provenance_score, flags: result.provenance.flags },
        },
      };

      try {
        await prisma.$transaction([
          prisma.detection.create({
            data: {
              userId: user.id,
              fileName: file.name,
              fileSize: file.size,
              fileHash,
              score,
              verdict: result.verdict.verdict,
              confidence: result.verdict.confidence,
              status: "COMPLETED",
              processingTime: processingTimeMs,
              modelUsed: safeModel || MODEL_NAME,
              pipelineData: pipelineSummary,
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
      } catch (error) {
        console.warn("Detection persistence failed:", error);
      }
    }

    await logUsage({ userId, ipAddress: clientIP, userAgent, statusCode: 200, credited: true });
    return NextResponse.json({
      score,
      verdict: result.verdict.verdict,
      confidence: result.verdict.confidence,
      uncertainty: result.verdict.uncertainty,
      explanations: result.verdict.explanations,
      hashes: result.hashes,
      modules: {
        visual: result.visual,
        metadata: result.metadata,
        physics: result.physics,
        frequency: result.frequency,
        ml: result.ml,
        provenance: result.provenance,
        fusion: result.fusion,
      },
    }, {
      headers: {
        "X-RateLimit-Limit": rateLimit.limit.toString(),
        "X-RateLimit-Remaining": rateLimit.remaining.toString(),
        "X-RateLimit-Reset": new Date(rateLimit.resetTime).toISOString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Detection failed";
    await logServerEvent({
      level: "Error",
      source: "Backend",
      service: "Detect",
      message: "Detection failed",
      additional: message,
      request,
    });
    await logUsage({ userId, ipAddress: clientIP, userAgent, statusCode: 500, credited: false });

    // Provide more specific error messages
    let errorType = "PROCESSING_ERROR";
    let userMessage = "An error occurred while analyzing the image. Please try again.";

    if (message.includes("timeout")) {
      errorType = "TIMEOUT";
      userMessage = "Analysis took too long. Try with a smaller image or try again later.";
    } else if (message.includes("memory") || message.includes("ENOMEM")) {
      errorType = "OUT_OF_MEMORY";
      userMessage = "Image is too complex to process. Try with a smaller or simpler image.";
    } else if (message.includes("corrupt") || message.includes("invalid")) {
      errorType = "CORRUPTED_FILE";
      userMessage = "The image file appears to be corrupted or invalid. Try a different file.";
    } else if (message.includes("model") || message.includes("ONNX")) {
      errorType = "MODEL_ERROR";
      userMessage = "Model inference failed. Please try again later.";
    }

    return NextResponse.json({
      error: message,
      errorType,
      message: userMessage,
    }, { status: 500 });
  }
}
