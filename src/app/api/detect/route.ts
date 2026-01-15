import { NextResponse } from "next/server";
import { detectAIFromBuffer } from "@/src/lib/nodeDetector";
import { scoreFromConfidence } from "@/src/lib/scoreUtils";
import { MODEL_NAME } from "@/src/lib/modelConfigs";

export const runtime = "nodejs";

export async function POST(request: Request) {
  console.info("API /detect: request received");
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    console.warn("API /detect: missing file");
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    console.info("API /detect: running inference", {
      name: file.name,
      size: file.size,
      type: file.type,
      model: MODEL_NAME,
    });
    const result = await detectAIFromBuffer(buffer);
    const score = scoreFromConfidence(result.confidence);
    console.info("API /detect: inference complete", {
      score,
      model: result.model,
    });
    return NextResponse.json({
      score,
      model: result.model,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Detection failed";
    console.error("API /detect: error", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
