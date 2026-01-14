import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const sizeSeed = buffer.byteLength % 100;
  const score = Math.min(98, Math.max(4, 60 + (sizeSeed % 35)));

  return NextResponse.json({
    score,
    model: "elite-vision-stub",
  });
}
