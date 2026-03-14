"use client";

import { useEffect, useRef } from "react";
import type { Particle } from "@/lib/hooks/useGameEffects";

interface ParticleBurstProps {
  particlesRef: React.RefObject<Particle[]>;
  subscribe: (fn: () => void) => () => void;
}

export default function ParticleBurst({ particlesRef, subscribe }: ParticleBurstProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const activeRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    let w = window.innerWidth;
    let h = window.innerHeight;

    function resize() {
      if (!canvas) return;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    let lastTime = 0;

    function draw(time: number) {
      const particles = particlesRef.current;
      if (!particles || particles.length === 0) {
        activeRef.current = false;
        ctx!.clearRect(0, 0, w, h);
        return;
      }

      const dt = lastTime ? (time - lastTime) / 1000 : 0.016;
      lastTime = time;

      ctx!.clearRect(0, 0, w, h);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += dt;
        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        const progress = p.life / p.maxLife;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 200 * dt; // gravity
        p.vx *= 0.98;
        p.opacity = 1 - progress * progress;

        const currentSize = p.size * (1 - progress * 0.5);

        ctx!.globalAlpha = p.opacity;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
        ctx!.fillStyle = p.color;
        ctx!.fill();

        // Glow
        if (currentSize > 1.5) {
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, currentSize * 2.5, 0, Math.PI * 2);
          ctx!.fillStyle = p.color;
          ctx!.globalAlpha = p.opacity * 0.15;
          ctx!.fill();
        }
      }

      ctx!.globalAlpha = 1;

      if (particles.length > 0) {
        animRef.current = requestAnimationFrame(draw);
      } else {
        activeRef.current = false;
      }
    }

    // Start animation when new particles added
    const unsub = subscribe(() => {
      if (!activeRef.current && particlesRef.current && particlesRef.current.length > 0) {
        activeRef.current = true;
        lastTime = 0;
        animRef.current = requestAnimationFrame(draw);
      }
    });

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      unsub();
    };
  }, [particlesRef, subscribe]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 55 }}
    />
  );
}
