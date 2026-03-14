"use client";

import { motion } from "framer-motion";
import { audioManager } from "@/lib/audio/AudioManager";
import { haptic } from "@/lib/haptics";

interface GlowButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  color?: string;
  glowClass?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

export default function GlowButton({
  children,
  onClick,
  color = "#00f0ff",
  glowClass = "box-glow-cyan",
  className = "",
  size = "md",
  disabled = false,
}: GlowButtonProps) {
  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={() => {
        if (disabled) return;
        audioManager.uiClick();
        haptic.light();
        onClick?.();
      }}
      disabled={disabled}
      className={`
        relative rounded-xl font-bold tracking-wider uppercase
        border border-white/10 backdrop-blur-sm
        ${sizeClasses[size]}
        ${glowClass}
        ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
        ${className}
      `}
      style={{
        background: `linear-gradient(135deg, ${color}15, ${color}08)`,
        color,
      }}
    >
      {children}
    </motion.button>
  );
}
