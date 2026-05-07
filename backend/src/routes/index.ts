import { FastifyInstance } from "fastify";
import { healthRoutes } from "./health";
import { authRoutes } from "./auth";
import { streamRoutes } from "./streams";
import { messageRoutes } from "./messages";
import { alertRoutes } from "./alerts";
import { exportRoutes } from "./exports";
import { settingsRoutes } from "./settings";
import { analyticsRoutes } from "./analytics";

export async function registerRoutes(app: FastifyInstance) {
  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(streamRoutes, { prefix: "/api/streams" });
  await app.register(messageRoutes, { prefix: "/api/messages" });
  await app.register(alertRoutes, { prefix: "/api/alerts" });
  await app.register(exportRoutes, { prefix: "/api/exports" });
  await app.register(settingsRoutes, { prefix: "/api/settings" });
  await app.register(analyticsRoutes, { prefix: "/api/analytics" });
}
