import { EventEmitter } from "node:events";
import { Innertube, YT } from "youtubei.js";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";
import { config } from "../config";
import { sleep } from "../lib/util";
import { eventBus } from "../lib/eventBus";
import { metrics } from "../lib/metrics";
import { processAlertForMessage } from "./alertEngine";

let innertubeInstance: Innertube | null = null;
async function getInnertube(): Promise<Innertube> {
  if (innertubeInstance) return innertubeInstance;
  innertubeInstance = await Innertube.create({ generate_session_locally: true });
  return innertubeInstance;
}

interface RawAction {
  [k: string]: any;
}

export class ChatScraper extends EventEmitter {
  private running = false;
  private retries = 0;
  private livechat: any | null = null;

  constructor(public streamId: string, public videoId: string) {
    super();
  }

  async start() {
    if (this.running) return;
    this.running = true;
    while (this.running && this.retries < config.scraper.maxRetries) {
      try {
        await this.captureLoop();
        if (!this.running) break;
        // If captureLoop returns naturally, stream ended
        await prisma.stream.update({
          where: { id: this.streamId },
          data: { status: "ENDED", endedAt: new Date() },
        });
        this.emit("ended");
        return;
      } catch (err: any) {
        this.retries++;
        logger.warn(
          { err: err?.message, videoId: this.videoId, attempt: this.retries },
          "scraper attempt failed",
        );
        await prisma.stream.update({
          where: { id: this.streamId },
          data: {
            status: "ERROR",
            errorCount: { increment: 1 },
            lastError: String(err?.message ?? err),
          },
        });
        const backoff = config.scraper.backoffMs * Math.min(this.retries, 6);
        await sleep(backoff);
      }
    }
    this.running = false;
    if (this.retries >= config.scraper.maxRetries) {
      await prisma.stream.update({
        where: { id: this.streamId },
        data: { status: "OFFLINE" },
      });
      this.emit("ended");
    }
  }

  async stop() {
    this.running = false;
    try {
      if (this.livechat?.stop) this.livechat.stop();
    } catch {}
  }

  private async captureLoop() {
    const yt = await getInnertube();
    const info: YT.VideoInfo = await yt.getInfo(this.videoId);

    const isLive = !!info.basic_info?.is_live;
    const channelId = info.basic_info?.channel_id ?? null;
    const channelName = info.basic_info?.author ?? null;
    const title = info.basic_info?.title ?? null;

    await prisma.stream.update({
      where: { id: this.streamId },
      data: {
        title,
        channelId,
        channelName,
        status: isLive ? "LIVE" : "PENDING",
        startedAt: isLive ? new Date() : undefined,
      },
    });
    eventBus.emit("stream_update", { id: this.streamId, status: isLive ? "LIVE" : "PENDING", title });

    if (!isLive && !info.basic_info?.is_upcoming) {
      throw new Error("video is not live");
    }

    const livechat = info.getLiveChat();
    this.livechat = livechat;

    livechat.on("error", (err: any) => {
      logger.warn({ err: err?.message, videoId: this.videoId }, "livechat error");
    });

    livechat.on("end", () => {
      logger.info({ videoId: this.videoId }, "livechat ended");
    });

    livechat.on("chat-update", async (action: any) => {
      try {
        await this.handleAction(action);
      } catch (err) {
        logger.error({ err }, "handleAction failed");
      }
    });

    livechat.start();

    // keep loop alive while livechat runs
    while (this.running) {
      await sleep(config.scraper.pollMs);
      // poll latency reset successful retries after 30s
      if (this.retries > 0) this.retries = Math.max(0, this.retries - 1);
    }
  }

