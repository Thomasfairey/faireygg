"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { audioManager } from "@/lib/audio/AudioManager";
import { haptic } from "@/lib/haptics";

interface CountdownOverlayProps {
  onComplete: () => void;
}

export default function CountdownOverlay({ onComplete }: CountdownOverlayProps) {
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

  // Separate effect to handle count changes and play sounds
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-space-900/90 backdrop-blur-md">
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
