export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function safeJSON<T = any>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

export function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function formatRangeFolder(start: Date, end: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const date = `${start.getUTCFullYear()}-${pad(start.getUTCMonth() + 1)}-${pad(start.getUTCDate())}`;
  const t1 = `${pad(start.getUTCHours())}-${pad(start.getUTCMinutes())}`;
  const t2 = `${pad(end.getUTCHours())}-${pad(end.getUTCMinutes())}`;
  return `${date}_${t1}_to_${t2}`;
}

export function nowSec() {
  return Math.floor(Date.now() / 1000);
}
