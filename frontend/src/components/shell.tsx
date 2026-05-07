"use client";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  const router = useRouter();
  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("sv_token")) {
      router.replace("/login");
    }
  }, [router]);
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 min-h-screen flex flex-col">
        <Topbar title={title} />
        <main className="flex-1 p-6 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
