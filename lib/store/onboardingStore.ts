import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OnboardingState {
  playedModes: string[];
  hasCompletedFirstGame: boolean;
  hasPlayed: (modeId: string) => boolean;
  markPlayed: (modeId: string) => void;
  setFirstGameComplete: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      playedModes: [],
      hasCompletedFirstGame: false,
      hasPlayed: (modeId) => get().playedModes.includes(modeId),
      markPlayed: (modeId) => {
        if (!get().playedModes.includes(modeId)) {
          set({ playedModes: [...get().playedModes, modeId] });
        }
      },
      setFirstGameComplete: () => set({ hasCompletedFirstGame: true }),
    }),
    { name: "neural-pulse-onboarding", version: 1 }
  )
);
