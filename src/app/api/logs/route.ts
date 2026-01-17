import { NextResponse } from "next/server";
import { logServerEvent, type ServerLogLevel } from "@/src/lib/loggerServer";

export const runtime = "nodejs";

type LogPayload = {
  level?: string;
  source?: string;
  service?: string;
  message?: string;
  additional?: string;
};

const normalize = (value: unknown) => {
  if (typeof value !== "string") return "";
  return value.replace(/[\r\n]+/g, " ").trim();
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as LogPayload;
    const level = (normalize(payload.level) || "Log") as ServerLogLevel;
    await logServerEvent({
      level,
      source: normalize(payload.source) || "System",
      service: normalize(payload.service),
      message: normalize(payload.message) || "Log event",
      additional: normalize(payload.additional),
      request,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    await logServerEvent({
      level: "Error",
      source: "Backend",
      service: "Logs",
      message: "Log ingestion failed",
      additional: error instanceof Error ? error.message : "Unknown error",
      request,
    });
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
