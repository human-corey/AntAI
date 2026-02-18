import { create } from "zustand";
import type { ActivityEntry } from "@/lib/types";

interface NotificationState {
  activities: ActivityEntry[];
  unreadCount: number;

  addActivity: (entry: ActivityEntry) => void;
  setActivities: (entries: ActivityEntry[]) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clearActivities: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  activities: [],
  unreadCount: 0,

  addActivity: (entry) =>
    set((s) => ({
      activities: [entry, ...s.activities].slice(0, 500),
      unreadCount: s.unreadCount + (entry.read ? 0 : 1),
    })),
  setActivities: (entries) =>
    set({
      activities: entries,
      unreadCount: entries.filter((e) => !e.read).length,
    }),
  markAllRead: () =>
    set((s) => ({
      activities: s.activities.map((a) => ({ ...a, read: true })),
      unreadCount: 0,
    })),
  markRead: (id) =>
    set((s) => ({
      activities: s.activities.map((a) =>
        a.id === id ? { ...a, read: true } : a
      ),
      unreadCount: Math.max(0, s.unreadCount - 1),
    })),
  clearActivities: () => set({ activities: [], unreadCount: 0 }),
}));
