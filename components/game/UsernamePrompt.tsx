"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useUsernameStore } from "@/lib/store/usernameStore";

interface UsernamePromptProps {
  onComplete: (username: string) => void;
}

export default function UsernamePrompt({ onComplete }: UsernamePromptProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const setUsername = useUsernameStore((s) => s.setUsername);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    const sanitized = value
      .trim()
      .replace(/[\u200B-\u200D\uFEFF\u202A-\u202E\u2066-\u2069]/g, "")
      .replace(/[\u0300-\u036F]/g, "")
      .replace(/[<>"'&\\|]/g, "")
      .slice(0, 20);
    if (sanitized.length < 2) return;
    setUsername(sanitized);
    onComplete(sanitized);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-space-900/95 backdrop-blur-lg">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="flex flex-col items-center gap-5 px-8 max-w-xs w-full"
      >
        <div className="text-lg font-bold text-white">Enter your callsign</div>
        <div className="text-xs text-white/30 text-center">
          This will appear on the global leaderboard
        </div>

        <input
          ref={inputRef}
          type="text"
          maxLength={20}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          placeholder="Callsign..."
          className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-white/10 text-white text-center text-base font-bold placeholder:text-white/15 focus:outline-none focus:border-neon-cyan/40 focus:ring-1 focus:ring-neon-cyan/20"
          style={{ userSelect: "text", WebkitUserSelect: "text" }}
        />

        <button
          onClick={handleSubmit}
          disabled={value.trim().length < 2}
          className={`w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wider cursor-pointer transition-all ${
            value.trim().length >= 2
              ? "bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/20"
              : "bg-white/[0.03] border border-white/[0.06] text-white/20 cursor-not-allowed"
          }`}
        >
          Lock In
        </button>

        <div className="text-[9px] text-white/15">2–20 characters</div>
      </motion.div>
    </div>
  );
}
