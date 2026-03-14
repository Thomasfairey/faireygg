"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { MODES } from "@/lib/game/modes";
import { MODE_FLAVOUR } from "@/lib/game/lore";
import { useProgressionStore } from "@/lib/store/progressionStore";
import { getRankForGames, getNextRank, getRankProgress } from "@/lib/game/ranks";
import { getScoreLabel } from "@/lib/game/scoring";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { useOnboardingStore } from "@/lib/store/onboardingStore";
import { useDailyChallengeStore } from "@/lib/store/dailyChallengeStore";
import { getDailyChallenge } from "@/lib/game/dailyChallenge";
import { audioManager } from "@/lib/audio/AudioManager";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { haptic } from "@/lib/haptics";
import ProgressRing from "@/components/ui/ProgressRing";

const RANK_ICONS: Record<string, string> = {
  cadet: "🛰️",
  "co-pilot": "🌑",
  pilot: "🚀",
  commander: "🌟",
  "test-pilot": "🛸",
  lightspeed: "💫",
};

export default function Home() {
  const hydrated = useHydrated();
  const router = useRouter();
  const totalGamesPlayed = useProgressionStore((s) => s.totalGamesPlayed);
  const leaderboards = useProgressionStore((s) => s.leaderboards);
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const toggleSound = useSettingsStore((s) => s.toggleSound);
  const toggleHaptics = useSettingsStore((s) => s.toggleHaptics);
  const hasCompletedFirstGame = useOnboardingStore((s) => s.hasCompletedFirstGame);
  const isCompletedToday = useDailyChallengeStore((s) => s.isCompletedToday);
  const dailyStreak = useDailyChallengeStore((s) => s.currentStreak);

  const rank = getRankForGames(totalGamesPlayed);
  const nextRank = getNextRank(totalGamesPlayed);
  const progress = getRankProgress(totalGamesPlayed);

  const daily = getDailyChallenge();
  const dailyDone = hydrated && isCompletedToday();

  // Zero-friction first play: redirect new users to Classic
  useEffect(() => {
    if (hydrated && !hasCompletedFirstGame && totalGamesPlayed === 0) {
      router.replace("/play/classic?first=true");
    }
  }, [hydrated, hasCompletedFirstGame, totalGamesPlayed, router]);

  // Don't render menu if redirecting
  if (hydrated && !hasCompletedFirstGame && totalGamesPlayed === 0) {
    return <div className="fixed inset-0 bg-space-900" />;
  }

  return (
    <div className="fixed inset-0 overflow-y-auto">
      <div className="min-h-full flex flex-col items-center px-5 pt-[env(safe-area-inset-top,16px)] pb-28">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          className="text-center mt-10 mb-2 relative"
        >
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-32 h-32 rounded-full border border-neon-cyan/10"
              style={{ borderStyle: "dashed" }}
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="w-44 h-44 rounded-full border border-neon-magenta/5"
              style={{ borderStyle: "dashed" }}
            />
          </div>
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="text-5xl mb-3"
          >
            🧠
          </motion.div>
          <h1 className="text-3xl font-bold shimmer-text tracking-tight">NEURAL PULSE</h1>
          <p className="text-[10px] text-white/40 mt-1.5 uppercase tracking-[0.3em]">Deep Space Reflex System</p>
        </motion.div>

        {/* Rank Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.12 }}
          className="w-full max-w-sm mt-6 mb-4"
        >
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-4 relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03]" style={{ background: `radial-gradient(ellipse at top right, ${rank.color}, transparent 60%)` }} />
            <div className="relative flex items-center gap-4">
              <ProgressRing progress={hydrated ? progress : 0} size={56} strokeWidth={3} color={rank.color}>
                <span className="text-xl">{RANK_ICONS[rank.id] ?? "🛰️"}</span>
              </ProgressRing>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-base ${rank.glowClass}`} style={{ color: rank.color }}>{rank.name}</span>
                  {hydrated && <span className="text-[10px] text-white/20 tabular-nums">{totalGamesPlayed} games</span>}
                </div>
                {nextRank && (
                  <div className="mt-1.5">
                    <div className="flex items-center justify-between text-[10px] text-white/30 mb-1">
                      <span>Next: {nextRank.name}</span>
                      <span className="tabular-nums">{nextRank.minGames - totalGamesPlayed} to go</span>
                    </div>
                    <div className="h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(hydrated ? progress : 0) * 100}%` }}
                        transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
                        style={{ background: rank.color, boxShadow: `0 0 8px ${rank.color}60` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Daily Challenge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="w-full max-w-sm mb-4"
        >
          <button
            onClick={() => {
              if (dailyDone) return;
              audioManager.uiClick();
              haptic.light();
              router.push(`/play/${daily.mode.id}?daily=true&target=${daily.target}`);
            }}
            className={`w-full rounded-2xl p-4 text-left relative overflow-hidden cursor-pointer transition-all ${
              dailyDone ? "opacity-60" : ""
            }`}
            style={{
              background: dailyDone
                ? "rgba(255,255,255,0.02)"
                : `linear-gradient(135deg, ${daily.mode.color}10, transparent)`,
              border: `1px solid ${dailyDone ? "rgba(255,255,255,0.06)" : daily.mode.color + "20"}`,
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${daily.mode.color}40, transparent)` }} />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${daily.mode.color}15`, border: `1px solid ${daily.mode.color}20` }}>
                <span className="text-lg">{dailyDone ? "✓" : daily.mode.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/25 uppercase tracking-widest">Daily Challenge</span>
                  {hydrated && dailyStreak > 0 && (
                    <span className="text-[9px] text-neon-amber tabular-nums">🔥 {dailyStreak}d</span>
                  )}
                </div>
                <div className="text-sm font-bold mt-0.5" style={{ color: dailyDone ? "rgba(255,255,255,0.3)" : daily.mode.color }}>
                  {dailyDone ? "Completed!" : daily.description}
                </div>
              </div>
              {!dailyDone && (
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-30" style={{ color: daily.mode.color }}>Go →</span>
              )}
            </div>
          </button>
        </motion.div>

        {/* Section Label */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="w-full max-w-sm flex items-center gap-3 mb-3">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10" />
          <span className="text-[10px] text-white/20 uppercase tracking-[0.3em]">Select Mode</span>
          <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10" />
        </motion.div>

        {/* Mode Cards */}
        <div className="w-full max-w-sm flex flex-col gap-2.5">
          {MODES.map((mode, i) => {
            const board = leaderboards[mode.id] ?? [];
            const best = board.length > 0 ? board[0].score : null;
            const flavour = MODE_FLAVOUR[mode.id];

            return (
              <motion.button
                key={mode.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.05, type: "spring", stiffness: 300, damping: 28 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  audioManager.uiClick();
                  haptic.light();
                  router.push(`/play/${mode.id}`);
                }}
                className="w-full rounded-2xl text-left cursor-pointer relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${mode.color}08 0%, transparent 60%)` }}
              >
                <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: `linear-gradient(90deg, transparent 10%, ${mode.color}50 50%, transparent 90%)` }} />
                <div className="absolute top-2 bottom-2 left-0 w-[2px] rounded-full" style={{ background: mode.color, boxShadow: `0 0 8px ${mode.color}60`, opacity: 0.6 }} />
                <div className="flex items-center gap-3 px-4 py-3 pl-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${mode.color}12`, border: `1px solid ${mode.color}20` }}>
                    <span className="text-lg">{mode.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-white text-sm">{mode.name}</span>
                    <div className="text-[11px] text-white/30 truncate mt-0.5">{mode.description}</div>
                    {flavour && <div className="text-[9px] text-white/12 uppercase tracking-wider mt-0.5">{flavour}</div>}
                  </div>
                  {hydrated && best !== null && !mode.isZen ? (
                    <div className="text-right flex-shrink-0">
                      <div className="text-[9px] text-white/20 uppercase tracking-wider">Best</div>
                      <div className="font-bold tabular-nums text-sm" style={{ color: mode.color }}>{getScoreLabel(best, mode.id)}</div>
                    </div>
                  ) : !mode.isZen ? (
                    <div className="text-[10px] font-bold uppercase tracking-wider flex-shrink-0 opacity-30" style={{ color: mode.color }}>Play →</div>
                  ) : null}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Settings */}
        {/* DES-04: Clear toggle visual states */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-6 flex items-center gap-2">
          <button
            onClick={() => { toggleSound(); audioManager.uiClick(); }}
            className={`text-[10px] px-3 py-1.5 rounded-full border cursor-pointer transition-all ${
              hydrated && soundEnabled
                ? "border-neon-cyan/30 text-neon-cyan/60 bg-neon-cyan/5"
                : "border-white/8 text-white/20 bg-transparent"
            }`}
          >
            {hydrated ? (soundEnabled ? "🔊 Sound On" : "🔇 Muted") : "🔊 Sound On"}
          </button>
          <button
            onClick={toggleHaptics}
            className={`text-[10px] px-3 py-1.5 rounded-full border cursor-pointer transition-all ${
              hydrated && hapticsEnabled
                ? "border-neon-cyan/30 text-neon-cyan/60 bg-neon-cyan/5"
                : "border-white/8 text-white/20 bg-transparent"
            }`}
          >
            {hydrated ? (hapticsEnabled ? "📳 Haptics On" : "📴 Off") : "📳 Haptics On"}
          </button>
        </motion.div>

        <div className="mt-4 text-[9px] text-white/10 tracking-wider">v2.0 · NEURAL PULSE</div>
      </div>
    </div>
  );
}
