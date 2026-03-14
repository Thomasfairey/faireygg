"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { audioManager } from "@/lib/audio/AudioManager";
import { haptic } from "@/lib/haptics";

interface SpeedRoundModeProps {
  onComplete: (score: number, details?: Record<string, number>) => void;
  phase: string;
}

const TOTAL_TAPS = 5;

export default function SpeedRoundMode({ onComplete, phase }: SpeedRoundModeProps) {
  const [currentTap, setCurrentTap] = useState(0);
  const [started, setStarted] = useState(false);
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const lastTapTime = useRef(0);
  const startTime = useRef(0);

  useEffect(() => {
    if (phase === "playing") {
      setCurrentTap(0);
      setStarted(false);
      setTapTimes([]);
    }
  }, [phase]);

  const handleTap = useCallback(() => {
    if (phase !== "playing") return;

    const now = performance.now();

    if (!started) {
      setStarted(true);
      startTime.current = now;
      lastTapTime.current = now;
      setCurrentTap(1);
      audioManager.tapSuccess();
      haptic.light();
      return;
    }

    const elapsed = Math.round(now - lastTapTime.current);
    lastTapTime.current = now;
    const newTapTimes = [...tapTimes, elapsed];
    setTapTimes(newTapTimes);

    const next = currentTap + 1;
    setCurrentTap(next);
    audioManager.tapSuccess();
    haptic.light();

    if (next >= TOTAL_TAPS) {
      const totalMs = Math.round(now - startTime.current);
      const avg = Math.round(newTapTimes.reduce((a, b) => a + b, 0) / newTapTimes.length);
      onComplete(totalMs, { averageGap: avg });
    }
  }, [phase, started, currentTap, tapTimes, onComplete]);

  if (phase !== "playing") return null;

  const progress = currentTap / TOTAL_TAPS;

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-8 cursor-pointer"
      onMouseDown={handleTap}
      onTouchStart={(e) => {
        e.preventDefault();
        handleTap();
      }}
    >
      {/* Progress dots */}
      <div className="flex gap-3">
        {Array.from({ length: TOTAL_TAPS }).map((_, i) => (
          <motion.div
            key={i}
            animate={{
              scale: i < currentTap ? 1 : i === currentTap ? [1, 1.3, 1] : 0.7,
              opacity: i < currentTap ? 1 : i === currentTap ? 1 : 0.2,
            }}
            transition={
              i === currentTap
                ? { scale: { duration: 0.8, repeat: Infinity } }
                : { type: "spring", stiffness: 400, damping: 25 }
            }
            className="w-4 h-4 rounded-full"
            style={{
              background: i < currentTap ? "#ff00e5" : i === currentTap ? "#ff00e5" : "rgba(255,255,255,0.15)",
              boxShadow: i < currentTap ? "0 0 12px #ff00e5" : "none",
            }}
          />
        ))}
      </div>

      {/* Main tap zone */}
      <motion.div
        animate={{
          boxShadow: started
            ? [
                "0 0 30px rgba(255,0,229,0.3)",
                "0 0 60px rgba(255,0,229,0.5)",
                "0 0 30px rgba(255,0,229,0.3)",
              ]
            : "0 0 20px rgba(255,0,229,0.2)",
        }}
        transition={started ? { duration: 0.3, repeat: Infinity } : {}}
        className="w-48 h-48 rounded-full border-2 border-neon-magenta/50 bg-neon-magenta/10 flex items-center justify-center"
      >
        <div className="text-center">
          {!started ? (
            <div className="text-xl font-bold text-neon-magenta text-glow-magenta">
              TAP TO START
            </div>
          ) : (
            <motion.div
              key={currentTap}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-5xl font-bold text-neon-magenta text-glow-magenta tabular-nums"
            >
              {currentTap}/{TOTAL_TAPS}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Progress bar */}
      <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-neon-magenta rounded-full"
          animate={{ width: `${progress * 100}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{ boxShadow: "0 0 10px #ff00e5" }}
        />
      </div>

      <div className="text-white/20 text-sm">Tap {TOTAL_TAPS} times as fast as you can</div>
    </div>
  );
}
