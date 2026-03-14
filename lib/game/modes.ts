export type GameMode =
  | "classic"
  | "speed-round"
  | "sequence"
  | "shrinking-target"
  | "aim-trainer";

export interface ModeDefinition {
  id: GameMode;
  name: string;
  description: string;
  icon: string;
  color: string;
  glowClass: string;
  scoreUnit: string;
  scoreLowerIsBetter: boolean;
}

export const MODES: ModeDefinition[] = [
  {
    id: "classic",
    name: "Classic",
    description: "React when the screen turns green",
    icon: "⚡",
    color: "#00f0ff",
    glowClass: "box-glow-cyan",
    scoreUnit: "ms",
    scoreLowerIsBetter: true,
  },
  {
    id: "speed-round",
    name: "Speed Round",
    description: "5 rapid taps — total time counts",
    icon: "🔥",
    color: "#ff00e5",
    glowClass: "box-glow-magenta",
    scoreUnit: "ms",
    scoreLowerIsBetter: true,
  },
  {
    id: "sequence",
    name: "Sequence",
    description: "Memorise and repeat the pattern",
    icon: "🧠",
    color: "#a855f7",
    glowClass: "box-glow-purple",
    scoreUnit: "lvl",
    scoreLowerIsBetter: false,
  },
  {
    id: "shrinking-target",
    name: "Shrink",
    description: "Hit the target before it vanishes",
    icon: "🎯",
    color: "#00ff88",
    glowClass: "box-glow-green",
    scoreUnit: "hits",
    scoreLowerIsBetter: false,
  },
  {
    id: "aim-trainer",
    name: "Aim Trainer",
    description: "20 targets — speed + accuracy",
    icon: "🔫",
    color: "#ffaa00",
    glowClass: "box-glow-amber",
    scoreUnit: "ms avg",
    scoreLowerIsBetter: true,
  },
];

export function getModeById(id: string): ModeDefinition | undefined {
  return MODES.find((m) => m.id === id);
}
