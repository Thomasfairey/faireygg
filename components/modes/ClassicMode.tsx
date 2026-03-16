"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { audioManager } from "@/lib/audio/AudioManager";
import { haptic } from "@/lib/haptics";
import { useProgressionStore } from "@/lib/store/progressionStore";
import { getClassicDifficulty } from "@/lib/game/adaptiveDifficulty";
import { EMPTY_ARRAY } from "@/lib/store/stableDefaults";
import { useEffects } from "@/lib/hooks/GameEffectsContext";

type TapPhase = "waiting" | "ready" | "too-early";

interface ClassicModeProps {
  onComplete: (score: number) => void;
  phase: string;
}

export default function ClassicMode({ onComplete, phase }: ClassicModeProps) {
  const [tapPhase, setTapPhase] = useState<TapPhase>("waiting");
  const [shake, setShake] = useState(false);
  const readyAt = useRef(0);
  const tapPhaseRef = useRef<TapPhase>("waiting");
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const effects = useEffects();
  const history = useProgressionStore((s) => (s.history ?? {})["classic"] ?? EMPTY_ARRAY);
  const difficulty = getClassicDifficulty(history);
  const tensionStop = useRef<(() => void) | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recoveryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completedRef = useRef(false);
  const readyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const zoneRef = useRef<HTMLDivElement>(null);

  const clearAllTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (shakeTimer.current) clearTimeout(shakeTimer.current);
    if (recoveryTimer.current) clearTimeout(recoveryTimer.current);
    if (readyTimeoutRef.current) clearTimeout(readyTimeoutRef.current);
    if (tensionStop.current) { tensionStop.current(); tensionStop.current = null; }
  }, []);

  const startWaiting = useCallback(() => {
    tapPhaseRef.current = "waiting";
    setTapPhase("waiting");
    // Adaptive difficulty: tighter windows for better players
    const delay = difficulty.minWait + Math.random() * (difficulty.maxWait - difficulty.minWait);
    // Start tension sound
    tensionStop.current = audioManager.classicTension();
    timeoutRef.current = setTimeout(() => {
      if (tensionStop.current) { tensionStop.current(); tensionStop.current = null; }
      readyAt.current = performance.now();
      tapPhaseRef.current = "ready";
      setTapPhase("ready");
      // BUG-03: Auto-fail after 10s if user never taps
      readyTimeoutRef.current = setTimeout(() => {
        if (tapPhaseRef.current === "ready" && !completedRef.current) {
          completedRef.current = true;
          audioManager.tapFail();
          haptic.error();
          onCompleteRef.current(10000);
        }
      }, 10000);
    }, delay);
  }, [difficulty.minWait, difficulty.maxWait]);

  useEffect(() => {
    if (phase === "playing") {
      completedRef.current = false;
      startWaiting();
    }
    return clearAllTimers;
  }, [phase, startWaiting, clearAllTimers]);

  // Native event listener — bypasses React synthetic events for lowest latency
  useEffect(() => {
    const el = zoneRef.current;
    if (!el || phase !== "playing") return;

    const handler = (e: PointerEvent) => {
      const now = performance.now(); // FIRST — capture time immediately
      e.preventDefault();

      if (phaseRef.current !== "playing" || completedRef.current) return;

      if (tapPhaseRef.current === "waiting") {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (readyTimeoutRef.current) clearTimeout(readyTimeoutRef.current);
        if (tensionStop.current) { tensionStop.current(); tensionStop.current = null; }
        audioManager.tapFail();
        haptic.error();
        effects?.flash("fail");
        setShake(true);
        shakeTimer.current = setTimeout(() => setShake(false), 400);
        tapPhaseRef.current = "too-early";
        setTapPhase("too-early");
        recoveryTimer.current = setTimeout(() => startWaiting(), 1200);
      } else if (tapPhaseRef.current === "ready") {
        if (readyTimeoutRef.current) clearTimeout(readyTimeoutRef.current);
        const ms = Math.round(now - readyAt.current);
        completedRef.current = true;
        audioManager.tapSuccess();
        haptic.success();
        effects?.burst(e.clientX, e.clientY, "#00f0ff");
        effects?.flash("success");
        if (ms < 250) effects?.popup(e.clientX, e.clientY, `${ms}ms!`, "#00ff88");
        onCompleteRef.current(ms);
      }
    };

    el.addEventListener("pointerdown", handler, { capture: true, passive: false });
    return () => el.removeEventListener("pointerdown", handler, true);
  }, [phase, startWaiting]);

  if (phase !== "playing") return null;

  // HIGH FIX: Make green state dramatically visible
  const bgColor =
    tapPhase === "waiting"
      ? "bg-red-900/40"
      : tapPhase === "ready"
        ? "bg-green-600/30"
        : "bg-orange-900/30";

  const borderColor =
    tapPhase === "waiting"
      ? "border-red-500/30"
      : tapPhase === "ready"
        ? "border-neon-green"
        : "border-orange-500/30";

  const fullScreenBg =
    tapPhase === "waiting"
      ? ""
      : tapPhase === "ready"
        ? "bg-green-950/40"
        : "";

  return (
    <motion.div
      animate={
        shake
          ? { x: [0, -12, 12, -8, 8, -4, 4, 0], transition: { duration: 0.4 } }
          : { x: 0 }
      }
      className={`fixed inset-0 flex items-center justify-center transition-colors duration-200 ${fullScreenBg}`}
    >
      <div
        ref={zoneRef}
        className={`
          w-[80vw] h-[50vh] max-w-md rounded-3xl
          flex flex-col items-center justify-center gap-4
          border-2 ${borderColor} ${bgColor}
          transition-all duration-300 cursor-pointer
        `}
        style={{ touchAction: "none" }}
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
