"use client";

import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
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

  // Hide navbar on game screens
  if (pathname.startsWith("/play/")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center justify-around bg-space-900/80 backdrop-blur-xl border-t border-white/[0.06] px-2 pb-[env(safe-area-inset-bottom)] pt-1">
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
                className="relative flex flex-col items-center gap-0.5 py-2 px-6 cursor-pointer"
              >
                <span className="text-lg">{tab.icon}</span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    isActive ? "text-neon-cyan" : "text-white/30"
                  }`}
                >
                  {tab.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -bottom-1 left-3 right-3 h-[2px] bg-neon-cyan rounded-full"
                    style={{
                      boxShadow: "0 0 8px #00f0ff, 0 0 16px #00f0ff",
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
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
