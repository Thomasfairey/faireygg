"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useGameEffects } from "@/lib/hooks/useGameEffects";
import { GameEffectsContext } from "@/lib/hooks/GameEffectsContext";
import ParticleBurst from "@/components/effects/ParticleBurst";
import ScreenFlash from "@/components/effects/ScreenFlash";
import ScorePopup from "@/components/effects/ScorePopup";
import CountdownOverlay from "./CountdownOverlay";
import DailySyncResultScreen from "./DailySyncResultScreen";
import ClassicMode from "@/components/modes/ClassicMode";
import SpeedRoundMode from "@/components/modes/SpeedRoundMode";
import SequenceMode from "@/components/modes/SequenceMode";
import InhibitionMode from "@/components/modes/InhibitionMode";
import { calculateNeuralSyncScore } from "@/lib/game/scoring";
import { useDailySyncStore } from "@/lib/store/dailySyncStore";
import { useProgressionStore } from "@/lib/store/progressionStore";
import { audioManager } from "@/lib/audio/AudioManager";
import { haptic } from "@/lib/haptics";
import { getModeById } from "@/lib/game/modes";

const GAUNTLET_ORDER = ["classic", "speed-round", "sequence", "inhibition"] as const;

type GauntletPhase = "countdown" | "playing" | "transition" | "result";

const SYNC_MODE_DEF = {
  id: "classic" as const,
  name: "Neural Sync",
  description: "4-mode gauntlet",
  icon: "🧬",
  color: "#00f0ff",
  glowClass: "box-glow-cyan",
  scoreUnit: "%",
  scoreLowerIsBetter: false,
};

