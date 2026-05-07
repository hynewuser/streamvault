import IORedis, { Redis } from "ioredis";
import { config } from "../config";
import { logger } from "./logger";

let client: Redis | null = null;

export function getRedis(): Redis | null {
  if (!config.redis.enabled) return null;
  if (client) return client;
  try {
    client = new IORedis(config.redis.url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      lazyConnect: false,
    });
    client.on("error", (e) => logger.warn({ e }, "redis error"));
    client.on("connect", () => logger.info("✅ Redis connected"));
    return client;
  } catch (err) {
    logger.warn({ err }, "Redis unavailable, falling back");
    return null;
  }
}
