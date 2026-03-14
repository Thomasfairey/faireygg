"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { audioManager } from "@/lib/audio/AudioManager";
import { haptic } from "@/lib/haptics";

interface SequenceModeProps {
  onComplete: (score: number) => void;
  phase: string;
}

const GRID_SIZE = 4;
const PANEL_COLORS = ["#00f0ff", "#ff00e5", "#00ff88", "#ffaa00"];
const INITIAL_LENGTH = 3;

export default function SequenceMode({ onComplete, phase }: SequenceModeProps) {
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [showingSequence, setShowingSequence] = useState(true);
  const [activePanel, setActivePanel] = useState<number | null>(null);
  const [flashPanel, setFlashPanel] = useState<number | null>(null);
  const [level, setLevel] = useState(0);
  const [shake, setShake] = useState(false);
  const abortRef = useRef(false);
  const completedRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const addTimer = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  const generateSequence = useCallback((length: number) => {
    const seq: number[] = [];
    for (let i = 0; i < length; i++) {
      seq.push(Math.floor(Math.random() * GRID_SIZE));
    }
    return seq;
  }, []);

  const showSequence = useCallback(
    async (seq: number[], abortSignal: { aborted: boolean }) => {
      setShowingSequence(true);
      setPlayerIndex(0);

      await new Promise((r) => { addTimer(r as () => void, 500); });
      if (abortSignal.aborted) return;

      for (let i = 0; i < seq.length; i++) {
        if (abortSignal.aborted) return;
        setActivePanel(seq[i]);
        audioManager.sequenceTone(seq[i]);
        await new Promise((r) => { addTimer(r as () => void, 500); });
        if (abortSignal.aborted) return;
        setActivePanel(null);
        await new Promise((r) => { addTimer(r as () => void, 200); });
      }

      if (!abortSignal.aborted) {
        setShowingSequence(false);
      }
    },
    [addTimer]
  );

  useEffect(() => {
    if (phase === "playing") {
      clearTimers();
      abortRef.current = false;
      completedRef.current = false;
      const seq = generateSequence(INITIAL_LENGTH);
      setSequence(seq);
      setLevel(INITIAL_LENGTH);
      const signal = { aborted: false };
      showSequence(seq, signal);

      return () => {
        signal.aborted = true;
        abortRef.current = true;
        clearTimers();
      };
    }
  }, [phase, generateSequence, showSequence, clearTimers]);

  const handlePanelTap = useCallback(
    (panelIndex: number) => {
      if (phase !== "playing" || showingSequence || completedRef.current) return;

      setFlashPanel(panelIndex);
      addTimer(() => setFlashPanel(null), 150);
      audioManager.sequenceTone(panelIndex);

      if (panelIndex === sequence[playerIndex]) {
        haptic.light();
        const nextIndex = playerIndex + 1;
        setPlayerIndex(nextIndex);

        if (nextIndex >= sequence.length) {
          haptic.success();
          const newSeq = [...sequence, Math.floor(Math.random() * GRID_SIZE)];
          setSequence(newSeq);
          setLevel(newSeq.length);
          setShowingSequence(true); // lock input immediately
          const signal = { aborted: false };
          addTimer(() => {
            if (!abortRef.current) showSequence(newSeq, signal);
          }, 600);
        }
      } else {
        haptic.error();
        audioManager.tapFail();
        setShake(true);
        addTimer(() => setShake(false), 400);
        completedRef.current = true;
        addTimer(() => onCompleteRef.current(level - 1), 600);
      }
    },
    [phase, showingSequence, sequence, playerIndex, level, showSequence, addTimer]
  );

  if (phase !== "playing") return null;

  return (
    <motion.div
      animate={
        shake
          ? { x: [0, -10, 10, -6, 6, 0], transition: { duration: 0.4 } }
          : { x: 0 }
      }
      className="fixed inset-0 flex flex-col items-center justify-center gap-6"
    >
      <div className="text-center">
        <div className="text-sm text-white/40 uppercase tracking-widest">Level</div>
        <div className="text-3xl font-bold text-neon-purple text-glow-purple tabular-nums">
          {level - INITIAL_LENGTH + 1}
        </div>
      </div>

      {showingSequence && (
        <div className="text-sm text-white/40 animate-pulse">Watch the pattern...</div>
      )}
      {!showingSequence && (
        <div className="text-sm text-neon-purple/60">Your turn</div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 w-64">
        {Array.from({ length: GRID_SIZE }).map((_, i) => {
          const isActive = activePanel === i || flashPanel === i;
          const color = PANEL_COLORS[i];
          return (
            <motion.button
              key={i}
              whileTap={!showingSequence ? { scale: 0.95 } : {}}
              animate={{
                opacity: isActive ? 1 : 0.3,
                scale: isActive ? 1.05 : 1,
              }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              onClick={() => handlePanelTap(i)}
              disabled={showingSequence}
              className="aspect-square rounded-2xl border-2 cursor-pointer"
              style={{
                backgroundColor: isActive ? `${color}30` : `${color}08`,
                borderColor: isActive ? color : `${color}30`,
                boxShadow: isActive ? `0 0 30px ${color}60, inset 0 0 20px ${color}20` : "none",
              }}
            />
          );
        })}
      </div>

      {/* Progress dots */}
      {!showingSequence && (
        <div className="flex gap-2 mt-2">
          {sequence.map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                background: i < playerIndex ? "#a855f7" : "rgba(255,255,255,0.15)",
                boxShadow: i < playerIndex ? "0 0 6px #a855f7" : "none",
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
