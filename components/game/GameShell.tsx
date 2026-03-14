"use client";

import { useState, useCallback } from "react";
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
    onFail: () => void;
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
  const recordResult = useProgressionStore((s) => s.recordResult);

  const handleCountdownComplete = useCallback(() => {
    setPhase("playing");
  }, []);

  const handleComplete = useCallback(
    (score: number, details?: Record<string, number>) => {
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

  const handleFail = useCallback(() => {
    // Screen shake is handled by the mode component
  }, []);

  const handlePlayAgain = useCallback(() => {
    setIsNewBest(false);
    setRankedUp(false);
    setNewRankName(undefined);
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
      {children({ onComplete: handleComplete, onFail: handleFail, phase })}

      {/* Overlays */}
      <AnimatePresence>
        {phase === "countdown" && (
          <CountdownOverlay onComplete={handleCountdownComplete} />
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
