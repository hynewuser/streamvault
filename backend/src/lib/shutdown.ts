import { logger } from "./logger";

export function gracefulShutdown(handler: () => Promise<void>) {
  let shuttingDown = false;
  const stop = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`⚡ Received ${signal}`);
    try {
      await Promise.race([
        handler(),
        new Promise((_, rej) => setTimeout(() => rej(new Error("shutdown timeout")), 15000)),
      ]);
      process.exit(0);
    } catch (err) {
      logger.error({ err }, "shutdown error");
      process.exit(1);
    }
  };
  process.on("SIGINT", () => stop("SIGINT"));
  process.on("SIGTERM", () => stop("SIGTERM"));
  process.on("uncaughtException", (err) => {
    logger.fatal({ err }, "uncaughtException");
    stop("uncaughtException");
  });
  process.on("unhandledRejection", (err) => {
    logger.fatal({ err }, "unhandledRejection");
  });
}
