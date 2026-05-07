"use client";
import { Shell } from "@/components/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Search, Download } from "lucide-react";
import { formatTime } from "@/lib/utils";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [channelId, setChannelId] = useState("");
  const [streamId, setStreamId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [run, setRun] = useState(0);

  const { data, isFetching } = useQuery({
    queryKey: ["search", run],
    enabled: run > 0,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (channelId) params.set("channelId", channelId);
      if (streamId) params.set("streamId", streamId);
      if (from) params.set("from", new Date(from).toISOString());
      if (to) params.set("to", new Date(to).toISOString());
      params.set("limit", "200");
      return (await api.get(`/api/messages?${params.toString()}`)).data;
    },
  });

  function exportCSV() {
    const items = data?.items ?? [];
    const headers = ["time", "stream", "channel", "author", "type", "text"];
    const rows = items.map((m: any) => [
      m.publishedAt,
      m.videoId,
      m.authorChannelId,
      m.authorName,
      m.type,
      (m.text ?? "").replace(/"/g, '""'),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c: any) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `streamvault-search-${Date.now()}.csv`;
    a.click();
  }

  return (
    <Shell title="Search Explorer">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-4 h-4" /> Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-3">
          <Input placeholder="Text contains…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Input placeholder="Author channel ID" value={channelId} onChange={(e) => setChannelId(e.target.value)} />
          <Input placeholder="Stream ID (internal)" value={streamId} onChange={(e) => setStreamId(e.target.value)} />
          <Input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => setRun((x) => x + 1)} disabled={isFetching}>
              <Search className="w-4 h-4" /> Search
            </Button>
            <Button variant="outline" onClick={exportCSV} disabled={!data?.items?.length}>
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Results ({data?.items?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50 max-h-[60vh] overflow-y-auto scroll-thin">
            {(data?.items ?? []).map((m: any) => (
              <div key={m.id} className="px-6 py-3 hover:bg-accent/30">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <span>{formatTime(m.publishedAt)}</span>
                  <Badge variant="secondary">{m.type}</Badge>
                  <span className="font-mono truncate">{m.videoId}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-primary">{m.authorName}</span>
                  <span className="text-xs text-muted-foreground font-mono">{m.authorChannelId}</span>
                </div>
                <div className="mt-1 text-sm">{m.text}</div>
              </div>
            ))}
            {!data?.items?.length && !isFetching && (
              <div className="px-6 py-12 text-center text-muted-foreground text-sm">
                Run a search to see results
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Shell>
  );
}
