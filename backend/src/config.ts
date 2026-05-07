import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.string().default("development"),
  BACKEND_PORT: z.coerce.number().default(4000),
  BACKEND_HOST: z.string().default("0.0.0.0"),
  JWT_SECRET: z.string().min(16).default("change_me_to_a_long_random_string_min_32_chars"),
  ADMIN_USERNAME: z.string().default("admin"),
  ADMIN_PASSWORD: z.string().default("streamvault"),
  CORS_ORIGIN: z.string().default("*"),

  DATABASE_URL: z.string().default("file:./data/streamvault.db"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  USE_REDIS: z.coerce.boolean().default(false),

  NTFY_SERVER: z.string().default("https://ntfy.sh"),
  NTFY_DEFAULT_TOPIC: z.string().default("streamvault-alerts"),
  NTFY_AUTH_TOKEN: z.string().optional().default(""),

  SCRAPER_POLL_INTERVAL_MS: z.coerce.number().default(2000),
  SCRAPER_MAX_RETRIES: z.coerce.number().default(10),
  SCRAPER_RETRY_BACKOFF_MS: z.coerce.number().default(5000),
  SCRAPER_MAX_CONCURRENT_STREAMS: z.coerce.number().default(50),

  EXPORT_INTERVAL_HOURS: z.coerce.number().default(6),
  EXPORT_DIR: z.string().default("./exports"),
  EXPORT_RETENTION_DAYS: z.coerce.number().default(30),
  EXPORT_COMPRESS: z.coerce.boolean().default(true),

  ALERT_DEDUPE_WINDOW_SEC: z.coerce.number().default(60),
  ALERT_RATE_LIMIT_PER_MIN: z.coerce.number().default(30),

  LOG_LEVEL: z.string().default("info"),
  LOG_PRETTY: z.coerce.boolean().default(false),
});

const env = schema.parse(process.env);

export const config = {
  env: env.NODE_ENV,
  isProd: env.NODE_ENV === "production",
  backend: {
    port: env.BACKEND_PORT,
    host: env.BACKEND_HOST,
  },
  auth: {
    jwtSecret: env.JWT_SECRET,
    adminUser: env.ADMIN_USERNAME,
    adminPass: env.ADMIN_PASSWORD,
  },
  cors: { origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()) },
  db: { url: env.DATABASE_URL },
  redis: { url: env.REDIS_URL, enabled: env.USE_REDIS },
  ntfy: {
    server: env.NTFY_SERVER,
    defaultTopic: env.NTFY_DEFAULT_TOPIC,
    authToken: env.NTFY_AUTH_TOKEN,
  },
  scraper: {
    pollMs: env.SCRAPER_POLL_INTERVAL_MS,
    maxRetries: env.SCRAPER_MAX_RETRIES,
    backoffMs: env.SCRAPER_RETRY_BACKOFF_MS,
    maxConcurrent: env.SCRAPER_MAX_CONCURRENT_STREAMS,
  },
  exports: {
    intervalHours: env.EXPORT_INTERVAL_HOURS,
    dir: env.EXPORT_DIR,
    retentionDays: env.EXPORT_RETENTION_DAYS,
    compress: env.EXPORT_COMPRESS,
  },
  alerts: {
    dedupeWindowSec: env.ALERT_DEDUPE_WINDOW_SEC,
    rateLimitPerMin: env.ALERT_RATE_LIMIT_PER_MIN,
  },
  log: { level: env.LOG_LEVEL, pretty: env.LOG_PRETTY },
} as const;
