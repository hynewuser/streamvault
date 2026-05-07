import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";
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
    user?: { sub: string; role: string };
  }
}

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: logger as any,
    trustProxy: true,
    bodyLimit: 5 * 1024 * 1024,
  });

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: config.cors.origin.includes("*") ? true : config.cors.origin,
    credentials: true,
  });
  await app.register(rateLimit, { max: 300, timeWindow: "1 minute" });
  await app.register(jwt, { secret: config.auth.jwtSecret });

  await app.register(staticPlugin, {
    root: path.resolve(config.exports.dir),
    prefix: "/files/",
    decorateReply: false,
  });

  app.decorate("prisma", prisma);

  // websocket
  const io = new IOServer(app.server, {
    cors: { origin: true, credentials: true },
    transports: ["websocket", "polling"],
  });
  app.decorate("io", io);
  setupWebsocket(io);

  // bridge eventBus -> websocket
  eventBus.on("message", (msg) => io.emit("message", msg));
  eventBus.on("stream_update", (s) => io.emit("stream_update", s));
  eventBus.on("alert", (a) => io.emit("alert", a));
  eventBus.on("system", (e) => io.emit("system", e));

  // routes
  await registerRoutes(app);

  app.setErrorHandler((err, req, reply) => {
    req.log.error({ err }, "request error");
    reply.status(err.statusCode ?? 500).send({
      error: err.name,
      message: err.message,
    });
  });

  return app;
}
