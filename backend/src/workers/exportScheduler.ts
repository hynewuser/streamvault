import cron from "node-cron";
import { config } from "../config";
import { logger } from "../lib/logger";
import { runExport } from "../engine/exportEngine";
import { BackgroundWorker } from "./index";

export async function startExportScheduler(): Promise<BackgroundWorker> {
  // Every N hours at minute 0
  const hours = Math.max(1, config.exports.intervalHours);
  const expr = `0 */${hours} * * *`;
  logger.info({ cron: expr }, "📅 export scheduler armed");

  const task = cron.schedule(expr, async () => {
    try {
      logger.info("⏰ running scheduled export");
      const end = new Date();
      const start = new Date(end.getTime() - hours * 3600_000);
      await runExport({ windowStart: start, windowEnd: end });
    } catch (err) {
      logger.error({ err }, "scheduled export failed");
    }
  });

  return {
    name: "export-scheduler",
    stop: async () => {
      task.stop();
    },
  };
}
