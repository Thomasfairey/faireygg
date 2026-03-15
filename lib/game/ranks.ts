export interface Rank {
  id: string;
  name: string;
  minGames: number;
  color: string;
  glowClass: string;
  icon: string;
  themeUnlock?: string; // theme id unlocked at this rank
}

export const RANKS: Rank[] = [
  { id: "cadet", name: "Cadet", minGames: 0, color: "#6B7280", glowClass: "", icon: "🛰️" },
  { id: "co-pilot", name: "Co-Pilot", minGames: 10, color: "#3B82F6", glowClass: "text-glow-cyan", icon: "🪐", themeUnlock: "neon-pink" },
  { id: "pilot", name: "Pilot", minGames: 30, color: "#a855f7", glowClass: "text-glow-purple", icon: "🚀", themeUnlock: "neon-green" },
  { id: "commander", name: "Commander", minGames: 75, color: "#EC4899", glowClass: "text-glow-magenta", icon: "🌟", themeUnlock: "gold" },
  { id: "test-pilot", name: "Test Pilot", minGames: 150, color: "#ffaa00", glowClass: "text-glow-amber", icon: "🛸", themeUnlock: "crimson" },
  { id: "lightspeed", name: "Lightspeed", minGames: 300, color: "#00f0ff", glowClass: "text-glow-cyan", icon: "💫", themeUnlock: "hologram" },
];

export interface Theme {
  id: string;
  name: string;
  requiredRank: string;
  accent: string;
  accent2: string;
}

export const THEMES: Theme[] = [
  { id: "default", name: "Deep Space", requiredRank: "cadet", accent: "#00f0ff", accent2: "#a855f7" },
  { id: "neon-pink", name: "Neon Pink", requiredRank: "co-pilot", accent: "#ff69b4", accent2: "#00f0ff" },
  { id: "neon-green", name: "Neon Green", requiredRank: "pilot", accent: "#00ff88", accent2: "#00f0ff" },
  { id: "gold", name: "Gold", requiredRank: "commander", accent: "#ffd700", accent2: "#ff8c00" },
  { id: "crimson", name: "Crimson", requiredRank: "test-pilot", accent: "#dc143c", accent2: "#ff4500" },
  { id: "hologram", name: "Hologram", requiredRank: "lightspeed", accent: "#e0e0ff", accent2: "#a855f7" },
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

export function getUnlockedThemes(totalGames: number): Theme[] {
  const rank = getRankForGames(totalGames);
  const rankIdx = RANKS.indexOf(rank);
  return THEMES.filter((t) => {
    const reqRank = RANKS.find((r) => r.id === t.requiredRank);
    if (!reqRank) return false;
    return RANKS.indexOf(reqRank) <= rankIdx;
  });
}
