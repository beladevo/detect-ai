"use client";

import React from "react";
import { motion } from "framer-motion";

interface GlowButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  glowColor?: string;
  disabled?: boolean;
  type?: "button" | "submit";
}

export default function GlowButton({
  children,
  onClick,
  className = "",
  variant = "primary",
  size = "md",
  glowColor = "var(--brand-purple)",
  disabled = false,
  type = "button",
}: GlowButtonProps) {
  const sizeClasses = {
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base",
  };

  const baseClasses = `
    relative overflow-hidden rounded-2xl font-semibold
    transition-all duration-300 ease-out
    disabled:opacity-50 disabled:cursor-not-allowed
    ${sizeClasses[size]}
  `;

  const variantClasses = {
    primary: `
      bg-foreground text-background
      hover:bg-opacity-90
      shadow-[0_0_20px_rgba(255,122,61,0.25)]
      hover:shadow-[0_0_40px_rgba(255,122,61,0.4)]
    `,
    secondary: `
      bg-card/20 text-foreground border border-border
      backdrop-blur-sm
      hover:bg-card/40 hover:border-border/60
      shadow-[0_0_16px_rgba(255,122,61,0.12)]
      hover:shadow-[0_0_24px_rgba(255,122,61,0.24)]
    `,
    ghost: `
      bg-transparent text-foreground
      hover:bg-foreground/10
    `,
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      whileHover={{ scale: disabled ? 1 : 1.02, y: disabled ? 0 : -2 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      style={{
        "--glow-color": glowColor,
      } as React.CSSProperties}
    >
      {/* Animated gradient border effect */}
      <span
        className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `linear-gradient(90deg, transparent, ${glowColor}40, transparent)`,
          animation: "shimmer 2s infinite",
        }}
      />

      {/* Shine effect on hover */}
      <span
        className="absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 hover:translate-x-full"
      />

      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
}
