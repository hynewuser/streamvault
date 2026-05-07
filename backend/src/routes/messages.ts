import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authGuard } from "../lib/auth";
import { safeJSON } from "../lib/util";

const querySchema = z.object({
  streamId: z.string().optional(),
  videoId: z.string().optional(),
  channelId: z.string().optional(),
  q: z.string().optional(),
  type: z.string().optional(),
  isMember: z.coerce.boolean().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.coerce.number().min(1).max(500).default(100),
  cursor: z.string().optional(),
});

export async function messageRoutes(app: FastifyInstance) {
  app.addHook("onRequest", authGuard);

  app.get("/", async (req) => {
    const q = querySchema.parse(req.query);
    const where: any = {};
    if (q.streamId) where.streamId = q.streamId;
    if (q.videoId) where.videoId = q.videoId;
    if (q.channelId) where.authorChannelId = q.channelId;
    if (q.type) where.type = q.type;
    if (typeof q.isMember === "boolean") where.isMember = q.isMember;
    if (q.q) where.text = { contains: q.q };
    if (q.from || q.to) {
      where.publishedAt = {};
      if (q.from) where.publishedAt.gte = new Date(q.from);
      if (q.to) where.publishedAt.lte = new Date(q.to);
    }

    const items = await prisma.message.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      take: q.limit + 1,
      ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
    });

    const hasMore = items.length > q.limit;
    const slice = hasMore ? items.slice(0, q.limit) : items;
    const nextCursor = hasMore ? slice[slice.length - 1].id : null;

    return {
      items: slice.map((m) => ({
        ...m,
        badges: safeJSON(m.badges, [] as string[]),
        emojis: safeJSON(m.emojis, [] as string[]),
      })),
      nextCursor,
    };
  });

  app.get("/recent", async (req: any) => {
    const limit = Math.min(parseInt(req.query.limit ?? "50"), 200);
    const items = await prisma.message.findMany({
      orderBy: { capturedAt: "desc" },
      take: limit,
    });
    return {
      items: items.map((m) => ({
        ...m,
        badges: safeJSON(m.badges, [] as string[]),
        emojis: safeJSON(m.emojis, [] as string[]),
      })),
    };
  });

  app.get("/stats/top-chatters", async (req: any) => {
    const limit = Math.min(parseInt(req.query.limit ?? "20"), 100);
    const top = await prisma.message.groupBy({
      by: ["authorChannelId", "authorName"],
      _count: { _all: true },
      orderBy: { _count: { authorChannelId: "desc" } },
      take: limit,
    });
    return {
      items: top.map((t) => ({
        channelId: t.authorChannelId,
        name: t.authorName,
        count: t._count._all,
      })),
    };
  });
}
