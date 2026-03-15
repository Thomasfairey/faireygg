import { ModeDefinition } from "../game/modes";
import { getScoreLabel } from "../game/scoring";
import { SyncSubScore } from "../game/scoring";

const URL = "neuralpulse.gg";

export function generateModeShareText(opts: {
  mode: ModeDefinition;
  score: number;
  isNewBest: boolean;
  streak: number;
  rankName: string;
}): string {
  const { mode, score, isNewBest, streak, rankName } = opts;
  const scoreText = mode.id === "speed-round"
    ? `${(score / 1000).toFixed(1)}s`
    : getScoreLabel(score, mode.id);

  const lines = [
    `🧠 Neural Pulse | ${mode.icon} ${mode.name}`,
    `${scoreText}${isNewBest ? " 🏆 NEW BEST" : ""}`,
  ];

  if (streak > 1) lines.push(`🔥 ${streak}-day streak`);
  lines.push(`Rank: ${rankName}`);
  lines.push("");
  lines.push(`Can you beat me? ${URL}`);

  return lines.join("\n");
}

export function generateSyncShareText(opts: {
  syncScore: number;
  subScores: SyncSubScore[];
  streak: number;
  isNewBest: boolean;
}): string {
  const { syncScore, subScores, streak, isNewBest } = opts;

  const modeEmojis = subScores.map((s) => {
    const pct = s.normalizedPct;
    const bar = pct >= 80 ? "🟢" : pct >= 50 ? "🟡" : "🔴";
    return `${s.icon}${bar}${s.normalizedPct}%`;
  }).join(" ");

  const lines = [
    `🧠 Neural Pulse | Daily Sync: ${syncScore}%${isNewBest ? " 🏆" : ""}`,
    modeEmojis,
  ];

  if (streak > 1) lines.push(`🔥 ${streak}-day streak`);
  lines.push("");
  lines.push(`Can you beat my sync? ${URL}`);

  return lines.join("\n");
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      return true;
    } catch {
      return false;
    }
  }
}
