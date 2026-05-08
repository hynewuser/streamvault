import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import staticPlugin from "@fastify/static";
import path from "node:path";
import { Server as IOServer } from "socket.io";

import { config } from "./config";
import { logger } from "./lib/logger";
import { prisma } from "./lib/prisma";
import { registerRoutes } from "./routes";
import { setupWebsocket } from "./ws";
import { eventBus } from "./lib/eventBus";

declare module "fastify" {
  interface FastifyInstance {
    io: IOServer;
    prisma: typeof prisma;
  }

  interface FastifyRequest {
    user?: any;
  }
}

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: logger as any,
    trustProxy: true,
    bodyLimit: 5 * 1024 * 1024,
  });

  // Security headers (still fine to keep)
  await app.register(helmet, { contentSecurityPolicy: false });

  // CORS
  await app.register(cors, {
    origin: config.cors.origin.includes("*") ? true : config.cors.origin,
    credentials: true,
  });

  // Rate limiting (optional, but harmless)
  await app.register(rateLimit, { max: 300, timeWindow: "1 minute" });

  // ❌ REMOVED: JWT AUTH PLUGIN (this disables login system entirely)

  // Static files
  await app.register(staticPlugin, {
    root: path.resolve(config.exports.dir),
    prefix: "/files/",
    decorateReply: false,
  });

  // Attach prisma
  app.decorate("prisma", prisma);

  // WebSocket
  const io = new IOServer(app.server, {
    cors: { origin: true, credentials: true },
    transports: ["websocket", "polling"],
  });

  app.decorate("io", io);
  setupWebsocket(io);

  // Event bus → websocket
  eventBus.on("message", (msg) => io.emit("message", msg));
  eventBus.on("stream_update", (s) => io.emit("stream_update", s));
  eventBus.on("alert", (a) => io.emit("alert", a));
  eventBus.on("system", (e) => io.emit("system", e));

  // Routes (now ALL PUBLIC unless manually protected)
  await registerRoutes(app);

  // Error handler
  app.setErrorHandler((err, req, reply) => {
    req.log.error({ err }, "request error");
    reply.status(err.statusCode ?? 500).send({
      error: err.name,
      message: err.message,
    });
  });

  return app;
}
