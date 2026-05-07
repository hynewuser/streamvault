"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Radio,
  MessageSquare,
  Search,
  Download,
  Bell,
  Activity,
  Settings,
  LogOut,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/streams", label: "Streams", icon: Radio },
  { href: "/feed", label: "Live Feed", icon: MessageSquare },
  { href: "/search", label: "Search", icon: Search },
  { href: "/exports", label: "Exports", icon: Download },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/health", label: "Health", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 border-r border-border/50 bg-card/30 backdrop-blur-xl h-screen sticky top-0">
      <div className="px-6 py-6 border-b border-border/50">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold gradient-text text-lg leading-none">StreamVault</div>
            <div className="text-[10px] text-muted-foreground tracking-widest mt-1">v1.0 · LIVE</div>
          </div>
        </Link>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((it) => {
          const active = path === it.href || (it.href !== "/" && path.startsWith(it.href));
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all",
                active
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="w-4 h-4" />
              {it.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-border/50">
        <button
          onClick={() => {
            localStorage.removeItem("sv_token");
            location.href = "/login";
          }}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm w-full text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </aside>
  );
}
