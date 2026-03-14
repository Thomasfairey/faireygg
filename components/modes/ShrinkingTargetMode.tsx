"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { audioManager } from "@/lib/audio/AudioManager";
import { haptic } from "@/lib/haptics";

interface ShrinkingTargetModeProps {
  onComplete: (score: number) => void;
  phase: string;
}

const INITIAL_SIZE = 140;
const MIN_SIZE = 20;
const SHRINK_SPEED = 35; // px per second base
const SPEED_INCREMENT = 3; // additional px/s per hit

export default function ShrinkingTargetMode({ onComplete, phase }: ShrinkingTargetModeProps) {
  const [size, setSize] = useState(INITIAL_SIZE);
  const [hits, setHits] = useState(0);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [shake, setShake] = useState(false);
  const animRef = useRef<number>(0);
  const sizeRef = useRef(INITIAL_SIZE);
  const speedRef = useRef(SHRINK_SPEED);
  const lastTimeRef = useRef(0);
  const hitsRef = useRef(0);

  const randomPosition = useCallback(() => {
    return {
      x: 15 + Math.random() * 70, // % from left
      y: 20 + Math.random() * 50, // % from top
    };
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;

    sizeRef.current = INITIAL_SIZE;
    speedRef.current = SHRINK_SPEED;
    hitsRef.current = 0;
    setSize(INITIAL_SIZE);
    setHits(0);
    setPosition(randomPosition());
    lastTimeRef.current = performance.now();

    function tick(time: number) {
      const dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      sizeRef.current -= speedRef.current * dt;
      setSize(Math.max(sizeRef.current, 0));

      if (sizeRef.current <= 0) {
        onComplete(hitsRef.current);
        return;
      }

      animRef.current = requestAnimationFrame(tick);
    }

    animRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animRef.current);
  }, [phase, randomPosition, onComplete]);

  const handleHit = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      e.preventDefault();

      if (phase !== "playing") return;

      hitsRef.current += 1;
      setHits(hitsRef.current);

      // Reset size with slight reduction
      const newSize = Math.max(INITIAL_SIZE - hitsRef.current * 5, MIN_SIZE + 20);
      sizeRef.current = newSize;
      setSize(newSize);

      // Increase speed
      speedRef.current = SHRINK_SPEED + hitsRef.current * SPEED_INCREMENT;

      // New position
      setPosition(randomPosition());

      audioManager.tapSuccess();
      haptic.light();
    },
    [phase, randomPosition]
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
          ? { x: [0, -10, 10, -6, 6, 0], transition: { duration: 0.4 } }
          : { x: 0 }
      }
      className="fixed inset-0"
      onMouseDown={handleMiss}
      onTouchStart={(e) => {
        e.preventDefault();
        handleMiss();
      }}
    >
      {/* Score */}
      <div className="fixed top-16 left-0 right-0 text-center z-10">
        <div className="text-sm text-white/40 uppercase tracking-widest">Hits</div>
        <div className="text-4xl font-bold text-neon-green text-glow-green tabular-nums">
          {hits}
        </div>
      </div>

      {/* Target */}
      <motion.div
        animate={{
          left: `${position.x}%`,
          top: `${position.y}%`,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="absolute"
        style={{
          transform: "translate(-50%, -50%)",
        }}
        onMouseDown={handleHit}
        onTouchStart={handleHit}
      >
        <div
          className="rounded-full cursor-pointer relative"
          style={{
            width: size,
            height: size,
            background: `radial-gradient(circle, #00ff8840 0%, #00ff8810 60%, transparent 70%)`,
            border: `2px solid #00ff8880`,
            boxShadow: `0 0 ${size / 3}px #00ff8840, inset 0 0 ${size / 4}px #00ff8820`,
            transition: "width 0.05s linear, height 0.05s linear",
          }}
        >
          {/* Crosshair */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[2px] h-1/2 bg-neon-green/30" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-[2px] w-1/2 bg-neon-green/30" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