export default function DailySyncShell() {
  const router = useRouter();
  const effects = useGameEffects();

  const [gauntletPhase, setGauntletPhase] = useState<GauntletPhase>("countdown");
  const [currentModeIndex, setCurrentModeIndex] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [syncResult, setSyncResult] = useState<ReturnType<typeof calculateNeuralSyncScore> | null>(null);
  const [isNewBest, setIsNewBest] = useState(false);
  const [streak, setStreak] = useState(0);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const recordSync = useDailySyncStore((s) => s.recordSync);
  const bestSyncScore = useDailySyncStore((s) => s.bestSyncScore);

  const currentModeId = GAUNTLET_ORDER[currentModeIndex];
  const currentModeDef = getModeById(currentModeId);

  const handleCountdownComplete = useCallback(() => {
    setGauntletPhase("playing");
  }, []);

  const handleModeComplete = useCallback(
    (score: number) => {
      const newScores = [...scores, score];
      setScores(newScores);

      if (currentModeIndex >= GAUNTLET_ORDER.length - 1) {
        // All 4 modes complete — calculate final score
        const result = calculateNeuralSyncScore({
          classic: newScores[0],
          speedRound: newScores[1],
          sequence: newScores[2],
          inhibition: newScores[3],
        });

        setSyncResult(result);
        setIsNewBest(result.syncScore > bestSyncScore);
        setStreak(useDailySyncStore.getState().currentStreak + 1);

        const today = new Date().toLocaleDateString("en-CA");
        recordSync({
          date: today,
          syncScore: result.syncScore,
          subScores: {
            classic: newScores[0],
            speedRound: newScores[1],
            sequence: newScores[2],
            inhibition: newScores[3],
          },
          normalizedScores: {
            classic: result.subScores[0].normalizedPct,
            speedRound: result.subScores[1].normalizedPct,
            sequence: result.subScores[2].normalizedPct,
            inhibition: result.subScores[3].normalizedPct,
          },
        });

        // Count as 1 game for rank progression
        useProgressionStore.getState().recordResult(
          { mode: "classic", score: newScores[0], date: new Date().toISOString() },
          true
        );

        audioManager.rankUp();
        haptic.success();
        setGauntletPhase("result");
      } else {
        // Transition to next mode
        audioManager.tapSuccess();
        haptic.medium();
        setGauntletPhase("transition");
        transitionTimer.current = setTimeout(() => {
          setCurrentModeIndex(currentModeIndex + 1);
          setGauntletPhase("playing");
        }, 3000);
      }
    },
    [scores, currentModeIndex, recordSync, bestSyncScore]
  );

  const handleExit = useCallback(() => {
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    router.push("/");
  }, [router]);

  const handleBackTap = useCallback(() => {
    if (gauntletPhase === "playing") {
      setShowExitConfirm(true);
    } else {
      handleExit();
    }
  }, [gauntletPhase, handleExit]);

  useEffect(() => {
    return () => {
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
    };
  }, []);

  const nextModeDef = currentModeIndex < GAUNTLET_ORDER.length - 1
    ? getModeById(GAUNTLET_ORDER[currentModeIndex + 1])
    : null;

  return (
    <GameEffectsContext.Provider value={effects}>
      <div className="fixed inset-0 bg-space-900">
        <ParticleBurst particlesRef={effects.particlesRef} subscribe={effects.subscribe} />
        <ScreenFlash flashRef={effects.flashRef} subscribe={effects.subscribe} />
        <ScorePopup popupsRef={effects.popupsRef} subscribe={effects.subscribe} />

        {/* Back button */}
        {gauntletPhase !== "result" && (
          <button
            onClick={handleBackTap}
            className="fixed top-[env(safe-area-inset-top,8px)] left-2 z-[60] w-11 h-11 flex items-center justify-center cursor-pointer transition-colors mt-1 rounded-full text-white/40 bg-white/[0.06] hover:bg-white/10"
          >
            <span className="text-base">←</span>
          </button>
        )}

        {/* Progress indicator */}
        {gauntletPhase !== "result" && gauntletPhase !== "countdown" && (
          <div className="fixed top-[env(safe-area-inset-top,8px)] right-4 z-[60] flex gap-1.5 mt-3">
            {GAUNTLET_ORDER.map((mode, i) => {
              const modeDef = getModeById(mode);
              const isComplete = i < currentModeIndex || (i === currentModeIndex && gauntletPhase === "transition");
              const isCurrent = i === currentModeIndex && gauntletPhase === "playing";
              return (
                <div
                  key={mode}
                  className="w-2.5 h-2.5 rounded-full transition-all"
                  style={{
                    background: isComplete
                      ? modeDef?.color ?? "#fff"
                      : isCurrent
                        ? modeDef?.color ?? "#fff"
                        : "rgba(255,255,255,0.15)",
                    boxShadow: isComplete || isCurrent ? `0 0 6px ${modeDef?.color}` : "none",
                    opacity: isCurrent ? 1 : isComplete ? 0.7 : 0.3,
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Initial countdown */}
        <AnimatePresence>
          {gauntletPhase === "countdown" && (
            <CountdownOverlay
              mode={SYNC_MODE_DEF}
              isDaily={false}
              onComplete={handleCountdownComplete}
            />
          )}
        </AnimatePresence>

        {/* Active mode */}
        {gauntletPhase === "playing" && (
          <>
            {currentModeId === "classic" && (
              <ClassicMode onComplete={handleModeComplete} phase="playing" />
            )}
            {currentModeId === "speed-round" && (
              <SpeedRoundMode onComplete={handleModeComplete} phase="playing" />
            )}
            {currentModeId === "sequence" && (
              <SequenceMode onComplete={handleModeComplete} phase="playing" />
            )}
            {currentModeId === "inhibition" && (
              <InhibitionMode onComplete={handleModeComplete} phase="playing" />
            )}
          </>
        )}

        {/* Transition screen between modes */}
        <AnimatePresence>
          {gauntletPhase === "transition" && currentModeDef && nextModeDef && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-space-900/95 backdrop-blur-md"
            >
              {/* Completed */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-2 mb-6"
              >
                <span className="text-lg">{currentModeDef.icon}</span>
                <span className="text-sm font-bold" style={{ color: currentModeDef.color }}>
                  {currentModeDef.name}
                </span>
                <span className="text-neon-green text-sm">✓</span>
              </motion.div>

              {/* Progress */}
              <div className="text-white/30 text-xs uppercase tracking-widest mb-8">
                {currentModeIndex + 1} / {GAUNTLET_ORDER.length} Complete
              </div>

              {/* Next up */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 25 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="text-[10px] text-white/20 uppercase tracking-widest">Next Up</div>
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{
                    background: `${nextModeDef.color}15`,
                    border: `2px solid ${nextModeDef.color}30`,
                    boxShadow: `0 0 20px ${nextModeDef.color}20`,
                  }}
                >
                  <span className="text-3xl">{nextModeDef.icon}</span>
                </div>
                <div className="font-bold text-lg" style={{ color: nextModeDef.color }}>
                  {nextModeDef.name}
                </div>
              </motion.div>

              {/* Countdown bar */}
              <motion.div
                className="w-32 h-1 bg-white/[0.06] rounded-full mt-8 overflow-hidden"
              >
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 3, ease: "linear" }}
                  style={{ background: nextModeDef.color, boxShadow: `0 0 8px ${nextModeDef.color}` }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Exit confirmation */}
        {showExitConfirm && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-space-900/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4 px-8">
              <div className="text-white/60 text-sm">Quit the Daily Sync?</div>
              <div className="text-white/30 text-xs">Progress will be lost</div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="px-5 py-2 rounded-xl text-sm font-bold text-white/50 border border-white/10 cursor-pointer hover:bg-white/5"
                >
                  Resume
                </button>
                <button
                  onClick={handleExit}
                  className="px-5 py-2 rounded-xl text-sm font-bold text-neon-red border border-neon-red/30 cursor-pointer hover:bg-neon-red/10"
                >
                  Quit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Final result */}
        {gauntletPhase === "result" && syncResult && (
          <DailySyncResultScreen
            syncScore={syncResult.syncScore}
            subScores={syncResult.subScores}
            isNewBest={isNewBest}
            streak={streak}
            onExit={handleExit}
          />
        )}
      </div>
    </GameEffectsContext.Provider>
  );
}
