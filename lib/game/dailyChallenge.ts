import { MODES, GameMode, ModeDefinition } from "./modes";

export interface DailyChallenge {
  date: string;
  mode: ModeDefinition;
  target: number;
  description: string;
  scoreLowerIsBetter: boolean;
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashDate(dateStr: string): number {
  return dateStr.split("").reduce((acc, c) => acc * 31 + c.charCodeAt(0), 0);
}

// Only scored modes for daily challenges
const CHALLENGE_MODES = MODES.filter((m) => !m.isZen);

export function getDailyChallenge(dateStr?: string): DailyChallenge {
  const date = dateStr ?? new Date().toLocaleDateString("en-CA");
  const seed = hashDate(date);
  const rng = mulberry32(seed);

  const modeIndex = Math.floor(rng() * CHALLENGE_MODES.length);
  const mode = CHALLENGE_MODES[modeIndex];

  let target: number;
  let description: string;

  switch (mode.id) {
    case "classic": {
      const targets = [350, 300, 280, 260, 240, 220];
      target = targets[Math.floor(rng() * targets.length)];
      description = `Beat ${target}ms in Classic`;
      break;
    }
    case "speed-round": {
      const targets = [3000, 2500, 2200, 2000, 1800, 1500];
      target = targets[Math.floor(rng() * targets.length)];
      description = `Under ${target}ms in Speed Round`;
      break;
    }
    case "sequence": {
      const targets = [4, 5, 6, 7, 8];
      target = targets[Math.floor(rng() * targets.length)];
      description = `Reach Level ${target} in Sequence`;
      break;
    }
    case "shrinking-target": {
      const targets = [8, 10, 12, 14, 16];
      target = targets[Math.floor(rng() * targets.length)];
      description = `Get ${target}+ hits in Shrink`;
      break;
    }
    case "aim-trainer": {
      const targets = [450, 400, 350, 300, 280];
      target = targets[Math.floor(rng() * targets.length)];
      description = `Average under ${target}ms in Aim Trainer`;
      break;
    }
    case "inhibition": {
      const targets = [3000, 4000, 5000, 6000, 7000];
      target = targets[Math.floor(rng() * targets.length)];
      description = `Score ${target}+ in Inhibition`;
      break;
    }
    default:
      target = 300;
      description = `Beat 300ms`;
  }

  return {
    date,
    mode,
    target,
    description,
    scoreLowerIsBetter: mode.scoreLowerIsBetter,
  };
}

export function isChallengeComplete(
  score: number,
  target: number,
  lowerIsBetter: boolean
): boolean {
  return lowerIsBetter ? score <= target : score >= target;
}
