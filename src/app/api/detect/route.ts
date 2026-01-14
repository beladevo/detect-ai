import { NextResponse } from "next/server";
import { detectAIFromBuffer } from "@/src/lib/nodeDetector";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await detectAIFromBuffer(buffer);
    return NextResponse.json({
      score: Math.round(result.confidence * 100),
      model: result.model,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Detection failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
