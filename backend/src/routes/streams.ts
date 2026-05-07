import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authGuard } from "../lib/auth";
import { scraperManager } from "../engine/scraperManager";
import { eventBus } from "../lib/eventBus";

const addSchema = z.object({
  videoId: z.string().min(5).max(50),
  title: z.string().optional(),
});

export async function streamRoutes(app: FastifyInstance) {
  app.addHook("onRequest", authGuard);

  app.get("/", async () => {
    const streams = await prisma.stream.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return { streams };
  });

  app.get("/:id", async (req: any, reply) => {
    const s = await prisma.stream.findUnique({ where: { id: req.params.id } });
    if (!s) return reply.status(404).send({ error: "not_found" });
    return { stream: s };
  });

  app.post("/", async (req, reply) => {
    const parsed = addSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
    const { videoId, title } = parsed.data;

    const existing = await prisma.stream.findUnique({ where: { videoId } });
    if (existing) {
      await scraperManager.start(existing.id);
      return { stream: existing, resumed: true };
    }

    const s = await prisma.stream.create({
      data: { videoId, title: title ?? null, status: "PENDING" },
    });
    eventBus.emit("stream_update", s);
    await scraperManager.start(s.id);
    return reply.status(201).send({ stream: s });
  });

  app.delete("/:id", async (req: any) => {
    await scraperManager.stop(req.params.id);
    await prisma.stream.delete({ where: { id: req.params.id } });
    return { ok: true };
  });

  app.post("/:id/restart", async (req: any) => {
    await scraperManager.stop(req.params.id);
    await scraperManager.start(req.params.id);
    return { ok: true };
  });

  app.post("/:id/stop", async (req: any) => {
    await scraperManager.stop(req.params.id);
    await prisma.stream.update({
      where: { id: req.params.id },
      data: { status: "OFFLINE" },
    });
    return { ok: true };
  });
}
