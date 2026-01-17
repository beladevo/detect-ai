import { getMongoClient } from "@/src/lib/mongodb";

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
  const client = getMongoClient();
  if (!client) {
    return;
  }

  const dbName = process.env.MONGODB_DB || "imagion";
  const collectionName = process.env.MONGODB_LOGS_COLLECTION || "logs";

  await client.connect();
  const collection = client.db(dbName).collection(collectionName);
  await collection.insertOne({
    level,
    source,
    service,
    message,
    additional,
    ip,
    userAgent,
    timestamp,
    line,
  });
}
