"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ModeDefinition } from "@/lib/game/modes";
import { useProgressionStore } from "@/lib/store/progressionStore";
import { getScoreLabel } from "@/lib/game/scoring";
import { audioManager } from "@/lib/audio/AudioManager";
import { haptic } from "@/lib/haptics";

interface ModeCardProps {
  mode: ModeDefinition;
  index: number;
}

export default function ModeCard({ mode, index }: ModeCardProps) {
  const router = useRouter();
  const bestScore = useProgressionStore((s) => s.getBestScore(mode.id));

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: "spring", stiffness: 300, damping: 30 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => {
        audioManager.uiClick();
        haptic.light();
        router.push(`/play/${mode.id}`);
      }}
      className={`
        w-full rounded-2xl p-4 text-left cursor-pointer
        border border-white/[0.06] backdrop-blur-sm
        ${mode.glowClass}
        relative overflow-hidden
      `}
      style={{
        background: `linear-gradient(135deg, ${mode.color}10, ${mode.color}05, transparent)`,
      }}
    >
      {/* Accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: `linear-gradient(90deg, transparent, ${mode.color}, transparent)`,
          opacity: 0.6,
        }}
      />

      <div className="flex items-center gap-3">
        <span className="text-2xl">{mode.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-white text-base">{mode.name}</div>
          <div className="text-xs text-white/40 truncate">{mode.description}</div>
        </div>
        {bestScore !== null && (
          <div className="text-right">
            <div className="text-xs text-white/30 uppercase tracking-wider">Best</div>
            <div className="font-bold tabular-nums" style={{ color: mode.color, fontSize: "0.85rem" }}>
              {getScoreLabel(bestScore, mode.id)}
            </div>
          </div>
        )}
      </div>
    </motion.button>
  );
}
