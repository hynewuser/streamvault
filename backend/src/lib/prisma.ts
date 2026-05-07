import { PrismaClient } from "@prisma/client";
import { logger } from "./logger";

export const prisma = new PrismaClient({
  log: [
    { emit: "event", level: "error" },
    { emit: "event", level: "warn" },
  ],
});

prisma.$on("error" as never, (e: any) => logger.error({ e }, "prisma error"));
prisma.$on("warn" as never, (e: any) => logger.warn({ e }, "prisma warn"));
