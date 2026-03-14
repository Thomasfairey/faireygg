"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ModeDefinition } from "@/lib/game/modes";
import { getScoreLabel, getReactionMessage } from "@/lib/game/scoring";
import GlowButton from "@/components/ui/GlowButton";
import { audioManager } from "@/lib/audio/AudioManager";
import { haptic } from "@/lib/haptics";

interface ResultScreenProps {
  mode: ModeDefinition;
  score: number;
  isNewBest: boolean;
  rankedUp: boolean;
  newRankName?: string;
  onPlayAgain: () => void;
  onExit: () => void;
}

export default function ResultScreen({
  mode,
  score,
  isNewBest,
  rankedUp,
  newRankName,
  onPlayAgain,
  onExit,
}: ResultScreenProps) {
  const hasPlayedSound = useRef(false);

  useEffect(() => {
    if (hasPlayedSound.current) return;
    hasPlayedSound.current = true;

    if (rankedUp) {
      audioManager.rankUp();
      haptic.rankUp();
    } else if (isNewBest) {
      audioManager.newRecord();
      haptic.success();
    } else {
      audioManager.tapSuccess();
    }
  }, [isNewBest, rankedUp]);

  const message =
    mode.id === "classic" || mode.id === "aim-trainer"
      ? getReactionMessage(score)
      : mode.id === "sequence"
        ? score >= 8 ? "Incredible memory!" : score >= 5 ? "Sharp mind!" : "Keep practising!"
        : mode.id === "shrinking-target"
          ? score >= 15 ? "Eagle eye!" : score >= 8 ? "Nice focus!" : "Getting there!"
          : score < 1500 ? "Blazing fast!" : score < 2500 ? "Solid speed!" : "Keep it up!";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-space-900/95 backdrop-blur-lg">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="flex flex-col items-center gap-6 px-8 max-w-sm w-full"
      >
        {rankedUp && (
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
            className="text-center"
          >
            <div className="text-5xl mb-2">🚀</div>
            <div className="text-lg font-bold shimmer-text">RANK UP!</div>
            <div className="text-neon-cyan text-glow-cyan font-bold text-xl mt-1">
              {newRankName}
            </div>
          </motion.div>
        )}

        {isNewBest && !rankedUp && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 20 }}
            className="text-sm font-bold shimmer-text uppercase tracking-widest"
          >
            New Personal Best!
          </motion.div>
        )}

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center"
        >
          <div
            className="text-6xl font-bold tabular-nums"
            style={{ color: mode.color }}
          >
            {getScoreLabel(score, mode.id)}
          </div>
          <div className="text-white/50 text-lg mt-2">{message}</div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col gap-3 w-full mt-4"
        >
          <GlowButton
            onClick={onPlayAgain}
            color={mode.color}
            glowClass={mode.glowClass}
            size="lg"
            className="w-full"
          >
            Play Again
          </GlowButton>
          <button
            onClick={onExit}
            className="text-white/30 text-sm py-2 cursor-pointer hover:text-white/50 transition-colors"
          >
            Back to Menu
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
