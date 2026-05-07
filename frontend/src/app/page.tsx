"use client";
import { Shell } from "@/components/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatNumber } from "@/lib/utils";
import { Radio, MessageSquare, Users, Bell, Download, Activity } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function HomePage() {
  const { data: ov } = useQuery({
    queryKey: ["overview"],
    queryFn: async () => (await api.get("/api/analytics/overview")).data,
    refetchInterval: 5000,
  });
  const { data: vel } = useQuery({
    queryKey: ["velocity"],
    queryFn: async () => (await api.get("/api/analytics/velocity?minutes=60")).data,
    refetchInterval: 10_000,
  });
  const { data: top } = useQuery({
    queryKey: ["top-chatters"],
    queryFn: async () => (await api.get("/api/messages/stats/top-chatters?limit=10")).data,
    refetchInterval: 30_000,
  });

  const stats = [
    { label: "Live Streams", value: ov?.liveStreams ?? 0, icon: Radio, color: "from-red-500 to-pink-500" },
    { label: "Total Streams", value: ov?.streams ?? 0, icon: Activity, color: "from-purple-500 to-blue-500" },
    { label: "Messages", value: formatNumber(ov?.messages ?? 0), icon: MessageSquare, color: "from-blue-500 to-cyan-500" },
    { label: "Authors", value: formatNumber(ov?.authors ?? 0), icon: Users, color: "from-emerald-500 to-teal-500" },
    { label: "Alert Rules", value: ov?.alertRules ?? 0, icon: Bell, color: "from-amber-500 to-orange-500" },
    { label: "Exports", value: ov?.exports ?? 0, icon: Download, color: "from-fuchsia-500 to-purple-500" },
  ];

  return (
    <Shell title="Overview">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="p-5">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Message Velocity (60 min)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={vel?.points ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="t" hide />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                    }}
                  />
                  <Line type="monotone" dataKey="c" stroke="hsl(271 91% 65%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Chatters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(top?.items ?? []).slice(0, 10).map((c: any, i: number) => (
                <div key={c.channelId} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-muted-foreground w-5">#{i + 1}</span>
                    <span className="truncate">{c.name}</span>
                  </div>
                  <span className="font-mono text-primary">{c.count}</span>
                </div>
              ))}
              {!top?.items?.length && <div className="text-sm text-muted-foreground">No data yet</div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
