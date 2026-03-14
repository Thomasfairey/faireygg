"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { audioManager } from "@/lib/audio/AudioManager";
import { haptic } from "@/lib/haptics";
import { useEffects } from "@/lib/hooks/GameEffectsContext";

interface InhibitionModeProps {
  onComplete: (score: number) => void;
  phase: string;
}

const TOTAL_ROUNDS = 20;
const INITIAL_WINDOW = 1500;
const MIN_WINDOW = 600;
const WINDOW_DECREASE = 50;

interface Signal {
  type: "green" | "red";
  key: number;
}

export default function InhibitionMode({ onComplete, phase }: InhibitionModeProps) {
  const [round, setRound] = useState(0);
  const [signal, setSignal] = useState<Signal | null>(null);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | "resisted" | null>(null);
  const [shake, setShake] = useState(false);

  const scoreRef = useRef(0);
  const roundRef = useRef(0);
  const signalRef = useRef<Signal | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyAt = useRef(0);
  const completedRef = useRef(false);
  const tappedRef = useRef(false);
  const effects = useEffects();
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const zoneRef = useRef<HTMLDivElement>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const nextRound = useCallback(() => {
    if (completedRef.current) return;

    if (roundRef.current >= TOTAL_ROUNDS) {
      completedRef.current = true;
      onCompleteRef.current(scoreRef.current);
      return;
    }

    tappedRef.current = false;
    const isGreen = Math.random() < 0.6;
    const sig: Signal = { type: isGreen ? "green" : "red", key: roundRef.current };
    signalRef.current = sig;
    setSignal(sig);
    setFeedback(null);
    readyAt.current = performance.now();

    // If red, start timer for the window — if they don't tap, reward them
    if (!isGreen) {
      const windowMs = Math.max(INITIAL_WINDOW - roundRef.current * WINDOW_DECREASE, MIN_WINDOW);
      timerRef.current = setTimeout(() => {
        if (!tappedRef.current && !completedRef.current) {
          // Successfully resisted!
          scoreRef.current += 200;
          setScore(scoreRef.current);
          setFeedback("resisted");
          audioManager.inhibitionResist();
          haptic.light();
          roundRef.current += 1;
          setRound(roundRef.current);
          setTimeout(() => nextRound(), 500);
        }
      }, windowMs);
    } else {
      // Green — they have the window to tap, but no auto-advance (they must tap)
      const windowMs = Math.max(INITIAL_WINDOW - roundRef.current * WINDOW_DECREASE, MIN_WINDOW);
      timerRef.current = setTimeout(() => {
        if (!tappedRef.current && !completedRef.current) {
          // Too slow on green
          setFeedback("wrong");
          audioManager.tapFail();
          haptic.error();
          roundRef.current += 1;
          setRound(roundRef.current);
          setTimeout(() => nextRound(), 500);
        }
      }, windowMs);
    }
  }, []);

  useEffect(() => {
    if (phase === "playing") {
      scoreRef.current = 0;
      roundRef.current = 0;
      completedRef.current = false;
      setScore(0);
      setRound(0);
      setSignal(null);
      setFeedback(null);
      // Brief pause then start
      timerRef.current = setTimeout(() => nextRound(), 600);
    }
    return clearTimer;
  }, [phase, nextRound, clearTimer]);

  // Native event listener
  useEffect(() => {
    const el = zoneRef.current;
    if (!el || phase !== "playing") return;

    const handler = (e: PointerEvent) => {
      const now = performance.now();
      e.preventDefault();
      if (completedRef.current || tappedRef.current || !signalRef.current) return;
      tappedRef.current = true;
      clearTimer();

      const sig = signalRef.current;
      if (sig.type === "green") {
        // Correct tap
        const reactionMs = Math.round(now - readyAt.current);
        const points = Math.max(500 - reactionMs, 50);
        scoreRef.current += points;
        setScore(scoreRef.current);
        setFeedback("correct");
        audioManager.inhibitionCorrect();
        haptic.light();
        effects?.burst(e.clientX, e.clientY, "#00ff88");
        effects?.flash("success");
        effects?.popup(e.clientX, e.clientY, `+${points}`, "#00ff88");
      } else {
        // Tapped red — penalty
        scoreRef.current = Math.max(0, scoreRef.current - 300);
        setScore(scoreRef.current);
        setFeedback("wrong");
        setShake(true);
        setTimeout(() => setShake(false), 400);
        audioManager.inhibitionWrong();
        haptic.error();
        effects?.flash("fail");
        effects?.popup(e.clientX, e.clientY, "-300", "#ff3355");
      }

      roundRef.current += 1;
      setRound(roundRef.current);
      setTimeout(() => nextRound(), 500);
    };

    el.addEventListener("pointerdown", handler, { capture: true, passive: false });
    return () => el.removeEventListener("pointerdown", handler, true);
  }, [phase, nextRound, clearTimer]);

  if (phase !== "playing") return null;

  const isGreen = signal?.type === "green";

  return (
    <motion.div
      animate={shake ? { x: [0, -10, 10, -6, 6, 0], transition: { duration: 0.4 } } : { x: 0 }}
      className="fixed inset-0"
    >
      <div ref={zoneRef} className="fixed inset-0 flex flex-col items-center justify-center gap-6" style={{ touchAction: "none" }}>
        {/* Header */}
        <div className="fixed top-16 left-0 right-0 flex justify-center gap-8 z-10 pointer-events-none">
          <div className="text-center">
            <div className="text-[10px] text-white/30 uppercase tracking-widest">Round</div>
            <div className="text-xl font-bold text-neon-red tabular-nums">
              {Math.min(round + 1, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-white/30 uppercase tracking-widest">Score</div>
            <div className="text-xl font-bold text-neon-red text-glow-red tabular-nums">
              {score}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="fixed top-12 left-8 right-8 h-[2px] bg-white/10 rounded-full z-10 pointer-events-none">
          <motion.div
            className="h-full bg-neon-red rounded-full"
            animate={{ width: `${(round / TOTAL_ROUNDS) * 100}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{ boxShadow: "0 0 8px #ff3355" }}
          />
        </div>

        {/* Signal */}
        <AnimatePresence mode="popLayout">
          {signal && !feedback && (
            <motion.div
              key={signal.key}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="w-32 h-32 rounded-full flex items-center justify-center"
              style={{
                background: isGreen
                  ? "radial-gradient(circle, #00ff8850 0%, #00ff8815 60%, transparent 70%)"
                  : "radial-gradient(circle, #ff335550 0%, #ff335515 60%, transparent 70%)",
                border: `3px solid ${isGreen ? "#00ff88" : "#ff3355"}`,
                boxShadow: `0 0 40px ${isGreen ? "#00ff8840" : "#ff335540"}, inset 0 0 20px ${isGreen ? "#00ff8820" : "#ff335520"}`,
              }}
            >
              <span className="text-4xl font-bold" style={{ color: isGreen ? "#00ff88" : "#ff3355" }}>
                {isGreen ? "GO" : "✕"}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feedback flash */}
        {feedback && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            {feedback === "correct" && (
              <div className="text-2xl font-bold text-neon-green text-glow-green">+{Math.max(500 - Math.round(performance.now() - readyAt.current), 50)}</div>
            )}
            {feedback === "resisted" && (
              <div className="text-2xl font-bold text-neon-cyan text-glow-cyan">+200 Resisted!</div>
            )}
            {feedback === "wrong" && (
              <div className="text-2xl font-bold text-neon-red text-glow-red">
                {signal?.type === "red" ? "-300" : "Too slow!"}
              </div>
            )}
          </motion.div>
        )}

        {!signal && !feedback && (
          <div className="text-white/20 text-sm">Get ready...</div>
        )}

        {/* Instructions */}
        <div className="fixed bottom-24 left-0 right-0 text-center pointer-events-none">
          <span className="text-[10px] text-white/15 uppercase tracking-widest">
            Tap green · Resist red
          </span>
        </div>
      </div>
    </motion.div>
  );
}
