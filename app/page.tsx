"use client";

import { useState, useRef, useCallback } from "react";

type GameState = "idle" | "waiting" | "ready" | "result" | "too-early";

export default function Home() {
  const [state, setState] = useState<GameState>("idle");
  const [reactionTime, setReactionTime] = useState<number>(0);
  const [results, setResults] = useState<number[]>([]);
  const readyAt = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const best = results.length > 0 ? Math.min(...results) : null;
  const average =
    results.length > 0
      ? Math.round(results.reduce((a, b) => a + b, 0) / results.length)
      : null;

  const startWaiting = useCallback(() => {
    setState("waiting");
    const delay = 1500 + Math.random() * 3500; // 1.5–5s
    timeoutRef.current = setTimeout(() => {
      readyAt.current = performance.now();
      setState("ready");
    }, delay);
  }, []);

  const handleTap = useCallback(() => {
    switch (state) {
      case "idle":
        startWaiting();
        break;

      case "waiting":
        // tapped too early
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setState("too-early");
        break;

      case "ready": {
        const ms = Math.round(performance.now() - readyAt.current);
        setReactionTime(ms);
        setResults((prev) => [...prev, ms]);
        setState("result");
        break;
      }

      case "result":
      case "too-early":
        startWaiting();
        break;
    }
  }, [state, startWaiting]);

  const bgColor = {
    idle: "bg-blue-600",
    waiting: "bg-red-600",
    ready: "bg-green-500",
    result: "bg-blue-600",
    "too-early": "bg-orange-500",
  }[state];

  return (
    <div
      className={`fixed inset-0 ${bgColor} transition-colors duration-150 flex flex-col items-center justify-center cursor-pointer`}
      onMouseDown={handleTap}
      onTouchStart={(e) => {
        e.preventDefault();
        handleTap();
      }}
    >
      <div className="flex flex-col items-center gap-4 px-8 text-center text-white">
        {state === "idle" && (
          <>
            <h1 className="text-4xl font-bold tracking-tight">Reaction Time</h1>
            <p className="text-xl opacity-80">
              When the screen turns green, tap as fast as you can.
            </p>
            <p className="text-lg opacity-60 mt-4">Tap to start</p>
          </>
        )}

        {state === "waiting" && (
          <>
            <div className="text-6xl font-bold">Wait...</div>
            <p className="text-xl opacity-70">Tap when the screen turns green</p>
          </>
        )}

        {state === "ready" && (
          <>
            <div className="text-6xl font-bold">TAP!</div>
          </>
        )}

        {state === "too-early" && (
          <>
            <div className="text-5xl font-bold">Too early!</div>
            <p className="text-xl opacity-80 mt-2">Tap to try again</p>
          </>
        )}

        {state === "result" && (
          <>
            <div className="text-7xl font-bold tabular-nums">
              {reactionTime}<span className="text-3xl ml-1">ms</span>
            </div>
            <p className="text-xl opacity-80 mt-2">
              {reactionTime < 200
                ? "Incredible!"
                : reactionTime < 250
                  ? "Great!"
                  : reactionTime < 350
                    ? "Nice"
                    : "Keep trying"}
            </p>

            {results.length > 0 && (
              <div className="flex gap-8 mt-6 text-lg opacity-70">
                <div>
                  <div className="text-sm uppercase tracking-wider opacity-60">Best</div>
                  <div className="font-bold tabular-nums">{best}ms</div>
                </div>
                <div>
                  <div className="text-sm uppercase tracking-wider opacity-60">Avg</div>
                  <div className="font-bold tabular-nums">{average}ms</div>
                </div>
                <div>
                  <div className="text-sm uppercase tracking-wider opacity-60">Tries</div>
                  <div className="font-bold tabular-nums">{results.length}</div>
                </div>
              </div>
            )}

            <p className="text-lg opacity-50 mt-6">Tap to go again</p>
          </>
        )}
      </div>
    </div>
  );
}
