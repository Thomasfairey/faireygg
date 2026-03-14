"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { audioManager } from "@/lib/audio/AudioManager";
import { haptic } from "@/lib/haptics";

type TapPhase = "waiting" | "ready" | "too-early";

interface ClassicModeProps {
  onComplete: (score: number) => void;
  phase: string;
}

export default function ClassicMode({ onComplete, phase }: ClassicModeProps) {
  const [tapPhase, setTapPhase] = useState<TapPhase>("waiting");
  const [shake, setShake] = useState(false);
  const readyAt = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recoveryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const clearAllTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (shakeTimer.current) clearTimeout(shakeTimer.current);
    if (recoveryTimer.current) clearTimeout(recoveryTimer.current);
  }, []);

  const startWaiting = useCallback(() => {
    setTapPhase("waiting");
    const delay = 1500 + Math.random() * 3500;
    timeoutRef.current = setTimeout(() => {
      readyAt.current = performance.now();
      setTapPhase("ready");
    }, delay);
  }, []);

  useEffect(() => {
    if (phase === "playing") {
      completedRef.current = false;
      startWaiting();
    }
    return clearAllTimers;
  }, [phase, startWaiting, clearAllTimers]);

  const handleTap = useCallback(() => {
    if (phase !== "playing" || completedRef.current) return;

    if (tapPhase === "waiting") {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      audioManager.tapFail();
      haptic.error();
      setShake(true);
      shakeTimer.current = setTimeout(() => setShake(false), 400);
      setTapPhase("too-early");
      recoveryTimer.current = setTimeout(() => startWaiting(), 1200);
    } else if (tapPhase === "ready") {
      const ms = Math.round(performance.now() - readyAt.current);
      completedRef.current = true;
      audioManager.tapSuccess();
      haptic.success();
      onCompleteRef.current(ms);
    }
    // "too-early" taps are silently ignored — recovery timer will restart
  }, [tapPhase, phase, startWaiting]);

  if (phase !== "playing") return null;

  const bgColor =
    tapPhase === "waiting"
      ? "bg-red-900/40"
      : tapPhase === "ready"
        ? "bg-green-900/30"
        : "bg-orange-900/30";

  const borderColor =
    tapPhase === "waiting"
      ? "border-red-500/30"
      : tapPhase === "ready"
        ? "border-neon-green/50"
        : "border-orange-500/30";

  return (
    <motion.div
      animate={
        shake
          ? { x: [0, -12, 12, -8, 8, -4, 4, 0], transition: { duration: 0.4 } }
          : { x: 0 }
      }
      className="fixed inset-0 flex items-center justify-center"
      onPointerDown={(e) => {
        e.preventDefault();
        handleTap();
      }}
    >
      <div
        className={`
          w-[80vw] h-[50vh] max-w-md rounded-3xl
          flex flex-col items-center justify-center gap-4
          border-2 ${borderColor} ${bgColor}
          transition-all duration-300 cursor-pointer
        `}
      >
        {tapPhase === "waiting" && (
          <>
            <motion.div
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-4xl font-bold text-red-400"
            >
              WAIT
            </motion.div>
            <div className="text-sm text-white/30">Don&apos;t tap yet...</div>
          </>
        )}

        {tapPhase === "ready" && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
          >
            <div className="text-6xl font-bold text-neon-green text-glow-green">
              TAP!
            </div>
          </motion.div>
        )}

        {tapPhase === "too-early" && (
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
          >
            <div className="text-3xl font-bold text-orange-400 text-glow-amber">
              Too early!
            </div>
            <div className="text-sm text-white/30 mt-2 text-center">
              Wait for green...
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
