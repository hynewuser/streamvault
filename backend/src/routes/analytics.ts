import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";

export async function analyticsRoutes(app: FastifyInstance) {
  // ❌ REMOVED: app.addHook("onRequest", authGuard);

  app.get("/overview", async () => {
    const [streams, messages, authors, alerts, exportsCount] =
      await Promise.all([
        prisma.stream.count(),
        prisma.message.count(),
        prisma.author.count(),
        prisma.alertRule.count(),
        prisma.exportArchive.count(),
      ]);

    const liveCount = await prisma.stream.count({
      where: { status: "LIVE" },
    });

    return {
      streams,
      liveStreams: liveCount,
      messages,
      authors,
      alertRules: alerts,
      exports: exportsCount,
    };
  });

  app.get("/velocity", async (req: any) => {
    const minutes = Math.min(parseInt(req.query.minutes ?? "60"), 1440);
    const since = new Date(Date.now() - minutes * 60_000);

    const msgs = await prisma.message.findMany({
      where: { capturedAt: { gte: since } },
      select: { capturedAt: true },
    });

    const buckets: Record<string, number> = {};

    for (const m of msgs) {
      const k = new Date(
        Math.floor(m.capturedAt.getTime() / 60_000) * 60_000
      ).toISOString();

      buckets[k] = (buckets[k] ?? 0) + 1;
    }

    return {
      points: Object.entries(buckets)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([t, c]) => ({ t, c })),
    };
  });

  app.get("/superchats", async () => {
    const items = await prisma.message.findMany({
      where: { type: "superchat" },
      orderBy: { publishedAt: "desc" },
      take: 50,
    });

    return { items };
  });
}
