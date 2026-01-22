"use client";

import React from "react";
import { motion } from "framer-motion";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: "purple" | "cyan" | "pink" | "emerald" | "none";
  animate?: boolean;
  variant?: "default" | "glowing";
}

export default function GlassCard({
  children,
  className = "",
  hover = true,
  glow = "purple",
  animate = true,
  variant = "default",
}: GlassCardProps) {
  const glowColors = {
    purple: "hover:shadow-[0_0_60px_rgba(255,122,61,0.18)]",
    cyan: "hover:shadow-[0_0_60px_rgba(43,182,173,0.18)]",
    pink: "hover:shadow-[0_0_60px_rgba(241,183,93,0.18)]",
    emerald: "hover:shadow-[0_0_60px_rgba(164,232,207,0.18)]",
    none: "",
  };

  const glowBorder = {
    purple: "hover:border-purple-500/30",
    cyan: "hover:border-cyan-500/30",
    pink: "hover:border-pink-500/30",
    emerald: "hover:border-emerald-500/30",
    none: "",
  };

  const baseClasses = `
    relative overflow-hidden
    rounded-3xl
    border border-border
    bg-gradient-to-br from-card/80 via-card/40 to-transparent
    backdrop-blur-xl
    shadow-2xl
    transition-all duration-500 ease-out
    ${hover ? glowColors[glow] : ""}
    ${hover ? glowBorder[glow] : ""}
    ${variant === "glowing" ? "shadow-[0_0_50px_rgba(255,122,61,0.12)] border-brand-purple/20" : ""}
  `;

  const content = (
    <>
      {/* Glass shine effect */}
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl opacity-20 dark:opacity-100"
        style={{
          background: "linear-gradient(135deg, var(--border) 0%, transparent 50%, transparent 100%)",
        }}
      />

      {/* Top edge highlight */}
      <div
        className="pointer-events-none absolute left-[10%] right-[10%] top-0 h-px transition-opacity"
        style={{
          background: "linear-gradient(90deg, transparent, var(--border), transparent)",
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </>
  );

  if (animate && hover) {
    return (
      <motion.div
        className={`${baseClasses} ${className}`}
        whileHover={{ y: -4, scale: 1.01 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {content}
      </motion.div>
    );
  }

  return <div className={`${baseClasses} ${className}`}>{content}</div>;
}
