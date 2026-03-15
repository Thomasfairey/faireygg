import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PlayStreakState {
  currentStreak: number;
  bestStreak: number;
  lastPlayDate: string; // "YYYY-MM-DD"
  recordPlay: () => void;
}

export const usePlayStreakStore = create<PlayStreakState>()(
  persist(
    (set, get) => ({
      currentStreak: 0,
      bestStreak: 0,
      lastPlayDate: "",

      recordPlay: () => {
        const state = get();
        const today = new Date().toLocaleDateString("en-CA");

        if (state.lastPlayDate === today) return; // Already recorded today

        const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("en-CA");
        const twoDaysAgo = new Date(Date.now() - 172800000).toLocaleDateString("en-CA");

        let newStreak: number;
        if (state.lastPlayDate === yesterday) {
          // Consecutive day
          newStreak = state.currentStreak + 1;
        } else if (state.lastPlayDate === twoDaysAgo) {
          // Missed one day — 48hr grace window, reset
          newStreak = 1;
        } else if (state.lastPlayDate === "") {
          // First ever play
          newStreak = 1;
        } else {
          // Missed more than 48h, reset
          newStreak = 1;
        }

        set({
          currentStreak: newStreak,
          bestStreak: Math.max(state.bestStreak, newStreak),
          lastPlayDate: today,
        });
      },
    }),
    { name: "neural-pulse-play-streak", version: 1 }
  )
);
