import { FastifyInstance } from "fastify";
import { logger } from "../lib/logger";
import { startExportScheduler } from "./exportScheduler";
import { startHeartbeat } from "./heartbeat";
import { scraperManager } from "../engine/scraperManager";
import { metrics } from "../lib/metrics";

export interface BackgroundWorker {
  name: string;
  stop: () => Promise<void>;
}

export async function startWorkers(_app: FastifyInstance): Promise<BackgroundWorker[]> {
  const workers: BackgroundWorker[] = [];

  // resume any active streams
  await scraperManager.resumeAll();

  // export scheduler
  workers.push(await startExportScheduler());

  // heartbeat / health stats
  workers.push(await startHeartbeat());

  metrics.workers = workers.length;
  logger.info({ workers: workers.map((w) => w.name) }, "🛠️  workers started");
  return [
    ...workers,
    {
      name: "scraper-manager",
      stop: async () => {
        await scraperManager.stopAll();
      },
    },
  ];
}
