"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  hue: number;
}

export default function StarfieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let paused = false;
    let cachedW = window.innerWidth;
    let cachedH = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;

    function resize() {
      if (!canvas) return;
      cachedW = window.innerWidth;
      cachedH = window.innerHeight;
      canvas.width = cachedW * dpr;
      canvas.height = cachedH * dpr;
      canvas.style.width = `${cachedW}px`;
      canvas.style.height = `${cachedH}px`;
      // Use setTransform to avoid accumulating scale on resize
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    window.addEventListener("resize", resize);

    // Pause when tab is hidden to save battery
    function handleVisibility() {
      paused = document.hidden;
      if (!paused) {
        lastTime = performance.now();
        animId = requestAnimationFrame(draw);
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);

    const STAR_COUNT = 200;
    const stars: Star[] = [];

    for (let i = 0; i < STAR_COUNT; i++) {
      const z = Math.random();
      stars.push({
        x: Math.random() * cachedW,
        y: Math.random() * cachedH,
        z,
        vx: (Math.random() - 0.5) * 0.15,
        vy: 0.05 + z * 0.2,
        size: 0.5 + z * 2,
        opacity: 0.3 + z * 0.7,
        hue: Math.random() > 0.85 ? (Math.random() > 0.5 ? 180 : 300) : 0,
      });
    }

    let lastTime = performance.now();

    function draw(time: number) {
      if (paused) return;

      const dt = Math.min((time - lastTime) / 16.67, 3);
      lastTime = time;

      ctx!.clearRect(0, 0, cachedW, cachedH);

      for (const star of stars) {
        star.x += star.vx * dt;
        star.y += star.vy * dt;

        if (star.y > cachedH + 5) {
          star.y = -5;
          star.x = Math.random() * cachedW;
        }
        if (star.x < -5) star.x = cachedW + 5;
        if (star.x > cachedW + 5) star.x = -5;

        const twinkle = 0.7 + 0.3 * Math.sin(time * 0.002 + star.x * 0.01);
        const alpha = star.opacity * twinkle;

        ctx!.beginPath();
        ctx!.arc(star.x, star.y, star.size, 0, Math.PI * 2);

        if (star.hue > 0) {
          ctx!.fillStyle = `hsla(${star.hue}, 100%, 75%, ${alpha})`;
        } else {
          ctx!.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        }

        ctx!.fill();

        if (star.size > 1.5) {
          ctx!.beginPath();
          ctx!.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
          if (star.hue > 0) {
            ctx!.fillStyle = `hsla(${star.hue}, 100%, 75%, ${alpha * 0.08})`;
          } else {
            ctx!.fillStyle = `rgba(255, 255, 255, ${alpha * 0.08})`;
          }
          ctx!.fill();
        }
      }

      animId = requestAnimationFrame(draw);
    }

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
