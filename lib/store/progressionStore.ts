import { create } from "zustand";
import { persist } from "zustand/middleware";
import { GameMode } from "../game/modes";
import { LeaderboardEntry, GameResult, compareScores } from "../game/scoring";
import { getRankForGames, Rank } from "../game/ranks";

interface StreakData {
  current: number;
  best: number;
  lastPlayedDate: string;
}

interface ProgressionState {
  leaderboards: Record<GameMode, LeaderboardEntry[]>;
  history: Record<GameMode, GameResult[]>;
  streaks: Record<GameMode, StreakData>;
  totalGamesPlayed: number;

  recordResult: (result: GameResult, lowerIsBetter: boolean) => { isNewBest: boolean; previousRank: Rank; newRank: Rank };
  getLeaderboard: (mode: GameMode) => LeaderboardEntry[];
  getHistory: (mode: GameMode) => GameResult[];
  getStreak: (mode: GameMode) => StreakData;
  getBestScore: (mode: GameMode) => number | null;
  getRank: () => Rank;
  resetAll: () => void;
}

const EMPTY_MODES: Record<GameMode, LeaderboardEntry[]> = {
  classic: [],
  "speed-round": [],
  sequence: [],
  "shrinking-target": [],
  "aim-trainer": [],
};

const EMPTY_HISTORY: Record<GameMode, GameResult[]> = {
  classic: [],
  "speed-round": [],
  sequence: [],
  "shrinking-target": [],
  "aim-trainer": [],
};

const EMPTY_STREAKS: Record<GameMode, StreakData> = {
  classic: { current: 0, best: 0, lastPlayedDate: "" },
  "speed-round": { current: 0, best: 0, lastPlayedDate: "" },
  sequence: { current: 0, best: 0, lastPlayedDate: "" },
  "shrinking-target": { current: 0, best: 0, lastPlayedDate: "" },
  "aim-trainer": { current: 0, best: 0, lastPlayedDate: "" },
};

export const useProgressionStore = create<ProgressionState>()(
  persist(
    (set, get) => ({
      leaderboards: { ...EMPTY_MODES },
      history: { ...EMPTY_HISTORY },
      streaks: { ...EMPTY_STREAKS },
      totalGamesPlayed: 0,

      recordResult: (result, lowerIsBetter) => {
        const state = get();
        const previousRank = getRankForGames(state.totalGamesPlayed);

        // Update leaderboard
        const board = [...state.leaderboards[result.mode]];
        board.push({ score: result.score, date: result.date });
        board.sort((a, b) => compareScores(a.score, b.score, lowerIsBetter));
        const trimmed = board.slice(0, 10);

        const isNewBest =
          state.leaderboards[result.mode].length === 0 ||
          compareScores(result.score, state.leaderboards[result.mode][0].score, lowerIsBetter) <= 0;

        // Update history (keep last 200)
        const hist = [...state.history[result.mode], result].slice(-200);

        // Update streak
        const today = new Date().toISOString().split("T")[0];
        const streak = { ...state.streaks[result.mode] };
        if (streak.lastPlayedDate === today) {
          // Already played today, keep current streak
        } else {
          const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
          if (streak.lastPlayedDate === yesterday) {
            streak.current += 1;
          } else {
            streak.current = 1;
          }
          streak.lastPlayedDate = today;
        }
        streak.best = Math.max(streak.best, streak.current);

        const newTotal = state.totalGamesPlayed + 1;
        const newRank = getRankForGames(newTotal);

        set({
          leaderboards: { ...state.leaderboards, [result.mode]: trimmed },
          history: { ...state.history, [result.mode]: hist },
          streaks: { ...state.streaks, [result.mode]: streak },
          totalGamesPlayed: newTotal,
        });

        return { isNewBest, previousRank, newRank };
      },

      getLeaderboard: (mode) => get().leaderboards[mode],
      getHistory: (mode) => get().history[mode],
      getStreak: (mode) => get().streaks[mode],
      getBestScore: (mode) => {
        const board = get().leaderboards[mode];
        return board.length > 0 ? board[0].score : null;
      },
      getRank: () => getRankForGames(get().totalGamesPlayed),
      resetAll: () =>
        set({
          leaderboards: { ...EMPTY_MODES },
          history: { ...EMPTY_HISTORY },
          streaks: { ...EMPTY_STREAKS },
          totalGamesPlayed: 0,
        }),
    }),
    { name: "neural-pulse-progression", version: 1 }
  )
);
