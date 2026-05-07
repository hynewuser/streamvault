import pino from "pino";
import { config } from "../config";

export const logger = pino({
  level: config.log.level,
  base: { app: "streamvault" },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(config.log.pretty
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "HH:MM:ss" },
        },
      }
    : {}),
});
