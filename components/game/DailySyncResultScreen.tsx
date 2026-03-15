"use client";

import { motion } from "framer-motion";
import { SyncSubScore, getSyncMessage } from "@/lib/game/scoring";
import ProgressRing from "@/components/ui/ProgressRing";
import GlowButton from "@/components/ui/GlowButton";

interface DailySyncResultScreenProps {
  syncScore: number;
  subScores: SyncSubScore[];
  isNewBest: boolean;
  streak: number;
  onExit: () => void;
}

const MODE_COLORS: Record<string, string> = {
  classic: "#00f0ff",
  "speed-round": "#ff00e5",
  sequence: "#a855f7",
  inhibition: "#ff3355",
};

export default function DailySyncResultScreen({
  syncScore,
  subScores,
  isNewBest,
  streak,
  onExit,
}: DailySyncResultScreenProps) {
  const message = getSyncMessage(syncScore);
  const scoreColor = syncScore >= 80 ? "#00ff88" : syncScore >= 50 ? "#00f0ff" : "#ffaa00";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-space-900/95 backdrop-blur-lg overflow-y-auto">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="flex flex-col items-center gap-5 px-6 max-w-sm w-full py-8"
      >
        {/* Header */}
        <div className="text-xs text-white/25 uppercase tracking-[0.3em]">Daily Neural Sync</div>

        {isNewBest && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 20 }}
            className="text-sm font-bold shimmer-text uppercase tracking-widest"
          >
            New Personal Best!
          </motion.div>
        )}

        {/* Sync Score */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
        >
          <ProgressRing progress={syncScore / 100} size={120} strokeWidth={6} color={scoreColor}>
            <div className="text-center">
              <div className="text-3xl font-bold tabular-nums" style={{ color: scoreColor }}>
                {syncScore}%
              </div>
              <div className="text-[9px] text-white/30 uppercase tracking-wider">Sync</div>
            </div>
          </ProgressRing>
        </motion.div>

        <div className="text-white/50 text-sm">{message}</div>

        {/* Sub-score breakdown */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full space-y-2.5"
        >
          {subScores.map((sub, i) => (
            <motion.div
              key={sub.mode}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 + i * 0.08 }}
              className="flex items-center gap-3"
            >
              <span className="text-lg w-7 text-center">{sub.icon}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-white/40 uppercase tracking-wider">{sub.label}</span>
                  <span className="text-xs font-bold tabular-nums" style={{ color: MODE_COLORS[sub.mode] ?? "#fff" }}>
                    {sub.normalizedPct}%
                  </span>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${sub.normalizedPct}%` }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.6, ease: "easeOut" }}
                    style={{
                      background: MODE_COLORS[sub.mode] ?? "#fff",
                      boxShadow: `0 0 6px ${MODE_COLORS[sub.mode] ?? "#fff"}60`,
                    }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Streak */}
        {streak > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-xs text-white/30"
          >
            🔥 {streak} day sync streak
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col gap-3 w-full mt-2"
        >
          <GlowButton onClick={onExit} color={scoreColor} glowClass="box-glow-cyan" size="lg" className="w-full">
            Back to Menu
          </GlowButton>
        </motion.div>
      </motion.div>
    </div>
  );
}
