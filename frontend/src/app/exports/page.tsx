"use client";
import { Shell } from "@/components/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiUrl } from "@/lib/api";
import { Download, Play, Trash2 } from "lucide-react";
import { formatRelative } from "@/lib/utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function ExportsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["exports"],
    queryFn: async () => (await api.get("/api/exports")).data,
    refetchInterval: 10_000,
  });

  const run = useMutation({
    mutationFn: async () => (await api.post("/api/exports/run")).data,
    onSuccess: () => {
      toast.success("Export started");
      qc.invalidateQueries({ queryKey: ["exports"] });
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/api/exports/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exports"] }),
  });

  return (
    <Shell title="Exports">
      <Card className="mb-6">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Archives</CardTitle>
          <Button onClick={() => run.mutate()} disabled={run.isPending}>
            <Play className="w-4 h-4" /> Run now
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50 max-h-[70vh] overflow-y-auto scroll-thin">
            {(data?.items ?? []).map((e: any) => (
              <div key={e.id} className="px-6 py-4 flex items-center justify-between hover:bg-accent/30">
                <div className="min-w-0">
                  <div className="font-medium truncate">{e.path}</div>
                  <div className="text-xs text-muted-foreground flex gap-2 mt-1">
                    <Badge variant="secondary">{e.format}</Badge>
                    <span>{e.messageCount} msgs</span>
                    <span>· {(e.sizeBytes / 1024).toFixed(1)} KB</span>
                    <span>· {formatRelative(e.createdAt)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a href={`${apiUrl}/files/${e.path}`} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4" />
                    </Button>
                  </a>
                  <Button size="sm" variant="ghost" onClick={() => del.mutate(e.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {!data?.items?.length && (
              <div className="px-6 py-12 text-center text-muted-foreground text-sm">
                No exports yet — they generate every 6 hours automatically.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Shell>
  );
}
