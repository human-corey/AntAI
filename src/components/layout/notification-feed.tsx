"use client";

import { useUiStore } from "@/stores/ui-store";
import { useNotificationStore } from "@/stores/notification-store";
import { ActivityFeed } from "@/components/notifications/activity-feed";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function NotificationBell() {
  const { notificationPanelOpen, toggleNotificationPanel } = useUiStore();
  const unreadCount = useNotificationStore((s) => s.activities.filter((a) => !a.read).length);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 relative"
        onClick={toggleNotificationPanel}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] text-[9px] flex items-center justify-center font-medium">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {notificationPanelOpen && (
        <div
          className={cn(
            "absolute right-0 top-full mt-2 w-80 h-96 rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-lg z-50 overflow-hidden",
            "animate-in fade-in slide-in-from-top-2"
          )}
        >
          <ActivityFeed />
        </div>
      )}
    </div>
  );
}
