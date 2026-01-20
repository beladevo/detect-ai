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
    purple: "hover:shadow-[0_0_60px_rgba(139,92,246,0.15)]",
    cyan: "hover:shadow-[0_0_60px_rgba(6,182,212,0.15)]",
    pink: "hover:shadow-[0_0_60px_rgba(236,72,153,0.15)]",
    emerald: "hover:shadow-[0_0_60px_rgba(52,211,153,0.15)]",
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
    border border-white/[0.08]
    bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-transparent
    backdrop-blur-xl
    shadow-2xl
    transition-all duration-500 ease-out
    ${hover ? glowColors[glow] : ""}
    ${hover ? glowBorder[glow] : ""}
    ${variant === "glowing" ? "shadow-[0_0_50px_rgba(139,92,246,0.1)] border-white/20" : ""}
  `;

  const content = (
    <>
      {/* Glass shine effect */}
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, transparent 100%)",
        }}
      />

      {/* Top edge highlight */}
      <div
        className="pointer-events-none absolute left-[10%] right-[10%] top-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
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
