"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ModeDefinition } from "@/lib/game/modes";
import { audioManager } from "@/lib/audio/AudioManager";
import { haptic } from "@/lib/haptics";

interface CountdownOverlayProps {
  mode: ModeDefinition;
  isDaily?: boolean;
  dailyTarget?: string;
  onComplete: () => void;
}

const MODE_HINTS: Record<string, string> = {
  classic: "Tap when the screen turns green",
  "speed-round": "Tap as fast as you can",
  sequence: "Watch the pattern, then repeat",
  "shrinking-target": "Hit the target before it vanishes",
  "aim-trainer": "Tap targets as fast as you can",
  inhibition: "Tap green, resist red",
  zen: "",
};

export default function CountdownOverlay({ mode, isDaily, dailyTarget, onComplete }: CountdownOverlayProps) {
  const [count, setCount] = useState(3);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    audioManager.init();
    audioManager.countdownTick();
    haptic.countdown();

    intervalRef.current = setInterval(() => {
      setCount((prev) => prev - 1);
    }, 800);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (count === 2 || count === 1) {
      audioManager.countdownTick();
      haptic.countdown();
    } else if (count === 0) {
      audioManager.countdownGo();
      haptic.medium();
    } else if (count < 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      onCompleteRef.current();
    }
  }, [count]);

  const hint = MODE_HINTS[mode.id] ?? "";

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-space-900/90 backdrop-blur-md">
      {/* #1 & #13: Mode context shown during countdown */}
      <div className="absolute top-20 left-0 right-0 flex flex-col items-center gap-1">
        <span className="text-2xl">{mode.icon}</span>
        <span className="text-sm font-bold" style={{ color: mode.color }}>{mode.name}</span>
        {hint && <span className="text-[10px] text-white/30 max-w-[200px] text-center">{hint}</span>}
        {isDaily && dailyTarget && (
          <span className="text-[10px] text-neon-amber mt-1 font-bold uppercase tracking-wider">
            Daily: {dailyTarget}
          </span>
        )}
      </div>

      <AnimatePresence mode="popLayout">
        {count > 0 && (
          <motion.div
            key={count}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="text-8xl font-bold text-neon-cyan text-glow-cyan tabular-nums"
          >
            {count}
          </motion.div>
        )}
        {count === 0 && (
          <motion.div
            key="go"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="text-7xl font-bold text-neon-green text-glow-green"
          >
            GO!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
