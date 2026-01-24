import { createClient } from "redis";
import type { RedisClientType } from "redis";

const redisUrl = process.env.REDIS_URL?.trim() || "redis://localhost:6379";

let client: RedisClientType | null = null;
let connectPromise: Promise<RedisClientType> | null = null;

export async function getRedisClient(): Promise<RedisClientType> {
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
