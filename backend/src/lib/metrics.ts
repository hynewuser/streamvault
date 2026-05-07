class Metrics {
  activeStreams = 0;
  workers = 0;
  queueDepth = 0;
  messagesTotal = 0;
  alertsTotal = 0;
  exportsTotal = 0;
  private window: number[] = [];

  recordMessage() {
    this.messagesTotal++;
    const now = Date.now();
    this.window.push(now);
    const cutoff = now - 60_000;
    while (this.window.length && this.window[0] < cutoff) this.window.shift();
  }

  messagesPerMin(): number {
    const cutoff = Date.now() - 60_000;
    return this.window.filter((t) => t >= cutoff).length;
  }

  prometheus(): string {
    return [
      `# HELP streamvault_active_streams Currently active livestream captures`,
      `streamvault_active_streams ${this.activeStreams}`,
      `# HELP streamvault_workers Active workers`,
      `streamvault_workers ${this.workers}`,
      `# HELP streamvault_messages_total Total captured messages`,
      `streamvault_messages_total ${this.messagesTotal}`,
      `# HELP streamvault_messages_per_min Messages in last minute`,
      `streamvault_messages_per_min ${this.messagesPerMin()}`,
      `# HELP streamvault_alerts_total Total alerts dispatched`,
      `streamvault_alerts_total ${this.alertsTotal}`,
      `# HELP streamvault_exports_total Total exports generated`,
      `streamvault_exports_total ${this.exportsTotal}`,
    ].join("\n");
  }
}
export const metrics = new Metrics();
