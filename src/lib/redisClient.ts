import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL?.trim();
let client: Awaited<ReturnType<typeof createClient>> | null = null;
let connectPromise: Promise<Awaited<ReturnType<typeof createClient>>> | null = null;

export const hasRedisConfigured = Boolean(redisUrl);

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
      console.error("[Redis]", error);
    });
    await nextClient.connect();
    client = nextClient;
    connectPromise = null;
    return nextClient;
  })();

  return connectPromise;
}
