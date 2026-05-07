"use client";
import { Shell } from "@/components/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Bell, Plus, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function AlertsPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [channelIds, setChannelIds] = useState("");
  const [keywords, setKeywords] = useState("");
  const [topic, setTopic] = useState("");

  const { data } = useQuery({
    queryKey: ["alerts"],
    queryFn: async () => (await api.get("/api/alerts")).data,
    refetchInterval: 15_000,
  });

  const create = useMutation({
    mutationFn: async () =>
      (
        await api.post("/api/alerts", {
          name,
          channelIds: channelIds.split(",").map((s) => s.trim()).filter(Boolean),
          keywords: keywords.split(",").map((s) => s.trim()).filter(Boolean),
          ntfyTopic: topic,
          enabled: true,
          matchAny: true,
        })
      ).data,
    onSuccess: () => {
      toast.success("Rule created");
      setName("");
      setChannelIds("");
      setKeywords("");
      setTopic("");
      qc.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) =>
      (await api.put(`/api/alerts/${id}`, { enabled })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/api/alerts/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });

  return (
    <Shell title="Alerts">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-4 h-4" /> Create rule
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-3">
          <Input placeholder="Rule name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="ntfy topic (e.g. my-alerts)" value={topic} onChange={(e) => setTopic(e.target.value)} />
          <Input
            placeholder="Channel IDs (comma separated, UCxxx...)"
            value={channelIds}
            onChange={(e) => setChannelIds(e.target.value)}
          />
          <Input placeholder="Keywords (comma separated)" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
          <div className="md:col-span-2">
            <Button onClick={() => create.mutate()} disabled={!name || create.isPending}>
              <Plus className="w-4 h-4" /> Create
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rules ({data?.items?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {(data?.items ?? []).map((r: any) => (
              <div key={r.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {r.name}
                    <Badge variant="secondary">{r.ntfyTopic}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Channels: {r.channelIds.length} · Keywords: {r.keywords.length}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={r.enabled}
                    onCheckedChange={(v) => update.mutate({ id: r.id, enabled: v })}
                  />
                  <Button size="sm" variant="ghost" onClick={() => del.mutate(r.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {!data?.items?.length && (
              <div className="px-6 py-12 text-center text-muted-foreground text-sm">
                No alert rules yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Shell>
  );
}
