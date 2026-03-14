"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { audioManager } from "@/lib/audio/AudioManager";
import { haptic } from "@/lib/haptics";
import { useEffects } from "@/lib/hooks/GameEffectsContext";

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
  const [missCount, setMissCount] = useState(0);
  const [shake, setShake] = useState(false);
  const missRef = useRef(0);
  const lastHitTime = useRef(0);
  const hitRef = useRef(0);
  const timesRef = useRef<number[]>([]);
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const effects = useEffects();
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const zoneRef = useRef<HTMLDivElement>(null);

  // #3: Tighten spawn range to prevent off-screen targets (56px target on small screens)
  const randomTarget = useCallback(
    (key: number) => ({
      x: 12 + Math.random() * 76,
      y: 18 + Math.random() * 54,
      key,
    }),
    []
  );

  useEffect(() => {
    if (phase === "playing") {
      hitRef.current = 0;
      missRef.current = 0;
      timesRef.current = [];
      setDisplayHits(0);
      setDisplayAvg(null);
      setMissCount(0);
      setTarget(randomTarget(0));
      lastHitTime.current = performance.now();
    }
    return () => {
      if (shakeTimer.current) clearTimeout(shakeTimer.current);
    };
  }, [phase, randomTarget]);

  // Native event listener for lowest latency
  useEffect(() => {
    const el = zoneRef.current;
    if (!el || phase !== "playing") return;

    const handler = (e: PointerEvent) => {
      const now = performance.now(); // FIRST
      e.preventDefault();

      if (phaseRef.current !== "playing") return;

      // Check if pointer hit the target
      const targetEl = (e.target as HTMLElement).closest("[data-target]");

      if (targetEl) {
        e.stopPropagation();
        const reactionMs = Math.round(now - lastHitTime.current);
        lastHitTime.current = now;

        hitRef.current += 1;
        timesRef.current.push(reactionMs);
        const times = timesRef.current;

        setDisplayHits(hitRef.current);
        setDisplayAvg(Math.round(times.reduce((a, b) => a + b, 0) / times.length));

        audioManager.tapSuccessCombo(hitRef.current);
        haptic.light();
        effects?.burst(e.clientX, e.clientY, "#ffaa00");
        effects?.flash("success");
        effects?.popup(e.clientX, e.clientY, `${reactionMs}ms`, reactionMs < 300 ? "#00ff88" : "#ffaa00");

        if (hitRef.current >= TOTAL_TARGETS) {
          const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
          onCompleteRef.current(avg, {
            hits: hitRef.current,
            totalMs: times.reduce((a, b) => a + b, 0),
          });
        } else {
          setTarget(randomTarget(hitRef.current));
        }
      } else {
        // Miss
        missRef.current += 1;
        setMissCount(missRef.current);
        audioManager.tapFail();
        haptic.error();
        effects?.flash("fail");
        setShake(true);
        if (shakeTimer.current) clearTimeout(shakeTimer.current);
        shakeTimer.current = setTimeout(() => setShake(false), 400);
      }
    };

    el.addEventListener("pointerdown", handler, { capture: true, passive: false });
    return () => el.removeEventListener("pointerdown", handler, true);
  }, [phase, randomTarget]);

  if (phase !== "playing") return null;

  return (
    <motion.div
      animate={
        shake
          ? { x: [0, -8, 8, -5, 5, 0], transition: { duration: 0.35 } }
          : { x: 0 }
      }
      className="fixed inset-0"
    >
      <div ref={zoneRef} className="fixed inset-0" style={{ touchAction: "none" }}>
        {/* Header */}
        <div className="fixed top-14 left-0 right-0 flex justify-center gap-6 z-10 pointer-events-none">
          <div className="text-center">
            <div className="text-[10px] text-white/30 uppercase tracking-widest">Hits</div>
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
          {/* UX-11: Miss counter + accuracy */}
          <div className="text-center">
            <div className="text-[10px] text-white/30 uppercase tracking-widest">Misses</div>
            <div className={`text-xl font-bold tabular-nums ${missCount > 0 ? "text-neon-red" : "text-white/30"}`}>
              {missCount}
            </div>
          </div>
          {displayHits > 0 && (
            <div className="text-center">
              <div className="text-[10px] text-white/30 uppercase tracking-widest">Accuracy</div>
              <div className="text-xl font-bold text-white/50 tabular-nums">
                {Math.round((displayHits / (displayHits + missCount)) * 100)}%
              </div>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="fixed top-0 left-0 right-0 h-1 bg-white/[0.06] z-10 pointer-events-none">
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
      </div>
    </motion.div>
  );
}
