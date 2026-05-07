"use client";
import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff } from "lucide-react";

export function Topbar({ title }: { title: string }) {
  const [connected, setConnected] = useState(false);
  const [mpm, setMpm] = useState(0);

  useEffect(() => {
    const s = getSocket();
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onSystem = (e: any) => {
      if (e?.type === "heartbeat") setMpm(e.messagesPerMin ?? 0);
    };
    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.on("system", onSystem);
    setConnected(s.connected);
    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("system", onSystem);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/60 border-b border-border/50 px-6 py-4 flex items-center justify-between">
      <h1 className="text-xl font-semibold">{title}</h1>
      <div className="flex items-center gap-3">
        <Badge variant={connected ? "success" : "destructive"} className="gap-1.5">
          {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {connected ? "Connected" : "Offline"}
        </Badge>
        <Badge variant="secondary">{mpm} msg/min</Badge>
      </div>
    </header>
  );
}
