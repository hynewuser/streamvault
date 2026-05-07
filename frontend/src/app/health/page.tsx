"use client";
import { Shell } from "@/components/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Cpu, Database, HardDrive, Server, Wifi } from "lucide-react";

export default function HealthPage() {
  const { data } = useQuery({
    queryKey: ["health"],
    queryFn: async () => (await api.get("/health/full")).data,
    refetchInterval: 3000,
  });

  const items = [
    { label: "Uptime", value: `${Math.floor((data?.uptimeSec ?? 0) / 60)} min`, icon: Server },
    { label: "Memory", value: `${data?.memMB ?? 0} MB`, icon: HardDrive },
    { label: "CPU", value: `${data?.cpuPct ?? 0}%`, icon: Cpu },
    { label: "Active Streams", value: data?.activeStreams ?? 0, icon: Wifi },
    { label: "Workers", value: data?.workers ?? 0, icon: Server },
    { label: "Messages/min", value: data?.messagesPerMin ?? 0, icon: Wifi },
  ];

  return (
    <Shell title="System Health">
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {items.map((i) => {
          const Icon = i.icon;
          return (
            <Card key={i.label}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{i.value}</div>
                  <div className="text-xs text-muted-foreground">{i.label}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Services</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2"><Database className="w-4 h-4" /> Database</span>
            <Badge variant={data?.db ? "success" : "destructive"}>{data?.db ? "Online" : "Down"}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2"><Server className="w-4 h-4" /> Redis</span>
            <Badge variant={data?.redis ? "success" : "secondary"}>{data?.redis ? "Online" : "Disabled"}</Badge>
          </div>
        </CardContent>
      </Card>
    </Shell>
  );
}
