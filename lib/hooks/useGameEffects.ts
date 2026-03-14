"use client";

import { useCallback, useRef } from "react";

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface ScorePopupData {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
}

export interface FlashData {
  type: "success" | "fail";
  id: number;
}

let popupIdCounter = 0;
let flashIdCounter = 0;

export function useGameEffects() {
  const particlesRef = useRef<Particle[]>([]);
  const popupsRef = useRef<ScorePopupData[]>([]);
  const flashRef = useRef<FlashData | null>(null);
  const listenersRef = useRef<Set<() => void>>(new Set());

  const notify = useCallback(() => {
    listenersRef.current.forEach((fn) => fn());
  }, []);

  const subscribe = useCallback((fn: () => void) => {
    listenersRef.current.add(fn);
    return () => { listenersRef.current.delete(fn); };
  }, []);

  const burst = useCallback((x: number, y: number, color: string, count = 14) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 80 + Math.random() * 160;
      particlesRef.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        opacity: 1,
        color,
        life: 0,
        maxLife: 0.4 + Math.random() * 0.3,
      });
    }
    notify();
  }, [notify]);

  const popup = useCallback((x: number, y: number, text: string, color: string) => {
    const id = ++popupIdCounter;
    popupsRef.current.push({ id, x, y, text, color });
    notify();
    setTimeout(() => {
      popupsRef.current = popupsRef.current.filter((p) => p.id !== id);
      notify();
    }, 700);
  }, [notify]);

  const flash = useCallback((type: "success" | "fail") => {
    const id = ++flashIdCounter;
    flashRef.current = { type, id };
    notify();
    setTimeout(() => {
      if (flashRef.current?.id === id) {
        flashRef.current = null;
        notify();
      }
    }, 200);
  }, [notify]);

  return {
    particlesRef,
    popupsRef,
    flashRef,
    burst,
    popup,
    flash,
    subscribe,
  };
}

export type GameEffects = ReturnType<typeof useGameEffects>;
