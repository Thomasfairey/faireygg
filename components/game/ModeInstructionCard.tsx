"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ModeDefinition } from "@/lib/game/modes";

const INSTRUCTIONS: Record<string, string> = {
  classic: "Tap when the screen turns green",
  "speed-round": "Tap 5 times as fast as you can",
  sequence: "Watch the pattern, then repeat it",
  "shrinking-target": "Tap the target before it vanishes",
  "aim-trainer": "Tap 20 targets as fast as you can",
  zen: "No score. Just breathe and tap",
  inhibition: "Tap green signals. Ignore red ones.",
};

interface ModeInstructionCardProps {
  mode: ModeDefinition;
  onDismiss: () => void;
}

export default function ModeInstructionCard({ mode, onDismiss }: ModeInstructionCardProps) {
  const zoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = zoneRef.current;
    if (!el) return;
    const handler = (e: PointerEvent) => {
      e.preventDefault();
      onDismiss();
    };
    // Small delay to prevent accidental instant dismissal
    const t = setTimeout(() => {
      el.addEventListener("pointerdown", handler, { capture: true, passive: false, once: true });
    }, 300);
    return () => {
      clearTimeout(t);
      el.removeEventListener("pointerdown", handler, true);
    };
  }, [onDismiss]);

  return (
    <div
      ref={zoneRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-space-900/95 backdrop-blur-lg cursor-pointer"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="flex flex-col items-center gap-6 px-8 max-w-xs text-center"
      >
        {/* Mode icon */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{
            background: `${mode.color}15`,
            border: `2px solid ${mode.color}30`,
            boxShadow: `0 0 30px ${mode.color}20`,
          }}
        >
          <span className="text-4xl">{mode.icon}</span>
        </motion.div>

        {/* Mode name */}
        <div className="font-bold text-xl" style={{ color: mode.color }}>
          {mode.name}
        </div>

        {/* Instruction */}
        <div className="text-white/60 text-base leading-relaxed">
          {INSTRUCTIONS[mode.id] ?? mode.description}
        </div>

        {/* Tap prompt */}
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-white/25 text-xs uppercase tracking-widest mt-4"
        >
          Tap to start
        </motion.div>
      </motion.div>
    </div>
  );
}
