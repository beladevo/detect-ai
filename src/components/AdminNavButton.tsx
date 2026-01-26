"use client";

import { useRouter } from "next/navigation";
import GlowButton from "@/src/components/ui/GlowButton";

interface AdminNavButtonProps {
  href: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
  glowColor?: string;
}

export default function AdminNavButton({
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
  glowColor,
}: AdminNavButtonProps) {
  const router = useRouter();

  return (
    <GlowButton
      variant={variant}
      size={size}
      glowColor={glowColor}
      className={className}
      onClick={() => router.push(href)}
    >
      {children}
    </GlowButton>
  );
}
