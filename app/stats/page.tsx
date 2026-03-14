"use client";

import { motion } from "framer-motion";
import { MODES } from "@/lib/game/modes";
import { useProgressionStore } from "@/lib/store/progressionStore";
import { getRankForGames, getNextRank, getRankProgress } from "@/lib/game/ranks";
import { getScoreLabel } from "@/lib/game/scoring";
import ProgressRing from "@/components/ui/ProgressRing";
import { useHydrated } from "@/lib/hooks/useHydrated";

const RANK_ICONS: Record<string, string> = {
  cadet: "🛰️",
  "co-pilot": "🌑",
  pilot: "🚀",
  commander: "🌟",
  "test-pilot": "🛸",
  lightspeed: "💫",
};

export default function StatsPage() {
  const hydrated = useHydrated();
  const totalGamesPlayed = useProgressionStore((s) => s.totalGamesPlayed);
  const leaderboards = useProgressionStore((s) => s.leaderboards);
  const history = useProgressionStore((s) => s.history);
  const streaks = useProgressionStore((s) => s.streaks);

  const rank = getRankForGames(totalGamesPlayed);
  const nextRank = getNextRank(totalGamesPlayed);
  const progress = getRankProgress(totalGamesPlayed);

  if (!hydrated) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="text-white/20 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-y-auto">
      <div className="min-h-full flex flex-col items-center px-5 pt-[env(safe-area-inset-top,16px)] pb-24">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-white mt-8 mb-6"
        >
          Statistics
        </motion.h1>

        {/* Rank Progress */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-5 mb-4"
        >
          <div className="flex items-center gap-5">
            <ProgressRing progress={progress} size={72} strokeWidth={4} color={rank.color}>
              <span className="text-2xl">{RANK_ICONS[rank.id] ?? "🛰️"}</span>
            </ProgressRing>
            <div>
              <div className={`font-bold text-xl ${rank.glowClass}`} style={{ color: rank.color }}>
                {rank.name}
              </div>
              <div className="text-sm text-white/40">{totalGamesPlayed} total games</div>
              {nextRank && (
                <div className="text-xs text-white/25 mt-1">
                  {nextRank.minGames - totalGamesPlayed} more to {nextRank.name}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Per-mode stats */}
        <div className="w-full max-w-sm flex flex-col gap-3">
          {MODES.map((mode, i) => {
            const modeHistory = history[mode.id] ?? [];
            const modeStreak = streaks[mode.id] ?? { current: 0, best: 0 };
            const modeBoard = leaderboards[mode.id] ?? [];
            const best = modeBoard.length > 0 ? modeBoard[0].score : null;

            return (
              <motion.div
                key={mode.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span>{mode.icon}</span>
                  <span className="font-bold text-sm" style={{ color: mode.color }}>
                    {mode.name}
                  </span>
                  <span className="text-xs text-white/20 ml-auto">
                    {modeHistory.length} played
                  </span>
                </div>

                {modeHistory.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-[10px] text-white/30 uppercase tracking-wider">Best</div>
                      <div className="font-bold tabular-nums text-sm" style={{ color: mode.color }}>
                        {best !== null ? getScoreLabel(best, mode.id) : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-white/30 uppercase tracking-wider">Avg</div>
                      <div className="font-bold tabular-nums text-sm text-white/60">
                        {getScoreLabel(
                          Math.round(modeHistory.reduce((a, b) => a + b.score, 0) / modeHistory.length),
                          mode.id
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-white/30 uppercase tracking-wider">Streak</div>
                      <div className="font-bold tabular-nums text-sm text-white/60">
                        {modeStreak.current}d / {modeStreak.best}d
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-white/20 text-center py-2">No games yet</div>
                )}

                {modeHistory.length > 1 && (
                  <MiniChart
                    data={modeHistory.slice(-20).map((h) => h.score)}
                    color={mode.color}
                    invert={mode.scoreLowerIsBetter}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MiniChart({
  data,
  color,
  invert,
}: {
  data: number[];
  color: string;
  invert: boolean;
}) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const h = 40;
  const w = 260;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * w;
    const normalized = (val - min) / range;
    const y = invert ? normalized * h : (1 - normalized) * h;
    return `${x},${y + 4}`;
  });

  return (
    <svg viewBox={`0 0 ${w} ${h + 8}`} className="w-full mt-3 opacity-50" preserveAspectRatio="none">
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 4px ${color})` }}
      />
    </svg>
  );
}
