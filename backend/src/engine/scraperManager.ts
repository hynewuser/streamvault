import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";
import { ChatScraper } from "./chatScraper";
import { config } from "../config";
import { eventBus } from "../lib/eventBus";
import { metrics } from "../lib/metrics";

class ScraperManager {
  private active = new Map<string, ChatScraper>();

  async start(streamId: string) {
    if (this.active.has(streamId)) return;
    if (this.active.size >= config.scraper.maxConcurrent) {
      logger.warn({ streamId }, "max concurrent streams reached");
      return;
    }
    const stream = await prisma.stream.findUnique({ where: { id: streamId } });
    if (!stream) return;

    const scraper = new ChatScraper(stream.id, stream.videoId);
    this.active.set(streamId, scraper);
    metrics.activeStreams = this.active.size;

    scraper.on("ended", () => {
      this.active.delete(streamId);
      metrics.activeStreams = this.active.size;
      eventBus.emit("stream_update", { id: streamId, status: "ENDED" });
    });

    scraper.on("error", (err) => {
      logger.error({ err, streamId }, "scraper error");
    });

    scraper.start().catch((err) => logger.error({ err }, "scraper start failed"));
    logger.info({ streamId, videoId: stream.videoId }, "▶️  scraper started");
  }

  async stop(streamId: string) {
    const s = this.active.get(streamId);
    if (s) {
      await s.stop();
      this.active.delete(streamId);
      metrics.activeStreams = this.active.size;
    }
  }

  async stopAll() {
    await Promise.allSettled([...this.active.values()].map((s) => s.stop()));
    this.active.clear();
    metrics.activeStreams = 0;
  }

  list() {
    return [...this.active.keys()];
  }

  async resumeAll() {
    const streams = await prisma.stream.findMany({
      where: { status: { in: ["LIVE", "PENDING"] } },
    });
    for (const s of streams) await this.start(s.id);
    logger.info({ count: streams.length }, "🔁 resumed scrapers");
  }
}

export const scraperManager = new ScraperManager();
