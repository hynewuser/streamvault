import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authGuard } from "../lib/auth";
import { safeJSON } from "../lib/util";
import { config } from "../config";

const ruleSchema = z.object({
  name: z.string().min(1),
  channelIds: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  ntfyTopic: z.string().default(""),
  enabled: z.boolean().default(true),
  matchAny: z.boolean().default(true),
});

export async function alertRoutes(app: FastifyInstance) {
  app.addHook("onRequest", authGuard);

  app.get("/", async () => {
    const items = await prisma.alertRule.findMany({ orderBy: { createdAt: "desc" } });
    return {
      items: items.map((r) => ({
        ...r,
        channelIds: safeJSON(r.channelIds, [] as string[]),
        keywords: safeJSON(r.keywords, [] as string[]),
      })),
    };
  });

  app.post("/", async (req, reply) => {
    const parsed = ruleSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
    const data = parsed.data;
    const rule = await prisma.alertRule.create({
      data: {
        name: data.name,
        channelIds: JSON.stringify(data.channelIds),
        keywords: JSON.stringify(data.keywords),
        ntfyTopic: data.ntfyTopic || config.ntfy.defaultTopic,
        enabled: data.enabled,
        matchAny: data.matchAny,
      },
    });
    return reply.status(201).send({ rule });
  });

  app.put("/:id", async (req: any, reply) => {
    const parsed = ruleSchema.partial().safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
    const data: any = { ...parsed.data };
    if (data.channelIds) data.channelIds = JSON.stringify(data.channelIds);
    if (data.keywords) data.keywords = JSON.stringify(data.keywords);
    const r = await prisma.alertRule.update({ where: { id: req.params.id }, data });
    return { rule: r };
  });

  app.delete("/:id", async (req: any) => {
    await prisma.alertRule.delete({ where: { id: req.params.id } });
    return { ok: true };
  });

  app.get("/events", async (req: any) => {
    const limit = Math.min(parseInt(req.query.limit ?? "100"), 500);
    const items = await prisma.notificationEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return { items };
  });
}
