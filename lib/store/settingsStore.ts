import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  activeTheme: string;
  toggleSound: () => void;
  toggleHaptics: () => void;
  setTheme: (themeId: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      hapticsEnabled: true,
      activeTheme: "default",
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
      toggleHaptics: () => set((s) => ({ hapticsEnabled: !s.hapticsEnabled })),
      setTheme: (themeId) => set({ activeTheme: themeId }),
    }),
    { name: "neural-pulse-settings", version: 2 }
  )
);
