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
  leaderboards: Record<string, LeaderboardEntry[]>;
  history: Record<string, GameResult[]>;
  streaks: Record<string, StreakData>;
  totalGamesPlayed: number;

  recordResult: (result: GameResult, lowerIsBetter: boolean) => { isNewBest: boolean; previousRank: Rank; newRank: Rank };
  getLeaderboard: (mode: GameMode) => LeaderboardEntry[];
  getHistory: (mode: GameMode) => GameResult[];
  getStreak: (mode: GameMode) => StreakData;
  getBestScore: (mode: GameMode) => number | null;
  getRank: () => Rank;
  resetAll: () => void;
}

const DEFAULT_STREAK: StreakData = { current: 0, best: 0, lastPlayedDate: "" };

export const useProgressionStore = create<ProgressionState>()(
  persist(
    (set, get) => ({
      leaderboards: {},
      history: {},
      streaks: {},
      totalGamesPlayed: 0,

      recordResult: (result, lowerIsBetter) => {
        if (result.mode === "zen") {
          const state = get();
          const rank = getRankForGames(state.totalGamesPlayed);
          return { isNewBest: false, previousRank: rank, newRank: rank };
        }

        const state = get();
        const previousRank = getRankForGames(state.totalGamesPlayed);

        const board = [...(state.leaderboards[result.mode] ?? [])];
        board.push({ score: result.score, date: result.date });
        board.sort((a, b) => compareScores(a.score, b.score, lowerIsBetter));
        const trimmed = board.slice(0, 10);

        const prevBoard = state.leaderboards[result.mode] ?? [];
        const isNewBest =
          prevBoard.length === 0 ||
          compareScores(result.score, prevBoard[0].score, lowerIsBetter) <= 0;

        const hist = [...(state.history[result.mode] ?? []), result].slice(-200);

        const today = new Date().toLocaleDateString("en-CA");
        const streak = { ...(state.streaks[result.mode] ?? DEFAULT_STREAK) };
        if (streak.lastPlayedDate !== today) {
          const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("en-CA");
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

      getLeaderboard: (mode) => get().leaderboards[mode] ?? [],
      getHistory: (mode) => get().history[mode] ?? [],
      getStreak: (mode) => get().streaks[mode] ?? DEFAULT_STREAK,
      getBestScore: (mode) => {
        const board = get().leaderboards[mode] ?? [];
        return board.length > 0 ? board[0].score : null;
      },
      getRank: () => getRankForGames(get().totalGamesPlayed),
      resetAll: () =>
        set({
          leaderboards: {},
          history: {},
          streaks: {},
          totalGamesPlayed: 0,
        }),
    }),
    { name: "neural-pulse-progression", version: 2 }
  )
);
