"use client";

import "./globals.css";
import { ThemeProvider } from "next-themes";
import { QueryProvider } from "@/providers/query-provider";
import { WebSocketProvider } from "@/providers/websocket-provider";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>AntAI — Agent Teams Visualizer</title>
        <meta
          name="description"
          content="Visual GUI for Claude Code Agent Teams"
        />
      </head>
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <WebSocketProvider>
              <div className="flex h-screen overflow-hidden">
                <AppSidebar />
                <main className="flex-1 overflow-auto">{children}</main>
              </div>
            </WebSocketProvider>
          </QueryProvider>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "var(--card)",
                color: "var(--foreground)",
                border: "1px solid var(--border)",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
