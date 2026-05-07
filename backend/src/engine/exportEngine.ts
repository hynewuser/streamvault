import fs from "node:fs";
import path from "node:path";
import { stringify } from "csv-stringify";
import archiver from "archiver";
import { prisma } from "../lib/prisma";
import { config } from "../config";
import { logger } from "../lib/logger";
import { formatRangeFolder } from "../lib/util";
import { metrics } from "../lib/metrics";

interface ExportOpts {
  streamId?: string | null;
  windowStart?: Date;
  windowEnd?: Date;
}

export async function runExport(opts: ExportOpts = {}) {
  const end = opts.windowEnd ?? new Date();
  const start = opts.windowStart ?? new Date(end.getTime() - config.exports.intervalHours * 3600_000);

  const streams = opts.streamId
    ? await prisma.stream.findMany({ where: { id: opts.streamId } })
    : await prisma.stream.findMany();

  const baseDir = path.resolve(config.exports.dir);
  await fs.promises.mkdir(baseDir, { recursive: true });

  const folder = formatRangeFolder(start, end);
  const archives: any[] = [];

  for (const stream of streams) {
    const messages = await prisma.message.findMany({
      where: {
        streamId: stream.id,
        publishedAt: { gte: start, lt: end },
      },
      orderBy: { publishedAt: "asc" },
    });
    if (!messages.length) continue;

    const streamDir = path.join(baseDir, folder, `stream_${stream.videoId}`);
    await fs.promises.mkdir(streamDir, { recursive: true });

    // JSONL
    const jsonlPath = path.join(streamDir, "messages.jsonl");
    const jsonlStream = fs.createWriteStream(jsonlPath);
    for (const m of messages) {
      jsonlStream.write(JSON.stringify(m) + "\n");
    }
    await new Promise<void>((res) => jsonlStream.end(res));

    // CSV
    const csvPath = path.join(streamDir, "messages.csv");
    await new Promise<void>((resolve, reject) => {
      const out = fs.createWriteStream(csvPath);
      stringify(
        messages.map((m) => ({
          id: m.id,
          messageId: m.messageId,
          publishedAt: m.publishedAt.toISOString(),
          type: m.type,
          authorChannelId: m.authorChannelId,
          authorName: m.authorName,
          isMember: m.isMember,
          isModerator: m.isModerator,
          superchatAmount: m.superchatAmount ?? "",
          superchatCurrency: m.superchatCurrency ?? "",
          text: m.text,
        })),
        { header: true },
      )
        .pipe(out)
        .on("finish", () => resolve())
        .on("error", reject);
    });

    // metadata
    const metaPath = path.join(streamDir, "metadata.json");
    await fs.promises.writeFile(
      metaPath,
      JSON.stringify(
        {
          streamId: stream.id,
          videoId: stream.videoId,
          title: stream.title,
          channelId: stream.channelId,
          channelName: stream.channelName,
          windowStart: start.toISOString(),
          windowEnd: end.toISOString(),
          messageCount: messages.length,
          generatedAt: new Date().toISOString(),
        },
        null,
        2,
      ),
    );

    let zipPath: string | null = null;
    if (config.exports.compress) {
      zipPath = path.join(streamDir, "archive.zip");
      await new Promise<void>((resolve, reject) => {
        const out = fs.createWriteStream(zipPath!);
        const archive = archiver("zip", { zlib: { level: 9 } });
        archive.on("error", reject);
        out.on("close", () => resolve());
        archive.pipe(out);
        archive.file(jsonlPath, { name: "messages.jsonl" });
        archive.file(csvPath, { name: "messages.csv" });
        archive.file(metaPath, { name: "metadata.json" });
        archive.finalize();
      });
    }

    const stat = await fs.promises.stat(zipPath ?? jsonlPath);
    const archive = await prisma.exportArchive.create({
      data: {
        streamId: stream.id,
        windowStart: start,
        windowEnd: end,
        path: path.relative(baseDir, zipPath ?? streamDir),
        format: zipPath ? "ZIP" : "JSONL",
        sizeBytes: stat.size,
        messageCount: messages.length,
      },
    });
    archives.push(archive);
    metrics.exportsTotal++;
    logger.info(
      { streamId: stream.id, count: messages.length, folder },
      "📦 export written",
    );
  }

  // cleanup
  await cleanupOldExports();

  return archives;
}

async function cleanupOldExports() {
  const cutoff = new Date(Date.now() - config.exports.retentionDays * 86_400_000);
  const old = await prisma.exportArchive.findMany({ where: { createdAt: { lt: cutoff } } });
  for (const e of old) {
    try {
      const fp = path.resolve(config.exports.dir, e.path);
      if (fs.existsSync(fp)) {
        const stat = await fs.promises.stat(fp);
        if (stat.isDirectory()) await fs.promises.rm(fp, { recursive: true, force: true });
        else await fs.promises.unlink(fp);
      }
    } catch (err) {
      logger.warn({ err }, "cleanup file failed");
    }
    await prisma.exportArchive.delete({ where: { id: e.id } });
  }
  if (old.length) logger.info({ count: old.length }, "🧹 cleaned old exports");
}
