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
  glowColor = "#8b5cf6",
  disabled = false,
  type = "button",
}: GlowButtonProps) {
  const sizeClasses = {
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base",
  };

  const baseClasses = `
    relative overflow-hidden rounded-full font-semibold
    transition-all duration-300 ease-out
    disabled:opacity-50 disabled:cursor-not-allowed
    ${sizeClasses[size]}
  `;

  const variantClasses = {
    primary: `
      bg-white text-black
      hover:bg-opacity-90
      shadow-[0_0_20px_rgba(139,92,246,0.3)]
      hover:shadow-[0_0_40px_rgba(139,92,246,0.5)]
    `,
    secondary: `
      bg-white/10 text-white border border-white/20
      backdrop-blur-sm
      hover:bg-white/20 hover:border-white/40
      shadow-[0_0_20px_rgba(139,92,246,0.15)]
      hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]
    `,
    ghost: `
      bg-transparent text-white
      hover:bg-white/10
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
