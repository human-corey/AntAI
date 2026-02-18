"use client";

import { useNotificationStore } from "@/stores/notification-store";
import { ActivityItem } from "./activity-item";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell } from "lucide-react";

export function ActivityFeed() {
  const { activities, markRead, markAllRead } = useNotificationStore();
  const unreadCount = activities.filter((a) => !a.read).length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-[var(--muted-foreground)]" />
          <h3 className="text-sm font-medium">Activity</h3>
          {unreadCount > 0 && (
            <span className="text-[10px] bg-[var(--primary)] text-[var(--primary-foreground)] px-1.5 py-0.5 rounded-full font-medium">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-[10px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>
      <ScrollArea className="flex-1">
        {activities.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-sm text-[var(--muted-foreground)]">
            No activity yet
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {activities.map((entry) => (
              <ActivityItem
                key={entry.id}
                entry={entry}
                onMarkRead={() => markRead(entry.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
