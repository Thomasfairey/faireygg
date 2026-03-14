"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { audioManager } from "@/lib/audio/AudioManager";
import { haptic } from "@/lib/haptics";

interface AimTrainerModeProps {
  onComplete: (score: number, details?: Record<string, number>) => void;
  phase: string;
}

const TOTAL_TARGETS = 20;
const TARGET_SIZE = 56;

export default function AimTrainerMode({ onComplete, phase }: AimTrainerModeProps) {
  const [target, setTarget] = useState({ x: 50, y: 50, key: 0 });
  const [displayHits, setDisplayHits] = useState(0);
  const [displayAvg, setDisplayAvg] = useState<number | null>(null);
  const [shake, setShake] = useState(false);
  const lastHitTime = useRef(0);
  const hitRef = useRef(0);
  const timesRef = useRef<number[]>([]);
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const randomTarget = useCallback(
    (key: number) => ({
      x: 10 + Math.random() * 80,
      y: 15 + Math.random() * 60,
      key,
    }),
    []
  );

  useEffect(() => {
    if (phase === "playing") {
      hitRef.current = 0;
      timesRef.current = [];
      setDisplayHits(0);
      setDisplayAvg(null);
      setTarget(randomTarget(0));
      lastHitTime.current = performance.now();
    }
    return () => {
      if (shakeTimer.current) clearTimeout(shakeTimer.current);
    };
  }, [phase, randomTarget]);

  const handleHit = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (phase !== "playing") return;

      const now = performance.now();
      const reactionMs = Math.round(now - lastHitTime.current);
      lastHitTime.current = now;

      hitRef.current += 1;
      timesRef.current.push(reactionMs);
      const times = timesRef.current;

      setDisplayHits(hitRef.current);
      setDisplayAvg(Math.round(times.reduce((a, b) => a + b, 0) / times.length));

      audioManager.tapSuccess();
      haptic.light();

      if (hitRef.current >= TOTAL_TARGETS) {
        const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
        onCompleteRef.current(avg, {
          hits: hitRef.current,
          totalMs: times.reduce((a, b) => a + b, 0),
        });
      } else {
        setTarget(randomTarget(hitRef.current));
      }
    },
    [phase, randomTarget]
  );

  const handleMiss = useCallback(
    (e: React.PointerEvent) => {
      if (phase !== "playing") return;
      // Only fire if the pointer target is the background, not the target
      if ((e.target as HTMLElement).closest("[data-target]")) return;

      audioManager.tapFail();
      haptic.error();
      setShake(true);
      if (shakeTimer.current) clearTimeout(shakeTimer.current);
      shakeTimer.current = setTimeout(() => setShake(false), 400);
    },
    [phase]
  );

  if (phase !== "playing") return null;

  return (
    <motion.div
      animate={
        shake
          ? { x: [0, -8, 8, -5, 5, 0], transition: { duration: 0.35 } }
          : { x: 0 }
      }
      className="fixed inset-0"
      onPointerDown={handleMiss}
    >
      {/* Header */}
      <div className="fixed top-16 left-0 right-0 flex justify-center gap-8 z-10">
        <div className="text-center">
          <div className="text-[10px] text-white/30 uppercase tracking-widest">Target</div>
          <div className="text-xl font-bold text-neon-amber text-glow-amber tabular-nums">
            {displayHits}/{TOTAL_TARGETS}
          </div>
        </div>
        {displayAvg !== null && (
          <div className="text-center">
            <div className="text-[10px] text-white/30 uppercase tracking-widest">Avg</div>
            <div className="text-xl font-bold text-neon-amber tabular-nums">
              {displayAvg}ms
            </div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="fixed top-12 left-8 right-8 h-[2px] bg-white/10 rounded-full z-10">
        <motion.div
          className="h-full bg-neon-amber rounded-full"
          animate={{ width: `${(displayHits / TOTAL_TARGETS) * 100}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{ boxShadow: "0 0 8px #ffaa00" }}
        />
      </div>

      {/* Target */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={target.key}
          data-target
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.5, opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
          className="absolute cursor-pointer"
          style={{
            left: `${target.x}%`,
            top: `${target.y}%`,
            transform: "translate(-50%, -50%)",
          }}
          onPointerDown={handleHit}
        >
          <div
            data-target
            className="rounded-full relative"
            style={{
              width: TARGET_SIZE,
              height: TARGET_SIZE,
              background: "radial-gradient(circle, #ffaa0050 0%, #ffaa0020 50%, transparent 70%)",
              border: "2px solid #ffaa0080",
              boxShadow: "0 0 20px #ffaa0040, inset 0 0 15px #ffaa0020",
            }}
          >
            {/* Center dot */}
            <div data-target className="absolute inset-0 flex items-center justify-center">
              <div
                data-target
                className="w-3 h-3 rounded-full bg-neon-amber"
                style={{ boxShadow: "0 0 8px #ffaa00" }}
              />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
