import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/src/lib/auth/api";
import { logServerEvent } from "@/src/lib/loggerServer";
import { getClientIP } from "@/src/lib/rateLimit";
import { prisma } from "@/src/lib/prisma";

export const runtime = "nodejs";

const HASH_REGEX = /^[a-fA-F0-9]{64}$/;

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  const userAgent = request.headers.get("user-agent") || "";
  const user = await authenticateRequest(request);

  if (!user) {
    await logServerEvent({
      level: "Warn",
      source: "Backend",
      service: "Cache",
      message: "Hash cache lookup unauthorized",
      additional: JSON.stringify({ ip: clientIP }),
      request,
    });
    return NextResponse.json({ found: false }, { status: 401 });
  }

  let payload: { hash?: unknown };
  try {
    payload = await request.json();
  } catch (error) {
    await logServerEvent({
      level: "Warn",
      source: "Backend",
      service: "Cache",
      message: "Hash cache lookup failed to parse body",
      additional: String(error),
      request,
    });
    return NextResponse.json({ found: false }, { status: 400 });
  }

  const hash = typeof payload.hash === "string" ? payload.hash.trim() : "";
  if (!HASH_REGEX.test(hash)) {
    await logServerEvent({
      level: "Warn",
      source: "Backend",
      service: "Cache",
      message: "Invalid hash provided",
      additional: JSON.stringify({ hash }),
      request,
    });
    return NextResponse.json({ found: false }, { status: 400 });
  }

  try {
    const cached = await prisma.processedImage.findUnique({ where: { fileHash: hash } });
    if (!cached) {
      return NextResponse.json({ found: false });
    }

    await prisma.processedImage.update({
      where: { fileHash: hash },
      data: { lastAccessedAt: new Date() },
    });

    return NextResponse.json({ found: true, payload: cached.payload });
  } catch (error) {
    await logServerEvent({
      level: "Error",
      source: "Backend",
      service: "Cache",
      message: "Hash cache lookup failed",
      additional: String(error),
      request,
    });
    return NextResponse.json({ found: false }, { status: 500 });
  }
}
