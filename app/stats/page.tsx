"use client";

import { motion } from "framer-motion";
import { MODES } from "@/lib/game/modes";
import { useProgressionStore } from "@/lib/store/progressionStore";
import { getRankForGames, getNextRank, getRankProgress, RANKS } from "@/lib/game/ranks";
import { getScoreLabel } from "@/lib/game/scoring";
import { usePlayStreakStore } from "@/lib/store/playStreakStore";
import { useDailySyncStore } from "@/lib/store/dailySyncStore";
import ProgressRing from "@/components/ui/ProgressRing";
import { useHydrated } from "@/lib/hooks/useHydrated";

const EMPTY_OBJ = {} as Record<string, never>;

export default function StatsPage() {
  const hydrated = useHydrated();
  const totalGamesPlayed = useProgressionStore((s) => s.totalGamesPlayed);
  const leaderboards = useProgressionStore((s) => s.leaderboards ?? EMPTY_OBJ);
  const history = useProgressionStore((s) => s.history ?? EMPTY_OBJ);
  const streaks = useProgressionStore((s) => s.streaks ?? EMPTY_OBJ);
  const playStreak = usePlayStreakStore((s) => s.currentStreak);
  const bestPlayStreak = usePlayStreakStore((s) => s.bestStreak);
  const syncBest = useDailySyncStore((s) => s.bestSyncScore);
  const syncRecords = useDailySyncStore((s) => s.records ?? []);

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
          className="text-2xl font-bold text-white mt-8 mb-5"
        >
          Statistics
        </motion.h1>

        {/* Rank + Streak Overview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-5 mb-4"
        >
          <div className="flex items-center gap-5">
            <ProgressRing progress={progress} size={72} strokeWidth={4} color={rank.color}>
              <span className="text-2xl">{rank.icon}</span>
            </ProgressRing>
            <div className="flex-1">
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

          {/* Rank roadmap */}
          <div className="flex items-center gap-1 mt-4">
            {RANKS.map((r, i) => {
              const isUnlocked = totalGamesPlayed >= r.minGames;
              const isCurrent = r.id === rank.id;
              return (
                <div key={r.id} className="flex items-center flex-1">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[8px]"
                    style={{
                      background: isUnlocked ? `${r.color}30` : "rgba(255,255,255,0.05)",
                      border: isCurrent ? `2px solid ${r.color}` : "1px solid rgba(255,255,255,0.1)",
                      boxShadow: isCurrent ? `0 0 8px ${r.color}40` : "none",
                    }}
                  >
                    {isUnlocked ? r.icon : ""}
                  </div>
                  {i < RANKS.length - 1 && (
                    <div className="flex-1 h-[1px] mx-0.5" style={{ background: isUnlocked ? `${r.color}40` : "rgba(255,255,255,0.06)" }} />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Key metrics */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-sm grid grid-cols-3 gap-2 mb-4"
        >
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
            <div className="text-lg font-bold text-neon-amber tabular-nums">🔥 {playStreak}</div>
            <div className="text-[9px] text-white/25 uppercase tracking-wider mt-1">Day streak</div>
            <div className="text-[8px] text-white/15">best: {bestPlayStreak}</div>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
            <div className="text-lg font-bold text-neon-cyan tabular-nums">{syncBest > 0 ? `${syncBest}%` : "—"}</div>
            <div className="text-[9px] text-white/25 uppercase tracking-wider mt-1">Best sync</div>
            <div className="text-[8px] text-white/15">{syncRecords.length} syncs</div>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
            <div className="text-lg font-bold text-white/60 tabular-nums">{totalGamesPlayed}</div>
            <div className="text-[9px] text-white/25 uppercase tracking-wider mt-1">Total games</div>
            <div className="text-[8px] text-white/15">{MODES.filter((m) => (history[m.id] ?? []).length > 0).length} modes</div>
          </div>
        </motion.div>

        {/* Daily Sync history chart */}
        {syncRecords.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="w-full max-w-sm rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 mb-4"
          >
            <div className="text-[10px] text-white/30 uppercase tracking-wider mb-3">Sync Score History</div>
            <SyncChart data={syncRecords.slice(-14).map((r) => r.syncScore)} />
          </motion.div>
        )}

        {/* Per-mode stats */}
        <div className="w-full max-w-sm flex flex-col gap-3">
          {MODES.filter((m) => !m.isZen).map((mode, i) => {
            const modeHistory = history[mode.id] ?? [];
            const modeStreak = streaks[mode.id] ?? { current: 0, best: 0 };
            const modeBoard = leaderboards[mode.id] ?? [];
            const best = modeBoard.length > 0 ? modeBoard[0].score : null;

            return (
              <motion.div
                key={mode.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
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
                  <>
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
                          {(() => {
                            const valid = modeHistory.filter((h: { score: number }) => h.score < 9999);
                            if (valid.length === 0) return "—";
                            return getScoreLabel(
                              Math.round(valid.reduce((a: number, b: { score: number }) => a + b.score, 0) / valid.length),
                              mode.id
                            );
                          })()}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-white/30 uppercase tracking-wider">Streak</div>
                        <div className="font-bold tabular-nums text-sm text-white/60">
                          🔥 {modeStreak.current}
                        </div>
                        <div className="text-[8px] text-white/15">best: {modeStreak.best}</div>
                      </div>
                    </div>

                    {/* Improved chart with labels */}
                    {modeHistory.length > 1 && (
                      <div className="mt-3">
                        <ImprovedChart
                          data={modeHistory.slice(-20).map((h: { score: number }) => h.score)}
                          color={mode.color}
                          invert={mode.scoreLowerIsBetter}
                          unit={mode.scoreUnit}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-white/20 text-center py-2">No games yet</div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SyncChart({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const h = 50;
  const w = 280;
  const max = Math.max(...data, 1);

  return (
    <svg viewBox={`0 0 ${w} ${h + 20}`} className="w-full">
      {/* Grid lines */}
      {[0, 25, 50, 75, 100].map((v) => {
        const y = h - (v / max) * h + 4;
        return (
          <g key={v}>
            <line x1={24} y1={y} x2={w} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
            <text x={20} y={y + 3} fill="rgba(255,255,255,0.15)" fontSize={7} textAnchor="end">{v}</text>
          </g>
        );
      })}

      {/* Data line */}
      <polyline
        points={data.map((val, i) => {
          const x = 28 + (i / (data.length - 1)) * (w - 32);
          const y = h - (val / max) * h + 4;
          return `${x},${y}`;
        }).join(" ")}
        fill="none"
        stroke="#00f0ff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: "drop-shadow(0 0 4px #00f0ff)" }}
      />

      {/* Data dots */}
      {data.map((val, i) => {
        const x = 28 + (i / (data.length - 1)) * (w - 32);
        const y = h - (val / max) * h + 4;
        return (
          <circle key={i} cx={x} cy={y} r={2.5} fill="#00f0ff" style={{ filter: "drop-shadow(0 0 3px #00f0ff)" }} />
        );
      })}

      {/* Latest value label */}
      <text
        x={28 + ((data.length - 1) / (data.length - 1)) * (w - 32)}
        y={h - (data[data.length - 1] / max) * h - 4}
        fill="#00f0ff"
        fontSize={9}
        textAnchor="middle"
        fontWeight="bold"
      >
        {data[data.length - 1]}%
      </text>
    </svg>
  );
}

function ImprovedChart({
  data,
  color,
  invert,
  unit,
}: {
  data: number[];
  color: string;
  invert: boolean;
  unit: string;
}) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const allSame = min === max;
  const range = max - min || 1;
  const h = 48;
  const w = 280;
  const paddingLeft = 0;

  const points = data.map((val, i) => {
    const x = paddingLeft + (i / (data.length - 1)) * (w - paddingLeft);
    if (allSame) return { x, y: h - 4 };
    const normalized = (val - min) / range;
    const y = invert ? (1 - normalized) * (h - 8) + 4 : normalized * (h - 8) + 4;
    return { x, y };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
  const best = invert ? min : max;
  const latest = data[data.length - 1];

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h + 12}`} className="w-full" preserveAspectRatio="none">
        {/* Gradient fill */}
        <defs>
          <linearGradient id={`fill-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Fill area */}
        {!allSame && (
          <polygon
            points={`${points[0].x},${h + 4} ${polyline} ${points[points.length - 1].x},${h + 4}`}
            fill={`url(#fill-${color.replace("#", "")})`}
          />
        )}

        {/* Line */}
        <polyline
          points={polyline}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: `drop-shadow(0 0 4px ${color})` }}
        />

        {/* Latest dot */}
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r={3}
          fill={color}
          style={{ filter: `drop-shadow(0 0 4px ${color})` }}
        />
      </svg>

      {/* Labels */}
      <div className="flex justify-between text-[8px] text-white/20 mt-1 px-0.5">
        <span>{data.length} sessions</span>
        <span>latest: {latest}{unit === "ms" || unit === "ms avg" ? "ms" : unit === "pts" ? "pts" : unit === "lvl" ? ` lvl` : unit === "hits" ? ` hits` : ""}</span>
      </div>
    </div>
  );
}
