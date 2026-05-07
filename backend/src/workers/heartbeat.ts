import { logger } from "../lib/logger";
import { metrics } from "../lib/metrics";
import { eventBus } from "../lib/eventBus";
import { BackgroundWorker } from "./index";

export async function startHeartbeat(): Promise<BackgroundWorker> {
  const interval = setInterval(() => {
    const data = {
      ts: Date.now(),
      activeStreams: metrics.activeStreams,
      messagesPerMin: metrics.messagesPerMin(),
      total: metrics.messagesTotal,
    };
    eventBus.emit("system", { type: "heartbeat", ...data });
    logger.debug(data, "❤️  heartbeat");
  }, 5000);

  return {
    name: "heartbeat",
    stop: async () => clearInterval(interval),
  };
}
