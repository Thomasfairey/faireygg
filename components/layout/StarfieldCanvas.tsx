"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  z: number; // depth 0-1
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  hue: number; // 0 = white, others = tinted
}

export default function StarfieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const dpr = window.devicePixelRatio || 1;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx!.scale(dpr, dpr);
    }

    resize();
    window.addEventListener("resize", resize);

    // Create stars
    const STAR_COUNT = 200;
    const stars: Star[] = [];
    const w = () => window.innerWidth;
    const h = () => window.innerHeight;

    for (let i = 0; i < STAR_COUNT; i++) {
      const z = Math.random();
      stars.push({
        x: Math.random() * w(),
        y: Math.random() * h(),
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
      const dt = Math.min((time - lastTime) / 16.67, 3); // normalize to ~60fps
      lastTime = time;

      ctx!.clearRect(0, 0, w(), h());

      for (const star of stars) {
        star.x += star.vx * dt;
        star.y += star.vy * dt;

        // Wrap around
        if (star.y > h() + 5) {
          star.y = -5;
          star.x = Math.random() * w();
        }
        if (star.x < -5) star.x = w() + 5;
        if (star.x > w() + 5) star.x = -5;

        // Twinkle
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

        // Glow for larger stars
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
