export type LogLevel = "Error" | "Warn" | "Info" | "Log" | "System";

export type LogPayload = {
  level: LogLevel;
  source: string;
  service?: string;
  message: string;
  additional?: string;
};

const LOG_ENDPOINT = "/api/logs";

import { env } from "@/src/lib/env";

export async function logClientEvent(payload: LogPayload): Promise<void> {
  // Disable remote logging in development
  if (env.IS_DEV) {
    if (payload.level === "Error") {
        console.error("[DEV LOG]", payload);
    }
    return;
  }

  try {
    await fetch(LOG_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Best-effort logging only.
  }
}
