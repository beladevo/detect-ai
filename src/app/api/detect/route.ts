import { NextResponse } from "next/server";
import { detectAIFromBuffer } from "@/src/lib/nodeDetector";
import { scoreFromConfidence } from "@/src/lib/scoreUtils";
import { MODEL_NAME } from "@/src/lib/modelConfigs";
import { logServerEvent } from "@/src/lib/loggerServer";

export const runtime = "nodejs";

export async function POST(request: Request) {
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
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
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
    const result = await detectAIFromBuffer(buffer);
    const score = scoreFromConfidence(result.confidence);
    await logServerEvent({
      level: "Info",
      source: "Backend",
      service: "Detect",
      message: "Inference complete",
      additional: JSON.stringify({ score, model: result.model }),
      request,
    });
    return NextResponse.json({
      score,
      model: result.model,
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
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
