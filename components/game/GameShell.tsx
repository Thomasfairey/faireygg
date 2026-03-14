"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { ModeDefinition } from "@/lib/game/modes";
import { GameResult } from "@/lib/game/scoring";
import { useProgressionStore } from "@/lib/store/progressionStore";
import { useOnboardingStore } from "@/lib/store/onboardingStore";
import { useDailyChallengeStore } from "@/lib/store/dailyChallengeStore";
import { isChallengeComplete } from "@/lib/game/dailyChallenge";
import CountdownOverlay from "./CountdownOverlay";
import ResultScreen from "./ResultScreen";
import ModeInstructionCard from "./ModeInstructionCard";

type Phase = "instruction" | "countdown" | "playing" | "result";

interface GameShellProps {
  mode: ModeDefinition;
  children: (props: {
    onComplete: (score: number, details?: Record<string, number>) => void;
    phase: Phase;
  }) => React.ReactNode;
}

export default function GameShell({ mode, children }: GameShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFirstPlay = searchParams?.get("first") === "true";
  const dailyTarget = searchParams?.get("target");
  const isDaily = searchParams?.get("daily") === "true" && dailyTarget;

  const playedModes = useOnboardingStore((s) => s.playedModes);
  const markPlayed = useOnboardingStore((s) => s.markPlayed);
  const setFirstGameComplete = useOnboardingStore((s) => s.setFirstGameComplete);

  const skipCountdown = mode.isZen;
  const needsInstruction = !playedModes.includes(mode.id);

  const [phase, setPhase] = useState<Phase>("countdown");
  const [score, setScore] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);
  const [rankedUp, setRankedUp] = useState(false);
  const [newRankName, setNewRankName] = useState<string>();
  const [dailyCompleted, setDailyCompleted] = useState(false);
  const [countdownKey, setCountdownKey] = useState(0);
  const [wasFirstPlay, setWasFirstPlay] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const completedRef = useRef(false);
  const initializedRef = useRef(false);
  const recordResult = useProgressionStore((s) => s.recordResult);
  const modeHistoryLength = useProgressionStore((s) => ((s.history ?? {})[mode.id] ?? []).length);
  const markDailyCompleted = useDailyChallengeStore((s) => s.markCompleted);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    if (needsInstruction) {
      setPhase("instruction");
    } else if (skipCountdown) {
      setPhase("playing");
    } else {
      setPhase("countdown");
    }
  }, [needsInstruction, skipCountdown]);

  const handleInstructionDismiss = useCallback(() => {
    markPlayed(mode.id);
    if (skipCountdown) {
      setPhase("playing");
    } else {
      setPhase("countdown");
    }
  }, [mode.id, markPlayed, skipCountdown]);

  const handleCountdownComplete = useCallback(() => {
    setPhase("playing");
  }, []);

  const handleComplete = useCallback(
    (score: number, details?: Record<string, number>) => {
      if (completedRef.current) return;
      completedRef.current = true;

      if (isFirstPlay) setFirstGameComplete();
      setWasFirstPlay(modeHistoryLength === 0);
      setScore(score);

      const result: GameResult = {
        mode: mode.id,
        score,
        date: new Date().toISOString(),
        details,
      };
      const { isNewBest: nb, previousRank, newRank } = recordResult(result, mode.scoreLowerIsBetter);

      // #8: Don't celebrate rank up on penalty scores (10000ms timeout)
      const isPenaltyScore = mode.id === "classic" && score >= 10000;
      setIsNewBest(nb && !isPenaltyScore);
      if (newRank.id !== previousRank.id && !isPenaltyScore) {
        setRankedUp(true);
        setNewRankName(newRank.name);
      }

      if (isDaily && dailyTarget) {
        const target = parseInt(dailyTarget, 10);
        if (isChallengeComplete(score, target, mode.scoreLowerIsBetter)) {
          const today = new Date().toLocaleDateString("en-CA");
          markDailyCompleted(today);
          setDailyCompleted(true);
        }
      }

      setPhase("result");
    },
    [mode, recordResult, isFirstPlay, setFirstGameComplete, isDaily, dailyTarget, markDailyCompleted, modeHistoryLength]
  );

  const handlePlayAgain = useCallback(() => {
    completedRef.current = false;
    setScore(0);
    setIsNewBest(false);
    setRankedUp(false);
    setNewRankName(undefined);
    setDailyCompleted(false);
    setShowExitConfirm(false);
    setCountdownKey((k) => k + 1);
    if (skipCountdown) {
      setPhase("playing");
    } else {
      setPhase("countdown");
    }
  }, [skipCountdown]);

  const handleExit = useCallback(() => {
    router.push("/");
  }, [router]);

  // #12: Confirm before quitting mid-game
  const handleBackTap = useCallback(() => {
    if (phase === "playing" && !completedRef.current) {
      setShowExitConfirm(true);
    } else {
      handleExit();
    }
  }, [phase, handleExit]);

  return (
    <div className="fixed inset-0 bg-space-900">
      {/* #11: Larger, more visible back button with bg */}
      {(phase === "playing" || phase === "countdown" || mode.isZen) && (
        <button
          onClick={handleBackTap}
          className={`fixed top-[env(safe-area-inset-top,8px)] left-2 z-[60] w-11 h-11 flex items-center justify-center cursor-pointer transition-colors mt-1 rounded-full ${
            mode.isZen
              ? "text-indigo-300/50 bg-indigo-300/10 hover:bg-indigo-300/20"
              : "text-white/40 bg-white/[0.06] hover:bg-white/10"
          }`}
        >
          <span className="text-base">←</span>
        </button>
      )}

      {children({ onComplete: handleComplete, phase })}

      {phase === "instruction" && (
        <ModeInstructionCard mode={mode} onDismiss={handleInstructionDismiss} />
      )}

      <AnimatePresence>
        {phase === "countdown" && (
          <CountdownOverlay
            key={countdownKey}
            mode={mode}
            isDaily={!!isDaily}
            dailyTarget={dailyTarget ?? undefined}
            onComplete={handleCountdownComplete}
          />
        )}
      </AnimatePresence>

      {/* #12: Exit confirmation overlay */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-space-900/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 px-8">
            <div className="text-white/60 text-sm">Quit this round?</div>
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

      {phase === "result" && !mode.isZen && (
        <ResultScreen
          mode={mode}
          score={score}
          isNewBest={isNewBest}
          isFirstPlay={wasFirstPlay}
          rankedUp={rankedUp}
          newRankName={newRankName}
          dailyCompleted={dailyCompleted}
          onPlayAgain={handlePlayAgain}
          onExit={handleExit}
        />
      )}
    </div>
  );
}
