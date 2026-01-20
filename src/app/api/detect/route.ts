import { NextResponse } from "next/server";
import { analyzeImagePipeline } from "@/src/lib/pipeline/analyzeImagePipeline";
import { scoreFromConfidence } from "@/src/lib/scoreUtils";
import { MODEL_NAME } from "@/src/lib/modelConfigs";
import { logServerEvent } from "@/src/lib/loggerServer";
import { checkRateLimit, getClientIP } from "@/src/lib/rateLimit";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const SUPPORTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

// Rate limit: 10 requests per minute per IP
const RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
};

export async function POST(request: Request) {
  // Check rate limit
  const clientIP = getClientIP(request);
  const rateLimit = checkRateLimit(clientIP, RATE_LIMIT);

  if (!rateLimit.allowed) {
    await logServerEvent({
      level: "Warn",
      source: "Backend",
      service: "Detect",
      message: "Rate limit exceeded",
      additional: JSON.stringify({ ip: clientIP }),
      request,
    });
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

  if (!file || !(file instanceof File)) {
    await logServerEvent({
      level: "Warn",
      source: "Backend",
      service: "Detect",
      message: "Missing file",
      request,
    });
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
    return NextResponse.json({
      error: "Unsupported file type",
      errorType: "UNSUPPORTED_TYPE",
      message: `File type '${file.type}' is not supported. Supported formats: JPEG, PNG, WebP, HEIC, HEIF.`,
      supportedTypes: SUPPORTED_TYPES,
    }, { status: 415 });
  }

  try {
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
    const result = await analyzeImagePipeline(buffer, file.name);
    const score = scoreFromConfidence(result.verdict.confidence);
    await logServerEvent({
      level: "Info",
      source: "Backend",
      service: "Detect",
      message: "Inference complete",
      additional: JSON.stringify({ score, verdict: result.verdict.verdict }),
      request,
    });
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
