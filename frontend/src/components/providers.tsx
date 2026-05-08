"use client";

import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() =>
    new QueryClient({
      defaultOptions: {
        queries: { refetchOnWindowFocus: false, staleTime: 30_000 },
      },
    })
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryClientProvider client={client}>
        {children}
        <Toaster richColors theme="dark" position="bottom-right" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
