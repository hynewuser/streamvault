import "dotenv/config";
import { buildApp } from "./app";
import { config } from "./config";
import { logger } from "./lib/logger";
import { startWorkers } from "./workers";
import { gracefulShutdown } from "./lib/shutdown";

async function main() {
  const app = await buildApp();

  await app.listen({ port: config.backend.port, host: config.backend.host });
  logger.info(`🚀 StreamVault API listening on :${config.backend.port}`);

  // start background workers in-process (single-container mode)
  const workers = await startWorkers(app);

  gracefulShutdown(async () => {
    logger.info("⏳ Shutting down gracefully...");
    await Promise.allSettled(workers.map((w) => w.stop()));
    await app.close();
    logger.info("👋 Goodbye");
  });
}

main().catch((err) => {
  logger.fatal({ err }, "Fatal startup error");
  process.exit(1);
});
