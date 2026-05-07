"use client";
import { useState } from "react";
import { Shell } from "@/components/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Plus, RefreshCw, Trash2, Square, Radio } from "lucide-react";
import { formatRelative } from "@/lib/utils";

function parseVideoId(input: string): string {
  const trimmed = input.trim();
  const m = trimmed.match(/(?:v=|youtu\.be\/|live\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return m?.[1] ?? trimmed;
}

export default function StreamsPage() {
  const qc = useQueryClient();
  const [videoId, setVideoId] = useState("");

  const { data } = useQuery({
    queryKey: ["streams"],
    queryFn: async () => (await api.get("/api/streams")).data,
    refetchInterval: 4000,
  });

  const add = useMutation({
    mutationFn: async (vid: string) => (await api.post("/api/streams", { videoId: vid })).data,
    onSuccess: () => {
      toast.success("Stream added");
      setVideoId("");
      qc.invalidateQueries({ queryKey: ["streams"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? "Failed"),
  });

  const restart = useMutation({
    mutationFn: async (id: string) => (await api.post(`/api/streams/${id}/restart`)).data,
    onSuccess: () => {
      toast.success("Restarted");
      qc.invalidateQueries({ queryKey: ["streams"] });
    },
  });
  const stop = useMutation({
    mutationFn: async (id: string) => (await api.post(`/api/streams/${id}/stop`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["streams"] }),
  });
  const del = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/api/streams/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["streams"] }),
  });

  return (
    <Shell title="Streams">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="w-4 h-4" /> Track a livestream
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input
            placeholder="YouTube video URL or ID (e.g. dQw4w9WgXcQ)"
            value={videoId}
            onChange={(e) => setVideoId(e.target.value)}
          />
          <Button onClick={() => add.mutate(parseVideoId(videoId))} disabled={!videoId || add.isPending}>
            <Plus className="w-4 h-4" /> Add
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active & Recent ({data?.streams?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {(data?.streams ?? []).map((s: any) => (
              <div key={s.id} className="px-6 py-4 flex items-center justify-between hover:bg-accent/30">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {s.status === "LIVE" && <span className="live-dot" />}
                    <span className="font-medium truncate max-w-md">{s.title || s.videoId}</span>
                    <Badge variant={s.status === "LIVE" ? "success" : s.status === "ERROR" ? "destructive" : "secondary"}>
                      {s.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground flex gap-3">
                    <span>{s.videoId}</span>
                    {s.channelName && <span>· {s.channelName}</span>}
                    <span>· {s.messageCount ?? 0} msgs</span>
                    {s.lastMessageAt && <span>· last {formatRelative(s.lastMessageAt)}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => restart.mutate(s.id)}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => stop.mutate(s.id)}>
                    <Square className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => del.mutate(s.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {!data?.streams?.length && (
              <div className="px-6 py-12 text-center text-sm text-muted-foreground">No streams yet</div>
            )}
          </div>
        </CardContent>
      </Card>
    </Shell>
  );
}