  private async handleAction(action: any) {
    const a = action as RawAction;
    const item = a?.item ?? a;
    if (!item) return;

    const type = this.detectType(item);
    if (!type) return;

    const messageId =
      item?.id ??
      item?.action_id ??
      item?.target_item_id ??
      `${this.videoId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const authorChannelId =
      item?.author?.id ?? item?.author_external_channel_id ?? "unknown";
    const authorName = item?.author?.name?.text ?? item?.author?.name ?? "Unknown";
    const authorPhoto =
      item?.author?.thumbnails?.[0]?.url ?? item?.author?.thumbnail?.url ?? null;

    const isMember = !!item?.author?.is_member || /member/i.test(item?.author?.badges?.[0]?.tooltip ?? "");
    const isModerator = !!item?.author?.is_moderator;
    const isOwner = !!item?.author?.is_owner;
    const isVerified = !!item?.author?.is_verified;
    const badges: string[] = (item?.author?.badges ?? [])
      .map((b: any) => b?.tooltip ?? b?.label ?? "")
      .filter(Boolean);

    const text = this.extractText(item);
    const emojis = this.extractEmojis(item);
    const sc = this.extractSuperchat(item);
    const publishedAt = item?.timestamp
      ? new Date(Number(item.timestamp) / 1000)
      : new Date();

    try {
      const dbMsg = await prisma.message.upsert({
        where: { streamId_messageId: { streamId: this.streamId, messageId } },
        update: {},
        create: {
          streamId: this.streamId,
          videoId: this.videoId,
          messageId,
          type,
          authorChannelId,
          authorName,
          authorPhoto,
          isMember,
          isModerator,
          isOwner,
          isVerified,
          badges: JSON.stringify(badges),
          text: text.slice(0, 5000),
          emojis: JSON.stringify(emojis),
          superchatAmount: sc?.amount ?? null,
          superchatCurrency: sc?.currency ?? null,
          superchatColor: sc?.color ?? null,
          publishedAt,
          raw: JSON.stringify(item).slice(0, 16000),
        },
      });

      // upsert author
      await prisma.author.upsert({
        where: { channelId: authorChannelId },
        update: {
          name: authorName,
          photo: authorPhoto,
          isVerified,
          lastSeenAt: new Date(),
          messageCount: { increment: 1 },
        },
        create: {
          channelId: authorChannelId,
          name: authorName,
          photo: authorPhoto,
          isVerified,
          messageCount: 1,
        },
      });

      await prisma.stream.update({
        where: { id: this.streamId },
        data: {
          messageCount: { increment: 1 },
          lastMessageAt: new Date(),
          status: "LIVE",
        },
      });

      metrics.recordMessage();

      const dto = {
        ...dbMsg,
        badges,
        emojis,
      };
      eventBus.emit("message", dto);

      // alert pipeline (non-blocking)
      processAlertForMessage(dto).catch((err) =>
        logger.error({ err }, "alert dispatch error"),
      );
    } catch (err: any) {
      if (!String(err?.message ?? "").includes("Unique constraint")) {
        logger.warn({ err: err?.message }, "message persist failed");
      }
    }
  }

  private detectType(item: any): string | null {
    const tag = item?.type ?? item?.constructor?.name ?? "";
    const low = String(tag).toLowerCase();
    if (low.includes("paidmessage") || low.includes("superchat")) return "superchat";
    if (low.includes("paidsticker") || low.includes("supersticker")) return "supersticker";
    if (low.includes("membership") || low.includes("sponsor")) return "membership";
    if (low.includes("milestone")) return "milestone";
    if (low.includes("textmessage") || low.includes("livechattext")) return "text";
    if (low.includes("placeholder")) return null;
    if (low.includes("deletedmessage") || low.includes("messagedeleted")) return "deleted";
    if (low.includes("ban") || low.includes("moderation")) return "moderation";
    if (low.includes("pin")) return "pinned";
    return "text";
  }

  private extractText(item: any): string {
    const m = item?.message;
    if (!m) return item?.text ?? "";
    if (typeof m === "string") return m;
    if (m.text) return String(m.text);
    if (Array.isArray(m.runs)) {
      return m.runs
        .map((r: any) => r?.text ?? r?.emoji?.shortcuts?.[0] ?? "")
        .join("");
    }
    if (Array.isArray(m)) {
      return m
        .map((r: any) => r?.text ?? r?.emoji?.shortcuts?.[0] ?? "")
        .join("");
    }
    return "";
  }

  private extractEmojis(item: any): string[] {
    const m = item?.message;
    const out: string[] = [];
    const arr = Array.isArray(m) ? m : m?.runs ?? [];
    for (const r of arr ?? []) {
      const e = r?.emoji?.shortcuts?.[0] ?? r?.emoji?.image?.accessibility_label;
      if (e) out.push(e);
    }
    return out;
  }

  private extractSuperchat(item: any): { amount: number; currency: string; color: string | null } | null {
    const raw = item?.purchase_amount ?? item?.purchase_amount_text?.text ?? item?.amount;
    if (!raw) return null;
    const txt = typeof raw === "string" ? raw : raw?.text ?? "";
    const match = String(txt).match(/([^\d.,\s]+)\s*([\d.,]+)|([\d.,]+)\s*([^\d.,\s]+)/);
    let currency = "USD";
    let amount = 0;
    if (match) {
      currency = (match[1] ?? match[4] ?? "USD").trim();
      amount = parseFloat((match[2] ?? match[3] ?? "0").replace(/,/g, ""));
    }
    const color = item?.body_background_color
      ? `#${Number(item.body_background_color).toString(16).slice(-6)}`
      : null;
    return { amount, currency, color };
  }
}
