"use client";

import { useProgressionStore } from "@/lib/store/progressionStore";
import { getNextRank, getRankProgress } from "@/lib/game/ranks";
import ProgressRing from "@/components/ui/ProgressRing";

export default function RankBadge() {
  const totalGamesPlayed = useProgressionStore((s) => s.totalGamesPlayed);
  const rank = useProgressionStore((s) => s.getRank());
  const next = getNextRank(totalGamesPlayed);
  const progress = getRankProgress(totalGamesPlayed);

  return (
    <div className="flex items-center gap-4">
      <ProgressRing progress={progress} size={64} strokeWidth={3} color={rank.color}>
        <span className="text-2xl">
          {rank.id === "cadet" && "🔰"}
          {rank.id === "co-pilot" && "✈️"}
          {rank.id === "pilot" && "🚀"}
          {rank.id === "commander" && "⭐"}
          {rank.id === "test-pilot" && "🛸"}
          {rank.id === "lightspeed" && "💫"}
        </span>
      </ProgressRing>
      <div>
        <div className={`font-bold text-lg ${rank.glowClass}`} style={{ color: rank.color }}>
          {rank.name}
        </div>
        {next && (
          <div className="text-xs text-white/40">
            {next.minGames - totalGamesPlayed} games to {next.name}
          </div>
        )}
        {!next && (
          <div className="text-xs text-white/40">Max rank achieved</div>
        )}
      </div>
    </div>
  );
}
