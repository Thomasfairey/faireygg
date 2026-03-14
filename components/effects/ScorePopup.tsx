"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ScorePopupData } from "@/lib/hooks/useGameEffects";

interface ScorePopupProps {
  popupsRef: React.RefObject<ScorePopupData[]>;
  subscribe: (fn: () => void) => () => void;
}

export default function ScorePopup({ popupsRef, subscribe }: ScorePopupProps) {
  const [popups, setPopups] = useState<ScorePopupData[]>([]);

  useEffect(() => {
    return subscribe(() => {
      setPopups([...(popupsRef.current ?? [])]);
    });
  }, [popupsRef, subscribe]);

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 57 }}>
      <AnimatePresence>
        {popups.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, y: 0, scale: 0.8 }}
            animate={{ opacity: 0, y: -50, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute font-bold text-sm tabular-nums pointer-events-none"
            style={{
              left: `${p.x}px`,
              top: `${p.y}px`,
              color: p.color,
              textShadow: `0 0 8px ${p.color}, 0 0 16px ${p.color}`,
              transform: "translate(-50%, -100%)",
            }}
          >
            {p.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
