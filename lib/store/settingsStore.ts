import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  toggleSound: () => void;
  toggleHaptics: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      hapticsEnabled: true,
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
      toggleHaptics: () => set((s) => ({ hapticsEnabled: !s.hapticsEnabled })),
    }),
    { name: "neural-pulse-settings", version: 1 }
  )
);
