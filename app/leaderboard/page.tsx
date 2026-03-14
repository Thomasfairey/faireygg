"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MODES, GameMode } from "@/lib/game/modes";
import { useProgressionStore } from "@/lib/store/progressionStore";
import { getScoreLabel } from "@/lib/game/scoring";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { useUsernameStore } from "@/lib/store/usernameStore";

const EMPTY_OBJ = {} as Record<string, never>;
const SCORED_MODES = MODES.filter((m) => !m.isZen);

interface GlobalEntry {
  username: string;
  score: number;
}

export default function LeaderboardPage() {
  const hydrated = useHydrated();
  const [activeMode, setActiveMode] = useState<GameMode>("classic");
  const [view, setView] = useState<"global" | "personal">("global");
  const [globalEntries, setGlobalEntries] = useState<GlobalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const leaderboards = useProgressionStore((s) => s.leaderboards ?? EMPTY_OBJ);
  const username = useUsernameStore((s) => s.username);

  const mode = MODES.find((m) => m.id === activeMode);
  if (!mode) return null;

  // Fetch global leaderboard
  useEffect(() => {
    if (view !== "global") return;
    setLoading(true);
    fetch(`/api/leaderboard?mode=${activeMode}`)
      .then((r) => r.json())
      .then((data) => {
        setGlobalEntries(data.entries ?? []);
        setLoading(false);
      })
      .catch(() => {
        setGlobalEntries([]);
        setLoading(false);
      });
  }, [activeMode, view]);

  const rawPersonal = leaderboards[activeMode];
  const personalEntries = Array.isArray(rawPersonal) ? rawPersonal : [];

  if (!hydrated) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="text-white/20 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-y-auto">
      <div className="min-h-full flex flex-col items-center px-5 pt-[env(safe-area-inset-top,16px)] pb-24">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-white mt-8 mb-4"
        >
          Leaderboard
        </motion.h1>

        {/* Global / Personal toggle */}
        <div className="flex gap-1 mb-4 bg-white/[0.04] rounded-xl p-1">
          <button
            onClick={() => setView("global")}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
              view === "global"
                ? "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30"
                : "text-white/30 border border-transparent"
            }`}
          >
            🌍 Global
          </button>
          <button
            onClick={() => setView("personal")}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
              view === "personal"
                ? "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30"
                : "text-white/30 border border-transparent"
            }`}
          >
            👤 Personal
          </button>
        </div>

        {/* Mode tabs */}
        <div className="relative w-full max-w-sm mb-4">
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-space-900 to-transparent z-10 pointer-events-none" />
          <div className="flex gap-1 w-full overflow-x-auto pb-2 scrollbar-hide">
            {SCORED_MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveMode(m.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                  activeMode === m.id
                    ? "border-2 text-white"
                    : "border border-white/10 text-white/30 hover:text-white/50"
                }`}
                style={
                  activeMode === m.id
                    ? {
                        borderColor: m.color,
                        color: m.color,
                        boxShadow: `0 0 12px ${m.color}30`,
                        background: `${m.color}10`,
                      }
                    : {}
                }
              >
                {m.icon} {m.name}
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard entries */}
        <div className="w-full max-w-sm">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeMode}-${view}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-2"
            >
              {view === "global" && loading && (
                <div className="text-center py-16 text-white/20 text-sm">Loading...</div>
              )}

              {view === "global" && !loading && globalEntries.length === 0 && (
                <div className="text-center py-16 text-white/20 text-sm">
                  No global scores yet. Be the first!
                </div>
              )}

              {view === "global" &&
                !loading &&
                globalEntries.map((entry, i) => (
                  <motion.div
                    key={`${entry.username}-${i}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] ${
                      entry.username === username ? "border-neon-cyan/20 bg-neon-cyan/[0.03]" : ""
                    } ${i === 0 ? mode.glowClass : ""}`}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{
                        background:
                          i === 0 ? `${mode.color}30` : i === 1 ? "rgba(255,255,255,0.08)" : i === 2 ? "rgba(255,255,255,0.05)" : "transparent",
                        color: i === 0 ? mode.color : i < 3 ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)",
                      }}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`font-bold text-sm truncate ${entry.username === username ? "text-neon-cyan" : "text-white/70"}`}
                      >
                        {entry.username}
                        {entry.username === username && (
                          <span className="text-[9px] text-neon-cyan/50 ml-1.5">you</span>
                        )}
                      </div>
                    </div>
                    <div
                      className="font-bold tabular-nums text-sm flex-shrink-0"
                      style={{ color: i === 0 ? mode.color : "rgba(255,255,255,0.5)" }}
                    >
                      {getScoreLabel(entry.score, activeMode)}
                    </div>
                  </motion.div>
                ))}

              {view === "personal" && personalEntries.length === 0 && (
                <div className="text-center py-16 text-white/20 text-sm">
                  No records yet. Play {mode.name} to set your first!
                </div>
              )}

              {view === "personal" &&
                personalEntries.map((entry, i) => (
                  <motion.div
                    key={`${entry.date}-${i}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] ${i === 0 ? mode.glowClass : ""}`}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{
                        background:
                          i === 0 ? `${mode.color}30` : i === 1 ? "rgba(255,255,255,0.08)" : i === 2 ? "rgba(255,255,255,0.05)" : "transparent",
                        color: i === 0 ? mode.color : i < 3 ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)",
                      }}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold tabular-nums" style={{ color: i === 0 ? mode.color : "rgba(255,255,255,0.7)" }}>
                        {getScoreLabel(entry.score, activeMode)}
                      </div>
                    </div>
                    <div className="text-xs text-white/20 tabular-nums">
                      {new Date(entry.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </div>
                  </motion.div>
                ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
