"use client";

import { motion } from "framer-motion";
import { MODES } from "@/lib/game/modes";
import { useProgressionStore } from "@/lib/store/progressionStore";
import ModeCard from "@/components/menu/ModeCard";
import RankBadge from "@/components/menu/RankBadge";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { audioManager } from "@/lib/audio/AudioManager";

export default function Home() {
  const totalGamesPlayed = useProgressionStore((s) => s.totalGamesPlayed);
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const toggleSound = useSettingsStore((s) => s.toggleSound);
  const toggleHaptics = useSettingsStore((s) => s.toggleHaptics);

  return (
    <div className="fixed inset-0 overflow-y-auto">
      <div className="min-h-full flex flex-col items-center px-5 pt-[env(safe-area-inset-top,16px)] pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="text-center mt-8 mb-6"
        >
          <h1 className="text-3xl font-bold shimmer-text tracking-tight">
            NEURAL PULSE
          </h1>
          <p className="text-xs text-white/30 mt-1 uppercase tracking-[0.3em]">
            Reflex Training System
          </p>
        </motion.div>

        {/* Rank */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 30 }}
          className="w-full max-w-sm mb-6 px-4 py-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm"
        >
          <RankBadge />
        </motion.div>

        {/* Mode Grid */}
        <div className="w-full max-w-sm flex flex-col gap-3">
          {MODES.map((mode, i) => (
            <ModeCard key={mode.id} mode={mode} index={i} />
          ))}
        </div>

        {/* Quick Stats */}
        {totalGamesPlayed > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-center text-white/20 text-xs"
          >
            {totalGamesPlayed} games played
          </motion.div>
        )}

        {/* Settings */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-4 flex gap-4"
        >
          <button
            onClick={() => {
              toggleSound();
              audioManager.uiClick();
            }}
            className={`text-xs px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${
              soundEnabled
                ? "border-white/20 text-white/50"
                : "border-white/10 text-white/20"
            }`}
          >
            {soundEnabled ? "🔊 Sound" : "🔇 Muted"}
          </button>
          <button
            onClick={toggleHaptics}
            className={`text-xs px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${
              hapticsEnabled
                ? "border-white/20 text-white/50"
                : "border-white/10 text-white/20"
            }`}
          >
            {hapticsEnabled ? "📳 Haptics" : "📴 No Haptics"}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
