"use client";
import { Shell } from "@/components/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";
import { Badge } from "@/components/ui/badge";
import { formatTime } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

export default function FeedPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const bufferRef = useRef<any[]>([]);

  useEffect(() => {
    const s = getSocket();
    const onMsg = (m: any) => {
      if (pausedRef.current) {
        bufferRef.current.unshift(m);
        if (bufferRef.current.length > 500) bufferRef.current.length = 500;
        return;
      }
      setMessages((prev) => [m, ...prev].slice(0, 300));
    };
    s.on("message", onMsg);
    return () => {
      s.off("message", onMsg);
    };
  }, []);

  useEffect(() => {
    if (!paused && bufferRef.current.length) {
      setMessages((prev) => [...bufferRef.current, ...prev].slice(0, 300));
      bufferRef.current = [];
    }
  }, [paused]);

  return (
    <Shell title="Live Feed">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span className="live-dot" /> Real-time stream
          </CardTitle>
          <div className="flex items-center gap-2 text-sm">
            Pause <Switch checked={paused} onCheckedChange={setPaused} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="terminal text-sm h-[70vh] overflow-y-auto scroll-thin space-y-1.5 pr-2">
            {messages.map((m) => (
              <div key={m.id} className="flex gap-2 items-baseline animate-fade-in">
                <span className="text-muted-foreground/70 text-xs shrink-0">{formatTime(m.publishedAt)}</span>
                {m.type === "superchat" && <Badge variant="warning">SC ${m.superchatAmount} {m.superchatCurrency}</Badge>}
                {m.isMember && <Badge variant="success">MEMBER</Badge>}
                {m.isModerator && <Badge variant="default">MOD</Badge>}
                {m.isOwner && <Badge variant="destructive">OWNER</Badge>}
                <span className="font-semibold text-primary shrink-0 max-w-[160px] truncate">{m.authorName}</span>
                <span className="text-foreground/90 break-words">{m.text}</span>
              </div>
            ))}
            {!messages.length && (
              <div className="text-muted-foreground text-center py-12">
                Waiting for live messages... add a livestream in Streams.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Shell>
  );
}
