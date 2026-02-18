"use client";

import { useEffect } from "react";
import { useUiStore } from "@/stores/ui-store";

export function useKeyboardShortcuts() {
  const { closeDrawer, drawerOpen, toggleNotificationPanel, toggleSidebar } = useUiStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Escape: close drawer or notification panel
      if (e.key === "Escape") {
        if (drawerOpen) {
          closeDrawer();
          e.preventDefault();
        }
      }

      // Ctrl/Cmd + B: toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        toggleSidebar();
        e.preventDefault();
      }

      // Ctrl/Cmd + Shift + N: toggle notifications
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "N") {
        toggleNotificationPanel();
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [closeDrawer, drawerOpen, toggleNotificationPanel, toggleSidebar]);
}
