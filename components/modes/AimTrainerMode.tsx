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
  const [targetsHit, setTargetsHit] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [shake, setShake] = useState(false);
  const lastHitTime = useRef(0);
  const hitRef = useRef(0);

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
      setTargetsHit(0);
      setTimes([]);
      setTarget(randomTarget(0));
      lastHitTime.current = performance.now();
    }
  }, [phase, randomTarget]);

  const handleHit = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (phase !== "playing") return;

      const now = performance.now();
      const reactionMs = Math.round(now - lastHitTime.current);
      lastHitTime.current = now;

      hitRef.current += 1;
      const newTimes = [...times, reactionMs];
      setTimes(newTimes);
      setTargetsHit(hitRef.current);

      audioManager.tapSuccess();
      haptic.light();

      if (hitRef.current >= TOTAL_TARGETS) {
        const avg = Math.round(newTimes.reduce((a, b) => a + b, 0) / newTimes.length);
        onComplete(avg, {
          hits: hitRef.current,
          totalMs: newTimes.reduce((a, b) => a + b, 0),
        });
      } else {
        setTarget(randomTarget(hitRef.current));
      }
    },
    [phase, times, onComplete, randomTarget]
  );

  const handleMiss = useCallback(() => {
    if (phase !== "playing") return;
    audioManager.tapFail();
    haptic.error();
    setShake(true);
    setTimeout(() => setShake(false), 400);
  }, [phase]);

  if (phase !== "playing") return null;

  return (
    <motion.div
      animate={
        shake
          ? { x: [0, -8, 8, -5, 5, 0], transition: { duration: 0.35 } }
          : { x: 0 }
      }
      className="fixed inset-0"
      onMouseDown={handleMiss}
      onTouchStart={(e) => {
        e.preventDefault();
        handleMiss();
      }}
    >
      {/* Header */}
      <div className="fixed top-16 left-0 right-0 flex justify-center gap-8 z-10">
        <div className="text-center">
          <div className="text-[10px] text-white/30 uppercase tracking-widest">Target</div>
          <div className="text-xl font-bold text-neon-amber text-glow-amber tabular-nums">
            {targetsHit}/{TOTAL_TARGETS}
          </div>
        </div>
        {times.length > 0 && (
          <div className="text-center">
            <div className="text-[10px] text-white/30 uppercase tracking-widest">Avg</div>
            <div className="text-xl font-bold text-neon-amber tabular-nums">
              {Math.round(times.reduce((a, b) => a + b, 0) / times.length)}ms
            </div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="fixed top-12 left-8 right-8 h-[2px] bg-white/10 rounded-full z-10">
        <motion.div
          className="h-full bg-neon-amber rounded-full"
          animate={{ width: `${(targetsHit / TOTAL_TARGETS) * 100}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{ boxShadow: "0 0 8px #ffaa00" }}
        />
      </div>

      {/* Target */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={target.key}
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
          onMouseDown={handleHit}
          onTouchStart={handleHit}
        >
          <div
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
            <div className="absolute inset-0 flex items-center justify-center">
              <div
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
