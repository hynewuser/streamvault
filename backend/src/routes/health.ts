import { FastifyInstance } from "fastify";
import os from "node:os";
import { prisma } from "../lib/prisma";
import { getRedis } from "../lib/redis";
import { metrics } from "../lib/metrics";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async () => ({ ok: true, ts: Date.now() }));

  app.get("/health/full", async () => {
    let dbOk = false;
    try {
      await prisma.$queryRawUnsafe("SELECT 1");
      dbOk = true;
    } catch {}
    const r = getRedis();
    let redisOk = false;
    try {
      if (r) redisOk = (await r.ping()) === "PONG";
    } catch {}

    const mem = process.memoryUsage();
    const cpus = os.cpus();
    const cpuPct =
      cpus.reduce((acc, c) => {
        const total = Object.values(c.times).reduce((a, b) => a + b, 0);
        return acc + (1 - c.times.idle / total);
      }, 0) /
      cpus.length *
      100;

    return {
      uptimeSec: Math.floor(process.uptime()),
      memMB: Math.round(mem.rss / 1024 / 1024),
      cpuPct: +cpuPct.toFixed(1),
      activeStreams: metrics.activeStreams,
      workers: metrics.workers,
      queueDepth: metrics.queueDepth,
      messagesPerMin: metrics.messagesPerMin(),
      redis: redisOk,
      db: dbOk,
    };
  });

  app.get("/metrics", async (_req, reply) => {
    reply.type("text/plain");
    return metrics.prometheus();
  });
}
