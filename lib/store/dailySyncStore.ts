import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface DailySyncRecord {
  date: string;
  syncScore: number;
  subScores: { classic: number; speedRound: number; sequence: number; inhibition: number };
  normalizedScores: { classic: number; speedRound: number; sequence: number; inhibition: number };
  completedAt: string;
}

interface DailySyncState {
  records: DailySyncRecord[];
  bestSyncScore: number;
  currentStreak: number;
  bestStreak: number;
  lastCompletedDate: string;

  isCompletedToday: () => boolean;
  recordSync: (record: Omit<DailySyncRecord, "completedAt">) => void;
  getTodayRecord: () => DailySyncRecord | null;
}

export const useDailySyncStore = create<DailySyncState>()(
  persist(
    (set, get) => ({
      records: [],
      bestSyncScore: 0,
      currentStreak: 0,
      bestStreak: 0,
      lastCompletedDate: "",

      isCompletedToday: () => {
        const today = new Date().toLocaleDateString("en-CA");
        return get().records.some((r) => r.date === today);
      },

      getTodayRecord: () => {
        const today = new Date().toLocaleDateString("en-CA");
        return get().records.find((r) => r.date === today) ?? null;
      },

      recordSync: (record) => {
        const state = get();
        const today = new Date().toLocaleDateString("en-CA");

        // Already completed today — don't overwrite
        if (state.records.some((r) => r.date === today)) return;

        const full: DailySyncRecord = {
          ...record,
          completedAt: new Date().toISOString(),
        };

        // Streak logic
        const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("en-CA");
        let newStreak: number;
        if (state.lastCompletedDate === yesterday) {
          newStreak = state.currentStreak + 1;
        } else if (state.lastCompletedDate === today) {
          newStreak = state.currentStreak;
        } else {
          newStreak = 1;
        }

        set({
          records: [...state.records.slice(-29), full],
          bestSyncScore: Math.max(state.bestSyncScore, record.syncScore),
          currentStreak: newStreak,
          bestStreak: Math.max(state.bestStreak, newStreak),
          lastCompletedDate: today,
        });
      },
    }),
    { name: "neural-pulse-daily-sync", version: 1 }
  )
);
