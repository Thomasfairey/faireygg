"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { FlashData } from "@/lib/hooks/useGameEffects";

interface ScreenFlashProps {
  flashRef: React.RefObject<FlashData | null>;
  subscribe: (fn: () => void) => () => void;
}

export default function ScreenFlash({ flashRef, subscribe }: ScreenFlashProps) {
  const [flash, setFlash] = useState<FlashData | null>(null);

  useEffect(() => {
    return subscribe(() => {
      setFlash(flashRef.current);
    });
  }, [flashRef, subscribe]);

  return (
    <AnimatePresence>
      {flash && (
        <motion.div
          key={flash.id}
          initial={{ opacity: 0.35 }}
          animate={{ opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed inset-0 pointer-events-none"
          style={{
            zIndex: 56,
            background: flash.type === "success"
              ? "radial-gradient(ellipse at center, rgba(0,240,255,0.15), transparent 70%)"
              : "radial-gradient(ellipse at center, transparent 30%, rgba(255,51,85,0.25) 100%)",
          }}
        />
      )}
    </AnimatePresence>
  );
}
