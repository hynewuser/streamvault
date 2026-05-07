export type StreamStatus = "PENDING" | "LIVE" | "OFFLINE" | "ERROR" | "ENDED";

export interface StreamDTO {
  id: string;
  videoId: string;
  channelId: string | null;
  title: string | null;
  status: StreamStatus;
  startedAt: string | null;
  endedAt: string | null;
  lastMessageAt: string | null;
  messageCount: number;
  createdAt: string;
}

export type MessageType =
  | "text"
  | "superchat"
  | "supersticker"
  | "membership"
  | "milestone"
  | "pinned"
  | "deleted"
  | "moderation"
  | "raid"
  | "system";

export interface MessageDTO {
  id: string;
  streamId: string;
  videoId: string;
  messageId: string;
  type: MessageType;
  authorChannelId: string;
  authorName: string;
  authorPhoto: string | null;
  isMember: boolean;
  isModerator: boolean;
  isOwner: boolean;
  isVerified: boolean;
  badges: string[];
  text: string;
  rawHtml: string | null;
  superchatAmount: number | null;
  superchatCurrency: string | null;
  superchatColor: string | null;
  emojis: string[];
  publishedAt: string;
  capturedAt: string;
  raw: unknown;
}

export interface AlertRuleDTO {
  id: string;
  name: string;
  channelIds: string[];
  keywords: string[];
  ntfyTopic: string;
  enabled: boolean;
  matchAny: boolean;
  createdAt: string;
}

export interface ExportArchiveDTO {
  id: string;
  streamId: string | null;
  windowStart: string;
  windowEnd: string;
  path: string;
  format: "JSONL" | "CSV" | "ZIP";
  sizeBytes: number;
  messageCount: number;
  createdAt: string;
}

export interface SystemHealthDTO {
  uptimeSec: number;
  memMB: number;
  cpuPct: number;
  activeStreams: number;
  workers: number;
  queueDepth: number;
  messagesPerMin: number;
  redis: boolean;
  db: boolean;
}

export interface WSMessageEvent {
  type: "message" | "stream_update" | "alert" | "system";
  payload: unknown;
}
