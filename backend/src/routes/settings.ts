import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { authGuard } from "../lib/auth";
import { z } from "zod";

const upsertSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
});

export async function settingsRoutes(app: FastifyInstance) {
  app.addHook("onRequest", authGuard);

  app.get("/", async () => {
    const items = await prisma.setting.findMany();
    return { items };
  });

  app.put("/", async (req, reply) => {
    const parsed = upsertSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
    const item = await prisma.setting.upsert({
      where: { key: parsed.data.key },
      update: { value: parsed.data.value },
      create: { key: parsed.data.key, value: parsed.data.value },
    });
    return { item };
  });
}
