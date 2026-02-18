import { create } from "zustand";
import type { AppSettings } from "@/lib/types";

interface SettingsState {
  settings: AppSettings;
  setSettings: (settings: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: AppSettings = {
  theme: "dark",
  defaultModel: "claude-sonnet-4-6",
  enableThinking: true,
  autoLayout: true,
  showMinimap: true,
  edgeAnimations: true,
  notificationSounds: false,
  logRetentionDays: 30,
};

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: defaultSettings,
  setSettings: (partial) =>
    set((s) => ({ settings: { ...s.settings, ...partial } })),
  resetSettings: () => set({ settings: defaultSettings }),
}));
