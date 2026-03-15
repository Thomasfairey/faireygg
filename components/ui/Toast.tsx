"use client";

import { motion, AnimatePresence } from "framer-motion";

interface ToastProps {
  message: string | null;
}

export default function Toast({ message }: ToastProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="fixed bottom-28 left-1/2 z-[100] -translate-x-1/2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/15 text-white/80 text-sm font-bold shadow-lg"
          style={{
            boxShadow: "0 0 20px rgba(0, 240, 255, 0.15), 0 4px 20px rgba(0, 0, 0, 0.3)",
          }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
