"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { ModeDefinition } from "@/lib/game/modes";
import { GameResult } from "@/lib/game/scoring";
import { useProgressionStore } from "@/lib/store/progressionStore";
import CountdownOverlay from "./CountdownOverlay";
import ResultScreen from "./ResultScreen";

type Phase = "countdown" | "playing" | "result";

interface GameShellProps {
  mode: ModeDefinition;
  children: (props: {
    onComplete: (score: number, details?: Record<string, number>) => void;
    phase: Phase;
  }) => React.ReactNode;
}

export default function GameShell({ mode, children }: GameShellProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("countdown");
  const [score, setScore] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);
  const [rankedUp, setRankedUp] = useState(false);
  const [newRankName, setNewRankName] = useState<string>();
  const [countdownKey, setCountdownKey] = useState(0); // force remount
  const completedRef = useRef(false);
  const recordResult = useProgressionStore((s) => s.recordResult);

  const handleCountdownComplete = useCallback(() => {
    setPhase("playing");
  }, []);

  const handleComplete = useCallback(
    (score: number, details?: Record<string, number>) => {
      // Guard against double-completion
      if (completedRef.current) return;
      completedRef.current = true;

      setScore(score);
      const result: GameResult = {
        mode: mode.id,
        score,
        date: new Date().toISOString(),
        details,
      };
      const { isNewBest: nb, previousRank, newRank } = recordResult(
        result,
        mode.scoreLowerIsBetter
      );
      setIsNewBest(nb);
      if (newRank.id !== previousRank.id) {
        setRankedUp(true);
        setNewRankName(newRank.name);
      }
      setPhase("result");
    },
    [mode, recordResult]
  );

  const handlePlayAgain = useCallback(() => {
    completedRef.current = false;
    setScore(0);
    setIsNewBest(false);
    setRankedUp(false);
    setNewRankName(undefined);
    setCountdownKey((k) => k + 1); // force CountdownOverlay remount
    setPhase("countdown");
  }, []);

  const handleExit = useCallback(() => {
    router.push("/");
  }, [router]);

  return (
    <div className="fixed inset-0 bg-space-900">
      {/* Back button */}
      {phase === "playing" && (
        <button
          onClick={handleExit}
          className="fixed top-[env(safe-area-inset-top,12px)] left-4 z-50 text-white/20 text-sm py-2 px-3 cursor-pointer hover:text-white/40 transition-colors mt-2"
        >
          ✕
        </button>
      )}

      {/* Game content */}
      {children({ onComplete: handleComplete, phase })}

      {/* Overlays */}
      <AnimatePresence>
        {phase === "countdown" && (
          <CountdownOverlay key={countdownKey} onComplete={handleCountdownComplete} />
        )}
      </AnimatePresence>

      {phase === "result" && (
        <ResultScreen
          mode={mode}
          score={score}
          isNewBest={isNewBest}
          rankedUp={rankedUp}
          newRankName={newRankName}
          onPlayAgain={handlePlayAgain}
          onExit={handleExit}
        />
      )}
    </div>
  );
}
