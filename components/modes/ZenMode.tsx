"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { audioManager } from "@/lib/audio/AudioManager";
import { haptic } from "@/lib/haptics";

interface ZenModeProps {
  phase: string;
}

interface ZenTarget {
  x: number;
  y: number;
  key: number;
}

export default function ZenMode({ phase }: ZenModeProps) {
  const [target, setTarget] = useState<ZenTarget | null>(null);
  const [ripple, setRipple] = useState<{ x: number; y: number; key: number } | null>(null);
  const keyRef = useRef(0);
  const spawnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ambientStop = useRef<(() => void) | null>(null);
  const zoneRef = useRef<HTMLDivElement>(null);

  const spawnTarget = useCallback(() => {
    keyRef.current += 1;
    setTarget({
      x: 15 + Math.random() * 70,
      y: 15 + Math.random() * 60,
      key: keyRef.current,
    });
    // Auto-fade after a while if not tapped
    fadeTimer.current = setTimeout(() => {
      setTarget(null);
      spawnTimer.current = setTimeout(() => spawnTarget(), 1500 + Math.random() * 1000);
    }, 4000 + Math.random() * 2000);
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    // Start ambient
    audioManager.init();
    ambientStop.current = audioManager.zenAmbient();
    // First target after a pause
    spawnTimer.current = setTimeout(() => spawnTarget(), 1500);

    return () => {
      if (spawnTimer.current) clearTimeout(spawnTimer.current);
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
      if (ambientStop.current) ambientStop.current();
    };
  }, [phase, spawnTarget]);

  // Native event listener
  useEffect(() => {
    const el = zoneRef.current;
    if (!el || phase !== "playing") return;

    const handler = (e: PointerEvent) => {
      e.preventDefault();
      const targetEl = (e.target as HTMLElement).closest("[data-zen-target]");
      if (!targetEl) return;

      // Hit the target
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
      audioManager.zenTap();
      haptic.light();

      // Ripple at tap position
      const rect = el.getBoundingClientRect();
      setRipple({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
        key: keyRef.current,
      });
      setTimeout(() => setRipple(null), 800);

      setTarget(null);
      // Next target after a calm pause
      spawnTimer.current = setTimeout(() => spawnTarget(), 1500 + Math.random() * 1500);
    };

    el.addEventListener("pointerdown", handler, { capture: true, passive: false });
    return () => el.removeEventListener("pointerdown", handler, true);
  }, [phase, spawnTarget]);

  if (phase !== "playing") return null;

  return (
    <div ref={zoneRef} className="fixed inset-0" style={{ touchAction: "none" }}>
      {/* Soft overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-indigo-950/30 to-space-900/50 pointer-events-none" />

      {/* Zen label */}
      <div className="fixed top-16 left-0 right-0 text-center pointer-events-none">
        <div className="text-sm text-indigo-300/30 uppercase tracking-[0.4em]">Zen</div>
      </div>

      {/* Ripple */}
      <AnimatePresence>
        {ripple && (
          <motion.div
            key={ripple.key}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 3, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute w-24 h-24 rounded-full pointer-events-none"
            style={{
              left: `${ripple.x}%`,
              top: `${ripple.y}%`,
              transform: "translate(-50%, -50%)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              background: "radial-gradient(circle, rgba(99, 102, 241, 0.1), transparent)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Target */}
      <AnimatePresence>
        {target && (
          <motion.div
            key={target.key}
            data-zen-target
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.6 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute cursor-pointer"
            style={{
              left: `${target.x}%`,
              top: `${target.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div
              data-zen-target
              className="w-20 h-20 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(99, 102, 241, 0.05) 60%, transparent 70%)",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                boxShadow: "0 0 30px rgba(99, 102, 241, 0.15), inset 0 0 15px rgba(99, 102, 241, 0.08)",
              }}
            >
              <div data-zen-target className="absolute inset-0 flex items-center justify-center">
                <div
                  data-zen-target
                  className="w-2 h-2 rounded-full"
                  style={{ background: "rgba(99, 102, 241, 0.5)", boxShadow: "0 0 8px rgba(99, 102, 241, 0.4)" }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Breathing prompt */}
      <div className="fixed bottom-28 left-0 right-0 text-center pointer-events-none">
        <motion.div
          animate={{ opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="text-xs text-indigo-300/40 tracking-widest"
        >
          breathe
        </motion.div>
      </div>
    </div>
  );
}
