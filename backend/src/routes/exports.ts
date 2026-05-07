import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { authGuard } from "../lib/auth";
import { runExport } from "../engine/exportEngine";

export async function exportRoutes(app: FastifyInstance) {
  app.addHook("onRequest", authGuard);

  app.get("/", async () => {
    const items = await prisma.exportArchive.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return { items };
  });

  app.post("/run", async (req: any) => {
    const streamId = req.body?.streamId ?? null;
    const result = await runExport({ streamId });
    return { ok: true, archives: result };
  });

  app.delete("/:id", async (req: any) => {
    await prisma.exportArchive.delete({ where: { id: req.params.id } });
    return { ok: true };
  });
}
