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
  const completedRef = useRef(false);
  const initializedRef = useRef(false);
  const recordResult = useProgressionStore((s) => s.recordResult);
  const modeHistoryLength = useProgressionStore((s) => ((s.history ?? {})[mode.id] ?? []).length);
  const markDailyCompleted = useDailyChallengeStore((s) => s.markCompleted);

  // Set initial phase after mount to avoid hydration issues with persist stores
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
      setIsNewBest(nb);
      if (newRank.id !== previousRank.id) {
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
      {(phase === "playing" || mode.isZen) && (
        <button
          onClick={handleExit}
          className={`fixed top-[env(safe-area-inset-top,8px)] left-2 z-50 w-12 h-12 flex items-center justify-center cursor-pointer transition-colors mt-1 rounded-full ${
            mode.isZen ? "text-indigo-300/40 hover:text-indigo-300/60 hover:bg-indigo-300/10" : "text-white/30 hover:text-white/50 hover:bg-white/5"
          }`}
        >
          <span className="text-lg">←</span>
        </button>
      )}

      {children({ onComplete: handleComplete, phase })}

      {phase === "instruction" && (
        <ModeInstructionCard mode={mode} onDismiss={handleInstructionDismiss} />
      )}

      <AnimatePresence>
        {phase === "countdown" && (
          <CountdownOverlay key={countdownKey} onComplete={handleCountdownComplete} />
        )}
      </AnimatePresence>

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
