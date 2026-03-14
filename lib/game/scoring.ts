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
