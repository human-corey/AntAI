import { create } from "zustand";

interface UiState {
  sidebarCollapsed: boolean;
  drawerOpen: boolean;
  drawerAgentId: string | null;
  activeViewMode: "kanban" | "list" | "inline";
  notificationPanelOpen: boolean;

  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  openDrawer: (agentId: string) => void;
  closeDrawer: () => void;
  setViewMode: (mode: "kanban" | "list" | "inline") => void;
  toggleNotificationPanel: () => void;
  setNotificationPanelOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  drawerOpen: false,
  drawerAgentId: null,
  activeViewMode: "kanban",
  notificationPanelOpen: false,

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  openDrawer: (agentId) => set({ drawerOpen: true, drawerAgentId: agentId }),
  closeDrawer: () => set({ drawerOpen: false, drawerAgentId: null }),
  setViewMode: (mode) => set({ activeViewMode: mode }),
  toggleNotificationPanel: () => set((s) => ({ notificationPanelOpen: !s.notificationPanelOpen })),
  setNotificationPanelOpen: (open) => set({ notificationPanelOpen: open }),
}));
