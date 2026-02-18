"use client";

import { ProjectTabs } from "@/components/layout/project-tabs";
import { AgentDrawer } from "@/components/agent-detail/agent-drawer";
import { NotificationBell } from "@/components/layout/notification-feed";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useKeyboardShortcuts();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center border-b border-[var(--border)] bg-[var(--card)]">
        <ProjectTabs />
        <div className="ml-auto pr-4">
          <NotificationBell />
        </div>
      </div>
      <div className="flex-1 overflow-auto">{children}</div>
      <AgentDrawer />
    </div>
  );
}
