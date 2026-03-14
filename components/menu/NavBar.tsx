"use client";

import { usePathname, useRouter } from "next/navigation";
import { audioManager } from "@/lib/audio/AudioManager";
import { haptic } from "@/lib/haptics";

const tabs = [
  { path: "/", label: "Play", icon: "▶" },
  { path: "/stats", label: "Stats", icon: "📊" },
  { path: "/leaderboard", label: "Records", icon: "🏆" },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname.startsWith("/play/")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center justify-around bg-space-900/90 backdrop-blur-xl border-t border-white/[0.06] px-2 pt-1" style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}>
          {tabs.map((tab) => {
            const isActive = pathname === tab.path;
            return (
              <button
                key={tab.path}
                onClick={() => {
                  if (!isActive) {
                    audioManager.uiClick();
                    haptic.light();
                    router.push(tab.path);
                  }
                }}
                className={`relative flex flex-col items-center gap-0.5 py-2 px-6 cursor-pointer rounded-xl transition-colors ${
                  isActive ? "bg-white/[0.05]" : ""
                }`}
              >
                <span className={`text-lg ${isActive ? "" : "opacity-40"}`}>{tab.icon}</span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    isActive ? "text-neon-cyan" : "text-white/25"
                  }`}
                >
                  {tab.label}
                </span>
                {/* Simple CSS indicator — no layoutId to avoid framer-motion crash */}
                {isActive && (
                  <div
                    className="absolute -bottom-0.5 left-4 right-4 h-[2px] bg-neon-cyan rounded-full transition-all"
                    style={{ boxShadow: "0 0 8px #00f0ff, 0 0 16px #00f0ff" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
