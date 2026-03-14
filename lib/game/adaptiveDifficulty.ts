import { GameResult } from "./scoring";
import { GameMode } from "./modes";

export interface ClassicDifficulty {
  minWait: number;
  maxWait: number;
}

export interface ShrinkDifficulty {
  initialSize: number;
}

export interface AimDifficulty {
  targetSize: number;
}

export interface SpeedDifficulty {
  totalTaps: number;
}

const ROLLING_WINDOW = 10;

export function getClassicDifficulty(history: GameResult[]): ClassicDifficulty {
  const recent = history.slice(-ROLLING_WINDOW);
  if (recent.length < 3) return { minWait: 1500, maxWait: 5000 };
  const avg = recent.reduce((a, b) => a + b.score, 0) / recent.length;
  if (avg < 200) return { minWait: 800, maxWait: 2500 };
  if (avg < 250) return { minWait: 1000, maxWait: 3000 };
  if (avg < 300) return { minWait: 1200, maxWait: 3500 };
  return { minWait: 1500, maxWait: 5000 };
}

export function getShrinkDifficulty(history: GameResult[]): ShrinkDifficulty {
  const recent = history.slice(-ROLLING_WINDOW);
  if (recent.length < 3) return { initialSize: 140 };
  const avg = recent.reduce((a, b) => a + b.score, 0) / recent.length;
  if (avg > 15) return { initialSize: 100 };
  if (avg > 10) return { initialSize: 120 };
  return { initialSize: 140 };
}

export function getAimDifficulty(history: GameResult[]): AimDifficulty {
  const recent = history.slice(-ROLLING_WINDOW);
  if (recent.length < 3) return { targetSize: 56 };
  const avg = recent.reduce((a, b) => a + b.score, 0) / recent.length;
  if (avg < 250) return { targetSize: 40 };
  if (avg < 350) return { targetSize: 48 };
  return { targetSize: 56 };
}

export function getSpeedDifficulty(history: GameResult[]): SpeedDifficulty {
  const recent = history.slice(-ROLLING_WINDOW);
  if (recent.length < 3) return { totalTaps: 5 };
  const avg = recent.reduce((a, b) => a + b.score, 0) / recent.length;
  if (avg < 1200) return { totalTaps: 7 };
  if (avg < 1800) return { totalTaps: 6 };
  return { totalTaps: 5 };
}
