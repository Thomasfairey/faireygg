export interface Rank {
  id: string;
  name: string;
  minGames: number;
  color: string;
  glowClass: string;
}

export const RANKS: Rank[] = [
  { id: "cadet", name: "Cadet", minGames: 0, color: "#6B7280", glowClass: "" },
  { id: "co-pilot", name: "Co-Pilot", minGames: 10, color: "#3B82F6", glowClass: "text-glow-cyan" },
  { id: "pilot", name: "Pilot", minGames: 30, color: "#a855f7", glowClass: "text-glow-purple" },
  { id: "commander", name: "Commander", minGames: 75, color: "#EC4899", glowClass: "text-glow-magenta" },
  { id: "test-pilot", name: "Test Pilot", minGames: 150, color: "#ffaa00", glowClass: "text-glow-amber" },
  { id: "lightspeed", name: "Lightspeed", minGames: 300, color: "#00f0ff", glowClass: "text-glow-cyan" },
];

export function getRankForGames(totalGames: number): Rank {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (totalGames >= r.minGames) rank = r;
  }
  return rank;
}

export function getNextRank(totalGames: number): Rank | null {
  const current = getRankForGames(totalGames);
  const idx = RANKS.indexOf(current);
  return idx < RANKS.length - 1 ? RANKS[idx + 1] : null;
}

export function getRankProgress(totalGames: number): number {
  const current = getRankForGames(totalGames);
  const next = getNextRank(totalGames);
  if (!next) return 1;
  return (totalGames - current.minGames) / (next.minGames - current.minGames);
}
