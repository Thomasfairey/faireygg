import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DailyChallengeState {
  completedDates: string[];
  currentStreak: number;
  bestStreak: number;
  lastCompletedDate: string;
  markCompleted: (date: string) => void;
  isCompletedToday: () => boolean;
}

export const useDailyChallengeStore = create<DailyChallengeState>()(
  persist(
    (set, get) => ({
      completedDates: [],
      currentStreak: 0,
      bestStreak: 0,
      lastCompletedDate: "",

      markCompleted: (date) => {
        const state = get();
        if (state.completedDates.includes(date)) return;

        const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("en-CA");
        let newStreak: number;
        if (state.lastCompletedDate === yesterday) {
          newStreak = state.currentStreak + 1;
        } else {
          newStreak = 1;
        }

        set({
          completedDates: [...state.completedDates.slice(-29), date],
          currentStreak: newStreak,
          bestStreak: Math.max(state.bestStreak, newStreak),
          lastCompletedDate: date,
        });
      },

      isCompletedToday: () => {
        const today = new Date().toLocaleDateString("en-CA");
        return get().completedDates.includes(today);
      },
    }),
    { name: "neural-pulse-daily", version: 1 }
  )
);
