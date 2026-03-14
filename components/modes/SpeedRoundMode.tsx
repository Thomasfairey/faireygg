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
  const [displayTap, setDisplayTap] = useState(0);
  const [started, setStarted] = useState(false);
  const lastTapTime = useRef(0);
  const startTime = useRef(0);
  const tapTimesRef = useRef<number[]>([]);
  const currentTapRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (phase === "playing") {
      setDisplayTap(0);
      setStarted(false);
      tapTimesRef.current = [];
      currentTapRef.current = 0;
    }
  }, [phase]);

  const handleTap = useCallback(() => {
    if (phase !== "playing") return;

    const now = performance.now();

    if (currentTapRef.current === 0) {
      setStarted(true);
      startTime.current = now;
      lastTapTime.current = now;
      currentTapRef.current = 1;
      setDisplayTap(1);
      audioManager.tapSuccess();
      haptic.light();
      return;
    }

    const elapsed = Math.round(now - lastTapTime.current);
    lastTapTime.current = now;
    tapTimesRef.current.push(elapsed);

    currentTapRef.current += 1;
    setDisplayTap(currentTapRef.current);
    audioManager.tapSuccess();
    haptic.light();

    if (currentTapRef.current >= TOTAL_TAPS) {
      const totalMs = Math.round(now - startTime.current);
      const times = tapTimesRef.current;
      const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      onCompleteRef.current(totalMs, { averageGap: avg });
    }
  }, [phase]);

  if (phase !== "playing") return null;

  const progress = displayTap / TOTAL_TAPS;

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-8 cursor-pointer"
      onPointerDown={(e) => {
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
              scale: i < displayTap ? 1 : i === displayTap ? [1, 1.3, 1] : 0.7,
              opacity: i < displayTap ? 1 : i === displayTap ? 1 : 0.2,
            }}
            transition={
              i === displayTap
                ? { scale: { duration: 0.8, repeat: Infinity } }
                : { type: "spring", stiffness: 400, damping: 25 }
            }
            className="w-4 h-4 rounded-full"
            style={{
              background: i < displayTap ? "#ff00e5" : i === displayTap ? "#ff00e5" : "rgba(255,255,255,0.15)",
              boxShadow: i < displayTap ? "0 0 12px #ff00e5" : "none",
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
              key={displayTap}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-5xl font-bold text-neon-magenta text-glow-magenta tabular-nums"
            >
              {displayTap}/{TOTAL_TAPS}
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
