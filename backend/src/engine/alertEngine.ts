import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";
import { config } from "../config";
import { metrics } from "../lib/metrics";
import { eventBus } from "../lib/eventBus";
import { safeJSON } from "../lib/util";

const dedupe = new Map<string, number>();

function shouldDedupe(key: string): boolean {
  const now = Date.now();
  const last = dedupe.get(key);
  if (last && now - last < config.alerts.dedupeWindowSec * 1000) return true;
  dedupe.set(key, now);
  if (dedupe.size > 5000) {
    const cutoff = now - config.alerts.dedupeWindowSec * 1000;
    for (const [k, t] of dedupe) if (t < cutoff) dedupe.delete(k);
  }
  return false;
}

export async function processAlertForMessage(message: any) {
  const rules = await prisma.alertRule.findMany({ where: { enabled: true } });
  if (!rules.length) return;

  for (const rule of rules) {
    const channelIds = safeJSON<string[]>(rule.channelIds, []);
    const keywords = safeJSON<string[]>(rule.keywords, []);

    const channelMatch = channelIds.length > 0 && channelIds.includes(message.authorChannelId);
    const text: string = (message.text ?? "").toLowerCase();
    const keywordMatch =
      keywords.length > 0 && keywords.some((k) => text.includes(String(k).toLowerCase()));

    let match = false;
    if (rule.matchAny) {
      match = channelMatch || keywordMatch || (channelIds.length === 0 && keywords.length === 0);
      if (channelIds.length === 0 && keywords.length === 0) match = false;
    } else {
      const requireBoth = channelIds.length > 0 && keywords.length > 0;
      match = requireBoth ? channelMatch && keywordMatch : channelMatch || keywordMatch;
    }
    if (!match) continue;

    const dedupeKey = `${rule.id}:${message.authorChannelId}:${message.messageId}`;
    if (shouldDedupe(dedupeKey)) continue;

    const ev = await prisma.notificationEvent.create({
      data: { ruleId: rule.id, messageId: message.id, status: "PENDING" },
    });

    sendNtfy(rule, message, ev.id).catch((err) =>
      logger.error({ err }, "ntfy dispatch failed"),
    );
  }
}

async function sendNtfy(rule: any, msg: any, eventId: string) {
  const stream = await prisma.stream.findUnique({ where: { id: msg.streamId } });
  const topic = rule.ntfyTopic || config.ntfy.defaultTopic;
  const url = `${config.ntfy.server.replace(/\/$/, "")}/${topic}`;

  const title = `🔴 ${msg.authorName} • ${stream?.title ?? msg.videoId}`;
  const body = `${msg.text}\n\nstream: https://youtube.com/watch?v=${msg.videoId}\nchannel: https://youtube.com/channel/${msg.authorChannelId}`;

  const headers: Record<string, string> = {
    "Content-Type": "text/plain; charset=utf-8",
    Title: title.slice(0, 200),
    Tags: "loudspeaker,red_circle",
    Priority: "high",
    Click: `https://youtube.com/watch?v=${msg.videoId}`,
  };
  if (config.ntfy.authToken) headers.Authorization = `Bearer ${config.ntfy.authToken}`;

  let attempts = 0;
  let lastError = "";
  while (attempts < 5) {
    try {
      const res = await fetch(url, { method: "POST", headers, body });
      if (!res.ok) throw new Error(`ntfy ${res.status}`);
      await prisma.notificationEvent.update({
        where: { id: eventId },
        data: { status: "SENT", sentAt: new Date(), attempts: attempts + 1 },
      });
      metrics.alertsTotal++;
      eventBus.emit("alert", { rule: rule.name, message: msg, ts: Date.now() });
      return;
    } catch (err: any) {
      attempts++;
      lastError = String(err?.message ?? err);
      await new Promise((r) => setTimeout(r, 1000 * attempts));
    }
  }
  await prisma.notificationEvent.update({
    where: { id: eventId },
    data: { status: "FAILED", attempts, lastError },
  });
}
