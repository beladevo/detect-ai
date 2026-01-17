import { put } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";

export type ServerLogLevel = "Error" | "Warn" | "Info" | "Log" | "System";

type ServerLogPayload = {
  level?: ServerLogLevel;
  source?: string;
  service?: string;
  message?: string;
  additional?: string;
  request?: Request;
};

const normalize = (value: unknown) => {
  if (typeof value !== "string") return "";
  return value.replace(/[\r\n]+/g, " ").trim();
};

const resolveIp = (request?: Request) => {
  if (!request) return "";
  const forwarded = request.headers.get("x-forwarded-for") || "";
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "";
  }
  return request.headers.get("x-real-ip") || "";
};

export async function logServerEvent(payload: ServerLogPayload) {
  const level = payload.level || "Log";
  const source = normalize(payload.source) || "System";
  const service = normalize(payload.service);
  const message = normalize(payload.message) || "Log event";
  const additional = normalize(payload.additional);
  const userAgent = normalize(payload.request?.headers.get("user-agent"));
  const ip = resolveIp(payload.request);
  const timestamp = new Date().toISOString();
  const line = `[${level}] ${source}${service ? ` - ${service}` : ""}: ${message} - ${ip} - ${userAgent} - ${additional || "-"} - ${timestamp}\n`;

  const useBlobStorage =
    process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_TOKEN;

  if (useBlobStorage) {
    const safeTimestamp = timestamp.replace(/[:.]/g, "-");
    const folder = timestamp.slice(0, 10);
    const fileName = `logs/${folder}/${safeTimestamp}-${crypto.randomUUID()}.log`;
    await put(fileName, line, {
      access: "public",
      contentType: "text/plain",
    });
    return;
  }

  const dir = path.join(process.cwd(), "data");
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, "logs.log");
  await fs.appendFile(filePath, line, "utf8");
}
