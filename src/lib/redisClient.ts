import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL?.trim();
let client: Awaited<ReturnType<typeof createClient>> | null = null;
let connectPromise: Promise<Awaited<ReturnType<typeof createClient>>> | null = null;

export const hasRedisConfigured = Boolean(redisUrl);

if (!redisUrl) {
  console.warn("[Redis] REDIS_URL not configured - rate limiting will use in-memory fallback");
} else {
  console.log("[Redis] REDIS_URL configured, will connect on first use");
}

export async function getRedisClient(): Promise<Awaited<ReturnType<typeof createClient>>> {
  if (!redisUrl) {
    throw new Error("Redis URL not configured");
  }

  if (client && client.isOpen) {
    return client;
  }

  if (connectPromise) {
    return connectPromise;
  }

  connectPromise = (async () => {
    const nextClient = createClient({ url: redisUrl });
    nextClient.on("error", (error) => {
      console.error("[Redis] Connection error:", error);
    });
    await nextClient.connect();
    console.log("[Redis] Connected successfully");
    client = nextClient;
    connectPromise = null;
    return nextClient;
  })();

  return connectPromise;
}
