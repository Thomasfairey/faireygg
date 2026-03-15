"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useDailySyncStore } from "@/lib/store/dailySyncStore";
import { getSyncMessage } from "@/lib/game/scoring";
import DailySyncShell from "@/components/game/DailySyncShell";
import ProgressRing from "@/components/ui/ProgressRing";
import GlowButton from "@/components/ui/GlowButton";
import { useHydrated } from "@/lib/hooks/useHydrated";

export default function DailySyncPage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const [forcePlay, setForcePlay] = useState(false);

  const records = useDailySyncStore((s) => s.records);
  const bestSyncScore = useDailySyncStore((s) => s.bestSyncScore);
  const currentStreak = useDailySyncStore((s) => s.currentStreak);

  const today = new Date().toLocaleDateString("en-CA");
  const todayRecord = hydrated ? records.find((r) => r.date === today) : null;
  const isCompleted = !!todayRecord;

  if (!hydrated) {
    return <div className="fixed inset-0 bg-space-900" />;
  }

  // If already completed today and not forcing play, show result
  if (isCompleted && !forcePlay) {
    const scoreColor = todayRecord.syncScore >= 80 ? "#00ff88" : todayRecord.syncScore >= 50 ? "#00f0ff" : "#ffaa00";
    return (
      <div className="fixed inset-0 bg-space-900 flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-5 max-w-sm w-full"
        >
          <div className="text-xs text-white/25 uppercase tracking-[0.3em]">Today&apos;s Sync</div>

          <ProgressRing progress={todayRecord.syncScore / 100} size={120} strokeWidth={6} color={scoreColor}>
            <div className="text-center">
              <div className="text-3xl font-bold tabular-nums" style={{ color: scoreColor }}>
                {todayRecord.syncScore}%
              </div>
            </div>
          </ProgressRing>

          <div className="text-white/50 text-sm">{getSyncMessage(todayRecord.syncScore)}</div>

          {currentStreak > 0 && (
            <div className="text-xs text-white/30">🔥 {currentStreak} day streak</div>
          )}

          <div className="text-xs text-white/15 mt-2">Come back tomorrow for your next sync</div>

          <GlowButton onClick={() => router.push("/")} color="#00f0ff" glowClass="box-glow-cyan" size="lg" className="w-full mt-4">
            Back to Menu
          </GlowButton>
        </motion.div>
      </div>
    );
  }

  // Play the gauntlet
  return <DailySyncShell />;
}
