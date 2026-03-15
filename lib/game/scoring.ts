import { GameMode } from "./modes";

export interface GameResult {
  mode: GameMode;
  score: number;
  date: string;
  details?: Record<string, number>;
}

export interface LeaderboardEntry {
  score: number;
  date: string;
}

export function getScoreLabel(score: number, mode: GameMode): string {
  switch (mode) {
    case "classic":
    case "speed-round":
    case "aim-trainer":
      return `${score}ms`;
    case "sequence":
      return `Level ${score}`;
    case "shrinking-target":
      return `${score} hits`;
    case "inhibition":
      return `${score} pts`;
    case "zen":
      return "";
  }
}

export function getReactionMessage(ms: number): string {
  if (ms < 150) return "Superhuman!";
  if (ms < 200) return "Incredible!";
  if (ms < 250) return "Lightning fast!";
  if (ms < 300) return "Great reflexes!";
  if (ms < 350) return "Nice!";
  if (ms < 400) return "Not bad";
  return "Keep practising";
}

export function getInhibitionMessage(score: number): string {
  if (score > 7000) return "Iron will!";
  if (score > 5000) return "Total control!";
  if (score > 3500) return "Strong discipline!";
  if (score > 2000) return "Getting focused";
  return "Keep practising";
}

export function compareScores(a: number, b: number, lowerIsBetter: boolean): number {
  return lowerIsBetter ? a - b : b - a;
}

// --- Neural Sync Score ---

export interface SyncSubScore {
  mode: string;
  icon: string;
  rawScore: number;
  normalizedPct: number;
  label: string;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function normalizeClassic(ms: number): number {
  return clamp(100 - ((ms - 150) / 350) * 100, 0, 100);
}

function normalizeSpeedRound(ms: number): number {
  return clamp(100 - ((ms - 800) / 3200) * 100, 0, 100);
}

function normalizeSequence(level: number): number {
  return clamp((level / 10) * 100, 0, 100);
}

function normalizeInhibition(pts: number): number {
  return clamp((pts / 8000) * 100, 0, 100);
}

export function calculateNeuralSyncScore(scores: {
  classic: number;
  speedRound: number;
  sequence: number;
  inhibition: number;
}): { syncScore: number; subScores: SyncSubScore[] } {
  const classicPct = Math.round(normalizeClassic(scores.classic));
  const speedPct = Math.round(normalizeSpeedRound(scores.speedRound));
  const seqPct = Math.round(normalizeSequence(scores.sequence));
  const inhibPct = Math.round(normalizeInhibition(scores.inhibition));

  const syncScore = Math.round((classicPct + speedPct + seqPct + inhibPct) / 4);

  return {
    syncScore,
    subScores: [
      { mode: "classic", icon: "⚡", rawScore: scores.classic, normalizedPct: classicPct, label: `${scores.classic}ms` },
      { mode: "speed-round", icon: "🔥", rawScore: scores.speedRound, normalizedPct: speedPct, label: `${(scores.speedRound / 1000).toFixed(1)}s` },
      { mode: "sequence", icon: "🧠", rawScore: scores.sequence, normalizedPct: seqPct, label: `Lvl ${scores.sequence}` },
      { mode: "inhibition", icon: "🚫", rawScore: scores.inhibition, normalizedPct: inhibPct, label: `${scores.inhibition}pts` },
    ],
  };
}

export function getSyncMessage(score: number): string {
  if (score >= 95) return "Neural perfection!";
  if (score >= 85) return "Elite calibration!";
  if (score >= 70) return "Strong sync!";
  if (score >= 50) return "Solid baseline";
  if (score >= 30) return "Room to improve";
  return "Recalibrate tomorrow";
}
