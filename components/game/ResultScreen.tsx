"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ModeDefinition } from "@/lib/game/modes";
import { getScoreLabel, getReactionMessage, getInhibitionMessage } from "@/lib/game/scoring";
import { getRankForGames } from "@/lib/game/ranks";
import { getLoreForRank } from "@/lib/game/lore";
import { useProgressionStore } from "@/lib/store/progressionStore";
import { shareResult } from "@/lib/share/generateShareCard";
import GlowButton from "@/components/ui/GlowButton";
import { audioManager } from "@/lib/audio/AudioManager";
import { haptic } from "@/lib/haptics";

// Score benchmarks for context
const BENCHMARKS: Record<string, { avg: string; good: string }> = {
  classic: { avg: "~280ms", good: "<220ms" },
  "speed-round": { avg: "~2.5s", good: "<1.5s" },
  "aim-trainer": { avg: "~380ms", good: "<280ms" },
  sequence: { avg: "Level 5", good: "Level 8+" },
  "shrinking-target": { avg: "8 hits", good: "15+ hits" },
  inhibition: { avg: "4000 pts", good: "6000+ pts" },
};

// Varied motivational messages
const MESSAGES: Record<string, string[]> = {
  classic: [
    "Lightning reflexes!", "Sharp as a laser!", "Neural link firing!", "Synapses blazing!",
    "Great reflexes!", "Quick on the draw!", "Solid reaction!", "Nice timing!",
    "Getting warmer!", "Keep at it!", "Room to improve!", "Try again, pilot!",
  ],
  default: [
    "Impressive!", "Well played!", "Nice work!", "Solid run!",
    "Getting better!", "Keep pushing!", "You can do better!", "Not bad, pilot!",
  ],
};

function getVariedMessage(mode: string, score: number, modeId: string): string {
  // Use the specific message functions for precise scoring
  if (modeId === "classic" || modeId === "aim-trainer") return getReactionMessage(score);
  if (modeId === "inhibition") return getInhibitionMessage(score);

  const pool = MESSAGES[modeId] ?? MESSAGES.default;
  // Pick based on score quality — first third are "great", middle are "ok", last are "needs work"
  let tier: number;
  if (modeId === "sequence") {
    tier = score >= 8 ? 0 : score >= 5 ? 1 : 2;
  } else if (modeId === "shrinking-target") {
    tier = score >= 15 ? 0 : score >= 8 ? 1 : 2;
  } else if (modeId === "speed-round") {
    tier = score < 1500 ? 0 : score < 2500 ? 1 : 2;
  } else {
    tier = 1;
  }
  const third = Math.floor(pool.length / 3);
  const start = tier * third;
  const end = start + third;
  const slice = pool.slice(start, end);
  // Deterministic pick based on score to avoid same message
  return slice[score % slice.length] ?? pool[0];
}

interface ResultScreenProps {
  mode: ModeDefinition;
  score: number;
  isNewBest: boolean;
  isFirstPlay: boolean;
  rankedUp: boolean;
  newRankName?: string;
  dailyCompleted?: boolean;
  onPlayAgain: () => void;
  onExit: () => void;
}

export default function ResultScreen({
  mode,
  score,
  isNewBest,
  isFirstPlay,
  rankedUp,
  newRankName,
  dailyCompleted,
  onPlayAgain,
  onExit,
}: ResultScreenProps) {
  const hasPlayedSound = useRef(false);
  const totalGamesPlayed = useProgressionStore((s) => s.totalGamesPlayed);
  const rank = getRankForGames(totalGamesPlayed);
  const lore = rankedUp && newRankName ? getLoreForRank(rank.id) : null;

  // BUG-01 & UX-07: Suppress "new best" on first play or zero score
  const showNewBest = isNewBest && !isFirstPlay && score > 0;

  useEffect(() => {
    if (hasPlayedSound.current) return;
    hasPlayedSound.current = true;
    if (rankedUp) {
      audioManager.rankUp();
      haptic.rankUp();
    } else if (showNewBest) {
      audioManager.newRecord();
      haptic.success();
    } else {
      audioManager.tapSuccess();
    }
  }, [showNewBest, rankedUp]);

  const message = getVariedMessage(mode.name, score, mode.id);
  const benchmark = BENCHMARKS[mode.id];

  // UX-03: Format speed round as seconds
  const displayScore = mode.id === "speed-round"
    ? `${(score / 1000).toFixed(1)}s`
    : getScoreLabel(score, mode.id);

  const [shareStatus, setShareStatus] = useState<string | null>(null);

  const handleShare = async () => {
    setShareStatus("...");
    const result = await shareResult({
      mode,
      score,
      message,
      rankName: rank.name,
      rankColor: rank.color,
      isNewBest: showNewBest,
    });
    if (result === "shared") {
      setShareStatus("Shared!");
    } else if (result === "downloaded") {
      setShareStatus("Saved!");
    } else {
      setShareStatus("Failed");
    }
    setTimeout(() => setShareStatus(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-space-900/95 backdrop-blur-lg overflow-y-auto">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="flex flex-col items-center gap-5 px-8 max-w-sm w-full py-8"
      >
        {/* Daily challenge complete */}
        {dailyCompleted && (
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
            className="text-center"
          >
            <div className="text-sm font-bold text-neon-amber text-glow-amber uppercase tracking-widest">
              Daily Challenge Complete!
            </div>
          </motion.div>
        )}

        {/* Rank up */}
        {rankedUp && (
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
            className="text-center"
          >
            <div className="text-5xl mb-2">🚀</div>
            <div className="text-lg font-bold shimmer-text">RANK UP!</div>
            <div className="text-neon-cyan text-glow-cyan font-bold text-xl mt-1">{newRankName}</div>
            {lore && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="text-white/30 text-xs italic mt-3 max-w-[250px] leading-relaxed"
              >
                &ldquo;{lore.text}&rdquo;
              </motion.div>
            )}
          </motion.div>
        )}

        {showNewBest && !rankedUp && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 20 }}
            className="text-sm font-bold shimmer-text uppercase tracking-widest"
          >
            New Personal Best!
          </motion.div>
        )}

        {/* Score */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center"
        >
          {/* #5: Responsive score sizing to prevent overflow */}
          <div
            className="font-bold tabular-nums"
            style={{
              color: mode.color,
              fontSize: displayScore.length > 6 ? "2.5rem" : "3.75rem",
            }}
          >
            {displayScore}
          </div>
          <div className="text-white/50 text-lg mt-2">{message}</div>

          {/* UX-08: Score benchmark context */}
          {benchmark && (
            <div className="flex gap-4 justify-center mt-3 text-[10px] text-white/20">
              <span>Avg: {benchmark.avg}</span>
              <span>Good: {benchmark.good}</span>
            </div>
          )}
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col gap-3 w-full mt-2"
        >
          <GlowButton onClick={onPlayAgain} color={mode.color} glowClass={mode.glowClass} size="lg" className="w-full">
            Play Again
          </GlowButton>
          <button
            onClick={handleShare}
            className="text-white/30 text-sm py-2 cursor-pointer hover:text-white/50 transition-colors flex items-center justify-center gap-2"
          >
            <span>{shareStatus ?? "Share Result"}</span>
            {!shareStatus && <span className="text-xs">↗</span>}
          </button>
          <button onClick={onExit} className="text-white/20 text-xs py-1 cursor-pointer hover:text-white/40 transition-colors">
            Back to Menu
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
