"use client";
import { Shell } from "@/components/shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function SettingsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => (await api.get("/api/settings")).data,
  });

  const [key, setKey] = useState("");
  const [value, setValue] = useState("");

  const upsert = useMutation({
    mutationFn: async () => (await api.put("/api/settings", { key, value })).data,
    onSuccess: () => {
      toast.success("Saved");
      setKey("");
      setValue("");
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  return (
    <Shell title="Settings">
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Application Settings</CardTitle>
            <CardDescription>Stored key/value pairs (advanced)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="key" value={key} onChange={(e) => setKey(e.target.value)} />
            <Input placeholder="value" value={value} onChange={(e) => setValue(e.target.value)} />
            <Button onClick={() => upsert.mutate()} disabled={!key}>Save</Button>
            <div className="space-y-2 pt-4">
              {(data?.items ?? []).map((s: any) => (
                <div key={s.key} className="flex items-center justify-between text-sm border-t border-border/50 pt-2">
                  <span className="font-mono">{s.key}</span>
                  <span className="text-muted-foreground truncate max-w-xs">{s.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About StreamVault</CardTitle>
            <CardDescription>Real-time YouTube livechat intelligence</CardDescription>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-muted-foreground">
            <p>Version: <span className="font-mono">1.0.0</span></p>
            <p>License: MIT</p>
            <p>
              Built with Fastify, Next.js, Prisma, BullMQ, youtubei.js. Uses unofficial Innertube
              endpoints — no API keys required.
            </p>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
