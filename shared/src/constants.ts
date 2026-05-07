export const DEFAULTS = {
  EXPORT_INTERVAL_HOURS: 6,
  SCRAPER_POLL_INTERVAL_MS: 2000,
  MAX_MESSAGE_TEXT_LENGTH: 5000,
  MAX_BATCH_INSERT: 500,
  WS_HEARTBEAT_MS: 25000,
} as const;

export const QUEUE_NAMES = {
  SCRAPE: "scrape",
  EXPORT: "export",
  ALERT: "alert",
  CLEANUP: "cleanup",
} as const;

export const WS_EVENTS = {
  MESSAGE: "message",
  STREAM_UPDATE: "stream_update",
  ALERT: "alert",
  SYSTEM: "system",
} as const;
