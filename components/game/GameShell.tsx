"use client";

import { useState, useCallback, useRef } from "react";
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
  const isFirstPlay = searchParams.get("first") === "true";
  const dailyTarget = searchParams.get("target");
  const isDaily = searchParams.get("daily") === "true" && dailyTarget;

  const hasPlayed = useOnboardingStore((s) => s.hasPlayed);
  const markPlayed = useOnboardingStore((s) => s.markPlayed);
  const setFirstGameComplete = useOnboardingStore((s) => s.setFirstGameComplete);

  const needsInstruction = !hasPlayed(mode.id);
  const skipCountdown = mode.isZen;

  const [phase, setPhase] = useState<Phase>(
    needsInstruction ? "instruction" : skipCountdown ? "playing" : "countdown"
  );
  const [score, setScore] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);
  const [rankedUp, setRankedUp] = useState(false);
  const [newRankName, setNewRankName] = useState<string>();
  const [dailyCompleted, setDailyCompleted] = useState(false);
  const [countdownKey, setCountdownKey] = useState(0);
  const completedRef = useRef(false);
  const recordResult = useProgressionStore((s) => s.recordResult);
  const markDailyCompleted = useDailyChallengeStore((s) => s.markCompleted);

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

      setScore(score);
      const result: GameResult = {
        mode: mode.id,
        score,
        date: new Date().toISOString(),
        details,
      };
      const { isNewBest: nb, previousRank, newRank } = recordResult(result, mode.scoreLowerIsBetter);
      setIsNewBest(nb);
      if (newRank.id !== previousRank.id) {
        setRankedUp(true);
        setNewRankName(newRank.name);
      }

      // Check daily challenge
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
    [mode, recordResult, isFirstPlay, setFirstGameComplete, isDaily, dailyTarget, markDailyCompleted]
  );

  const handlePlayAgain = useCallback(() => {
    completedRef.current = false;
    setScore(0);
    setIsNewBest(false);
    setRankedUp(false);
    setNewRankName(undefined);
    setDailyCompleted(false);
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

  return (
    <div className="fixed inset-0 bg-space-900">
      {/* Back button — always visible for zen, during play for others */}
      {(phase === "playing" || mode.isZen) && (
        <button
          onClick={handleExit}
          className={`fixed top-[env(safe-area-inset-top,12px)] left-4 z-50 py-2 px-3 cursor-pointer transition-colors mt-2 ${
            mode.isZen ? "text-indigo-300/30 hover:text-indigo-300/50 text-sm" : "text-white/20 hover:text-white/40 text-sm"
          }`}
        >
          ✕
        </button>
      )}

      {children({ onComplete: handleComplete, phase })}

      {/* Instruction overlay */}
      {phase === "instruction" && (
        <ModeInstructionCard mode={mode} onDismiss={handleInstructionDismiss} />
      )}

      {/* Countdown */}
      <AnimatePresence>
        {phase === "countdown" && (
          <CountdownOverlay key={countdownKey} onComplete={handleCountdownComplete} />
        )}
      </AnimatePresence>

      {/* Result — not for zen mode */}
      {phase === "result" && !mode.isZen && (
        <ResultScreen
          mode={mode}
          score={score}
          isNewBest={isNewBest}
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
